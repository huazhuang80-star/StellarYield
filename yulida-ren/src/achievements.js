import { ACHIEVEMENTS } from './config.js';

export class AchievementTracker {
  constructor(unlocked = []) {
    this.unlocked = new Set(unlocked);
    this.toasts = [];
  }

  check(stats) {
    const newly = [];
    for (const a of ACHIEVEMENTS) {
      if (this.unlocked.has(a.id)) continue;
      if (a.check(stats)) {
        this.unlocked.add(a.id);
        newly.push(a);
      }
    }
    if (newly.length) {
      const baseNow = performance.now();
      newly.forEach((a, i) => {
        this.toasts.push({
          id: a.id,
          name: a.name,
          desc: a.desc,
          start: baseNow + i * 320,
          duration: 3200
        });
      });
    }
    return newly;
  }

  updateToasts(now) {
    this.toasts = this.toasts.filter(t => now - t.start < t.duration);
  }

  render(ctx, now, drawItemIcon) {
    const startX = 20;
    let y = 80;
    for (const t of this.toasts) {
      const age = now - t.start;
      if (age < 0) continue;
      const p = age / t.duration;
      const slideIn = Math.min(1, age / 200);
      const fadeOut = age > t.duration - 300 ? (t.duration - age) / 300 : 1;
      const alpha = slideIn * fadeOut;
      const x = startX - 40 * (1 - slideIn);
      ctx.save();
      ctx.globalAlpha = alpha;
      const w = 300, h = 62;
      ctx.fillStyle = 'rgba(6, 22, 36, 0.9)';
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 12);
      ctx.fill();
      ctx.strokeStyle = '#ffd54a';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.fillStyle = '#ffd54a';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.fillText('🏆 成就解锁 · ' + t.name, x + 14, y + 10);
      ctx.fillStyle = '#e6f4ff';
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillText(t.desc, x + 14, y + 36);
      ctx.restore();
      y += h + 8;
    }
  }
}
