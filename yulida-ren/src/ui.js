import { LOGICAL_W, LOGICAL_H, CANNON, COLORS, ITEMS, COMBO } from './config.js';
import { drawCoin, drawItemIcon } from './sprites.js';

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
      settingsClose: { x: LOGICAL_W - 100, y: 60, w: 60, h: 40, label: '关闭' },
      settingsReset: { x: LOGICAL_W / 2 - 120, y: LOGICAL_H / 2 + 40, w: 240, h: 44, label: '重置存档' },
      settingsMute:  { x: LOGICAL_W / 2 - 120, y: LOGICAL_H / 2 + 100, w: 240, h: 44, label: '切换声音' }
    };
  }

  render(ctx, state, items, combo) {
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

    if (state.bossWarning > 0) this._bossBanner(ctx, state.bossWarning);
    if (state.settingsOpen) this._settingsOverlay(ctx, state);
    else if (state.paused) this._pauseOverlay(ctx);
    if (!state.started) this._startOverlay(ctx);
    if (state.portraitHint) this._portraitHint(ctx);

    ctx.restore();
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
    this._chip(ctx, btns.settingsReset, 'rgba(140,32,32,0.85)', '#ffe0e0');
    this._chip(ctx, btns.settingsMute, state.muted ? '#8b2c2c' : COLORS.hudPanel, state.muted ? '#ffe0e0' : COLORS.hudText);
    ctx.fillStyle = '#8bb0c8';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('版本 0.2.0 · 原创捕鱼 · 本地存档', LOGICAL_W / 2, LOGICAL_H - 100);
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
