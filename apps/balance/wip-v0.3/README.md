# v0.3 在制品 —— 未完成

这个目录里是 **v0.3 重构做到一半的代码**，因输出长度限制中断。
完整背景见上一级目录的 [`HANDOFF.md`](../HANDOFF.md)。

⚠️ **`apps/balance/index.html`（v0.2）是完好可运行的**，没有被这次未完成的重构破坏。
如果只想用 APP，直接开那个文件即可。

## 已完成的三部分

| 文件 | 内容 |
|---|---|
| `part1-shell-and-css.html` | HTML 外壳 + 全部 CSS。含 v0.3 新增组件样式：导航行 `.nav`、手风琴 `.acc`、日历热力图 `.heat`、每日任务 `.task`、步骤列表 `.steps`、键值行 `.kv`、Toast `.toast`、头像血条 `.avatar .hp` |
| `part2-data-types-cognition.js` | 九种体质（比 v0.2 大幅扩写：新增 `cause` 成因 / `risk` 健康风险 / `life` 起居 / `herbs` 药食同源）、30 题测评、**12 条认知漏洞**（减脂 6 + 增重 6，每条含错误信念/真相/训练法/3 步练习）、冲动急救情绪表与替代方案 |
| `part3-data-foods-recipes.js` | 食物库 115+、体质×食物规则、**12 道完整食谱**（食材/步骤/提示/适配体质）、**八段锦八式**、运动库 18 项含 MET 值、24 节气（每个加了养生详解）、**术语表 20 条**、**FAQ 15 条**、更新日志、**2 个 21 天挑战**、成长形态、**徽章 12 枚** |

## 还需要写的三部分

### part4 —— 状态层与路由
- 状态定义 + localStorage 持久化 + **v0.2→v0.3 数据迁移**（key 仍为 `balance.v1`，用 `Object.assign(structuredClone(BLANK), 旧数据)` 补齐新字段，`v` 升到 2，**不能丢老用户数据**）
- 计算函数。**part3 已经引用但尚未实现的**，必须全部补上：
  `totalMeals` `streak` `loggedDays` `followDays` `allImpulses` `waterDays` `allWorkouts` `allMoods` `reachedGoal`
- 沿用 v0.2 已有的：`bmi` `bmr` `tdee` `targetKcal` `macroTargets` `dayTotals` `scoreQuiz` `judge` `advise` `currentTerm` `stageOf`
- **路由与返回栈**：`S.tab` + `S.stack = [{p, a}]`，`push(p,a)` / `back()`，栈非空时 topbar 显示返回键

### part5 —— 五个主 tab
`今日` `记录` `体质` `发现` `我的`

### part6 —— 二级页面 + 事件 + 启动
约 22 个页面：
`about` `privacy` `terms` `faq` `glossary` `changelog` `feedback` `credits`
`stats` `history` `recipes` `recipe` `terms24` `term` `cognition` `cognitionItem`
`challenge` `typeList` `typeDetail` `weekmenu` `gongfa` `badges` `settings` `dataMgmt` `customFood`

## 新增功能（part3 的徽章判定已经依赖它们）

- **饮水**：目标 = 体重 kg × 30 ml
- **运动**：消耗 = `MET × 体重kg × 小时`
- **情绪日记**：记录进食前情绪，统计页做本地模式分析（最常见触发情绪、时段分布）
- **餐食可编辑**（v0.2 只能删）
- **自定义食物 + 常吃收藏**
- **每日任务清单**：记录三餐 / 喝够水 / 运动 / 称重 / 写情绪日记
- **宠物健康度与心情值** = 近 3 天任务完成率（`.avatar .hp` 血条样式已备好）

## 拼装方式

三段是按顺序直接拼接的，中间不需要粘合代码：

```bash
cat part1-shell-and-css.html \
    part2-data-types-cognition.js \
    part3-data-foods-recipes.js \
    part4-state-router.js \
    part5-tabs.js \
    part6-pages-events.js \
    > ../index.html
# 最后补上 <!--APP-END--></body></html>
```

注意 part1 结尾已经有 `<!--APP-START-->`、`#app` 容器和 `#toast`；
part2/part3 各自是完整的 `<script>…</script>` 块。
