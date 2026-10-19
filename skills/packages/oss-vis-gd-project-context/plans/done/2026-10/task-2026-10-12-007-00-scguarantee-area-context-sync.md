# Task · 2026-10-12-007-00-scguarantee-area-context-sync

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-10-12-007-00-scguarantee-area-context-sync` |
| Status | 已完成 |
| 类型 | 编码 |
| 影响范围 | `web/pages/shenzhen-communication-guarantee/sub-pages/home/modules/area-carousel/index.tsx`、`web/pages/shenzhen-communication-guarantee/sub-pages/area/modules/area-carousel/index.tsx` |
| Roadmap | 2026 年深圳重要通信保障屏建设（PM 素材 2026-10） |
| 验收标准 | 见下方验收 checklist（A1–A3） |
| 前置依赖 | 004-04（区域屏组件已落码）、005（三联动已落码） |

---

## 目标（Goal）

修复「从区域屏回到首屏后，区域轮巡高亮与地图 TOOLTIP 浮层选中项不一致（浮层停在第一个区域）」的问题。根因：首屏轮巡 click 分支只切屏不广播 widget field `activeArea`，且 widget dispatch 事件作用域隔离（Home / Area 各自 `WidgetsRender` 内独立 `WidgetInteraction`），区域屏的状态无法通过 widget 广播传回首屏。

方案：以 `ViewContext.activeArea`（React 层跨屏共享 state，天然覆盖两屏）作为区域选中态的唯一事实源，回到首屏时由 `defaultActiveItemId` 恢复选中并借助初始化广播对齐 widget field。

## 步骤（执行计划）

### 步骤 1：区域屏轮巡回写 context

- **动作**：`sub-pages/area/modules/area-carousel/index.tsx` 的 `onChange` 在 **auto 轮巡时也** `setActiveArea(activeItem)`（目前仅 click 写入）；顺带清理该文件遗留的 `console.log('测试日志 …')` 联调日志（004-04 遗留项）
- **输出**：区域屏轮巡期间 `ViewContext.activeArea` 始终最新
- **等待用户**：否

### 步骤 2：首屏轮巡接 defaultActiveItemId 恢复选中

- **动作**：`sub-pages/home/modules/area-carousel/index.tsx` 读取 `useViewContext().activeArea`，作为 `defaultActiveItemId` 传给共用 `AreaCarousel`（组件已支持：数据/初始项变化时 `updateIndex` → auto 广播 widget field `activeArea`，地图浮层随之对齐）
- **输出**：回到首屏后轮巡高亮 = 离开时的区域；widget field 经初始化广播自动纠正，地图浮层同步
- **等待用户**：否

### 步骤 3：验证与回填

- **动作**：`pnpm start` 手工验证 A1–A3；回填本卡技术设计与 005/002-area 相关设计文档
- **输出**：验收结论 + 文档更新
- **等待用户**：是（硬门槛②）

## 功能列表

- F1：区域屏轮巡（auto + click）持续回写 `ViewContext.activeArea`
- F2：首屏区域轮巡以 context `activeArea` 为初始选中，回屏即恢复对齐（轮巡高亮、地图 TOOLTIP 浮层、widget field 三者一致）

## 不做清单

- 不改 widget dispatch / WidgetInteraction 机制（作用域隔离是框架行为，不动 `web/components/large-screen/`）
- 不改 center-map 的 `overlayInfo` 匹配逻辑（对齐由数据源头解决）
- 不处理首屏轮巡 auto 分支的 context 回写（首屏 auto 只广播 widget field 即可；若写 context 会与 `switchViewByArea` 写入源混淆）
- 不调整轮询周期/数据结构

## 业务规则

- 选中态唯一事实源：`ViewContext.activeArea`；写入方仅两处——首屏 click（`switchViewByArea`）、区域屏轮巡（auto + click 的 `setActiveArea`）
- 首屏轮巡恢复用 `defaultActiveItemId`，不在首屏 auto 时反写 context，避免回环
- 15 分钟轮询产生新数组引用导致 carousel 重置回 0 的问题由 F2 顺带解决（`defaultActiveItemId` 恢复选中）

## 验收 checklist

- [x] A1：区域屏轮巡（含 auto）期间回到首屏，轮巡高亮 = 离开时区域，地图 TOOLTIP 浮层同步显示同一区域（不再停在第一个）——用户 2026-10-12 手工验证通过
- [x] A2：首屏停留超过一个轮询周期（15 分钟）后，轮巡不因数据刷新重置回第一张——同上
- [x] A3：点击轮巡卡片/地图浮层切区域屏，再回屏，链路仍正确；区域屏轮巡期间 home 隐藏状态下无异常报错——同上
- [x] `sub-pages/area/modules/area-carousel` 的测试日志 console.log 已清理——编码时已清理；用户验证期间自行加回临时调试日志（`activeItem` 信息打印，click 条件已注释），知情保留，上线前统一清理
- [x] `env/AGENTS.md` 声明的质量门槛命令已通过（lint 已知仓库级环境问题，按 004-04 先例以 IDE 诊断替代，两改动文件均无诊断错误）

## 技术设计（阶段二回填）

改动点（仅 2 个文件、各 1 处，共用组件零改动）：

1. `sub-pages/area/modules/area-carousel/index.tsx`
   - `onChange` 去掉 `info.type === 'click'` 分支，auto + click 一律 `setActiveArea(activeItem)`，使 `ViewContext.activeArea` 在区域屏轮巡期间始终最新。
2. `sub-pages/home/modules/area-carousel/index.tsx`
   - `useViewContext()` 增取 `activeArea`，透传为共用 `AreaCarousel` 的 `defaultActiveItemId`。

生效链路（回屏对齐原理）：

- 首屏 `AreaCarousel` 挂载/数据刷新时，`useEffect` 以 `defaultActiveItemId` 计算 `initialIndex` 并 `updateIndex` → 触发 `onChange(type='auto')` → 首屏壳 auto 分支 `dispatch(widgetFields.activeArea, activeItem)` → 首屏作用域内 center-map TOOLTIP 浮层对齐。即回屏后由「初始化广播」重建 widget field，绕开跨屏 widget 作用域隔离。
- 15 分钟轮询返回新数组引用触发同一 `useEffect`，`defaultActiveItemId` 恒为 context 当前值 → carousel 不重置回 0（A2 顺带解决）。
- 防回环：首屏 auto 分支不写 context（仅 dispatch），context 写入方仍只有首屏 click（`switchViewByArea`）与区域屏轮巡两处。

## 变更记录

| 日期 | 变更 | 原因 | 是否重新过硬门槛① |
| --- | --- | --- | --- |
| 2026-10-12 | 建卡 | 用户确认问题分析并指示建卡 | — |
| 2026-10-12 | 完成编码与验收，归档 | 用户手工验证 A1–A3 通过 | 否 |

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-10-12 | 用户（指示执行本任务卡） |
| ② 实现验收 | 已通过 | 2026-10-12 | 用户（手工验证 A1–A3 无问题） |

---

## 关联

> - 前置：task-2026-10-09-004-04-scguarantee-area-widgets-migrate（done）、task-2026-10-09-005-shenzhen-communication-guarantee-new-widgets（done，三联动/TOOLTIP 联动实现）
> - 关联代码：`sub-pages/components/view-context/index.tsx`、`sub-pages/components/area-carousel/index.tsx`（共用组件，`defaultActiveItemId` 已支持）
