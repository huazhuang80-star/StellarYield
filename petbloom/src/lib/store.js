/**
 * 本地状态存储。
 *
 * MVP 阶段刻意不做账号与云端：宠物健康数据敏感，先让它只留在用户设备上，
 * 同时保证离线可用（症状自查最需要的时刻，可能正是信号不好的凌晨三点）。
 * 数据结构保持扁平且可序列化，未来接后端时直接同步这份 JSON 即可。
 */

const KEY = 'petbloom.state.v1';

const EMPTY = {
  version: 2,
  pets: [],
  activePetId: null,
  logs: {},        // petId -> [{date, taskIds, tasksTotal, weightKg, foodGrams, waterMl, note}]
  triages: {},     // petId -> [{date, level, answers, summarized}]
  // 通用集合：结构一致的档案条目都放这里，避免每加一类记录就改一次 store
  items: {},       // petId -> {meds:[], visits:[], expenses:[], milestones:[], labs:[]}
  settings: { theme: 'auto', fontScale: 1, onboarded: false, remindLeadDays: 7 },
};

/** 通用集合的种类。新增一类记录只要往这里加一项。 */
export const COLLECTIONS = {
  meds: { name: '用药与驱虫', icon: '💊' },
  visits: { name: '就诊记录', icon: '🏥' },
  expenses: { name: '花费', icon: '💰' },
  milestones: { name: '里程碑', icon: '⭐' },
  labs: { name: '化验指标', icon: '🧪' },
};

let state = null;
const listeners = new Set();

const storage = (() => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('__pb_probe', '1');
      localStorage.removeItem('__pb_probe');
      return localStorage;
    }
  } catch {
    /* 隐私模式或存储被禁用时退回内存 */
  }
  const mem = new Map();
  return {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, v),
    removeItem: (k) => mem.delete(k),
  };
})();

export function load() {
  if (state) return state;
  try {
    const raw = storage.getItem(KEY);
    state = raw ? { ...structuredCloneSafe(EMPTY), ...JSON.parse(raw) } : structuredCloneSafe(EMPTY);
  } catch {
    state = structuredCloneSafe(EMPTY);
  }
  return state;
}

