/**
 * 离线缓存。
 *
 * 症状自查最需要的时刻，可能正是凌晨三点、信号很差的时候 —— 所以整套
 * 判级规则与养护数据都必须能离线工作。策略：
 *   · 应用自身资源用 stale-while-revalidate（打开即用，后台更新）
 *   · 非 GET 与跨域请求不拦截
 */

const CACHE = 'petbloom-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './styles/app.css',
  './icons/icon.svg',
  './src/app.js',
  './src/ui.js',
  './src/data/species.js',
  './src/data/foods.js',
  './src/data/behavior.js',
  './src/data/care.js',
  './src/data/triage.js',
  './src/data/myths.js',
  './src/lib/nutrition.js',
  './src/lib/triage.js',
  './src/lib/store.js',
  './src/lib/alerts.js',
  './src/lib/growth.js',
  './src/lib/projection.js',
  './src/views/onboarding.js',
  './src/views/home.js',
  './src/views/records.js',
  './src/views/nutrition.js',
  './src/views/behavior.js',
  './src/views/triage.js',
  './src/views/more.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) caches.open(CACHE).then((cache) => cache.put(request, response.clone()));
          return response;
        })
        .catch(() => cached ?? caches.match('./index.html'));
      return cached ?? network;
    }),
  );
});
