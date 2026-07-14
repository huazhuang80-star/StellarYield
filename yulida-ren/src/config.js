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
  { id: 'guppy',     name: '小鱼',   hp: 3,   coins: 1,    size: 26,  speed: 90,  weight: 32, body: '#f7c56b', fin: '#e08a3d', shape: 'oval' },
  { id: 'sardine',   name: '沙丁鱼', hp: 6,   coins: 2,    size: 32,  speed: 110, weight: 24, body: '#8dc7f0', fin: '#4b90c9', shape: 'oval' },
  { id: 'blowfish',  name: '河豚',   hp: 12,  coins: 4,    size: 40,  speed: 70,  weight: 16, body: '#f2b98c', fin: '#c47845', shape: 'puff'  },
  { id: 'clown',     name: '小丑鱼', hp: 18,  coins: 6,    size: 38,  speed: 115, weight: 10, body: '#ff8a4f', fin: '#ffffff', shape: 'striped' },
  { id: 'angel',     name: '天使鱼', hp: 30,  coins: 10,   size: 46,  speed: 95,  weight: 8,  body: '#c8a0e9', fin: '#71499a', shape: 'diamond' },
  { id: 'ray',       name: '魟鱼',   hp: 55,  coins: 20,   size: 62,  speed: 60,  weight: 6,  body: '#82705e', fin: '#3f342a', shape: 'ray' },
  { id: 'turtle',    name: '海龟',   hp: 90,  coins: 40,   size: 70,  speed: 55,  weight: 4,  body: '#7abf7c', fin: '#3d6a3f', shape: 'turtle' },
  { id: 'shark',     name: '鲨鱼',   hp: 180, coins: 100,  size: 100, speed: 140, weight: 3,  body: '#7a8b95', fin: '#3e4a53', shape: 'shark' },
  { id: 'golden',    name: '金龙',   hp: 250, coins: 300,  size: 92,  speed: 100, weight: 1,  body: '#ffd54a', fin: '#a97009', shape: 'dragon', special: 'golden' },
  { id: 'kraken',    name: '海皇',   hp: 800, coins: 1000, size: 170, speed: 45,  weight: 1,  body: '#4b3b73', fin: '#f5c542', shape: 'boss',   special: 'boss' }
];

export const SPAWN = {
  baseInterval: 900,
  minInterval: 320,
  intervalRampSeconds: 240,
  bossIntervalMs: 90000,
  goldenIntervalMs: 45000
};

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
