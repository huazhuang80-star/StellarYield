/** 知识库：分类浏览 + 文章详情。 */

import { h, raw, esc, card, linkRow, linkGroup, emptyState } from '../ui.js';
import { CATEGORIES, ARTICLES, articlesFor, articleById } from '../data/knowledge.js';
import { SPECIES } from '../data/species.js';

export default {
  id: 'knowledge',
  title: '知识库',

  render(ctx) {
    const articleId = ctx.params.get('a');
    if (articleId) return renderArticle(articleId, ctx);

    const sp = SPECIES[ctx.pet.species];
    const available = articlesFor(ctx.pet.species);
    const activeCat = ctx.params.get('c');
    const shown = activeCat ? available.filter((a) => a.cat === activeCat) : available;

    return h`
      <h1 class="page-title">📖 知识库</h1>
      <p class="muted">${available.length} 篇按「为什么重要 → 怎么做 → 常见误区」写的短文，已按${sp.name}过滤。</p>

      <div class="chips filter-chips">
        <a class="chip ${raw(activeCat ? '' : 'active')}" href="#knowledge">全部 ${available.length}</a>
        ${CATEGORIES.map((c) => {
          const n = available.filter((a) => a.cat === c.id).length;
          return n
            ? raw(`<a class="chip ${activeCat === c.id ? 'active' : ''}" href="#knowledge?c=${c.id}">${c.icon} ${esc(c.name)} ${n}</a>`)
            : '';
        })}
      </div>

      ${shown.length
        ? raw(
            CATEGORIES.filter((c) => shown.some((a) => a.cat === c.id))
              .map((c) =>
                linkGroup(
                  `${c.icon} ${c.name}`,
                  shown.filter((a) => a.cat === c.id).map((a) => linkRow(`#knowledge?a=${a.id}`, '·', a.title, a.summary)),
                ),
              )
              .join(''),
          )
        : raw(emptyState('这个分类下暂时没有适用于当前宠物的文章。'))}

      <p class="disclaimer">内容依据通行的兽医营养学、预防医学与动物行为学共识整理，具体到你的宠物请以面诊兽医的判断为准。</p>
    `;
  },
};

function renderArticle(id, ctx) {
  const a = articleById(id);
  if (!a) {
    return h`<h1 class="page-title">没找到这篇文章</h1>
      ${raw(emptyState('它可能已被重命名。', '<a class="btn" href="#knowledge">回到知识库</a>'))}`;
  }
  const cat = CATEGORIES.find((c) => c.id === a.cat);
  const related = ARTICLES.filter(
    (x) => x.id !== a.id && (x.cat === a.cat || x.tags.some((t) => a.tags.includes(t))) && (x.species === 'all' || x.species.includes(ctx.pet.species)),
  ).slice(0, 3);

  return h`
    <a class="back-link" href="#knowledge?c=${a.cat}">‹ ${cat?.name ?? '知识库'}</a>
    <h1 class="page-title">${a.title}</h1>
    <p class="lede">${a.summary}</p>

    ${a.sections.map((s) => raw(card(s.h, `<ul class="bullets">${s.body.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`)))}

    <div class="chips">${a.tags.map((t) => raw(`<span class="chip">${esc(t)}</span>`))}</div>

    ${related.length
      ? raw(linkGroup('相关阅读', related.map((r) => linkRow(`#knowledge?a=${r.id}`, '📖', r.title, r.summary))))
      : ''}

    <a class="btn ghost block" href="#knowledge">回到知识库</a>
  `;
}
