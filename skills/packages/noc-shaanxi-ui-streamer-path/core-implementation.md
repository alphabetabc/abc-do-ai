# StreamerPath 核心实现文档

## 文档元信息

| 字段         | 值                                                                  |
| ------------ | ------------------------------------------------------------------- |
| 文档版本     | v2.3                                                                |
| 最后更新     | 2026-06-24                                                          |
| 同步组件版本 | v2.3（首次发布 portable 自包含版本）                                |
| 配套文档     | [SKILL.md](./SKILL.md) · [portable/README.md](./portable/README.md) |

本文是 `web/components/ui/streamer-path` 实现细节的源码级说明。所有章节都与实际代码对齐，**先读本文再读源码** 能显著降低理解成本。

---

## 1. 核心定位

**StreamerPath 是一个基于 HTML5 Canvas 的流光路径动画组件**，通过对路径点数组做折线分段、累计长度计算、流光尾部-头部逐段采样与颜色/线宽线性插值，实现沿任意折线路径的"流光"动效。

- 渲染后端：纯 Canvas 2D Context，不依赖 SVG、不依赖 CSS 动画
- 动画驱动：`requestAnimationFrame`
- 颜色插值：`d3-interpolate`（或 `d3.interpolate`）
- 零第三方动画库

---

## 2. 文件结构

```
web/components/ui/streamer-path/
├── index.tsx      # 主组件 - 状态、生命周期、动画循环、API 暴露
├── types.ts       # 类型契约 - StreamerProps / StreamerApi / StreamerPoint 等
└── Container.tsx  # 样式容器 - styled-components，负责尺寸与 canvas 定位
```

| 文件            | 职责                                                                  |
| --------------- | --------------------------------------------------------------------- |
| `index.tsx`     | 路径分段累计、自适应尺寸、动画循环、`start/stop/pause` API 暴露与清理 |
| `types.ts`      | 所有对外类型定义，确保调用方类型安全                                  |
| `Container.tsx` | 受控的样式盒子（width / height / 定位），不参与动画逻辑               |

> `Container.tsx` 仅本项目使用 `styled-components`。可移植版（`portable/`）替换为纯内联样式容器。

---

## 3. 核心算法

### 3.1 路径分段与累计长度（Path Segmentation）

将 `points: StreamerPoint[]` 转成可参数化采样的折线模型，**每一段记录起点、终点、段长、起止累计距离**：

```typescript
interface Segment {
    start: StreamerPoint;
    end: StreamerPoint;
    length: number; // 本段欧几里得长度
    startDist: number; // 从路径起点到本段起点的累计长度
    endDist: number; // 从路径起点到本段终点的累计长度
}
```

实现（直接摘自 `index.tsx`）：

```typescript
const segments: Segment[] = [];
let totalLength = 0;

for (let i = 0; i < props.points.length - 1; i++) {
    const p1 = props.points[i];
    const p2 = props.points[i + 1];
    const len = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

    segments.push({
        start: p1,
        end: p2,
        length: len,
        startDist: totalLength,
        endDist: totalLength + len,
    });
    totalLength += len;
}
```

**关键点**：

- 段长直接 `Math.sqrt(dx² + dy²)` 计算。**当前实现没有用 `Math.hypot`**，二者在数值精度上略有差异，但视觉上无影响；如需迁移可替换为 `Math.hypot(dx, dy)` 减少边界浮点误差。
- 累计长度使用 `startDist` / `endDist` 双向记录，二分或线性查找所在段时一次比较即可命中。
- `totalLength` 是流光位置推进与一轮结束判定的唯一基准。

### 3.2 给定距离求坐标（Sample at Distance）

根据路径累计距离反查坐标，是采样与轨道绘制的核心原语：

```typescript
const getPointAtDistance = (segments, totalLength, dist): StreamerPoint | null => {
    if (dist < 0 || dist > totalLength) return null;

    for (const seg of segments) {
        if (dist >= seg.startDist && dist <= seg.endDist) {
            const ratio = (dist - seg.startDist) / seg.length;
            return {
                x: seg.start.x + (seg.end.x - seg.start.x) * ratio,
                y: seg.start.y + (seg.end.y - seg.start.y) * ratio,
            };
        }
    }
    return null;
};
```

**关键点**：

