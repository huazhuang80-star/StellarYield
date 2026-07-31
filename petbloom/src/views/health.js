/**
 * 健康档案：用药与驱虫、就诊记录、化验指标、花费、身份卡。
 *
 * 这几类记录的共同点是"平时懒得记，需要时拿不出来"。所以每一块的录入
 * 都压到 3-4 个字段，并且都会立刻反哺到别处：用药生成下次提醒、就诊
 * 推算体检到期、化验值画出趋势、身份卡直接可以给看护人或医生看。
 */

import { h, raw, esc, card, field, num, text, select, sparkline, emptyState, toast, confirmDialog } from '../ui.js';
import * as store from '../lib/store.js';
import { SPECIES } from '../data/species.js';
import { EXPENSE_CATEGORIES, summarize, insight, categoryById } from '../lib/finance.js';
import { suggestedRoutines } from '../lib/reminders.js';

const TABS = [
  { id: 'meds', name: '用药与驱虫', icon: '💊' },
  { id: 'visits', name: '就诊', icon: '🏥' },
  { id: 'labs', name: '化验指标', icon: '🧪' },
  { id: 'expenses', name: '花费', icon: '💰' },
  { id: 'id', name: '身份卡', icon: '🪪' },
];

/** 常见化验指标，用于快速录入与趋势对比。 */
const LAB_PRESETS = [
  { name: '肌酐 (CREA)', unit: 'μmol/L', hint: '肾功能；持续上升比单次超标更值得关注' },
  { name: 'SDMA', unit: 'μg/dL', hint: '比肌酐更早反映肾功能下降' },
  { name: '尿素氮 (BUN)', unit: 'mmol/L', hint: '受饮食与脱水影响，需结合肌酐看' },
  { name: '尿比重 (USG)', unit: '', hint: '肾脏浓缩能力，猫的早期肾病常先在这里体现' },
  { name: 'ALT', unit: 'U/L', hint: '肝细胞损伤指标' },
  { name: '血糖 (GLU)', unit: 'mmol/L', hint: '应激也会升高，需结合果糖胺判断' },
  { name: 'T4', unit: 'nmol/L', hint: '甲状腺；老年猫常见甲亢' },
  { name: '红细胞压积 (HCT)', unit: '%', hint: '贫血筛查' },
  { name: '体温', unit: '°C', hint: '猫犬正常约 38.0-39.2' },
];

