/**
 * 全局搜索：一个输入框搜遍食物库、行为图鉴、知识库、急救卡、避坑指南与名词表。
 *
 * 不做模糊匹配与分词 —— 中文分词在离线环境里成本高、收益低。改用
 * "归一化子串 + 字段权重"，对"洋葱""干呕""换粮"这类查询已经足够准。
 */

import { FOODS, verdictFor, VERDICT_META } from '../data/foods.js';
import { SIGNALS, PROBLEMS, signalKeyFor } from '../data/behavior.js';
import { ARTICLES, CATEGORIES } from '../data/knowledge.js';
import { FIRST_AID } from '../data/firstaid.js';
import { VET_TRAPS } from '../data/care.js';
import { GLOSSARY, FAQ } from '../data/meta.js';
import { QUESTIONS } from '../data/triage.js';

export const KINDS = {
  food: { name: '能不能吃', icon: '🍖', route: '#nutrition' },
  signal: { name: '行为解读', icon: '🧠', route: '#behavior' },
  problem: { name: '问题行为', icon: '🛠️', route: '#behavior' },
  article: { name: '知识库', icon: '📖', route: '#knowledge' },
  firstaid: { name: '急救', icon: '🚑', route: '#firstaid' },
  trap: { name: '就医避坑', icon: '🔍', route: '#more' },
  glossary: { name: '名词', icon: '📕', route: '#about' },
  faq: { name: '常见问题', icon: '❓', route: '#help' },
  symptom: { name: '症状自查', icon: '🏥', route: '#triage' },
};

function norm(s) {
  return String(s ?? '').toLowerCase().replace(/\s+/g, '');
}

/** 命中打分：标题命中权重最高，正文命中最低。 */
function score(query, { title = '', subtitle = '', body = '', tags = [] }) {
  const q = norm(query);
  if (!q) return 0;
  let s = 0;
  const t = norm(title);
  if (t === q) s += 100;
  else if (t.includes(q)) s += 60;
  if (norm(tags.join('')).includes(q)) s += 30;
  if (norm(subtitle).includes(q)) s += 20;
  if (norm(body).includes(q)) s += 8;
  return s;
}

/**
 * @param {string} query
 * @param {string} speciesId 当前宠物物种，用于给出针对性的结论
 * @returns {object[]} [{kind, title, subtitle, route, hash, score}]
 */
export function searchAll(query, speciesId) {
  const q = String(query ?? '').trim();
  if (q.length === 0) return [];
  const hits = [];
  const add = (kind, item, s) => {
    if (s > 0) hits.push({ kind, ...item, score: s });
  };

  for (const f of FOODS) {
    const verdict = verdictFor(f, speciesId);
    const meta = VERDICT_META[verdict];
    add(
      'food',
      {
        title: f.name,
        subtitle: `${meta.icon} ${meta.label} · ${f.why.slice(0, 48)}…`,
        route: `#nutrition?q=${encodeURIComponent(f.name)}`,
        tone: meta.tone,
      },
      score(q, { title: f.name, subtitle: f.category, body: f.why, tags: [...(f.aliases ?? []), ...(f.tags ?? [])] }),
    );
  }

  const signalKey = signalKeyFor(speciesId);
  for (const s of SIGNALS[signalKey] ?? []) {
    add(
      'signal',
      { title: s.name, subtitle: `${s.group} · ${s.means.slice(0, 40)}…`, route: '#behavior' },
      score(q, { title: s.name, subtitle: s.cue, body: `${s.means}${s.respond}`, tags: [s.group] }),
    );
  }
  for (const p of PROBLEMS[signalKey] ?? []) {
    add(
      'problem',
      { title: p.name, subtitle: p.why.slice(0, 46) + '…', route: '#behavior' },
      score(q, { title: p.name, body: `${p.why}${p.fix.join('')}` }),
    );
  }

  for (const a of ARTICLES) {
    if (a.species !== 'all' && speciesId && !a.species.includes(speciesId)) continue;
    const cat = CATEGORIES.find((c) => c.id === a.cat);
    add(
      'article',
      { title: a.title, subtitle: `${cat?.name ?? ''} · ${a.summary.slice(0, 44)}…`, route: `#knowledge?a=${a.id}` },
      score(q, {
        title: a.title,
        subtitle: a.summary,
        body: a.sections.map((s) => `${s.h}${s.body.join('')}`).join(''),
        tags: a.tags,
      }),
    );
  }

  for (const f of FIRST_AID) {
    add(
      'firstaid',
      { title: f.title, subtitle: f.when.slice(0, 46) + '…', route: `#firstaid?c=${f.id}`, tone: 'danger' },
      score(q, { title: f.title, subtitle: f.when, body: `${f.now.join('')}${f.never.join('')}` }),
    );
  }

  for (const t of VET_TRAPS) {
    add('trap', { title: t.scene, subtitle: t.trap.slice(0, 44) + '…', route: '#more' }, score(q, { title: t.scene, subtitle: t.trap, body: t.smart }));
  }

  for (const g of GLOSSARY) {
    add('glossary', { title: g.term, subtitle: g.def.slice(0, 46) + '…', route: '#about' }, score(q, { title: g.term, body: g.def }));
  }

  for (const f of FAQ) {
    add('faq', { title: f.q, subtitle: f.a.slice(0, 46) + '…', route: '#help' }, score(q, { title: f.q, body: f.a }));
  }

  for (const question of QUESTIONS) {
    const matched = question.options.filter((o) => norm(o.t).includes(norm(q)));
    if (matched.length) {
      add(
        'symptom',
        { title: `${question.label}：${matched[0].t}`, subtitle: '去做一次 5 分钟症状自查', route: '#triage' },
        score(q, { title: question.label, body: question.options.map((o) => o.t).join('') }) + 25,
      );
    }
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, 40);
}

/** 没输入时展示的推荐入口。 */
export const SUGGESTIONS = ['洋葱', '巧克力', '木糖醇', '换粮', '干呕', '乱尿', '疫苗', '绝育', '中暑', '减重', '不吃东西', '刷牙'];
