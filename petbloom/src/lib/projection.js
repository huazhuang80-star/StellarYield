/**
 * 「如果继续这样养」/「如果科学养」双未来预测器。
 *
 * 这不是算命，也不该是恐吓。它做的事很简单：把当前的养护习惯，按兽医
 * 流行病学中已被反复观察到的因果关系，向前推 1 / 3 / 5 年，并同时给出
 * 另一条可选的路径。所有结论都是趋势与风险方向，不是个体预言。
 */

const DIMENSIONS = { weight: '体重', health: '健康', behavior: '行为', cost: '医疗支出', life: '寿命与生活质量' };

/**
 * @param {object} habits
 *   feedingStyle  'free'（自助无限量）| 'random'（凭感觉）| 'measured'（称重定量）
 *   weightTrend   'up' | 'stable' | 'down'
 *   dental        'daily' | 'sometimes' | 'never'
 *   groom         'daily' | 'weekly' | 'rarely'
 *   exercise      'enough' | 'some' | 'little'
 *   vetCheck      'annual' | 'symptomOnly' | 'never'
 *   behaviorIssues string[]
 *   speciesId, ageMonths
 */
export function project(habits = {}) {
  const risks = [];
  const add = (dim, weight, now, y1, y3, y5) => risks.push({ dim, weight, now, y1, y3, y5 });

  const { feedingStyle, weightTrend, dental, exercise, vetCheck, groom, speciesId, behaviorIssues = [] } = habits;

  if (feedingStyle === 'free' || feedingStyle === 'random') {
    add(
      DIMENSIONS.weight,
      3,
      feedingStyle === 'free' ? '自助无限量喂食，摄入不可控' : '凭感觉喂，每日摄入波动大',
      '体重逐步上行，腰线消失（超重通常以每年百分之几的速度悄悄累积）',
      '进入肥胖区间，关节负担与胰岛素抵抗开始出现',
      '肥胖相关疾病显现：猫的糖尿病风险显著高于标准体重个体，犬的骨关节炎提前到来',
    );
  }
  if (weightTrend === 'up') {
    add(DIMENSIONS.health, 3, '体重呈上升趋势', '需要减量与增加活动，此时干预成本最低', '减重难度上升，代谢已改变', '肥胖是所有慢性病的放大器，也提高麻醉与手术风险');
  }
  if (weightTrend === 'down' && (habits.ageMonths ?? 0) > 12) {
    add(DIMENSIONS.health, 4, '非计划性体重下降', '这是需要立即查因的信号，而不是"瘦点更好"', '若为慢性病（肾病、甲亢、肿瘤、牙病）会持续进展', '错过早期干预窗口，治疗从"控制"变为"支持"');
  }
  if (dental === 'never') {
    add(
      DIMENSIONS.health,
      2,
      '没有口腔护理',
      '牙结石与牙龈炎形成，出现口臭',
      '牙周病进入不可逆阶段，可能需麻醉洁牙甚至拔牙',
      '慢性口腔感染持续给肝肾与心脏增加负担，且长期疼痛会被误认成"变老变懒"',
    );
  } else if (dental === 'sometimes') {
    add(DIMENSIONS.health, 1, '口腔护理不规律', '牙菌斑局部堆积', '需要一次专业洁牙', '可控，但每年仍应做口腔评估');
  }
  if (exercise === 'little') {
    add(DIMENSIONS.behavior, 2, '运动与互动不足', '出现精力过剩型行为：拆家、夜间闹、破坏', '行为模式固化，纠正需要更长时间', '肌肉量下降叠加体重上升，活动意愿进一步降低，形成循环');
  }
  if (vetCheck === 'never' || vetCheck === 'symptomOnly') {
    add(
      DIMENSIONS.cost,
      3,
      vetCheck === 'never' ? '从不体检' : '只在有症状时才就医',
      '慢性病仍在无症状期，此时最容易被发现也最便宜',
      '一旦症状出现，肾病等疾病往往已损失大部分功能储备',
      '同一疾病在晚期的治疗支出通常是早期管理的数倍，且预后更差',
    );
  }
  if (groom === 'rarely' && ['cat', 'rabbit', 'chinchilla', 'guineaPig'].includes(speciesId)) {
    add(DIMENSIONS.health, 2, '梳毛不足', '毛发打结，舔入毛量增加', speciesId === 'rabbit' ? '兔子无法吐出毛发，毛发在肠道积聚是胃肠停滞的诱因' : '毛球问题反复，可能诱发肠道阻塞', '打结处皮肤发炎，严重时需剃毛处理');
  }
  if (behaviorIssues.length) {
    add(
      DIMENSIONS.behavior,
      2,
      `存在未处理的行为问题：${behaviorIssues.join('、')}`,
      '行为被环境反复强化，出现频率上升',
      '行为固化，家庭矛盾与弃养念头出现的高峰期',
      '行为问题是伴侣动物被放弃的主要原因之一，而多数在早期是可矫正的',
    );
  }

  const score = risks.reduce((sum, r) => sum + r.weight, 0);
  const level = score >= 9 ? 'high' : score >= 5 ? 'medium' : score >= 1 ? 'low' : 'minimal';

  return {
    score,
    level,
    levelLabel: { high: '需要尽快调整', medium: '有明显可改进项', low: '整体不错，有少量待补', minimal: '养护习惯扎实' }[level],
    risks,
    dark: horizons(risks, 'dark'),
    bright: brightFuture(habits, risks),
    levers: levers(habits),
  };
}