export default {
  id: 'health',
  title: '健康档案',

  render(ctx) {
    const requested = ctx.params.get('t');
    const tab = TABS.some((t) => t.id === requested) ? requested : 'meds';
    const pet = ctx.pet;

    return h`
      <h1 class="page-title">💊 健康档案</h1>
      <p class="muted">${pet.name} · 所有记录只存在本机，可在设置里导出备份。</p>

      <div class="chips filter-chips">
        ${TABS.map((t) => raw(`<a class="chip ${tab === t.id ? 'active' : ''}" href="#health?t=${t.id}">${t.icon} ${esc(t.name)}</a>`))}
      </div>

      ${raw(({ meds: medsTab, visits: visitsTab, labs: labsTab, expenses: expensesTab, id: idTab })[tab](ctx))}
    `;
  },

  bind(root, ctx) {
    const val = (n) => root.querySelector(`[name="${n}"]`)?.value?.trim() ?? '';
    const petId = ctx.pet.id;

    root.querySelector('#add-med')?.addEventListener('click', () => {
      if (!val('medName')) return toast('先填药名或项目名', 'warn');
      store.addItem(petId, 'meds', {
        name: val('medName'),
        date: val('medDate') || store.today(),
        dose: val('medDose'),
        intervalDays: Number(val('medInterval')) || null,
        note: val('medNote'),
      });
      toast('已记录，下次到期会出现在提醒里');
      ctx.refresh();
    });

    root.querySelector('#add-visit')?.addEventListener('click', () => {
      if (!val('visitTitle')) return toast('先填这次去做了什么', 'warn');
      store.addItem(petId, 'visits', {
        title: val('visitTitle'),
        date: val('visitDate') || store.today(),
        type: val('visitType'),
        clinic: val('visitClinic'),
        diagnosis: val('visitDiagnosis'),
        cost: Number(val('visitCost')) || null,
        note: val('visitNote'),
      });
      if (Number(val('visitCost')) > 0) {
        store.addItem(petId, 'expenses', {
          date: val('visitDate') || store.today(),
          amount: Number(val('visitCost')),
          category: val('visitType') === 'checkup' ? 'checkup' : 'treat',
          note: val('visitTitle'),
        });
      }
      toast('已记录就诊');
      ctx.refresh();
    });

    root.querySelector('#add-lab')?.addEventListener('click', () => {
      if (!val('labName') || !val('labValue')) return toast('填写指标名与数值', 'warn');
      store.addItem(petId, 'labs', {
        name: val('labName'),
        date: val('labDate') || store.today(),
        value: Number(val('labValue')),
        unit: val('labUnit'),
        note: val('labNote'),
      });
      toast('已记录，两次以上会自动画趋势');
      ctx.refresh();
    });

    root.querySelector('#add-expense')?.addEventListener('click', () => {
      if (!(Number(val('expAmount')) > 0)) return toast('填一个大于 0 的金额', 'warn');
      store.addItem(petId, 'expenses', {
        date: val('expDate') || store.today(),
        amount: Number(val('expAmount')),
        category: val('expCat'),
        note: val('expNote'),
      });
      toast('已记账');
      ctx.refresh();
    });

    root.querySelector('#save-id')?.addEventListener('click', () => {
      store.updatePet(petId, {
        chipId: val('chipId'),
        color: val('color'),
        marks: val('marks'),
        vetName: val('vetName'),
        vetPhone: val('vetPhone'),
        emergencyVet: val('emergencyVet'),
        ownerPhone: val('ownerPhone'),
        insurance: val('insurance'),
        conditions: val('conditions'),
      });
      toast('身份卡已保存');
      ctx.refresh();
    });

    root.querySelector('#print-id')?.addEventListener('click', () => window.print());

    root.querySelectorAll('button[data-del]').forEach((b) =>
      b.addEventListener('click', async () => {
        const [kind, id] = b.dataset.del.split(':');
        const ok = await confirmDialog({ title: '删除这条记录？', body: '删除后无法恢复。', confirmText: '删除', danger: true });
        if (!ok) return;
        store.removeItem(petId, kind, id);
        toast('已删除', 'warn');
        ctx.refresh();
      }),
    );

    root.querySelectorAll('button[data-preset]').forEach((b) =>
      b.addEventListener('click', () => {
        const preset = suggestedRoutines(ctx.pet.species).find((r) => r.name === b.dataset.preset);
        if (!preset) return;
        root.querySelector('[name="medName"]').value = preset.name;
        root.querySelector('[name="medInterval"]').value = preset.intervalDays;
        root.querySelector('[name="medName"]').focus();
      }),
    );

    root.querySelectorAll('button[data-lab]').forEach((b) =>
      b.addEventListener('click', () => {
        const preset = LAB_PRESETS.find((p) => p.name === b.dataset.lab);
        if (!preset) return;
        root.querySelector('[name="labName"]').value = preset.name;
        root.querySelector('[name="labUnit"]').value = preset.unit;
        root.querySelector('[name="labValue"]').focus();
      }),
    );
  },
};

// ── 各标签页 ────────────────────────────────────────────────────

