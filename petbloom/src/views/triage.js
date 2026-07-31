/**
 * 症状自查（四级干预的 Level 2-4）。
 *
 * 这个页面存在的唯一理由：在"它好像不舒服"和"盲目焦虑 / 盲目就医"之间，
 * 插入一段结构化的观察与判断。它不诊断疾病，只回答"现在该做什么"。
 */

import { h, raw, esc, card } from '../ui.js';
import { QUESTIONS, RED_FLAGS, VET_SCRIPTS } from '../data/triage.js';
import { evaluate, vetSummary } from '../lib/triage.js';
import { COST_REFERENCE, VET_TRAPS } from '../data/care.js';
import * as store from '../lib/store.js';

let step = 'form';
let answers = { flags: [] };
let result = null;

export default {
  id: 'triage',
  title: '不舒服',

  render(ctx) {
    if (step === 'result' && result) return renderResult(ctx);
    return renderForm(ctx);
  },

  bind(root, ctx) {
    const form = root.querySelector('#triage-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        answers = { flags: fd.getAll('flags') };
        for (const q of QUESTIONS) answers[q.id] = fd.get(q.id) || null;
        result = evaluate(answers, { species: ctx.pet.species, sex: ctx.pet.sex, ageMonths: store.ageInMonths(ctx.pet) });
        store.recordTriage(ctx.pet.id, { level: result.level, answers, summarized: false });
        step = 'result';
        ctx.refresh({ scrollTop: true });
      });
    }

    const again = root.querySelector('#triage-again');
    if (again) {
      again.addEventListener('click', () => {
        step = 'form';
        answers = { flags: [] };
        result = null;
        ctx.refresh({ scrollTop: true });
      });
    }

    const sum = root.querySelector('#make-summary');
    if (sum) {
      sum.addEventListener('click', async () => {
        const text = vetSummary({
          pet: { ...ctx.pet, ageMonths: store.ageInMonths(ctx.pet) },
          answers,
          result,
          recentLogs: store.statsFor(ctx.pet.id).logs.slice(0, 7),
          now: new Date().toLocaleString('zh-CN'),
        });
        const out = root.querySelector('#summary-out');
        out.innerHTML = `<textarea rows="14" readonly class="summary">${esc(text)}</textarea>`;
        store.markTriageSummarized(ctx.pet.id);
        try {
          await navigator.clipboard.writeText(text);
          sum.textContent = '已复制到剪贴板 ✓';
        } catch {
          sum.textContent = '已生成，可长按复制';
        }
      });
    }
  },
};

function renderForm(ctx) {
  const history = store.triagesFor(ctx.pet.id).slice(0, 3);
  return h`
    <h1 class="page-title">🏥 5 分钟症状自查</h1>
    <p class="muted">先别慌。按下面的顺序观察一遍，我们一起判断紧急程度。全程不需要你判断"是什么病"。</p>

    ${history.length
      ? raw(
          card(
            '上次类似情况',
            `<ul class="bullets">${history
              .map(
                (t) =>
                  `<li>${new Date(t.date).toLocaleString('zh-CN')} · 判级 ${t.level === 'red' ? '🔴 立即急诊' : t.level === 'yellow' ? '🟡 24 小时内就医' : '🟢 在家观察'}</li>`,
              )
              .join('')}</ul>
             <p class="muted">回想一下：上次是怎么处理的？结果如何？这份经验对这次判断很有价值。</p>`,
            { icon: '🕓' },
          ),
        )
      : ''}

    <form id="triage-form">
      ${raw(
        card(
          'Step 1 · 观察记录',
          QUESTIONS.map(
            (q) => `<fieldset class="q">
              <legend>${esc(q.label)}${q.hint ? `<small class="muted">${esc(q.hint)}</small>` : ''}</legend>
              <div class="options">
                ${q.options
                  .map(
                    (o) => `<label class="opt"><input type="radio" name="${esc(q.id)}" value="${esc(o.v)}"><span>${esc(o.t)}</span></label>`,
                  )
                  .join('')}
              </div>
            </fieldset>`,
          ).join(''),
          { icon: '👀' },
        ),
      )}

      ${raw(
        card(
          '有没有出现下面这些情况？',
          `<div class="options">
            ${RED_FLAGS.map((f) => `<label class="opt"><input type="checkbox" name="flags" value="${esc(f.id)}"><span>${esc(f.t)}</span></label>`).join('')}
          </div>
          <p class="muted">这些是一票否决的信号，勾中任意一项都会直接判为需要立即处理。</p>`,
          { icon: '🚨', tone: 'warn' },
        ),
      )}

      <button class="btn primary block" type="submit">判断紧急程度</button>
    </form>
    <p class="disclaimer">本工具只做紧急度分级，不是诊断。任何时候你觉得不对，直接联系兽医永远是正确选择。</p>
  `;
}

