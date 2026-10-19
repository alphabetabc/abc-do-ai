# 004-trend-indicators · 4G/5G 指标趋势（spec）

> 2026-10-12 按实际代码回填。

## 职责

区域屏左右对称两块（左 4G、右 5G），**一套组件两份配置**（`networkType: '4G' | '5G'`，`TrendIndicators.tsx` 基础组件 + `with-4g.tsx` / `with-5g.tsx` 包装）：

- RRC 连接数（双折线：最大值 / 平均值），卡片标题「RRC连接数(个)」（2026-10-14 标题补单位）
- 接通率（单折线），卡片标题「接通率(%)」
- 无线平均利用率（单柱图），卡片标题「无线平均利用率(%)」
- 标题块 min-width 320px（2026-10-14 调整自 255px，适配带单位的标题宽度）

子组件 `quality-line-card.tsx`（`QualityLineCard`，props 含 `dataSource, title, type: 'line'|'bar', unit, networkType` 等），配色注释对齐信管局 wireless-quality。

## 布局（设计稿）

- 尺寸：926×1126，Panel 容器（标题「4G/5G 指标趋势」）
- 左（4G）：left 120 / top 840（紧接 4G 业务面板底部 216+600）
- 右（5G）：left 2800 / top 840

## 趋势规格

- 时间语义：**当天 0 点至当前时间**（`time` 入参为截止时间；2 小时一个点）——2026-10-12 用户确认按现状认可，不采用任务卡原「往前 12 小时」表述
- tooltip（2026-10-13 现场优化）：背景 `rgba(0,0,0,0.7)`，边框 `rgba(0,153,255,0.5)`，文字白 32px（原 16px）

## 数据

见 [data-model.md](./data-model.md)。

## 边界

- 趋势数据点缺失：`toNumber` 转 null，折线断点展示
- 接口出错 / rows 为空：返回 EMPTY_TREND（全空数组，图表空态）
