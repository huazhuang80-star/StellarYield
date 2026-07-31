# Reborn 项目交接文档

> **给下一个对话的 Claude**：这份文档包含继续这个项目所需的全部上下文。请先完整读完再动手。
> **给用户**：新对话里让 Claude 读这个文件，它就能完全接上。

最后更新：2026-07-31 · 对应提交 `9a91aa9dd`

---

## 0. 一句话状态

《Reborn》戒色康复 APP 的**产品规划文档**和**可运行完整版应用**都已完成并推送到 GitHub；应用是单文件纯前端，26 个页面，浏览器实测零报错；PR #4 处于草稿状态，CI 三个检查失败但**全部是 StellarYield 仓库自身的历史问题**，与本项目无关。

---

## 1. 新对话第一步：怎么恢复

### 1.1 需要连接的仓库

```
huazhuang80-star/StellarYield
分支：claude/reborn-recovery-app-plan-u78hx1
```

如果新会话没有这个仓库，让 Claude 用 `add_repo` 工具添加（owner: `huazhuang80-star`, repo: `stellaryield`）。

### 1.2 恢复命令

```bash
git fetch origin claude/reborn-recovery-app-plan-u78hx1
git checkout claude/reborn-recovery-app-plan-u78hx1
ls reborn/          # index.html  README.md  HANDOFF.md
```

### 1.3 提交历史（三个提交，按顺序）

| 提交 | 内容 |
| --- | --- |
| `2f52b3017` | 产品规划文档 `docs/reborn/README.md`（759 行） |
| `f275d354b` | 应用第一版 `reborn/index.html`（2896 行，8 个页面） |
| `9a91aa9dd` | 应用完整版（4500+ 行，26 个页面）+ README 更新 |

分支相对 `main` **只改动 3 个文件**，零代码/配置/工作流文件：

```
docs/reborn/README.md
reborn/README.md
reborn/index.html
```

---

## 2. ⚠️ 会随旧对话消失的东西（必须先处理）

| 项目 | 状态 | 怎么办 |
| --- | --- | --- |
| **用户在 APP 里的实际使用数据** | 存在用户浏览器的 `localStorage`，**不在仓库里** | 用户须在旧设备打开 APP →「我 → 设置 → 数据管理 → 导出备份」，得到 `reborn-backup-YYYY-MM-DD.json`，在新设备「导入备份」还原 |
| **PR 自查定时任务** | 会话级，容器回收即消失 | 新对话如需继续监控 PR，重新订阅并挂定时任务 |
| **临时容器里的测试脚本** | 在 scratchpad 里，会消失 | 不重要，第 8 节有重建方法 |
| **Artifact 发布链接** | 云端保留，不会丢 | 见下方 2.1，更新时必须传 `url` 参数 |

### 2.1 Artifact（用户实际在用的链接）

```
https://claude.ai/code/artifact/9d03311a-ff7d-402e-b27d-abdce225b422
```

**新对话要更新这个页面时，必须把上面这个 URL 作为 `url` 参数传给 Artifact 工具**，否则会生成一个新链接，用户手机上收藏的旧链接就不会更新。

```
Artifact(file_path="reborn/index.html",
         url="https://claude.ai/code/artifact/9d03311a-ff7d-402e-b27d-abdce225b422",
         favicon="🌱", ...)
```

favicon 一直是 🌱，不要改。

---

## 3. 项目是什么

用户提供了一份《Reborn》戒色康复 APP 的完整产品规划文档（V1.0），要求：先落地文档，然后**把 APP 真正做出来、能用**，最后要求把所有页面功能补到最齐全。

**核心理念**（贯穿所有文案，请保持一致）：

> 不是让你「忍住」，而是让你「不想」。

市面同类产品只做拦截和监控，堵而不疏。Reborn 的重心在**「补」**：先把亏空的能量补回来、把多巴胺基线抬上去，冲动的相对吸引力自然下降。判断标准：**如果你每天都觉得在忍，说明补的部分没跟上。**

