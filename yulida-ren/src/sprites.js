// All fish and effect art is drawn procedurally from paths — no external assets.

const TAU = Math.PI * 2;

export function drawFish(ctx, fish, t) {
  ctx.save();
  ctx.translate(fish.x, fish.y);
  ctx.rotate(fish.heading);
  if (fish.dying) {
    const p = fish.dyingT;
    ctx.rotate(Math.sin(p * 12) * 0.6 * (1 - p));
    ctx.globalAlpha = 1 - p;
  }
  const scale = fish.size / 40;
  ctx.scale(scale, scale);
  const flap = Math.sin(t * 0.014 + fish.phase);
  switch (fish.type.shape) {
    case 'oval': drawOval(ctx, fish, flap); break;
    case 'puff': drawPuff(ctx, fish, flap); break;
    case 'striped': drawStriped(ctx, fish, flap); break;
    case 'diamond': drawDiamond(ctx, fish, flap); break;
    case 'ray': drawRay(ctx, fish, flap); break;
    case 'turtle': drawTurtle(ctx, fish, flap); break;
    case 'shark': drawShark(ctx, fish, flap); break;
    case 'sword': drawSwordfish(ctx, fish, flap); break;
    case 'jelly': drawJellyfish(ctx, fish, flap, t); break;
    case 'dragon': drawDragon(ctx, fish, flap, t); break;
    case 'boss': drawKraken(ctx, fish, flap, t); break;
    default: drawOval(ctx, fish, flap);
  }
  ctx.restore();
}

function shadedFill(ctx, hex, dx, dy, rx, ry, accent) {
  const grad = ctx.createLinearGradient(0, -ry, 0, ry);
  grad.addColorStop(0, lighten(hex, 0.25));
  grad.addColorStop(1, darken(hex, 0.2));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(dx, dy, rx, ry, 0, 0, TAU);
  ctx.fill();
  if (accent) {
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.ellipse(dx - rx * 0.2, dy - ry * 0.5, rx * 0.6, ry * 0.3, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawEye(ctx, x, y, r) {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#0b1a24';
  ctx.beginPath();
  ctx.arc(x + r * 0.2, y, r * 0.55, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x + r * 0.05, y - r * 0.3, r * 0.2, 0, TAU);
  ctx.fill();
}

function tailPath(ctx, x, y, spread, flap) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - spread * 0.7, y - spread * 0.5 + flap * 4, x - spread, y - spread * 0.6);
  ctx.lineTo(x - spread * 0.55, y);
  ctx.lineTo(x - spread, y + spread * 0.6);
  ctx.quadraticCurveTo(x - spread * 0.7, y + spread * 0.5 - flap * 4, x, y);
  ctx.closePath();
}

function drawOval(ctx, fish, flap) {
  const { body, fin } = fish.type;
  ctx.fillStyle = darken(fin, 0.1);
  tailPath(ctx, -18, 0, 18, flap);
  ctx.fill();
  shadedFill(ctx, body, 0, 0, 22, 14, fin);
  ctx.fillStyle = fin;
  ctx.beginPath();
  ctx.moveTo(2, -12);
  ctx.quadraticCurveTo(-2 + flap * 3, -22, -10, -10);
  ctx.closePath();
  ctx.fill();
  drawEye(ctx, 12, -3, 3);
}

function drawPuff(ctx, fish, flap) {
  const { body, fin } = fish.type;
  ctx.fillStyle = fin;
  tailPath(ctx, -20, 0, 14, flap);
  ctx.fill();
  shadedFill(ctx, body, 0, 0, 22, 20, null);
  ctx.strokeStyle = darken(body, 0.35);
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 14, Math.sin(a) * 12);
    ctx.lineTo(Math.cos(a) * 22, Math.sin(a) * 20);
    ctx.stroke();
  }
  drawEye(ctx, 13, -4, 3.2);
}

