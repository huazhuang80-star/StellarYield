import { LOGICAL_W, LOGICAL_H, FISH_TYPES, SPAWN } from './config.js';

let nextId = 1;

export class Fish {
  constructor(type, spawnState) {
    this.id = nextId++;
    this.type = type;
    this.hp = type.hp;
    this.maxHp = type.hp;
    this.size = type.size;
    this.phase = Math.random() * Math.PI * 2;
    this.dying = false;
    this.dyingT = 0;
    this.dead = false;
    this.slowUntil = 0;
    this.pathT = 0;

    // Choose an entry side, path type, and target trajectory.
    const side = Math.random() < 0.5 ? 'left' : 'right';
    const dir = side === 'left' ? 1 : -1;
    const startX = side === 'left' ? -type.size - 40 : LOGICAL_W + type.size + 40;
    const baseY = 100 + Math.random() * (LOGICAL_H - 240);
    this.dir = dir;
    this.x = startX;
    this.y = baseY;
    this.baseY = baseY;
    this.speed = type.speed * (0.85 + Math.random() * 0.3);
    if (spawnState && spawnState.speedBoost) this.speed *= spawnState.speedBoost;
    this.heading = dir === 1 ? 0 : Math.PI;
    const roll = Math.random();
    if (type.special === 'boss') {
      this.pathKind = 'boss';
      this.speed *= 0.85;
    } else if (roll < 0.55) {
      this.pathKind = 'sine';
      this.amp = 20 + Math.random() * 60;
      this.freq = 0.002 + Math.random() * 0.002;
    } else if (roll < 0.8) {
      this.pathKind = 'straight';
    } else {
      this.pathKind = 'arc';
      this.arcCenterY = baseY + (Math.random() < 0.5 ? -1 : 1) * (80 + Math.random() * 80);
      this.arcRadius = Math.abs(this.arcCenterY - baseY);
      this.arcAng = Math.atan2(baseY - this.arcCenterY, startX);
      this.arcSpin = dir * (0.4 + Math.random() * 0.4);
    }
  }

  update(dt, now) {
    if (this.dying) {
      this.dyingT += dt / 700;
      if (this.dyingT >= 1) this.dead = true;
      return;
    }
    let vx = 0, vy = 0;
    const s = (now < this.slowUntil) ? 0.35 : 1;
    const speed = this.speed * s;
    switch (this.pathKind) {
      case 'straight':
        vx = this.dir * speed;
        break;
      case 'sine':
        vx = this.dir * speed;
        this.y = this.baseY + Math.sin(this.x * this.freq + this.phase) * this.amp;
        vy = 0;
        break;
      case 'arc': {
        this.arcAng += this.arcSpin * (dt / 1000);
        this.x = LOGICAL_W / 2 + Math.cos(this.arcAng) * (LOGICAL_W / 2 + 60) * this.dir;
        this.y = this.arcCenterY + Math.sin(this.arcAng) * this.arcRadius;
        break;
      }
      case 'boss': {
        vx = this.dir * speed;
        this.y = this.baseY + Math.sin(now * 0.0006 + this.phase) * 40;
        break;
      }
    }
    if (this.pathKind !== 'arc') {
      this.x += vx * (dt / 1000);
      if (this.pathKind === 'sine') {
        const next = this.baseY + Math.sin((this.x + this.dir * 5) * this.freq + this.phase) * this.amp;
        vy = (next - this.y);
      }
    }
    this.heading = Math.atan2(vy, vx * this.dir) + (this.dir === 1 ? 0 : Math.PI);
    const off = 200;
    if (this.pathKind === 'arc') {
      // arc fish loops around; die after 1 full pass
      if (Math.abs(this.arcAng) > Math.PI + 0.5) this.dead = true;
    } else if (this.x < -off || this.x > LOGICAL_W + off) {
      this.dead = true;
    }
  }

  hit(damage, now) {
    this.hp -= damage;
    this.slowUntil = now + 220;
    if (this.hp <= 0 && !this.dying) {
      this.dying = true;
      return true;
    }
    return false;
  }

  boundsRadius() {
    return this.size * 0.7;
  }
}

export class Spawner {
  constructor() {
    this.timer = 0;
    this.elapsedMs = 0;
    this.lastBoss = 0;
    this.lastGolden = 0;
    this.weightedList = this._buildWeightedList(FISH_TYPES.filter(t => !t.special));
    this.pendingBoss = false;
  }

  _buildWeightedList(types) {
    const arr = [];
    for (const t of types) {
      for (let i = 0; i < t.weight; i++) arr.push(t);
    }
    return arr;
  }

  update(dt, now, fish) {
    this.timer += dt;
    this.elapsedMs += dt;
    const rampT = Math.min(1, this.elapsedMs / (SPAWN.intervalRampSeconds * 1000));
    const interval = SPAWN.baseInterval - (SPAWN.baseInterval - SPAWN.minInterval) * rampT;

    if (this.pendingBoss && this.timer >= 800) {
      const boss = FISH_TYPES.find(t => t.special === 'boss');
      fish.push(new Fish(boss));
      this.pendingBoss = false;
      this.lastBoss = this.elapsedMs;
      this.timer = 0;
    }

    if (this.timer >= interval) {
      this.timer = 0;
      fish.push(new Fish(this.pickCommon()));
    }

    if (this.elapsedMs - this.lastGolden > SPAWN.goldenIntervalMs && Math.random() < 0.5) {
      const g = FISH_TYPES.find(t => t.special === 'golden');
      fish.push(new Fish(g));
      this.lastGolden = this.elapsedMs;
    }
  }

  triggerBossSoon() {
    if (this.elapsedMs - this.lastBoss < SPAWN.bossIntervalMs) return false;
    this.pendingBoss = true;
    return true;
  }

  pickCommon() {
    return this.weightedList[(Math.random() * this.weightedList.length) | 0];
  }
}