**四条设计原则**（写在应用的「关于」页里，改动时必须遵守）：

1. **不贩卖焦虑** —— 不用「一次等于多少天营养」这类无依据说法。科普里明确写出哪些流行说法被夸大了
2. **不制造羞耻** —— 复发无惩罚文案，累计清醒天数永不归零，伙伴不会死
3. **不假装是它不是的东西** —— 教练是脚本不是 AI、社区是本地示例不是真实在线，都在界面里标注
4. **不碰用户数据** —— 无账号、无服务器、不联网

---

## 4. 文件清单

| 路径 | 内容 |
| --- | --- |
| `docs/reborn/README.md` | 产品规划文档 V1.0，759 行。用户原始需求，11 章 |
| `reborn/index.html` | **应用本体**，约 190 KB / 4500+ 行。单文件，内联全部 CSS+JS，零依赖零构建 |
| `reborn/README.md` | 功能对照表、技术说明、未实现清单 |
| `reborn/HANDOFF.md` | 本文件 |

运行方式：

```bash
open reborn/index.html                        # 直接打开
python3 -m http.server 8000 --directory reborn # 手机访问
```

---

## 5. 应用已实现的全部内容

### 5.1 五个主 tab

| Tab | 内容 |
| --- | --- |
| **首页** | 时段问候语、天数英雄卡、里程碑进度、高危时段预警、4 个快捷入口、饮水计数器（8 杯）、今日心情（6 档）、分时段任务清单、今日科普、每日一言（15 条轮换） |
| **能量** | 冥想入口、睡眠记录、6 套功法、8 项调理、按体质膳食、四类营养 |
| **伙伴** | 6 阶段成长、饥饿/心情/能量、喂食/玩耍/训练、皮肤切换、伙伴日志（动态生成）、进化进度、阶段全览 |
| **科普** | 3 个工具入口、全文搜索、分类筛选、阅读进度、8 篇长文 |
| **我** | 档案头、4 项总览、本周打卡、14 天趋势、里程碑时间轴、商城、4 组功能入口 |

### 5.2 全部 26 个页面

| 页面 | 说明 |
| --- | --- |
| 入职测评 | 13 题，单选/多选/滑块三种题型 |
| 诊断报告 | 评级、身心维度、诱因百分比、高危时段、体质、周期预估、四步方案。**全部由答案实际计算** |
| 冲动急救 | 15 分钟倒计时 + 5 种工具 + 延迟锁 |
| 5-4-3-2-1 接地 | 五步感官练习，每步带输入框 |
| 真相核查 | 三个 CBT 问题 |
| 呼吸调节 | 4-2-6 节律圆形引导 |
| 能量转移 | 四种动作 |
| 康复教练 | 26 节点 CBT 对话树 |
| 延迟锁 | 15 分钟锁定 |
| 功法跟练 | 6 套 × 共 50 节，环形进度 + 逐节要领 |
| 冥想引导 | 5 种法门共 32 段（数息/观息/身体扫描/慈心/冲动冲浪） |
| 脱敏训练 | 5 级递进，L4 带风险警告 + Day 21 门槛 |
| 视觉管理 | 灰度模式/信息流净化/拦截方案/环境隔断，含 iOS/Android/桌面路径 |
| 情绪日记 | 6 档心情 + 每日提示 + 历史 |
| 统计详情 | 24 小时冲动柱状图、心情分布、诱因图谱（含复盘汇总）、复评趋势、练功统计 |
| 成就墙 | 24 个成就自动检测 |
| 里程碑 | 10 节点时间轴 |
| 商城 | 皮肤、随机宝箱、捐赠证书 |
| 心声墙 | 8 条示例 + 本地发布 + 标签 + 点赞 |
| 问责伙伴 | 联系人 + `tel:`/`sms:` 快捷（含预填消息） |
| 每周复评 | 同题对比，自动算改善幅度 |
| 重新开始 | 三问复盘，天数不归零 |
| 设置 | 昵称/目标/提醒/主题/字号/动画/隐藏天数/导出导入/重做测评/清除 |
| 帮助 | 12 条 FAQ 手风琴 |
| 隐私说明 | 收集什么、存哪、发给谁、怎么删 |
| 关于 | 理念、四原则、康复飞轮、来源 |