function medsTab(ctx) {
  const list = store.itemsFor(ctx.pet.id, 'meds');
  const presets = suggestedRoutines(ctx.pet.species);
  return (
    card(
      '记一次用药 / 驱虫',
      `<div class="chips">${presets.map((p) => `<button class="chip" data-preset="${esc(p.name)}">+ ${esc(p.name)}（每 ${p.intervalDays} 天）</button>`).join('')}</div>
       <div class="grid-2">
         ${field('名称', text('medName', '', '如：体内外驱虫 / 某某滴剂'))}
         ${field('日期', `<input type="date" name="medDate" value="${store.today()}">`)}
         ${field('剂量 / 规格', text('medDose', '', '可留空'))}
         ${field('间隔天数（周期项才填）', num('medInterval', '', { step: '1', placeholder: '如 30 / 90' }))}
       </div>
       ${field('备注', text('medNote', '', '反应、品牌、开药医院'))}
       <button class="btn primary" id="add-med">记录</button>
       <p class="muted">填了间隔天数的项目会自动出现在提醒里，不用自己记下次是什么时候。</p>`,
      { icon: '💊' },
    ) +
    (list.length
      ? card(
          `用药记录（${list.length}）`,
          `<ul class="record-list">${list
            .map(
              (m) => `<li>
                <div><b>${esc(m.name)}</b><small class="muted">${esc(m.date)}${m.dose ? ' · ' + esc(m.dose) : ''}${m.intervalDays ? ' · 每 ' + m.intervalDays + ' 天' : ''}</small>
                ${m.note ? `<small class="muted">${esc(m.note)}</small>` : ''}</div>
                <button class="btn small ghost" data-del="meds:${esc(m.id)}">删除</button>
              </li>`,
            )
            .join('')}</ul>`,
          { icon: '🗂️' },
        )
      : emptyState('还没有用药记录。先把最近一次驱虫记上，提醒就能开始工作了。'))
  );
}

function visitsTab(ctx) {
  const list = store.itemsFor(ctx.pet.id, 'visits');
  return (
    card(
      '记一次就诊',
      `<div class="grid-2">
         ${field('这次去做了什么', text('visitTitle', '', '如：年度体检 / 呕吐就诊'))}
         ${field('日期', `<input type="date" name="visitDate" value="${store.today()}">`)}
         ${field(
           '类型',
           select(
             'visitType',
             [
               { v: 'checkup', t: '体检' },
               { v: 'sick', t: '看病' },
               { v: 'vaccine', t: '免疫 / 预防' },
               { v: 'surgery', t: '手术' },
               { v: 'recheck', t: '复查' },
             ],
             'checkup',
           ),
           '选「体检」会用于推算下次体检到期',
         )}
         ${field('医院', text('visitClinic', ''))}
         ${field('诊断 / 结论', text('visitDiagnosis', ''))}
         ${field('花费（元）', num('visitCost', '', { step: '1' }), '填了会同时记入花费')}
       </div>
       ${field('医嘱与下一步', text('visitNote', '', '复查时间、用药、注意事项'))}
       <button class="btn primary" id="add-visit">记录</button>`,
      { icon: '🏥' },
    ) +
    (list.length
      ? card(
          `就诊记录（${list.length}）`,
          `<ul class="record-list">${list
            .map(
              (v) => `<li>
                <div><b>${esc(v.title)}</b><small class="muted">${esc(v.date)}${v.clinic ? ' · ' + esc(v.clinic) : ''}${v.cost ? ' · ¥' + v.cost : ''}</small>
                ${v.diagnosis ? `<small>诊断：${esc(v.diagnosis)}</small>` : ''}
                ${v.note ? `<small class="muted">${esc(v.note)}</small>` : ''}</div>
                <button class="btn small ghost" data-del="visits:${esc(v.id)}">删除</button>
              </li>`,
            )
            .join('')}</ul>
           <p class="muted">病历是你的资产。换医院或求第二意见时，一份完整的历史能省下重复检查的钱。</p>`,
          { icon: '🗂️' },
        )
      : emptyState('还没有就诊记录。'))
  );
}

