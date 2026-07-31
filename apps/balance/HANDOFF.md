# BALANCE 项目交接文档

> **给下一个对话的 Claude**：这份文档是本项目的完整上下文。
> 请先完整读完再动手。所有代码都在 git 里，没有任何东西只存在于上一个对话中。

**交接时间**：2026-07-31
**仓库**：`huazhuang80-star/StellarYield`
**分支**：`claude/balance-nutrition-app-plan-znhcup`
**PR**：#3（草稿状态，未合并）

---

## 一、这是什么项目

用户（`zhouhua188199@gmail.com`，中文交流，**必须全程用中文回复**）要做一个叫 **BALANCE** 的双向体重管理 APP —— 同时服务「想减肥的人」和「想增重的人」，核心是「中医体质辨识 + 认知重构 + AI 拍照饮食管理」。

**注意一个反常识的情况**：这个 `StellarYield` 仓库本身是一个 **Stellar 区块链 DeFi 协议**项目，和营养 APP 毫无关系。之所以把 APP 放在这里，是因为任务指定的分支在这个仓库。已在 PR 描述里向用户说明过。APP 代码全部隔离在 `apps/` 目录下，不影响主工程。

---

## 二、已经完成的东西（都已提交并推送）

### 1. 产品方案文档
`docs/balance-nutrition-app-product-plan.md`（486 行）

用户原始方案的结构化整理，八章。**关键**：我没有原样照抄，而是把方案里站不住的地方**内联标注**出来，并新增了第八章「进入 Phase 1 前需要收口的问题」，按影响程度排序：

1. 市场数据无一手来源，APP 市场规模区间跨度 2.4 倍（口径不一致）；5 亿增重者/2 亿双向切换者缺推算依据
2. 中医内容合规路径未定（需持证中医师审核、不得有诊断/疗效表述）
3. 进食障碍安全网未定（筛查阈值、降级流程）
4. AI 识别精度无实测基线
5. ¥498 终身档 ≈ 3 年年付，对抗按次推理成本，单位经济性存疑
6. 34 周路线图的阶段是并行不是串行（Phase 5、6 都早于 Phase 4 起点），第 23–26 周是空档；预算漏了专家审核、数据标注、推理、商店分成

### 2. 可运行原型 v0.2
`apps/balance/index.html`（1219 行，单文件、零依赖、无后端）
`apps/balance/README.md`

**这个版本是完好可用的**，浏览器直接打开就能跑。数据存 localStorage。

已实现：
- **双向调节**：减脂/增重共用底层，随时切换，目标热量/营养素配比/食谱/成长形态/替代方案全跟着换
- **体质测评**：30 题简版量表，按国标转化分算法 `(原始分-条目数)/(条目数×4)×100`，判定用「偏颇≥40 判是、30–39 判倾向、平和≥60 且偏颇全<30」
- **体质报告**：九维雷达图（手写 SVG）+ 转化分条形 + 画像 + 分方向方案 + 宜忌清单
- **饮食记录**：110 种中餐食物，按体质自动标 宜/少/忌 并给理由
- **热量模型**：Mifflin-St Jeor → BMR → TDEE → 目标（减脂 −20%、增重 +15%）
- **冲动急救**：三步流程 + 15 分钟圆环倒计时 + 情绪→替代活动 + 冲动记录
- **其他**：成长六阶段、8 枚徽章、24 节气、体重趋势 SVG、三套皮肤、深浅色
- **进食障碍安全网**：SCOFF 筛查命中 ≥2 项 → 关闭热量计数与体重打卡，切「结构模式」，展示求助资源
- **安全区间**：减脂热量下限 `max(BMR×1.1, 女1200/男1500)`；目标 BMI<18.5 警告；增重时 BMI≥24 提示转向力量训练

**已验证**：headless Chromium 跑通 24 条端到端流程，无 console 报错。测试脚本见 `apps/balance/wip-v0.3/browser-test.js`，截图脚本 `screenshot.js`。

### 3. 在线可用版本
已发布为 Artifact：**https://claude.ai/code/artifact/23c08af7-9638-4a03-8d35-69d9064206cf**

对应的是 v0.2。发布方式：把 `index.html` 里 `<!--APP-START-->` 和 `<!--APP-END-->` 之间的片段抽出来（去掉 doctype/html/head/body 外壳），再用 Artifact 工具发布。抽取命令见本文第五节。

