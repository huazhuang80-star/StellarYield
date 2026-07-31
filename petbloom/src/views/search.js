/** 全局搜索：一个框搜遍食物、行为、知识、急救、避坑、名词与常见问题。 */

import { h, raw, esc, emptyState } from '../ui.js';
import { searchAll, KINDS, SUGGESTIONS } from '../lib/search.js';
import { SPECIES } from '../data/species.js';

export default {
  id: 'search',
  title: '搜索',

  render(ctx) {
    const q = ctx.params.q ?? '';
    const sp = SPECIES[ctx.pet.species];
    const results = searchAll(q, ctx.pet.species);
    const grouped = new Map();
    for (const r of results) {
      if (!grouped.has(r.kind)) grouped.set(r.kind, []);
      grouped.get(r.kind).push(r);
    }

    return h`
      <h1 class="page-title">🔍 搜索</h1>
      <div class="search-row">
        <input type="search" id="q" placeholder="食物、症状、行为、名词都可以" value="${q}" autocomplete="off">
      </div>
      <p class="muted">结论会按当前宠物（${sp.emoji} ${sp.name}）给出 —— 同一样东西对不同物种的答案可能完全相反。</p>

      ${!q
        ? h`<div class="chips">${SUGGESTIONS.map((s) => raw(`<a class="chip" href="#search?q=${encodeURIComponent(s)}">${esc(s)}</a>`))}</div>`
        : results.length
          ? raw(
              [...grouped.entries()]
                .map(([kind, items]) => {
                  const meta = KINDS[kind];
                  return `<section class="link-group">
                    <h3 class="group-title">${meta.icon} ${esc(meta.name)}（${items.length}）</h3>
                    <div class="rows">${items
                      .map(
                        (i) => `<a class="row-link${i.tone ? ' tone-' + i.tone : ''}" href="${esc(i.route)}">
                          <span class="row-text"><b>${esc(i.title)}</b><small class="muted">${esc(i.subtitle)}</small></span>
                          <span class="row-arrow" aria-hidden="true">›</span>
                        </a>`,
                      )
                      .join('')}</div>
                  </section>`;
                })
                .join(''),
            )
          : raw(
              emptyState(
                `没有找到「${esc(q)}」。库里查不到不等于安全 —— 尤其是食物，不确定就先不给。`,
                '<a class="btn" href="#guide">试试养护向导</a>',
              ),
            )}
    `;
  },

  bind(root, ctx) {
    const input = root.querySelector('#q');
    if (!input) return;
    let timer = null;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        ctx.navigate(input.value ? `search?q=${encodeURIComponent(input.value)}` : 'search', { keepFocus: '#q' });
      }, 220);
    });
  },
};
