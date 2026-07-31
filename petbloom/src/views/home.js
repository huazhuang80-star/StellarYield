/** 首页仪表盘：今天的状态、今天该做的事、需要注意的事。 */

import { h, raw, esc, card } from '../ui.js';
import { SPECIES } from '../data/species.js';
import * as store from '../lib/store.js';
import { feedingPlan, waterTarget } from '../lib/nutrition.js';
import { dailyTasks, buildAlerts, seasonFor } from '../lib/alerts.js';
import { stageForDays, gardenHealth, streakDays, earnedBadges, easterEgg } from '../lib/growth.js';
import { MICRO_CARE } from '../data/care.js';

const TONE = { danger: 'danger', warn: 'warn', info: 'info' };

export default {
  id: 'home',
  title: '首页',

  render(ctx) {
    const pet = ctx.pet;
    const sp = SPECIES[pet.species];
    const ageMonths = store.ageInMonths(pet);
    const days = store.daysBetween(pet.homecoming);
    const logs = store.statsFor(pet.id).logs;
    const todayLog = logs.find((l) => l.date === store.today()) ?? { taskIds: [], waterMl: null, foodGrams: null };
    const plan = feedingPlan({ ...pet, ageMonths });
    const tasks = dailyTasks(pet);
    const alerts = buildAlerts(pet, logs, ageMonths, plan);
    const stage = stageForDays(days);
    const garden = gardenHealth(logs);
    const streak = streakDays(logs);
    const badges = earnedBadges(store.statsFor(pet.id));
    const water = waterTarget(pet.species, pet.weightKg);
    const season = seasonFor();
    const egg = easterEgg({
      daysTogether: days,
      hour: new Date().getHours(),
      isBirthday: Boolean(pet.birthday && pet.birthday.slice(5) === store.today().slice(5)),
      petName: pet.name,
    });

    const doneCount = todayLog.taskIds?.length ?? 0;

    return h`
      <header class="pet-head">
        <div class="pet-title">
          <span class="pet-emoji">${sp.emoji}</span>
          <div>
            <h1>${pet.name}</h1>
            <p class="muted">${sp.name}${pet.breed ? ' · ' + pet.breed : ''} · ${store.ageLabel(pet)} · 陪伴第 ${days + 1} 天</p>
          </div>
        </div>
        <div class="stage-chip" title="${esc(stage.meaning)}">${stage.emoji} ${stage.name}</div>
      </header>

      ${egg ? raw(`<p class="egg">✨ ${esc(egg)}</p>`) : ''}

      ${raw(
        card(
          '今日健康仪表盘',
          h`<div class="metrics">
            <div class="metric">
              <span class="metric-label">体重</span>
              <strong>${pet.weightKg ? pet.weightKg + ' kg' : '未记录'}</strong>
            </div>
            <div class="metric">
              <span class="metric-label">今日进食</span>
              <strong>${todayLog.foodGrams ? todayLog.foodGrams + ' g' : '未记录'}</strong>
              ${plan?.portions ? raw(`<small class="muted">建议 ${plan.portions.dry.grams + plan.portions.wet.grams} g</small>`) : ''}
            </div>
            <div class="metric">
              <span class="metric-label">今日饮水</span>
              <strong>${todayLog.waterMl ? todayLog.waterMl + ' ml' : '未记录'}</strong>
              ${water ? raw(`<small class="muted">目标 ${water.min}-${water.max} ml</small>`) : ''}
            </div>
            <div class="metric">
              <span class="metric-label">连续达成</span>
              <strong>${streak} 天</strong>
            </div>
          </div>
          <a class="btn ghost block" href="#records">去记录今天的数据 →</a>`,
          { icon: '📊' },
        ),
      )}

      ${alerts.length
        ? raw(
            card(
              `需要注意（${alerts.length}）`,
              alerts
                .map(
                  (a) => `<div class="alert tone-${TONE[a.level] ?? 'info'}">
                    <strong>${esc(a.title)}</strong>
                    <p>${esc(a.detail)}</p>
                    ${a.action ? `<p class="alert-action">→ ${esc(a.action)}</p>` : ''}
                  </div>`,
                )
                .join(''),
              { icon: '⚠️', tone: 'warn' },
            ),
          )
        : raw(card('今日无异常', '<p class="muted">记录得越连续，预警越准。异常通常先出现在食欲、饮水与精神状态上。</p>', { icon: '✅' }))}

      ${raw(
        card(
          `今日任务（${doneCount}/${tasks.length}）`,
          h`<ul class="tasks">
            ${tasks.map(
              (t) => raw(`<li class="task${todayLog.taskIds?.includes(t.id) ? ' done' : ''}${t.emphasize ? ' emphasize' : ''}">
                <label>
                  <input type="checkbox" data-task="${esc(t.id)}"${todayLog.taskIds?.includes(t.id) ? ' checked' : ''}>
                  <span class="task-name">${esc(t.name)}</span>
                </label>
                <p class="task-why">${esc(t.why)}</p>
              </li>`),
            )}
          </ul>
          <div class="garden tone-${garden.tone}">
            <div class="garden-bar"><span style="width:${garden.score}%"></span></div>
            <p>${stage.emoji} 花园健康度 ${garden.score} · ${garden.label}</p>
          </div>`,
          { icon: '📋' },
        ),
      )}

      ${raw(
        card(
          `${season.name}护理重点`,
          `<ul class="bullets">${season.tasks.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`,
          { icon: '📅' },
        ),
      )}

      ${raw(
        card(
          '每日微养护',
          `<ul class="micro">${MICRO_CARE.map((m) => `<li><b>${m.minutes} 分钟</b> ${esc(m.name)}<small class="muted">${esc(m.why)}</small></li>`).join('')}</ul>`,
          { icon: '⏱️' },
        ),
      )}

      ${raw(
        card(
          '成就',
          `<div class="badges">${badges
            .map(
              (b) => `<div class="badge${b.earned ? ' earned' : ''}" title="${esc(b.desc)}">
                <span class="badge-icon">${esc(b.icon)}</span><span class="badge-name">${esc(b.name)}</span>
              </div>`,
            )
            .join('')}</div>`,
          { icon: '🏅' },
        ),
      )}

      <a class="btn danger block sticky-cta" href="#triage">🏥 它好像不舒服</a>
      <p class="disclaimer">PetBloom 不做疾病诊断。紧急情况请直接联系 24 小时急诊。</p>
    `;
  },

  bind(root, ctx) {
    const total = dailyTasks(ctx.pet).length;
    root.querySelectorAll('input[data-task]').forEach((box) => {
      box.addEventListener('change', () => {
        store.toggleTask(ctx.pet.id, box.dataset.task, total);
        ctx.refresh();
      });
    });
  },
};
