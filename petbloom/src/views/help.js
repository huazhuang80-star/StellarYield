/** 帮助：常见问题 + 各页面怎么用 + 数据与隐私说明。 */

import { h, raw, esc, card, linkRow, linkGroup } from '../ui.js';
import { FAQ } from '../data/meta.js';

const HOW_TO = [
  { icon: '🏠', name: '首页', text: '今天的状态、今天该做的事、需要注意的预警。任务勾选会计入连续达成与花园健康度。' },
  { icon: '📋', name: '档案', text: '记体重、进食、饮水与备注；打勾免疫项会自动记下日期；下方是体检清单与双未来预测。' },
  { icon: '🍖', name: '吃什么', text: '每日份量、食物能不能吃、粮袋成分评测、换粮过渡表。改体重或目标后点「重算」。' },
  { icon: '🧠', name: '读懂它', text: '叫声与身体语言逐条翻译，看懂就点解锁；下方是问题行为方案与你的认知修补优先级。' },
  { icon: '🏥', name: '症状自查', text: '8 道观察题 + 危险信号 → 红/黄/绿判级 + 行动清单，可一键生成就医摘要复制给医生。' },
  { icon: '⏰', name: '提醒', text: '疫苗、驱虫、体检、生日、称重的统一到期视图。提前量可在设置里改。' },
  { icon: '💊', name: '健康档案', text: '用药与驱虫、就诊记录、化验指标趋势、花费统计，以及可出示的身份卡。' },
  { icon: '🌳', name: '时间轴', text: '把里程碑、就诊、体重变化按时间排在一起，是它这一路的完整故事。' },
  { icon: '📖', name: '知识库', text: '按分类浏览可执行的养护短文，已按当前宠物物种过滤。' },
  { icon: '🚑', name: '急救', text: '12 类急症的家庭处置：怎么判断 / 立刻做什么 / 绝对不要做什么。' },
  { icon: '🧭', name: '养护向导', text: '不知道从哪问起时用它。规则式引导问答，几步给出明确行动。' },
  { icon: '🔍', name: '搜索', text: '顶栏的搜索会同时搜食物、行为、知识、急救与常见问题。' },
];

export default {
  id: 'help',
  title: '帮助',

  render() {
    return h`
      <h1 class="page-title">❓ 帮助与常见问题</h1>
      <p class="lede">先看一眼每个页面是干嘛的，再往下是被问得最多的十几个问题。</p>

      ${raw(linkGroup('每个页面怎么用', HOW_TO.map((x) => linkRow('#' + routeOf(x.name), x.icon, x.name, x.text))))}

      ${raw(
        card(
          '常见问题',
          FAQ.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join(''),
          { icon: '💬' },
        ),
      )}

      ${raw(
        card(
          '数据与隐私',
          `<ul class="bullets">
            <li>所有记录保存在你这台设备的浏览器本地存储中，App 本身没有任何联网请求。</li>
            <li>没有账号、没有服务器、没有统计埋点 —— 也就没有可以泄漏的地方。</li>
            <li>代价是：清除浏览器数据、卸载或换设备会丢失记录。请定期导出 JSON 备份。</li>
            <li>浏览器隐私模式下可能无法写入本地存储，此时数据只在当前标签页有效，App 会自动退回内存模式而不是崩溃。</li>
          </ul>
          <a class="btn ghost" href="#settings">去设置里导出备份</a>`,
          { icon: '🔒' },
        ),
      )}

      ${raw(
        card(
          '还是没解决？',
          `<p>这个版本完全离线，没有内置反馈通道。你可以：</p>
           <ul class="bullets">
             <li>导出档案 JSON，连同问题描述一起反馈给开发者。</li>
             <li>健康相关的疑问，优先咨询面诊过你宠物的执业兽医 —— 这不是客套话，是这个 App 的设计前提。</li>
           </ul>`,
          { icon: '📮' },
        ),
      )}
    `;
  },
};

function routeOf(name) {
  return (
    {
      首页: 'home',
      档案: 'records',
      吃什么: 'nutrition',
      读懂它: 'behavior',
      症状自查: 'triage',
      提醒: 'reminders',
      健康档案: 'health',
      时间轴: 'timeline',
      知识库: 'knowledge',
      急救: 'firstaid',
      养护向导: 'guide',
      搜索: 'search',
    }[name] ?? 'home'
  );
}
