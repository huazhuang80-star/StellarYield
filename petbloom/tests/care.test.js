import { test } from 'node:test';
import assert from 'node:assert/strict';

import { SPECIES, SPECIES_LIST, resolveStage, breedStandard, breedRisks } from '../src/data/species.js';
import { dailyTasks, vaccineStatus, seasonFor, buildAlerts, weightTrend } from '../src/lib/alerts.js';
import { stageForDays, gardenHealth, streakDays, earnedBadges, easterEgg } from '../src/lib/growth.js';
import { project } from '../src/lib/projection.js';
import { prioritizeMyths, MYTHS } from '../src/data/myths.js';
import { feedingPlan } from '../src/lib/nutrition.js';

test('每个物种档案都具备完整的必填结构', () => {
  for (const sp of SPECIES_LIST) {
    assert.ok(sp.name && sp.emoji && sp.theme, sp.id);
    assert.ok(sp.stages.length >= 2, sp.id);
    assert.ok(sp.care.length >= 3, sp.id);
    assert.ok(sp.env.length >= 2, sp.id);
    assert.ok(sp.energyModel?.type, sp.id);
    // 每个物种都能算出一份可用的饮食方案
    const plan = feedingPlan({ species: sp.id, weightKg: 1, ageMonths: 24 });
    assert.ok(plan && plan.modelType, sp.id);
  }
});

test('生命阶段按月龄解析', () => {
  assert.equal(resolveStage('cat', 2).id, 'baby');
  assert.equal(resolveStage('cat', 8).id, 'junior');
  assert.equal(resolveStage('cat', 30).id, 'adult');
  assert.equal(resolveStage('cat', 120).id, 'senior');
  assert.equal(resolveStage('nope', 10), null);
});

test('品种标准与风险可查，未知品种安全降级', () => {
  assert.deepEqual(breedStandard('cat', '布偶猫'), { min: 4.5, max: 9 });
  assert.equal(breedStandard('cat', '未知'), null);
  assert.ok(breedRisks('dog', '柯基').some((r) => r.includes('椎间盘')));
  assert.deepEqual(breedRisks('dog', '未知'), []);
});

test('每日任务只包含当天该做的项', () => {
  const monday = new Date('2026-07-27T09:00:00'); // 周一
  const tasks = dailyTasks({ species: 'cat' }, monday);
  const ids = tasks.map((t) => t.id);
  assert.ok(ids.includes('litter'));
  assert.ok(!ids.includes('eyes')); // 周检放在周日
});

test('换毛季会强调梳毛任务', () => {
  const april = new Date('2026-04-10T09:00:00');
  const july = new Date('2026-07-10T09:00:00');
  const brushApril = dailyTasks({ species: 'cat' }, april).find((t) => t.id === 'brush');
  const brushJuly = dailyTasks({ species: 'cat' }, july).find((t) => t.id === 'brush');
  assert.equal(brushApril.emphasize, true);
  assert.equal(brushJuly.emphasize, false);
});

test('疫苗状态区分已完成 / 已到期 / 未到期', () => {
  const pet = { species: 'cat', vaccines: { fvrcp1: '2026-01-01' } };
  const rows = vaccineStatus(pet, 3);
  assert.equal(rows.find((r) => r.id === 'fvrcp1').state, 'done');
  assert.equal(rows.find((r) => r.id === 'fvrcp2').state, 'overdue');
  assert.equal(rows.find((r) => r.id === 'booster1').state, 'upcoming');
});

test('季节按月份匹配', () => {
  assert.equal(seasonFor(new Date('2026-07-15T00:00:00')).id, 'summer');
  assert.equal(seasonFor(new Date('2026-01-15T00:00:00')).id, 'winter');
});

test('饮水偏低会产生预警', () => {
  const pet = { species: 'cat', breed: '英国短毛猫', weightKg: 4.2 };
  const logs = [{ date: '2026-07-30', waterMl: 100, taskIds: [] }];
  const alerts = buildAlerts(pet, logs, 14, null);
  assert.ok(alerts.some((a) => a.title.includes('饮水量偏低')));
});

test('肥胖与月度体重骤变都会被预警', () => {
  const pet = { species: 'cat', breed: '英国短毛猫', weightKg: 7 };
  const logs = [
    { date: '2026-07-30', weightKg: 7 },
    { date: '2026-06-25', weightKg: 6 },
  ];
  const alerts = buildAlerts(pet, logs, 30, null);
  assert.ok(alerts.some((a) => a.title.includes('肥胖')));
  assert.ok(alerts.some((a) => a.title.includes('体重变化')));
});

test('体重趋势需要足够时间跨度才计算', () => {
  assert.equal(weightTrend([{ date: '2026-07-30', weightKg: 4 }]), null);
  const t = weightTrend([
    { date: '2026-07-30', weightKg: 4.4 },
    { date: '2026-07-01', weightKg: 4.0 },
  ]);
  assert.equal(t.pct, 10);
});

