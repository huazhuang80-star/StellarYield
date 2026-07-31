/**
 * hash 路由解析。
 *
 * 单独抽出来有两个原因：一是它是纯函数，可以单测；二是它处理的是
 * **用户完全可控的输入**（地址栏里的任何东西），必须当成不可信数据。
 *
 * 参数用 Map 承载，而不是普通对象。原因不只是"更安全一点"：
 * 把远程可控的字符串当属性名写进对象，本身就是一类漏洞（原型污染 /
 * 属性注入）—— `#home?__proto__=x` 会污染 Object.prototype，进而改变
 * 页面上所有对象的行为。用 Map 之后这类写入根本不存在，也就不需要
 * 依赖"我有没有把危险键名列全"这种容易漏的判断。
 *
 * 代价是取值要写成 `params.get('a')` 而不是 `params.a`，很小的代价。
 */

/**
 * 解析 `#route?a=1&b=2`。
 * @param {string} hash      形如 '#knowledge?a=first72h'
 * @param {string[]} known   已注册的路由 id；不在其中时回退到 fallback
 * @param {string} fallback
 * @returns {{id: string, params: Map<string, string>}}
 */
export function parseRoute(hash, known = [], fallback = 'home') {
  const raw = String(hash ?? '').replace(/^#/, '');
  const cut = raw.indexOf('?');
  const id = cut === -1 ? raw : raw.slice(0, cut);
  const query = cut === -1 ? '' : raw.slice(cut + 1);

  // URLSearchParams 负责百分号解码与 '+' 的处理，比手工 split 可靠；
  // 它本身就是一个键值集合，直接转成 Map，全程没有属性写入。
  const params = new Map(query ? new URLSearchParams(query) : []);

  return { id: known.includes(id) ? id : fallback, params };
}

/** 空参数集合，供无参数场景复用。 */
export function emptyParams() {
  return new Map();
}

/**
 * 从参数里取一个数字。取不到或不是有效数字时返回 null，
 * 调用方不必再各自写一遍 Number() 与 NaN 判断。
 */
export function paramInt(params, key) {
  const raw = params?.get?.(key);
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
