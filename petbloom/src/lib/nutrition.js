/**
 * 饮食处方引擎 —— 回答"该吃多少"和"这袋粮到底行不行"。
 *
 * 全部是纯函数，方便单测（见 tests/nutrition.test.js）。
 * 热量制沿用兽医营养学通用做法：
 *     RER = 70 × 体重(kg)^0.75         静息能量需求
 *     MER = RER × 生理系数              日常维持能量需求
 * 草食小宠与爬宠没有通用热量公式，改用体重折算的配比制与投喂节律。
 */

import { SPECIES, resolveStage, breedStandard } from '../data/species.js';

/** 静息能量需求（kcal/日）。 */
export function rer(weightKg) {
  const kg = Number(weightKg);
  if (!(kg > 0)) return 0;
  return 70 * Math.pow(kg, 0.75);
}

/**
 * 选择生理系数。
 * @param {object} ctx {stageId, neutered, goal:'maintain'|'lose'|'gain'}
 */
export function pickFactor(speciesId, ctx = {}) {
  const factors = SPECIES[speciesId]?.energyModel?.factors;
  if (!factors) return null;
  const { stageId = 'adult', neutered = true, goal = 'maintain' } = ctx;

  // 生长期优先：幼年动物不做减重
  if (stageId === 'baby' && factors.baby) return { key: 'baby', ...factors.baby };
  if (stageId === 'junior' && factors.junior) return { key: 'junior', ...factors.junior };

  if (goal === 'lose' && factors.weightLoss) return { key: 'weightLoss', ...factors.weightLoss };
  if (goal === 'gain' && factors.weightGain) return { key: 'weightGain', ...factors.weightGain };

  if (stageId === 'senior' && factors.senior) return { key: 'senior', ...factors.senior };

  const key = neutered ? 'adultNeutered' : 'adultIntact';
  return { key, ...factors[key] };
}

/** 每日热量需求（kcal）。仅适用于热量制物种（猫/狗）。 */
export function dailyEnergy(speciesId, weightKg, ctx = {}) {
  const model = SPECIES[speciesId]?.energyModel;
  if (model?.type !== 'kcal') return null;
  const factor = pickFactor(speciesId, ctx);
  const base = rer(weightKg);
  return {
    rer: Math.round(base),
    factor: factor.factor,
    factorLabel: factor.label,
    kcal: Math.round(base * factor.factor),
  };
}

/** 每日饮水目标（ml）区间。 */
export function waterTarget(speciesId, weightKg) {
  const range = SPECIES[speciesId]?.energyModel?.waterMlPerKg;
  const kg = Number(weightKg);
  if (!range || !(kg > 0)) return null;
  return { min: Math.round(range[0] * kg), max: Math.round(range[1] * kg) };
}

/** 零食热量上限（kcal），默认为日粮 10%。 */
export function treatCap(kcal, speciesId) {
  const ratio = SPECIES[speciesId]?.energyModel?.treatCapRatio ?? 0.1;
  return Math.round((Number(kcal) || 0) * ratio);
}

/**
 * 把热量拆成具体克数 / 罐数。
 * @param {object} p
 *   kcal         每日总热量
 *   wetRatio     湿粮承担的热量比例 0-1
 *   dryKcalPer100g / wetKcalPer100g  粮的能量密度
 *   wetCanGrams  一罐的克数（用于换算"几罐"）
 */
export function portionPlan({ kcal, wetRatio = 0.3, dryKcalPer100g = 400, wetKcalPer100g = 85, wetCanGrams = 85 }) {
  const total = Number(kcal) || 0;
  const ratio = Math.min(Math.max(Number(wetRatio) || 0, 0), 1);
  const treatKcal = Math.round(total * 0.1);
  const foodKcal = total - treatKcal;

  const wetKcal = foodKcal * ratio;
  const dryKcal = foodKcal - wetKcal;
  const grams = (kc, density) => (density > 0 ? Math.round((kc / density) * 100) : 0);

  const wetGrams = grams(wetKcal, wetKcalPer100g);
  return {
    dry: { kcal: Math.round(dryKcal), grams: grams(dryKcal, dryKcalPer100g) },
    wet: {
      kcal: Math.round(wetKcal),
      grams: wetGrams,
      cans: wetCanGrams > 0 ? Math.round((wetGrams / wetCanGrams) * 10) / 10 : 0,
    },
    treat: { kcal: treatKcal, note: '零食上限，含冻干、肉条、训练奖励' },
  };
}

/** 草食小宠 / 仓鼠的配比制方案。 */
export function rationPlan(speciesId, weightKg) {
  const model = SPECIES[speciesId]?.energyModel;
  if (model?.type !== 'ration') return null;
  const kg = Number(weightKg) || 0;
  return {
    hay: model.hay ?? null,
    items: model.rations.map((r) => ({
      name: r.name,
      grams: r.gPerKg == null ? null : Math.round(r.gPerKg * kg),
      note: r.note,
    })),
  };
}

