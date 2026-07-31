import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  reset,
  addPet,
  updatePet,
  activePet,
  setActivePet,
  removePet,
  getLog,
  saveLog,
  toggleTask,
  logsFor,
  weightSeries,
  recordTriage,
  triagesFor,
  markTriageSummarized,
  unlockSignal,
  statsFor,
  ageInMonths,
  ageLabel,
  formatAge,
  daysBetween,
  today,
} from '../src/lib/store.js';

test('月龄由生日推算，未满月不进位', () => {
  assert.equal(ageInMonths({ birthday: '2025-05-20' }, '2026-07-30'), 14);
  assert.equal(ageInMonths({ birthday: '2026-07-31' }, '2026-08-30'), 0);
  assert.equal(ageInMonths({ ageMonths: 9 }, '2026-07-30'), 9);
});

test('年龄展示在完全没有信息时如实说未填', () => {
  assert.equal(ageLabel({}), '年龄未填');
  assert.equal(ageLabel({ birthday: '2025-07-30' }, '2026-07-30'), '1 岁');
  assert.equal(formatAge(14), '1 岁 2 个月');
  assert.equal(formatAge(5), '5 个月');
});

test('陪伴天数不会出现负数', () => {
  assert.equal(daysBetween('2026-07-01', '2026-07-30'), 29);
  assert.equal(daysBetween('2026-08-30', '2026-07-30'), 0);
  assert.equal(daysBetween(''), 0);
});

test('建档后自动成为当前宠物，并带上完整默认字段', () => {
  reset();
  const pet = addPet({ name: '布丁', species: 'cat', weightKg: 4.2 });
  assert.equal(activePet().id, pet.id);
  assert.equal(pet.homecoming, today());
  assert.deepEqual(pet.unlockedSignals, []);
  assert.ok(pet.food.dryKcalPer100g > 0);
});

test('多宠切换与删除会正确维护当前宠物', () => {
  reset();
  const a = addPet({ name: 'A', species: 'cat' });
  const b = addPet({ name: 'B', species: 'rabbit' });
  assert.equal(activePet().id, b.id);
  setActivePet(a.id);
  assert.equal(activePet().id, a.id);
  assert.equal(statsFor(a.id).speciesCount, 2);
  removePet(a.id);
  assert.equal(activePet().id, b.id);
});

test('每日记录可重复写入同一天而不产生重复条目', () => {
  reset();
  const pet = addPet({ name: '布丁', species: 'cat' });
  saveLog(pet.id, today(), { weightKg: 4.2, waterMl: 180 });
  saveLog(pet.id, today(), { foodGrams: 45 });
  const logs = logsFor(pet.id);
  assert.equal(logs.length, 1);
  assert.equal(logs[0].weightKg, 4.2);
  assert.equal(logs[0].foodGrams, 45);
});

test('任务勾选可切换，并记录当日任务总数', () => {
  reset();
  const pet = addPet({ name: '布丁', species: 'cat' });
  toggleTask(pet.id, 'litter', 4);
  assert.deepEqual(getLog(pet.id).taskIds, ['litter']);
  toggleTask(pet.id, 'litter', 4);
  assert.deepEqual(getLog(pet.id).taskIds, []);
  assert.equal(getLog(pet.id).tasksTotal, 4);
});

test('体重序列按时间正序，只取有值的记录', () => {
  reset();
  const pet = addPet({ name: '布丁', species: 'cat' });
  saveLog(pet.id, '2026-07-01', { weightKg: 4.0 });
  saveLog(pet.id, '2026-07-15', { waterMl: 200 });
  saveLog(pet.id, '2026-07-30', { weightKg: 4.3 });
  assert.deepEqual(weightSeries(pet.id), [
    { date: '2026-07-01', kg: 4.0 },
    { date: '2026-07-30', kg: 4.3 },
  ]);
});

test('自查记录倒序保存，摘要标记用于徽章统计', () => {
  reset();
  const pet = addPet({ name: '布丁', species: 'cat' });
  recordTriage(pet.id, { level: 'green', answers: {} });
  recordTriage(pet.id, { level: 'red', answers: {} });
  assert.equal(triagesFor(pet.id)[0].level, 'red');
  assert.equal(statsFor(pet.id).triageWithSummary, 0);
  markTriageSummarized(pet.id);
  assert.equal(statsFor(pet.id).triageWithSummary, 1);
});

test('行为图鉴解锁可反复切换', () => {
  reset();
  const pet = addPet({ name: '布丁', species: 'cat' });
  unlockSignal(pet.id, '缓慢眨眼');
  assert.deepEqual(activePet().unlockedSignals, ['缓慢眨眼']);
  unlockSignal(pet.id, '缓慢眨眼');
  assert.deepEqual(activePet().unlockedSignals, []);
});

test('统计汇总出梳毛连续天数与陪玩天数', () => {
  reset();
  const pet = addPet({ name: '布丁', species: 'cat', homecoming: '2026-07-01' });
  saveLog(pet.id, '2026-07-30', { taskIds: ['brush', 'play'], tasksTotal: 4 });
  saveLog(pet.id, '2026-07-29', { taskIds: ['brush'], tasksTotal: 4 });
  saveLog(pet.id, '2026-07-28', { taskIds: ['litter'], tasksTotal: 4 });
  const stats = statsFor(pet.id);
  assert.equal(stats.groomStreak, 2);
  assert.equal(stats.playDays, 1);
  assert.ok(stats.daysTogether >= 29);
});

test('更新宠物字段不影响其他宠物', () => {
  reset();
  const a = addPet({ name: 'A', species: 'cat', weightKg: 4 });
  const b = addPet({ name: 'B', species: 'cat', weightKg: 5 });
  updatePet(a.id, { weightKg: 4.5 });
  assert.equal(statsFor(a.id).pet.weightKg, 4.5);
  assert.equal(statsFor(b.id).pet.weightKg, 5);
  assert.equal(updatePet('missing', { weightKg: 1 }), null);
});
