import { LOGICAL_W, LOGICAL_H, CANNON, COLORS, ITEMS, COMBO, FISH_TYPES } from './config.js';
import { drawCoin, drawItemIcon, drawFish } from './sprites.js';

export class UI {
  constructor(game) {
    this.game = game;
    this.buttons = this._layout();
  }

  _layout() {
    const y = LOGICAL_H - 66;
    return {
      levelDown: { x: 20, y, w: 44, h: 44, label: '-' },
      levelUp:   { x: LOGICAL_W - 64, y, w: 44, h: 44, label: '+' },
      autofire:  { x: LOGICAL_W - 274, y: 22, w: 88, h: 40, label: '连发' },
      mute:      { x: LOGICAL_W - 178, y: 22, w: 88, h: 40, label: '声音' },
      pause:     { x: LOGICAL_W - 82, y: 22, w: 60, h: 40, label: '⏸' },
      settings:  { x: LOGICAL_W - 340, y: 22, w: 60, h: 40, label: '⚙' },
      itemFreeze:    { x: LOGICAL_W / 2 - 96,  y: 74, w: 56, h: 56, label: '❄' },
      itemBomb:      { x: LOGICAL_W / 2 - 28,  y: 74, w: 56, h: 56, label: '💣' },
      itemLightning: { x: LOGICAL_W / 2 + 40,  y: 74, w: 56, h: 56, label: '⚡' }
    };
  }

  hitTest(x, y) {
    for (const [id, b] of Object.entries(this.buttons)) {
      if (id.startsWith('item') && !this.game.items.count(itemIdOf(id))) continue;
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return id;
    }
    return null;
  }

  settingsHitTest(x, y) {
    for (const [id, b] of Object.entries(this._settingsButtons())) {
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return id;
    }
    return null;
  }

  _settingsButtons() {
    return {
      settingsClose:    { x: LOGICAL_W - 100, y: 60, w: 60, h: 40, label: '关闭' },
      settingsMissions: { x: LOGICAL_W / 2 - 120, y: LOGICAL_H / 2 - 80, w: 240, h: 44, label: '每日任务' },
      settingsCodex:    { x: LOGICAL_W / 2 - 120, y: LOGICAL_H / 2 - 20, w: 240, h: 44, label: '鱼类图鉴' },
      settingsMusic:    { x: LOGICAL_W / 2 - 250, y: LOGICAL_H / 2 + 40, w: 240, h: 44, label: '音乐' },
      settingsSfx:      { x: LOGICAL_W / 2 + 10,  y: LOGICAL_H / 2 + 40, w: 240, h: 44, label: '音效' },
      settingsMute:     { x: LOGICAL_W / 2 - 250, y: LOGICAL_H / 2 + 100, w: 240, h: 44, label: '切换声音' },
      settingsReset:    { x: LOGICAL_W / 2 + 10,  y: LOGICAL_H / 2 + 100, w: 240, h: 44, label: '重置存档' }
    };
  }

  _missionsButtons() {
    return {
      missionsClose: { x: LOGICAL_W - 100, y: 60, w: 60, h: 40, label: '关闭' },
      missionsClaim: { x: LOGICAL_W / 2 - 130, y: LOGICAL_H - 96, w: 260, h: 48, label: '领取奖励' }
    };
  }

  missionsHitTest(x, y) {
    for (const [id, b] of Object.entries(this._missionsButtons())) {
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return id;
    }
    return null;
  }

  _codexButtons() {
    return {
      codexClose: { x: LOGICAL_W - 100, y: 60, w: 60, h: 40, label: '关闭' }
    };
  }

  codexHitTest(x, y) {
    for (const [id, b] of Object.entries(this._codexButtons())) {
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return id;
    }
    return null;
  }