function labsTab(ctx) {
  const list = store.itemsFor(ctx.pet.id, 'labs');
  const byName = new Map();
  for (const l of list) {
    if (!byName.has(l.name)) byName.set(l.name, []);
    byName.get(l.name).push(l);
  }

  return (
    card(
      '记一个化验指标',
      `<div class="chips">${LAB_PRESETS.map((p) => `<button class="chip" data-lab="${esc(p.name)}">${esc(p.name)}</button>`).join('')}</div>
       <div class="grid-3">
         ${field('指标名', text('labName', ''))}
         ${field('数值', num('labValue', '', { step: '0.01' }))}
         ${field('单位', text('labUnit', ''))}
       </div>
       <div class="grid-2">
         ${field('日期', `<input type="date" name="labDate" value="${store.today()}">`)}
         ${field('备注', text('labNote', '', '参考范围、医生解读'))}
       </div>
       <button class="btn primary" id="add-lab">记录</button>
       <p class="muted">重点不是某一次是否超标，而是趋势。肌酐从 1.4 涨到 1.9，比"仍在参考范围内"更有意义。</p>`,
      { icon: '🧪' },
    ) +
    (byName.size
      ? [...byName.entries()]
          .map(([name, rows]) => {
            const sorted = [...rows].sort((a, b) => (a.date < b.date ? -1 : 1));
            const points = sorted.map((r) => ({ date: r.date, kg: Number(r.value) }));
            const preset = LAB_PRESETS.find((p) => p.name === name);
            const latest = sorted[sorted.length - 1];
            const first = sorted[0];
            const delta = sorted.length > 1 ? latest.value - first.value : null;
            return card(
              name,
              `${points.length > 1 ? sparkline(points) : ''}
               <p><b>最新 ${latest.value}${esc(latest.unit ?? '')}</b>（${esc(latest.date)}）${
                 delta !== null ? ` · 相比首次 ${delta > 0 ? '+' : ''}${Math.round(delta * 100) / 100}` : ''
               }</p>
               ${preset ? `<p class="muted">${esc(preset.hint)}</p>` : ''}
               <ul class="record-list compact">${sorted
                 .slice()
                 .reverse()
                 .map(
                   (r) => `<li><div><b>${r.value}${esc(r.unit ?? '')}</b><small class="muted">${esc(r.date)}${r.note ? ' · ' + esc(r.note) : ''}</small></div>
                     <button class="btn small ghost" data-del="labs:${esc(r.id)}">删除</button></li>`,
                 )
                 .join('')}</ul>`,
              { icon: '📈' },
            );
          })
          .join('')
      : emptyState('还没有化验记录。下次拿到化验单，把关键的两三个指标录进来就够了。'))
  );
}

function expensesTab(ctx) {
  const list = store.itemsFor(ctx.pet.id, 'expenses');
  const sum = summarize(list, store.today());

  return (
    card(
      '记一笔',
      `<div class="grid-3">
         ${field('金额（元）', num('expAmount', '', { step: '0.01' }))}
         ${field('分类', select('expCat', EXPENSE_CATEGORIES.map((c) => ({ v: c.id, t: `${c.icon} ${c.name}` })), 'food'))}
         ${field('日期', `<input type="date" name="expDate" value="${store.today()}">`)}
       </div>
       ${field('备注', text('expNote', '', '买了什么 / 做了什么'))}
       <button class="btn primary" id="add-expense">记账</button>`,
      { icon: '💰' },
    ) +
    (sum.count
      ? card(
          '统计',
          `<div class="metrics">
             <div class="metric"><span class="metric-label">累计</span><strong>¥${sum.total}</strong></div>
             <div class="metric"><span class="metric-label">近 12 月均</span><strong>¥${sum.recentAverage}</strong></div>
             <div class="metric"><span class="metric-label">笔数</span><strong>${sum.count}</strong></div>
           </div>
           <p class="highlight">${esc(insight(sum))}</p>
           <h4>预防 / 日常 / 治疗</h4>
           <div class="bars">${sum.byGroup
             .map((g) => `<div class="bar-row"><span>${esc(g.name)}</span><div class="bar"><i style="width:${g.pct}%"></i></div><b>¥${g.amount}</b></div>`)
             .join('')}</div>
           <h4>分类明细</h4>
           <div class="bars">${sum.byCategory
             .map((c) => `<div class="bar-row"><span>${c.icon} ${esc(c.name)}</span><div class="bar"><i style="width:${c.pct}%"></i></div><b>¥${c.amount}</b></div>`)
             .join('')}</div>`,
          { icon: '📊' },
        ) +
        card(
          `明细（${list.length}）`,
          `<ul class="record-list compact">${list
            .map((e) => {
              const c = categoryById(e.category);
              return `<li><div><b>¥${e.amount} ${c.icon} ${esc(c.name)}</b><small class="muted">${esc(e.date)}${e.note ? ' · ' + esc(e.note) : ''}</small></div>
                <button class="btn small ghost" data-del="expenses:${esc(e.id)}">删除</button></li>`;
            })
            .join('')}</ul>`,
          { icon: '🧾' },
        )
      : emptyState('还没有记账。记几笔之后，你会看到钱主要花在预防还是治疗上 —— 这个比例很说明问题。'))
  );
}

