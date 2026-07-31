import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  rer,
  pickFactor,
  dailyEnergy,
  waterTarget,
  treatCap,
  portionPlan,
  rationPlan,
  ratioPlan,
  preyPlan,
  schedulePlan,
  feedingPlan,
  bodyCondition,
  gradeLabel,
  transitionPlan,
} from '../src/lib/nutrition.js';

test('RER 遵循 70 × 体重^0.75', () => {
  assert.equal(Math.round(rer(4)), Math.round(70 * Math.pow(4, 0.75)));
  assert.equal(rer(0), 0);
  assert.equal(rer(-2), 0);
  assert.equal(rer('abc'), 0);
});

test('生长期优先于减重目标（幼年动物不做减重）', () => {
  const f = pickFactor('cat', { stageId: 'baby', goal: 'lose' });
  assert.equal(f.key, 'baby');
});

test('绝育状态影响成年系数', () => {
  const neutered = pickFactor('cat', { stageId: 'adult', neutered: true });
  const intact = pickFactor('cat', { stageId: 'adult', neutered: false });
  assert.ok(neutered.factor < intact.factor);
});

test('4.2kg 已绝育成猫的日需热量落在兽医常用区间', () => {
  const e = dailyEnergy('cat', 4.2, { stageId: 'adult', neutered: true });
  assert.equal(e.factor, 1.2);
  assert.ok(e.kcal > 180 && e.kcal < 260, `实际 ${e.kcal}`);
});

test('非热量制物种不返回热量结果', () => {
  assert.equal(dailyEnergy('rabbit', 2), null);
  assert.equal(dailyEnergy('snake', 1.5), null);
});

test('饮水目标按体重线性折算', () => {
  const w = waterTarget('cat', 4);
  assert.deepEqual(w, { min: 180, max: 240 });
  assert.equal(waterTarget('cat', 0), null);
});

test('零食上限为日粮 10%', () => {
  assert.equal(treatCap(220, 'cat'), 22);
});

test('分餐计算：干湿粮热量相加等于扣除零食后的总量', () => {
  const p = portionPlan({ kcal: 220, wetRatio: 0.3 });
  assert.equal(p.treat.kcal, 22);
  assert.equal(p.dry.kcal + p.wet.kcal, 198);
  assert.ok(p.dry.grams > 0 && p.wet.grams > 0);
  assert.ok(p.wet.cans > 0);
});

test('湿粮比例为 0 时全部由干粮承担', () => {
  const p = portionPlan({ kcal: 200, wetRatio: 0 });
  assert.equal(p.wet.grams, 0);
  assert.ok(p.dry.grams > 0);
});

test('草食小宠用配比制：干草无限量，其余按体重折算', () => {
  const r = rationPlan('rabbit', 2);
  const hay = r.items.find((i) => i.name.includes('干草'));
  const pellet = r.items.find((i) => i.name.includes('兔粮'));
  assert.equal(hay.grams, null);
  assert.equal(pellet.grams, 50); // 25 g/kg × 2kg
});

test('鸟类用占比制', () => {
  const r = ratioPlan('parrot', 0.1);
  assert.ok(r.dailyGrams > 0);
  assert.equal(r.items.length, 3);
  assert.deepEqual(r.items[0].pct, [60, 70]);
});

test('蛇按体重比例投喂猎物', () => {
  const p = preyPlan('snake', 1.5, 'adult');
  assert.deepEqual(p.preyGrams, { min: 150, max: 225 });
  assert.match(p.interval, /天/);
});

test('爬宠按阶段给投喂节律与补充剂', () => {
  const baby = schedulePlan('lizard', 'baby');
  const adult = schedulePlan('lizard', 'adult');
  assert.notEqual(baby.text, adult.text);
  assert.ok(adult.supplements.some((s) => s.name.includes('钙')));
});

test('feedingPlan 按物种分派到正确的模型', () => {
  assert.equal(feedingPlan({ species: 'cat', weightKg: 4, ageMonths: 24 }).modelType, 'kcal');
  assert.equal(feedingPlan({ species: 'rabbit', weightKg: 2, ageMonths: 24 }).modelType, 'ration');
  assert.equal(feedingPlan({ species: 'parrot', weightKg: 0.1, ageMonths: 24 }).modelType, 'ratio');
  assert.equal(feedingPlan({ species: 'snake', weightKg: 1.5, ageMonths: 24 }).modelType, 'prey');
  assert.equal(feedingPlan({ species: 'turtle', weightKg: 1, ageMonths: 24 }).modelType, 'schedule');
  assert.equal(feedingPlan({ species: 'nope', weightKg: 1 }), null);
});

test('体况评估对照品种标准', () => {
  assert.equal(bodyCondition('cat', '英国短毛猫', 4.2).level, 'ideal');
  assert.equal(bodyCondition('cat', '英国短毛猫', 7).level, 'obese');
  assert.equal(bodyCondition('cat', '英国短毛猫', 2.8).level, 'thin');
  assert.equal(bodyCondition('cat', '不存在的品种', 4).level, 'unknown');
});

test('标签评测把成分换算到干物质基础', () => {
  // 湿粮：蛋白 10%、水分 78% → 干物质蛋白约 45%
  const wet = gradeLabel({ species: 'cat', protein: 10, fat: 5, fiber: 1, ash: 2, moisture: 78 });
  assert.ok(wet.dm.protein > 44 && wet.dm.protein < 46, `实际 ${wet.dm.protein}`);
  assert.ok(['A', 'B'].includes(wet.grade));
});

test('高碳水低蛋白干粮评级明显更低', () => {
  const good = gradeLabel({ species: 'cat', protein: 42, fat: 18, fiber: 3, ash: 7, moisture: 10, ingredients: '鲜鸡肉,鸡肉粉,鹰嘴豆,混合生育酚' });
  const bad = gradeLabel({ species: 'cat', protein: 26, fat: 9, fiber: 5, ash: 8, moisture: 10, ingredients: '玉米,小麦,肉粉,BHA' });
  assert.ok(good.score > bad.score + 20, `${good.score} vs ${bad.score}`);
  assert.equal(bad.grade, 'D');
  assert.ok(bad.notes.some((n) => n.text.includes('bha') || n.text.includes('BHA')));
});

test('缺少配料表时给出提示但仍可评分', () => {
  const r = gradeLabel({ species: 'dog', protein: 30, fat: 15, fiber: 3, ash: 7, moisture: 10 });
  assert.ok(r.notes.some((n) => n.text.includes('未填写配料表')));
  assert.ok(r.score > 0);
});

test('换粮过渡表首尾比例正确并被限制在 3-14 天', () => {
  const p = transitionPlan(7);
  assert.equal(p.length, 7);
  assert.equal(p[6].newPct, 100);
  assert.equal(p[0].oldPct + p[0].newPct, 100);
  assert.equal(transitionPlan(1).length, 3);
  assert.equal(transitionPlan(99).length, 14);
});
