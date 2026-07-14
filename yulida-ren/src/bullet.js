import { BULLET, LOGICAL_W, LOGICAL_H } from './config.js';

let nextId = 1;

export class Bullet {
  constructor(x, y, angle, damage) {
    this.id = nextId++;
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.vx = Math.cos(angle) * BULLET.speed;
    this.vy = Math.sin(angle) * BULLET.speed;
    this.radius = BULLET.radius;
    this.damage = damage;
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt / 1000;
    this.y += this.vy * dt / 1000;
    if (this.x < -40 || this.x > LOGICAL_W + 40 || this.y < -40 || this.y > LOGICAL_H + 40) {
      this.dead = true;
    }
  }
}

let nextNetId = 1;

export class Net {
  constructor(x, y, damage) {
    this.id = nextNetId++;
    this.x = x;
    this.y = y;
    this.damage = damage;
    this.radius = BULLET.netRadius;
    this.age = 0;
    this.duration = BULLET.netDuration;
    this.hitApplied = false;
    this.dead = false;
  }

  update(dt) {
    this.age += dt;
    if (this.age >= this.duration) this.dead = true;
  }

  // Apply damage exactly once at first frame.
  applyDamage(fishList, now, onCatch) {
    if (this.hitApplied) return;
    this.hitApplied = true;
    for (const f of fishList) {
      if (f.dying) continue;
      const dx = f.x - this.x;
      const dy = f.y - this.y;
      if (dx * dx + dy * dy <= (this.radius + f.boundsRadius()) ** 2) {
        const killed = f.hit(this.damage, now);
        if (killed) onCatch(f);
      }
    }
  }
}
