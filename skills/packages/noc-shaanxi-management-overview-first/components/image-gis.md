# ImageGis 组件维护与扩展

> **所属技能**：[noc-shaanxi-management-overview-first](../SKILL.md)（父技能）
> **本文档位置**：`.trae/skills/noc-shaanxi-management-overview-first/components/image-gis.md`

## 文档元信息

| 字段     | 值         |
| -------- | ---------- |
| 文档版本 | v1.1       |
| 最后更新 | 2026-06-24 |

## 组件概述

[ImageGis.tsx](web/pages/management-overview-first/modules/center/components/tab-content-1/components/center-gis/ImageGis.tsx) 是中屏网络覆盖GIS组件，负责展示网络覆盖地图，支持多种网络类型（2G、4G、5G、物联网、高精度基站、光缆一干、光缆二干）的可视化。

## 核心功能

### 1. 图层管理

- 支持多种网络类型图层（2G、4G、5G、物联网、高精度基站、光缆一干、光缆二干）
- 基于配置动态显示/隐藏图层
- 支持通过图例复选框交互控制

### 2. 流光动画

- 光缆一干和二干图层支持流光动画效果
- 使用 `useImageGisStreamerAnimate` hook 管理动画状态、zIndex 和透明度
- 交替动画逻辑：二干先动画，完成后一干动画，循环往复
- 动画切换时，下方图层透明度降低为原始的 0.6 倍，上方图层保持原始透明度

### 3. 图例控制

- 左右两侧图例面板，视觉上分离但逻辑上属于同一 `Checkbox.Group`
- 支持全选/单选控制，左右两侧选项可同时选中
- 响应元数据操作（MetaHuman）
- **重要**：两个图例面板必须包裹在同一个 `Checkbox.Group` 组件内，否则会出现互斥问题

### 4. 地图交互

- 支持区域切换时的地图中心点和缩放级别调整
- 支持 GeoJson 图层叠加

## useImageGisStreamerAnimate Hook 详解

### 位置

[useImageGisStreamerAnimate.ts](web/pages/management-overview-first/modules/center/components/tab-content-1/components/center-gis/useImageGisStreamerAnimate.ts)

### 核心结构

#### 类型定义

```typescript
export interface LayerState {
    zIndex: number; // 当前 zIndex
    isAnimating: boolean; // 是否正在动画
    originalZIndex: number; // 原始 zIndex
    opacityMultiplier: number; // 透明度倍数（1 为原始，0.6 为降低）
}

export interface StreamerAnimateState {
    fir: LayerState; // 一干状态
    sec: LayerState; // 二干状态
}
```

#### Hook 参数

| 参数                | 类型      | 说明            |
| ------------------- | --------- | --------------- |
| `firChecked`        | `boolean` | 一干是否选中    |
| `secChecked`        | `boolean` | 二干是否选中    |
| `originalFirZIndex` | `number`  | 一干原始 zIndex |
| `originalSecZIndex` | `number`  | 二干原始 zIndex |

#### 返回值

| 返回值                       | 类型                           | 说明                       |
| ---------------------------- | ------------------------------ | -------------------------- |
| `animatedZIndex`             | `{ fir: number; sec: number }` | 动画时的 zIndex            |
| `animatedOpacity`            | `{ fir: number; sec: number }` | 动画时的透明度倍数         |
| `handleFirCreation`          | `(api: StreamerApi) => void`   | 一干 StreamerPath 创建回调 |
| `handleSecCreation`          | `(api: StreamerApi) => void`   | 二干 StreamerPath 创建回调 |
| `handleFirAnimationComplete` | `() => void`                   | 一干动画完成回调           |
| `handleSecAnimationComplete` | `() => void`                   | 二干动画完成回调           |
| `startAnimation`             | `() => void`                   | 启动动画                   |
| `stopAnimation`              | `() => void`                   | 停止动画                   |

### 动画逻辑

#### 初始状态（两者都选中）

- 二干 zIndex + 100，opacity = 1
- 一干 opacity = 0.6
- 启动二干动画

#### 二干动画完成

- 二干 zIndex 恢复，opacity = 0.6，停止动画
- 一干 zIndex + 100，opacity = 1
- 启动一干动画

#### 一干动画完成

- 一干 zIndex 恢复，opacity = 0.6，停止动画
- 二干 zIndex + 100，opacity = 1
- 启动二干动画（循环）

#### 单独选中

- 只有一个图层选中时，保持原始透明度和 zIndex

### Hook 扩展能力

#### 修改动画偏移量

修改 `ANIMATE_Z_INDEX_OFFSET` 常量调整 zIndex 提升幅度：

```typescript
const ANIMATE_Z_INDEX_OFFSET = 100; // 默认值
```

#### 修改透明度倍数

修改动画完成回调中的 `opacityMultiplier` 值：

```typescript
// 下方图层透明度倍数（当前为 0.6）
opacityMultiplier: 0.6;
```

#### 添加新的动画状态

在 `LayerState` 接口中添加新字段，然后在状态更新逻辑中维护。

#### 自定义动画时序

修改 `startAnimation`、`handleFirAnimationComplete`、`handleSecAnimationComplete` 中的延迟时间和执行顺序。

## 扩展能力

### 添加新图层

1. 在 `neTypeList` 数组中添加新类型
2. 创建对应的数据状态和加载状态
3. 在 JSX 中添加图层渲染逻辑
4. 在图例中添加对应选项

### 修改动画逻辑

- 调整 `useImageGisStreamerAnimate` hook 的参数和返回值
- 修改 `StreamerPath` 组件的配置（线宽、颜色、长度等）
- 自定义动画时序和透明度变化

### 自定义样式

- 修改 `network-coverage-center-gis-container` 类名的样式
- 调整图层的 zIndex 和 opacity

## 常见问题与解决方案

### 问题：左右图例复选框互斥

**现象**：选中左边图例的选项后，右边图例的选项被清空，反之亦然。

**原因**：两个图例面板使用了独立的 `Checkbox.Group` 组件，各自只收集自己内部的选项值，导致状态不同步。

**解决方案**：将两个图例面板包裹在同一个 `Checkbox.Group` 组件内：

```jsx
<Checkbox.Group value={neTypeCheckList} onChange={onViewSetChange}>
    <div className="legend network-gis-legend-left">...</div>
    <div className="legend network-gis-legend-right">...</div>
</Checkbox.Group>
```

## 使用场景

- 添加新的网络类型图层
- 修改现有图层的显示样式
- 调整流光动画效果（速度、颜色、透明度）
- 扩展图例功能
- 集成新的地图交互能力
- 自定义动画切换逻辑

## 相关文件

- [useImageGisStreamerAnimate.ts](web/pages/management-overview-first/modules/center/components/tab-content-1/components/center-gis/useImageGisStreamerAnimate.ts) - 动画状态管理 hook
- `StreamerPath` - 流光路径组件
- `index.less` - 组件样式文件

## 版本演进说明

| 版本 | 关键变更                                                                                    |
| ---- | ------------------------------------------------------------------------------------------- |
| v1.0 | 初始版本，作为 `image-gis` 独立子技能维护                                                   |
| v1.1 | 文档迁移至 `noc-shaanxi-management-overview-first/components/image-gis.md`，按父-子结构管理 |
