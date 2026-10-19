# 004-area-business · 重保区域业务汇总（spec）

> 2026-10-10 实现完成（004-03），静态 UI 定稿；接口属 004-00 二-2（服务端待开发）。

## 职责

首屏右侧，**保障区域的汇总统计**（非单区域）：

- 2G 基站（基站数、退服数）+ 2G 小区子行（总数、退服数）
- 4G 基站 + 4G 小区子行（同上）
- 5G 基站 + 5G 小区子行（同上）
- 通感站（基站数、退服数，无子行）
- 重保专线（专线数、中断数，无子行）

## 布局

- PanelRight 744×1564，widgets 注册 left 2970 / top 362
- 内容纵向 space-between 分布；行高 150px

## 组件构成（自写静态 UI，不复刻信管局 wireless-scale / line-scale——用户 2026-10-10 定案）

- `index.tsx`：树形静态常量 `MOCK_DATA`，类型 `{ key, name, metrics: [{value, label}], children? }` + `MetricRow` 渲染器
- 每行：名称 + metrics（值上 label 下的上下结构，值 DIN 字体）；小区子行缩进 + CSS 连接线（|----）
- 分组背景：有 children 的组（2G/4G/5G）套 `images/ind-bg-group.svg`；无 children 的单行按 item.key 套各自图标背景：通感站 `images/ind-bg-single-tonggan.svg`、重保专线 `images/ind-bg-single-zhongbao.svg`（类名 `business-group--tonggan` / `business-group--zhongbao`，2026-10-13 拆分）
- 类名 `area-business--root` 语义化

## 接口预留

将来服务端返回平铺数组（形态待定，见 data-model.md），前端补一层「平铺 → 树形 UI 结构」的转换函数，UI 不动；字段名不自造，接口形态定稿后再写。

## 交互

静态展示，不参与类型联动（统计为保障区域汇总，非按类型过滤）。

## 边界

- 各类退服数 0 时正常展示 0
