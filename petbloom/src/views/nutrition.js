/**
 * 饮食处方页 —— 回答三个问题：
 *   1. 它每天该吃多少？（热量制 / 配比制 / 猎物制，按物种走不同模型）
 *   2. 这个东西它能不能吃？（食物安全库，按物种给结论）
 *   3. 我手上这袋粮到底行不行？（营养成分表干物质换算 + 配料表扫描）
 */

import { h, raw, esc, card, field, num, select } from '../ui.js';
import { SPECIES } from '../data/species.js';
import * as store from '../lib/store.js';
import { feedingPlan, gradeLabel, transitionPlan, bodyCondition, waterTarget } from '../lib/nutrition.js';
import { searchFoods, verdictFor, VERDICT_META, toxicListFor } from '../data/foods.js';

let query = '';
let labelResult = null;

export default {
  id: 'nutrition',
  title: '吃什么',

  render(ctx) {
    const pet = ctx.pet;
    const sp = SPECIES[pet.species];
    const ageMonths = store.ageInMonths(pet);
    const plan = feedingPlan({ ...pet, ageMonths });
    const bc = bodyCondition(pet.species, pet.breed, pet.weightKg);
    const water = waterTarget(pet.species, pet.weightKg);
    const results = searchFoods(query, pet.species).slice(0, query ? 12 : 8);
    const toxic = toxicListFor(pet.species);

    return h`
      <h1 class="page-title">🍖 ${pet.name} 的饮食处方</h1>
      <p class="muted">${sp.name} · ${sp.diet} · ${plan.stage}${pet.weightKg ? ' · ' + pet.weightKg + 'kg' : ''}</p>

      ${raw(card('每日该吃多少', portionsHtml(plan, pet, water), { icon: '⚖️' }))}

      ${raw(
        card(
          '体况判断',
          `<p><strong>${esc(bc.label)}</strong></p>
           ${bc.std ? `<p class="muted">品种标准区间：${bc.std.min} - ${bc.std.max} kg</p>` : ''}
           <p class="muted">比体重更可靠的是手感：肋骨应能轻易摸到但不突出，从上方看有腰线，从侧面看腹部上收。</p>
           <div class="inline-form">
             ${field('调整目标', select('goal', [{ v: 'maintain', t: '维持体重' }, { v: 'lose', t: '减重' }, { v: 'gain', t: '增重' }], pet.goal ?? 'maintain'))}
             ${field('当前体重 (kg)', num('weightKg', pet.weightKg, { step: '0.01' }))}
             <button class="btn" id="save-basics">重算</button>
           </div>`,
          { icon: '📐' },
        ),
      )}

      ${plan.keyNutrients?.length
        ? raw(
            card(
              '这个物种的关键营养',
              `<ul class="bullets">${plan.keyNutrients
                .map((n) => `<li><b>${esc(n.name)}</b>：${esc(n.why)}<br><small class="muted">来源：${esc(n.source)}</small></li>`)
                .join('')}</ul>`,
              { icon: '🧬' },
            ),
          )
        : ''}

      ${raw(
        card(
          '能不能吃？',
          h`<div class="search-row">
              <input type="search" id="food-q" placeholder="输入食物名，如 洋葱 / 胡萝卜 / 牛奶" value="${query}">
            </div>
            <div class="food-list">
              ${results.map((r) => raw(foodRow(r.food, r.verdict)))}
              ${results.length === 0 ? raw('<p class="muted">没有匹配记录。库里没有 ≠ 安全：不确定就先不给，并咨询兽医。</p>') : ''}
            </div>`,
          { icon: '🔍' },
        ),
      )}

      ${raw(
        card(
          `${sp.name}的绝对禁区（${toxic.length}）`,
          `<div class="chips">${toxic.map((f) => `<span class="chip danger">${esc(f.name)}</span>`).join('')}</div>
           <p class="muted">这份清单值得截图给家里所有人看一遍，尤其是会偷偷投喂的长辈与小孩。</p>`,
          { icon: '☠️', tone: 'danger' },
        ),
      )}

      ${['cat', 'dog'].includes(pet.species)
        ? raw(
            card(
              '这袋粮行不行',
              h`<p class="muted">照着包装上的"营养成分保证值"填，会自动换算成干物质基础 —— 这是看懂粮袋的关键：湿粮标蛋白 10% 并不比干粮 32% 差，因为湿粮里 78% 是水。</p>
              <div class="grid-3">
                ${raw(field('粗蛋白 %', num('protein', '', { step: '0.1' })))}
                ${raw(field('粗脂肪 %', num('fat', '', { step: '0.1' })))}
                ${raw(field('粗纤维 %', num('fiber', '', { step: '0.1' })))}
                ${raw(field('粗灰分 %', num('ash', '', { step: '0.1' })))}
                ${raw(field('水分 %', num('moisture', '', { step: '0.1', placeholder: '干粮约 10，湿粮约 78' })))}
              </div>
              ${raw(field('配料表（可粘贴前几位）', `<textarea name="ingredients" rows="2" placeholder="如：鲜鸡肉、鸡肉粉、豌豆、鸡油、混合生育酚"></textarea>`))}
              <button class="btn" id="grade-btn">评测</button>
              <div id="grade-out">${raw(labelResult ? gradeHtml(labelResult) : '')}</div>`,
              { icon: '🏷️' },
            ),
          )
        : ''}

      ${raw(
        card(
          '换粮过渡表',
          `<p class="muted">直接换粮是腹泻与拒食的常见原因。7 天渐进过渡，期间观察便便形态。</p>
           <table class="table"><thead><tr><th>第几天</th><th>旧粮</th><th>新粮</th></tr></thead><tbody>
           ${transitionPlan(7).map((d) => `<tr><td>Day ${d.day}</td><td>${d.oldPct}%</td><td>${d.newPct}%</td></tr>`).join('')}
           </tbody></table>`,
          { icon: '🔄' },
        ),
      )}
    `;
  },

  bind(root, ctx) {
    const q = root.querySelector('#food-q');
    if (q) {
      q.addEventListener('input', () => {
        query = q.value;
        ctx.refresh({ keepFocus: '#food-q' });
      });
    }

    const save = root.querySelector('#save-basics');
    if (save) {
      save.addEventListener('click', () => {
        const goal = root.querySelector('select[name="goal"]').value;
        const weightKg = Number(root.querySelector('input[name="weightKg"]').value) || ctx.pet.weightKg;
        store.updatePet(ctx.pet.id, { goal, weightKg });
        const log = store.getLog(ctx.pet.id);
        store.saveLog(ctx.pet.id, log.date, { weightKg });
        ctx.refresh();
      });
    }

    const grade = root.querySelector('#grade-btn');
    if (grade) {
      grade.addEventListener('click', () => {
        const get = (n) => root.querySelector(`[name="${n}"]`)?.value;
        labelResult = gradeLabel({
          species: ctx.pet.species,
          protein: get('protein'),
          fat: get('fat'),
          fiber: get('fiber'),
          ash: get('ash'),
          moisture: get('moisture'),
          ingredients: get('ingredients'),
        });
        root.querySelector('#grade-out').innerHTML = gradeHtml(labelResult);
      });
    }
  },
};

