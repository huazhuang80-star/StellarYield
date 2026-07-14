export const LOGICAL_W = 1280;
export const LOGICAL_H = 720;

export const CANNON = {
  baseX: LOGICAL_W / 2,
  baseY: LOGICAL_H - 60,
  barrelLength: 62,
  fireDelay: 190,
  autofireDelay: 320,
  minAngle: -Math.PI + 0.15,
  maxAngle: -0.15,
  levels: [
    { level: 1,  damage: 1,   cost: 1,   color: '#8ecdf1', barrel: '#3a6f97' },
    { level: 2,  damage: 2,   cost: 2,   color: '#6bb9e8', barrel: '#2f5f88' },
    { level: 3,  damage: 3,   cost: 3,   color: '#4aa3d9', barrel: '#255079' },
    { level: 4,  damage: 5,   cost: 5,   color: '#4a8fd0', barrel: '#204573' },
    { level: 5,  damage: 8,   cost: 8,   color: '#4a76c8', barrel: '#1e3a69' },
    { level: 6,  damage: 12,  cost: 12,  color: '#5c5cc8', barrel: '#2c2c73' },
    { level: 7,  damage: 20,  cost: 20,  color: '#7a4ac8', barrel: '#3d2378' },
    { level: 8,  damage: 32,  cost: 32,  color: '#a13ec6', barrel: '#5b1e70' },
    { level: 9,  damage: 50,  cost: 50,  color: '#c93aa5', barrel: '#6f1c5b' },
    { level: 10, damage: 80,  cost: 80,  color: '#e04477', barrel: '#7a1e42' }
  ]
};

export const BULLET = {
  speed: 900,
  radius: 8,
  netRadius: 60,
  netDuration: 260
};

export const FISH_TYPES = [
  { id: 'guppy',     name: '小鱼',    hp: 3,   coins: 1,    size: 26,  speed: 90,  weight: 32, body: '#f7c56b', fin: '#e08a3d', shape: 'oval' },
  { id: 'sardine',   name: '沙丁鱼',  hp: 6,   coins: 2,    size: 32,  speed: 110, weight: 24, body: '#8dc7f0', fin: '#4b90c9', shape: 'oval' },
  { id: 'blowfish',  name: '河豚',    hp: 12,  coins: 4,    size: 40,  speed: 70,  weight: 16, body: '#f2b98c', fin: '#c47845', shape: 'puff' },
  { id: 'clown',     name: '小丑鱼',  hp: 18,  coins: 6,    size: 38,  speed: 115, weight: 10, body: '#ff8a4f', fin: '#ffffff', shape: 'striped' },
  { id: 'jelly',     name: '水母',    hp: 22,  coins: 8,    size: 44,  speed: 40,  weight: 8,  body: '#dab6ff', fin: '#8a5cd0', shape: 'jelly' },
  { id: 'angel',     name: '天使鱼',  hp: 30,  coins: 10,   size: 46,  speed: 95,  weight: 7,  body: '#c8a0e9', fin: '#71499a', shape: 'diamond' },
  { id: 'ray',       name: '魟鱼',    hp: 55,  coins: 20,   size: 62,  speed: 60,  weight: 6,  body: '#82705e', fin: '#3f342a', shape: 'ray' },
  { id: 'turtle',    name: '海龟',    hp: 90,  coins: 40,   size: 70,  speed: 55,  weight: 4,  body: '#7abf7c', fin: '#3d6a3f', shape: 'turtle' },
  { id: 'swordfish', name: '剑鱼',    hp: 130, coins: 70,   size: 88,  speed: 190, weight: 3,  body: '#5aa8d1', fin: '#22557a', shape: 'sword' },
  { id: 'shark',     name: '鲨鱼',    hp: 180, coins: 100,  size: 100, speed: 140, weight: 3,  body: '#7a8b95', fin: '#3e4a53', shape: 'shark' },
  { id: 'golden',    name: '金龙',    hp: 250, coins: 300,  size: 92,  speed: 100, weight: 1,  body: '#ffd54a', fin: '#a97009', shape: 'dragon', special: 'golden' },
  { id: 'kraken',    name: '海皇',    hp: 800, coins: 1000, size: 170, speed: 45,  weight: 1,  body: '#4b3b73', fin: '#f5c542', shape: 'boss',   special: 'boss' }
];