function drawStriped(ctx, fish, flap) {
  const { body, fin } = fish.type;
  ctx.fillStyle = darken(body, 0.2);
  tailPath(ctx, -18, 0, 16, flap);
  ctx.fill();
  shadedFill(ctx, body, 0, 0, 22, 13, null);
  ctx.fillStyle = fin;
  [-6, 4, 14].forEach(x => {
    ctx.beginPath();
    ctx.moveTo(x, -13);
    ctx.quadraticCurveTo(x - 3, 0, x, 13);
    ctx.quadraticCurveTo(x + 4, 0, x, -13);
    ctx.fill();
  });
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(4, -11);
  ctx.quadraticCurveTo(-2 + flap * 3, -20, -8, -8);
  ctx.closePath();
  ctx.fill();
  drawEye(ctx, 14, -3, 3);
}

function drawDiamond(ctx, fish, flap) {
  const { body, fin } = fish.type;
  ctx.fillStyle = fin;
  tailPath(ctx, -20, 0, 18, flap);
  ctx.fill();
  const grad = ctx.createLinearGradient(0, -22, 0, 22);
  grad.addColorStop(0, lighten(body, 0.3));
  grad.addColorStop(1, darken(body, 0.25));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(24, 0);
  ctx.lineTo(0, -22);
  ctx.lineTo(-14, 0);
  ctx.lineTo(0, 22);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = fin;
  ctx.beginPath();
  ctx.moveTo(2, -18);
  ctx.quadraticCurveTo(-6 + flap * 4, -32, -12, -18);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(2, 18);
  ctx.quadraticCurveTo(-6 - flap * 4, 32, -12, 18);
  ctx.closePath();
  ctx.fill();
  drawEye(ctx, 12, -3, 3);
}

function drawRay(ctx, fish, flap) {
  const { body, fin } = fish.type;
  const wing = 6 + flap * 6;
  ctx.fillStyle = darken(fin, 0.1);
  ctx.beginPath();
  ctx.moveTo(-30, 0);
  ctx.lineTo(-42, wing);
  ctx.lineTo(-38, -wing);
  ctx.closePath();
  ctx.fill();
  const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, 28);
  grad.addColorStop(0, lighten(body, 0.25));
  grad.addColorStop(1, darken(body, 0.3));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(28, 0);
  ctx.quadraticCurveTo(0, -30 - wing, -26, -6);
  ctx.quadraticCurveTo(-28, 0, -26, 6);
  ctx.quadraticCurveTo(0, 30 + wing, 28, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = darken(body, 0.5);
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(-4 + i * 5, -4 + (i % 2) * 8, 1.3, 0, TAU);
    ctx.fill();
  }
  drawEye(ctx, 16, -6, 2.4);
  drawEye(ctx, 16, 6, 2.4);
}

function drawTurtle(ctx, fish, flap) {
  const { body, fin } = fish.type;
  ctx.fillStyle = darken(fin, 0.05);
  // flippers
  ctx.beginPath();
  ctx.ellipse(-6, -22 - flap * 2, 10, 5, -0.4, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-6, 22 + flap * 2, 10, 5, 0.4, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(18, -14, 8, 4, 0.3, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(18, 14, 8, 4, -0.3, 0, TAU);
  ctx.fill();
  // shell
  const grad = ctx.createRadialGradient(-4, 0, 3, 0, 0, 26);
  grad.addColorStop(0, lighten(body, 0.2));
  grad.addColorStop(1, darken(body, 0.35));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 0, 26, 22, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = darken(body, 0.5);
  ctx.lineWidth = 1.2;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 8, -18);
    ctx.lineTo(i * 8, 18);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-22, 0);
  ctx.lineTo(22, 0);
  ctx.stroke();
  // head
  ctx.fillStyle = fin;
  ctx.beginPath();
  ctx.ellipse(30, 0, 10, 7, 0, 0, TAU);
  ctx.fill();
  drawEye(ctx, 34, -2, 2);
}