function portionsHtml(plan, pet, water) {
  const waterLine = water
    ? `<p class="muted">每日饮水目标 ${water.min}-${water.max} ml${pet.species === 'cat' ? '（猫从食物取水的能力弱，提高湿粮比例是最有效的补水方式）' : ''}</p>`
    : plan.schedule?.waterNote || plan.prey?.waterNote
      ? `<p class="muted">${esc(plan.schedule?.waterNote ?? plan.prey?.waterNote)}</p>`
      : '';

  if (plan.energy) {
    const p = plan.portions;
    return `<div class="kcal-head">
        <div><span class="muted">静息需求 RER</span><strong>${plan.energy.rer} kcal</strong></div>
        <div><span class="muted">系数 ×${plan.energy.factor}</span><strong>${esc(plan.energy.factorLabel)}</strong></div>
        <div class="kcal-total"><span class="muted">每日总需求</span><strong>${plan.energy.kcal} kcal</strong></div>
      </div>
      <ul class="bullets">
        <li>干粮 <b>${p.dry.grams} g</b>（约 ${p.dry.kcal} kcal，按 ${pet.food?.dryKcalPer100g ?? 400} kcal/100g 估算）</li>
        <li>湿粮 <b>${p.wet.grams} g</b> ≈ ${p.wet.cans} 罐（约 ${p.wet.kcal} kcal）</li>
        <li>零食上限 <b>${p.treat.kcal} kcal</b> —— ${esc(p.treat.note)}</li>
      </ul>
      ${waterLine}
      <p class="muted">粮袋上的能量密度（kcal/kg 或 ME）差异很大，按实际标注调整会更准。分 2-3 餐给，比一次倒满更能控制体重。</p>`;
  }

  if (plan.ration) {
    return `<ul class="bullets">
        ${plan.ration.items
          .map((i) => `<li><b>${esc(i.name)}</b>：${i.grams == null ? '无限量供应' : `约 ${i.grams} g/日`}<br><small class="muted">${esc(i.note)}</small></li>`)
          .join('')}
      </ul>
      ${plan.ration.hay ? `<p class="highlight">${esc(plan.ration.hay.note)}</p>` : ''}
      ${waterLine}`;
  }

  if (plan.ratio) {
    return `<p>每日总量约 <b>${plan.ratio.dailyGrams} g</b></p>
      <ul class="bullets">
        ${plan.ratio.items
          .map((i) => `<li><b>${esc(i.name)}</b>：占比 ${i.pct[0]}-${i.pct[1]}%（约 ${i.grams} g）<br><small class="muted">${esc(i.note)}</small></li>`)
          .join('')}
      </ul>${waterLine}`;
  }

  if (plan.prey) {
    return `<ul class="bullets">
        <li>单次猎物重量：<b>${plan.prey.preyGrams.min} - ${plan.prey.preyGrams.max} g</b>（约体重的 10-15%）</li>
        <li>投喂间隔：<b>${esc(plan.prey.interval)}</b></li>
        <li>务必使用解冻后的冷冻猎物，禁止活体喂食</li>
      </ul>${waterLine}`;
  }

  if (plan.schedule) {
    return `<p><b>${esc(plan.schedule.text)}</b></p>
      <ul class="bullets">
        ${plan.schedule.supplements.map((s) => `<li><b>${esc(s.name)}</b>（${esc(s.freq)}）：${esc(s.why)}</li>`).join('')}
      </ul>${waterLine}`;
  }

  return '<p class="muted">该物种暂无投喂模型。</p>';
}