- 当前实现是**线性扫描**，O(n)。段数通常很小（< 100），常数极小，无需二分；如果路径段数极大，可改为二分查找。
- 返回 `null` 表示距离超出路径范围（流光尚未进入或已经离开路径），渲染循环据此跳过该采样点。

### 3.3 流光位置模型（Pixel-based Position）

组件内部用 **像素距离** 而非 `[0, 1]` 归一化进度来表示流光头部的位置：

```typescript
positionRef.current: number  // 流光头部在路径上的累计像素距离
```

- 初始值：`streamerLength`（流光从路径左侧外"飞入"，整体可见后才开始推进）
- 一帧推进：`positionRef.current += speed`
- 一轮结束判定：`positionRef.current > pathData.totalLength + streamerLength`

**关键点**：

- **没有 dt 归一化**：速度直接按"每帧推进 `speed` 像素"实现，帧率依赖。这意味着 60Hz 与 30Hz 下视觉速度不同。如果需要帧率无关，可改造为 `positionRef.current += speed * (dt / 16.67)`。
- `positionRef.current > totalLength + streamerLength` 才认为一轮结束：等流光**整体**移出路径再触发完成回调，避免出现"流光尾巴被截断"的视觉跳跃。

### 3.4 流光采样（Streamer Sampling）

流光从尾部 `(position - streamerLength)` 到头部 `(position)` 的连续区间被离散化为 `steps` 个采样点，每个采样点绘制一段短线：

```typescript
for (let i = 0; i < steps; i++) {
    const ratio = i / steps; // 0 = 尾部, ~1 = 头部
    const currentDist = positionRef.current - (1 - ratio) * streamerLength;
    const nextDist = positionRef.current - (1 - (ratio + 1 / steps)) * streamerLength;

    const p1 = getPointAtDistance(segments, totalLength, currentDist);
    const p2 = getPointAtDistance(segments, totalLength, nextDist);

    if (p1 && p2) {
        const color = d3Interpolate(colors.tail, colors.head)(ratio);
        const currentWidth = lineWidth.tail + ratio * (lineWidth.head - lineWidth.tail);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = currentWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
    }
}
```

**关键点**：

- `ratio = i / steps`（注意分母是 `steps` 而非 `steps - 1`），最后一段 `ratio` 略小于 1，确保线宽/颜色插值在头部时仍在线段内可控。
- 每段微元长度 = `streamerLength / steps`。线段两端都通过 `getPointAtDistance` 求得，过折线拐角时自然弯曲（不会出现折线尖角）。
- `p1` 或 `p2` 为 `null`（距离越界）时该步跳过，因此流光在进入/离开路径时呈自然淡入淡出。

### 3.5 颜色与线宽插值（Color & Width Interpolation）

颜色用 `d3-interpolate` 的线性插值：

```typescript
const color = d3Interpolate(colors.tail, colors.head)(ratio);
```

- 原生支持 `#hex` / `rgb()` / `rgba()` / `hsl()` 等格式，**调用方无需关心颜色格式**，函数内部自动转换。
- 返回值是当前 Canvas 兼容的颜色字符串，可直接赋值给 `strokeStyle`。

线宽用简单线性插值：

```typescript
const currentWidth = lineWidth.tail + ratio * (lineWidth.head - lineWidth.tail);
```

> 这意味着 `lineWidth.tail` 是绘制在流光最尾端的线宽，`lineWidth.head` 是最头部的线宽。

### 3.6 渲染循环（Render Loop）

主循环结构（精简自 `index.tsx`）：

```typescript
const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawTrack(); // 可选：先画轨道

    positionRef.current += speed;

    if (positionRef.current > totalLength + streamerLength) {
        currentRunRef.current += 1;
        onAnimationCompleteRef.current?.();

        const runCount = props.runCount ?? DEFAULT_RUN_COUNT; // 默认 -1
        if (runCount > 0 && currentRunRef.current >= runCount) {
            stopAnimation();
            return;
        }

        if (interval > 0) {
            pauseAnimation();
            intervalTimerRef.current = window.setTimeout(() => {
                resetAnimation();
                setIsPaused(false);
            }, interval);
            return;
        }

        resetAnimation();
    }

    // ... 流光采样与绘制

    animationRef.current = requestAnimationFrame(animate);
};
```

