# PetBloom 交接文档

> 这份文档的用途：**换一个新对话继续做这个项目时，把它给新的 Claude 看，就能无缝接上。**
> 本项目的全部代码、数据与决策都已提交到 Git，没有任何东西只存在于对话记录里。

---

## 一、一句话现状

PetBloom（宠物花园）是一个**全物种宠物养护 PWA**，已完成 v1.1.0，代码全部在
`petbloom/` 目录下，已推送到 GitHub 分支 `claude/petbloom-pet-care-app-g6vavy`，
PR #6（草稿状态）。纯静态、零运行时依赖、完全离线、数据只存本机。

## 二、在新对话里怎么开场

把下面这段话直接发给新对话即可：

```
仓库 huazhuang80-star/StellarYield，分支 claude/petbloom-pet-care-app-g6vavy。
先读 petbloom/HANDOFF.md 和 petbloom/README.md，那里有这个项目的完整交接说明。
读完告诉我当前状态，然后我们继续做 PetBloom。
```

如果新对话没有这个仓库，让它先执行：
`git clone <仓库地址> && cd StellarYield && git checkout claude/petbloom-pet-care-app-g6vavy`

## 三、关键坐标

| 项目 | 值 |
| --- | --- |
| 仓库 | `huazhuang80-star/StellarYield` |
| 分支 | `claude/petbloom-pet-care-app-g6vavy` |
| PR | #6（草稿）https://github.com/huazhuang80-star/StellarYield/pull/6 |
| 代码目录 | `petbloom/`（不影响仓库里原有的 StellarYield DeFi 代码，两者完全独立） |
| 在线可用版本 | https://claude.ai/code/artifact/2f862919-9892-469c-9b64-f616ccf506d3 |
| 单文件版本 | `npm run build` 生成 `petbloom/dist/petbloom.html`，双击即用 |

## 四、三条命令

```bash
cd petbloom
npm test      # 71 个单测，全部针对纯函数层，应全绿
npm run dev   # http://localhost:4173 开发模式（多文件 + Service Worker）
npm run build # 打包成单文件 dist/petbloom.html（需要 npm i 装 esbuild）
```

## 五、代码地图

```
petbloom/
├── index.html                 外壳（skip-link + 顶栏 + 主体 + 底部导航）
├── manifest.webmanifest       PWA 清单
├── service-worker.js          离线缓存（仅开发/多文件模式使用）
├── styles/app.css             设计系统：token + 6 套物种主题 + 浅深色 + 全部组件
├── scripts/
│   ├── serve.js               零依赖本地服务器
│   └── build-single-file.js   esbuild 打包成单文件
├── src/
│   ├── app.js                 hash 路由（含 ?参数）+ 顶栏 + 主题/字号 + 底部导航
│   ├── ui.js                  模板拼接与转义 + toast + 对话框 + 入口行 + 时间轴 + 图表
│   ├── data/                  ← 内容层，改这里不需要碰逻辑
│   │   ├── species.js         10 个物种：阶段、投喂模型、护理表、环境、品种标准与风险
│   │   ├── foods.js           60+ 食物，按物种区分结论（staple/safe/limit/avoid/toxic/unknown）
│   │   ├── behavior.js        行为图鉴（叫声/肢体语言）+ 问题行为方案
│   │   ├── care.js            免疫计划、体检清单、季节日历、就医避坑、费用参考、老年关怀
│   │   ├── triage.js          自查题目 + 危险信号 + 判级规则（带 species/exceptSpecies）
│   │   ├── myths.js           六大认知漏洞
│   │   ├── knowledge.js       知识库：8 分类 26 篇
│   │   ├── firstaid.js        12 类急救卡 + 急救包清单 + 生命体征参考值
│   │   ├── guide.js           养护向导：6 棵决策树
│   │   └── meta.js            关于、FAQ、更新日志、内容来源、名词表、致谢
│   ├── lib/                   ← 逻辑层，全部纯函数，有单测
│   │   ├── nutrition.js       RER/MER、四套投喂模型、体况、标签评级、换粮表
│   │   ├── triage.js          判级引擎 + 就医摘要生成
│   │   ├── alerts.js          每日任务、疫苗状态、季节、健康预警、体重趋势
│   │   ├── growth.js          花园阶段、健康度、连续天数、徽章、彩蛋
│   │   ├── projection.js      「如果继续这样养」双未来预测
│   │   ├── reminders.js       统一提醒推算
│   │   ├── search.js          全局搜索
│   │   ├── finance.js         花费统计
│   │   └── store.js           localStorage 状态 + 通用集合 CRUD + 导入导出
│   └── views/                 ← 只做渲染与事件绑定
│       onboarding home records nutrition behavior triage more
│       knowledge firstaid reminders timeline health search guide settings about help
└── tests/                     node --test：nutrition / triage / care / store
```