function foodRow(food, verdict) {
  const meta = VERDICT_META[verdict];
  return `<details class="food tone-${meta.tone}">
    <summary><span class="food-verdict">${meta.icon} ${esc(meta.label)}</span><span class="food-name">${esc(food.name)}</span></summary>
    <p>${esc(food.why)}</p>
    ${food.limitNote ? `<p class="muted">限量建议：${esc(food.limitNote)}</p>` : ''}
    ${food.firstAid ? `<p class="alert-action">误食处理：${esc(food.firstAid)}</p>` : ''}
    ${food.tags?.length ? `<div class="chips">${food.tags.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>` : ''}
  </details>`;
}

function gradeHtml(r) {
  return `<div class="grade grade-${r.grade}">
      <div class="grade-score"><strong>${r.grade}</strong><small>${r.score} 分</small></div>
      <div class="grade-dm">
        <p>干物质基础：蛋白 ${r.dm.protein}% · 脂肪 ${r.dm.fat}% · 纤维 ${r.dm.fiber}% · 估算碳水 ${r.dm.carb}%</p>
        <p class="muted">估算能量密度 ≈ ${r.kcalPer100g} kcal/100g（改良 Atwater 系数）</p>
      </div>
    </div>
    <ul class="notes">${r.notes.map((n) => `<li class="tone-${n.tone}">${esc(n.text)}</li>`).join('')}</ul>
    <p class="muted">评分只反映配方与标签信息，不包含原料溯源、生产质控与个体适应性 —— 换粮后观察便便、皮毛与体重才是最终标准。</p>`;
}
