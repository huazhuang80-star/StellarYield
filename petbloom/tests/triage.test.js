import { test } from 'node:test';
import assert from 'node:assert/strict';

import { evaluate, vetSummary } from '../src/lib/triage.js';
import { searchFoods, verdictFor, toxicListFor, FOODS } from '../src/data/foods.js';

const normal = { energy: 'normal', appetite: 'normal', water: 'normal', vomit: 'none', stool: 'normal', urine: 'normal', breathing: 'normal', gums: 'pink', flags: [] };

test('全部正常时判为可在家观察', () => {
  const r = evaluate(normal, { species: 'cat' });
  assert.equal(r.level, 'green');
});

test('呼吸困难在任何物种都是红灯', () => {
  for (const species of ['cat', 'dog', 'rabbit', 'parrot', 'snake']) {
    const r = evaluate({ ...normal, breathing: 'labored' }, { species });
    assert.equal(r.level, 'red', species);
  }
});

test('公猫排尿困难判为立即急诊（尿道阻塞）', () => {
  const r = evaluate({ ...normal, urine: 'straining' }, { species: 'cat', sex: 'male' });
  assert.equal(r.level, 'red');
  assert.ok(r.reasons.some((x) => x.reason.includes('尿')));
});

test('同样的排尿困难在犬不套用猫的阻塞规则', () => {
  const dog = evaluate({ ...normal, urine: 'straining' }, { species: 'dog' });
  assert.notEqual(dog.level, 'red');
});

test('兔子停食 12 小时是急症，蛇拒食则可观察', () => {
  const rabbit = evaluate({ ...normal, appetite: 'none12' }, { species: 'rabbit' });
  assert.equal(rabbit.level, 'red');
  assert.ok(rabbit.reasons.some((x) => x.detail.includes('胃肠停滞')));

  const snake = evaluate({ ...normal, appetite: 'none12' }, { species: 'snake' });
  assert.equal(snake.level, 'green');
});

test('猫 24 小时不吃是黄灯，48 小时升为红灯', () => {
  assert.equal(evaluate({ ...normal, appetite: 'none24' }, { species: 'cat' }).level, 'yellow');
  assert.equal(evaluate({ ...normal, appetite: 'none48' }, { species: 'cat' }).level, 'red');
});

test('犬反复干呕按胃扭转处理，猫则为黄灯', () => {
  assert.equal(evaluate({ ...normal, vomit: 'unproductive' }, { species: 'dog' }).level, 'red');
  assert.equal(evaluate({ ...normal, vomit: 'unproductive' }, { species: 'cat' }).level, 'yellow');
});

test('鸟类只要出现可见异常即按急诊处理', () => {
  const r = evaluate({ ...normal, energy: 'lethargic' }, { species: 'parrot' });
  assert.equal(r.level, 'red');
});

test('一票否决信号直接触发红灯', () => {
  for (const flag of ['seizure', 'trauma', 'toxin', 'bloat', 'heat', 'bleeding', 'dystocia', 'eye', 'object']) {
    const r = evaluate({ ...normal, flags: [flag] }, { species: 'dog' });
    assert.equal(r.level, 'red', flag);
  }
});

test('规则冲突时取最严重的一级', () => {
  const r = evaluate({ ...normal, stool: 'soft', breathing: 'openMouth' }, { species: 'cat' });
  assert.equal(r.level, 'red');
  // 绿灯规则不会出现在结论理由里
  assert.ok(!r.reasons.some((x) => x.level === 'green'));
});

test('多饮多尿被识别为需要就医的内分泌信号', () => {
  const r = evaluate({ ...normal, water: 'more', urine: 'more' }, { species: 'cat' });
  assert.equal(r.level, 'yellow');
});

test('未作答项目会被回报，方便补充', () => {
  const r = evaluate({ flags: [] }, { species: 'cat' });
  assert.equal(r.unanswered.length, 8);
});

test('每个等级都有对应的行动清单', () => {
  for (const answers of [normal, { ...normal, stool: 'diarrhea' }, { ...normal, gums: 'pale' }]) {
    const r = evaluate(answers, { species: 'cat' });
    assert.ok(Array.isArray(r.actions) && r.actions.length > 0);
  }
});

test('就医摘要包含关键信息且不含诊断结论', () => {
  const answers = { ...normal, vomit: 'repeated', energy: 'lethargic' };
  const result = evaluate(answers, { species: 'cat' });
  const text = vetSummary({
    pet: { name: '布丁', species: 'cat', breed: '英国短毛猫', ageMonths: 14, weightKg: 4.2, sex: 'male', neutered: true },
    answers,
    result,
    recentLogs: [{ date: '2026-07-29', weightKg: 4.2, foodGrams: 40, note: '食欲下降' }],
    now: '2026-07-30 03:00',
  });
  assert.match(text, /布丁/);
  assert.match(text, /英国短毛猫/);
  assert.match(text, /立即急诊|24 小时内就医/);
  assert.match(text, /2026-07-29/);
  assert.match(text, /不含诊断结论/);
  // 正常项不该污染摘要
  assert.doesNotMatch(text, /排便：正常成形/);
});

// ── 食物库 ────────────────────────────────────────────────

test('胡萝卜对狗安全、对兔子限量、对龙猫不建议', () => {
  const carrot = FOODS.find((f) => f.id === 'carrot');
  assert.equal(verdictFor(carrot, 'dog'), 'safe');
  assert.equal(verdictFor(carrot, 'rabbit'), 'limit');
  assert.equal(verdictFor(carrot, 'chinchilla'), 'avoid');
});

test('未收录物种的结论按资料不足处理，而不是默认安全', () => {
  const carrot = FOODS.find((f) => f.id === 'carrot');
  assert.equal(verdictFor(carrot, 'unknownSpecies'), 'unknown');
});

test('未指定物种时取最严重结论', () => {
  const grape = FOODS.find((f) => f.id === 'grape');
  assert.equal(verdictFor(grape, null), 'toxic');
});

test('搜索支持别名并把危险结果排在前面', () => {
  const hits = searchFoods('提子', 'dog');
  assert.ok(hits.length > 0);
  assert.equal(hits[0].food.id, 'grape');

  const mixed = searchFoods('', 'cat');
  const ranks = mixed.map((h) => h.verdict);
  assert.equal(ranks[0], 'toxic');
});

test('每个物种都有非空的禁区清单', () => {
  for (const species of ['cat', 'dog', 'rabbit', 'parrot', 'lizard']) {
    assert.ok(toxicListFor(species).length >= 5, species);
  }
});

test('猫的禁区包含葱属、巧克力、百合与人用止痛药', () => {
  const ids = toxicListFor('cat').map((f) => f.id);
  for (const id of ['allium', 'chocolate', 'lily', 'humanPainkiller']) {
    assert.ok(ids.includes(id), id);
  }
});