**关键点**：

- **每帧第一步是 `clearRect`**，避免任何残留。
- **轨道先画**，流光后画，保证流光覆盖在轨道之上。
- 一轮结束的副作用顺序：`onAnimationComplete` → runCount 判定 → interval 间隔；任一分支提前 `return`，避免在 `pause` 期间继续 `requestAnimationFrame`。
- `runCount` 默认 `-1`，条件 `runCount > 0` 永不成立 → 无限循环。
- `resetAnimation()` 把 `positionRef.current = -streamerLength`，让流光从路径左侧外重新飞入。

### 3.7 轨道绘制（Track Rendering）

轨道是流光运动路径的"骨架线"，由 `track.visible` 控制：

```typescript
const drawTrack = () => {
    if (!track.visible) return;

    ctx.beginPath();
    ctx.moveTo(segments[0].start.x, segments[0].start.y);
    for (const seg of segments) {
        ctx.lineTo(seg.end.x, seg.end.y);
    }
    ctx.strokeStyle = track.color ?? 'rgba(255,255,255,0.2)';
    ctx.lineWidth = track.width ?? 1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
};
```

**关键点**：

- 仅在 `track.visible = true` 时绘制，默认关闭。
- 默认 `track.color` / `track.width` 在 `useMemorizedObject(props.track ?? DEFAULT_TRACK)` 处已经合并好；这里再次 `??` 是冗余保护。

### 3.8 自适应尺寸（Responsive Sizing）

仅当用户**没有显式传入** `width` / `height` 时启用自适应：

```typescript
const hasExplicitSize = props.width !== undefined || props.height !== undefined;
const size = hasExplicitSize ? null : useSize(containerRef); // 项目内 useSize，内部用 ResizeObserver
```

实际尺寸解析：

```typescript
const width = (props.width ?? measuredWidth) || DEFAULT_WIDTH;
const height = (props.height ?? measuredHeight) || DEFAULT_HEIGHT;
```

`canvas.width / height` 通过独立 `useEffect` 同步：

```typescript
useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
        canvas.width = width;
        canvas.height = height;
    }
}, [width, height]);
```

**关键点 / 已知边界**：

- **当前实现不处理 DPR**。Retina 屏下画布 CSS 尺寸 = canvas.width，但 `devicePixelRatio > 1` 时会出现轻微模糊。如果需要 DPR 适配，应在 `useEffect [width, height]` 中：
    ```typescript
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ```
    并在动画循环中也按 `dpr` 缩放，或单独维护逻辑坐标与物理坐标映射。

### 3.9 API 控制（start / stop / pause）

对外通过 `onCreation` 暴露 `StreamerApi`：

```typescript
const api = useMemo<StreamerApi>(() => ({ start: startAnimation, stop: stopAnimation, pause: pauseAnimation }), []);
useEffect(() => onCreation?.(api), [api]);
```

三个方法的真实实现：

```typescript
const stopAnimation = () => {
    if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
    }
    if (intervalTimerRef.current) {
        clearTimeout(intervalTimerRef.current);
        intervalTimerRef.current = undefined;
    }
    setIsRunning(false);
    setIsPaused(false);
};

const pauseAnimation = () => {
    if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
    }
    setIsPaused(true);
};

const startAnimation = () => {
    if (isPaused) {
        setIsPaused(false); // 从暂停恢复
        return;
    }
    setIsRunning(true);
    setIsPaused(false);
    resetAnimation();
    currentRunRef.current = 0;
};
```

**关键点**：

- **`api` 对象本身**通过 `useMemo([])` 保证引用稳定（三个回调本身由 `useMemoizedFn` 稳定），所以 `useEffect([api])` 只会触发一次 `onCreation`。
- **状态机**：`stopped → running → paused → running | stopped`。`running` ↔ `paused` 由 `isRunning` + `isPaused` 两个 React state 表达；动画循环本身靠 `useEffect` 的依赖 `[isRunning, isPaused]` 自动重启。
- `start()` 的"恢复"逻辑：`if (isPaused)` 时只清 `isPaused` 不重置 position；其它情况重置 position 与 currentRun，相当于"从头开始"。
- `stop()` 不重置 positionRef，但下一帧因为 `isRunning = false`，`useEffect` 早退分支会执行 `ctx.clearRect` 清空画面。
- 动画循环的清理由 `useEffect` 的 `return () => stopAnimation()` 完成，确保组件卸载时 `rafId` 与 `intervalTimer` 都被取消。

