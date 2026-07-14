let ctx = null;
let muted = false;
let musicGain = null;
let musicNodes = [];

function ensureCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

export function unlockAudio() {
  const c = ensureCtx();
  if (c && c.state === 'suspended') c.resume();
}

export function setMuted(v) {
  muted = !!v;
  if (musicGain) musicGain.gain.setTargetAtTime(muted ? 0 : 0.06, ctx.currentTime, 0.05);
}

export function isMuted() {
  return muted;
}

function envelope(gainNode, t0, attack, decay, peak, tail) {
  gainNode.gain.setValueAtTime(0, t0);
  gainNode.gain.linearRampToValueAtTime(peak, t0 + attack);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay + tail);
}

export function playShoot() {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(660, t);
  osc.frequency.exponentialRampToValueAtTime(180, t + 0.08);
  envelope(g, t, 0.005, 0.05, 0.12, 0.02);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.12);
}

export function playHit() {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  const bufferSize = c.sampleRate * 0.12;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 900;
  const g = c.createGain();
  g.gain.value = 0.15;
  src.connect(filter).connect(g).connect(c.destination);
  src.start(t);
}

export function playCatch(coinValue) {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  const notes = coinValue >= 200 ? [523, 659, 784, 1047]
              : coinValue >= 40  ? [523, 659, 784]
              : [660, 880];
  notes.forEach((freq, i) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const start = t + i * 0.06;
    envelope(g, start, 0.005, 0.12, 0.14, 0.04);
    osc.connect(g).connect(c.destination);
    osc.start(start);
    osc.stop(start + 0.2);
  });
}

export function playBossWarn() {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  for (let k = 0; k < 3; k++) {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sawtooth';
    const start = t + k * 0.18;
    osc.frequency.setValueAtTime(120, start);
    osc.frequency.linearRampToValueAtTime(180, start + 0.14);
    envelope(g, start, 0.01, 0.14, 0.18, 0.02);
    osc.connect(g).connect(c.destination);
    osc.start(start);
    osc.stop(start + 0.2);
  }
}

export function playFreeze() {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, t);
  osc.frequency.exponentialRampToValueAtTime(240, t + 0.5);
  envelope(g, t, 0.005, 0.4, 0.14, 0.05);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.6);
}

export function playBomb() {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  const bufferSize = c.sampleRate * 0.5;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1800, t);
  filter.frequency.exponentialRampToValueAtTime(120, t + 0.5);
  const g = c.createGain();
  g.gain.value = 0.28;
  src.connect(filter).connect(g).connect(c.destination);
  src.start(t);
}

export function playLightning() {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  const bufferSize = c.sampleRate * 0.25;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 2000;
  const g = c.createGain();
  envelope(g, t, 0.002, 0.2, 0.22, 0.02);
  src.connect(filter).connect(g).connect(c.destination);
  src.start(t);
}

export function playAchievement() {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  [523, 659, 784, 1047].forEach((f, i) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'triangle';
    osc.frequency.value = f;
    const s = t + i * 0.08;
    envelope(g, s, 0.005, 0.14, 0.18, 0.04);
    osc.connect(g).connect(c.destination);
    osc.start(s);
    osc.stop(s + 0.2);
  });
}

export function playUpgrade() {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, t);
  osc.frequency.exponentialRampToValueAtTime(880, t + 0.14);
  envelope(g, t, 0.005, 0.14, 0.16, 0.02);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.2);
}

export function startMusic() {
  const c = ensureCtx();
  if (!c || musicGain) return;
  musicGain = c.createGain();
  musicGain.gain.value = muted ? 0 : 0.06;
  musicGain.connect(c.destination);

  const bass = c.createOscillator();
  bass.type = 'sine';
  bass.frequency.value = 65;
  const bassGain = c.createGain();
  bassGain.gain.value = 0.4;
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.18;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 8;
  lfo.connect(lfoGain).connect(bass.frequency);
  bass.connect(bassGain).connect(musicGain);
  bass.start();
  lfo.start();

  const pad = c.createOscillator();
  pad.type = 'triangle';
  pad.frequency.value = 196;
  const padGain = c.createGain();
  padGain.gain.value = 0.15;
  pad.connect(padGain).connect(musicGain);
  pad.start();

  musicNodes = [bass, lfo, pad];
}

export function stopMusic() {
  if (!ctx) return;
  musicNodes.forEach(n => { try { n.stop(); } catch {} });
  musicNodes = [];
  if (musicGain) { musicGain.disconnect(); musicGain = null; }
}
