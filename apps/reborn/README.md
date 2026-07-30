# Reborn · 重生（可运行原型）

成瘾康复与能量提升 App 的 Web 原型（PWA 方向），实现了设计稿
[`docs/reborn/prd.md`](../../docs/reborn/prd.md) 第五、六、七章的核心模块。

> **免责声明**：本项目提供健康自助与生活方式建议，不构成医疗诊断或治疗方案。
> 其中的中医内容属传统经验范畴。若出现持续抑郁、自伤念头或躯体症状，请联系专业医疗机构。

## 快速开始

```bash
cd apps/reborn
npm install
npm run dev      # http://localhost:5180
npm test         # 88 个单元测试（纯逻辑层）
npm run build    # tsc -b && vite build
```

无后端、无账号系统、无网络请求：全部状态存在浏览器 `localStorage`（key `reborn:state:v1`）。
清空数据：「更多 → 设置 → 清空本地数据」。

## 已实现的模块

| PRD 章节 | 模块 | 落地位置 |
| --- | --- | --- |
| 5.1 智能测评与个性化诊断 | 19 题多维问卷 → 成瘾程度 / 生理 / 心理 / 诱因占比 / 中医体质 / 康复周期 / 推荐方案 | `screens/Onboarding.tsx`、`lib/assessment.ts` |
| 5.1.3 动态调整 | 7 天复评、relapse 复盘问卷、成瘾模式图谱 | `screens/More.tsx`、`screens/Panic.tsx`、`screens/Dashboard.tsx` |
| 5.2 危害认知中心 | 15 篇四维科普（身体/心理/关系/大脑）+「与你相关」个性化排序 | `screens/Learn.tsx`、`data/education.ts` |
| 5.2.3 冲动脱敏 | Panic Button：15 秒冷静期 → 急救菜单 → 5-4-3-2-1 接地 / 真相核查 / 能量转移 / 15 分钟延迟锁 | `screens/Panic.tsx`、`data/urge.ts` |
| 5.2.4 视觉管理 | 净化指南、安全浏览、替代 feed、灰度模式清单 | `screens/Learn.tsx`、`screens/More.tsx` |
| 5.3 能量提升 | 6 套古法功法库（含解锁门槛）、体质调理项、膳食与补水追踪 | `screens/Energy.tsx`、`data/exercises.ts`、`data/nutrition.ts` |
| 5.3.4 每日能量任务 | 按体质 + 等级 + 时段动态生成，早晨升阳 / 晚间收敛 | `lib/tasks.ts` |
| 5.4 激励机制 | 打卡与连续加成、完美日、8 级里程碑、动物成长 6 阶段、金币商城、宝箱、彩蛋 | `lib/rewards.ts`、`lib/progress.ts`、`screens/Shop.tsx`、`lib/eggs.ts` |
| 6.1 AI 康复教练 | 规则引擎版 CBT 对话 + 晨间诊断 / 晚间复盘 / 周报 / 危机关怀 | `screens/Coach.tsx`、`lib/coach.ts` |
| 6.2 社区 | 匿名广场、分组、导师问答、互助匹配（示意数据） | `screens/Community.tsx` |
| 6.3 数据仪表盘 | 五维追踪、14 天完成率、情绪趋势、勋章墙 | `screens/Dashboard.tsx` |
| 7 UI/UX | 深空蓝 #0F172A / 翡翠绿 #10B981 / 琥珀金 #F59E0B，东方禅意 × 游戏化 | `styles.css` |

### 冲动风险预警

`lib/risk.ts` 用历史 relapse 与冲动记录的小时分布做 3 小时滑动窗口取峰值；
样本少于 3 条时回退到测评首要诱因推断的时段，并给出较低置信度。跨零点窗口单独处理。

## 与设计稿的差异（原型取舍）

- **视频与音频**：功法与冥想内容用「要点 + 常见错误」文本替代，正式版接云端视频。
- **AI 教练**：本地规则引擎（`coachReply(input, ctx)`），接口与 LLM 版本一致，替换实现即可。
- **社区**：示意数据，非真实用户内容；无后端与审核链路。
- **拦截器集成 / 灰度模式 / 推送**：需原生能力，此处只呈现入口与指南。
- **实体周边、捐赠证书**：仅商城流程，无履约链路。

## 结构

```
src/
  data/        题库、科普库、功法库、营养、里程碑、商城、脱敏训练（内容与代码分离）
  lib/         纯逻辑：测评评分、进度与里程碑、奖励、任务生成、风险预测、教练、彩蛋
  state/       reducer + localStorage 持久化
  screens/     首页、测评、急救、科普、能量、伙伴、数据、教练、社区、商城、更多
  components/  Card / Bar / Meter / Sheet / Collapse / useCountdown
```

`lib/` 与 `state/reducer` 为纯函数，全部逻辑用 vitest 覆盖（`npm test`）：测评可复现性、
诱因占比归一化、连续打卡断链、完美日防刷、复发后保留最长记录、里程碑不可重复领取、
宝箱边界、风险窗口跨零点等。
