# Reborn 项目交接文档

> 这份文档的用途：让**任何一个新对话**（新的 Claude Code 会话、或另一个人）能在不看历史聊天记录的情况下，
> 完整接手这个项目并继续开发。所有关键事实、决策、坑和下一步都写在这里。
>
> 最后更新：2026-07-31 · 对应版本 0.2.0

---

## 一、一句话说明

在 `huazhuang80-star/StellarYield` 仓库里，按一份中文 PRD 设计稿，做了一个**成瘾康复与能量提升 App「Reborn · 重生」**
的完整可运行 Web 原型（PWA），以及该 PRD 的结构化归档。原型与 StellarYield（Stellar DeFi 项目）本身**没有任何代码耦合**，
是一个独立目录。

---

## 二、东西都在哪儿（唯一权威来源）

| 内容 | 位置 |
| --- | --- |
| 可运行原型（全部源码） | `apps/reborn/` |
| PRD 归档（设计稿原文整理） | `docs/reborn/prd.md` |
| 本交接文档 | `docs/reborn/HANDOFF.md` |
| 原型使用与模块索引 | `apps/reborn/README.md` |
| 更新日志（版本历史） | `apps/reborn/src/data/about.ts` 中的 `CHANGELOG`，App 内「关于」页可见 |

**分支**：`claude/addiction-recovery-app-design-yibghz`
**Pull Request**：https://github.com/huazhuang80-star/StellarYield/pull/2 （draft，base 为 `main`）
**在线预览（Artifact）**：https://claude.ai/code/artifact/05ed9b36-e25d-4407-ab15-2a3b7ac5228d
（单文件构建版，默认私有；更新方式见第七节）

一切以**仓库里的代码为准**。聊天记录不是权威来源，代码和这份文档才是。

---

## 三、怎么跑起来

```bash
git fetch origin claude/addiction-recovery-app-design-yibghz
git checkout claude/addiction-recovery-app-design-yibghz
cd apps/reborn
npm install
npm run dev      # http://localhost:5180
npm test         # 126 个单元测试，应全绿
npx tsc -b       # 类型检查，应无输出
npm run build    # 产物在 apps/reborn/dist/
```

技术栈：Vite 6 + React 19 + TypeScript（strict + noUnusedLocals）+ Vitest 3。**无后端、无账号、无网络请求**，
状态全部存在浏览器 `localStorage`（key `reborn:state:v1`，存档结构版本 `version: 2`）。

---

## 四、功能清单（已完成）

### 主流程
- **测评与诊断**：19 题五维问卷 → 成瘾程度、精力/睡眠、焦虑/回避/自尊、诱因占比（归一化恒为 100%）、中医体质、康复周期区间、推荐方案
- **首页**：天数英雄区、动物伙伴、里程碑领取、冲动风险时段预警、当前时段任务、打卡结算、今日科普
- **冲动急救（Panic）**：15 秒冷静期 → 急救菜单 → 5-4-3-2-1 接地 / 真相核查 / 能量转移 / AI 教练 / 联系伙伴；「我还是想做」→ 15 分钟延迟锁 → 复发复盘问卷（不打分、不扣币）
- **危害认知**：15 篇四维科普（身体/心理/关系/大脑）+「与你相关」个性化排序、5 级脱敏训练、视觉管理工具
- **能量提升**：每日任务（按体质+等级+时段生成）、6 套功法库（按体质排序、里程碑解锁）、体质调理、膳食与补水
- **激励系统**：打卡与连续加成（N×5 上限 50）、完美日（+50 币 + 宝箱）、8 级里程碑、动物 6 阶段成长、金币商城、宝箱、6 类彩蛋
- **AI 教练**：规则引擎 CBT 话术 + 晨间诊断 / 晚间复盘 / 周报 / 危机关怀
- **数据仪表盘**：五维统计、14 天完成率、情绪趋势、成瘾模式图谱（测评预测 vs 实际复发归因）、勋章墙
- **社区**：匿名广场、分组、导师问答、互助匹配（示意数据）

