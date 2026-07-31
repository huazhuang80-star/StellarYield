const { chromium } = require('playwright-core');
const D = '/tmp/claude-0/-home-user-StellarYield/76aed9a0-d2c0-5bb7-a10f-7ae436443a9b/scratchpad/';

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

  const boot = async (dark) => {
    const pg = await b.newPage({
      viewport: { width: 400, height: 1000 },
      colorScheme: dark ? 'dark' : 'light'
    });
    await pg.goto('file:///home/user/StellarYield/apps/balance/index.html');
    await pg.waitForTimeout(200);
    // 直接注入一个已完成引导 + 已测体质 + 有记录的状态
    await pg.evaluate(() => {
      S.onboarded = true; S.screen = { done: true, yes: 0, flagged: false };
      S.profile = { sex: 'female', age: 28, height: 165, weight: 68, target: 60, activity: 1.375, mode: 'loss', start: '2026-06-20' };
      const sc = {}; for (const t of TID) sc[t] = 20;
      sc.tanshi = 78; sc.shire = 52; sc.qixu = 41; sc.pinghe = 30;
      S.constitution = { done: true, scores: sc, primary: 'tanshi', tend: ['shire', 'qixu'] };
      const add = (d, fi, slot, g) => {
        S.logs[d] = S.logs[d] || { meals: [], impulses: [] };
        const f = FOODS[fi], k = g / 100;
        S.logs[d].meals.push({ fi, slot, g, home: true, kcal: f[1] * k, p: f[2] * k, c: f[3] * k, f: f[4] * k });
      };
      const t = today();
      add(t, FOODS.findIndex(f => f[0] === '糙米饭'), '午餐', 200);
      add(t, FOODS.findIndex(f => f[0] === '清蒸鱼'), '午餐', 150);
      add(t, FOODS.findIndex(f => f[0] === '红烧肉'), '晚餐', 100);
      add(t, FOODS.findIndex(f => f[0] === '奶茶'), '加餐', 400);
      S.weights = { '2026-07-24': 69.4, '2026-07-26': 69.0, '2026-07-28': 68.5, '2026-07-30': 68.0 };
      save();
    });
    return pg;
  };

  const p1 = await boot(false);
  await p1.evaluate(() => { S.tab = 'today'; render(); });
  await p1.waitForTimeout(300);
  await p1.screenshot({ path: D + 's-today.png' });

  await p1.evaluate(() => { S.tab = 'body'; render(); });
  await p1.waitForTimeout(300);
  await p1.screenshot({ path: D + 's-body.png' });

  await p1.evaluate(() => { S.sos = { step: 3, emo: 0, until: Date.now() + 11 * 60000 + 24000 }; S.tab = 'tools'; render(); });
  await p1.waitForTimeout(300);
  await p1.screenshot({ path: D + 's-sos.png' });

  await p1.evaluate(() => { S.sos = null; S.tab = 'log'; render(); });
  await p1.waitForTimeout(200);
  await p1.fill('#q', '');
  await p1.waitForTimeout(250);
  await p1.screenshot({ path: D + 's-log.png' });

  const p2 = await boot(true);
  await p2.evaluate(() => { S.tab = 'today'; render(); });
  await p2.waitForTimeout(300);
  await p2.screenshot({ path: D + 's-dark.png' });

  await p2.evaluate(() => { S.skin = 'yang'; S.tab = 'today'; render(); });
  await p2.waitForTimeout(250);
  await p2.screenshot({ path: D + 's-yang-dark.png' });

  console.log('shots done');
  await b.close();
})();
