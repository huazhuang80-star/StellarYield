/**
 * 提醒中心：把散落在各处的"该做的事"合并成一份按到期时间排序的清单。
 *
 * 来源有五类：免疫与预防计划、周期性用药（驱虫等）、年度体检、生日、
 * 以及日常节律（月度称重、UVB 灯管更换）。
 * 全部是纯函数，时间通过参数传入，方便测试。
 */

import { VACCINE_PLANS, SENIOR_CARE } from '../data/care.js';
import { SPECIES } from '../data/species.js';

/** 周期项的间隔天数。写成显式表，比解析中文文案可靠。 */
export const RECUR_DAYS = {
  deworm: 90,
  heartworm: 30,
  annual: 365,
  checkTeeth: 180,
  checkVitC: 180,
  checkTumor: 180,
  fecal: 270,
  uvbSwap: 270,
  newBird: 0,
};

const DAY = 86400000;

export function addDays(iso, days) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function diffDays(fromISO, toISO) {
  return Math.round((new Date(`${toISO}T00:00:00`) - new Date(`${fromISO}T00:00:00`)) / DAY);
}

/** 由到期日推出状态。leadDays 内算"即将到期"。 */
export function stateFor(dueISO, today, leadDays = 7) {
  if (!dueISO) return 'unknown';
  const d = diffDays(today, dueISO);
  if (d < 0) return 'overdue';
  if (d <= leadDays) return 'due';
  return 'upcoming';
}

/**
 * @param {object} ctx {pet, ageMonths, logs, meds, visits, today, leadDays}
 * @returns {object[]} 按到期日升序，未知日期排最后
 */
export function buildReminders({ pet, ageMonths = 0, logs = [], meds = [], visits = [], today, leadDays = 7 }) {
  if (!pet) return [];
  const out = [];
  const push = (r) => out.push({ ...r, state: r.state ?? stateFor(r.due, today, leadDays) });

  // 1. 免疫与预防计划
  const plan = VACCINE_PLANS[pet.species] ?? [];
  for (const item of plan) {
    const doneDate = pet.vaccines?.[item.id];
    const recur = RECUR_DAYS[item.id];

    if (doneDate && recur) {
      // 周期项：从上次完成日推下一次
      push({
        id: `vac_${item.id}`,
        kind: 'prevent',
        icon: '💉',
        title: `${item.name}（下一次）`,
        due: addDays(doneDate, recur),
        detail: `上次完成于 ${doneDate}${item.recur ? ' · ' + item.recur : ''}`,
        route: '#records',
      });
    } else if (!doneDate) {
      // 一次性项：按建议月龄折算日期（需要生日才能算）
      const due = pet.birthday ? addDays(pet.birthday, Math.round(item.dueMonths * 30.44)) : null;
      push({
        id: `vac_${item.id}`,
        kind: 'prevent',
        icon: '💉',
        title: item.name,
        due,
        state: due ? undefined : ageMonths >= item.dueMonths ? 'overdue' : 'upcoming',
        detail: due ? item.note : `建议 ${item.dueMonths} 月龄 · ${item.note}`,
        route: '#records',
      });
    }
  }

  // 2. 周期性用药：取每个名称最近一次，按其 intervalDays 推下一次
  const latestByName = new Map();
  for (const m of meds) {
    if (!m.intervalDays) continue;
    const prev = latestByName.get(m.name);
    if (!prev || m.date > prev.date) latestByName.set(m.name, m);
  }
  for (const m of latestByName.values()) {
    push({
      id: `med_${m.id}`,
      kind: 'med',
      icon: '💊',
      title: `${m.name}（下一次）`,
      due: addDays(m.date, Number(m.intervalDays)),
      detail: `上次 ${m.date}${m.dose ? ' · ' + m.dose : ''}`,
      route: '#health',
    });
  }

  // 3. 年度（或半年度）体检
  const seniorStart = SENIOR_CARE.startAge[pet.species] ?? Infinity;
  const checkupInterval = ageMonths >= seniorStart ? 182 : 365;
  const lastCheckup = visits.filter((v) => v.type === 'checkup').sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  push({
    id: 'checkup',
    kind: 'checkup',
    icon: '🩺',
    title: ageMonths >= seniorStart ? '半年度体检（老年期）' : '年度体检',
    due: lastCheckup ? addDays(lastCheckup.date, checkupInterval) : null,
    state: lastCheckup ? undefined : 'due',
    detail: lastCheckup ? `上次体检 ${lastCheckup.date}` : '还没有体检记录，建议尽快安排一次并录入',
    route: '#records',
  });

  // 4. 生日
  if (pet.birthday) {
    push({
      id: 'birthday',
      kind: 'moment',
      icon: '🎂',
      title: '生日',
      due: nextAnniversary(pet.birthday, today),
      detail: `出生于 ${pet.birthday}`,
      route: '#timeline',
    });
  }

  // 5. 月度称重
  const lastWeigh = logs.filter((l) => Number(l.weightKg) > 0).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  push({
    id: 'weigh',
    kind: 'routine',
    icon: '⚖️',
    title: '月度称重',
    due: lastWeigh ? addDays(lastWeigh.date, 30) : null,
    state: lastWeigh ? undefined : 'due',
    detail: lastWeigh ? `上次 ${lastWeigh.date} · ${lastWeigh.weightKg}kg` : '还没有体重记录，这是最早也最便宜的健康预警指标',
    route: '#records',
  });

  // 6. 爬宠 UVB 灯管
  if (['lizard', 'turtle'].includes(pet.species)) {
    const lastSwap = meds.filter((m) => m.name?.includes('UVB')).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    push({
      id: 'uvb',
      kind: 'routine',
      icon: '💡',
      title: '更换 UVB 灯管',
      due: lastSwap ? addDays(lastSwap.date, 270) : null,
      state: lastSwap ? undefined : 'due',
      detail: lastSwap ? `上次更换 ${lastSwap.date}` : '灯还亮不代表 UVB 还有效，记录一次更换日期即可开始追踪',
      route: '#health',
    });
  }

  const rank = { overdue: 0, due: 1, upcoming: 2, unknown: 3 };
  return out.sort((a, b) => {
    if (rank[a.state] !== rank[b.state]) return rank[a.state] - rank[b.state];
    if (!a.due) return 1;
    if (!b.due) return -1;
    return a.due < b.due ? -1 : 1;
  });
}

/** 下一个周年日（今天当天算今天）。 */
export function nextAnniversary(birthdayISO, today) {
  const b = new Date(`${birthdayISO}T00:00:00`);
  const t = new Date(`${today}T00:00:00`);
  const candidate = new Date(t.getFullYear(), b.getMonth(), b.getDate());
  if (candidate < t) candidate.setFullYear(candidate.getFullYear() + 1);
  return candidate.toISOString().slice(0, 10);
}

/** 只要需要处理的（已过期 + 即将到期）。 */
export function actionable(reminders) {
  return reminders.filter((r) => r.state === 'overdue' || r.state === 'due');
}

/** 给某物种一份"默认该有的周期项"，用于空档案时的引导。 */
export function suggestedRoutines(speciesId) {
  const sp = SPECIES[speciesId];
  if (!sp) return [];
  return [
    { name: '体内外驱虫', intervalDays: 90 },
    ...(speciesId === 'dog' ? [{ name: '心丝虫预防', intervalDays: 30 }] : []),
    ...(['lizard', 'turtle'].includes(speciesId) ? [{ name: 'UVB 灯管更换', intervalDays: 270 }] : []),
  ];
}
