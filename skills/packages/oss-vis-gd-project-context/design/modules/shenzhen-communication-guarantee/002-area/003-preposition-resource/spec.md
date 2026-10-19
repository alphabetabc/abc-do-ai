# 003-preposition-resource · 保障资源（spec）

> 2026-10-12 按实际代码回填（原「占位、复用首屏接口」描述已失效）。

## 职责

区域屏底部：展示当前区域的保障资源，**分组双指标模型**（每组「任务中 + 总数」），复制自信管局 game-match support-resource 的分组转换逻辑与视觉（非代码 import，为物理复制改造）。

- 资源分组（默认模板顺序）：保障人员 / 保障通信车 / 保障发电车（与任务卡 004-04 要求一致，2026-10-12 已按需求调整默认模板）
- 每组两项：任务中（个）、总数（个）

（可通过 environment 配置 `shenzhen-communication-guarantee.areaConfig.shenzhen-area-view-area-preposition-resource` 覆盖模板）

## 布局（设计稿）

- 尺寸：1668×280，left 1086 / top 1680
- Panel 容器（含面板标题「保障资源」），进场动画 `animate__fadeInUp`

## 组件构成

- 壳：`web/pages/shenzhen-communication-guarantee/sub-pages/area/modules/preposition-resource/index.tsx`
- 视觉：分组卡片（图标 + 组名 | 指标列表），less 类名沿用信管局 `game-match-support-resource-group--root`
- 图标：`${constants.IMAGE_PATH}/info-management-bureau/icon-${label}.svg`（借用信管局静态图标）

## 交互与区域联动

- 通过 `useCurrentArea()` 取当前区域，`areaName = area?.name ?? area?.userlabel` 作为接口入参（注意：本模块用**区域名称**而非 adcode）
- `refreshDeps: [areaName]`，`ready: isDefined(areaName)`；无轮询
- 与首屏 emergency-resource **不共用组件**（首屏为 4 类单值卡，本模块为分组双指标卡），仅视觉范式同源

## 边界

- 接口出错 / rows 为空：每组 children 命中空对象，数量展示兜底 `'0'`
