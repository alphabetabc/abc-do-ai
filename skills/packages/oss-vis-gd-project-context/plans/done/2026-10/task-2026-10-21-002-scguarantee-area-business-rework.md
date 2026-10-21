# Task · 2026-10-21-002-scguarantee-area-business-rework

> 源需求：2026-10-21 用户提出（F2 网络规模模块再次调整）
> 前置任务：[task-2026-10-20-001-scguarantee-scene-network-scale-static](./task-2026-10-20-001-scguarantee-scene-network-scale-static.md)（F2 网络规模重构 + 新设计稿落地，已归档）
> 现状模块：[area-business](../../../../../web/pages/shenzhen-communication-guarantee/sub-pages/home/modules/area-business/index.tsx)（service：[section-right.ts](../../../../../web/services/shenzhen-communication-guarantee/home/section-right.ts)）

## 任务元信息

| 项       | 值                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------- |
| 编号     | `task-2026-10-21-002-scguarantee-area-business-rework`                                            |
| Status   | 已完成                                                                                            |
| 类型     | 编码                                                                                              |
| 影响范围 | `web/pages/shenzhen-communication-guarantee/sub-pages/home/modules/area-business/`（样式层，数据链路未动） |
| Roadmap  | 深圳保障屏反拉终端调整（2026-10-20）                                                              |
| 验收标准 | 见下方 checklist                                                                                  |
| 前置依赖 | task-2026-10-20-001（已完成）                                                                     |

## 目标（Goal）

再次调整首屏右侧「重保区域业务（网络规模）」模块：按新设计稿重做样式层，并**删除重保专线行**（需求删除项）。

## 背景

- 上一轮（task-2026-10-20-001）已完成：模板平铺、viewType card1/card2 分发、三张背景图、enableStaticData 静态直出
- 本轮为该现状之上的样式层增量

## 功能列表（已定稿）

- F1 Card1（基站行）样式重做：名称左下；指标容器绝对定位底部（`bottom: 70px`），左侧 children[0] 居中单值，右侧 children[1]/[2] 以 `A / B` 斜杠拼接，第二数字白→绿渐变
- F2 Card2（单值行）重排：label + num 基线对齐横排（`marginLeft: 30px`）
- F3 背景素材更新：bg-基站.svg（659×290）/ bg-5g-a.svg（689×243）/ bg-重保.svg（679×210，预留）+ 根节点 `::after` 顶部表头装饰 ind-label.png（651×92）
- F4 **删除重保专线行**（用户确认：需求删除项；less 中 `data-bg='zhongbao'` 样式与 bg-重保.svg 保留为预留，源码默认模板本就无该行）
- 数据链路（viewItemDataTemplate / fillTemplateValues / 静态直出 / fallback）本轮**未改动**

## 开放问题

| #   | 问题                         | 负责人 | 状态   | 结论 |
| --- | ---------------------------- | ------ | ------ | ---- |
| 1   | 具体调整内容（样式/数据/结构）？是否已有新设计稿？ | 用户 | 已关闭 | 样式层重做（见功能列表 F1–F3）+ 重保专线行按需求删除（F4）；以工作区代码/素材为准验收 |
| 2   | card1 children label 语义（当前「基站/基站/小区」）与 Card1 渲染结构（leftMetric + 斜杠双值）的最终措辞？ | 用户 | 已关闭 | 模板维持上一轮结构，最终措辞由 env `viewItemDataTemplate` 下发调整 |

## 步骤（执行计划）

- [x] 步骤 1：需求澄清——用户确认以工作区代码为准（2026-10-21）
- [x] 步骤 2：需求审批——用户裁决「回填 task 和 design 即可」（2026-10-21）
- [x] 步骤 3：实现——已由用户完成（样式层 + 素材替换）
- [x] 步骤 4：验证 + 回填——任务卡 + `design/modules/shenzhen-communication-guarantee/001-home/004-area-business/spec.md` 已同步

## 验收 checklist

- [x] A1：Card1 基站行为左右结构（名称左下 + 居中单值 + 斜杠双值，第二数字绿渐变）
- [x] A2：Card2 单值行（5G-A 低空站点）label/num 横排 + bg-5g-a 背景
- [x] A3：背景素材（bg-基站 / bg-5g-a）与表头装饰 ind-label.png 呈现
- [x] A4：重保专线行不再渲染（需求删除）
- [x] `pnpm lint` 跳过（沿用 003 卡用户裁决：不跑 lint）

## 审批记录

| 门槛       | 状态   | 日期       | 批准人 |
| ---------- | ------ | ---------- | ------ |
| ① 需求审批 | 已批准 | 2026-10-21 | 用户 |
| ② 实现验收 | 已验收 | 2026-10-21 | 用户（以工作区实现为准） |

## 变更记录

| 日期       | 变更                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------ |
| 2026-10-21 | 建卡：F2 网络规模模块再次调整，待澄清                                                             |
| 2026-10-21 | 回填定稿：样式层重做（Card1 左右结构/斜杠双值/绿渐变、Card2 重排、新背景素材+表头装饰）+ 重保专线行按需求删除；数据链路未动；Status → 已完成 |