test('老年期与阶段切换会给出提示', () => {
  const senior = buildAlerts({ species: 'cat', weightKg: 4 }, [], 100, null);
  assert.ok(senior.some((a) => a.title.includes('老年期')));
  const junior = buildAlerts({ species: 'cat', weightKg: 4 }, [], 11, null);
  assert.ok(junior.some((a) => a.title.includes('成年期')));
});

test('花园阶段按陪伴天数推进', () => {
  assert.equal(stageForDays(1).id, 'sprout');
  assert.equal(stageForDays(20).id, 'root');
  assert.equal(stageForDays(100).id, 'grow');
  assert.equal(stageForDays(300).id, 'bloom');
  assert.equal(stageForDays(1000).id, 'mature');
  assert.equal(stageForDays(4000).id, 'autumn');
});

test('花园健康度反映任务完成率，且无记录时不惩罚', () => {
  const none = gardenHealth([]);
  assert.equal(none.score, 50);
  const good = gardenHealth(Array.from({ length: 14 }, (_, i) => ({ date: `2026-07-${16 + i}`, tasksDone: 4, tasksTotal: 4 })));
  assert.ok(good.score >= 85);
  const poor = gardenHealth([{ date: '2026-07-30', tasksDone: 0, tasksTotal: 4 }]);
  assert.ok(poor.score < 60);
});

test('今天还没打卡不会打断已有连续记录', () => {
  const logs = [
    { date: '2026-07-30', tasksDone: 0, tasksTotal: 4 },
    { date: '2026-07-29', tasksDone: 4, tasksTotal: 4 },
    { date: '2026-07-28', tasksDone: 4, tasksTotal: 4 },
  ];
  assert.equal(streakDays(logs, '2026-07-30'), 2);
});

test('徽章按统计条件解锁', () => {
  const stats = {
    pet: { name: '布丁', species: 'cat', unlockedSignals: new Array(20).fill('x') },
    logs: new Array(30).fill({ foodGrams: 40 }),
    daysTogether: 400,
    speciesCount: 1,
    triageWithSummary: 1,
    groomStreak: 8,
    playDays: 30,
    idealWeighIns: 3,
    vaccinesDone: 3,
    vaccinesOverdue: 0,
    seniorPlanOn: false,
  };
  const earned = earnedBadges(stats).filter((b) => b.earned).map((b) => b.id);
  assert.ok(earned.includes('firstRecord'));
  assert.ok(earned.includes('nutritionMaster'));
  assert.ok(earned.includes('oneYear'));
  assert.ok(!earned.includes('seniorCare'));
  assert.ok(!earned.includes('multiSpecies'));
});

test('彩蛋在特殊时刻触发，平常保持安静', () => {
  assert.match(easterEgg({ isBirthday: true, petName: '布丁' }), /生日/);
  assert.match(easterEgg({ daysTogether: 1, petName: '布丁' }), /回家/);
  assert.match(easterEgg({ hour: 3, petName: '布丁' }), /这么晚/);
  assert.equal(easterEgg({ daysTogether: 42, hour: 14 }), null);
});

test('预测器识别风险并给出双未来与可执行改动', () => {
  const risky = project({ feedingStyle: 'free', weightTrend: 'up', dental: 'never', exercise: 'little', vetCheck: 'never', speciesId: 'cat', ageMonths: 24 });
  assert.equal(risky.level, 'high');
  assert.equal(risky.dark.length, 3);
  assert.equal(risky.bright.length, 3);
  assert.ok(risky.dark[2].items.length > 0);
  assert.ok(risky.levers.length >= 4);

  const solid = project({ feedingStyle: 'measured', weightTrend: 'stable', dental: 'daily', exercise: 'enough', vetCheck: 'annual', groom: 'daily', speciesId: 'cat', ageMonths: 24 });
  assert.equal(solid.risks.length, 0);
  assert.equal(solid.level, 'minimal');
  // 即使没有风险，也仍然给出"每月称重"这类基础建议
  assert.ok(solid.levers.length >= 1);
});

test('非计划性体重下降被当成高权重风险', () => {
  const p = project({ weightTrend: 'down', ageMonths: 36, speciesId: 'dog' });
  assert.ok(p.risks.some((r) => r.now.includes('体重下降')));
});

test('认知漏洞按认同度排序，0 分项不进入清单', () => {
  const scores = { fatIsCute: 8, humanFoodOk: 3, washOften: 0 };
  const list = prioritizeMyths(scores);
  assert.equal(list[0].myth.id, 'fatIsCute');
  assert.equal(list.length, 2);
  assert.equal(MYTHS.length, 6);
});

test('每条认知漏洞都有可执行的练习与检验标准', () => {
  for (const m of MYTHS) {
    assert.ok(m.truth.length > 20, m.id);
    assert.ok(m.practice.length >= 3, m.id);
    assert.ok(m.metric, m.id);
  }
});