> 更新这个 Artifact 时**必须**把上面这个 URL 作为 `url` 参数传给 Artifact 工具，否则会生成一个新链接，用户手机上存的旧链接就不会更新。

---

## 三、正在做但没做完的事 ⚠️ 最重要

用户最后一条需求原话：

> 「我把这个软件里面的内容功能全部什么 UI 啊、页面啊、按钮啊、关于啊等等等等，全部我没有提到的也要完善到最齐全。做到最齐全，完善到最清楚。」

也就是**要把 APP 补全到最完整**：所有页面、按钮、关于页等，包括用户没点名的也要补。

我正在做 **v0.3 重构**，做到一半（因输出长度限制中断）。**未完成的部分已全部落盘**在：

```
apps/balance/wip-v0.3/
├── part1-shell-and-css.html      ✅ 完成 —— HTML 外壳 + 全部 CSS（含新组件：导航行/手风琴/日历热力图/任务清单/步骤列表/Toast）
├── part2-data-types-cognition.js ✅ 完成 —— 九种体质（大幅扩写：成因/健康风险/起居/药食同源）、30 题测评、12 条认知漏洞、冲动急救数据
├── part3-data-foods-recipes.js   ✅ 完成 —— 食物库(115+)、体质规则、12 道食谱、八段锦八式、运动库(18 项 MET)、24 节气(加详解)、术语表(20 条)、FAQ(15 条)、更新日志、挑战(2 个)、成长形态、徽章(12 枚)
├── browser-test.js               ✅ v0.2 的测试脚本，可复用扩展
└── screenshot.js                 ✅ 截图脚本
```

**还需要写的部分（part4 / part5 / part6）**：

| 部分 | 内容 | 状态 |
|---|---|---|
| part4 | 状态管理 + 持久化 + 数据迁移(v0.2→v0.3) + 计算函数 + **路由与返回栈** | ❌ 未写 |
| part5 | 五个主 tab 视图：今日 / 记录 / 体质 / 发现 / 我的 | ❌ 未写 |
| part6 | 约 22 个二级页面 + 事件处理 + 启动 | ❌ 未写 |

### v0.3 的设计（必须照这个做，part1–3 的数据结构是按它设计的）

**底部 5 个 tab**：`今日 / 记录 / 体质 / 发现 / 我的`

**路由**：新增返回栈。`S.tab` 是当前 tab，`S.stack` 是 `[{p:页面名, a:参数}]` 数组。栈非空时 topbar 左侧显示返回按钮。需要 `push(p,a)` 和 `back()` 两个函数。

**二级页面清单**（约 22 个）：
- 关于 `about`、隐私政策 `privacy`、使用条款 `terms`、常见问题 `faq`、术语表 `glossary`、更新日志 `changelog`、意见反馈 `feedback`、致谢 `credits`
- 统计 `stats`（日历热力图 / 达标率 / 健康天数占比 / 情绪触发分布 / 常吃食物 Top10）、历史 `history`
- 食谱库 `recipes` + 食谱详情 `recipe`、节气总览 `terms24` + 节气详情 `term`
- 认知训练 `cognition` + 单条详情 `cognitionItem`
- 挑战 `challenge`、九种体质详解 `typeList` + `typeDetail`、一周食谱 `weekmenu`、八段锦 `gongfa`
- 徽章详情 `badges`、设置 `settings`、数据管理 `dataMgmt`、自定义食物 `customFood`

**新增记录类型**（part3 的徽章函数已引用这些，必须实现）：
- 饮水 `water`（目标 = 体重 kg × 30 ml）
- 运动 `workout`（用 MET 算消耗：`MET × 体重kg × 小时`）
- 情绪日记 `mood`（记录进食前情绪，统计页做本地模式分析）
- 餐食**可编辑**（当前 v0.2 只能删）
- 自定义食物、常吃收藏

**新增机制**：
- 每日任务清单（记录三餐/喝够水/运动/称重/写情绪日记）
- 宠物健康度与心情值 = 近 3 天任务完成率（topbar 头像下方有 `.hp` 血条样式已写好）

**part3 里已经被引用、但还没实现的函数**（写 part4 时必须补上）：
`totalMeals` `streak` `loggedDays` `followDays` `allImpulses` `waterDays` `allWorkouts` `allMoods` `reachedGoal`

⚠️ **数据迁移**：v0.2 用户的 localStorage key 是 `balance.v1`，state 里没有 `water/workouts/moods/challenges/customFoods/favs/stack` 等字段。v0.3 必须做迁移，**不能让老用户数据丢失**。建议保持 key 不变，用 `Object.assign(structuredClone(BLANK), 读到的旧数据)` 补齐缺失字段（v0.2 已是这个写法，沿用即可），并把 `v` 升到 2。