### 0.2.0 补齐的产品化模块
通知中心（未读徽标）、个人资料（含 Canvas 成就海报可下载）、完整设置（主题/提醒/信仰模式/起始日修正/数据导出导入/清空）、
关于（版本·更新日志·内容来源·致谢）、帮助中心（快速上手·17 条 FAQ·术语表·反馈）、安全与条款（紧急求助热线·免责·隐私·协议）、
会员方案（5 档 + 13 项权益对比）、学习中心（5 门课 20 节）、功法播放器（分节计时）、呼吸与冥想（4+4）、
日记与历史（时间线/周报/事件流）、问责伙伴（邀请码与共享范围）、全局搜索（60+ 条索引）、
系统能力（Toast、空状态、焦点可见、reduce-motion、深/浅/跟随系统三主题、PWA 离线安装、存档 v1→v2 迁移）

---

## 五、关键设计决策（**改代码前必读**，这些不是随手写的）

1. **复发不惩罚**。relapse 只重置计数器，保留历史最长记录，不扣金币、不掉等级。依据是「自我批评越强→复发率越高」的研究共识，
   也对应 PRD 风险表里「用户 relapse 后流失」的应对策略。**不要加羞耻感设计**（连败榜、扣分、红色警告等）。
2. **任务只加分不扣分**。完美日是奖励不是及格线。空任务列表不算完美日（防刷，有测试守着）。
3. **奖励幂等**。里程碑用 `claimedMilestones` 去重，一次性奖励用 `awards: string[]` + key（如 `poster:2026-07-31`）去重。
4. **日期一律用本地时区**，统一走 `lib/date.ts` 的 `todayKey()`。**不要用 `toISOString().slice(0,10)`**——那是 UTC，会导致跨时区错日。
   （这个坑在开发中踩过两次，均已修正。）
5. **通知由状态推导，不落库**（`lib/notifications.ts`），所以不会出现「已经做完的事还在催」的过期通知。
6. **存档迁移必须保数据**。`migrate()` 逐层补默认值，绝不因为版本号不同就 `initialState()` 清空。有测试覆盖 v1→v2。
7. **医学与中医表述有边界**。中医内容一律标注「传统经验，非医疗建议」；科普标注研究领域；动物模型结论（如 ΔFosB）注明来源限制。
   紧急求助页只收录长期稳定的官方渠道，并提示以当地最新公告为准。
8. **隐私即卖点**。当前版本零网络请求。若将来接后端，必须先更新 `data/legal.ts` 的隐私说明与 App 内文案，不能默默上传。
9. **纯逻辑必须可测**。随机数（开箱、邀请码）由调用方注入，Canvas 绘制与数据分离（`posterData` / `drawPoster`）。
10. **二级页不显示底部导航**，用 `PageHeader` 的返回栏；`App.tsx` 的 `CHROME_TABS` 控制这个行为。

---

## 六、代码结构导航

```
apps/reborn/src/
  types.ts          领域模型（AppState 是唯一状态源）
  state/store.tsx   reducer + localStorage + migrate()（所有状态变更都在这里）
  lib/              纯函数层，全部有测试
    date/assessment/progress/rewards/tasks/risk/coach/eggs
    notifications/backup/search/poster/buddy      ← 0.2.0 新增
  data/             内容与代码分离（题库、科普、功法、营养、里程碑、商城、脱敏、
                    课程、呼吸、帮助、法律、会员、关于）
  screens/          23 个页面
  components/
    ui.tsx          Card / Bar / Meter / Sheet / Collapse / Stat / useCountdown
    shell.tsx       Toast / PageHeader / EmptyState / Toggle / Segmented / useTheme
  App.tsx           路由（useState 的 Tab 联合类型）+ 顶栏 + 底部导航 + 彩蛋
```

改动约定：**内容改 `data/`，规则改 `lib/`，界面改 `screens/`**。往 `screens/` 里塞业务规则会让它失去测试覆盖。

---

## 七、验证与发布

```bash
cd apps/reborn && npx tsc -b && npm test && npm run build   # 三样都要过
```

**浏览器走查**（改动 UI 后建议做）：用 Playwright 驱动 430×932 视口跑完整流程。Chromium 已预装在
`/opt/pw-browsers/chromium`，脚本示例见 PR #2 的历史提交说明。走查曾抓到两个真实缺陷（详见第八节）。