### 5.3 明确未实现（需要后端或原生权限）

| 功能 | 为什么 |
| --- | --- |
| 网站拦截、卸载保护 | 需原生 VPN/辅助权限，网页做不到。已在「视觉管理 → 拦截与阻断」给出系统自带替代方案 |
| 真实在线社区、导师问答 | 需服务端与账号体系。心声墙是本地的，**界面已标注** |
| 真 LLM 教练 | 需 API 与密钥托管。现为 26 节点脚本，**界面已标注** |
| 后台推送 | 应用内有 Notification API 每日提醒，但标签页关闭后不保证送达。真后台推送需 Service Worker + 推送服务 |
| 功法教学视频、冥想音频 | 需内容生产与 CDN。现为文字分节引导 |

---

## 6. 设计系统（改动时必须沿用）

### 6.1 配色

用户原文档指定了三色，已扩展成完整 token 系统：

| 变量 | 浅色 | 深色 | 用途 |
| --- | --- | --- | --- |
| 深空墨 | `#0B1220` | `#0B1220` | 最深底色 |
| 深空蓝 | `#0F172A` | `#0F172A` | 卡片底/英雄卡 |
| 翡翠绿 | `#0E8F68` | `#10B981` | 主强调色 |
| 琥珀金 | `#B8760A` | `#F59E0B` | 成就/奖励 |
| 朱砂红 | `#C33F2F` | `#F2705C` | 危险/复发/冲动 |
| 页面底 | `#F2F5F3` | `#0B1220` | 偏冷宣纸白，非暖米色 |

**中性色带青绿偏**（`#6B7F78`），不是纯灰。深浅两套主题各自单独调过，不是简单反色。

主题实现是 **token 级**：`:root` 定义变量 → `@media (prefers-color-scheme: dark)` 覆盖 → `:root[data-theme="dark"]` / `[data-theme="light"]` 再覆盖（手动切换必须能压过系统偏好）。组件只用变量，绝不在 media query 里直接写组件样式。

### 6.2 字体

CSP 禁止外部字体，中文字体又无法内联（太大），所以全部用系统字体，但做了考究搭配：

```css
--font-display: "Songti SC","Noto Serif CJK SC",...,serif;   /* 宋体标题 */
--font-body:    "PingFang SC","Microsoft YaHei",...,sans-serif; /* 黑体正文 */
--font-mono:    ui-monospace,"SF Mono",Menlo,monospace;      /* 数据，配 tabular-nums */
```

**宋体标题 + 黑体正文**是中文排版的正统做法，这是刻意选择，不要换成 Inter/Space Grotesk 那类 AI 味默认字体。

### 6.3 布局

真正的 APP shell：固定底部 5 tab、常驻急救悬浮按钮、全屏 sheet 承载所有子页面。桌面端居中在 440px 宽的容器里。

---

## 7. 技术架构

### 7.1 数据模型（localStorage 键 `reborn.state.v1`）

