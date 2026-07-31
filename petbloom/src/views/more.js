/** 更多：所有二级功能的总入口，外加起居护理、季节日历、避坑指南与费用参考。 */

import { h, raw, esc, card, linkRow, linkGroup } from '../ui.js';
import { SPECIES } from '../data/species.js';
import { SEASONS, VET_TRAPS, COST_REFERENCE } from '../data/care.js';
import * as store from '../lib/store.js';
import { buildReminders, actionable } from '../lib/reminders.js';
import { ARTICLES } from '../data/knowledge.js';
import { FIRST_AID } from '../data/firstaid.js';
import { GUIDES } from '../data/guide.js';
import { APP } from '../data/meta.js';

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
    const stats = store.statsFor(pet.id);
    const due = actionable(
      buildReminders({
        pet,
        ageMonths: store.ageInMonths(pet),
        logs: stats.logs,
        meds: stats.meds,
        visits: stats.visits,
        today: store.today(),
        leadDays: s.settings.remindLeadDays ?? 7,
      }),
    ).length;

    return h`
      <h1 class="page-title">⚙️ 更多</h1>

      ${raw(
        linkGroup('日常', [
          linkRow('#reminders', '⏰', due ? `提醒（${due} 项待处理）` : '提醒', '疫苗、驱虫、体检、生日、称重的统一到期视图'),
          linkRow('#timeline', '🌳', '成长时间轴', `里程碑、就诊与体重合成一条线（已有 ${stats.milestones.length} 个里程碑）`),
          linkRow('#health', '💊', '健康档案', '用药与驱虫、就诊记录、化验趋势、花费、身份卡'),
        ]),
      )}

      ${raw(
        linkGroup('学与查', [
          linkRow('#knowledge', '📖', '知识库', `${ARTICLES.length} 篇可执行的养护短文`),
          linkRow('#guide', '🧭', '养护向导', `${GUIDES.length} 个引导问答：不吃东西、选粮、乱尿、要不要去医院…`),
          linkRow('#firstaid', '🚑', '家庭急救', `${FIRST_AID.length} 类急症：怎么判断 / 立刻做什么 / 绝对不要做`),
          linkRow('#search', '🔍', '全局搜索', '食物、行为、知识、急救、名词一起搜'),
        ]),
      )}

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

      ${raw(card('环境与居住要求', `<ul class="bullets">${sp.env.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>`, { icon: '🏠' }))}

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
        linkGroup('设置与说明', [
          linkRow('#settings', '⚙️', '设置', `主题、字号、提醒提前量、宠物管理、备份与导入（当前 ${s.pets.length} 只）`),
          linkRow('#help', '❓', '帮助与常见问题', '每个页面怎么用，以及被问得最多的问题'),
          linkRow('#about', 'ℹ️', `关于 PetBloom v${APP.version}`, '产品原则、内容依据与边界、名词表、更新日志'),
        ]),
      )}

      <p class="disclaimer">PetBloom 的所有内容都是科学养护参考，会随共识更新；具体到你的宠物，最终判断权始终属于面诊过它的执业兽医。</p>
    `;
  },
};
