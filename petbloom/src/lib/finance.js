/**
 * 花费统计。
 *
 * 目的不是记账本身，而是回答两个问题：钱主要花在哪、以及"如果做预防
 * 能省多少"。所以分类按"预防 / 治疗 / 日常"这条线切，而不是按商家。
 */

export const EXPENSE_CATEGORIES = [
  { id: 'food', name: '主食与零食', icon: '🍖', group: 'daily' },
  { id: 'supply', name: '用品与耗材', icon: '🧺', group: 'daily' },
  { id: 'grooming', name: '美容与洗护', icon: '🛁', group: 'daily' },
  { id: 'prevent', name: '疫苗与驱虫', icon: '💉', group: 'prevent' },
  { id: 'checkup', name: '体检', icon: '🩺', group: 'prevent' },
  { id: 'treat', name: '看病与用药', icon: '🏥', group: 'treat' },
  { id: 'surgery', name: '手术与住院', icon: '🔪', group: 'treat' },
  { id: 'insurance', name: '保险', icon: '🛡️', group: 'prevent' },
  { id: 'other', name: '其他', icon: '📦', group: 'daily' },
];

const GROUP_NAMES = { daily: '日常', prevent: '预防', treat: '治疗' };

export function categoryById(id) {
  return EXPENSE_CATEGORIES.find((c) => c.id === id) ?? EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
}

/**
 * 汇总花费。
 * @param {object[]} expenses [{date, amount, category, note}]
 * @param {string} today
 */
export function summarize(expenses = [], today = '') {
  const valid = expenses.filter((e) => Number(e.amount) > 0);
  const total = valid.reduce((s, e) => s + Number(e.amount), 0);

  const byCategory = new Map();
  const byGroup = new Map();
  const byMonth = new Map();

  for (const e of valid) {
    const cat = categoryById(e.category);
    const amount = Number(e.amount);
    byCategory.set(cat.id, (byCategory.get(cat.id) ?? 0) + amount);
    byGroup.set(cat.group, (byGroup.get(cat.group) ?? 0) + amount);
    const month = String(e.date ?? '').slice(0, 7);
    if (month) byMonth.set(month, (byMonth.get(month) ?? 0) + amount);
  }

  const months = [...byMonth.keys()].sort();
  const monthly = months.map((m) => ({ month: m, amount: round(byMonth.get(m)) }));
  const spanMonths = months.length || 1;

  // 近 12 个月（用于"平均每月"这个更有用的数字）
  const recent = today ? monthly.filter((m) => m.month >= addMonths(today.slice(0, 7), -11)) : monthly;

  return {
    total: round(total),
    count: valid.length,
    average: round(total / spanMonths),
    recentAverage: recent.length ? round(recent.reduce((s, m) => s + m.amount, 0) / recent.length) : 0,
    byCategory: EXPENSE_CATEGORIES.filter((c) => byCategory.has(c.id))
      .map((c) => ({ ...c, amount: round(byCategory.get(c.id)), pct: Math.round((byCategory.get(c.id) / total) * 100) }))
      .sort((a, b) => b.amount - a.amount),
    byGroup: ['prevent', 'daily', 'treat']
      .filter((g) => byGroup.has(g))
      .map((g) => ({ id: g, name: GROUP_NAMES[g], amount: round(byGroup.get(g)), pct: Math.round((byGroup.get(g) / total) * 100) })),
    monthly,
  };
}

function round(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function addMonths(ym, delta) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** 一句话解读，放在统计上方。 */
export function insight(summary) {
  if (!summary.count) return '还没有花费记录。记一笔，就能看到钱花在哪、以及预防和治疗各占多少。';
  const treat = summary.byGroup.find((g) => g.id === 'treat');
  const prevent = summary.byGroup.find((g) => g.id === 'prevent');
  if (treat && treat.pct >= 50) {
    return `治疗性支出占了 ${treat.pct}%。这通常意味着预防环节还有空间 —— 同一疾病在早期管理的花费，往往只是晚期治疗的几分之一。`;
  }
  if (prevent && prevent.pct >= 30) {
    return `预防性支出占 ${prevent.pct}%，结构健康。疫苗、驱虫与定期体检是回报率最高的一笔钱。`;
  }
  return `平均每月约 ${summary.recentAverage || summary.average} 元。把这个数字乘以 12，再乘以它的预期寿命，就是养这只动物的大致长期成本。`;
}