function structuredCloneSafe(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function commit() {
  try {
    storage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* 存储超限时不阻断使用 */
  }
  for (const fn of listeners) fn(state);
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** 用备份文件整体替换当前状态（导入功能）。 */
export function replaceAll(next) {
  const base = structuredCloneSafe(EMPTY);
  state = { ...base, ...next };
  state.logs = state.logs ?? {};
  state.triages = state.triages ?? {};
  state.items = state.items ?? {};
  state.settings = { ...base.settings, ...(next.settings ?? {}) };
  if (!state.pets.some((p) => p.id === state.activePetId)) state.activePetId = state.pets[0]?.id ?? null;
  commit();
  return state;
}

export function reset() {
  state = structuredCloneSafe(EMPTY);
  commit();
}

// ── 日期工具 ────────────────────────────────────────────────────

export function today(date = new Date()) {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(fromISO, toISO = today()) {
  if (!fromISO) return 0;
  const a = new Date(`${fromISO}T00:00:00`);
  const b = new Date(`${toISO}T00:00:00`);
  return Math.max(0, Math.round((b - a) / 86400000));
}

/** 由生日推算月龄；没有生日则用手填的 ageMonths。 */
export function ageInMonths(pet, now = today()) {
  if (pet?.birthday) {
    const b = new Date(`${pet.birthday}T00:00:00`);
    const n = new Date(`${now}T00:00:00`);
    let months = (n.getFullYear() - b.getFullYear()) * 12 + (n.getMonth() - b.getMonth());
    if (n.getDate() < b.getDate()) months -= 1;
    return Math.max(0, months);
  }
  return Number(pet?.ageMonths) || 0;
}

/** 年龄展示：既没有生日也没有手填月龄时，如实说"未填"而不是显示 0 个月。 */
export function ageLabel(pet, now = today()) {
  if (!pet?.birthday && !Number(pet?.ageMonths)) return '年龄未填';
  return formatAge(ageInMonths(pet, now));
}

export function formatAge(months) {
  const m = Math.max(0, Math.round(Number(months) || 0));
  const y = Math.floor(m / 12);
  const rest = m % 12;
  if (y === 0) return `${rest} 个月`;
  return rest === 0 ? `${y} 岁` : `${y} 岁 ${rest} 个月`;
}

// ── 宠物 ────────────────────────────────────────────────────────

export function activePet() {
  const s = load();
  return s.pets.find((p) => p.id === s.activePetId) ?? s.pets[0] ?? null;
}

export function addPet(pet) {
  const s = load();
  const id = `pet_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
  const record = {
    id,
    name: '',
    species: 'cat',
    breed: '',
    sex: '',
    birthday: '',
    ageMonths: 0,
    homecoming: today(),
    weightKg: 0,
    neutered: false,
    goal: 'maintain',
    source: '',
    conditions: '',
    food: { wetRatio: 0.3, dryKcalPer100g: 400, wetKcalPer100g: 85, wetCanGrams: 85 },
    unlockedSignals: [],
    vaccines: {},
    mythScores: {},
    habits: {},
    ...pet,
  };
  s.pets.push(record);
  s.activePetId = id;
  s.logs[id] = s.logs[id] ?? [];
  s.triages[id] = s.triages[id] ?? [];
  s.items[id] = s.items[id] ?? {};
  s.settings.onboarded = true;
  commit();
  return record;
}

export function updatePet(petId, patch) {
  const s = load();
  const pet = s.pets.find((p) => p.id === petId);
  if (!pet) return null;
  Object.assign(pet, patch);
  commit();
  return pet;
}

export function removePet(petId) {
  const s = load();
  s.pets = s.pets.filter((p) => p.id !== petId);
  delete s.logs[petId];
  delete s.triages[petId];
  delete s.items?.[petId];
  if (s.activePetId === petId) s.activePetId = s.pets[0]?.id ?? null;
  commit();
}

export function setActivePet(petId) {
  const s = load();
  if (s.pets.some((p) => p.id === petId)) {
    s.activePetId = petId;
    commit();
  }
}

// ── 日志 ────────────────────────────────────────────────────────

/** 取（或创建）某天的记录。返回的对象可直接修改后调用 saveLog。 */
export function getLog(petId, date = today()) {
  const s = load();
  const list = (s.logs[petId] = s.logs[petId] ?? []);
  let log = list.find((l) => l.date === date);
  if (!log) {
    log = { date, taskIds: [], tasksTotal: 0, weightKg: null, foodGrams: null, waterMl: null, note: '' };
    list.push(log);
    list.sort((a, b) => (a.date < b.date ? 1 : -1)); // 倒序：最新在前
  }
  return log;
}

export function saveLog(petId, date, patch) {
  const log = getLog(petId, date);
  Object.assign(log, patch);
  commit();
  return log;
}

export function toggleTask(petId, taskId, total, date = today()) {
  const log = getLog(petId, date);
  const set = new Set(log.taskIds);
  if (set.has(taskId)) set.delete(taskId);
  else set.add(taskId);
  log.taskIds = [...set];
  log.tasksTotal = total;
  commit();
  return log;
}

/** 倒序日志（最新在前），用于曲线与统计。 */
export function logsFor(petId) {
  const s = load();
  return [...(s.logs[petId] ?? [])].sort((a, b) => (a.date < b.date ? -1 : 1)).reverse();
}

export function weightSeries(petId) {
  return logsFor(petId)
    .filter((l) => Number(l.weightKg) > 0)
    .map((l) => ({ date: l.date, kg: Number(l.weightKg) }))
    .reverse(); // 正序，便于画曲线
}

// ── 自查记录 ────────────────────────────────────────────────────

export function recordTriage(petId, entry) {
  const s = load();
  const list = (s.triages[petId] = s.triages[petId] ?? []);
  list.unshift({ date: new Date().toISOString(), ...entry });
  s.triages[petId] = list.slice(0, 50);
  commit();
}

export function triagesFor(petId) {
  const s = load();
  return s.triages[petId] ?? [];
}

/** 标记最近一次自查已生成就医摘要（用于「医疗避坑者」徽章）。 */
export function markTriageSummarized(petId) {
  const s = load();
  const latest = s.triages[petId]?.[0];
  if (!latest) return;
  latest.summarized = true;
  commit();
}

export function unlockSignal(petId, signalName) {
  const s = load();
  const pet = s.pets.find((p) => p.id === petId);
  if (!pet) return;
  const set = new Set(pet.unlockedSignals ?? []);
  if (set.has(signalName)) set.delete(signalName);
  else set.add(signalName);
  pet.unlockedSignals = [...set];
  commit();
}

// ── 通用集合（用药 / 就诊 / 花费 / 里程碑 / 化验） ──────────────

function bucket(petId, kind) {
  if (!Object.hasOwn(COLLECTIONS, kind)) throw new Error(`未知的集合类型：${kind}`);
  const s = load();
  s.items = s.items ?? {};
  s.items[petId] = s.items[petId] ?? {};
  s.items[petId][kind] = s.items[petId][kind] ?? [];
  return s.items[petId][kind];
}

/** 按日期倒序返回某类条目。 */
export function itemsFor(petId, kind) {
  return [...bucket(petId, kind)].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function addItem(petId, kind, item) {
  const list = bucket(petId, kind);
  const record = { id: `${kind}_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`, date: today(), ...item };
  list.push(record);
  commit();
  return record;
}

export function updateItem(petId, kind, itemId, patch) {
  const record = bucket(petId, kind).find((x) => x.id === itemId);
  if (!record) return null;
  Object.assign(record, patch);
  commit();
  return record;
}

export function removeItem(petId, kind, itemId) {
  const s = load();
  const list = bucket(petId, kind);
  s.items[petId][kind] = list.filter((x) => x.id !== itemId);
  commit();
}

// ── 汇总（供徽章与首页使用） ────────────────────────────────────

export function statsFor(petId) {
  const s = load();
  const pet = s.pets.find((p) => p.id === petId);
  const logs = logsFor(petId);
  const triages = triagesFor(petId);

  const groomStreak = countStreak(logs, (l) => l.taskIds?.some((t) => t.includes('brush') || t.includes('groom')));
  const playDays = logs.filter((l) => l.taskIds?.some((t) => t.includes('play') || t.includes('walk') || t.includes('social'))).length;

  return {
    pet,
    logs: logs.map((l) => ({ ...l, tasksDone: l.taskIds?.length ?? 0 })),
    milestones: itemsFor(petId, 'milestones'),
    visits: itemsFor(petId, 'visits'),
    meds: itemsFor(petId, 'meds'),
    expenses: itemsFor(petId, 'expenses'),
    labs: itemsFor(petId, 'labs'),
    daysTogether: daysBetween(pet?.homecoming),
    speciesCount: new Set(s.pets.map((p) => p.species)).size,
    triageWithSummary: triages.filter((t) => t.summarized).length,
    groomStreak,
    playDays,
    idealWeighIns: Number(pet?.idealWeighIns) || 0,
    vaccinesDone: Object.keys(pet?.vaccines ?? {}).length,
    vaccinesOverdue: Number(pet?.vaccinesOverdue) || 0,
    seniorPlanOn: Boolean(pet?.seniorPlanOn),
  };
}

function countStreak(logs, pred) {
  let n = 0;
  for (const l of logs) {
    if (pred(l)) n += 1;
    else break;
  }
  return n;
}

export function settings() {
  return load().settings;
}

export function updateSettings(patch) {
  const s = load();
  Object.assign(s.settings, patch);
  commit();
}
