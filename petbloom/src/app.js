/**
 * 应用外壳：hash 路由（含查询参数）+ 顶栏 + 物种主题 + 底部导航。
 * 无框架、无构建步骤。
 */

import * as store from './lib/store.js';
import { parseRoute } from './lib/route.js';
import { SPECIES } from './data/species.js';
import { buildReminders, actionable } from './lib/reminders.js';
import onboarding from './views/onboarding.js';
import home from './views/home.js';
import records from './views/records.js';
import nutrition from './views/nutrition.js';
import behavior from './views/behavior.js';
import triage from './views/triage.js';
import more from './views/more.js';
import knowledge from './views/knowledge.js';
import firstaid from './views/firstaid.js';
import reminders from './views/reminders.js';
import timeline from './views/timeline.js';
import health from './views/health.js';
import search from './views/search.js';
import guide from './views/guide.js';
import settings from './views/settings.js';
import about from './views/about.js';
import help from './views/help.js';

const VIEWS = {
  onboarding, home, records, nutrition, behavior, triage, more,
  knowledge, firstaid, reminders, timeline, health, search, guide, settings, about, help,
};

const NAV = [
  { id: 'home', icon: '🏠', label: '首页' },
  { id: 'records', icon: '📋', label: '档案' },
  { id: 'nutrition', icon: '🍖', label: '吃什么' },
  { id: 'behavior', icon: '🧠', label: '读懂它' },
  { id: 'more', icon: '⚙️', label: '更多' },
];

const app = document.querySelector('#app');
const nav = document.querySelector('#nav');
const bar = document.querySelector('#appbar');

const ROUTE_IDS = Object.keys(VIEWS);

/** 解析 `#route?a=1&b=2`。地址栏内容完全由用户控制，按不可信输入处理。 */
function parseHash() {
  return parseRoute(location.hash || '#home', ROUTE_IDS, 'home');
}

function navigate(to, opts = {}) {
  const target = `#${to}`;
  if (location.hash === target) render(opts);
  else {
    pendingOpts = opts;
    location.hash = target;
  }
}

let pendingOpts = null;

function render(opts = {}) {
  const pet = store.activePet();
  const parsed = parseHash();
  let routeId = parsed.id;
  const params = parsed.params;

  // 没有任何宠物时，强制走建档流程
  if (!pet && routeId !== 'onboarding') routeId = 'onboarding';

  const view = VIEWS[routeId];
  const ctx = { pet, params, navigate, refresh: (o) => render(o), route: routeId };

  applyTheme(pet);
  const scrollY = window.scrollY;

  app.innerHTML = view.render(ctx);
  view.bind?.(app, ctx);

  renderAppBar(pet, routeId);
  renderNav(pet, routeId);

  if (opts.scrollTop) window.scrollTo({ top: 0, behavior: 'smooth' });
  else if (opts.keepFocus) {
    const el = app.querySelector(opts.keepFocus);
    if (el) {
      el.focus();
      const len = el.value?.length ?? 0;
      el.setSelectionRange?.(len, len);
    }
    window.scrollTo({ top: scrollY });
  }
}

/** 物种强调色 + 用户选择的浅/深色与字号。 */
function applyTheme(pet) {
  const root = document.documentElement;
  root.dataset.species = pet ? SPECIES[pet.species]?.theme ?? 'meow' : 'meow';
  const st = store.settings();
  if (st.theme && st.theme !== 'auto') root.dataset.theme = st.theme;
  else delete root.dataset.theme;
  root.style.setProperty('--font-scale', String(st.fontScale ?? 1));
}

function renderAppBar(pet, routeId) {
  if (!pet || routeId === 'onboarding') {
    bar.innerHTML = '';
    bar.hidden = true;
    return;
  }
  const s = store.load();
  const sp = SPECIES[pet.species];
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

  const switcher =
    s.pets.length > 1
      ? `<select id="pet-switch" aria-label="切换宠物">${s.pets
          .map((p) => `<option value="${p.id}"${p.id === pet.id ? ' selected' : ''}>${SPECIES[p.species]?.emoji ?? '🐾'} ${escapeAttr(p.name)}</option>`)
          .join('')}</select>`
      : `<span class="bar-pet">${sp.emoji} ${escapeHtml(pet.name)}</span>`;

  bar.hidden = false;
  bar.innerHTML = `${switcher}
    <div class="bar-actions">
      <a href="#reminders" class="bar-btn" aria-label="提醒">⏰${due ? `<i class="dot">${due}</i>` : ''}</a>
      <a href="#search" class="bar-btn" aria-label="搜索">🔍</a>
      <a href="#settings" class="bar-btn" aria-label="设置">⚙️</a>
    </div>`;

  bar.querySelector('#pet-switch')?.addEventListener('change', (e) => {
    store.setActivePet(e.target.value);
    render({ scrollTop: true });
  });
}

function renderNav(pet, routeId) {
  if (!pet || routeId === 'onboarding') {
    nav.innerHTML = '';
    nav.hidden = true;
    return;
  }
  // 二级页面高亮到"更多"，避免底栏看起来没有任何选中项
  const secondary = ['knowledge', 'firstaid', 'reminders', 'timeline', 'health', 'search', 'guide', 'settings', 'about', 'help'];
  const active = NAV.some((n) => n.id === routeId) ? routeId : secondary.includes(routeId) ? 'more' : '';
  nav.hidden = false;
  nav.innerHTML = NAV.map(
    (n) => `<a href="#${n.id}" class="${n.id === active ? 'active' : ''}"${n.id === active ? ' aria-current="page"' : ''}><span>${n.icon}</span><small>${n.label}</small></a>`,
  ).join('');
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escapeAttr(s) {
  return escapeHtml(s);
}

window.addEventListener('hashchange', () => {
  const opts = pendingOpts ?? { scrollTop: true };
  pendingOpts = null;
  render(opts);
});
render();

// 离线可用：症状自查最需要的时刻，可能正是网络最差的时候。
// 单文件打包版本本身就是离线的（没有外部请求），不需要也没有 Service Worker 可注册。
const SINGLE_FILE = typeof __PB_SINGLE_FILE__ !== 'undefined';
if (!SINGLE_FILE && 'serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}