---

## 4. 关键 Hooks 使用约定

| 用途         | Hook                 | 真实使用点                                                                     |
| ------------ | -------------------- | ------------------------------------------------------------------------------ |
| 回调引用     | `useLatest`          | `onAnimationComplete`、`onCreation` 进入闭包访问最新值                         |
| 回调函数稳定 | `useMemoizedFn`      | `startAnimation` / `stopAnimation` / `pauseAnimation` / `resetAnimation`       |
| 配置对象稳定 | `useMemorizedObject` | `colors` / `lineWidth` / `track` 三个 options 对象                             |
| 元素尺寸观测 | `useSize`            | 自适应尺寸时观测 `containerRef`（项目内 hook，portable 版为 `useElementSize`） |

> 这些约定都是为了让动画循环的 `useEffect` 依赖数组保持稳定，避免不必要的循环重启。

---

## 5. 生命周期与清理

`useEffect` 的 cleanup 直接调用 `stopAnimation`，已覆盖：

```typescript
return () => {
    stopAnimation();
};
```

`stopAnimation` 内部：

- `cancelAnimationFrame(animationRef.current)`
- `clearTimeout(intervalTimerRef.current)`
- 重置 `isRunning` / `isPaused` 状态

**不需要**额外手动断开 `ResizeObserver`，因为本项目通过 `useSize` hook 封装，对外不暴露 observer ref（portable 版 `useElementSize` 同样在 cleanup 中 `observer.disconnect()`）。

---

## 6. 渲染管线总览

