/**
 * hash 路由解析。
 *
 * 单独抽出来有两个原因：一是它是纯函数，可以单测；二是它处理的是
 * **用户完全可控的输入**（地址栏里的任何东西），必须当成不可信数据。
 *
 * 具体风险：把 `#home?__proto__=x` 里的键直接当属性名写进普通对象字面量，
 * 会污染 Object.prototype，进而影响全局所有对象的行为。所以这里用
 * 无原型对象存放参数，并显式拒绝几个危险键名。
 */

/** 永远不作为属性名写入的键。 */
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/** 创建一个安全的参数容器：没有原型，也就没有可污染的原型。 */
export function emptyParams() {
  return Object.create(null);
}

/**
 * 解析 `#route?a=1&b=2`。
 * @param {string} hash      形如 '#knowledge?a=first72h'
 * @param {string[]} known   已注册的路由 id；不在其中时回退到 fallback
 * @param {string} fallback
 * @returns {{id: string, params: object}} params 为无原型对象
 */
export function parseRoute(hash, known = [], fallback = 'home') {
  const raw = String(hash ?? '').replace(/^#/, '');
  const cut = raw.indexOf('?');
  const id = cut === -1 ? raw : raw.slice(0, cut);
  const query = cut === -1 ? '' : raw.slice(cut + 1);

  const params = emptyParams();
  if (query) {
    // URLSearchParams 负责百分号解码与 '+' 的处理，比手工 split 可靠
    for (const [key, value] of new URLSearchParams(query)) {
      if (FORBIDDEN_KEYS.has(key)) continue;
      params[key] = value;
    }
  }

  return { id: known.includes(id) ? id : fallback, params };
}

/** 供其他模块复用的键名安全检查（例如向导把参数键转成节点 id）。 */
export function isSafeKey(key) {
  return typeof key === 'string' && key.length > 0 && !FORBIDDEN_KEYS.has(key);
}
