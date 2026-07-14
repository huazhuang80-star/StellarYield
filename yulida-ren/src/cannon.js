import { CANNON } from './config.js';
import { Bullet } from './bullet.js';

export class Cannon {
  constructor(getLevel) {
    this.baseX = CANNON.baseX;
    this.baseY = CANNON.baseY;
    this.angle = -Math.PI / 2;
    this.lastFire = -Infinity;
    this.getLevel = getLevel;
    this.recoil = 0;
  }

  currentLevel() {
    return CANNON.levels[this.getLevel() - 1];
  }

  aimAt(x, y) {
    let a = Math.atan2(y - this.baseY, x - this.baseX);
    // Cannon only aims into the upper half of the screen. Clamp the two lower
    // quadrants to the nearest horizontal edge (right or left).
    if (a >= 0) {
      a = (x >= this.baseX) ? CANNON.maxAngle : CANNON.minAngle;
    } else {
      a = Math.max(CANNON.minAngle, Math.min(CANNON.maxAngle, a));
    }
    this.angle = a;
  }

  tryFire(now, spendCoinsFn, spawnBullet) {
    const level = this.currentLevel();
    if (now - this.lastFire < CANNON.fireDelay) return false;
    if (!spendCoinsFn(level.cost)) return false;
    this.lastFire = now;
    this.recoil = 8;
    const bx = this.baseX + Math.cos(this.angle) * (CANNON.barrelLength + 10);
    const by = this.baseY + Math.sin(this.angle) * (CANNON.barrelLength + 10);
    spawnBullet(new Bullet(bx, by, this.angle, level.damage));
    return true;
  }

  update(dt) {
    if (this.recoil > 0) this.recoil = Math.max(0, this.recoil - dt * 0.05);
  }
}