function drawShark(ctx, fish, flap) {
  const { body, fin } = fish.type;
  ctx.fillStyle = darken(body, 0.3);
  tailPath(ctx, -28, 0, 22, flap);
  ctx.fill();
  const grad = ctx.createLinearGradient(0, -18, 0, 18);
  grad.addColorStop(0, lighten(body, 0.2));
  grad.addColorStop(0.55, body);
  grad.addColorStop(0.56, lighten(body, 0.4));
  grad.addColorStop(1, '#e6efef');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(34, 0);
  ctx.quadraticCurveTo(20, -18, -14, -14);
  ctx.quadraticCurveTo(-24, -4, -24, 0);
  ctx.quadraticCurveTo(-24, 4, -14, 14);
  ctx.quadraticCurveTo(20, 18, 34, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = fin;
  ctx.beginPath();
  ctx.moveTo(4, -14);
  ctx.lineTo(-2 + flap * 2, -30);
  ctx.lineTo(-10, -12);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-2, 12);
  ctx.lineTo(-14, 22);
  ctx.lineTo(-14, 10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#20272e';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(30, -1);
  ctx.lineTo(20, -3);
  ctx.moveTo(28, 4);
  ctx.lineTo(18, 2);
  ctx.stroke();
  drawEye(ctx, 22, -6, 2.6);
}

function drawSwordfish(ctx, fish, flap) {
  const { body, fin } = fish.type;
  ctx.fillStyle = darken(fin, 0.1);
  tailPath(ctx, -22, 0, 22, flap);
  ctx.fill();
  const grad = ctx.createLinearGradient(0, -12, 0, 12);
  grad.addColorStop(0, lighten(body, 0.3));
  grad.addColorStop(0.55, body);
  grad.addColorStop(1, '#eef7fb');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(24, 0);
  ctx.quadraticCurveTo(12, -14, -18, -10);
  ctx.quadraticCurveTo(-22, 0, -18, 10);
  ctx.quadraticCurveTo(12, 14, 24, 0);
  ctx.closePath();
  ctx.fill();
  // sword bill
  ctx.fillStyle = darken(fin, 0.25);
  ctx.beginPath();
  ctx.moveTo(24, -2);
  ctx.lineTo(60, 0);
  ctx.lineTo(24, 2);
  ctx.closePath();
  ctx.fill();
  // dorsal
  ctx.fillStyle = fin;
  ctx.beginPath();
  ctx.moveTo(4, -10);
  ctx.lineTo(-4 + flap * 3, -24);
  ctx.lineTo(-10, -8);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, 10);
  ctx.lineTo(-8, 20);
  ctx.lineTo(-12, 8);
  ctx.closePath();
  ctx.fill();
  drawEye(ctx, 16, -4, 2.4);
}

function drawJellyfish(ctx, fish, flap, t) {
  const { body, fin } = fish.type;
  const pulse = 1 + 0.08 * Math.sin(t * 0.005 + fish.phase);
  const grad = ctx.createRadialGradient(0, -6, 4, 0, -6, 24);
  grad.addColorStop(0, lighten(body, 0.35));
  grad.addColorStop(1, darken(body, 0.15));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, -6, 22 * pulse, 16 * pulse, 0, Math.PI, 0);
  ctx.lineTo(-20 * pulse, 2);
  ctx.quadraticCurveTo(0, 8, 20 * pulse, 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = darken(body, 0.4);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-20 * pulse, 2);
  ctx.lineTo(20 * pulse, 2);
  ctx.stroke();
  // tentacles
  ctx.strokeStyle = fin;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  for (let k = -3; k <= 3; k++) {
    const x0 = k * 6;
    const len = 22 + Math.abs(k) * 3;
    ctx.beginPath();
    ctx.moveTo(x0, 4);
    for (let s = 1; s <= 4; s++) {
      const p = s / 4;
      const wobble = Math.sin(t * 0.006 + fish.phase + k + s) * 3;
      ctx.lineTo(x0 + wobble, 4 + len * p);
    }
    ctx.stroke();
  }
  drawEye(ctx, -6, -8, 1.6);
  drawEye(ctx, 6, -8, 1.6);
}

