import { MISSION_POOL, FISH_TYPES, ITEMS } from './config.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export class MissionSystem {
  constructor(saved) {
    this.missions = null;
    this.dayStart = 0;
    this.completedToasts = [];
    this._hydrate(saved);
  }

  _hydrate(saved) {
    const now = Date.now();
    if (saved && saved.dayStart && now - saved.dayStart < DAY_MS && Array.isArray(saved.missions) && saved.missions.length) {
      this.dayStart = saved.dayStart;
      this.missions = saved.missions.map(m => ({ ...m }));
    } else {
      this._roll(now);
    }
  }

  _roll(nowStamp) {
    const pool = [...MISSION_POOL];
    const picks = [];
    for (let i = 0; i < 3 && pool.length; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      picks.push(pool.splice(idx, 1)[0]);
    }
    this.missions = picks.map(p => ({ id: p.id, progress: 0, done: false, claimed: false }));
    this.dayStart = nowStamp;
  }

  serialize() {
    return { dayStart: this.dayStart, missions: this.missions.map(m => ({ ...m })) };
  }

  templateOf(m) { return MISSION_POOL.find(p => p.id === m.id); }

  labelOf(m) {
    const t = this.templateOf(m);
    if (t.type === 'species_kill') {
      const sp = FISH_TYPES.find(f => f.id === t.speciesId);
      return t.text(t.goal, sp ? sp.name : t.speciesId);
    }
    if (t.type === 'item_use') {
      const it = ITEMS[t.itemId];
      return t.text(t.goal, it ? it.name : t.itemId);
    }
    return t.text(t.goal);
  }

  // Advance any missions matching this event; returns array of newly-completed templates for toasts.
  _tick(matchFn, amount = 1) {
    const completed = [];
    for (const m of this.missions) {
      if (m.done) continue;
      const t = this.templateOf(m);
      if (!matchFn(t)) continue;
      m.progress = Math.min(t.goal, m.progress + amount);
      if (m.progress >= t.goal) { m.done = true; completed.push(t); }
    }
    return completed;
  }

  trackCatch(fishType) {
    const done1 = this._tick(t => t.type === 'catch');
    const done2 = this._tick(t => t.type === 'species_kill' && t.speciesId === fishType.id);
    return [...done1, ...done2];
  }

  trackCombo(comboCount) {
    return this._tick(t => t.type === 'combo' && t.goal <= comboCount ? true : false, 999).filter(t => true);
  }

  // Combo tick: mark done if comboCount >= goal.
  trackComboReached(comboCount) {
    const completed = [];
    for (const m of this.missions) {
      if (m.done) continue;
      const t = this.templateOf(m);
      if (t.type !== 'combo') continue;
      if (comboCount >= t.goal) { m.progress = t.goal; m.done = true; completed.push(t); }
    }
    return completed;
  }

  trackItemUse(itemId) {
    return this._tick(t => t.type === 'item_use' && t.itemId === itemId);
  }

  trackCoinsEarned(amount) {
    return this._tick(t => t.type === 'earn_coins', amount);
  }

  // Claim reward coins for a done+unclaimed mission.
  claim(missionId) {
    const m = this.missions.find(x => x.id === missionId);
    if (!m || !m.done || m.claimed) return 0;
    m.claimed = true;
    return this.templateOf(m).reward;
  }

  // Auto-claim all done+unclaimed and return total.
  claimAllReady() {
    let total = 0;
    for (const m of this.missions) {
      if (m.done && !m.claimed) {
        m.claimed = true;
        total += this.templateOf(m).reward;
      }
    }
    return total;
  }

  // Refresh if day rolled over.
  maybeRoll() {
    const now = Date.now();
    if (now - this.dayStart >= DAY_MS) this._roll(now);
  }
}