**分层约定**：`data/` 是可独立更新的内容（兽医共识变了就改这里），`lib/` 是纯函数
（有测试兜底），`views/` 只负责渲染。加一个新页面 = 写一个 view + 在 `app.js` 的
`VIEWS` 里注册 + 在 `more.js` 里加一个入口。

## 六、已完成的功能清单

**主导航（底部 5 个 tab）**
- 🏠 首页：健康仪表盘、今日任务打卡、健康预警、季节重点、每日微养护、成就徽章、花园健康度、彩蛋、急救入口
- 📋 档案：今日记录（体重/进食/饮水/备注）、体重曲线（叠品种标准区间）、免疫与预防打勾、体检清单（必查/按需分开）、老年关怀、双未来预测、最近记录表
- 🍖 吃什么：每日份量（四套模型）、体况判断、关键营养、食物搜索、绝对禁区、粮袋标签评测、换粮过渡表
- 🧠 读懂它：行为图鉴（可解锁）、问题行为方案、品种高发问题、认知修补优先级
- ⚙️ 更多：所有二级入口 + 起居护理频率 + 环境要求 + 四季日历 + 就医避坑 + 费用参考

**顶栏**：宠物切换器、提醒（带待处理数字角标）、搜索、设置

**二级页面**
- ⏰ 提醒：疫苗/驱虫/体检/生日/称重统一到期视图，按过期→即将→未来排序
- 🌳 时间轴：成长阶段进度 + 里程碑记录 + 就诊/用药/免疫/体重合并成一条线
- 💊 健康档案：5 个标签页 —— 用药与驱虫（自动生成下次提醒）、就诊记录（自动记账+推算体检到期）、化验指标（多次记录自动画趋势）、花费统计（预防/日常/治疗结构分析）、身份卡（可打印，走失/寄养/急诊用）
- 📖 知识库：8 分类 26 篇，按物种自动过滤，支持深链 `#knowledge?a=文章id`
- 🚑 家庭急救：12 类急症，每类「怎么判断 / 立刻做什么 / 绝对不要做 / 送医要点」+ 急救包清单 + 生命体征参考值
- 🧭 养护向导：6 棵决策树（不吃东西 / 选粮 / 乱尿 / 要不要去医院 / 新宠第一周 / 咬人）
- 🔍 全局搜索：跨食物、行为、知识、急救、避坑、名词、FAQ、症状
- ⚙️ 设置：主题（跟随/浅/深）、字号四档、提醒提前量、多宠管理、导出/导入 JSON、清除数据
- ℹ️ 关于：产品原则、内容规模统计、内容依据与边界、名词表、更新日志、致谢、免责声明
- ❓ 帮助：每个页面怎么用 + 13 条常见问题 + 数据与隐私说明
- 🏥 症状自查：8 道观察题 + 10 个危险信号 → 红/黄/绿判级 + 行动清单 + 就医摘要（可复制）+ 问诊话术 + 费用参考