```
┌─────────────────────────────────────────────────────────────────┐
│  points                                                        │
│      ↓                                                         │
│  useMemo: computeSegments + totalLength                        │
│      ↓                                                         │
│  width / height (props ?? useSize() ?? DEFAULT)                 │
│      ↓                                                         │
│  useEffect [pathData, ...] 启动 animate()                       │
│      ↓                                                         │
│  animate()  ─►  clearRect                                      │
│      ├─► drawTrack()  (若 track.visible)                       │
│      └─► 流光采样 steps 次                                      │
│              ├─ getPointAtDistance                             │
│              ├─ d3Interpolate(tail, head)(ratio)               │
│              ├─ lineWidth.tail + ratio * Δ                     │
│              └─ ctx.stroke 短段                                │
│      ↓                                                         │
│  positionRef += speed                                          │
│      ↓                                                         │
│  完成判定 → onAnimationComplete / runCount / interval          │
│      ↓                                                         │
│  requestAnimationFrame(animate)                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. 默认值速查

| 常量                      | 值                                                             |
| ------------------------- | -------------------------------------------------------------- |
| `DEFAULT_COLORS`          | `{ head: '#ffffff', tail: '#0098FF' }`                         |
| `DEFAULT_LINE_WIDTH`      | `{ head: 2, tail: 1 }`                                         |
| `DEFAULT_TRACK`           | `{ visible: false, color: 'rgba(255,255,255,0.2)', width: 1 }` |
| `DEFAULT_WIDTH`           | 800                                                            |
| `DEFAULT_HEIGHT`          | 300                                                            |
| `DEFAULT_STEPS`           | 200                                                            |
| `DEFAULT_RUN_COUNT`       | -1（无限）                                                     |
| `DEFAULT_INTERVAL`        | 0 ms                                                           |
| `DEFAULT_AUTO_START`      | true                                                           |
| `DEFAULT_SPEED`           | 2.5                                                            |
| `DEFAULT_STREAMER_LENGTH` | 220                                                            |

---

## 8. 已知差异 / 可改进点

| 项                     | 当前实现                      | 可改进为                                      |
| ---------------------- | ----------------------------- | --------------------------------------------- |
| 段长计算               | `Math.sqrt(dx²+dy²)`          | `Math.hypot(dx, dy)`（更稳定的边界精度）      |
| 段查找                 | 线性扫描                      | 二分（路径段数极大时有效）                    |
| 帧率无关速度           | 每帧 `+= speed`               | `+= speed * (dt / 16.67)`                     |
| DPR 适配               | 不处理                        | `canvas.width = w * dpr; ctx.scale(dpr, dpr)` |
| 多次 `start()` 幂等性  | 不在 running 状态时也允许重置 | 增加 `if (isRunning) return` 短路             |
| `stop()` 重置 position | 不重置                        | 增加 `positionRef.current = streamerLength`   |

---

## 9. 常见扩展点

| 扩展需求     | 修改位置                       | 注意事项                                     |
| ------------ | ------------------------------ | -------------------------------------------- |
| 新增动画方向 | `index.tsx` 帧推进逻辑         | 倒放需处理 `position < -streamerLength` 边界 |
| 多条流光     | `index.tsx` 状态/循环          | 每条独立 rafId，注意 cleanup                 |
| 透明度渐变   | `colors` 插值                  | `rgba` 会被 d3-interpolate 正确处理          |
| 路径闭合     | `computeSegments`              | 追加 `points[0]` 作为终段终点                |
| 发光/阴影    | `ctx.shadowBlur`               | 性能开销大，慎用                             |
| 鼠标交互     | 新增事件 handler               | 使用 `useMemoizedFn` 包装                    |
| 帧率无关     | `positionRef.current += speed` | 引入 `dt` 记录上一帧时间差                   |

---

## 10. 性能基线

- **steps**：建议 100-300。`steps` 越大流光越平滑，CPU 也越高。
- **track.visible**：始终绘制轨道会增加渲染耗时，按需开启。
- **requestAnimationFrame**：在标签页不可见时浏览器会自动暂停，无需手动处理。
- **path 段数**：线性扫描 `O(n)`，段数 < 100 时不会成为瓶颈；超过则建议改二分。

---

## 11. 调试建议

1. 在 `animate()` 开头 `console.log(positionRef.current, isRunning, isPaused)` 观察循环状态。
2. 临时把 `steps` 调到 50，肉眼可见每个采样点，便于定位插值错误。
3. 用 `ctx.fillStyle = 'red'; ctx.fillRect(x, y, 2, 2)` 单独绘制采样点验证 `getPointAtDistance`。
4. 检查 `positionRef.current` 是否在某帧跳变（例如 NaN / Infinity），通常是 `points` 含非法值。

---

## 12. 与其他模块的关系

- 常被用于**网络覆盖地图**（光流指示链路状态）、**应急保障**（路径流转示意）等大屏场景。
- 与 `ImageGis`（GIS 覆盖图）配合时，通常作为叠加层使用，注意 `z-index` 与 `pointer-events: none`。
- 与数字人交互配合：通过 `onCreation` 暴露 `api`，让数字人控制流光暂停/恢复。

---

## 13. 版本演进说明

| 版本 | 关键变更                                                      |
| ---- | ------------------------------------------------------------- |
| v1.0 | 单段直线动画，固定颜色                                        |
| v1.1 | 多段折线 + 颜色插值 + 完成回调                                |
| v1.2 | 线宽渐变 + `useSize` 自适应                                   |
| v1.3 | 接入 `d3.interpolate`，统一颜色格式                           |
| v2.0 | 运行次数 / 间隔 / `start\|stop\|pause` API / 函数稳定性优化   |
| v2.1 | 轨道呈现（可显隐、自定义颜色与线宽）                          |
| v2.2 | `autoStart` 属性，组件创建时是否自动启动可配置                |
| v2.3 | 发布 `portable/` 自包含版本，可直接拷贝到任意 React + TS 项目 |

---

## 14. 跨项目复用

本文档描述的所有算法（路径分段、采样、颜色插值、渲染循环、自适应尺寸、API 状态机、清理）都是**框架无关**的：唯一的运行时依赖是 `react` + 颜色插值库 + Canvas。

`./portable/` 目录已经把这套实现打包成零项目内依赖的源码包：

- 全部 hooks（`useLatest` / `useMemoizedFn` / `useElementSize` / `useMemorizedObject`）内联在 `hooks.ts`
- 样式容器改为纯内联样式，无 `styled-components`
- 颜色插值替换为 `d3-interpolate`，体积从 d3 全量 ~250KB 降到 ~5KB

复制 `portable/` 目录到目标项目即可使用，详见 [portable/README.md](./portable/README.md)。