/** 鸟类的成分占比方案。 */
export function ratioPlan(speciesId, weightKg) {
  const model = SPECIES[speciesId]?.energyModel;
  if (model?.type !== 'ratio') return null;
  const kg = Number(weightKg) || 0;
  const daily = Math.round(model.dailyGramsPerKg * kg * 10) / 10;
  return {
    dailyGrams: daily,
    items: model.composition.map((c) => ({
      name: c.name,
      pct: c.pct,
      grams: Math.round(((daily * (c.pct[0] + c.pct[1])) / 2 / 100) * 10) / 10,
      note: c.note,
    })),
  };
}

/** 蛇类的猎物制方案。 */
export function preyPlan(speciesId, weightKg, stageId = 'adult') {
  const model = SPECIES[speciesId]?.energyModel;
  if (model?.type !== 'prey') return null;
  const kg = Number(weightKg) || 0;
  const [lo, hi] = model.preyRatio;
  return {
    preyGrams: { min: Math.round(lo * kg * 1000), max: Math.round(hi * kg * 1000) },
    interval: model.intervals[stageId] ?? model.intervals.adult,
    waterNote: model.waterNote,
  };
}

/** 爬宠的投喂节律方案。 */
export function schedulePlan(speciesId, stageId = 'adult') {
  const model = SPECIES[speciesId]?.energyModel;
  if (model?.type !== 'schedule') return null;
  const row = model.schedules.find((s) => s.stage === stageId) ?? model.schedules[model.schedules.length - 1];
  return { text: row.text, supplements: model.supplements, waterNote: model.waterNote };
}

/**
 * 统一入口：给一只宠物算出完整饮食处方。
 * @param {object} pet {species, breed, weightKg, ageMonths, neutered, goal, food:{...}}
 */
export function feedingPlan(pet) {
  const sp = SPECIES[pet.species];
  if (!sp) return null;
  const stage = resolveStage(pet.species, pet.ageMonths);
  const model = sp.energyModel;
  const plan = {
    species: sp.name,
    stage: stage?.name,
    stageId: stage?.id,
    modelType: model.type,
    keyNutrients: model.keyNutrients ?? [],
    water: waterTarget(pet.species, pet.weightKg),
  };

  if (model.type === 'kcal') {
    const energy = dailyEnergy(pet.species, pet.weightKg, {
      stageId: stage?.id,
      neutered: pet.neutered !== false,
      goal: pet.goal ?? 'maintain',
    });
    plan.energy = energy;
    plan.portions = portionPlan({ kcal: energy.kcal, ...(pet.food ?? {}) });
    plan.treatCap = treatCap(energy.kcal, pet.species);
  } else if (model.type === 'ration') {
    plan.ration = rationPlan(pet.species, pet.weightKg);
  } else if (model.type === 'ratio') {
    plan.ratio = ratioPlan(pet.species, pet.weightKg);
  } else if (model.type === 'prey') {
    plan.prey = preyPlan(pet.species, pet.weightKg, stage?.id);
  } else if (model.type === 'schedule') {
    plan.schedule = schedulePlan(pet.species, stage?.id);
  }
  return plan;
}

// ── 体况评估 ────────────────────────────────────────────────────

/** 与品种标准体重比较，给出体况判断。 */
export function bodyCondition(speciesId, breed, weightKg) {
  const std = breedStandard(speciesId, breed);
  const kg = Number(weightKg);
  if (!std || !(kg > 0)) return { level: 'unknown', label: '缺少品种标准，建议用体况评分（BCS）触摸肋骨判断', std: null };

  const mid = (std.min + std.max) / 2;
  const pct = Math.round(((kg - mid) / mid) * 100);
  let level = 'ideal';
  if (kg < std.min * 0.9) level = 'thin';
  else if (kg < std.min) level = 'lean';
  else if (kg <= std.max) level = 'ideal';
  else if (kg <= std.max * 1.15) level = 'over';
  else level = 'obese';

  const labels = {
    thin: '偏瘦：需排查寄生虫、牙病、甲状腺与慢性消耗性疾病',
    lean: '略低于标准：如精神食欲正常可观察，同时确认摄入热量是否足够',
    ideal: '标准区间：保持当前喂养方式，继续每月称重',
    over: '超重：先减 10% 热量并增加活动，四周后复称',
    obese: '肥胖：肥胖是疾病而非可爱，请在兽医监督下制定减重方案',
  };
  return { level, label: labels[level], std, pctFromMid: pct };
}

// ── 粮食标签评测 ────────────────────────────────────────────────

const BAD_INGREDIENTS = [
  { kw: ['乙氧基喹啉', 'ethoxyquin'], note: '争议性人工防腐剂' },
  { kw: ['bha', 'bht'], note: '人工抗氧化剂，优选维生素E（混合生育酚）' },
  { kw: ['肉粉', '肉骨粉', '副产品', '4d'], note: '来源不明确的动物原料' },
  { kw: ['诱食剂', '香精', '甜味剂', '糖', '焦糖'], note: '掩盖原料品质的添加物' },
];
const FILLER_INGREDIENTS = ['玉米', '小麦', '大豆', '麸皮', '米糠', '木薯', '豌豆蛋白'];

