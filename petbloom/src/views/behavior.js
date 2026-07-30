/** 行为图鉴：把叫声与身体语言翻译成"它想说什么"和"你该怎么回应"。 */

import { h, raw, esc, card } from '../ui.js';
import { SIGNALS, PROBLEMS, SIGNAL_GROUP_ORDER, signalKeyFor } from '../data/behavior.js';
import { breedRisks } from '../data/species.js';
import { MYTHS, prioritizeMyths } from '../data/myths.js';
import * as store from '../lib/store.js';

export default {
  id: 'behavior',
  title: '读懂它',

  render(ctx) {
    const pet = ctx.pet;
    const key = signalKeyFor(pet.species);
    const signals = SIGNALS[key] ?? [];
    const problems = PROBLEMS[key] ?? [];
    const unlocked = new Set(pet.unlockedSignals ?? []);
    const risks = breedRisks(pet.species, pet.breed);
    const myths = prioritizeMyths(pet.mythScores).slice(0, 3);

    const groups = [...new Set(signals.map((s) => s.group))].sort(
      (a, b) => SIGNAL_GROUP_ORDER.indexOf(a) - SIGNAL_GROUP_ORDER.indexOf(b),
    );

    return h`
      <h1 class="page-title">🧠 读懂 ${pet.name}</h1>
      <p class="muted">已解锁 ${unlocked.size} / ${signals.length} 条解读。看懂一条就点一下，它会记进你的图鉴。</p>

      ${groups.map((g) =>
        raw(
          card(
            g,
            signals
              .filter((s) => s.group === g)
              .map(
                (s) => `<details class="signal${unlocked.has(s.name) ? ' unlocked' : ''}">
                  <summary>${esc(s.name)}${unlocked.has(s.name) ? ' <span class="chip">已解锁</span>' : ''}</summary>
                  <p class="muted">观察特征：${esc(s.cue)}</p>
                  <p><b>它在表达</b>：${esc(s.means)}</p>
                  <p><b>你该怎么回应</b>：${esc(s.respond)}</p>
                  <button class="btn small" data-unlock="${esc(s.name)}">${unlocked.has(s.name) ? '取消解锁' : '我看懂了，解锁'}</button>
                </details>`,
              )
              .join(''),
          ),
        ),
      )}

      ${problems.length
        ? raw(
            card(
              '问题行为怎么改',
              problems
                .map(
                  (p) => `<details class="problem">
                    <summary>${esc(p.name)}</summary>
                    <p class="muted">为什么会这样：${esc(p.why)}</p>
                    <ol class="steps">${p.fix.map((f) => `<li>${esc(f)}</li>`).join('')}</ol>
                    <p class="alert-action">不要这样做：${esc(p.avoid)}</p>
                  </details>`,
                )
                .join('') +
                '<p class="muted">所有方案都基于正向强化。惩罚在行为学上只做到一件事：让它学会"在你面前不要做"，同时把信任和预警信号一起破坏掉。</p>',
              { icon: '🛠️' },
            ),
          )
        : ''}

      ${risks.length
        ? raw(
            card(
              `${esc(pet.breed)} 的高发问题`,
              `<ul class="bullets">${risks.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
               <p class="muted">知道自家品种的高发疾病，就能在年度体检里有针对性地加上对应筛查 —— 这是最划算的一笔钱。</p>`,
              { icon: '🧬', tone: 'warn' },
            ),
          )
        : ''}

      ${myths.length
        ? raw(
            card(
              '你的认知修补优先级',
              myths
                .map(({ myth, score }) => {
                  const m = MYTHS.find((x) => x.id === myth.id) ?? myth;
                  return `<details class="myth">
                    <summary>${esc(m.name)} <span class="chip">认同度 ${score}/10</span></summary>
                    <p class="muted">常见说法：${esc(m.belief)}</p>
                    <p><b>实际情况</b>：${esc(m.truth)}</p>
                    <p><b>换个角度</b>：${esc(m.reframe)}</p>
                    <ol class="steps">${m.practice.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>
                    <p class="muted">检验标准：${esc(m.metric)}</p>
                  </details>`;
                })
                .join(''),
              { icon: '💡' },
            ),
          )
        : ''}

      <p class="disclaimer">行为突然改变（尤其是攻击性、乱排泄、活动减少）首先要排除疼痛与疾病，再谈训练。</p>
    `;
  },

  bind(root, ctx) {
    root.querySelectorAll('button[data-unlock]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        store.unlockSignal(ctx.pet.id, btn.dataset.unlock);
        ctx.refresh();
      });
    });
  },
};
