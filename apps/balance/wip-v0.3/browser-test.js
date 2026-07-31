const { chromium } = require('playwright-core');
const path = '/home/user/StellarYield/apps/balance/index.html';

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const pg = await b.newPage({ viewport: { width: 400, height: 900 } });
  const errs = [];
  pg.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
  pg.on('dialog', d => { errs.push('DIALOG: ' + d.message()); d.accept(); });

  await pg.goto('file://' + path);
  await pg.waitForTimeout(300);

  const step = async (label, fn) => {
    try { await fn(); await pg.waitForTimeout(150); console.log('✓ ' + label); }
    catch (e) { console.log('✗ ' + label + ' → ' + e.message.split('\n')[0]); }
  };

  // ── onboarding
  await step('落地页渲染', async () => {
    const t = await pg.textContent('h1');
    if (!t.includes('BALANCE')) throw new Error('no title, got ' + t);
  });
  await step('选择增重模式', () => pg.click('[data-act="mode"][data-v="gain"]'));
  await step('进入第 1 步', () => pg.click('[data-act="step"][data-v="1"]'));
  await step('填身体数据', async () => {
    await pg.fill('#f-age', '31'); await pg.fill('#f-h', '178');
    await pg.fill('#f-w', '55'); await pg.fill('#f-t', '65');
    await pg.selectOption('#f-act', '1.55');
  });
  await step('提交资料 → SCOFF', async () => {
    await pg.click('[data-act="saveProfile"]');
    if (!(await pg.textContent('h2')).includes('开始之前')) throw new Error('未进入筛查');
  });
  await step('SCOFF 全否', async () => {
    for (let i = 0; i < 5; i++) await pg.click(`[data-act="scoff"][data-i="${i}"][data-v="0"]`);
    await pg.click('[data-act="scoffDone"]');
  });
  await step('进入主界面', async () => {
    if (!(await pg.isVisible('#tabs'))) throw new Error('tabs 未出现');
  });

  // ── TDEE 正确性：male 178cm 55kg 31y ×1.55, gain=+15%
  await step('目标热量计算', async () => {
    await pg.click('[data-act="tab"][data-v="me"]');
    await pg.waitForTimeout(200);
    const txt = await pg.textContent('#main');
    const bmrExp = Math.round(10 * 55 + 6.25 * 178 - 5 * 31 - 161); // female default sex!
    if (!txt.includes(String(bmrExp))) throw new Error('BMR 期望 ' + bmrExp + ' 未出现');
  });

  // ── 体质测评
  await step('体质测评 30 题', async () => {
    await pg.click('[data-act="tab"][data-v="body"]');
    await pg.waitForTimeout(200);
    const n = await pg.locator('.q').count();
    if (n !== 30) throw new Error('题数 ' + n);
    // 痰湿相关题全选“总是”，其余选“很少”
    for (let i = 0; i < 30; i++) {
      const v = (i >= 14 && i <= 18) ? 5 : 2;
      await pg.click(`[data-act="ans"][data-i="${i}"][data-v="${v}"]`);
    }
  });
  await step('生成报告 → 判定痰湿质', async () => {
    await pg.click('[data-act="finishQuiz"]');
    await pg.waitForTimeout(250);
    const t = await pg.textContent('#main');
    if (!t.includes('痰湿质')) throw new Error('未判定为痰湿质');
  });
  await step('雷达图渲染', async () => {
    const p = await pg.locator('svg.chart polygon').count();
    if (p < 5) throw new Error('雷达多边形数 ' + p);
  });

  // ── 记录饮食 + 体质标签
  await step('搜索并添加食物', async () => {
    await pg.click('[data-act="tab"][data-v="log"]');
    await pg.waitForTimeout(200);
    await pg.fill('#q', '红烧肉');
    await pg.waitForTimeout(250);
    await pg.click('[data-act="add"]');
    await pg.waitForTimeout(250);
  });
  await step('餐食出现在今日 + 忌食标签', async () => {
    const t = await pg.textContent('#main');
    if (!t.includes('红烧肉')) throw new Error('未出现在今日');
    const avoid = await pg.locator('.tag.avoid').count();
    if (avoid < 1) throw new Error('痰湿质吃红烧肉应标“忌”');
  });
  await step('热量累计非零', async () => {
    const big = await pg.textContent('.kcal .big');
    if (!(parseInt(big) > 300)) throw new Error('kcal=' + big);
  });

  // ── 体重 + 趋势
  await step('记录体重两天', async () => {
    await pg.fill('#w-in', '55.5'); await pg.click('[data-act="logWeight"]');
    await pg.waitForTimeout(200);
    await pg.evaluate(() => { S.weights['2026-07-29'] = 55.0; save(); render(); });
    await pg.waitForTimeout(200);
    if ((await pg.locator('svg.chart path').count()) < 2) throw new Error('趋势线未画出');
  });

  // ── 冲动急救
  await step('冲动急救三步 + 倒计时', async () => {
    await pg.click('[data-act="sosStart"]');
    await pg.waitForTimeout(200);
    await pg.click('[data-act="sosStep"][data-v="2"]');
    await pg.waitForTimeout(200);
    await pg.click('[data-act="sosEmo"][data-i="0"]');
    await pg.waitForTimeout(200);
    await pg.click('[data-act="sosStep"][data-v="3"]');
    await pg.waitForTimeout(1400);
    const t = await pg.textContent('#main');
    if (!/1[34]:\d\d/.test(t)) throw new Error('倒计时未走动: ' + (t.match(/\d\d:\d\d/) || []));
  });
  await step('结束急救并记录', async () => {
    await pg.click('[data-act="sosEnd"][data-v="1"]');
    await pg.waitForTimeout(200);
  });

  // ── 徽章 / 主题 / 持久化
  await step('徽章点亮', async () => {
    await pg.click('[data-act="tab"][data-v="tools"]');
    await pg.waitForTimeout(200);
    const got = await pg.locator('.badge.got').count();
    if (got < 2) throw new Error('点亮数 ' + got);
  });
  await step('切换三套皮肤', async () => {
    await pg.click('[data-act="tab"][data-v="me"]');
    await pg.waitForTimeout(150);
    for (const s of ['die', 'yang', 'balance']) {
      await pg.click(`[data-act="skin"][data-v="${s}"]`);
      await pg.waitForTimeout(120);
      const d = await pg.getAttribute('html', 'data-skin');
      if (d !== s) throw new Error('皮肤未切换: ' + d);
    }
  });
  await step('刷新后数据仍在', async () => {
    await pg.reload();
    await pg.waitForTimeout(400);
    // 刷新后停在上次所在的 tab（我的），先切回今日再查记录
    await pg.click('[data-act="tab"][data-v="today"]');
    await pg.waitForTimeout(250);
    const t = await pg.textContent('#main');
    if (!t.includes('红烧肉')) throw new Error('刷新后记录丢失');
    if (!t.includes('痰湿质')) throw new Error('刷新后体质结果丢失');
  });
  await step('切到减脂模式', async () => {
    await pg.click('[data-act="tab"][data-v="me"]');
    await pg.waitForTimeout(200);
    await pg.click('[data-act="mode2"][data-v="loss"]');
    await pg.waitForTimeout(200);
    const t = await pg.textContent('#topbar');
    if (!t.includes('减脂')) throw new Error('模式未切换');
  });

  // ── 安全网：SCOFF 触发
  await step('SCOFF ≥2 触发安全模式', async () => {
    await pg.evaluate(() => { localStorage.clear(); });
    await pg.reload(); await pg.waitForTimeout(300);
    await pg.click('[data-act="step"][data-v="1"]');
    await pg.waitForTimeout(150);
    await pg.click('[data-act="saveProfile"]');
    await pg.waitForTimeout(150);
    for (let i = 0; i < 5; i++)
      await pg.click(`[data-act="scoff"][data-i="${i}"][data-v="${i < 3 ? 1 : 0}"]`);
    await pg.click('[data-act="scoffDone"]');
    await pg.waitForTimeout(250);
    const t = await pg.textContent('#main');
    if (!t.includes('先照顾你')) throw new Error('未进入安全网页面');
  });
  await step('安全模式关闭热量计数', async () => {
    await pg.click('[data-act="enterSafe"]');
    await pg.waitForTimeout(250);
    const t = await pg.textContent('#main');
    if (t.includes('今日摄入')) throw new Error('热量卡片仍在显示');
    if (!t.includes('今日结构')) throw new Error('未切到结构模式');
  });

  // ── 目标体重过低警告
  await step('目标 BMI<18.5 出现警告', async () => {
    await pg.evaluate(() => {
      S.screen.flagged = false; S.profile.mode = 'loss';
      S.profile.height = 170; S.profile.weight = 60; S.profile.target = 48;
      save(); S.tab = 'today'; render();
    });
    await pg.waitForTimeout(250);
    const t = await pg.textContent('#main');
    if (!t.includes('低于 18.5')) throw new Error('未出现过瘦警告');
  });

  await pg.screenshot({ path: '/tmp/claude-0/-home-user-StellarYield/76aed9a0-d2c0-5bb7-a10f-7ae436443a9b/scratchpad/shot.png', fullPage: false });
  console.log('\n' + (errs.length ? '⚠ 运行时错误:\n' + errs.join('\n') : '✓ 无 JS 错误 / 无意外弹窗'));
  await b.close();
})();
