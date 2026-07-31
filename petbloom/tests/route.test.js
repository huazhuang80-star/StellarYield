import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseRoute, emptyParams, isSafeKey } from '../src/lib/route.js';

const KNOWN = ['home', 'knowledge', 'search', 'guide'];

test('解析路由 id 与查询参数', () => {
  assert.deepEqual(parseRoute('#knowledge?a=first72h', KNOWN), { id: 'knowledge', params: params({ a: 'first72h' }) });
  assert.equal(parseRoute('#home', KNOWN).id, 'home');
  assert.deepEqual({ ...parseRoute('#home', KNOWN).params }, {});
});

test('未知路由回退到 fallback', () => {
  assert.equal(parseRoute('#nope', KNOWN).id, 'home');
  assert.equal(parseRoute('#nope', KNOWN, 'search').id, 'search');
  assert.equal(parseRoute('', KNOWN).id, 'home');
  assert.equal(parseRoute(undefined, KNOWN).id, 'home');
});

test('多个参数与百分号编码都能正确解码', () => {
  const { params } = parseRoute('#search?q=%E6%B4%8B%E8%91%B1&kind=food', KNOWN);
  assert.equal(params.q, '洋葱');
  assert.equal(params.kind, 'food');
});

test('值里包含 = 或 & 编码时不会截断', () => {
  const { params } = parseRoute('#search?q=' + encodeURIComponent('a=b&c'), KNOWN);
  assert.equal(params.q, 'a=b&c');
});

// ── 安全性：地址栏是完全由用户控制的输入 ──────────────────────

test('参数容器没有原型，无法被污染', () => {
  const { params } = parseRoute('#home?a=1', KNOWN);
  assert.equal(Object.getPrototypeOf(params), null);
  assert.equal(Object.getPrototypeOf(emptyParams()), null);
});

test('拒绝写入 __proto__ / constructor / prototype 等危险键', () => {
  const { params } = parseRoute('#home?__proto__=polluted&constructor=x&prototype=y&safe=ok', KNOWN);
  assert.equal(params.safe, 'ok');
  assert.equal(params.__proto__, undefined);
  assert.equal(params.constructor, undefined);
  assert.equal(params.prototype, undefined);
});

test('解析恶意 hash 之后，全局原型未被污染', () => {
  parseRoute('#home?__proto__=polluted', KNOWN);
  parseRoute('#home?__proto__[polluted]=1', KNOWN);
  assert.equal({}.polluted, undefined);
  assert.equal(Object.prototype.polluted, undefined);
  assert.equal(({}).__proto__, Object.prototype);
});

test('isSafeKey 拦截危险键名', () => {
  assert.equal(isSafeKey('species'), true);
  assert.equal(isSafeKey('__proto__'), false);
  assert.equal(isSafeKey('constructor'), false);
  assert.equal(isSafeKey('prototype'), false);
  assert.equal(isSafeKey(''), false);
  assert.equal(isSafeKey(null), false);
});

/** 构造用于比较的无原型对象。 */
function params(obj) {
  return Object.assign(Object.create(null), obj);
}