function horizons(risks, mode) {
  const pick = (k) => risks.filter((r) => r[k]).map((r) => ({ dim: r.dim, text: r[k] }));
  return [
    { horizon: '1 年后', items: pick('y1') },
    { horizon: '3 年后', items: pick('y3') },
    { horizon: '5 年后', items: pick('y5') },
  ].map((h) => ({ ...h, mode }));
}

function brightFuture(habits, risks) {
  const has = (dim) => risks.some((r) => r.dim === dim);
  const y1 = ['体重稳定在标准区间，摸得到肋骨也看得到腰线', '毛发与皮肤状态改善，掉毛与毛球问题下降'];
  const y3 = ['年度体检持续正常，任何异常都在早期被抓住', '行为稳定，家里不再有"屡教不改"的冲突点'];
  const y5 = ['进入老年期时仍然活跃，关节与口腔状况良好', '医疗支出集中在预防，而不是抢救'];

  if (has(DIMENSIONS.behavior)) y1.push('行为问题在正向训练下明显减少，互动质量提升');
  if (has(DIMENSIONS.cost)) y3.push('慢性病在无症状期被发现并管理，费用与预后都更好');
  if (habits.dental === 'never') y1.push('开始口腔护理后，口臭与牙龈炎在数周内就有变化');

  return [
    { horizon: '1 年后', items: y1.map((t) => ({ dim: '综合', text: t })), mode: 'bright' },
    { horizon: '3 年后', items: y3.map((t) => ({ dim: '综合', text: t })), mode: 'bright' },
    { horizon: '5 年后', items: y5.map((t) => ({ dim: '综合', text: t })), mode: 'bright' },
  ];
}

/** 最省力、见效最快的改动，按优先级排序。 */
function levers(habits) {
  const out = [];
  if (habits.feedingStyle !== 'measured') out.push({ action: '把"一把粮"换成厨房秤 + 每日热量', effort: '每天多花 1 分钟', impact: '这是控制体重最有效的单一改动' });
  if (habits.dental === 'never') out.push({ action: '从每周 2 次刷牙开始（不追求每天）', effort: '每次 1 分钟', impact: '推迟麻醉洁牙的时间，减少长期疼痛' });
  if (habits.exercise === 'little') out.push({ action: '固定时段的 10-15 分钟互动，睡前一次效果最好', effort: '每天 15 分钟', impact: '同时改善体重与大半行为问题' });
  if (habits.vetCheck !== 'annual') out.push({ action: '把年度体检写进日历，含血常规、生化与尿检', effort: '每年一次', impact: '把"抢救"变成"管理"' });
  if (habits.groom === 'rarely') out.push({ action: '换毛季每日梳 5 分钟', effort: '每天 5 分钟', impact: '减少毛球与皮肤问题，也是最好的触诊机会' });
  out.push({ action: '每月固定一天称重并记录', effort: '每月 2 分钟', impact: '体重曲线是最早、最便宜的健康预警' });
  return out;
}
