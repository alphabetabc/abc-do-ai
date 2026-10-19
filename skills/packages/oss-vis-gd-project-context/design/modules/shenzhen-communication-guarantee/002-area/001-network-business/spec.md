# 001-network-business · 4G/5G 业务（spec）

> 2026-10-12 按实际代码回填。

## 职责

区域屏左右对称两块（左 4G、右 5G），**一套组件两份配置**（`networkType: '4G' | '5G'`，大写；`NetworkBusiness.tsx` 基础组件 + `with-4g.tsx` / `with-5g.tsx` 薄包装）：

- 每个 tile（基站 / 小区）展示 3 项：总数、退服数（红色 `level: '1'`）、退服率（%）

## 布局（设计稿）

- 尺寸：926×600
- 左（4G）：left 120 / top 216
- 右（5G）：left 2800 / top 216

## 组件构成

| 文件 | 用途 |
| --- | --- |
| `modules/network-business/NetworkBusiness.tsx` | 基础组件（props: `networkType`） |
| `modules/network-business/with-4g.tsx` / `with-5g.tsx` | 固定 networkType 的包装组件 |
| Panel 内两个 Section（基站 / 小区） | 统计指标展示 |

## 交互与区域联动

- 通过 `useCurrentArea()` + `resolveAreaAdcode()` 取区域 adcode 作为 `area` 参数，`refreshDeps: [area]`、`ready: isDefined(area)`
- **15 分钟轮询**（`pollingInterval: TIME_RANGE.MINUTE * 15`）
- 从首屏打点进入区域屏时以该区域为维度拉取；无 activeArea 时兜底 `{ name: '深圳' }`（AreaProvider 默认值）

## 边界

- 接口出错 / 行缺失：展示全 0 兜底（EMPTY_STATION / EMPTY_COMMUNITY，退服率 `'0%'`）