  render(ctx, state, items, combo, extras = {}) {
    ctx.save();
    // top-left coin panel
    this._roundPanel(ctx, 20, 22, 260, 40, COLORS.hudPanel);
    drawCoin(ctx, 40, 42, 14);
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(String(state.coins), 60, 42);
    ctx.fillStyle = COLORS.hudText;
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText(`已捕获 ${state.totalCaught}`, 150, 42);

    // right-side chips
    this._chip(ctx, this.buttons.autofire, state.autofire ? '#2ea56b' : COLORS.hudPanel, state.autofire ? '#e6ffe9' : COLORS.hudText);
    this._chip(ctx, this.buttons.mute, state.muted ? '#8b2c2c' : COLORS.hudPanel, state.muted ? '#ffe0e0' : COLORS.hudText, state.muted ? '静音' : '声音');
    this._chip(ctx, this.buttons.pause, COLORS.hudPanel, COLORS.hudText, state.paused ? '▶' : '⏸');
    this._chip(ctx, this.buttons.settings, COLORS.hudPanel, COLORS.hudText);

    // cannon controls
    const cannonLevel = CANNON.levels[state.cannonLevel - 1];
    this._levelPanel(ctx, state);
    this._chip(ctx, this.buttons.levelDown, COLORS.hudPanel, COLORS.hudText);
    this._chip(ctx, this.buttons.levelUp, COLORS.hudPanel, COLORS.hudText);
    ctx.fillStyle = cannonLevel.color;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Lv ${cannonLevel.level}  ·  伤害 ${cannonLevel.damage}  ·  每发 ${cannonLevel.cost}`, LOGICAL_W / 2, LOGICAL_H - 44);

    // Item bar (only render slots that are non-empty; button is greyed if zero)
    this._itemSlot(ctx, this.buttons.itemFreeze,    ITEMS.freeze,    items.count('freeze'));
    this._itemSlot(ctx, this.buttons.itemBomb,      ITEMS.bomb,      items.count('bomb'));
    this._itemSlot(ctx, this.buttons.itemLightning, ITEMS.lightning, items.count('lightning'));

    // Combo
    if (combo.count >= COMBO.levels[1].threshold) {
      const lvl = COMBO.levels[combo.level];
      ctx.save();
      ctx.font = 'bold 40px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = lvl.color;
      ctx.shadowColor = lvl.color;
      ctx.shadowBlur = 12;
      ctx.fillText(`${combo.count} 连击  ×${lvl.mult}`, LOGICAL_W / 2, 40);
      ctx.restore();
    }

    if (extras.boss) this._bossHpBar(ctx, extras.boss);
    if (extras.raining) this._rainBanner(ctx);
    if (state.bossWarning > 0) this._bossBanner(ctx, state.bossWarning);
    if (extras.missionToasts) this._missionToasts(ctx, extras.missionToasts, performance.now());
    if (state.codexOpen) this._codexOverlay(ctx, extras.now, state.speciesKills || {});
    else if (state.missionsOpen) this._missionsOverlay(ctx, extras.missions);
    else if (state.settingsOpen) this._settingsOverlay(ctx, state);
    else if (state.paused) this._pauseOverlay(ctx);
    if (!state.started) this._startOverlay(ctx);
    if (state.portraitHint) this._portraitHint(ctx);

    ctx.restore();
  }

  _missionToasts(ctx, toasts, now) {
    let y = LOGICAL_H - 200;
    for (const t of toasts) {
      const age = now - t.start;
      const p = age / t.duration;
      const slide = Math.min(1, age / 200);
      const fade = age > t.duration - 300 ? (t.duration - age) / 300 : 1;
      ctx.save();
      ctx.globalAlpha = slide * fade;
      const x = 20 - 40 * (1 - slide);
      this._roundPanel(ctx, x, y, 320, 46, 'rgba(60,42,4,0.9)');
      ctx.fillStyle = '#ffe89a';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.text, x + 14, y + 23);
      ctx.restore();
      y -= 54;
    }
  }

  _missionsOverlay(ctx, missions) {
    ctx.fillStyle = 'rgba(4, 16, 30, 0.94)';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    ctx.fillStyle = '#ffd54a';
    ctx.font = 'bold 36px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📋 每日任务', LOGICAL_W / 2, 44);
    this._chip(ctx, this._missionsButtons().missionsClose, COLORS.hudPanel, COLORS.hudText);
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = '#8bb0c8';
    const hrsLeft = Math.max(0, Math.ceil((24 * 3600 * 1000 - (Date.now() - missions.dayStart)) / 3600000));
    ctx.fillText(`剩余刷新时间约 ${hrsLeft} 小时`, LOGICAL_W / 2, 90);

    if (!missions || !missions.missions) return;
    let totalPending = 0;
    missions.missions.forEach((m, i) => {
      const t = missions.templateOf(m);
      const y = 140 + i * 120;
      const w = 640, x = (LOGICAL_W - w) / 2;
      this._roundPanel(ctx, x, y, w, 100, 'rgba(12,28,44,0.7)');
      ctx.fillStyle = m.done ? '#a4f0b7' : '#e6f4ff';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(missions.labelOf(m), x + 20, y + 16);
      const bar = { x: x + 20, y: y + 56, w: w - 200, h: 12 };
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
      ctx.fillStyle = m.done ? '#5ee08a' : '#ffd54a';
      const p = Math.min(1, m.progress / t.goal);
      ctx.fillRect(bar.x, bar.y, bar.w * p, bar.h);
      ctx.fillStyle = '#e6f4ff';
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillText(`${Math.min(m.progress, t.goal)} / ${t.goal}`, bar.x, bar.y + 22);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffd54a';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.fillText(`+${t.reward} 金币`, x + w - 20, y + 26);
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillStyle = m.claimed ? '#8bb0c8' : m.done ? '#5ee08a' : '#8bb0c8';
      ctx.fillText(m.claimed ? '已领取' : m.done ? '可领取' : '进行中', x + w - 20, y + 58);
      if (m.done && !m.claimed) totalPending += t.reward;
    });

    const btn = this._missionsButtons().missionsClaim;
    const bg = totalPending > 0 ? 'rgba(60,140,80,0.9)' : COLORS.hudPanel;
    this._chip(ctx, btn, bg, '#ffffff', totalPending > 0 ? `领取 +${totalPending} 金币` : '暂无可领奖励');
  }

  _codexOverlay(ctx, now, speciesKills) {
    ctx.fillStyle = 'rgba(4, 16, 30, 0.94)';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    ctx.fillStyle = '#ffd54a';
    ctx.font = 'bold 36px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐟 鱼类图鉴', LOGICAL_W / 2, 44);
    this._chip(ctx, this._codexButtons().codexClose, COLORS.hudPanel, COLORS.hudText);

    const perRow = 3;
    const cellW = 380, cellH = 140;
    const startX = (LOGICAL_W - perRow * cellW) / 2;
    const startY = 90;
    FISH_TYPES.forEach((t, i) => {
      const row = Math.floor(i / perRow), col = i % perRow;
      const cx = startX + col * cellW + cellW / 2;
      const cy = startY + row * cellH + cellH / 2;
      this._roundPanel(ctx, cx - cellW / 2 + 8, cy - cellH / 2 + 8, cellW - 16, cellH - 16, 'rgba(12,28,44,0.7)');
      // Draw a live sprite preview.
      const preview = {
        type: t, x: cx - 100, y: cy, size: Math.min(60, t.size * 0.85),
        heading: 0, phase: i * 0.5, dying: false, dyingT: 0, hp: t.hp, maxHp: t.hp
      };
      ctx.save();
      drawFish(ctx, preview, now || 0);
      ctx.restore();
      // Text.
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffd54a';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText(t.name, cx - 20, cy - 40);
      ctx.fillStyle = '#e6f4ff';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText(`HP ${t.hp}   金币 ${t.coins}`, cx - 20, cy - 10);
      ctx.fillStyle = '#8bb0c8';
      ctx.font = '12px system-ui, sans-serif';
      const tag = t.special === 'boss' ? 'Boss · 必掉道具'
                : t.special === 'golden' ? '稀有 · 高掉落'
                : '常见';
      ctx.fillText(tag, cx - 20, cy + 14);
      const kills = (speciesKills[t.id] || 0);
      ctx.fillStyle = kills > 0 ? '#ffd54a' : '#5a6f80';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText(`累计 ${kills}`, cx - 20, cy + 34);
    });
  }

  _itemSlot(ctx, b, item, count) {
    const size = 24;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    ctx.save();
    if (count === 0) ctx.globalAlpha = 0.35;
    drawItemIcon(ctx, cx, cy, size, item);
    if (count > 0) {
      ctx.fillStyle = '#0b1a24';
      ctx.beginPath();
      ctx.arc(cx + size - 4, cy + size - 4, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(count), cx + size - 4, cy + size - 3);
    }
    ctx.restore();
  }

  _levelPanel(ctx, state) {
    const w = 340, h = 44, x = (LOGICAL_W - w) / 2, y = LOGICAL_H - 66;
    this._roundPanel(ctx, x, y, w, h, COLORS.hudPanel);
    const filled = state.cannonLevel / CANNON.levels.length;
    ctx.fillStyle = 'rgba(255,213,74,0.85)';
    ctx.fillRect(x + 10, y + h - 8, (w - 20) * filled, 3);
  }

  _chip(ctx, b, bg, fg, override) {
    this._roundPanel(ctx, b.x, b.y, b.w, b.h, bg);
    ctx.fillStyle = fg;
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(override ?? b.label, b.x + b.w / 2, b.y + b.h / 2);
  }

  _roundPanel(ctx, x, y, w, h, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = COLORS.hudBorder;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  _bossHpBar(ctx, boss) {
    const w = 560, h = 22, x = (LOGICAL_W - w) / 2, y = 140;
    this._roundPanel(ctx, x, y, w, h, 'rgba(20,6,12,0.85)');
    const p = Math.max(0, boss.hp / boss.maxHp);
    const grad = ctx.createLinearGradient(x, y, x + w, y);
    grad.addColorStop(0, '#ff5c9c');
    grad.addColorStop(1, '#ffd54a');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x + 3, y + 3, (w - 6) * p, h - 6, 6);
    ctx.fill();
    ctx.fillStyle = '#ffe6ec';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`海皇 · ${Math.max(0, Math.ceil(boss.hp))} / ${boss.maxHp}`, x + w / 2, y + h / 2);
  }

  _rainBanner(ctx) {
    const w = 300, h = 40, x = LOGICAL_W - w - 20, y = 82;
    this._roundPanel(ctx, x, y, w, h, 'rgba(60,42,4,0.85)');
    ctx.fillStyle = '#ffd54a';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('☂ 金龙暴风 ☂', x + w / 2, y + h / 2);
  }

  _bossBanner(ctx, ttlMs) {
    const y = 150;
    ctx.save();
    const t = Math.min(1, ttlMs / 400);
    ctx.globalAlpha = t;
    this._roundPanel(ctx, LOGICAL_W / 2 - 200, y, 400, 68, 'rgba(60,10,20,0.85)');
    ctx.fillStyle = '#ffdcdc';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚠ 海皇即将出现 ⚠', LOGICAL_W / 2, y + 34);
    ctx.restore();
  }

  _pauseOverlay(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 48px system-ui, sans-serif';
    ctx.fillText('已暂停', LOGICAL_W / 2, LOGICAL_H / 2 - 30);
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText('点击右上角 ▶ 继续 · 按 P 键也可', LOGICAL_W / 2, LOGICAL_H / 2 + 20);
  }

  _startOverlay(ctx) {
    ctx.fillStyle = 'rgba(4, 16, 30, 0.82)';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    ctx.fillStyle = '#ffd54a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 68px system-ui, sans-serif';
    ctx.fillText('鱼乐达人', LOGICAL_W / 2, LOGICAL_H / 2 - 130);
    ctx.fillStyle = '#e6f4ff';
    ctx.font = '22px system-ui, sans-serif';
    ctx.fillText('原创捕鱼游戏', LOGICAL_W / 2, LOGICAL_H / 2 - 80);
    ctx.font = '17px system-ui, sans-serif';
    const lines = [
      '瞄准鱼群，点击/触摸发射炮弹',
      '击中即弹开鱼网，命中范围内所有鱼',
      '底部 - / + 切换炮台等级；等级越高伤害越大、每发消耗越多',
      '击杀 Boss / 金龙 / 鲨鱼 会掉落道具',
      '道具槽点击或按 1 / 2 / 3 使用 ❄ 💣 ⚡',
      '连击超过 3 条鱼开启金币倍率',
      '进度自动保存到本地'
    ];
    lines.forEach((s, i) => ctx.fillText(s, LOGICAL_W / 2, LOGICAL_H / 2 - 30 + i * 26));
    ctx.fillStyle = '#ffd54a';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText('点击任意位置开始', LOGICAL_W / 2, LOGICAL_H / 2 + 190);
  }

  _settingsOverlay(ctx, state) {
    ctx.fillStyle = 'rgba(4, 16, 30, 0.86)';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    ctx.fillStyle = '#ffd54a';
    ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('设置', LOGICAL_W / 2, LOGICAL_H / 2 - 100);
    const btns = this._settingsButtons();
    this._chip(ctx, btns.settingsClose, COLORS.hudPanel, COLORS.hudText);
    this._chip(ctx, btns.settingsMissions, 'rgba(60,120,180,0.85)', '#e6f4ff');
    this._chip(ctx, btns.settingsCodex, 'rgba(60,120,180,0.85)', '#e6f4ff');
    const musicPct = Math.round((state.musicVol ?? 0.55) * 100);
    const sfxPct = Math.round((state.sfxVol ?? 0.9) * 100);
    this._chip(ctx, btns.settingsMusic, COLORS.hudPanel, COLORS.hudText, `音乐 ${musicPct}%`);
    this._chip(ctx, btns.settingsSfx, COLORS.hudPanel, COLORS.hudText, `音效 ${sfxPct}%`);
    this._chip(ctx, btns.settingsMute, state.muted ? '#8b2c2c' : COLORS.hudPanel, state.muted ? '#ffe0e0' : COLORS.hudText, state.muted ? '取消静音' : '静音');
    this._chip(ctx, btns.settingsReset, 'rgba(140,32,32,0.85)', '#ffe0e0');
    ctx.fillStyle = '#8bb0c8';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('版本 0.4.0 · 原创捕鱼 · 本地存档', LOGICAL_W / 2, LOGICAL_H - 60);
  }

  _portraitHint(ctx) {
    ctx.fillStyle = 'rgba(4, 16, 30, 0.75)';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    ctx.fillStyle = '#ffd54a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 40px system-ui, sans-serif';
    ctx.fillText('📱 请横屏游玩', LOGICAL_W / 2, LOGICAL_H / 2 - 20);
    ctx.fillStyle = '#e6f4ff';
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('Rotate your device to landscape', LOGICAL_W / 2, LOGICAL_H / 2 + 24);
  }
}

function itemIdOf(buttonId) {
  if (buttonId === 'itemFreeze') return 'freeze';
  if (buttonId === 'itemBomb') return 'bomb';
  if (buttonId === 'itemLightning') return 'lightning';
  return '';
}
