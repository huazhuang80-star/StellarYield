/** 更多：起居护理、环境要求、就医避坑、多宠管理与数据。 */

import { h, raw, esc, card } from '../ui.js';
import { SPECIES } from '../data/species.js';
import { SEASONS, VET_TRAPS, COST_REFERENCE } from '../data/care.js';
import * as store from '../lib/store.js';

const FREQ_LABEL = {
  daily: '每日',
  weekly: '每周',
  never: '不需要 / 禁止',
  'as-needed': '按需',
  '2-3d': '每 2-3 天',
  '14d': '每 2 周',
  '14-21d': '每 2-3 周',
  '14-30d': '每 2-4 周',
  '21-30d': '每 3-4 周',
  '30d': '每月',
  monthly: '每月',
  '90-180d': '每 3-6 个月',
  '180-365d': '每 6-12 个月',
};

export default {
  id: 'more',
  title: '更多',

  render(ctx) {
    const pet = ctx.pet;
    const sp = SPECIES[pet.species];
    const s = store.load();

    return h`
      <h1 class="page-title">⚙️ 更多</h1>

      ${raw(
        card(
          `${sp.name}的起居护理频率`,
          `<table class="table"><thead><tr><th>项目</th><th>频率</th><th>为什么</th></tr></thead><tbody>
            ${sp.care
              .map(
                (c) =>
                  `<tr><td>${esc(c.name)}</td><td>${esc(FREQ_LABEL[c.freq] ?? c.freq)}${c.min ? `<br><small class="muted">最低：${esc(c.min)}</small>` : ''}${c.season ? `<br><small class="muted">${esc(c.season)}加强</small>` : ''}</td><td><small>${esc(c.why)}</small></td></tr>`,
              )
              .join('')}
          </tbody></table>`,
          { icon: '🧴' },
        ),
      )}

      ${raw(
        card(
          '环境与居住要求',
          `<ul class="bullets">${sp.env.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>`,
          { icon: '🏠' },
        ),
      )}

      ${raw(
        card(
          '四季护理日历',
          SEASONS.map(
            (s2) =>
              `<details class="season"><summary>${esc(s2.name)}（${s2.months.join('/')} 月）</summary><ul class="bullets">${s2.tasks
                .map((t) => `<li>${esc(t)}</li>`)
                .join('')}</ul></details>`,
          ).join(''),
          { icon: '📅' },
        ),
      )}

      ${raw(
        card(
          '就医避坑指南',
          VET_TRAPS.map(
            (t) => `<details class="trap"><summary>${esc(t.scene)}</summary>
              <p><b>常见坑</b>：${esc(t.trap)}</p>
              <p class="good"><b>更聪明的做法</b>：${esc(t.smart)}</p>
              <p class="muted"><b>必须做的</b>：${esc(t.mustDo)}</p>
            </details>`,
          ).join(''),
          { icon: '🔍' },
        ),
      )}

      ${raw(
        card(
          '费用量级参考',
          `<table class="table"><tbody>${COST_REFERENCE.map((c) => `<tr><td>${esc(c.item)}</td><td>${esc(c.range)} 元</td></tr>`).join('')}</tbody></table>
           <p class="muted">一二线城市区间，仅用于判断是否明显偏离量级。设备水平、医生资质与耗材差异都会影响定价，"贵"不等于"坑"，"便宜"也不等于划算。</p>`,
          { icon: '💰' },
        ),
      )}

      ${raw(
        card(
          '我的宠物',
          `<ul class="pet-list">${s.pets
            .map(
              (p) => `<li class="${p.id === pet.id ? 'active' : ''}">
                <button class="btn small" data-switch="${esc(p.id)}">${esc(SPECIES[p.species]?.emoji ?? '🐾')} ${esc(p.name)}</button>
                ${s.pets.length > 1 ? `<button class="btn small ghost" data-remove="${esc(p.id)}">删除</button>` : ''}
              </li>`,
            )
            .join('')}</ul>
           <button class="btn" id="add-pet">+ 添加一只宠物</button>
           <p class="muted">多宠家庭尤其注意：狗用驱虫药不能用于猫，猫需要单独的进食点与猫砂盆数量。</p>`,
          { icon: '🐾' },
        ),
      )}

      ${raw(
        card(
          '数据',
          `<p class="muted">所有记录只保存在这台设备的浏览器里，不会上传。清除浏览器数据或卸载会一并删除，建议定期导出备份。</p>
           <button class="btn" id="export">导出档案 JSON</button>
           <button class="btn ghost" id="wipe">清除全部数据</button>`,
          { icon: '💾' },
        ),
      )}

      <p class="disclaimer">PetBloom 的所有内容都是科学养护参考，会随共识更新；具体到你的宠物，最终判断权始终属于面诊过它的执业兽医。</p>
    `;
  },

  bind(root, ctx) {
    root.querySelectorAll('button[data-switch]').forEach((b) =>
      b.addEventListener('click', () => {
        store.setActivePet(b.dataset.switch);
        ctx.navigate('home');
      }),
    );

    root.querySelectorAll('button[data-remove]').forEach((b) =>
      b.addEventListener('click', () => {
        if (confirm('删除这只宠物的全部档案与记录？此操作无法撤销。')) {
          store.removePet(b.dataset.remove);
          ctx.refresh();
        }
      }),
    );

    root.querySelector('#add-pet')?.addEventListener('click', () => ctx.navigate('onboarding'));

    root.querySelector('#export')?.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(store.load(), null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `petbloom-${store.today()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    });

    root.querySelector('#wipe')?.addEventListener('click', () => {
      if (confirm('清除全部宠物档案与记录？此操作无法撤销。')) {
        store.reset();
        ctx.navigate('onboarding');
      }
    });
  },
};