function renderResult(ctx) {
  const meta = result.levelMeta;
  const mapQuery = encodeURIComponent('附近 24 小时宠物医院');
  return h`
    <h1 class="page-title">判断结果</h1>

    <section class="verdict level-${result.level}">
      <div class="verdict-icon">${meta.icon}</div>
      <div>
        <h2>${meta.title}</h2>
        <p>${meta.desc}</p>
      </div>
    </section>

    ${raw(
      card(
        '判断依据',
        `<ul class="bullets">${result.reasons
          .map((r) => `<li><b>${esc(r.reason)}</b><br><small>${esc(r.detail)}</small></li>`)
          .join('')}</ul>
        ${result.otherFindings.length ? `<p class="muted">同时注意：${result.otherFindings.map((r) => esc(r.reason)).join('、')}</p>` : ''}
        ${result.speciesNote ? `<p class="highlight">${esc(result.speciesNote)}</p>` : ''}
        ${result.unanswered.length ? `<p class="muted">未填写的项目：${result.unanswered.map(esc).join('、')} —— 补充后判断会更准。</p>` : ''}`,
        { icon: '🧭' },
      ),
    )}

    ${raw(card('现在该做什么', `<ol class="steps">${result.actions.map((a) => `<li>${esc(a)}</li>`).join('')}</ol>`, { icon: '✅' }))}

    ${result.level !== 'green'
      ? raw(
          card(
            '就医准备',
            `<button class="btn" id="make-summary">生成就医摘要（可复制给医生）</button>
             <div id="summary-out"></div>
             <h4>问医生这几句，能避开大部分过度检查</h4>
             <ul class="bullets">${VET_SCRIPTS.map((s) => `<li><b>${esc(s.q)}</b><br><small class="muted">${esc(s.why)}</small></li>`).join('')}</ul>
             <h4>费用量级参考（一二线城市，人民币）</h4>
             <table class="table"><tbody>${COST_REFERENCE.slice(0, 10)
               .map((c) => `<tr><td>${esc(c.item)}</td><td>${esc(c.range)} 元</td></tr>`)
               .join('')}</tbody></table>
             <p class="muted">地区与医院差异很大，这里只用于判断"是否明显偏离量级"，不作为议价依据。</p>`,
            { icon: '📄' },
          ),
        )
      : ''}

    ${result.level === 'red'
      ? raw(
          card(
            '立即就医',
            `<a class="btn danger block" href="https://uri.amap.com/search?keyword=${mapQuery}" target="_blank" rel="noopener">查找附近 24 小时宠物医院</a>
             <p class="muted">出发前打电话确认医院此刻有值班医生与相应设备，避免白跑。路上把它固定在航空箱里。</p>`,
            { icon: '🚑', tone: 'danger' },
          ),
        )
      : ''}

    ${raw(
      card(
        '常见的坑（对应你这次的情况看一眼）',
        `<ul class="bullets">${VET_TRAPS.map(
          (t) => `<li><b>${esc(t.scene)}</b><br><small>常见坑：${esc(t.trap)}</small><br><small class="good">更聪明的做法：${esc(t.smart)}</small><br><small class="muted">必须做：${esc(t.mustDo)}</small></li>`,
        ).join('')}</ul>`,
        { icon: '🔍' },
      ),
    )}

    <button class="btn ghost block" id="triage-again">重新自查</button>
    <p class="disclaimer">${esc(ctx.pet.name)} 的这次记录已存入档案，就医时可以直接调出时间线。</p>
  `;
}
