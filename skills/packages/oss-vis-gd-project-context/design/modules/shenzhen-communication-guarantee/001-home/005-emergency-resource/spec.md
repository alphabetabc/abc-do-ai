# 005-emergency-resource · 应急资源统计（首屏，spec）

> 2026-10-10 迁移完成（004-03），样式定稿。

## 职责

首屏底部中区的应急指标：4 类应急资源统计——保障卫星车、保障通信车、保障发电车、保障人员（顺序固定，由接口 viewItemDataTemplate presets 决定：卫星车 → 通信车 → 发电车 → 人员）。

## 布局

- 宽 1998 × 高 158，left 920 / top 1558（横条形态，位于地图下方）
- 容器：`NoStylePanel`（title「应急资源」，无面板背景样式）
- 卡片 438×156，背景 `images/ind-bg.png`；icon 区宽 175px（img 104×104）；标题 40px / 数值 60px（YouSheBiaoTiHei 渐变）/ 单位 32px

## 组件构成

- 物理复制自信管局 `home/bottom-indicators`（接口原配 UI——`getEmergencyResourceApi` 扁平返回结构的原消费者；原定 open-and-close/support-resource 为分组结构不匹配，2026-10-10 改定）
- 接口 `getEmergencyResourceApi`（`home/center.ts`，见同目录 data-model.md），useRequest 无轮询（同源保持）
- 素材：`icon-保障卫星车/通信车/发电车/人员.svg`（本义图标，非临时映射）在 `public/static/images/shenzhen-communication-guarantee/`；类名 `emergency-resource--root` / `resource-item--*` 语义化
- 区域屏（004-04）复用本组件时换 areaPrepositionResourceList

## 交互

静态展示，不参与类型联动。

## 边界

- 数量 0 时正常展示 0；接口异常走模板兜底（value 全 0）