export const ITEMS = {
  freeze:    { id: 'freeze',    name: '冰冻',  color: '#7cd4ff', durationMs: 4000, label: '❄' },
  bomb:      { id: 'bomb',      name: '海炸',  color: '#ff7a4a', durationMs: 0,    label: '💣' },
  lightning: { id: 'lightning', name: '闪电',  color: '#ffe14a', durationMs: 0,    label: '⚡' }
};

// When a fish is caught, roll for an item drop. Bosses guarantee a drop.
export const ITEM_DROP = {
  boss:   { any: 1.0,   distribution: { freeze: 0.33, bomb: 0.34, lightning: 0.33 } },
  golden: { any: 0.6,   distribution: { freeze: 0.5,  bomb: 0.2,  lightning: 0.3  } },
  shark:  { any: 0.12,  distribution: { freeze: 0.5,  bomb: 0.25, lightning: 0.25 } },
  other:  { any: 0.008, distribution: { freeze: 0.5,  bomb: 0.25, lightning: 0.25 } }
};

export const COMBO = {
  windowMs: 3000,
  levels: [
    { threshold: 0,  mult: 1,   color: '#e6f4ff' },
    { threshold: 3,  mult: 1.5, color: '#9ee0ff' },
    { threshold: 6,  mult: 2,   color: '#ffd54a' },
    { threshold: 10, mult: 3,   color: '#ffb14a' },
    { threshold: 16, mult: 5,   color: '#ff6bd5' }
  ]
};

export const SCHOOL = {
  intervalMs: 30000,
  minCount: 6,
  maxCount: 10,
  eligibleIds: ['guppy', 'sardine', 'clown', 'angel']
};

export const ACHIEVEMENTS = [
  { id: 'first_catch',   name: '初次收获',   desc: '捕获第一条鱼',    check: s => s.totalCaught >= 1 },
  { id: 'ten_catches',   name: '渔场熟手',   desc: '累计捕获 10 条',  check: s => s.totalCaught >= 10 },
  { id: 'hundred',       name: '渔场大师',   desc: '累计捕获 100 条', check: s => s.totalCaught >= 100 },
  { id: 'first_shark',   name: '大白猎手',   desc: '击败一条鲨鱼',    check: s => s.shark >= 1 },
  { id: 'first_golden',  name: '金鳞传说',   desc: '击败一条金龙',    check: s => s.golden >= 1 },
  { id: 'first_boss',    name: '海皇征服者', desc: '击败海皇',        check: s => s.boss >= 1 },
  { id: 'coin_grand',    name: '万贯家财',   desc: '累计金币 1000',   check: s => s.coins >= 1000 },
  { id: 'combo_x3',      name: '连击大师',   desc: '触发 3× 连击',    check: s => s.bestCombo >= 3 },
  { id: 'combo_x5',      name: '完美连击',   desc: '触发 5× 连击',    check: s => s.bestCombo >= 5 },
  { id: 'all_items',     name: '道具通',     desc: '三种道具都使用过', check: s => s.usedFreeze && s.usedBomb && s.usedLightning }
];

export const SPAWN = {
  baseInterval: 900,
  minInterval: 320,
  intervalRampSeconds: 240,
  bossIntervalMs: 90000,
  goldenIntervalMs: 45000,
  goldenRainIntervalMs: 180000,
  goldenRainDurationMs: 6000
};

export const SHADOW_SPECIES = ['turtle', 'shark', 'swordfish', 'ray', 'golden', 'kraken'];

export const ECONOMY = {
  initialCoins: 200,
  savingsKey: 'yulida.save.v1'
};

export const COLORS = {
  deepTop: '#052a44',
  deepMid: '#0a3f65',
  deepBottom: '#031a2b',
  hudPanel: 'rgba(6, 22, 36, 0.72)',
  hudBorder: 'rgba(140, 210, 255, 0.35)',
  hudText: '#e6f4ff',
  gold: '#ffd54a'
};
