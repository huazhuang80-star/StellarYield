import { COURSES } from '../data/courses'
import { BREATH_PATTERNS, MEDITATIONS } from '../data/breathing'
import { EDU_ARTICLES } from '../data/education'
import { EXERCISES, PRACTICES } from '../data/exercises'
import { FAQ, GLOSSARY } from '../data/help'
import { NUTRITION } from '../data/nutrition'
import { URGE_LEVELS } from '../data/urge'

export type ResultKind = '科普' | '功法' | '调理' | '营养' | '呼吸' | '冥想' | '课程' | '训练' | '帮助' | '术语'

export interface SearchResult {
  id: string
  kind: ResultKind
  title: string
  snippet: string
  /** 跳转目标页面 */
  target: string
}

interface Indexed extends SearchResult {
  haystack: string
}

/** 全站内容索引：构建一次，检索时只做字符串匹配 */
export const INDEX: Indexed[] = [
  ...EDU_ARTICLES.map((a) => ({
    id: a.id,
    kind: '科普' as const,
    title: a.title,
    snippet: a.body[0] ?? '',
    target: 'learn',
    haystack: [a.title, a.basis, a.form, ...a.body].join(' '),
  })),
  ...EXERCISES.map((e) => ({
    id: e.id,
    kind: '功法' as const,
    title: e.name,
    snippet: `${e.minutes} 分钟 · ${e.effect}`,
    target: 'energy',
    haystack: [e.name, e.effect, e.form, ...e.steps, ...e.mistakes].join(' '),
  })),
  ...PRACTICES.map((p) => ({
    id: p.id,
    kind: '调理' as const,
    title: p.name,
    snippet: p.detail,
    target: 'energy',
    haystack: [p.name, p.detail, p.basis, p.interaction].join(' '),
  })),
  ...NUTRITION.map((n) => ({
    id: n.id,
    kind: '营养' as const,
    title: n.direction,
    snippet: n.foods.join('、'),
    target: 'energy',
    haystack: [n.direction, n.effect, n.form, ...n.foods].join(' '),
  })),
  ...BREATH_PATTERNS.map((b) => ({
    id: b.id,
    kind: '呼吸' as const,
    title: b.name,
    snippet: `${b.subtitle} · ${b.purpose}`,
    target: 'breathing',
    haystack: [b.name, b.subtitle, b.purpose, b.when].join(' '),
  })),
  ...MEDITATIONS.map((m) => ({
    id: m.id,
    kind: '冥想' as const,
    title: m.name,
    snippet: `${m.minutes} 分钟 · ${m.method}`,
    target: 'breathing',
    haystack: [m.name, m.method, ...m.guide].join(' '),
  })),
  ...COURSES.flatMap((c) =>
    c.lessons.map((l) => ({
      id: `${c.id}-${l.id}`,
      kind: '课程' as const,
      title: l.title,
      snippet: `${c.name} · ${l.summary}`,
      target: 'courses',
      haystack: [c.name, c.desc, l.title, l.summary].join(' '),
    })),
  ),
  ...URGE_LEVELS.map((u) => ({
    id: `urge-${u.level}`,
    kind: '训练' as const,
    title: `Level ${u.level} ${u.name}`,
    snippet: u.content,
    target: 'panic',
    haystack: [u.name, u.content, u.theory].join(' '),
  })),
  ...FAQ.map((f) => ({
    id: f.id,
    kind: '帮助' as const,
    title: f.q,
    snippet: f.a,
    target: 'help',
    haystack: [f.category, f.q, f.a].join(' '),
  })),
  ...GLOSSARY.map((g, i) => ({
    id: `glossary-${i}`,
    kind: '术语' as const,
    title: g.term,
    snippet: g.desc,
    target: 'help',
    haystack: [g.term, g.desc].join(' '),
  })),
]

/**
 * 检索：标题命中优先于正文命中，多关键词需全部命中（AND）。
 * 中文没有空格分词，所以直接按子串匹配，用户输入"多巴胺"也能命中"多巴胺基线"。
 */
export function search(query: string, limit = 30): SearchResult[] {
  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
  if (terms.length === 0) return []

  return INDEX.map((item) => {
    const title = item.title.toLowerCase()
    const hay = item.haystack.toLowerCase()
    if (!terms.every((t) => hay.includes(t))) return null
    const score = terms.filter((t) => title.includes(t)).length * 10 + 1
    return { item, score }
  })
    .filter((x): x is { item: Indexed; score: number } => x !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item }) => ({ id: item.id, kind: item.kind, title: item.title, snippet: item.snippet, target: item.target }))
}

export const HOT_QUERIES = ['多巴胺', '八段锦', '失眠', '焦虑', '破戒', '泡脚', '专注', '隐私']
