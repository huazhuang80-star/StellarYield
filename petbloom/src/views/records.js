/** 终身档案：每日记录、体重曲线、免疫与体检、双未来预测。 */

import { h, raw, esc, card, field, num, sparkline } from '../ui.js';
import { SPECIES, breedStandard, resolveStage } from '../data/species.js';
import * as store from '../lib/store.js';
import { vaccineStatus, weightTrend } from '../lib/alerts.js';
import { CHECKUP_PANELS, SENIOR_CARE } from '../data/care.js';
import { project } from '../lib/projection.js';
import { stageForDays } from '../lib/growth.js';

export default {
  id: 'records',
  title: '档案',

  render(ctx) {
    const pet = ctx.pet;
    const sp = SPECIES[pet.species];
    const ageMonths = store.ageInMonths(pet);
    const days = store.daysBetween(pet.homecoming);
    const log = store.getLog(pet.id);
    const series = store.weightSeries(pet.id);
    const std = breedStandard(pet.species, pet.breed);
    const trend = weightTrend(store.logsFor(pet.id));
    const vac = vaccineStatus(pet, ageMonths);
    const panel = CHECKUP_PANELS[pet.species];
    const isSenior = ageMonths >= (SENIOR_CARE.startAge[pet.species] ?? Infinity);
    const stage = stageForDays(days);
    const pred = project({ ...pet.habits, speciesId: pet.species, ageMonths });
    const logs = store.logsFor(pet.id).slice(0, 14);

    return h`
      <h1 class="page-title">📋 ${pet.name} 的终身档案</h1>
      <p class="muted">${sp.name}${pet.breed ? ' · ' + pet.breed : ''} · ${store.ageLabel(pet)} · ${resolveStage(pet.species, ageMonths)?.name} · 陪伴 ${days} 天 · ${stage.emoji} ${stage.name}</p>

      ${raw(
        card(
          '今天的记录',
          h`<div class="grid-3">
              ${raw(field('体重 (kg)', num('weightKg', log.weightKg ?? '', { step: '0.01' })))}
              ${raw(field('进食 (g)', num('foodGrams', log.foodGrams ?? '', { step: '1' })))}
              ${raw(field('饮水 (ml)', num('waterMl', log.waterMl ?? '', { step: '1' })))}
            </div>
            ${raw(field('备注（异常、情绪、用药、就医）', `<textarea name="note" rows="2">${esc(log.note ?? '')}</textarea>`))}
            <button class="btn primary" id="save-log">保存今天</button>
            <p class="muted">每天 2 分钟。这些数据在需要就医的那一天，会变成医生最想看到的东西。</p>`,
          { icon: '✍️' },
        ),
      )}

      ${raw(
        card(
          '体重曲线',
          `${sparkline(series, { band: std ? { min: std.min, max: std.max } : null })}
           ${std ? `<p class="muted">浅色区间为 ${esc(pet.breed)} 的标准体重（${std.min} - ${std.max} kg）</p>` : '<p class="muted">填写品种后可显示标准区间参考</p>'}
           ${trend ? `<p class="${Math.abs(trend.pct) >= 5 ? 'highlight' : 'muted'}">近一月变化：${trend.pct > 0 ? '+' : ''}${trend.pct}%（${trend.from.date} ${trend.from.weightKg}kg → ${trend.to.date} ${trend.to.weightKg}kg）</p>` : ''}
           <p class="muted">建议每月固定同一天、同一时间称重。体重是最早、最便宜的健康预警指标。</p>`,
          { icon: '📈' },
        ),
      )}

      ${raw(
        card(
          '免疫与预防',
          `<ul class="vaccines">${vac
            .map(
              (v) => `<li class="state-${v.state}">
                <label><input type="checkbox" data-vaccine="${esc(v.id)}"${v.done ? ' checked' : ''}>
                <b>${esc(v.name)}</b></label>
                <small class="muted">${v.done ? '完成于 ' + esc(v.doneDate) : v.state === 'overdue' ? '已到建议月龄（' + v.dueMonths + ' 月），待完成' : '建议 ' + v.dueMonths + ' 月龄'}${v.recur ? ' · ' + esc(v.recur) : ''}</small>
                <small class="muted">${esc(v.note)}</small>
              </li>`,
            )
            .join('')}</ul>
           <p class="muted">免疫时间会因地区、疫苗品牌与个体健康状况调整，最终以接种医院的方案为准。</p>`,
          { icon: '💉' },
        ),
      )}

      ${panel
        ? raw(
            card(
              isSenior ? '老年期体检清单' : '年度体检清单',
              (() => {
                const p = isSenior ? panel.senior : panel.annual;
                return `<h4>必查</h4><ul class="bullets">${p.core.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
                  <h4>按需（有症状或年龄到了再加）</h4><ul class="bullets">${p.optional.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
                  <p class="highlight">${esc(p.note)}</p>
                  <p class="muted">把"必查"和"按需"分开，是抵抗过度检查最实用的工具：该做的不省，不该加的先问清楚为什么。</p>`;
              })(),
              { icon: '🩺' },
            ),
          )
        : ''}

      ${isSenior
        ? raw(
            card(
              '老年关怀',
              `<ul class="bullets">${SENIOR_CARE.actions.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
               <h4>生活质量自评（每月一次）</h4>
               <ul class="bullets">${SENIOR_CARE.qualityOfLife.map((q) => `<li>${esc(q.q)}</li>`).join('')}</ul>
               <p class="muted">${esc(SENIOR_CARE.farewell[0])}</p>
               <button class="btn ghost" id="senior-on">${pet.seniorPlanOn ? '已启动老年养护方案 ✓' : '启动老年养护方案'}</button>`,
              { icon: '🌾', tone: 'warn' },
            ),
          )
        : ''}

      ${raw(
        card(
          `如果继续这样养 · ${esc(pred.levelLabel)}`,
          `${pred.risks.length
            ? `<p class="muted">当前被识别到的风险点：${pred.risks.map((r) => esc(r.now)).join('；')}</p>
               <div class="futures">
                 <div class="future dark"><h4>继续现在的方式</h4>${pred.dark
                   .map((hz) => `<h5>${esc(hz.horizon)}</h5><ul class="bullets">${hz.items.map((i) => `<li>${esc(i.text)}</li>`).join('')}</ul>`)
                   .join('')}</div>
                 <div class="future bright"><h4>如果科学养</h4>${pred.bright
                   .map((hz) => `<h5>${esc(hz.horizon)}</h5><ul class="bullets">${hz.items.map((i) => `<li>${esc(i.text)}</li>`).join('')}</ul>`)
                   .join('')}</div>
               </div>
               <h4>最省力的改动（按优先级）</h4>
               <ul class="bullets">${pred.levers
                 .map((l) => `<li><b>${esc(l.action)}</b><br><small class="muted">投入：${esc(l.effort)} · 收益：${esc(l.impact)}</small></li>`)
                 .join('')}</ul>
               <p class="muted">这不是恐吓，是趋势。它描述的是风险方向，不是某一只动物的命运 —— 而方向是可以改的。</p>`
            : '<p>目前没有识别到明显风险项，养护习惯很扎实。继续保持每月称重与年度体检就好。</p>'}`,
          { icon: '🔮' },
        ),
      )}

      ${logs.length
        ? raw(
            card(
              '最近记录',
              `<table class="table"><thead><tr><th>日期</th><th>体重</th><th>进食</th><th>饮水</th><th>任务</th><th>备注</th></tr></thead><tbody>
                ${logs
                  .map(
                    (l) => `<tr><td>${esc(l.date)}</td><td>${l.weightKg ?? '-'}</td><td>${l.foodGrams ?? '-'}</td><td>${l.waterMl ?? '-'}</td><td>${l.taskIds?.length ?? 0}/${l.tasksTotal || '-'}</td><td>${esc(l.note ?? '')}</td></tr>`,
                  )
                  .join('')}
              </tbody></table>`,
              { icon: '🗂️' },
            ),
          )
        : ''}
    `;
  },

  bind(root, ctx) {
    const save = root.querySelector('#save-log');
    if (save) {
      save.addEventListener('click', () => {
        const val = (n) => root.querySelector(`[name="${n}"]`)?.value;
        const weightKg = Number(val('weightKg')) || null;
        store.saveLog(ctx.pet.id, store.today(), {
          weightKg,
          foodGrams: Number(val('foodGrams')) || null,
          waterMl: Number(val('waterMl')) || null,
          note: String(val('note') ?? '').trim(),
        });
        if (weightKg) store.updatePet(ctx.pet.id, { weightKg });
        ctx.refresh();
      });
    }

    root.querySelectorAll('input[data-vaccine]').forEach((box) => {
      box.addEventListener('change', () => {
        const vaccines = { ...(ctx.pet.vaccines ?? {}) };
        if (box.checked) vaccines[box.dataset.vaccine] = store.today();
        else delete vaccines[box.dataset.vaccine];
        store.updatePet(ctx.pet.id, { vaccines });
        ctx.refresh();
      });
    });

    const senior = root.querySelector('#senior-on');
    if (senior) {
      senior.addEventListener('click', () => {
        store.updatePet(ctx.pet.id, { seniorPlanOn: true });
        ctx.refresh();
      });
    }
  },
};
