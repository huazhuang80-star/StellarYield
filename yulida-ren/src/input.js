import { LOGICAL_W, LOGICAL_H } from './config.js';

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.pointer = { x: LOGICAL_W / 2, y: LOGICAL_H / 2, active: false, downThisFrame: false, held: false };
    this._downLatch = false;
    this._clickListeners = [];

    canvas.addEventListener('mousemove', e => this._updateFromEvent(e));
    canvas.addEventListener('mousedown', e => { this._updateFromEvent(e); this._press(); });
    canvas.addEventListener('mouseup',   e => { this._updateFromEvent(e); this._release(); });
    canvas.addEventListener('mouseleave', () => { this.pointer.held = false; });

    canvas.addEventListener('touchstart', e => {
      if (e.touches.length) this._updateFromTouch(e.touches[0]);
      this._press();
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchmove', e => {
      if (e.touches.length) this._updateFromTouch(e.touches[0]);
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchend', e => {
      this._release();
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchcancel', () => this._release());
  }

  onClick(fn) {
    this._clickListeners.push(fn);
  }

  _updateFromEvent(e) {
    const rect = this.canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    this._setPointerFromCss(cssX, cssY, rect.width, rect.height);
    this.pointer.active = true;
  }

  _updateFromTouch(t) {
    const rect = this.canvas.getBoundingClientRect();
    const cssX = t.clientX - rect.left;
    const cssY = t.clientY - rect.top;
    this._setPointerFromCss(cssX, cssY, rect.width, rect.height);
    this.pointer.active = true;
  }

  _setPointerFromCss(cssX, cssY, cssW, cssH) {
    const scale = Math.min(cssW / LOGICAL_W, cssH / LOGICAL_H);
    const offsetX = (cssW - LOGICAL_W * scale) / 2;
    const offsetY = (cssH - LOGICAL_H * scale) / 2;
    this.pointer.x = (cssX - offsetX) / scale;
    this.pointer.y = (cssY - offsetY) / scale;
  }

  _press() {
    this.pointer.held = true;
    this._downLatch = true;
    for (const fn of this._clickListeners) fn(this.pointer.x, this.pointer.y);
  }

  _release() {
    this.pointer.held = false;
  }

  beginFrame() {
    this.pointer.downThisFrame = this._downLatch;
    this._downLatch = false;
  }
}
