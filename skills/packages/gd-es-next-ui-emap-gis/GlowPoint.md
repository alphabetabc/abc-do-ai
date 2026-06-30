---
name: "GlowPoint"
description: "EMap 动画点（AnimatePointsLayer）能力说明：基于 d3 scale 与 RAF 的 ripple/breath 动画，封装类 + EMapUtils.addAnimatePoints 入口"
---

# AnimatePointsLayer 组件说明

> 文档保留 `GlowPoint.md` 命名以兼容旧链接；能力主题已从"Canvas 光晕 + gsap"演进为 **d3 scale + RAF + 类封装**。

## 1. 组件概述

`AnimatePointsLayer` 是一套用于在 EMap GIS 地图上呈现**带动画的点要素**的能力封装。常见于应急支撑系统中"核心机楼高亮 / 应急资源心跳 / 风险点脉冲"等需要持续吸引注意力的场景。

**支持两种动画模式**：

| 模式     | 视觉效果                                    |
| -------- | ------------------------------------------- |
| `ripple` | 固定中心点 + N 个扩散环向外脉冲（推荐高亮） |
| `breath` | 单点原地呼吸（推荐次重要 / 心跳类提示）     |

技术栈：

- **d3（scale + color）**：用 `d3.scaleLinear` 计算半径/透明度；用 `d3.color` / `d3.rgb` 处理颜色，动态生成带 alpha 的 rgba 字符串。
- **EMap eStyle**：用 `eStyle.circle({ fillColor, strokeColor, strokeWidth, radius })` 渲染圆环。
- **requestAnimationFrame**：类内置 RAF 循环，每实例一个，简单直接。

## 2. 模块结构

```
emap-gis/
├── AnimatePointsLayer.ts   # 动画点类（核心实现）
├── emap.ts                 # 在 EMapUtils 中暴露 addAnimatePoints 工厂入口
└── index.tsx               # 导出 AnimatePointsLayer 类
```

## 3. 核心原理

### 3.1 数据流（一帧的执行过程）

```
RAF → tick()
        │
        ├─ 算 t = (performance.now() % duration) / duration
        │
        ├─ layer.setStyle(feature => ...)
        │     │
        │     ├─ feature.id.startsWith(this.idPrefix)?   ← 过滤本实例
        │     ├─ meta = features.find(...)                ← 查元信息
        │     ├─ 按 kind 分支：
        │     │     ├─ 'core'   → 固定样式（baseRadius + opacity 1）
        │     │     ├─ 'ring'   → 按 phase 计算 radius/opacity
        │     │     └─ 'breath' → cos 呼吸样式
        │     └─ return eStyle.style({ image: eStyle.circle({...}) })
        │
        └─ requestAnimationFrame(tick)
```

### 3.2 颜色处理（d3-color）

```ts
/** 用 d3.color 解析颜色字符串；解析失败时回退到默认红色 0.9 透明 */
const toD3Color = (input: string | undefined): d3.RGBColor => {
    const c = input ? d3.color(input) : null;
    return (c ? d3.rgb(c) : d3.rgb("rgba(255, 0, 0, 0.9)")) as d3.RGBColor;
};

/** 基于 d3 color 生成带新 alpha 的 rgba 字符串 */
const toRgbaString = (color: d3.RGBColor, alpha: number): string => {
    return color.copy({ opacity: alpha }).toString();
};
```

**关键 d3 API**：

| d3 API                    | 用途                                                  |
| ------------------------- | ----------------------------------------------------- |
| `d3.color(str)`           | 解析任意 CSS 颜色字符串，解析失败返回 `null`          |
| `d3.rgb(color)`           | 强制转换为 `d3.RGBColor`（0-255 r/g/b + 0-1 opacity） |
| `color.copy({ opacity })` | 不可变复制，生成新副本                                |
| `color.toString()`        | `opacity < 1` 输出 `rgba(r,g,b,a)`，否则 `rgb(r,g,b)` |

### 3.3 Feature id 前缀筛选（避免与同 layer 上其它动画混淆）

```ts
// 构造时
this.idPrefix = `animatePoint_${mode}_${layerId}_${Date.now()}`;

// feature id 格式
`${this.idPrefix}p${p.id}-core` // 中心点
`${this.idPrefix}p${p.id}-r${i}` // 扩散环（i = ringIndex）
`${this.idPrefix}p${p.id}-breath`; // 呼吸环

// tick 内
if (!feature.id.startsWith(this.idPrefix)) return this.eStyle.defaultStyle();
```