```js
{
  v:1, onboarded, nick,
  profile:{...测评答案, constitution},   // constitution: yang|yin|qi|tan
  report:{stars, gradeName, cycleLo, cycleHi, constitution,
          triggers:[{k,kind,pct}], window, goalDays,
          bodyAvg, mindAvg, body:{}, mind:{}, motives, tried},
  startDate, bestStreak, totalClean,      // totalClean 累计清醒，永不归零
  coins, coinsEver,
  relapses:[{d, days, why:{scene,emotion,weak}}],
  tasks:{ "YYYY-MM-DD": {taskId:true, __perfect:true} },
  practice:[{d,id,min}], urges:[{ts,resolved}], read:[articleId],
  diary:[{d,mood,text}], water:{date:n}, sleep:{date:hours}, medMin,
  desens:[{d,lv}], achieved:[id], posts:[], likes:[], contacts:[],
  pet:{name,hunger,mood,energy,lastTick},
  badges:["m1","m7",...], skins:[], activeSkin, eggs:[], ratings:[],
  theme, lockUntil,
  settings:{remind,remindTime,motion,fontScale,hideNumbers}
}
```

### 7.2 关键函数

| 函数 | 作用 |
| --- | --- |
| `migrate()` | **给老数据补齐新字段**。加任何新状态字段都必须在这里加默认值，否则老用户会崩 |
| `cleanDays()` | `daysBetween(startDate, today) + 1`，起始日算第 1 天 |
| `planToday()` | 按体质 + 时段动态生成任务清单 |
| `dailyTick()` | 跨天结算：宠物状态衰减、里程碑补发、彩蛋 |
| `checkAchievements()` | 遍历 `ACHIEVEMENTS[].chk(S)` 自动解锁 |
| `openSheet/popSheet/closeSheet` | 全屏面板栈，支持多层返回 |
| `computeProfile(a)` | 从测评答案算出报告的全部数值 |

### 7.3 ⚠️ 代码组织的坑（已踩过）

**`index.html` 里 `<script>` 的执行顺序有严格要求**：

```
1. 存储/工具函数
2. 内容数据（PRACTICES / ARTICLES / ACHIEVEMENTS / MEDITATIONS ...）
3. migrate() —— 在这里被调用执行
4. 各页面渲染函数
5. 【文件最末尾】顶栏菜单绑定 + 启动块（applyTheme/applyPrefs/scheduleReminder/switchView）
```

**追加新代码时，必须插在启动块之前**，不能直接 append 到文件末尾——否则启动块会先执行，引用到还在 TDZ 里的 `const`，整个页面白屏。这个 bug 已经踩过一次并修复。

正确做法：

```bash
python3 - <<'PY'
s = open('reborn/index.html', encoding='utf-8').read()
start = s.index('/* 顶栏菜单 */')      # 启动块起点
block = s[start:s.index('</script>')]  # 取出启动块
s = s[:start] + "新代码...\n\n" + block + "</script>\n"
open('reborn/index.html','w',encoding='utf-8').write(s)
PY
```

### 7.4 中文字符串的坑

JS 字符串用双引号包裹时，**中文引号必须用「」而不是直引号**，否则语法错误。已修过一批。

---

## 8. 怎么测试（重要，改完必须跑）

环境预装 Chromium（`/opt/pw-browsers/chromium`），Playwright 需 `npm i playwright`。

### 8.1 语法检查

```bash
python3 -c "
import re
s=open('reborn/index.html',encoding='utf-8').read()
m=re.search(r'<script>\n(.*)\n</script>', s, re.S)
open('/tmp/app.js','w',encoding='utf-8').write(m.group(1))
" && node --check /tmp/app.js && echo "SYNTAX OK"
```

### 8.2 浏览器实测骨架

```js
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await b.newContext({viewport:{width:430,height:900}})).newPage();
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: '+e.message));
page.on('console', m => { if(m.type()==='error') errs.push('CONSOLE: '+m.text()); });
await page.goto('file:///home/user/StellarYield/reborn/index.html');
// 用 page.evaluate 往 localStorage 塞一个成熟状态，跳过 13 题测评
// 然后逐页点击验证
console.log('ERRORS:', errs.length ? errs : 'none');
```

**验收标准：`ERRORS: none`。** 每次改动后都要跑。

---

## 9. CI 状态：三个检查失败，全是历史问题