**更新在线预览（Artifact）**：`npm run build` 后把 `dist/assets/*.css` 与 `*.js` 内联进一个 HTML 片段
（不含 `<!doctype>/<html>/<head>/<body>`，只要 `<title>` + `<style>` + `<div id="root">` + `<script type="module">`），
再用 Artifact 工具带上原 URL 发布，即可保持同一链接。

---

## 八、开发中发现并修复的真实缺陷（别改回去）

1. `Panic.tsx`：结果页被阶段分支挡住，练习完成后无法返回 → `done` 判断提前到所有 phase 分支之前。
2. `Coach.tsx`：危机关怀对新用户误触发 → 改为按 `daysSinceLastCheckin()` 判断，从未打卡返回 `null` 而不是 0。
3. 搜索热词「失眠」无对应内容（测试 `热门词都能搜到结果` 抓到）→ 补了两条 FAQ，而不是删词。
4. `Companion.tsx`：未达成阶段被加了删除线（语义相反）→ 改为仅降低文字对比度。

---

## 九、当前状态与已知限制

- ✅ 126 个单元测试全绿；`tsc -b` 无错误；`npm audit` 0 漏洞；构建产物 CSS 14 kB / JS 363 kB（gzip 121 kB）
- ⚠️ **仓库既有 CI 是红的，与本项目无关**：`Frontend Checks`（`client/` 66 个测试失败，源于 `e8017df82` 改了钱包弹窗结构但测试没跟）、
  `Backend Checks`（`server/`）、`Soroban Contract Checks`（第三方 `ethnum` 在当前 stable rustc 下编译失败，E0512）。
  已在 PR #2 用 `git diff --stat origin/main -- client server contracts backend`（输出为空）取证说明。
  修它们需要单独的 PR，不该混进这个 diff。
- 原型取舍：功法/冥想视频用文本要点替代；AI 教练是本地规则引擎（接口 `coachReply(input, ctx)` 与 LLM 版一致）；
  社区是示意数据；拦截器集成、灰度模式、系统推送需原生能力，只留了入口；会员不接支付；无 i18n（全中文，PRD 目标市场是美国，
  英文版是明确的待办而非遗漏）。

---

## 十、下一步可做的事（按价值排序）

1. **英文版 i18n**：PRD 目标是美国市场（Reddit r/NoFap、Product Hunt）。需要抽 `data/` 的文案层，工作量集中在 15 篇科普与 17 条 FAQ。
2. **接后端**：PRD 8.1 选型是 Supabase（Auth + PostgreSQL + Storage）。接入前先改隐私文案，再做云同步与多设备。
3. **AI 教练接 LLM**：替换 `lib/coach.ts` 的 `coachReply` 实现即可，界面无需改动。
4. **真实社区**：发帖、审核、举报、匿名化；`screens/Community.tsx` 现在是静态示意。
5. **原生能力**：内容拦截器集成、系统推送（OneSignal）、灰度模式快捷指令。
6. **内容审阅**：正式版需要执业医师与心理咨询师过一遍医学与中医表述。
7. **修既有 CI**：`client/` 的 66 个失败测试与 `contracts/` 的 `ethnum` 编译，建议各开一个独立 PR。

---

## 十一、在新对话里怎么开场

把下面这段话发给新对话即可（它会自己读仓库和这份文档）：

> 继续 Reborn 项目。仓库 `huazhuang80-star/StellarYield`，分支 `claude/addiction-recovery-app-design-yibghz`。
> 先读 `docs/reborn/HANDOFF.md`（交接文档）、`docs/reborn/prd.md`（设计稿）和 `apps/reborn/README.md`，
> 然后跑 `cd apps/reborn && npm install && npm test` 确认环境正常。
> 相关 PR 是 #2（draft）。读完告诉我当前状态，然后我们继续做：<在这里写你要做的事>

如果新对话不在这个仓库里，先让它执行 `add_repo`（owner `huazhuang80-star`，repo `StellarYield`）再 clone。
