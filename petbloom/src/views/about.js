/** 关于：产品自述、原则、内容来源、名词表、更新日志、致谢。 */

import { h, raw, esc, card } from '../ui.js';
import { APP, SOURCES, GLOSSARY, CHANGELOG, CREDITS } from '../data/meta.js';
import { SPECIES_LIST } from '../data/species.js';
import { FOODS } from '../data/foods.js';
import { ARTICLES } from '../data/knowledge.js';
import { RULES } from '../data/triage.js';
import { FIRST_AID } from '../data/firstaid.js';

export default {
  id: 'about',
  title: '关于',

  render() {
    return h`
      <header class="about-hero">
        <div class="about-mark">🌱</div>
        <h1>${APP.name} · ${APP.cnName}</h1>
        <p class="muted">v${APP.version} · ${APP.tagline}</p>
      </header>

      ${raw(card('这是什么', `<p>${esc(APP.positioning)}</p>`, { icon: '🎯' }))}

      ${raw(
        card(
          '四维模型',
          `<div class="philo">${APP.philosophy
            .map((p) => `<div class="philo-item"><span class="philo-icon">${p.icon}</span><div><b>${esc(p.name)}</b><p class="muted">${esc(p.text)}</p></div></div>`)
            .join('')}</div>`,
          { icon: '🧭' },
        ),
      )}

      ${raw(
        card(
          '我们的原则',
          `<ol class="steps">${APP.principles.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>`,
          { icon: '⚖️' },
        ),
      )}

      ${raw(
        card(
          '内容规模',
          `<div class="metrics">
            <div class="metric"><span class="metric-label">覆盖物种</span><strong>${SPECIES_LIST.length}</strong></div>
            <div class="metric"><span class="metric-label">食物条目</span><strong>${FOODS.length}</strong></div>
            <div class="metric"><span class="metric-label">知识文章</span><strong>${ARTICLES.length}</strong></div>
            <div class="metric"><span class="metric-label">判级规则</span><strong>${RULES.length}</strong></div>
            <div class="metric"><span class="metric-label">急救卡片</span><strong>${FIRST_AID.length}</strong></div>
          </div>`,
          { icon: '📊' },
        ),
      )}

      ${raw(
        card(
          '内容依据与边界',
          SOURCES.map(
            (s) => `<details><summary>${esc(s.topic)}</summary>
              <p>${esc(s.basis)}</p>
              <p class="muted"><b>局限</b>：${esc(s.caveat)}</p>
            </details>`,
          ).join(''),
          { icon: '📚' },
        ),
      )}

      ${raw(
        card(
          '名词表',
          GLOSSARY.map((g) => `<details><summary>${esc(g.term)}</summary><p>${esc(g.def)}</p></details>`).join(''),
          { icon: '📕' },
        ),
      )}

      ${raw(
        card(
          '更新日志',
          CHANGELOG.map(
            (c) => `<details ${c.version === APP.version ? 'open' : ''}>
              <summary>v${esc(c.version)} <span class="chip">${esc(c.date)}</span></summary>
              <ul class="bullets">${c.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
            </details>`,
          ).join(''),
          { icon: '🗒️' },
        ),
      )}

      ${raw(card('致谢与说明', `<ul class="bullets">${CREDITS.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>`, { icon: '🙏' }))}

      ${raw(
        card(
          '免责声明',
          `<p>PetBloom 提供的是科学养护参考与紧急度分级，<b>不构成兽医诊断、治疗建议或处方</b>。任何健康决策都应由面诊过你的宠物的执业兽医做出。</p>
           <p>紧急情况请立即联系 24 小时动物急诊，不要因为等待本 App 的判断而延误。</p>
           <p class="muted">数据仅存于本机浏览器，不上传、不分析、不共享。清除浏览器数据会一并删除，请定期导出备份。</p>`,
          { icon: '⚠️', tone: 'warn' },
        ),
      )}

      <div class="about-links">
        <a class="btn ghost" href="#help">帮助与常见问题</a>
        <a class="btn ghost" href="#settings">设置</a>
      </div>
    `;
  },
};
