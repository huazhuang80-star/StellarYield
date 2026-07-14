import { ECONOMY } from './config.js';

const DEFAULT_STATE = {
  coins: ECONOMY.initialCoins,
  cannonLevel: 1,
  totalCaught: 0,
  bestSession: 0,
  autofire: false,
  muted: false
};

export function loadState() {
  try {
    const raw = localStorage.getItem(ECONOMY.savingsKey);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveState(state) {
  try {
    const persisted = {
      coins: state.coins,
      cannonLevel: state.cannonLevel,
      totalCaught: state.totalCaught,
      bestSession: state.bestSession,
      autofire: state.autofire,
      muted: state.muted
    };
    localStorage.setItem(ECONOMY.savingsKey, JSON.stringify(persisted));
  } catch {
    // storage disabled — ignore
  }
}

export function resetState() {
  try {
    localStorage.removeItem(ECONOMY.savingsKey);
  } catch {
    // ignore
  }
  return { ...DEFAULT_STATE };
}
