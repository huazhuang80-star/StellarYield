/**
 * 花园培育与成就系统 —— 把"科学养护"这件长期而无声的事变得可见。
 *
 * 设计上刻意避免惩罚：花园会因为长期缺乏养护而"需要浇灌"，但永远不会死。
 * 觉察本身就是进步，用户任何时候回来都应该被接住，而不是被清零。
 */

export const STAGES = [
  { id: 'sprout', name: '萌芽期', emoji: '🌱', minDays: 0, maxDays: 7, meaning: '新生命到来，建立最初的信任', unlock: '完成建档并度过第一周' },
  { id: 'root', name: '扎根期', emoji: '🌿', minDays: 8, maxDays: 30, meaning: '习惯与作息成形，它开始把这里当家', unlock: '连续 7 天完成每日任务' },
  { id: 'grow', name: '生长期', emoji: '🌳', minDays: 31, maxDays: 180, meaning: '身体发育关键期，科学喂养的红利在这里累积', unlock: '体重稳定在标准区间' },
  { id: 'bloom', name: '繁茂期', emoji: '🌸', minDays: 181, maxDays: 365, meaning: '性格定型、行为训练的黄金期', unlock: '完成基础行为训练' },
  { id: 'mature', name: '成熟期', emoji: '🌲', minDays: 366, maxDays: 2555, meaning: '成年稳定期，重点转向预防医学', unlock: '年度体检全部完成' },
  { id: 'autumn', name: '暮年期', emoji: '🍂', minDays: 2556, maxDays: Infinity, meaning: '老年关怀，珍惜每一天', unlock: '启动老年养护方案' },
];

export function stageForDays(days) {
  const d = Math.max(0, Number(days) || 0);
  return STAGES.find((s) => d >= s.minDays && d <= s.maxDays) ?? STAGES[STAGES.length - 1];
}

/**
 * 花园健康度：最近 14 天每日任务完成率 + 记录连续性。
 * @param {object[]} logs  按日期倒序的记录 [{date, tasksDone, tasksTotal}]
 */
export function gardenHealth(logs = []) {
  const recent = logs.slice(0, 14);
  if (!recent.length) return { score: 50, label: '还没有记录，先从今天的第一条开始', tone: 'neutral' };

  const rates = recent.map((l) => (l.tasksTotal > 0 ? l.tasksDone / l.tasksTotal : 0));
  const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
  const coverage = recent.length / 14;
  const score = Math.round(Math.min(100, avg * 80 + coverage * 20));

  let label = '花园需要浇灌了 —— 回来就好，从今天补上一项开始';
  let tone = 'warn';
  if (score >= 85) {
    label = '花园繁茂：养护节奏非常稳定';
    tone = 'good';
  } else if (score >= 60) {
    label = '花园健康：还有几项常被漏掉，看看是哪些';
    tone = 'good';
  }
  return { score, label, tone };
}

/** 连续完成天数（streak）。logs 需按日期倒序，date 格式 YYYY-MM-DD。 */
export function streakDays(logs = [], today = null) {
  if (!logs.length) return 0;
  const done = new Set(logs.filter((l) => l.tasksTotal > 0 && l.tasksDone >= l.tasksTotal).map((l) => l.date));
  const start = today ?? logs[0]?.date;
  if (!start) return 0;

  let count = 0;
  const cursor = new Date(`${start}T00:00:00`);
  // 允许"今天还没完成"不打断已有连续记录
  if (!done.has(start)) cursor.setDate(cursor.getDate() - 1);
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!done.has(key)) break;
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export const BADGES = [
  { id: 'firstRecord', name: '建档先锋', icon: '📋', desc: '完成宠物终身档案建立', test: (s) => Boolean(s.pet?.name && s.pet?.species) },
  { id: 'nutritionMaster', name: '营养大师', icon: '⚖️', desc: '累计记录 30 天饮食', test: (s) => s.logs.filter((l) => l.foodGrams > 0).length >= 30 },
  { id: 'weightGuard', name: '体重守护者', icon: '❤️', desc: '连续 3 次月度称重都在标准区间', test: (s) => s.idealWeighIns >= 3 },
  { id: 'vaccineShield', name: '疫苗卫士', icon: '🛡️', desc: '按时完成全部核心免疫', test: (s) => s.vaccinesDone > 0 && s.vaccinesOverdue === 0 },
  { id: 'translator', name: '行为翻译官', icon: '💬', desc: '解锁 20 条行为解读', test: (s) => (s.pet?.unlockedSignals?.length ?? 0) >= 20 },
  { id: 'vetSavvy', name: '医疗避坑者', icon: '🔍', desc: '完成一次症状自查并带着摘要就医', test: (s) => s.triageWithSummary >= 1 },
  { id: 'groomer', name: '梳毛达人', icon: '🪮', desc: '连续 7 天完成梳毛', test: (s) => s.groomStreak >= 7 },
  { id: 'playmate', name: '陪玩高手', icon: '🎾', desc: '累计 30 天完成互动任务', test: (s) => s.playDays >= 30 },
  { id: 'seniorCare', name: '老年关怀者', icon: '🌾', desc: '为进入老年期的宠物启动老年养护', test: (s) => s.seniorPlanOn },
  { id: 'multiSpecies', name: '全物种专家', icon: '🌍', desc: '同时养护 2 种以上不同物种', test: (s) => s.speciesCount >= 2 },
  { id: 'sevenDay', name: '第一周', icon: '🌱', desc: '陪伴满 7 天', test: (s) => s.daysTogether >= 7 },
  { id: 'oneYear', name: '一年同行', icon: '🎂', desc: '陪伴满 365 天', test: (s) => s.daysTogether >= 365 },
];

/** 计算已获得的徽章。stats 由 store 汇总。 */
export function earnedBadges(stats) {
  return BADGES.map((b) => ({ ...b, earned: safeTest(b.test, stats) }));
}

function safeTest(fn, stats) {
  try {
    return Boolean(fn(stats));
  } catch {
    return false;
  }
}

/** 惊喜彩蛋：按当下情境返回一句话。 */
export function easterEgg({ daysTogether = 0, hour = 12, isBirthday = false, weightIdeal = false, healthyYear = false, petName = '它' }) {
  if (isBirthday) return `今天是 ${petName} 的生日。它最大的礼物，就是遇到了你。`;
  if (daysTogether === 1) return `欢迎 ${petName} 回家。从今天开始，你们的故事有了第一页。`;
  if (daysTogether === 7) return `第 7 天。最难的适应期过去了，${petName} 已经知道这里是家。`;
  if (daysTogether === 100) return `第 100 天。你们已经有了默契。`;
  if (healthyYear) return `这一年 ${petName} 没有生大病。这不是运气，是你每天那几分钟换来的。`;
  if (weightIdeal) return `${petName} 的体重正好在标准区间 —— 科学喂养见效了。`;
  if (hour >= 23 || hour < 5) return `这么晚还在关心 ${petName}？它有你，真的很幸运。`;
  return null;
}