/**
 * 把包装上的"营养成分保证值"换算成干物质基础（DM）并评级。
 * 干物质换算是看懂粮袋的关键：湿粮蛋白标 10% 不代表比干粮的 32% 差，
 * 因为湿粮 78% 是水。
 *
 * @param {object} label {species, protein, fat, fiber, ash, moisture, ingredients:string}
 */
export function gradeLabel(label) {
  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const species = label.species ?? 'cat';
  const moisture = num(label.moisture) || 10;
  const dm = Math.max(100 - moisture, 1);
  const toDm = (v) => Math.round((num(v) / dm) * 1000) / 10;

  const dmValues = {
    protein: toDm(label.protein),
    fat: toDm(label.fat),
    fiber: toDm(label.fiber),
    ash: toDm(label.ash),
  };
  // NFE（无氮浸出物）≈ 碳水，按差减法估算
  const carb = Math.round(
    Math.max(100 - dmValues.protein - dmValues.fat - dmValues.fiber - dmValues.ash, 0) * 10,
  ) / 10;
  dmValues.carb = carb;

  // 改良 Atwater 系数，估算能量密度
  const kcalPer100g = Math.round(
    3.5 * (num(label.protein)) + 8.5 * num(label.fat) +
    3.5 * Math.max(100 - num(label.protein) - num(label.fat) - num(label.fiber) - num(label.ash) - moisture, 0),
  );

  const notes = [];
  let score = 60;

  const proteinTarget = species === 'cat' ? 40 : 28;
  if (dmValues.protein >= proteinTarget) {
    score += 20;
    notes.push({ tone: 'good', text: `干物质蛋白 ${dmValues.protein}%，达到${species === 'cat' ? '猫（≥40%）' : '犬（≥28%）'}的理想区间` });
  } else if (dmValues.protein >= proteinTarget - 8) {
    score += 8;
    notes.push({ tone: 'warn', text: `干物质蛋白 ${dmValues.protein}%，达到基本需求但不算充裕` });
  } else {
    score -= 15;
    notes.push({ tone: 'bad', text: `干物质蛋白仅 ${dmValues.protein}%，对${species === 'cat' ? '严格肉食的猫' : '犬'}偏低` });
  }

  if (dmValues.fat < 9) {
    score -= 8;
    notes.push({ tone: 'warn', text: `干物质脂肪 ${dmValues.fat}%，偏低，可能影响皮毛与适口性` });
  } else if (dmValues.fat > 28) {
    score -= 5;
    notes.push({ tone: 'warn', text: `干物质脂肪 ${dmValues.fat}%，偏高，易增重或诱发胰腺炎（除幼年/高运动量）` });
  } else {
    score += 8;
    notes.push({ tone: 'good', text: `干物质脂肪 ${dmValues.fat}%，在合理区间` });
  }

  if (carb >= 30) {
    score -= 12;
    notes.push({ tone: 'bad', text: `估算碳水约 ${carb}%，偏高（多来自谷物/豆类填充），猫尤其应控制` });
  } else if (carb <= 18) {
    score += 10;
    notes.push({ tone: 'good', text: `估算碳水约 ${carb}%，属低碳配方` });
  }

  const ing = String(label.ingredients ?? '').toLowerCase();
  if (ing) {
    const firstThree = ing.split(/[,，、]/).slice(0, 3).join('|');
    const meatFirst = /鲜肉|鸡肉|鸭肉|牛肉|羊肉|鱼|三文鱼|鳕鱼|火鸡|冻干肉|chicken|beef|salmon|duck/.test(firstThree);
    if (meatFirst) {
      score += 12;
      notes.push({ tone: 'good', text: '配料表前三位含明确肉源，原料结构合理' });
    } else {
      score -= 10;
      notes.push({ tone: 'bad', text: '配料表前三位没有明确的肉源，蛋白可能主要来自植物' });
    }
    for (const f of FILLER_INGREDIENTS) {
      if (firstThree.includes(f)) {
        score -= 5;
        notes.push({ tone: 'warn', text: `前三位出现「${f}」，属于低成本填充原料` });
        break;
      }
    }
    for (const bad of BAD_INGREDIENTS) {
      if (bad.kw.some((k) => ing.includes(k))) {
        score -= 10;
        notes.push({ tone: 'bad', text: `检出「${bad.kw[0]}」：${bad.note}` });
      }
    }
    if (/维生素e|混合生育酚|vitamin e|tocopherol|迷迭香/.test(ing)) {
      score += 5;
      notes.push({ tone: 'good', text: '使用天然抗氧化剂（维生素E/迷迭香提取物）' });
    }
  } else {
    notes.push({ tone: 'neutral', text: '未填写配料表，评分仅基于营养成分表' });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : 'D';
  return { dm: dmValues, kcalPer100g, score, grade, notes };
}

/** 换粮过渡表：避免"直接换粮"造成腹泻与拒食。 */
export function transitionPlan(days = 7) {
  const n = Math.max(3, Math.min(Number(days) || 7, 14));
  return Array.from({ length: n }, (_, i) => {
    const newPct = Math.round(((i + 1) / n) * 100);
    return { day: i + 1, oldPct: 100 - newPct, newPct };
  });
}