## 4. ripple 模式（扩散环）

### 4.1 feature 结构

每个点生成 **1 + ringCount** 个 feature：

| kind   | id 后缀 | 数量/点   | 作用                   |
| ------ | ------- | --------- | ---------------------- |
| `core` | `-core` | 1         | 固定中心点（视觉锚点） |
| `ring` | `-r{i}` | ringCount | 扩散环（按相位错开）   |

### 4.2 动画参数（d3 scale 一次性建好）

```ts
// 半径：eased 0~1 → baseRadius ~ maxRadius（线性）
this.radiusScale = d3.scaleLinear().domain([0, 1]).range([baseRadius, maxRadius]);

// 透明度：phase 0~1 → opacity 1 → 0.15（保留底色，避免环完全消失）
this.opacityOut = d3.scaleLinear().domain([0, 1]).range([1, 0.15]).clamp(true);
```

### 4.3 每帧计算

```ts
// 每个环的相位错开 1/ringCount → 形成连续向外扩散的波纹
const phase = (t + idx / this.ringCount) % 1;
// 半径缓动：sin²(π*phase/2)，phase=0 和 1 时半径相同无跳变
const eased = Math.sin((phase * Math.PI) / 2);
const radius = this.radiusScale(eased);
const opacity = this.opacityOut(phase);
```

**视觉时间线**（3 环示例）：

| phase | 半径 (12→42) | opacity (1→0.15) |
| ----- | ------------ | ---------------- |
| 0     | 12 (最小)    | 1.00（满不透明） |
| 0.25  | 16.5         | 0.79             |
| 0.5   | 27           | 0.58             |
| 0.75  | 37.5         | 0.36             |
| 1     | 42 (最大)    | 0.15（淡出底色） |

中心点（`kind: "core"`）在 **`showCore: true`** 时始终固定在 `baseRadius`、opacity=1、strokeWidth=2，作为视觉锚点；`showCore` 默认为 `false`，此时中心点不渲染（feature 仍存在但完全透明），只有扩散环显示。

### 4.4 中心点显隐（`showCore`）

| 取值 | 视觉效果 | 适用场景 |
|---|---|---|
| `false`（默认） | 仅扩散环 | 干净利落的高亮，强调环本身 |
| `true` | 中心点 + 扩散环 | 需要明确指示"这里有东西" |

```ts
// 隐藏中心点（默认）
EMapUtils.addAnimatePoints({ mode: "ripple", /* showCore: false */ });

// 显示中心点
EMapUtils.addAnimatePoints({ mode: "ripple", showCore: true });
```

中心点样式（`showCore=true` 时）：

```ts
// 等价于：在 baseRadius 处画一个不透明的实心圆（fillColor + strokeColor 同色）
this.eStyle.circle({
    fillColor: toRgbaString(meta.color, 1),
    strokeColor: toRgbaString(meta.color, 1),
    strokeWidth: 2,
    radius: this.baseRadius,
});
```

## 5. breath 模式（原地呼吸）

### 5.1 feature 结构

每个点生成 **1** 个 feature：

| kind     | id 后缀   | 数量/点 | 作用   |
| -------- | --------- | ------- | ------ |
| `breath` | `-breath` | 1       | 呼吸环 |

### 5.2 每帧计算

```ts
// cos 缓动 0~1 平滑（首尾相同，无跳变）
const cosWave = 0.5 - 0.5 * Math.cos(t * Math.PI * 2);
const opacity = this.breathOpacity(cosWave); // 0.15 → 0.95
const radius = avgRadius; // 固定中位半径
```

环为**实心圆**（`fillColor` + `strokeColor` 双重），呼吸时透明度从 0.15 缓慢过渡到 0.95，营造"心跳"感。

## 6. 类 API

### 6.1 类型定义

