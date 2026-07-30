/**
 * 症状自查判级引擎。
 *
 * 输入答案 + 宠物上下文，输出紧急度、判断依据与行动清单。
 * 规则冲突时永远取更严重的一级（宁可多跑一趟医院，不可漏掉急症）。
 */

import { RULES, LEVELS, QUESTIONS, CARE_ACTIONS, RED_FLAGS } from '../data/triage.js';
import { SPECIES } from '../data/species.js';

const RANK = { green: 0, yellow: 1, red: 2 };

/**
 * @param {object} answers  {energy, appetite, ..., flags: string[]}
 * @param {object} ctx      {species, sex, ageMonths, breed}
 */
export function evaluate(answers = {}, ctx = {}) {
  const flags = new Set(answers.flags ?? []);
  const species = ctx.species;

  const matched = RULES.filter((rule) => {
    if (rule.species && species && !rule.species.includes(species)) return false;
    if (rule.exceptSpecies && species && rule.exceptSpecies.includes(species)) return false;
    if (rule.flag) return flags.has(rule.flag);
    if (typeof rule.when === 'function') return Boolean(rule.when(answers, ctx));
    return false;
  });

  // 绿灯规则只在没有任何黄/红灯时才作为结论展示
  const escalating = matched.filter((r) => r.level !== 'green');
  const level = escalating.length
    ? escalating.reduce((worst, r) => (RANK[r.level] > RANK[worst] ? r.level : worst), 'green')
    : 'green';

  const reasons = (escalating.length ? escalating : matched).filter((r) => r.level === level || !escalating.length);

  const unanswered = QUESTIONS.filter((q) => !answers[q.id]).map((q) => q.label);

  return {
    level,
    levelMeta: LEVELS[level],
    reasons: reasons.map((r) => ({ id: r.id, reason: r.reason, detail: r.detail, level: r.level })),
    otherFindings: matched
      .filter((r) => !reasons.includes(r))
      .map((r) => ({ id: r.id, reason: r.reason, detail: r.detail, level: r.level })),
    actions: CARE_ACTIONS[level],
    unanswered,
    speciesNote: speciesNote(species, level),
  };
}

/** 物种专属的补充提醒，附在结论下方。 */
function speciesNote(speciesId, level) {
  const notes = {
    cat: '猫极善于隐藏疼痛：躲起来、不上跳台、少梳理、在暗处久坐，都是"它在忍"的信号。',
    dog: '犬的疼痛常表现为舔某处、拱背、不愿上楼梯、性格变得易怒。',
    rabbit: '兔子的健康看便便：数量、大小、形状每天都值得看一眼，变化往往早于其他症状。',
    guineaPig: '豚鼠会持续进食，一旦停止吃干草，就要按急症对待。',
    chinchilla: '先确认室温：>26°C 时龙猫可能是中暑而非生病。',
    hamster: '仓鼠体型小、脱水快，湿尾（严重腹泻）在幼鼠可 24-48 小时内致命。',
    parrot: '鸟类的病程是"看着好—突然垮"，任何可见异常都按紧急处理。',
    lizard: '先核对温度梯度与 UVB，很多"生病"其实是环境参数不对。',
    turtle: '先核对水温、水质与晒台是否可用。',
    snake: '先核对温度与是否处于蜕皮期，再考虑疾病。',
  };
  const base = notes[speciesId];
  if (!base) return null;
  if (level === 'red') return base;
  return base;
}

/**
 * 生成"就医摘要"文本 —— 带去医院直接读给医生，比现场回忆准确得多。
 */
export function vetSummary({ pet, answers, result, recentLogs = [], now = '' }) {
  const sp = SPECIES[pet?.species];
  const lines = [];
  lines.push('【PetBloom 就医摘要】');
  if (now) lines.push(`记录时间：${now}`);
  lines.push(
    `患病动物：${pet?.name ?? '未命名'} · ${sp?.name ?? '未知物种'}${pet?.breed ? ' · ' + pet.breed : ''} · ${
      pet?.ageMonths ? Math.floor(pet.ageMonths / 12) + '岁' + (pet.ageMonths % 12) + '个月' : '年龄未填'
    } · ${pet?.weightKg ?? '?'}kg · ${pet?.sex === 'male' ? '公' : pet?.sex === 'female' ? '母' : '性别未填'} · ${
      pet?.neutered ? '已绝育' : '未绝育'
    }`,
  );
  if (pet?.conditions) lines.push(`既往病史 / 用药：${pet.conditions}`);
  lines.push('');
  lines.push('主要症状：');
  for (const q of QUESTIONS) {
    const val = answers?.[q.id];
    if (!val) continue;
    const opt = q.options.find((o) => o.v === val);
    if (!opt || /正常|没有|粉红/.test(opt.t)) continue;
    lines.push(`· ${q.label}：${opt.t}`);
  }
  const flagText = (answers?.flags ?? [])
    .map((f) => RED_FLAGS.find((r) => r.id === f)?.t)
    .filter(Boolean);
  if (flagText.length) lines.push(`· 危险信号：${flagText.join('、')}`);

  lines.push('');
  lines.push(`自查判级：${result?.levelMeta?.icon ?? ''} ${result?.levelMeta?.title ?? ''}`);
  if (result?.reasons?.length) {
    lines.push(`判断依据：${result.reasons.map((r) => r.reason).join('；')}`);
  }

  if (recentLogs.length) {
    lines.push('');
    lines.push('近期记录：');
    for (const log of recentLogs.slice(0, 7)) {
      const bits = [log.date];
      if (log.weightKg) bits.push(`体重 ${log.weightKg}kg`);
      if (log.foodGrams) bits.push(`进食 ${log.foodGrams}g`);
      if (log.waterMl) bits.push(`饮水 ${log.waterMl}ml`);
      if (log.note) bits.push(log.note);
      lines.push(`· ${bits.join(' / ')}`);
    }
  }
  lines.push('');
  lines.push('（本摘要由家长记录整理，不含诊断结论）');
  return lines.join('\n');
}