---

## 四、CI 状态 —— 三个红叉全部与本项目无关，别去修

PR #3 上有三个检查一直是红的。**我已经在 `main` 分支上本地复现验证过，全部是仓库本来就坏的**，与营养 APP 的提交无关（APP 只动 `apps/`，而 CI 三个任务分别只在 `contracts/`、`server/`、`client/` 工作，且没有任何 workflow 引用 `apps/`）：

| 任务 | 根因 |
|---|---|
| Soroban Contract Checks | `ethnum 1.5.2` 在新版 rustc 下 `E0512`（`mem::transmute(())` → `TryFromIntError` 尺寸变了）。报错位置在 `~/.cargo/registry/` 第三方包里。根因是 `ci.yml` 第 141、198 行用了 `dtolnay/rust-toolchain@stable` 未锁版本，rustc 一升级就炸。**这会让该仓库所有 PR 永远红** |
| Backend Checks | `server/src/routes/analyticsUtils.ts` 第 139 行少一个花括号（文件共 138 行），`TS1005`。CI 里那一堆 `TS2339 RotationCandidate` 报错是这个解析失败的**级联结果**，不是真的缺属性 —— `strategyRotationService.ts:86,93` 确实声明了 `volatility` 和 `confidenceFactors`。别去改接口，那是治标 |
| Frontend Checks | `client/` 下 12 个文件 66 个测试失败，含 `WalletConnectionModal.test.tsx`（疑似钱包弹窗改版 `e8017df82` 后测试没跟着改） |

CodeQL 和 Analyze TypeScript/JavaScript **是绿的** —— 新增的 1200 行内联 JS 没有引入安全问题。

我已在 PR 评论里完整说明过一次，**不要重复评论**。我向用户提过可以单独开 PR 修 `ethnum`（改动最小、能一次性解开所有 PR 的合约 CI），**用户还没答复，未经用户同意不要动**。

---

## 五、常用命令

```bash
# 从单文件抽出 Artifact 片段（去掉 doctype/html/head/body 外壳）
node -e '
const fs=require("fs");
const src=fs.readFileSync("apps/balance/index.html","utf8");
const a=src.indexOf("<!--APP-START-->"), b=src.indexOf("<!--APP-END-->");
fs.writeFileSync("/tmp/balance-app.html", src.slice(a+16,b).trim());
'

# 浏览器测试（容器内已装 playwright-core，Chromium 在 /opt/pw-browsers）
cd <scratchpad> && npm i playwright-core
node browser-test.js     # 路径改成 apps/balance/index.html

# Chromium 可执行文件路径
/opt/pw-browsers/chromium-1194/chrome-linux/chrome
```

---

## 六、和用户协作时要注意的

1. **全程中文回复** —— 用户明确要求过。
2. 用户希望**直接动手，少问问题**。之前问过两次「代码放哪个仓库」都没得到答复，用户回了一句「把 APP 给我设计出来啊，要设计出来能用啊！」—— 所以判断题自己拿主意，做完再说明。
3. 用户很在意**「能用」**，不是看设计稿。每次交付都应该给可以直接在手机上打开的链接。
4. 定时巡检 PR 的调度工具（`send_later`）需要用户授权，之前没批下来，所以只能靠 webhook 被动响应 CI 事件。

---

## 七、设计规范（v0.3 要沿用）

- **配色**：青瓷 + 墨。主色 `#1F6C74`，语义色独立于主色：宜 `#2F6D4F` / 少 `#8A6A2B` / 忌 `#A8382C`。刻意避开了「米白+衬线+陶土红」那套烂大街的 AI 味配色。
- **字体**：CSP 封了字体 CDN，中文字体也不可能内联成 data URI，所以用**真实存在的系统字体**配对 —— 标题宋体（`Songti SC` / `Noto Serif CJK SC`），正文黑体（`PingFang SC` / `Noto Sans CJK SC`），数字等宽 + `tabular-nums`。**不要试图引入网络字体，会静默回退**。
- **三套皮肤**：平衡 / 蝶变 / 养生（养生放大字号），通过 token 重定义实现，深浅色都要适配（`prefers-color-scheme` + `data-theme` 双向覆盖）。
- 移动优先，最大宽度 480px，桌面居中加边框。
