import { ITEMS, ITEM_DROP } from './config.js';

// Returns an item id ("freeze" | "bomb" | "lightning") if the roll succeeds.
export function rollItemDrop(fishType) {
  const key = fishType.special === 'boss' ? 'boss'
            : fishType.special === 'golden' ? 'golden'
            : fishType.id === 'shark' ? 'shark'
            : 'other';
  const tier = ITEM_DROP[key];
  if (Math.random() > tier.any) return null;
  return pickWeighted(tier.distribution);
}

function pickWeighted(distribution) {
  let r = Math.random();
  for (const [id, weight] of Object.entries(distribution)) {
    r -= weight;
    if (r <= 0) return id;
  }
  return Object.keys(distribution)[0];
}

// A visible lightning bolt drawn between chained fish.
class LightningBolt {
  constructor(points) {
    this.points = points;
    this.age = 0;
    this.duration = 260;
    this.dead = false;
  }
  update(dt) {
    this.age += dt;
    if (this.age >= this.duration) this.dead = true;
  }
  render(ctx) {
    const t = this.age / this.duration;
    ctx.save();
    ctx.strokeStyle = ITEMS.lightning.color;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 1 - t;
    ctx.shadowColor = ITEMS.lightning.color;
    ctx.shadowBlur = 18;
    for (let pass = 0; pass < 2; pass++) {
      ctx.lineWidth = pass === 0 ? 5 : 2;
      ctx.globalAlpha = (1 - t) * (pass === 0 ? 0.35 : 1);
      ctx.beginPath();
      for (let i = 0; i < this.points.length - 1; i++) {
        const a = this.points[i], b = this.points[i + 1];
        this._jag(ctx, a.x, a.y, b.x, b.y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
  _jag(ctx, x1, y1, x2, y2) {
    ctx.moveTo(x1, y1);
    const segs = 5;
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 1) { ctx.lineTo(x2, y2); return; }
    const nx = -dy / len, ny = dx / len;
    for (let i = 1; i < segs; i++) {
      const p = i / segs;
      const wobble = (Math.random() - 0.5) * 30;
      ctx.lineTo(x1 + dx * p + nx * wobble, y1 + dy * p + ny * wobble);
    }
    ctx.lineTo(x2, y2);
  }
}

// A visible bomb shockwave over the whole play area.
class BombWave {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.age = 0;
    this.duration = 520;
    this.dead = false;
  }
  update(dt) {
    this.age += dt;
    if (this.age >= this.duration) this.dead = true;
  }
  render(ctx) {
    const t = this.age / this.duration;
    const r = 800 * t;
    ctx.save();
    ctx.strokeStyle = ITEMS.bomb.color;
    ctx.lineWidth = 6;
    ctx.globalAlpha = 1 - t;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.globalAlpha = (1 - t) * 0.6;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 0.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

export class ItemSystem {
  constructor() {
    this.inventory = { freeze: 0, bomb: 0, lightning: 0 };
    this.freezeUntil = 0;
    this.effects = []; // active LightningBolt / BombWave
  }

  grant(id) {
    if (this.inventory[id] === undefined) return;
    this.inventory[id] = Math.min(9, this.inventory[id] + 1);
  }

  count(id) { return this.inventory[id] || 0; }

  // Attempt to use item at cursor location; returns true if used.
  use(id, ctxState) {
    if (!this.inventory[id]) return false;
    this.inventory[id]--;
    const { fishList, now, onCatch, cursor } = ctxState;
    switch (id) {
      case 'freeze':
        this.freezeUntil = now + ITEMS.freeze.durationMs;
        break;
      case 'bomb':
        this.effects.push(new BombWave(cursor.x, cursor.y));
        for (const f of fishList) {
          if (f.dying) continue;
          const dx = f.x - cursor.x;
          const dy = f.y - cursor.y;
          if (dx * dx + dy * dy <= 260 * 260) {
            const killed = f.hit(9999, now);
            if (killed) onCatch(f, id);
          } else if (dx * dx + dy * dy <= 500 * 500) {
            const killed = f.hit(80, now);
            if (killed) onCatch(f, id);
          }
        }
        break;
      case 'lightning': {
        // Chain: closest fish to cursor, then jump to the next-closest live fish up to 5 hops.
        const jumps = 5;
        const chain = [];
        let anchor = { x: cursor.x, y: cursor.y };
        const remaining = fishList.filter(f => !f.dying);
        for (let i = 0; i < jumps; i++) {
          let best = null; let bestD = Infinity;
          for (const f of remaining) {
            if (chain.includes(f)) continue;
            const dx = f.x - anchor.x, dy = f.y - anchor.y;
            const d = dx * dx + dy * dy;
            if (d < bestD) { bestD = d; best = f; }
          }
          if (!best) break;
          chain.push(best);
          anchor = { x: best.x, y: best.y };
        }
        if (chain.length) {
          const points = [{ x: cursor.x, y: cursor.y }, ...chain.map(f => ({ x: f.x, y: f.y }))];
          this.effects.push(new LightningBolt(points));
          for (const f of chain) {
            const killed = f.hit(150, now);
            if (killed) onCatch(f, id);
          }
        } else {
          // no target — refund
          this.inventory[id]++;
          return false;
        }
        break;
      }
    }
    return true;
  }

  update(dt) {
    for (const e of this.effects) e.update(dt);
    this.effects = this.effects.filter(e => !e.dead);
  }

  render(ctx) {
    for (const e of this.effects) e.render(ctx);
  }
}
