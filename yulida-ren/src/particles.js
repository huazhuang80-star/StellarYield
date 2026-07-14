export class ParticleSystem {
  constructor() {
    this.items = [];
  }

  add(p) { this.items.push(p); }

  spawnCoinBurst(x, y, count, value) {
    for (let i = 0; i < count; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
      const sp = 180 + Math.random() * 220;
      this.items.push({
        kind: 'coin',
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 800 + Math.random() * 400,
        age: 0,
        size: 8 + Math.random() * 4,
        value
      });
    }
  }

  spawnFloatText(x, y, text, color = '#ffd54a') {
    this.items.push({ kind: 'text', x, y, vy: -60, life: 900, age: 0, text, color });
  }

  spawnBubble(x, y, r) {
    this.items.push({ kind: 'bubble', x, y, r, vy: -30 - Math.random() * 20, wobble: Math.random() * Math.PI * 2, life: 3000, age: 0 });
  }

  spawnSplash(x, y) {
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 120;
      this.items.push({ kind: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 260, age: 0 });
    }
  }

  update(dt) {
    const g = 480; // px/s^2
    for (const p of this.items) {
      p.age += dt;
      switch (p.kind) {
        case 'coin':
          p.vy += g * dt / 1000;
          p.x += p.vx * dt / 1000;
          p.y += p.vy * dt / 1000;
          break;
        case 'text':
          p.y += p.vy * dt / 1000;
          break;
        case 'bubble':
          p.wobble += dt / 300;
          p.x += Math.sin(p.wobble) * 8 * dt / 1000;
          p.y += p.vy * dt / 1000;
          break;
        case 'spark':
          p.x += p.vx * dt / 1000;
          p.y += p.vy * dt / 1000;
          p.vx *= 0.94;
          p.vy *= 0.94;
          break;
      }
    }
    this.items = this.items.filter(p => p.age < p.life);
  }

  render(ctx, drawCoin) {
    for (const p of this.items) {
      const t = p.age / p.life;
      switch (p.kind) {
        case 'coin':
          ctx.globalAlpha = 1 - t * 0.4;
          drawCoin(ctx, p.x, p.y, p.size);
          break;
        case 'text':
          ctx.globalAlpha = 1 - t;
          ctx.fillStyle = p.color;
          ctx.font = 'bold 20px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(p.text, p.x, p.y);
          break;
        case 'bubble':
          ctx.globalAlpha = (1 - t) * 0.4;
          ctx.strokeStyle = '#b7e4ff';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.stroke();
          break;
        case 'spark':
          ctx.globalAlpha = 1 - t;
          ctx.fillStyle = '#ffe89a';
          ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
          break;
      }
    }
    ctx.globalAlpha = 1;
  }
}