**UI 基础设施**：轻提示 toast（带 aria-live）、可说明后果的确认对话框（替代原生 confirm）、
入口行组件、时间轴组件、条形统计、空状态、skip-link、打印样式、`prefers-reduced-motion`。

## 七、几个必须知道的设计决策

1. **饮食按物种分派五种模型**，因为"每天该吃多少"在不同物种上不是同一个问题：
   热量制（猫犬，`RER = 70 × kg^0.75 × 系数`）、配比制（兔/豚鼠/龙猫/仓鼠，干草无限量）、
   占比制（鹦鹉）、猎物制（蛇，体重 10-15%）、节律制（蜥蜴/龟，含钙粉与 UVB）。
2. **判级规则带 `species` / `exceptSpecies` 限定**。兔子停食 12 小时是红灯，蛇拒食是绿灯；
   猫排尿困难按尿道阻塞、犬干呕按胃扭转。规则冲突时取最严重的一级。
3. **食物库查不到时返回「资料不足」而不是「安全」**。
4. **`--accent-soft` 用 `color-mix` 从 `--accent` 和 `--surface` 派生**，否则主题块的硬编码值
   会按选择器优先级盖掉物种主题的柔光底色。
5. **数据只存 localStorage**，隐私模式下自动退回内存而不是崩溃。没有账号、没有服务器、没有埋点。
6. **"养护向导"不叫 AI**，它是写死的决策树。不把规则引擎伪装成模型。
7. **行为方案不含任何惩罚手段** —— 惩罚会消除低吼、哈气这类预警信号。

## 八、当前遗留问题

**PR #6 的 CI 三个红灯与本项目无关。**
`Backend Checks` / `Frontend Checks` / `Soroban Contract Checks` 失败，但本 PR 的改动全部在
`petbloom/` 目录内（`git diff origin/main..HEAD -- ':!petbloom'` 为空）。本地复现确认
`client/` 有 12 个测试文件、66 个用例在 base 分支上就是失败的（`WalletConnectionModal`、
`ApyDashboard`、`ApyForecastBands` 等，与 main 上 `e8017df` 的弹窗重构有关），且最近 6 次 CI
运行（含纯文档 PR）全部失败。已在 PR #6 留言说明。**处理方式：等 base 分支恢复绿灯后合并
main 重跑；不要把 `client/` 的修复混进这个 PR。**

## 九、下一步可以做的（按价值排序）

1. **执业兽医内容审核**：`src/data/` 全部内容上线前必须过一轮，这是产品方案里列明的合规项。
2. **提醒的系统通知**：当前是纯离线，无法推送。要做需要引入 Service Worker 的
   Notification API（仅多文件版本可用）或接后端。
3. **照片与相册**：时间轴目前只有文字。加照片要考虑 localStorage 容量（建议用 IndexedDB）。
4. **多设备同步**：`store.js` 的状态是扁平 JSON，接后端时直接同步这份结构即可。
5. **AI 兽医助手**：产品方案 Phase 4。做的话要保留离线降级路径，并加兽医知识护栏。
6. **社区与医院地图**：Phase 4-5，需要服务器与内容审核。
7. **更多物种**：目前 10 种。加一种 = 在 `data/species.js` 加一条 + 补 `data/care.js` 的免疫计划，
   `tests/care.test.js` 里有一条测试会自动校验新物种的结构完整性。

## 十、验证过的事情（不必重做）

- `npm test`：71 个单测全过。
- Chromium 实测：建档 → 打卡 → 记录 → 饮食处方 → 食物查询 → 粮食评测 → 症状自查 →
  生成就医摘要 → 疫苗打勾 → 用药记录生成提醒 → 里程碑进时间轴 → 记账统计 →
  主题与字号切换，全流程无 console 错误、无外部请求。
- 单文件版在 `file://` 下可用，刷新后数据保留。
- 深浅色双向切换（`data-theme` 能覆盖系统偏好）。
- 猫/狗/兔三套物种主题渲染正常。

---

*最后更新：2026-07-30 · v1.1.0*
