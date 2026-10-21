# Task · 2026-10-20-004-scguarantee-top-apec-slogan

> 源需求：`docs/specs/shenzhen-communication-guarantee/pm-inputs/assets/20261020/反拉终端---2026年10月20日.md` 第 7 点（中顶部新增）
> 现状：顶部布局在 [sub-pages/index.tsx](web/pages/shenzhen-communication-guarantee/sub-pages/index.tsx)（`header-title` / `header-zero-excellent` / `header-time-card`）

## 任务元信息

| 项       | 值 |
| -------- | --- |
| 编号     | `task-2026-10-20-004-scguarantee-top-apec-slogan` |
| Status   | 已完成 |
| 类型     | 编码 |
| 影响范围 | sub-pages/index.tsx（顶部布局）、新组件 zero-excellent、weather-card（停止挂载，组件保留）、sub-pages/index.less |
| Roadmap  | 深圳保障屏反拉终端调整（2026-10-20） |
| 验收标准 | 见下方 checklist |
| 前置依赖 | 无 |

## 目标（Goal）

首屏中顶部新增保障目标模块：展示 APEC LOGO 与「四零双优」保障目标，突出「零」与「优」二字并放顶端轮询；同时去掉顶部天气卡。

## 实现结论（以工作区代码为准，提交 9a9a3bb）

- 新组件 [zero-excellent](web/pages/shenzhen-communication-guarantee/sub-pages/components/zero-excellent/index.tsx)：左侧「四零双优」标识（logo.svg，自带文字）+ 右侧两张轮播卡（banner.svg 打底）；四零/双优两卡各自 3s 定时轮巡（`ROTATE_INTERVAL`），「零」/「优」二字以 highlight 样式突出（`highlight-zero` / `highlight-excellent`）
- 挂载于 sub-pages/index.tsx `header-zero-excellent`（顶部中位）；HEADER_TITLE 同步改为「深圳APEC会议通信保障」
- 天气卡：已从顶部移除挂载（index.tsx 无 WeatherCard 引用）；weather-card 组件目录与 `getWeatherDataApi` 链路保留未删（可回退）
- 文案：四零 = 重大网络事故/重大安全事件/重大客户投诉/负面焦点事件；双优 = 客户感知/社会评价

## 开放问题

| #   | 问题 | 负责人 | 状态 | 结论 |
| --- | ---- | ------ | ---- | ---- |
| 1   | APEC LOGO 素材 | PM | 已关闭 | logo.svg 素材落地（自带「四零双优」文字） |
| 2   | UI 设计稿 | PM | 已关闭 | 以落地样式为准（logo + 双 banner 轮播卡） |
| 3   | 顶端轮询形式 | PM | 已关闭 | 四零/双优两卡并行、各自 3s 逐条轮巡 |
| 4   | 「零」「优」突出样式 | UI | 已关闭 | highlight 样式（`highlight-zero` / `highlight-excellent`） |
| 5   | 天气删除范围 | 待定 | 已关闭 | 仅移除挂载，组件与接口链路保留 |
| 6   | 与 header-title 位置关系 | PM | 已关闭 | 中位并列（header-zero-excellent 独立槽位），标题改为「深圳APEC会议通信保障」 |

## 步骤（执行计划）

- [x] 步骤 1–2：澄清与审批——用户裁决以工作区实现为准（2026-10-22）
- [x] 步骤 3：实现——zero-excellent 组件 + 顶部布局调整 + 天气卡移除（提交 9a9a3bb）
- [x] 步骤 4：验证 + 回填——任务卡回填，用户验收关闭

## 验收 checklist

- [x] A1：中顶部呈现 APEC LOGO + 四零双优（四零/双优文案完整）
- [x] A2：「零」「优」二字有视觉突出（highlight 样式）
- [x] A3：四零双优内容顶端轮巡正常（两卡并行、3s 各自轮巡）
- [x] A4：顶部天气卡已去掉，顶部布局不破版
- [x] `pnpm lint` 跳过（沿用 003 卡用户裁决）

## 审批记录

| 门槛       | 状态   | 日期       | 批准人 |
| ---------- | ------ | ---------- | ------ |
| ① 需求审批 | 已批准 | 2026-10-22 | 用户 |
| ② 实现验收 | 已验收 | 2026-10-22 | 用户（以工作区实现为准） |

## 变更记录

| 日期       | 变更 |
| ---------- | ---- |
| 2026-10-20 | 建卡：反拉终端第 7 点，待澄清（LOGO/UI/轮询形式等 6 问） |
| 2026-10-22 | 关闭：实现已在工作区落地（zero-excellent 组件、天气卡移除挂载、标题改 APEC），以代码为准回填验收；Status → 已完成 |
