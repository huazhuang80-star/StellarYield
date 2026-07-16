import { LOGICAL_W, LOGICAL_H, COLORS } from './config.js';

const SEAWEED = [];
for (let i = 0; i < 14; i++) {
  SEAWEED.push({
    x: 40 + Math.random() * (LOGICAL_W - 80),
    baseY: LOGICAL_H,
    height: 90 + Math.random() * 120,
    hue: 100 + Math.random() * 40,
    sway: Math.random() * Math.PI * 2,
    freq: 0.6 + Math.random() * 0.6,
    thickness: 4 + Math.random() * 4
  });
}

const CORAL = [];
for (let i = 0; i < 6; i++) {
  CORAL.push({
    x: 60 + Math.random() * (LOGICAL_W - 120),
    y: LOGICAL_H - 20 - Math.random() * 10,
    r: 30 + Math.random() * 40,
    hue: [340, 30, 190, 260][i % 4]
  });
}

let bgBubbleTimer = 0;
const bgBubbles = [];

export function updateScene(dt) {
  bgBubbleTimer += dt;
  if (bgBubbleTimer > 380) {
    bgBubbleTimer = 0;
    bgBubbles.push({
      x: Math.random() * LOGICAL_W,
      y: LOGICAL_H + 20,
      r: 3 + Math.random() * 8,
      vy: -30 - Math.random() * 40,
      wobble: Math.random() * Math.PI * 2,
      life: 5200,
      age: 0
    });
  }
  for (const b of bgBubbles) {
    b.age += dt;
    b.wobble += dt / 400;
    b.x += Math.sin(b.wobble) * 8 * dt / 1000;
    b.y += b.vy * dt / 1000;
  }
  while (bgBubbles.length && bgBubbles[0].age >= bgBubbles[0].life) bgBubbles.shift();
}

export function drawScene(ctx, t) {
  const grad = ctx.createLinearGradient(0, 0, 0, LOGICAL_H);
  grad.addColorStop(0, COLORS.deepTop);
  grad.addColorStop(0.55, COLORS.deepMid);
  grad.addColorStop(1, COLORS.deepBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

  // God rays
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) {
    const rayX = 200 + i * 220 + Math.sin(t * 0.0002 + i) * 40;
    const rg = ctx.createLinearGradient(rayX, 0, rayX + 160, LOGICAL_H);
    rg.addColorStop(0, 'rgba(180,235,255,0.08)');
    rg.addColorStop(1, 'rgba(180,235,255,0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.moveTo(rayX - 40, 0);
    ctx.lineTo(rayX + 40, 0);
    ctx.lineTo(rayX + 180, LOGICAL_H);
    ctx.lineTo(rayX + 20, LOGICAL_H);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Seafloor
  const floorGrad = ctx.createLinearGradient(0, LOGICAL_H - 90, 0, LOGICAL_H);
  floorGrad.addColorStop(0, 'rgba(6,20,32,0)');
  floorGrad.addColorStop(1, '#02121f');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, LOGICAL_H - 90, LOGICAL_W, 90);

  // Coral
  for (const c of CORAL) {
    ctx.fillStyle = `hsl(${c.hue} 55% 30%)`;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = `hsl(${c.hue} 55% 40%)`;
    for (let i = 0; i < 4; i++) {
      const bx = c.x - c.r * 0.7 + i * (c.r * 0.4);
      const by = c.y - c.r * 0.4 - (i % 2) * 6;
      ctx.beginPath();
      ctx.arc(bx, by, c.r * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Seaweed
  for (const w of SEAWEED) {
    ctx.strokeStyle = `hsl(${w.hue} 45% 28%)`;
    ctx.lineWidth = w.thickness;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(w.x, w.baseY);
    const segs = 6;
    for (let i = 1; i <= segs; i++) {
      const p = i / segs;
      const wx = w.x + Math.sin(t * 0.001 * w.freq + w.sway + p * 2) * 10 * p;
      const wy = w.baseY - w.height * p;
      ctx.lineTo(wx, wy);
    }
    ctx.stroke();
  }

  // Background bubbles
  ctx.strokeStyle = 'rgba(180,235,255,0.35)';
  ctx.lineWidth = 1.2;
  for (const b of bgBubbles) {
    const a = 1 - b.age / b.life;
    ctx.globalAlpha = a * 0.7;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