function drawDragon(ctx, fish, flap, t) {
  const { body, fin } = fish.type;
  const glow = 0.4 + 0.3 * Math.sin(t * 0.006);
  ctx.save();
  ctx.shadowBlur = 24;
  ctx.shadowColor = `rgba(255, 213, 74, ${glow})`;
  ctx.fillStyle = darken(fin, 0.1);
  tailPath(ctx, -26, 0, 20, flap);
  ctx.fill();
  const grad = ctx.createLinearGradient(-26, 0, 30, 0);
  grad.addColorStop(0, darken(body, 0.15));
  grad.addColorStop(1, lighten(body, 0.35));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(30, 0);
  ctx.quadraticCurveTo(6, -18, -18, -8);
  ctx.quadraticCurveTo(-20, 0, -18, 8);
  ctx.quadraticCurveTo(6, 18, 30, 0);
  ctx.closePath();
  ctx.fill();
  // scales
  ctx.strokeStyle = darken(body, 0.4);
  ctx.lineWidth = 1;
  for (let i = -14; i < 24; i += 6) {
    ctx.beginPath();
    ctx.arc(i, 0, 5, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  }
  // whiskers
  ctx.strokeStyle = fin;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(28, -4);
  ctx.quadraticCurveTo(40, -12 + flap * 3, 46, -4);
  ctx.moveTo(28, 4);
  ctx.quadraticCurveTo(40, 12 - flap * 3, 46, 4);
  ctx.stroke();
  // fin ridge
  ctx.fillStyle = fin;
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.quadraticCurveTo(-4 + flap * 4, -26, -10, -14);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  drawEye(ctx, 22, -4, 3);
}

function drawKraken(ctx, fish, flap, t) {
  const { body, fin } = fish.type;
  ctx.save();
  ctx.shadowBlur = 32;
  ctx.shadowColor = 'rgba(245, 197, 66, 0.55)';
  // tentacles
  ctx.strokeStyle = darken(body, 0.35);
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  for (let k = 0; k < 6; k++) {
    const baseAng = (k / 6) * TAU;
    ctx.beginPath();
    let px = Math.cos(baseAng) * 20;
    let py = Math.sin(baseAng) * 20;
    ctx.moveTo(px, py);
    for (let s = 1; s <= 4; s++) {
      const wave = Math.sin(t * 0.005 + k + s * 0.6) * 8;
      const rr = 20 + s * 12;
      px = Math.cos(baseAng) * rr + wave * Math.sin(baseAng);
      py = Math.sin(baseAng) * rr - wave * Math.cos(baseAng);
      ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  // body
  const grad = ctx.createRadialGradient(0, -6, 6, 0, 0, 40);
  grad.addColorStop(0, lighten(body, 0.3));
  grad.addColorStop(1, darken(body, 0.4));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 0, 40, 32, 0, 0, TAU);
  ctx.fill();
  // crown ridges
  ctx.strokeStyle = fin;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-14, -24);
  ctx.lineTo(-4, -34);
  ctx.lineTo(4, -22);
  ctx.lineTo(14, -34);
  ctx.lineTo(20, -20);
  ctx.stroke();
  ctx.restore();
  drawEye(ctx, -10, -4, 5);
  drawEye(ctx, 14, -4, 5);
  // fanged mouth
  ctx.fillStyle = '#1a0e1a';
  ctx.beginPath();
  ctx.ellipse(0, 12, 12, 5, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  for (let i = -8; i <= 8; i += 4) {
    ctx.beginPath();
    ctx.moveTo(i, 8);
    ctx.lineTo(i + 1.5, 15);
    ctx.lineTo(i + 3, 8);
    ctx.closePath();
    ctx.fill();
  }
}

// helpers
function lighten(hex, amount) {
  return mix(hex, '#ffffff', amount);
}
function darken(hex, amount) {
  return mix(hex, '#000000', amount);
}
function mix(a, b, t) {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}
function hexToRgb(h) {
  if (h.startsWith('rgb')) {
    const m = h.match(/\d+/g).map(Number);
    return [m[0], m[1], m[2]];
  }
  const s = h.replace('#', '');
  const v = parseInt(s.length === 3 ? s.split('').map(c => c + c).join('') : s, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

// ---------- other sprites ----------

export function drawCannon(ctx, cannon, level) {
  const { baseX, baseY } = cannon;
  ctx.save();
  ctx.translate(baseX, baseY);
  // base ring
  const ringGrad = ctx.createRadialGradient(0, -6, 4, 0, 0, 46);
  ringGrad.addColorStop(0, '#3a5a78');
  ringGrad.addColorStop(1, '#0d1a2a');
  ctx.fillStyle = ringGrad;
  ctx.beginPath();
  ctx.ellipse(0, 12, 60, 22, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#6db5e0';
  ctx.lineWidth = 2;
  ctx.stroke();
  // barrel
  ctx.rotate(cannon.angle);
  ctx.fillStyle = level.barrel;
  ctx.beginPath();
  ctx.roundRect(-4, -14, 68, 28, 8);
  ctx.fill();
  ctx.strokeStyle = '#000000';
  ctx.globalAlpha = 0.25;
  ctx.stroke();
  ctx.globalAlpha = 1;
  // muzzle
  ctx.fillStyle = level.color;
  ctx.beginPath();
  ctx.arc(64, 0, 10, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(58, 12);
  ctx.lineTo(58, -12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // Level pip on the base (upright, always visible).
  ctx.save();
  ctx.translate(baseX, baseY + 12);
  ctx.fillStyle = level.color;
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#0d1a2a';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(level.level), 0, 0);
  ctx.restore();
}

export function drawBullet(ctx, bullet, level) {
  ctx.save();
  ctx.translate(bullet.x, bullet.y);
  ctx.rotate(bullet.angle);
  ctx.shadowColor = level.color;
  ctx.shadowBlur = 12;
  const g = ctx.createRadialGradient(0, 0, 1, 0, 0, bullet.radius);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, level.color);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, bullet.radius * 1.4, bullet.radius, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function drawNet(ctx, net, level) {
  const t = net.age / net.duration;
  const r = net.radius * (0.6 + 0.6 * t);
  ctx.save();
  ctx.translate(net.x, net.y);
  ctx.strokeStyle = level.color;
  ctx.globalAlpha = 1 - t;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = 1.2;
  const rings = 3;
  for (let i = 1; i <= rings; i++) {
    ctx.beginPath();
    ctx.arc(0, 0, r * (i / (rings + 1)), 0, TAU);
    ctx.stroke();
  }
  const spokes = 12;
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * TAU;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawMuzzleFlash(ctx, cannon, level, life) {
  const r = 22 * (1 - life);
  const cx = cannon.baseX + Math.cos(cannon.angle) * (62 + 10);
  const cy = cannon.baseY + Math.sin(cannon.angle) * (62 + 10);
  const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, r);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.5, level.color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function drawItemIcon(ctx, x, y, size, item) {
  const g = ctx.createRadialGradient(x, y, 2, x, y, size);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.4, item.color);
  g.addColorStop(1, 'rgba(6,22,36,0.85)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = item.color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#0b1a24';
  ctx.font = `bold ${Math.round(size * 1.1)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(item.label, x, y + 1);
}

export function drawFishShadow(ctx, fish, floorY) {
  const dropDist = floorY - fish.y;
  if (dropDist <= 0) return;
  const scale = Math.max(0.35, 1 - dropDist / 900);
  const alpha = Math.max(0.05, 0.4 * scale);
  const rx = fish.size * 0.75 * scale;
  const ry = fish.size * 0.22 * scale;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(fish.x, floorY - 4, rx, ry, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function drawCoin(ctx, x, y, r) {
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
  g.addColorStop(0, '#fff2b8');
  g.addColorStop(1, '#d69712');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#8a5b06';
  ctx.lineWidth = 1;
  ctx.stroke();
}