function idTab(ctx) {
  const pet = ctx.pet;
  const sp = SPECIES[pet.species];
  const ageMonths = store.ageInMonths(pet);

  return (
    `<section class="id-card">
      <header>
        <span class="id-emoji">${sp.emoji}</span>
        <div><h2>${esc(pet.name)}</h2><p class="muted">${esc(sp.name)}${pet.breed ? ' · ' + esc(pet.breed) : ''} · ${esc(store.ageLabel(pet))} · ${
          pet.sex === 'male' ? '公' : pet.sex === 'female' ? '母' : '性别未填'
        } · ${pet.neutered ? '已绝育' : '未绝育'}</p></div>
      </header>
      <dl class="id-fields">
        <div><dt>体重</dt><dd>${pet.weightKg ? pet.weightKg + ' kg' : '—'}</dd></div>
        <div><dt>毛色 / 花纹</dt><dd>${esc(pet.color || '—')}</dd></div>
        <div><dt>识别特征</dt><dd>${esc(pet.marks || '—')}</dd></div>
        <div><dt>芯片号</dt><dd>${esc(pet.chipId || '—')}</dd></div>
        <div><dt>主人电话</dt><dd>${esc(pet.ownerPhone || '—')}</dd></div>
        <div><dt>常去医院</dt><dd>${esc(pet.vetName || '—')} ${esc(pet.vetPhone || '')}</dd></div>
        <div><dt>24h 急诊</dt><dd>${esc(pet.emergencyVet || '—')}</dd></div>
        <div><dt>保险</dt><dd>${esc(pet.insurance || '—')}</dd></div>
        <div class="wide"><dt>病史 / 长期用药</dt><dd>${esc(pet.conditions || '无')}</dd></div>
      </dl>
      <p class="id-foot">寄养、托运、走失张贴或急诊时可直接出示此卡。${ageMonths ? '' : '建议补上生日，年龄对用药剂量有影响。'}</p>
    </section>
    <button class="btn ghost block no-print" id="print-id">🖨️ 打印 / 存为 PDF</button>` +
    card(
      '编辑身份卡',
      `<div class="grid-2">
         ${field('毛色 / 花纹', text('color', pet.color))}
         ${field('识别特征', text('marks', pet.marks, '疤痕、断尾、异色瞳…'))}
         ${field('芯片号', text('chipId', pet.chipId))}
         ${field('主人电话', text('ownerPhone', pet.ownerPhone))}
         ${field('常去医院', text('vetName', pet.vetName))}
         ${field('医院电话', text('vetPhone', pet.vetPhone))}
         ${field('24h 急诊', text('emergencyVet', pet.emergencyVet, '医院名 + 电话'))}
         ${field('保险', text('insurance', pet.insurance, '保司 + 保单号'))}
       </div>
       ${field('病史 / 长期用药', `<textarea name="conditions" rows="2">${esc(pet.conditions ?? '')}</textarea>`)}
       <button class="btn primary" id="save-id">保存</button>
       <p class="muted">芯片没登记到你名下等于没有 —— 植入后记得在芯片平台完成登记并保持手机号最新。</p>`,
      { icon: '✏️' },
    )
  );
}
