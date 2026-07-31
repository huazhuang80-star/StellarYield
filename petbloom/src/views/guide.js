/**
 * 养护向导：规则式引导问答。
 *
 * 刻意不叫"AI 助手" —— 它是一棵写死的决策树，每个结论都能追溯到具体分支，
 * 不会编造，但覆盖面有限，所以每条结论都给出下一步该去哪。
 */

import { h, raw, esc, card, linkRow, linkGroup } from '../ui.js';
import { GUIDES, guideById } from '../data/guide.js';

/** 走一遍决策树：answers 是节点 id 到所选项索引的映射。 */
function walk(guide, answers) {
  const path = [];
  let nodeId = guide.start;
  let result = null;
  let guard = 0;

  while (nodeId && guard++ < 20) {
    const node = guide.nodes[nodeId];
    if (!node) break;
    const picked = answers[nodeId];
    path.push({ id: nodeId, node, picked });
    if (picked == null) break;
    const option = node.options[picked];
    if (!option) break;
    if (option.result) {
      result = guide.results[option.result];
      break;
    }
    nodeId = option.next;
  }
  return { path, result };
}

export default {
  id: 'guide',
  title: '养护向导',

  render(ctx) {
    const guide = guideById(ctx.params.g);
    if (!guide) {
      return h`
        <h1 class="page-title">🧭 养护向导</h1>
        <p class="lede">不知道从哪问起时，从这里开始。几个问题之内给你一个明确的行动。</p>
        ${raw(linkGroup('', GUIDES.map((g) => linkRow(`#guide?g=${g.id}`, g.icon, g.title, g.intro))))}
        ${raw(
          card(
            '它不是 AI',
            `<p>这是一棵写死的决策树，不是模型。好处是每个结论都可以追溯到你选的那几个分支，不会编造；代价是覆盖面有限。</p>
             <p class="muted">遇到向导没覆盖的情况，用顶部搜索，或者直接做一次症状自查。</p>
             <a class="btn ghost" href="#triage">去做症状自查</a>`,
            { icon: 'ℹ️' },
          ),
        )}`;
    }

    const answers = {};
    for (const [k, v] of Object.entries(ctx.params)) {
      if (k.startsWith('n_')) answers[k.slice(2)] = Number(v);
    }
    const { path, result } = walk(guide, answers);
    const baseParams = Object.entries(answers).map(([k, v]) => `n_${k}=${v}`);

    return h`
      <a class="back-link" href="#guide">‹ 全部向导</a>
      <h1 class="page-title">${guide.icon} ${guide.title}</h1>
      <p class="lede">${guide.intro}</p>

      ${path.map((step, i) =>
        raw(
          card(
            `第 ${i + 1} 步`,
            `<p class="q-text">${esc(step.node.q)}</p>
             <div class="options">${step.node.options
               .map((o, idx) => {
                 const params = [...baseParams.filter((p) => !p.startsWith(`n_${step.id}=`)), `n_${step.id}=${idx}`];
                 const selected = step.picked === idx;
                 return `<a class="opt ${selected ? 'selected' : ''}" href="#guide?g=${guide.id}&${params.join('&')}">${esc(o.t)}</a>`;
               })
               .join('')}</div>`,
          ),
        ),
      )}

      ${result
        ? raw(
            card(
              result.title,
              `<ul class="bullets">${result.body.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
               <div class="chips">${(result.links ?? []).map(([href, label]) => `<a class="chip" href="${esc(href)}">${esc(label)}</a>`).join('')}</div>`,
              { icon: result.tone === 'danger' ? '🔴' : result.tone === 'warn' ? '🟡' : '🟢', tone: result.tone === 'good' ? '' : result.tone },
            ) + `<a class="btn ghost block" href="#guide?g=${guide.id}">重新走一遍</a>`,
          )
        : ''}

      <p class="disclaimer">向导给的是行动方向，不是诊断。任何时候拿不准，直接联系兽医永远是正确选择。</p>
    `;
  },
};
