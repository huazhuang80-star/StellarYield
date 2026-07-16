import { LOGICAL_W, LOGICAL_H, CANNON, SPAWN, COMBO, ITEMS, SHADOW_SPECIES, AUDIO_LEVELS, MISSION_POOL } from './config.js';
import { loadState, saveState, resetState } from './storage.js';
import {
  unlockAudio, setMuted, setMusicVolume, setSfxVolume,
  playShoot, playHit, playCatch, playBossWarn, playUpgrade,
  playFreeze, playBomb, playLightning, playAchievement,
  startMusic
} from './audio.js';
import { MissionSystem } from './missions.js';
import { Input } from './input.js';
import { Spawner } from './fish.js';
import { Net } from './bullet.js';
import { Cannon } from './cannon.js';
import { ParticleSystem } from './particles.js';
import { updateScene, drawScene } from './scene.js';
import { drawFish, drawFishShadow, drawCannon, drawBullet, drawNet, drawCoin, drawMuzzleFlash } from './sprites.js';
import { UI } from './ui.js';
import { ItemSystem, rollItemDrop } from './items.js';
import { AchievementTracker } from './achievements.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = loadState();
    this.state.paused = false;
    this.state.started = false;
    this.state.bossWarning = 0;
    this.state.totalCaughtThisSession = 0;
    this.state.settingsOpen = false;
    this.state.codexOpen = false;

    // Combo runtime state (not persisted — only bestCombo is).
    this.combo = { count: 0, lastAt: 0, level: 0 };

    this.fish = [];
    this.bullets = [];
    this.nets = [];
    this.particles = new ParticleSystem();
    this.spawner = new Spawner();
    this.cannon = new Cannon(() => this.state.cannonLevel);
    this.input = new Input(canvas);
    this.ui = new UI(this);
    this.items = new ItemSystem();
    this.items.inventory = { ...this.items.inventory, ...(this.state.items || {}) };
    this.achievements = new AchievementTracker(this.state.achievements || []);
    this.missions = new MissionSystem(this.state.missions);
    this.state.speciesKills = this.state.speciesKills || {};
    this.missionToasts = [];
    this.comboFlash = 0;
    this.shake = { intensity: 0, decay: 0 };
    this.muzzle = 0; // remaining life 0..1

    this.lastNow = performance.now();
    this.bossTimer = 0;

    this._resize();
    window.addEventListener('resize', () => this._resize());
    window.addEventListener('orientationchange', () => this._resize());
    window.addEventListener('keydown', e => this._onKey(e));

    this.input.onClick((x, y) => this._onClick(x, y));
    setMuted(this.state.muted);
    setMusicVolume(this.state.musicVol ?? 0.55);
    setSfxVolume(this.state.sfxVol ?? 0.9);

    requestAnimationFrame(t => this._loop(t));
  }

  _resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const wCss = window.innerWidth;
    const hCss = window.innerHeight;
    this.canvas.style.width = wCss + 'px';
    this.canvas.style.height = hCss + 'px';
    this.canvas.width = Math.floor(wCss * dpr);
    this.canvas.height = Math.floor(hCss * dpr);
    const scale = Math.min(this.canvas.width / LOGICAL_W, this.canvas.height / LOGICAL_H);
    this.viewScale = scale;
    this.viewOffX = (this.canvas.width - LOGICAL_W * scale) / 2;
    this.viewOffY = (this.canvas.height - LOGICAL_H * scale) / 2;
    const shortEdge = Math.min(wCss, hCss);
    this.state.portraitHint = (hCss > wCss && shortEdge < 700);
  }

  _onKey(e) {
    if (!this.state.started || this.state.paused) return;
    if (e.key === '1') this._useItem('freeze');
    else if (e.key === '2') this._useItem('bomb');
    else if (e.key === '3') this._useItem('lightning');
    else if (e.key.toLowerCase() === 'p') this.state.paused = !this.state.paused;
  }

  _onClick(x, y) {
    unlockAudio();
    if (!this.state.started) {
      this.state.started = true;
      startMusic();
      this._tryLockLandscape();
      return;
    }
    if (this.state.codexOpen) {
      const btn = this.ui.codexHitTest(x, y);
      if (btn === 'codexClose') this.state.codexOpen = false;
      return;
    }
    if (this.state.missionsOpen) {
      const btn = this.ui.missionsHitTest(x, y);
      if (btn === 'missionsClose') this.state.missionsOpen = false;
      else if (btn === 'missionsClaim') this._claimMissions();
      return;
    }
    if (this.state.settingsOpen) {
      const btn = this.ui.settingsHitTest(x, y);
      if (btn === 'settingsClose') this.state.settingsOpen = false;
      else if (btn === 'settingsCodex') { this.state.codexOpen = true; this.state.settingsOpen = false; }
      else if (btn === 'settingsMissions') { this.state.missionsOpen = true; this.state.settingsOpen = false; }
      else if (btn === 'settingsReset') this._resetSave();
      else if (btn === 'settingsMute') this._toggleMute();
      else if (btn === 'settingsMusic') this._cycleMusic();
      else if (btn === 'settingsSfx') this._cycleSfx();
      return;
    }
    const btn = this.ui.hitTest(x, y);
    if (btn) { this._onButton(btn); return; }
    if (this.state.paused) return;
    this.cannon.aimAt(x, y);
    this._fire();
  }

  _onButton(id) {
    switch (id) {
      case 'levelDown':
        if (this.state.cannonLevel > 1) { this.state.cannonLevel--; playUpgrade(); this._save(); }
        break;
      case 'levelUp':
        if (this.state.cannonLevel < CANNON.levels.length) { this.state.cannonLevel++; playUpgrade(); this._save(); }
        break;
      case 'autofire': this.state.autofire = !this.state.autofire; this._save(); break;
      case 'mute': this._toggleMute(); break;
      case 'pause': this.state.paused = !this.state.paused; break;
      case 'settings': this.state.settingsOpen = true; this.state.paused = true; break;
      case 'itemFreeze':    this._useItem('freeze'); break;
      case 'itemBomb':      this._useItem('bomb'); break;
      case 'itemLightning': this._useItem('lightning'); break;
    }
  }

  _toggleMute() {
    this.state.muted = !this.state.muted;
    setMuted(this.state.muted);
    this._save();
  }

  _cycleMusic() {
    const cur = this.state.musicVol ?? 0.55;
    const idx = AUDIO_LEVELS.findIndex(v => Math.abs(v - cur) < 0.05);
    const next = AUDIO_LEVELS[(idx + 1) % AUDIO_LEVELS.length];
    this.state.musicVol = next;
    setMusicVolume(next);
    this._save();
  }
  _cycleSfx() {
    const cur = this.state.sfxVol ?? 0.9;
    const idx = AUDIO_LEVELS.findIndex(v => Math.abs(v - cur) < 0.05);
    const next = AUDIO_LEVELS[(idx + 1) % AUDIO_LEVELS.length];
    this.state.sfxVol = next;
    setSfxVolume(next);
    this._save();
  }

  _claimMissions() {
    const gained = this.missions.claimAllReady();
    if (gained > 0) {
      this.state.coins += gained;
      playUpgrade();
      this._save();
    }
  }

  _useItem(id) {
    if (!this.items.count(id)) return;
    const used = this.items.use(id, {
      fishList: this.fish,
      now: performance.now(),
      cursor: { x: this.input.pointer.x, y: this.input.pointer.y },
      onCatch: (f, sourceId) => this._onCatch(f, { source: sourceId })
    });
    if (!used) return;
    if (id === 'freeze') { playFreeze(); this.state.usedFreeze = true; }
    else if (id === 'bomb') { playBomb(); this.state.usedBomb = true; this._addShake(14, 0.9); }
    else if (id === 'lightning') { playLightning(); this.state.usedLightning = true; }
    this.state.items = { ...this.items.inventory };
    this._trackMissions(this.missions.trackItemUse(id));
    this._save();
    this._checkAchievements();
  }

  _trackMissions(completedTemplates) {
    if (!completedTemplates || !completedTemplates.length) return;
    const now = performance.now();
    for (const t of completedTemplates) {
      this.missionToasts.push({ text: `📋 ${t.text(t.goal)} 完成 +${t.reward}`, start: now, duration: 3200 });
    }
    playAchievement();
    this.state.missions = this.missions.serialize();
  }

  _fire() {
    const now = performance.now();
    const fired = this.cannon.tryFire(now, cost => {
      if (this.state.coins < cost) return false;
      this.state.coins -= cost;
      return true;
    }, b => this.bullets.push(b));
    if (fired) {
      playShoot();
      this.muzzle = 1;
      this._save();
    }
  }

  _save() {
    this.state.bestSession = Math.max(this.state.bestSession, this.state.totalCaughtThisSession);
    this.state.items = { ...this.items.inventory };
    this.state.achievements = [...this.achievements.unlocked];
    this.state.missions = this.missions.serialize();
    saveState(this.state);
  }

  _resetSave() {
    this.state = { ...resetState(),
      paused: false, started: this.state.started, bossWarning: 0,
      totalCaughtThisSession: 0, settingsOpen: false, portraitHint: this.state.portraitHint };
    this.items = new ItemSystem();
    this.achievements = new AchievementTracker([]);
    setMuted(this.state.muted);
  }

  _tryLockLandscape() {
    try {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
      }
    } catch { /* not permitted */ }
  }

  _loop(nowRaw) {
    const now = nowRaw;
    let dt = now - this.lastNow;
    this.lastNow = now;
    if (dt > 100) dt = 100;

    this.input.beginFrame();
    if (this.state.started && !this.state.paused) this._update(dt, now);
    this._render(now);
    requestAnimationFrame(t => this._loop(t));
  }

  _update(dt, now) {
    this.cannon.aimAt(this.input.pointer.x, this.input.pointer.y);
    this.cannon.update(dt);

    if (this.state.autofire && this.input.pointer.held && !this.input.pointer.downThisFrame) {
      if (now - this.cannon.lastFire >= CANNON.autofireDelay) this._fire();
    }

    updateScene(dt);

    this.bossTimer += dt;
    if (this.bossTimer >= SPAWN.bossIntervalMs) {
      if (this.spawner.triggerBossSoon()) { this.state.bossWarning = 1600; playBossWarn(); }
      this.bossTimer = 0;
    }
    if (this.state.bossWarning > 0) this.state.bossWarning = Math.max(0, this.state.bossWarning - dt);
    this.spawner.update(dt, now, this.fish);

    for (const b of this.bullets) b.update(dt);
    for (const b of this.bullets) {
      if (b.dead) continue;
      for (const f of this.fish) {
        if (f.dying) continue;
        const dx = f.x - b.x, dy = f.y - b.y;
        if (dx * dx + dy * dy <= (b.radius + f.boundsRadius()) ** 2) {
          this.nets.push(new Net(b.x, b.y, b.damage));
          this.particles.spawnSplash(b.x, b.y);
          playHit();
          b.dead = true;
          break;
        }
      }
    }

    for (const net of this.nets) {
      net.update(dt);
      net.applyDamage(this.fish, now, f => this._onCatch(f, { source: 'net' }));
    }

    for (const f of this.fish) f.update(dt, now, this.items.freezeUntil);

    if (Math.random() < dt / 1400) {
      this.particles.spawnBubble(Math.random() * LOGICAL_W, LOGICAL_H, 2 + Math.random() * 4);
    }

    this.particles.update(dt);
    this.items.update(dt);

    // shake decay
    if (this.shake.intensity > 0) {
      this.shake.intensity = Math.max(0, this.shake.intensity - this.shake.decay * dt);
    }

    // muzzle flash decay
    if (this.muzzle > 0) this.muzzle = Math.max(0, this.muzzle - dt / 90);

    // combo timeout
    if (this.combo.count > 0 && now - this.combo.lastAt > COMBO.windowMs) {
      this.combo.count = 0;
      this.combo.level = 0;
    }

    if (this.comboFlash > 0) this.comboFlash = Math.max(0, this.comboFlash - dt / 400);

    this.achievements.updateToasts(now);
    this.missionToasts = this.missionToasts.filter(t => now - t.start < t.duration);
    this.missions.maybeRoll();

    this.fish = this.fish.filter(f => !f.dead);
    this.bullets = this.bullets.filter(b => !b.dead);
    this.nets = this.nets.filter(n => !n.dead);
  }

  _onCatch(fish, meta = {}) {
    const now = performance.now();
    // combo
    if (now - this.combo.lastAt < COMBO.windowMs) this.combo.count++;
    else this.combo.count = 1;
    this.combo.lastAt = now;
    const prevLevel = this.combo.level;
    this.combo.level = 0;
    for (let i = COMBO.levels.length - 1; i >= 0; i--) {
      if (this.combo.count >= COMBO.levels[i].threshold) { this.combo.level = i; break; }
    }
    if (this.combo.level > prevLevel) this.comboFlash = 1;
    const mult = COMBO.levels[this.combo.level].mult;
    const baseCoins = fish.type.coins;
    const coins = Math.round(baseCoins * mult);

    this.state.coins += coins;
    this.state.totalCaught++;
    this.state.totalCaughtThisSession++;
    if (fish.type.id === 'shark') this.state.shark = (this.state.shark || 0) + 1;
    if (fish.type.special === 'golden') this.state.golden = (this.state.golden || 0) + 1;
    if (fish.type.special === 'boss') {
      this.state.boss = (this.state.boss || 0) + 1;
      this._addShake(20, 0.6);
    }
    this.state.speciesKills[fish.type.id] = (this.state.speciesKills[fish.type.id] || 0) + 1;
    this.state.bestCombo = Math.max(this.state.bestCombo || 0, this.combo.count);

    this.particles.spawnCoinBurst(fish.x, fish.y, Math.min(20, 6 + Math.floor(coins / 30)), coins);
    const color = fish.type.special === 'boss' ? '#ffb6d5'
                : fish.type.special === 'golden' ? '#fff2b8'
                : mult > 1 ? COMBO.levels[this.combo.level].color
                : '#ffd54a';
    const text = mult > 1 ? `+${coins} ×${mult}` : `+${coins}`;
    this.particles.spawnFloatText(fish.x, fish.y - 20, text, color);
    playCatch(coins);

    // Item drop roll (only if caught via net — not via already-triggered item effect).
    if (meta.source !== 'bomb' && meta.source !== 'lightning') {
      const drop = rollItemDrop(fish.type);
      if (drop) {
        this.items.grant(drop);
        this.state.items = { ...this.items.inventory };
        this.particles.spawnFloatText(fish.x, fish.y + 10, `+${ITEMS[drop].label} 道具`, ITEMS[drop].color);
      }
    }

    // Mission tracking
    this._trackMissions(this.missions.trackCatch(fish.type));
    this._trackMissions(this.missions.trackComboReached(this.combo.count));
    this._trackMissions(this.missions.trackCoinsEarned(coins));

    this._save();
    this._checkAchievements();
  }

  _checkAchievements() {
    const stats = {
      totalCaught: this.state.totalCaught,
      coins: this.state.coins,
      shark: this.state.shark || 0,
      golden: this.state.golden || 0,
      boss: this.state.boss || 0,
      bestCombo: this.state.bestCombo || 0,
      usedFreeze: !!this.state.usedFreeze,
      usedBomb: !!this.state.usedBomb,
      usedLightning: !!this.state.usedLightning
    };
    const newly = this.achievements.check(stats);
    if (newly.length) {
      playAchievement();
      this.state.achievements = [...this.achievements.unlocked];
      saveState(this.state);
    }
  }

  _addShake(intensity, decayPerMs) {
    this.shake.intensity = Math.max(this.shake.intensity, intensity);
    this.shake.decay = decayPerMs;
  }

  _render(now) {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    let sx = 0, sy = 0;
    if (this.shake.intensity > 0) {
      sx = (Math.random() - 0.5) * this.shake.intensity;
      sy = (Math.random() - 0.5) * this.shake.intensity;
    }
    ctx.setTransform(this.viewScale, 0, 0, this.viewScale, this.viewOffX + sx, this.viewOffY + sy);

    drawScene(ctx, now);
    const floorY = LOGICAL_H - 30;
    for (const f of this.fish) {
      if (SHADOW_SPECIES.includes(f.type.id)) drawFishShadow(ctx, f, floorY);
    }
    for (const f of this.fish) drawFish(ctx, f, now);
    for (const n of this.nets) drawNet(ctx, n, this.cannon.currentLevel());
    for (const b of this.bullets) drawBullet(ctx, b, this.cannon.currentLevel());
    this.items.render(ctx);
    this.particles.render(ctx, drawCoin);
    drawCannon(ctx, this.cannon, this.cannon.currentLevel());
    if (this.muzzle > 0) drawMuzzleFlash(ctx, this.cannon, this.cannon.currentLevel(), 1 - this.muzzle);

    // Combo flash — full-screen tint on level-up.
    if (this.comboFlash > 0) {
      ctx.save();
      const lvl = COMBO.levels[this.combo.level];
      ctx.globalAlpha = this.comboFlash * 0.35;
      ctx.fillStyle = lvl.color;
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
      ctx.restore();
    }

    const boss = this.fish.find(f => f.type.special === 'boss' && !f.dying);
    this.ui.render(ctx, this.state, this.items, this.combo, {
      boss: boss ? { hp: boss.hp, maxHp: boss.maxHp } : null,
      raining: this.spawner.isRaining(),
      missions: this.missions,
      missionToasts: this.missionToasts,
      now
    });
    this.achievements.render(ctx, now);
  }
}