```ts
type AnimateMode = "ripple" | "breath";

interface IAnimatePoint {
    id: string | number;
    longitude: number;
    latitude: number;
    color?: string; // 可选，覆盖 layer 级 color
}

interface IAnimatePointsLayerOpts {
    map: any; // EMap 地图实例
    EMap: any; // EMap 库引用
    layerId: string; // 图层 id
    points: IAnimatePoint[];
    mode?: AnimateMode; // 默认 'ripple'
    color?: string; // 主色，默认 'rgba(255, 0, 0, 0.9)'
    ringCount?: number; // ripple 环数，默认 3
    baseRadius?: number; // 起始半径（px），默认 12
    maxRadius?: number; // 最大半径（px），默认 42
    duration?: number; // 单周期毫秒，默认 2000
    zIndex?: number; // 图层层级，默认 9998
    showCore?: boolean; // ripple 模式：是否显示中心圆点，默认 false
}
```

### 6.2 实例属性 / 方法

```ts
class AnimatePointsLayer {
    public readonly layer: any; // EMap 矢量图层
    public readonly mode: AnimateMode;
    public readonly duration: number;

    constructor(opts: IAnimatePointsLayerOpts);

    /** 销毁：取消 RAF + 清空 layer features（不主动 removeLayer） */
    destroy(): void;
}
```

## 7. EMapUtils 工厂入口

### 7.1 addAnimatePoints

为保持与现有 `emap-gis` 风格一致（与 `useWFSLayer`、`addEmergencyTransmissionLayer` 同形），在 `emap.ts` 的 `EMapUtils` 中暴露：

```ts
EMapUtils = {
    // ... 现有方法

    /** 添加一组带动画的点（ripple 扩散 / breath 呼吸） */
    addAnimatePoints: (opts: TBaseOpts & {
        layerId: string;
        points: IAnimatePoint[];
        mode?: AnimateMode;
        color?: string;
        ringCount?: number;
        baseRadius?: number;
        maxRadius?: number;
        duration?: number;
        zIndex?: number;
        showCore?: boolean;
    }) => {
        destroy: () => void;
        layer: any;
        instance: AnimatePointsLayer;
    };
}
```

并在 `index.tsx` 中按需导出 `AnimatePointsLayer` 类，供需要细粒度控制的场景使用。

### 7.2 基础用法（ripple）

```ts
import { EMapUtils } from "@/app/components/ui/emap-gis";

const { destroy, layer } = EMapUtils.addAnimatePoints({
    map,
    EMap,
    layerId: "hexinjilouGlow",
    points: [
        { id: 1, longitude: 113.328, latitude: 23.099 },
        { id: 2, longitude: 113.336, latitude: 23.102 },
    ],
    mode: "ripple",
    color: "rgba(255, 0, 0, 0.9)",
    ringCount: 3,
    baseRadius: 12,
    maxRadius: 42,
    duration: 2000,
    zIndex: 100000,
});

// 卸载时
destroy();
```

### 7.3 breath 模式

```ts
const { destroy } = EMapUtils.addAnimatePoints({
    map,
    EMap,
    layerId: "emergencyResourcesBreath",
    points: [{ id: "res-1", longitude: 113.32, latitude: 23.09 }],
    mode: "breath",
    color: "rgba(255, 165, 0, 0.9)", // 橙色
});
```

### 7.4 通过 useEMapUtil Hook

```tsx
import { useEMapUtil } from "@/app/components/ui/emap-gis";

function EmergencyOverlay({ points }: { points: IAnimatePoint[] }) {
    const addAnimatePoints = useEMapUtil("addAnimatePoints");

    useEffect(() => {
        if (!points?.length) return;
        return addAnimatePoints({
            layerId: "emergency-glow",
            points,
            mode: "ripple",
        }).destroy;
    }, [points]);

    return null;
}
```

## 8. 与现有能力的对比

| 能力               | 适用场景              | 动画 | 实现方式                         |
| ------------------ | --------------------- | ---- | -------------------------------- |
| `addPoints`        | 普通点位（图标/名称） | 否   | `eStyle.image` + 静态图标        |
| `addAnimatePoints` | 高亮 / 告警 / 风险点  | 是   | `eStyle.circle` + d3 scale + RAF |

> **演进说明**：旧版本曾使用 `createGlowCanvas`（Canvas 径向渐变） + `gsap.to` 实现类似能力，已被本类替代。新实现：
>
> - 去掉 Canvas 离屏渲染（节省内存）
> - 去掉 gsap 依赖（d3 已足够）
> - 改成类封装 + 工厂入口（与项目内其它图层风格一致）
> - 用 d3 scale 替代手写缓动（声明式、可读性高）

