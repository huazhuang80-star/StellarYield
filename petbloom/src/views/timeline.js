/**
 * 成长时间轴。
 *
 * 把里程碑、就诊、免疫、体重变化、自查记录按时间合并成一条线 ——
 * 单看某一类记录是数据，合在一起才是"它这一路"。
 */

import { h, raw, esc, card, field, text, timelineItem, emptyState, toast } from '../ui.js';
import * as store from '../lib/store.js';
import { SPECIES } from '../data/species.js';
import { stageForDays, STAGES } from '../lib/growth.js';
import { VACCINE_PLANS } from '../data/care.js';

const PRESET_MILESTONES = [
  '接回家的第一天',
  '第一次自己上厕所',
  '第一次打疫苗',
  '第一次洗澡',
  '第一次剪指甲',
  '完成绝育',
  '第一次出门 / 第一次遛弯',
  '学会第一个指令',
  '换牙完成',
  '第一次过生日',
];

export default {
  id: 'timeline',
  title: '时间轴',

  render(ctx) {
    const pet = ctx.pet;
    const sp = SPECIES[pet.species];
    const stats = store.statsFor(pet.id);
    const days = store.daysBetween(pet.homecoming);
    const stage = stageForDays(days);
    const events = collect(pet, stats);

    return h`
      <h1 class="page-title">🌳 ${pet.name} 的时间轴</h1>
      <p class="muted">${sp.emoji} ${sp.name} · 陪伴 ${days} 天 · 当前 ${stage.emoji} ${stage.name}</p>

      ${raw(
        card(
          '成长阶段',
          `<ol class="stage-track">${STAGES.map((s) => {
            const done = days > s.maxDays;
            const now = s.id === stage.id;
            return `<li class="stage-step${done ? ' done' : ''}${now ? ' now' : ''}">
              <span class="stage-emoji">${s.emoji}</span>
              <div><b>${esc(s.name)}</b><small class="muted">${esc(s.meaning)}</small>
              <small class="muted">解锁条件：${esc(s.unlock)}</small></div>
            </li>`;
          }).join('')}</ol>`,
          { icon: '🌱' },
        ),
      )}

      ${raw(
        card(
          '记一个里程碑',
          h`${raw(field('发生了什么', `<input type="text" name="ms" list="ms-presets" placeholder="比如：第一次自己跳上窗台">`))}
            <datalist id="ms-presets">${PRESET_MILESTONES.map((m) => raw(`<option value="${esc(m)}"></option>`))}</datalist>
            ${raw(field('日期', `<input type="date" name="msDate" value="${store.today()}">`))}
            ${raw(field('备注（可留空）', text('msNote', '', '当时的样子、你的心情')))}
            <button class="btn primary" id="add-ms">记下来</button>
            <p class="muted">这些是几年后你最想翻回来看的东西，而不是体重数字。</p>`,
          { icon: '⭐' },
        ),
      )}

      ${events.length
        ? raw(card(`全部记录（${events.length}）`, `<ul class="timeline">${events.map((e) => timelineItem(e)).join('')}</ul>`, { icon: '🕰️' }))
        : raw(emptyState('还没有可展示的事件。记一个里程碑，或者去档案里录一次体重。', '<a class="btn" href="#records">去档案</a>'))}
    `;
  },

  bind(root, ctx) {
    root.querySelector('#add-ms')?.addEventListener('click', () => {
      const val = (n) => root.querySelector(`[name="${n}"]`)?.value?.trim();
      const title = val('ms');
      if (!title) {
        toast('先写一句发生了什么', 'warn');
        root.querySelector('[name="ms"]')?.focus();
        return;
      }
      store.addItem(ctx.pet.id, 'milestones', { title, date: val('msDate') || store.today(), note: val('msNote') ?? '' });
      toast('已记入时间轴');
      ctx.refresh();
    });
  },
};

/** 合并各类记录并按日期倒序。 */
function collect(pet, stats) {
  const events = [];

  if (pet.homecoming) {
    events.push({ date: pet.homecoming, icon: '🏠', title: '接回家', body: '故事开始的那一天', tone: 'accent' });
  }
  if (pet.birthday) {
    events.push({ date: pet.birthday, icon: '🎂', title: '出生', body: '' });
  }

  for (const m of stats.milestones) {
    events.push({ date: m.date, icon: '⭐', title: m.title, body: m.note ?? '' });
  }

  for (const v of stats.visits) {
    events.push({ date: v.date, icon: '🏥', title: v.title || '就诊', body: [v.clinic, v.diagnosis, v.note].filter(Boolean).join(' · ') });
  }

  for (const m of stats.meds) {
    events.push({ date: m.date, icon: '💊', title: m.name, body: [m.dose, m.note].filter(Boolean).join(' · ') });
  }

  const plan = VACCINE_PLANS[pet.species] ?? [];
  for (const [id, date] of Object.entries(pet.vaccines ?? {})) {
    const item = plan.find((p) => p.id === id);
    events.push({ date, icon: '💉', title: item?.name ?? '免疫/预防', body: '已完成' });
  }

  // 体重只挑有变化意义的点：首次、最新、以及月度首条
  const weights = stats.logs.filter((l) => Number(l.weightKg) > 0).sort((a, b) => (a.date < b.date ? -1 : 1));
  const seenMonth = new Set();
  weights.forEach((w, i) => {
    const month = w.date.slice(0, 7);
    const isEdge = i === 0 || i === weights.length - 1;
    if (isEdge || !seenMonth.has(month)) {
      seenMonth.add(month);
      events.push({ date: w.date, icon: '⚖️', title: `体重 ${w.weightKg} kg`, body: i === 0 ? '第一次称重，这是所有判断的基线' : '' });
    }
  });

  for (const l of stats.logs.filter((x) => x.note)) {
    events.push({ date: l.date, icon: '📝', title: '日志', body: l.note });
  }

  return events.filter((e) => e.date).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
