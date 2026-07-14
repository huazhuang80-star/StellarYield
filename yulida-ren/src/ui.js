import { LOGICAL_W, LOGICAL_H, CANNON, COLORS } from './config.js';
import { drawCoin } from './sprites.js';

// UI buttons operate in logical coordinates; hit-testing is done in Game via
// pointer coordinates (already de-letterboxed by Input).

export class UI {
  constructor(game) {
    this.game = game;
    this.buttons = this._layout();
    this.hoverId = null;
  }

  _layout() {
    return {
      levelDown: { x: 20, y: LOGICAL_H - 66, w: 44, h: 44, label: '-' },
      levelUp:   { x: LOGICAL_W - 64, y: LOGICAL_H - 66, w: 44, h: 44, label: '+' },
      autofire:  { x: LOGICAL_W - 274, y: 22, w: 88, h: 40, label: '连发' },
      mute:      { x: LOGICAL_W - 178, y: 22, w: 88, h: 40, label: '声音' },
      pause:     { x: LOGICAL_W - 82, y: 22, w: 60, h: 40, label: '⏸' }
    };
  }

  hitTest(x, y) {
    for (const [id, b] of Object.entries(this.buttons)) {
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return id;
    }
    return null;
  }

  render(ctx, state) {
    ctx.save();
    // top panel
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

    // Cannon controls
    const cannonLevel = CANNON.levels[state.cannonLevel - 1];
    this._levelPanel(ctx, state);
    this._chip(ctx, this.buttons.levelDown, COLORS.hudPanel, COLORS.hudText);
    this._chip(ctx, this.buttons.levelUp, COLORS.hudPanel, COLORS.hudText);
    ctx.fillStyle = cannonLevel.color;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Lv ${cannonLevel.level}  ·  伤害 ${cannonLevel.damage}  ·  每发 ${cannonLevel.cost}`, LOGICAL_W / 2, LOGICAL_H - 44);

    if (state.bossWarning > 0) this._bossBanner(ctx, state.bossWarning);
    if (state.paused) this._pauseOverlay(ctx, state);
    if (!state.started) this._startOverlay(ctx);
    if (state.portraitHint) this._portraitHint(ctx);

    ctx.restore();
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
    const y = 140;
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

  _pauseOverlay(ctx, state) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 48px system-ui, sans-serif';
    ctx.fillText('已暂停', LOGICAL_W / 2, LOGICAL_H / 2 - 30);
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText('点击右上角 ▶ 继续', LOGICAL_W / 2, LOGICAL_H / 2 + 20);
  }

  _startOverlay(ctx) {
    ctx.fillStyle = 'rgba(4, 16, 30, 0.82)';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    ctx.fillStyle = '#ffd54a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 68px system-ui, sans-serif';
    ctx.fillText('鱼乐达人', LOGICAL_W / 2, LOGICAL_H / 2 - 90);
    ctx.fillStyle = '#e6f4ff';
    ctx.font = '22px system-ui, sans-serif';
    ctx.fillText('原创捕鱼游戏', LOGICAL_W / 2, LOGICAL_H / 2 - 40);
    ctx.font = '17px system-ui, sans-serif';
    const lines = [
      '瞄准鱼群，点击/触摸发射炮弹',
      '击中即弹开鱼网，命中范围内所有鱼',
      '底部 - / + 切换炮台等级，等级越高伤害越大、每发消耗越多',
      '击杀金龙、海皇 Boss 获得高额金币',
      '进度自动保存到本地'
    ];
    lines.forEach((s, i) => ctx.fillText(s, LOGICAL_W / 2, LOGICAL_H / 2 + 10 + i * 28));
    ctx.fillStyle = '#ffd54a';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText('点击任意位置开始', LOGICAL_W / 2, LOGICAL_H / 2 + 190);
  }
}
