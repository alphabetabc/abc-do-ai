# 001 · ScalerContainer 技术实现与边界

> 性质：组件设计文档（参考）
> 日期：2026-08-11
> 维护规则：本文件不入 `docs/`、不入 Git

---

## 1. 技术实现

### 1.1 DOM 结构

```html
<!-- 外层：撑满父级，relative + overflow 按 mode 动态设置（见 §1.2） -->
<div class="scaler-container" style="width:100%;height:100%;position:relative;overflow:hidden;">
    <!-- 内层：固定设计稿尺寸，absolute 定位，transform scale -->
    <div
        class="scaler-container__inner"
        style="position:absolute;top:0;left:0;width:1920px;height:1080px;transform:scale(0.667);transform-origin:0 0;"
    >
        <!-- children -->
    </div>
</div>
```

> 上例中 `overflow:hidden` 是 `scaleFull`（默认）下的取值；其他 mode 下外层 `overflow` 由组件按 [index.md §2.1](./index.md#21-mode-语义) 的策略动态设置。

### 1.2 关键 CSS

| 属性               | 外层                 | 内层                               |
| ------------------ | -------------------- | ---------------------------------- |
| `width` / `height` | `100%` / `100%`      | `designWidth`px / `designHeight`px |
| `position`         | `relative`           | `absolute`                         |
| `top` / `left`     | -                    | `0` / `0`                          |
| `overflow`         | 按 mode 动态（见下） | -                                  |
| `transform`        | -                    | `scale({scale})`                   |
| `transform-origin` | -                    | `0 0`（左上角）                    |

#### overflow 按 mode 取值

| mode        | 外层 overflow              | 说明                                            |
| ----------- | -------------------------- | ----------------------------------------------- |
| `scaleFull` | `hidden`                   | 完整显示不溢出，裁剪留黑边区域                  |
| `scaleX`    | `hidden`（x）+ `auto`（y） | 宽度填满，垂直溢出可滚动（PC 窗口化查看时常见） |
| `scaleY`    | `auto`（x）+ `hidden`（y） | 高度填满，水平溢出可滚动                        |
| `none`      | `auto`                     | 原始尺寸，两向均可滚动                          |

> 实现上等价于：`scaleFull` → `overflow: hidden`；`scaleX` → `overflow-x: hidden; overflow-y: auto`；`scaleY` → `overflow-x: auto; overflow-y: hidden`；`none` → `overflow: auto`。

### 1.3 缩放计算逻辑

```ts
function calcScale(mode: ScaleMode, containerWidth: number, containerHeight: number, designWidth: number, designHeight: number): number {
    const scaleX = containerWidth / designWidth;
    const scaleY = containerHeight / designHeight;

    switch (mode) {
        case "scaleX":
            return scaleX;
        case "scaleY":
            return scaleY;
        case "scaleFull":
            return Math.min(scaleX, scaleY);
        case "none":
            return 1;
    }
}
```

### 1.4 尺寸监听

使用 `ResizeObserver` 监听外层容器尺寸变化，**debounce 150ms** 后更新 scale 值，避免拖拽窗口时频繁重算卡顿。

```tsx
// 伪代码
const containerRef = useRef<HTMLDivElement>(null);
const [scale, setScale] = useState(1);

useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
        const { width, height } = el.getBoundingClientRect();
        setScale(calcScale(mode, width, height, designWidth, designHeight));
    };

    update(); // 初始计算（立即执行，不 debounce）

    const debouncedUpdate = debounce(update, 150);
    const ro = new ResizeObserver(debouncedUpdate);
    ro.observe(el);
    return () => {
        ro.disconnect();
        debouncedUpdate.cancel?.();
    };
}, [mode, designWidth, designHeight]);
```

**为何不用 `window.resize`**：容器尺寸变化不一定由 window resize 引起（如侧边栏折叠、父级 flex 布局变化），`ResizeObserver` 更精准。

**为何 debounce 150ms**：大屏内含 ECharts 图表，拖拽窗口时 `ResizeObserver` 会高频触发，每次 setScale 导致子组件重渲染。150ms 在视觉延迟和性能之间取得平衡。首次计算不 debounce，确保首屏立即正确。

### 1.5 Context 分离

**两个独立 Context** 避免不必要的重渲染：

| Context              | 值类型                              | 变化时机                       | 影响范围                     |
| -------------------- | ----------------------------------- | ------------------------------ | ---------------------------- |
| `ScalerContext`      | `number`                            | ResizeObserver 触发 scale 重算 | 仅 `useScaler()` 调用者      |
| `OverlayRootContext` | `RefObject<HTMLDivElement \| null>` | 组件挂载时创建，之后不变       | 仅 `useOverlayRoot()` 调用者 |

```tsx
// context.ts
export const ScalerContext = createContext<number>(1);
export function useScaler(): number { ... }

// overlay-context.ts
export const OverlayRootContext = createContext<RefObject<HTMLDivElement | null>>({ current: null });
export function useOverlayRoot(): RefObject<HTMLDivElement | null> { ... }
```

**scale 使用场景**：

- ECharts 图表根据 scale 动态调整字体大小、间距
- 绝对定位的元素根据 scale 校正偏移量
- 需要感知缩放比例的自定义交互组件

**overlay 使用场景**：

- 子组件通过 `ReactDOM.createPortal` 将模态框、动态浮层等渲染到 overlay 挂载点
- 挂载点位于内层容器内，跟随 scale 缩放

### 1.6 Overlay 挂载点

ScalerContainer 在内层容器内提供一个空的 `div` 作为 overlay 挂载点，子组件通过 `createPortal` 将内容渲染到此挂载点，**跟随 scale 缩放**。

```html
<div class="scaler-container__inner" style="transform: scale(0.667); ...">
    <!-- children -->
    <!-- overlay 挂载点：空 div，供子组件 createPortal 使用 -->
    <div ref="{overlayRootRef}" class="scaler-container__overlay-root" style="position:absolute;top:0;left:0;width:0;height:0;pointer-events:none;">
        <!-- Portal 内容将挂载于此 -->
    </div>
</div>
```

| 属性     | 值                                     | 说明                                                                  |
| -------- | -------------------------------------- | --------------------------------------------------------------------- |
| 定位     | `position: absolute; top: 0; left: 0`  | 与内层容器坐标原点对齐                                                |
| 尺寸     | `width: 0; height: 0`                  | 纯挂载点，本身不占空间；Portal 内容自行管理尺寸                       |
| 缩放     | 跟随内层 `transform: scale()`          | 与 children 在同一变换坐标系                                          |
| 事件     | `pointer-events: none`（挂载点容器层） | 默认不拦截事件；Portal 内部内容可自行设置 `pointer-events: auto` 恢复 |
| 内容来源 | 子组件 `createPortal`                  | 由子组件自行管理生命周期（挂载/卸载）                                 |

### 1.7 全屏渲染（enableFullScreen）

当 `enableFullScreen={true}` 时，ScalerContainer 通过 `ReactDOM.createPortal` 将外层容器渲染到 `document.body`，并使用 `position: fixed; inset: 0` 铺满整个浏览器视口。

```html
<!-- createPortal 目标：document.body -->
<body>
    <!-- ...原有 DOM... -->

    <!-- 全屏层：fixed 铺满视口 -->
    <div class="scaler-container scaler-container--fullscreen" style="position:fixed;inset:0;width:100vw;height:100vh;z-index:9999;overflow:hidden;">
        <!-- 内层结构与非全屏模式完全一致 -->
        <div
            class="scaler-container__inner"
            style="position:absolute;top:0;left:0;width:1920px;height:1080px;transform:scale(0.667);transform-origin:0 0;"
        >
            <!-- children -->
            <div ref="{overlayRootRef}" class="scaler-container__overlay-root" style="..."></div>
        </div>
    </div>
</body>
```

| 属性       | 值                                | 说明                                                         |
| ---------- | --------------------------------- | ------------------------------------------------------------ |
| 挂载目标   | `document.body`                   | 通过 `createPortal` 脱离原 DOM 层级                          |
| 定位       | `position: fixed; inset: 0`       | 铺满整个浏览器视口，不受页面滚动影响                         |
| 尺寸       | `100vw × 100vh`                   | 视口尺寸，ResizeObserver 监听此元素                          |
| `z-index`  | `fullScreenZIndex`（默认 `9999`） | 确保覆盖页面上其他元素                                       |
| `overflow` | 按 mode 策略（同非全屏模式）      | 见 §1.2                                                      |
| 切换行为   | `enableFullScreen` false→true     | 外层从原位置 `createPortal` 到 body；true→false 时回到原位置 |

**实现要点**：

```tsx
// 伪代码
function ScalerContainer({ enableFullScreen, fullScreenZIndex = 9999, ...rest }) {
    const container = (
        <div
            ref={containerRef}
            className={cn("scaler-container", enableFullScreen && "scaler-container--fullscreen")}
            style={{
                ...(enableFullScreen
                    ? { position: "fixed", inset: 0, width: "100vw", height: "100vh", zIndex: fullScreenZIndex }
                    : { width: "100%", height: "100%", position: "relative" }),
                ...rest.style,
            }}
        >
            {/* 内层 + overlay 挂载点，结构不变 */}
        </div>
    );

    return enableFullScreen ? createPortal(container, document.body) : container;
}
```

- **不使用浏览器 Fullscreen API**（`requestFullscreen`），避免：用户交互触发限制、浏览器兼容性差异、ESC 退出不可控
- **内层结构不变**：无论是否全屏，内层 `transform: scale()` + overlay 挂载点逻辑完全一致，子组件无感知
- **scale 重算**：`enableFullScreen` 切换时外层尺寸变化，`ResizeObserver` 自动触发 scale 重算

---

## 2. 边界情况

| 场景                                 | 处理                                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| 容器尺寸为 0（父级未布局完成）       | `getBoundingClientRect` 返回 0 → scale 为 0 → 内容不可见但不报错；`ResizeObserver` 会在父级布局完成后触发更新 |
| `designWidth` 或 `designHeight` 为 0 | 避免 `NaN`：calcScale 中做守卫，若 designWidth/Height ≤ 0 则 scale = 1                                        |
| `mode` 动态切换                      | useEffect 依赖 mode，重新计算；**同时更新外层 overflow 策略**（见 §1.2）                                      |
| SSR 首屏                             | `ResizeObserver` 仅在客户端可用；组件为纯客户端渲染（大屏页面不做 SSR）                                       |
| PC 窗口化查看（scaleX 高度溢出）     | 外层 `overflow-y: auto`，垂直方向出现滚动条；内层 `transform-origin: 0 0` 保证从顶部开始缩放，滚动可见下方    |
| PC 窗口化查看（scaleY 宽度溢出）     | 外层 `overflow-x: auto`，水平方向出现滚动条                                                                   |
| 滚动条与 ECharts 交互                | 滚动发生在内层 transform 之外的外层容器，不影响 ECharts 内部坐标计算；图表 resize 仍由 scale 变化驱动         |
| `enableFullScreen` 切换              | `createPortal` 挂载/卸载到 `document.body`；`ResizeObserver` 监听元素变化，自动重算 scale                     |
| 全屏模式下的 body 滚动               | 全屏层 `position: fixed` 不影响 body 滚动；若需锁定背景滚动，由调用方自行控制 `body.style.overflow`           |
| `document.body` 不可用（SSR）        | 组件为纯客户端渲染，`createPortal` 目标在客户端确定；SSR 场景大屏页面不做 SSR，不触发                         |

---

## 3. 已确认决策

- [x] **暴露 scale 给子组件**：通过独立 `ScalerContext`（`useScaler()` hook）向下传递
- [x] **overlay 挂载点独立 Context**：`OverlayRootContext` 单独传递 `overlayRootRef`，与 scale 解耦避免不必要重渲染
- [x] **debounce ResizeObserver**：150ms，首次计算不 debounce
- [x] **overlay 挂载点尺寸**：`width: 0; height: 0`，纯挂载点，Portal 内容自行管理尺寸
- [x] **Fast Refresh 兼容**：`index.tsx` 只导出组件，Context 和工具函数分文件
- [x] **全屏方案**：`enableFullScreen` prop + `createPortal` 到 `document.body` + `position: fixed; inset: 0`，不使用浏览器 Fullscreen API
- [ ] 是否需要 `bgColor` prop：暂不需要，用外层 `style` 透传

---

## 4. 相关文档

- [概述与使用示例](./index.md)
