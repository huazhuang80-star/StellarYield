import { LOGICAL_W, LOGICAL_H, CANNON, SPAWN } from './config.js';
import { loadState, saveState } from './storage.js';
import { unlockAudio, setMuted, playShoot, playHit, playCatch, playBossWarn, playUpgrade, startMusic } from './audio.js';
import { Input } from './input.js';
import { Spawner } from './fish.js';
import { Net } from './bullet.js';
import { Cannon } from './cannon.js';
import { ParticleSystem } from './particles.js';
import { updateScene, drawScene } from './scene.js';
import { drawFish, drawCannon, drawBullet, drawNet, drawCoin } from './sprites.js';
import { UI } from './ui.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = loadState();
    this.state.paused = false;
    this.state.started = false;
    this.state.bossWarning = 0;
    this.state.totalCaughtThisSession = 0;

    this.fish = [];
    this.bullets = [];
    this.nets = [];
    this.particles = new ParticleSystem();
    this.spawner = new Spawner();
    this.cannon = new Cannon(() => this.state.cannonLevel);
    this.input = new Input(canvas);
    this.ui = new UI(this);
    this.lastNow = performance.now();
    this.bossTimer = 0;
    this.acc = 0;

    this._resize();
    window.addEventListener('resize', () => this._resize());

    this.input.onClick((x, y) => this._onClick(x, y));
    setMuted(this.state.muted);

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
  }

  _onClick(x, y) {
    unlockAudio();
    if (!this.state.started) {
      this.state.started = true;
      startMusic();
      return;
    }
    const btn = this.ui.hitTest(x, y);
    if (btn) {
      this._onButton(btn);
      return;
    }
    if (this.state.paused) return;
    this.cannon.aimAt(x, y);
    this._fire();
  }

  _onButton(id) {
    switch (id) {
      case 'levelDown':
        if (this.state.cannonLevel > 1) {
          this.state.cannonLevel--;
          playUpgrade();
          this._save();
        }
        break;
      case 'levelUp':
        if (this.state.cannonLevel < CANNON.levels.length) {
          this.state.cannonLevel++;
          playUpgrade();
          this._save();
        }
        break;
      case 'autofire':
        this.state.autofire = !this.state.autofire;
        this._save();
        break;
      case 'mute':
        this.state.muted = !this.state.muted;
        setMuted(this.state.muted);
        this._save();
        break;
      case 'pause':
        this.state.paused = !this.state.paused;
        break;
    }
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
      this._save();
    }
  }

  _save() {
    this.state.bestSession = Math.max(this.state.bestSession, this.state.totalCaughtThisSession);
    saveState(this.state);
  }

  _loop(nowRaw) {
    const now = nowRaw;
    let dt = now - this.lastNow;
    this.lastNow = now;
    if (dt > 100) dt = 100; // clamp large hitches

    this.input.beginFrame();

    if (this.state.started && !this.state.paused) {
      this._update(dt, now);
    }
    this._render(now);
    requestAnimationFrame(t => this._loop(t));
  }

  _update(dt, now) {
    // aim continuously toward last pointer position
    this.cannon.aimAt(this.input.pointer.x, this.input.pointer.y);
    this.cannon.update(dt);

    // autofire
    if (this.state.autofire && this.input.pointer.held && !this.input.pointer.downThisFrame) {
      if (now - this.cannon.lastFire >= CANNON.autofireDelay) this._fire();
    }

    // scene bg
    updateScene(dt);

    // spawn
    this.bossTimer += dt;
    if (this.bossTimer >= SPAWN.bossIntervalMs) {
      if (this.spawner.triggerBossSoon()) {
        this.state.bossWarning = 1600;
        playBossWarn();
      }
      this.bossTimer = 0;
    }
    if (this.state.bossWarning > 0) this.state.bossWarning = Math.max(0, this.state.bossWarning - dt);
    this.spawner.update(dt, now, this.fish);

    // bullets
    for (const b of this.bullets) b.update(dt);

    // bullet vs fish -> spawn net
    for (const b of this.bullets) {
      if (b.dead) continue;
      for (const f of this.fish) {
        if (f.dying) continue;
        const dx = f.x - b.x;
        const dy = f.y - b.y;
        if (dx * dx + dy * dy <= (b.radius + f.boundsRadius()) ** 2) {
          this.nets.push(new Net(b.x, b.y, b.damage));
          this.particles.spawnSplash(b.x, b.y);
          playHit();
          b.dead = true;
          break;
        }
      }
    }

    // nets damage
    for (const net of this.nets) {
      net.update(dt);
      net.applyDamage(this.fish, now, f => this._onCatch(f));
    }

    // fish
    for (const f of this.fish) f.update(dt, now);

    // periodic bubble
    if (Math.random() < dt / 1400) {
      this.particles.spawnBubble(Math.random() * LOGICAL_W, LOGICAL_H, 2 + Math.random() * 4);
    }

    this.particles.update(dt);

    // sweep dead
    this.fish = this.fish.filter(f => !f.dead);
    this.bullets = this.bullets.filter(b => !b.dead);
    this.nets = this.nets.filter(n => !n.dead);
  }

  _onCatch(fish) {
    const coins = fish.type.coins;
    this.state.coins += coins;
    this.state.totalCaught++;
    this.state.totalCaughtThisSession++;
    this.particles.spawnCoinBurst(fish.x, fish.y, Math.min(20, 6 + Math.floor(coins / 30)), coins);
    this.particles.spawnFloatText(fish.x, fish.y - 20, `+${coins}`, fish.type.special === 'boss' ? '#ffb6d5' : fish.type.special === 'golden' ? '#fff2b8' : '#ffd54a');
    playCatch(coins);
    this._save();
  }

  _render(now) {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(this.viewScale, 0, 0, this.viewScale, this.viewOffX, this.viewOffY);

    drawScene(ctx, now);

    // fish behind bullets
    for (const f of this.fish) drawFish(ctx, f, now);

    // nets
    for (const n of this.nets) drawNet(ctx, n, this.cannon.currentLevel());

    // bullets
    for (const b of this.bullets) drawBullet(ctx, b, this.cannon.currentLevel());

    // particles
    this.particles.render(ctx, drawCoin);

    // cannon
    drawCannon(ctx, this.cannon, this.cannon.currentLevel());

    // HUD
    this.ui.render(ctx, this.state);
  }
}
