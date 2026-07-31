/** 建档流程：物种 → 基础信息 → 认知漏洞自评 → 生成终身养护方案。 */

import { h, raw, esc, card, field, num, text, select } from '../ui.js';
import { SPECIES_LIST, SPECIES } from '../data/species.js';
import { MYTHS } from '../data/myths.js';
import * as store from '../lib/store.js';

const HABIT_QUESTIONS = [
  {
    id: 'feedingStyle',
    label: '目前怎么喂',
    options: [
      { v: 'free', t: '自助盆，随时都有粮' },
      { v: 'random', t: '定时喂，但凭感觉给量' },
      { v: 'measured', t: '称重定量' },
    ],
  },
  { id: 'weightTrend', label: '最近体重趋势', options: [{ v: 'stable', t: '基本稳定' }, { v: 'up', t: '在变重' }, { v: 'down', t: '在变轻' }, { v: 'unknown', t: '没称过' }] },
  { id: 'dental', label: '口腔护理', options: [{ v: 'daily', t: '每日刷牙' }, { v: 'sometimes', t: '偶尔' }, { v: 'never', t: '没有做过' }] },
  { id: 'groom', label: '梳毛 / 清洁', options: [{ v: 'daily', t: '每日' }, { v: 'weekly', t: '每周' }, { v: 'rarely', t: '很少' }] },
  { id: 'exercise', label: '运动与互动', options: [{ v: 'enough', t: '每天固定时段' }, { v: 'some', t: '想起来才玩' }, { v: 'little', t: '几乎没有' }] },
  { id: 'vetCheck', label: '体检习惯', options: [{ v: 'annual', t: '每年体检' }, { v: 'symptomOnly', t: '有症状才去' }, { v: 'never', t: '从没去过' }] },
];

export default {
  id: 'onboarding',
  title: '建立档案',

  render() {
    return h`
      <div class="onboarding">
        <header class="hero">
          <h1>🌱 PetBloom</h1>
          <p class="lede">先建一份终身档案。从接回家的第一天，到往后每一天，都有据可查。</p>
        </header>

        <form id="onboard-form">
          ${raw(
            card(
              '第 1 步 · 它是谁',
              h`
              <div class="species-grid">
                ${SPECIES_LIST.map(
                  (sp, i) => raw(`<label class="species-opt">
                    <input type="radio" name="species" value="${esc(sp.id)}"${i === 0 ? ' checked' : ''}>
                    <span class="species-emoji">${esc(sp.emoji)}</span>
                    <span class="species-name">${esc(sp.name)}</span>
                  </label>`),
                )}
              </div>
              <div class="grid-2">
                ${raw(field('名字', text('name', '', '比如 布丁')))}
                ${raw(field('品种', `<input type="text" name="breed" list="breed-list" placeholder="可留空">`, '填了才能对比品种标准体重与高发疾病'))}
                <datalist id="breed-list"></datalist>
                ${raw(field('性别', select('sex', [{ v: '', t: '未填' }, { v: 'male', t: '公' }, { v: 'female', t: '母' }], '')))}
                ${raw(field('是否绝育', select('neutered', [{ v: 'no', t: '未绝育' }, { v: 'yes', t: '已绝育' }], 'no')))}
                ${raw(field('生日（可估算）', `<input type="date" name="birthday">`))}
                ${raw(field('接回家的日期', `<input type="date" name="homecoming" value="${store.today()}">`))}
                ${raw(field('当前体重 (kg)', num('weightKg', '', { step: '0.01', placeholder: '小宠请换算，如 120g = 0.12' })))}
                ${raw(
                  field(
                    '来源',
                    select(
                      'source',
                      [
                        { v: '', t: '未填' },
                        { v: 'adopt', t: '领养 / 救助' },
                        { v: 'breeder', t: '猫舍 / 犬舍' },
                        { v: 'store', t: '宠物店' },
                        { v: 'friend', t: '朋友转让' },
                      ],
                      '',
                    ),
                    '救助与宠物店来源的个体，入家首检更重要',
                  ),
                )}
              </div>
              ${raw(field('已知病史 / 长期用药', `<textarea name="conditions" rows="2" placeholder="没有就留空"></textarea>`))}
            `,
            ),
          )}

          ${raw(
            card(
              '第 2 步 · 现在怎么养',
              h`<p class="muted">没有对错，只是为了知道从哪里开始最省力。</p>
              <div class="grid-2">
                ${HABIT_QUESTIONS.map((q) => raw(field(q.label, select(`habit_${q.id}`, q.options, q.options[0].v))))}
              </div>`,
            ),
          )}

          ${raw(
            card(
              '第 3 步 · 认知自评',
              h`<p class="muted">对下面每句话，你有多认同？（0 = 完全不认同，10 = 非常认同）这决定我们优先陪你修补哪一块。</p>
              ${MYTHS.map(
                (m) => raw(`<label class="slider-row">
                  <span class="slider-label">${esc(m.belief)}</span>
                  <input type="range" name="myth_${esc(m.id)}" min="0" max="10" step="1" value="3">
                  <output>3</output>
                </label>`),
              )}`,
            ),
          )}

          <button class="btn primary block" type="submit">生成终身养护方案</button>
          <p class="disclaimer">PetBloom 提供科学养护参考与紧急度分级，不做疾病诊断，也不替代执业兽医的判断。</p>
        </form>
      </div>`;
  },

  bind(root, ctx) {
    const form = root.querySelector('#onboard-form');
    const datalist = root.querySelector('#breed-list');

    const syncBreeds = () => {
      const sp = form.querySelector('input[name="species"]:checked')?.value;
      const breeds = Object.keys(SPECIES[sp]?.breeds ?? {});
      datalist.innerHTML = breeds.map((b) => `<option value="${esc(b)}"></option>`).join('');
    };
    syncBreeds();
    form.querySelectorAll('input[name="species"]').forEach((el) => el.addEventListener('change', syncBreeds));

    form.querySelectorAll('input[type="range"]').forEach((el) => {
      el.addEventListener('input', () => {
        el.nextElementSibling.textContent = el.value;
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const mythScores = {};
      for (const m of MYTHS) mythScores[m.id] = Number(fd.get(`myth_${m.id}`)) || 0;
      const habits = {};
      for (const q of HABIT_QUESTIONS) habits[q.id] = fd.get(`habit_${q.id}`);

      store.addPet({
        name: String(fd.get('name') || '').trim() || '我的宠物',
        species: fd.get('species'),
        breed: String(fd.get('breed') || '').trim(),
        sex: fd.get('sex') || '',
        neutered: fd.get('neutered') === 'yes',
        birthday: fd.get('birthday') || '',
        homecoming: fd.get('homecoming') || store.today(),
        weightKg: Number(fd.get('weightKg')) || 0,
        source: fd.get('source') || '',
        conditions: String(fd.get('conditions') || '').trim(),
        mythScores,
        habits,
      });
      ctx.navigate('home');
    });
  },
};
