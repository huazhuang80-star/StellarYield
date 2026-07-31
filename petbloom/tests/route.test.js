import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseRoute, emptyParams, paramInt } from '../src/lib/route.js';

const KNOWN = ['home', 'knowledge', 'search', 'guide'];

test('解析路由 id 与查询参数', () => {
  const { id, params } = parseRoute('#knowledge?a=first72h', KNOWN);
  assert.equal(id, 'knowledge');
  assert.equal(params.get('a'), 'first72h');
  assert.equal(parseRoute('#home', KNOWN).id, 'home');
  assert.equal(parseRoute('#home', KNOWN).params.size, 0);
});

test('未知路由回退到 fallback', () => {
  assert.equal(parseRoute('#nope', KNOWN).id, 'home');
  assert.equal(parseRoute('#nope', KNOWN, 'search').id, 'search');
  assert.equal(parseRoute('', KNOWN).id, 'home');
  assert.equal(parseRoute(undefined, KNOWN).id, 'home');
});

test('多个参数与百分号编码都能正确解码', () => {
  const { params } = parseRoute('#search?q=%E6%B4%8B%E8%91%B1&kind=food', KNOWN);
  assert.equal(params.get('q'), '洋葱');
  assert.equal(params.get('kind'), 'food');
});

test('值里包含 = 或 & 编码时不会截断', () => {
  const { params } = parseRoute('#search?q=' + encodeURIComponent('a=b&c'), KNOWN);
  assert.equal(params.get('q'), 'a=b&c');
});

// ── 安全性：地址栏是完全由用户控制的输入 ──────────────────────

test('参数用 Map 承载，不做任何动态属性写入', () => {
  const { params } = parseRoute('#home?a=1', KNOWN);
  assert.ok(params instanceof Map);
  assert.ok(emptyParams() instanceof Map);
});

test('危险键名只是普通的 Map 键，不会碰到原型', () => {
  const { params } = parseRoute('#home?__proto__=polluted&constructor=x&safe=ok', KNOWN);
  assert.equal(params.get('safe'), 'ok');
  assert.equal(params.get('__proto__'), 'polluted'); // 作为数据存在，但只是 Map 的键
  assert.equal({}.polluted, undefined);
  assert.equal(Object.prototype.polluted, undefined);
});

test('解析恶意 hash 之后，全局原型未被污染', () => {
  parseRoute('#home?__proto__=polluted', KNOWN);
  parseRoute('#home?__proto__[polluted]=1', KNOWN);
  parseRoute('#home?constructor[prototype][polluted]=1', KNOWN);
  assert.equal({}.polluted, undefined);
  assert.equal(Object.prototype.polluted, undefined);
  assert.equal(Object.getPrototypeOf({}), Object.prototype);
  assert.equal(new Map().polluted, undefined);
});

test('paramInt 只接受有效数字', () => {
  const { params } = parseRoute('#guide?n_a=2&n_b=abc&n_c=&n_d=0', KNOWN);
  assert.equal(paramInt(params, 'n_a'), 2);
  assert.equal(paramInt(params, 'n_b'), null);
  assert.equal(paramInt(params, 'n_c'), null);
  assert.equal(paramInt(params, 'n_d'), 0);
  assert.equal(paramInt(params, 'missing'), null);
  assert.equal(paramInt(null, 'x'), null);
});