## 9. 样式与配色建议

| 业务场景    | 颜色                     | 推荐模式 |
| ----------- | ------------------------ | -------- |
| 紧急 / 严重 | `rgba(255, 0, 0, 0.9)`   | `ripple` |
| 警告 / 关注 | `rgba(255, 165, 0, 0.9)` | `ripple` |
| 中性 / 普通 | `white`                  | `breath` |
| 安全 / 恢复 | `rgba(0, 255, 0, 0.7)`   | `breath` |
| 信息 / 中转 | `rgba(0, 200, 255, 0.9)` | `breath` |

> 建议配合 `mapFilter: darkTone`（深色滤镜）使用，动画点在深色底图上视觉冲击力最强。`setTileFilterColor` / `refreshTileFilterLayer` 工具可设置深色滤镜。

## 10. 性能注意

- **每实例一个 RAF**：简单直接，若场景需要几百个 AnimatePointsLayer 同时存在，建议改造为全局 RAF + 注册表。
- **每帧 `layer.setStyle(fn)` 遍历本层所有 feature**：用 `idPrefix.startsWith` + `features.find` 两次过滤，规模在百级无压力。
- **预创建 d3 scale**：构造期一次性建好，tick 时直接 `.map()` 调用，零运行时分配。
- **不可变颜色对象**：`color.copy({ opacity })` 每次返回新副本，但只是修改一个字段，比字符串拼接 + parse 链路更轻。

## 11. 完整使用示例

```tsx
import { EMapUtils, useEMapUtil } from "@/app/components/ui/emap-gis";

function CoreBuildingsGlow({ buildings }: { buildings: Array<{ id: number; lng: number; lat: number }> }) {
    const addAnimatePoints = useEMapUtil("addAnimatePoints");

    useEffect(() => {
        if (!buildings?.length) return;
        return addAnimatePoints({
            layerId: "core-buildings-glow",
            points: buildings.map((b) => ({
                id: b.id,
                longitude: b.lng,
                latitude: b.lat,
            })),
            mode: "ripple",
            color: "rgba(255, 0, 0, 0.9)",
            ringCount: 3,
            baseRadius: 12,
            maxRadius: 42,
            duration: 2000,
            zIndex: 100000,
        }).destroy;
    }, [buildings]);

    return null;
}
```

## 12. 依赖

- **d3**（^7.8.5）：已在 `apps/main/package.json` 中声明。提供 `scaleLinear` 缓动 + `color` / `rgb` 颜色处理。
- **EMap SDK**：需 `enableELayer: true`（使用 `eStyle` 与 `EFeature`）。
- **requestAnimationFrame**：浏览器原生支持。

> 已移除对 `gsap` 的依赖（原 `createGlowCanvas` + `gsap.to` 方案被新实现替代）。

## 13. 版本

- **文档版本**: 2.1
- **最后更新**: 2026-06-26
- **变更说明（v2.0 → v2.1）**:
    - **新增** `showCore?: boolean` 选项（`IAnimatePointsLayerOpts` / `EMapUtils.addAnimatePoints`）：ripple 模式下控制中心圆点显隐，默认 `false`（中心点不可见）
    - 新增第 4.4 节「中心点显隐（`showCore`）」：说明视觉效果对照、调用示例、中心点样式
    - 更新第 4.3 节末尾：中心点描述改为"在 `showCore: true` 时"才显示

**变更说明（v1 → v2.0）**:
- **重大重构**：从 `createGlowCanvas` + `gsap.to` 演进为 `AnimatePointsLayer` 类 + `d3.scaleLinear` + RAF
- 新增 `breath` 模式（原地呼吸），原文档仅描述 ripple
- 引入 **固定中心点**（`kind: 'core'`）：ripple 模式下作为视觉锚点，永远固定在最小半径
- 引入 **idPrefix 实例前缀**：tick 内 `startsWith` 过滤本实例 feature，避免与同 layer 上其它动画混淆
- 透明度策略改为「保留底色 0.15」：避免环到达最大半径时突然消失
- 移除对 `gsap` 的依赖，统一由 d3 提供缓动 + 颜色能力
- 新增 `EMapUtils.addAnimatePoints` 工厂入口（与 `useWFSLayer` 风格一致）
