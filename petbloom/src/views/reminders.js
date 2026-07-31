/** 提醒中心：所有到期事项的统一视图。 */

import { h, raw, esc, card, emptyState } from '../ui.js';
import * as store from '../lib/store.js';
import { buildReminders, actionable, diffDays } from '../lib/reminders.js';
import { seasonFor, dailyTasks } from '../lib/alerts.js';

const STATE_META = {
  overdue: { label: '已过期', tone: 'danger' },
  due: { label: '即将到期', tone: 'warn' },
  upcoming: { label: '未来', tone: 'info' },
  unknown: { label: '缺少日期', tone: 'neutral' },
};

export default {
  id: 'reminders',
  title: '提醒',

  render(ctx) {
    const pet = ctx.pet;
    const stats = store.statsFor(pet.id);
    const today = store.today();
    const leadDays = store.settings().remindLeadDays ?? 7;
    const reminders = buildReminders({
      pet,
      ageMonths: store.ageInMonths(pet),
      logs: stats.logs,
      meds: stats.meds,
      visits: stats.visits,
      today,
      leadDays,
    });
    const need = actionable(reminders);
    const later = reminders.filter((r) => !need.includes(r));
    const season = seasonFor();
    const tasks = dailyTasks(pet);

    return h`
      <h1 class="page-title">⏰ 提醒</h1>
      <p class="muted">疫苗、驱虫、体检、生日、称重都在这里。提前 ${leadDays} 天开始提示（可在设置里改）。</p>

      ${raw(
        card(
          need.length ? `需要处理（${need.length}）` : '暂时没有到期事项',
          need.length
            ? `<ul class="reminders">${need.map((r) => row(r, today)).join('')}</ul>`
            : '<p class="muted">下面是未来的安排。记录得越完整，提醒就越准 —— 比如打勾一次驱虫，下一次的日期会自动排出来。</p>',
          { icon: need.length ? '🔔' : '✅', tone: need.some((r) => r.state === 'overdue') ? 'warn' : '' },
        ),
      )}

      ${later.length
        ? raw(card('后续安排', `<ul class="reminders">${later.map((r) => row(r, today)).join('')}</ul>`, { icon: '📅' }))
        : raw(emptyState('还没有可推算的安排。先在档案里填生日、打勾已完成的免疫，或记一条驱虫用药。', '<a class="btn" href="#records">去档案</a>'))}

      ${raw(
        card(
          `今天的日常任务（${tasks.length}）`,
          `<ul class="bullets">${tasks.map((t) => `<li>${esc(t.name)}<br><small class="muted">${esc(t.why)}</small></li>`).join('')}</ul>
           <a class="btn ghost" href="#home">去首页打卡</a>`,
          { icon: '📋' },
        ),
      )}

      ${raw(
        card(
          `${season.name}护理重点`,
          `<ul class="bullets">${season.tasks.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`,
          { icon: '🍂' },
        ),
      )}

      <p class="disclaimer">提醒基于你录入的记录推算，不会自动推送通知（离线版本没有后台服务）。建议把重要事项同时加进手机日历。</p>
    `;
  },
};

function row(r, today) {
  const meta = STATE_META[r.state] ?? STATE_META.unknown;
  const when = r.due ? `${r.due} · ${relative(diffDays(today, r.due))}` : '缺少日期，补齐生日或上次记录后可推算';
  return `<li class="reminder tone-${meta.tone}">
    <span class="rem-icon" aria-hidden="true">${r.icon}</span>
    <div class="rem-body">
      <b>${esc(r.title)}</b>
      <span class="rem-when">${esc(when)}</span>
      ${r.detail ? `<small class="muted">${esc(r.detail)}</small>` : ''}
    </div>
    <a class="chip" href="${esc(r.route)}">去处理</a>
  </li>`;
}

function relative(days) {
  if (days === 0) return '就是今天';
  if (days < 0) return `已过期 ${Math.abs(days)} 天`;
  if (days < 30) return `还有 ${days} 天`;
  if (days < 365) return `约 ${Math.round(days / 30)} 个月后`;
  return `约 ${(days / 365).toFixed(1)} 年后`;
}
