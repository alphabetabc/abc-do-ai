# 001 · ScalerContainer 缩放适配容器

> 性质：组件设计文档（概述）
> 日期：2026-08-11
> 维护规则：本文件不入 `docs/`、不入 Git

---

## 1. 用途

大屏可视化场景下的**固定设计稿尺寸 → 自适应缩放**容器。

外层容器撑满父级（宽高 100%），内层容器按 `designWidth × designHeight` 固定尺寸渲染，通过 CSS `transform: scale()` 缩放适配外层可用空间。

### 1.1 适用场景

- 4 个大屏页面（人员 / 辽宁信访 / 进京信访 / 信访比对）
- 设计稿尺寸固定（如 1920×1080 / 2K），需在不同分辨率屏幕上等比缩放展示
- 图表组件（ECharts）需要固定像素尺寸来正确渲染

### 1.2 不适用

- 普通管理端列表页（用流式布局 + Ant Design Grid）
- 需要真正响应式断点的页面

---

## 2. Props 设计

```tsx
type ScaleMode = "scaleX" | "scaleY" | "scaleFull" | "none";

interface ScalerContainerProps {
    /** 设计稿宽度（px），如 1920 */
    designWidth: number;
    /** 设计稿高度（px），如 1080 */
    designHeight: number;
    /** 缩放模式，默认 'scaleFull' */
    mode?: ScaleMode;
    /** 是否全屏渲染（createPortal 到 body，fixed 铺满视口），默认 false */
    enableFullScreen?: boolean;
    /** 全屏层 z-index，默认 9999 */
    fullScreenZIndex?: number;
    /** 外层容器 className */
    className?: string;
    /** 外层容器内联样式 */
    style?: React.CSSProperties;
    children?: React.ReactNode;
}
```

### 2.1 mode 语义

| mode        | scale 计算                               | 效果                                       | 外层 overflow 策略                     |
| ----------- | ---------------------------------------- | ------------------------------------------ | -------------------------------------- |
| `scaleX`    | `scale = containerWidth / designWidth`   | 以宽度为基准等比缩放，高度可能溢出或留白   | `overflow-y: auto`（垂直溢出可滚动）   |
| `scaleY`    | `scale = containerHeight / designHeight` | 以高度为基准等比缩放，宽度可能溢出或留白   | `overflow-x: auto`（水平溢出可滚动）   |
| `scaleFull` | `scale = min(cw/dw, ch/dh)`              | 等比缩放完整显示不变形，可能留黑边（默认） | `overflow: hidden`（不溢出，无需滚动） |
| `none`      | `scale = 1`                              | 不缩放，按原始设计稿尺寸显示               | `overflow: auto`（两向均可滚动）       |

> 所有 mode 均为 **等比缩放**（transform X/Y 使用同一个 scale 值，不变形）。
>
> **滚动条策略**：外层 `overflow` 按 mode 自动设置，无需调用方关心。PC 窗口化查看大屏时，`scaleX`/`scaleY` 溢出方向会出现滚动条，便于查看被裁剪区域；`scaleFull` 保证完整显示，不产生滚动条。

### 2.2 默认值

| Prop               | 默认值        |
| ------------------ | ------------- |
| `mode`             | `'scaleFull'` |
| `enableFullScreen` | `false`       |
| `fullScreenZIndex` | `9999`        |
| `className`        | -             |
| `style`            | -             |

---

## 3. 文件位置

| 类型     | 路径                                                                       |
| -------- | -------------------------------------------------------------------------- |
| 组件代码 | `frontend/src/components/large-screen/scaler-container/index.tsx`          |
| Context  | `frontend/src/components/large-screen/scaler-container/context.ts`         |
| Overlay  | `frontend/src/components/large-screen/scaler-container/overlay-context.ts` |
| 工具函数 | `frontend/src/components/large-screen/scaler-container/utils.ts`           |

> 遵循项目约定：kebab-case 目录名，组件名 PascalCase（`ScalerContainer`），入口文件 `index.tsx`。

---

## 4. 使用示例

### 4.0 基本用法 + overlay

```tsx
import { createPortal } from "react-dom";
import { ScalerContainer } from "@/components/large-screen/scaler-container";
import { useScaler } from "@/components/large-screen/scaler-container/context";
import { useOverlayRoot } from "@/components/large-screen/scaler-container/overlay-context";

function PersonnelScreen() {
    return (
        <ScalerContainer designWidth={1920} designHeight={1080} mode="scaleFull">
            {/* 内部所有布局按 1920×1080 设计稿坐标来写 */}
            <div style={{ position: "absolute", top: 100, left: 50 }}>
                <PersonnelAgeChart />
            </div>
            <div style={{ position: "absolute", top: 400, left: 960 }}>
                <PersonnelMap />
            </div>
        </ScalerContainer>
    );
}

// 子组件内：获取 scale + 使用 createPortal 渲染 overlay
function PersonnelMap() {
    const scale = useScaler(); // 仅 scale 变化时重渲染
    const overlayRootRef = useOverlayRoot(); // 永不重渲染（ref 稳定）
    const [showModal, setShowModal] = useState(false);
    const [region, setRegion] = useState(null);

    const handleClick = (r) => {
        setRegion(r);
        setShowModal(true);
    };

    return (
        <>
            <EChartsMap onClick={handleClick} fontScale={scale} />
            {showModal &&
                overlayRootRef.current &&
                createPortal(
                    <div style={{ pointerEvents: "auto" }}>
                        <RegionDetailModal region={region} onClose={() => setShowModal(false)} />
                    </div>,
                    overlayRootRef.current,
                )}
        </>
    );
}
```

### 4.1 全屏模式

```tsx
import { useState } from "react";
import { ScalerContainer } from "@/components/large-screen/scaler-container";

function PersonnelScreen() {
    const [fullScreen, setFullScreen] = useState(false);

    return (
        <>
            {/* 工具栏：切换全屏 */}
            <button onClick={() => setFullScreen((v) => !v)}>{fullScreen ? "退出全屏" : "全屏"}</button>

            {/* enableFullScreen=true 时，ScalerContainer 通过 createPortal 渲染到 document.body */}
            <ScalerContainer designWidth={1920} designHeight={1080} enableFullScreen={fullScreen}>
                <PersonnelAgeChart />
                <PersonnelMap />
            </ScalerContainer>
        </>
    );
}
```

### 4.2 mode 选择建议

| 场景                                 | 推荐 mode           |
| ------------------------------------ | ------------------- |
| 标准大屏（1920×1080 设计稿，不变形） | `scaleFull`（默认） |
| 宽屏拉伸优先填满宽度                 | `scaleX`            |
| 竖屏或高度优先填满                   | `scaleY`            |
| 调试 / 不缩放                        | `none`              |

---

## 5. 相关文档

- [技术实现与边界情况](./reference.md)
