/**
 * 家庭急救。
 *
 * 使用场景是"手在抖、脑子空白"，所以这一页刻意做得极其直白：
 * 没有折叠、没有分页，每张卡片就是三段 —— 怎么判断 / 现在做什么 / 千万别做。
 */

import { h, raw, esc, card } from '../ui.js';
import { FIRST_AID, KIT, VITALS } from '../data/firstaid.js';

export default {
  id: 'firstaid',
  title: '急救',

  render(ctx) {
    const focus = ctx.params.c;
    const cards = focus ? FIRST_AID.filter((f) => f.id === focus) : FIRST_AID;

    return h`
      <h1 class="page-title">🚑 家庭急救</h1>
      <p class="lede">先做对，再送医。所有急救的目的都是安全地争取时间，不是替代治疗。</p>

      <div class="alert tone-danger">
        <strong>出发前先打电话</strong>
        <p>确认医院此刻有值班医生与相应设备，避免白跑。搬运时用航空箱固定，疼痛中的动物会咬人 —— 必要时先用毛巾裹住头部。</p>
      </div>

      ${focus ? raw('<a class="back-link" href="#firstaid">‹ 全部急救卡片</a>') : ''}

      <div class="chips filter-chips">
        ${FIRST_AID.map((f) => raw(`<a class="chip ${focus === f.id ? 'active' : ''}" href="#firstaid?c=${f.id}">${f.icon} ${esc(f.title)}</a>`))}
      </div>

      ${cards.map((f) =>
        raw(
          card(
            `${f.icon} ${f.title}`,
            `<p class="muted"><b>怎么判断</b>：${esc(f.when)}</p>
             <h4 class="aid-do">现在立刻做</h4>
             <ol class="steps">${f.now.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
             <h4 class="aid-dont">绝对不要</h4>
             <ul class="bullets dont">${f.never.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
             <p class="highlight">${esc(f.go)}</p>`,
            { tone: 'danger' },
          ),
        ),
      )}

      ${raw(
        card(
          '家庭急救包清单',
          `<table class="table"><thead><tr><th>物品</th><th>用途</th></tr></thead><tbody>
            ${KIT.map((k) => `<tr><td>${esc(k.item)}</td><td><small>${esc(k.why)}</small></td></tr>`).join('')}
          </tbody></table>
          <p class="muted">建议把这一包和航空箱放在一起，位置全家都知道。</p>`,
          { icon: '🧰' },
        ),
      )}

      ${raw(
        card(
          '正常参考值（在家能测的）',
          `<table class="table"><thead><tr><th>项目</th><th>猫</th><th>犬</th><th>说明</th></tr></thead><tbody>
            ${VITALS.map((v) => `<tr><td>${esc(v.item)}</td><td>${esc(v.cat)}</td><td>${esc(v.dog)}</td><td><small class="muted">${esc(v.note)}</small></td></tr>`).join('')}
          </tbody></table>
          <p class="muted">平时在它健康时测几次，记住它自己的基线 —— 个体差异比参考区间更有意义。异宠的参考值差异极大，请咨询异宠专科医生。</p>`,
          { icon: '📏' },
        ),
      )}

      <a class="btn danger block" href="#triage">🏥 拿不准？做一次 5 分钟症状自查</a>
      <p class="disclaimer">急救措施不能替代兽医治疗。任何时候拿不准，直接送医永远是正确选择。</p>
    `;
  },
};