PR #4 上三个检查一直红，**在每一个提交上都红，与提交内容无关**。已在 PR 评论 `5129918369` 和 `5130754270` 里详细记录，并已声明不再对重复出现的这三个刷评论。

| 检查 | 根因 | 证据 |
| --- | --- | --- |
| Soroban Contract Checks | `ethnum 1.5.2` 的 `mem::transmute(())` 与 rustc 1.97.1 不兼容（`E0512`）。新版 rustc 把 `TryFromIntError` 从零大小改成 8 位。经 `soroban-env-host 22.1.3` 传递引入 | 编译死在依赖阶段，根本没走到项目代码 |
| Backend Checks | `server/src/services/strategyRotationService.ts` 里 `RotationCandidate` 重复声明（第 1 行 `type` + 第 80 行 `interface`），34 个测试套件编译不过；另有 19 个断言失败 | `git show origin/main:server/src/services/strategyRotationService.ts \| grep -n RotationCandidate` 在 main 上就能复现 |
| Frontend Checks | jsdom 缺 `window.matchMedia` 桩；`ApyForecastBands.test.tsx` 断言的文案组件不渲染；钱包弹窗测试用了过期 aria-label。构建步骤本身是通过的 | 同样在 main 上存在 |

**修复建议（如果用户要求，应开独立 PR，不要混进 #4）**：

- 合约：`contracts/` 下加 `rust-toolchain.toml` 钉版本（快），或升级 `soroban-env-host`（治本）
- 后端：删掉 `RotationCandidate` 的重复声明，合并成一个类型
- 前端：在 vitest setup 里加 `window.matchMedia` 桩函数

---

## 10. 已知问题与历史修复

已修复（不要退回）：

| 问题 | 修复 |
| --- | --- |
| 启动时金币显示 0 | `switchView()` 里补上 `#coinChip` 初始化 |
| 隔久再打开只补发一个里程碑奖励 | 改为补发全部待发放的，只为最高的那个庆祝 |
| 页面白屏 | 启动块必须放在文件最末尾（见 7.3） |
| JS 语法错误 | 中文字符串内的引号改成「」 |
| CSS 无效 token | `--jade-dim` 写成了 `#0E9M` |

当前无已知未修复 bug。

---

## 11. 下一步可选方向

用户没有指定，以下按我的推荐排序：

1. **功法教学配图/动画** —— 现在只有文字要领，八段锦八式配上分解图会好很多（可用内联 SVG，不违反零依赖）
2. **PWA 完整支持** —— 加 manifest + Service Worker，可真正安装到主屏并离线运行、支持后台推送。但会打破「单文件」特性，需要用户确认
3. **修 StellarYield 的三个 CI 问题** —— 独立 PR，与本项目无关
4. **内容扩充** —— 科普再加几篇（目前 8 篇）、功法再加几套
5. **数据可视化增强** —— 比如冲动强度随时间的曲线、习惯养成热力图
6. **真 LLM 教练** —— 需要用户提供 API 方案与密钥托管方式

---

## 12. 用户沟通要点

- 用户使用**中文**，回复必须用中文
- 用户很在意「能不能真的用」，不要只给方案不给成品
- 用户要求「最齐全、最清楚」，倾向于要完整而非精简
- 涉及做不到的事（拦截、真 AI、在线社区），**必须直说**，不要含糊或假装做到了
- 不要把 model ID 写进提交信息、PR 或代码注释

---

## 13. 免责声明（产品层面，必须保留）

应用内多处已标注，改动时不要删除：

- Reborn 是自助工具，**不构成医疗诊断或治疗建议**
- 中医体质辨识与功法内容属**传统经验范畴**，非医疗建议
- 教练是 CBT 脚本，**不是 AI**，无法处理危机情况
- 心声墙**不是真实在线社区**
- 严重情绪困扰或自伤念头应立即寻求专业帮助
