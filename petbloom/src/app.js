/** 应用外壳：hash 路由 + 物种主题 + 底部导航。无框架、无构建步骤。 */

import * as store from './lib/store.js';
import { SPECIES } from './data/species.js';
import onboarding from './views/onboarding.js';
import home from './views/home.js';
import records from './views/records.js';
import nutrition from './views/nutrition.js';
import behavior from './views/behavior.js';
import triage from './views/triage.js';
import more from './views/more.js';

const VIEWS = { onboarding, home, records, nutrition, behavior, triage, more };
const NAV = [
  { id: 'home', icon: '🏠', label: '首页' },
  { id: 'records', icon: '📋', label: '档案' },
  { id: 'nutrition', icon: '🍖', label: '吃什么' },
  { id: 'behavior', icon: '🧠', label: '读懂它' },
  { id: 'more', icon: '⚙️', label: '更多' },
];

const app = document.querySelector('#app');
const nav = document.querySelector('#nav');

function currentRoute() {
  const id = (location.hash || '#home').slice(1);
  return VIEWS[id] ? id : 'home';
}

function navigate(id) {
  if (location.hash === `#${id}`) render();
  else location.hash = `#${id}`;
}

function render(opts = {}) {
  const pet = store.activePet();
  let routeId = currentRoute();

  // 没有任何宠物时，强制走建档流程
  if (!pet && routeId !== 'onboarding') routeId = 'onboarding';

  const view = VIEWS[routeId];
  const ctx = { pet, navigate, refresh: (o) => render(o), route: routeId };

  document.documentElement.dataset.species = pet ? SPECIES[pet.species]?.theme ?? 'meow' : 'meow';
  const scrollY = window.scrollY;

  app.innerHTML = view.render(ctx);
  view.bind?.(app, ctx);

  nav.innerHTML =
    pet && routeId !== 'onboarding'
      ? NAV.map(
          (n) =>
            `<a href="#${n.id}" class="${n.id === routeId ? 'active' : ''}"><span>${n.icon}</span><small>${n.label}</small></a>`,
        ).join('')
      : '';
  nav.hidden = !nav.innerHTML;

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

window.addEventListener('hashchange', () => render({ scrollTop: true }));
render();

// 离线可用：症状自查最需要的时刻，可能正是网络最差的时候
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}
