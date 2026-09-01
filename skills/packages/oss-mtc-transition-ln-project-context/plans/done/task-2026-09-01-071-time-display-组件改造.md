# Task · 2026-09-01-071-time-display-组件改造

> 状态：✅ 完成 → done/
> 类型：编码 + L3 文档登记（迭代型：4 次迭代）
> 创建：2026-09-01
> 前置：无
> 关联依据：仓库根 `AGENTS.md` §3 前端目录约定 / §5 大屏开发通用要点 / §6 命名与代码风格 / §10 L1/L2/L3 文档修改门禁；技能 `oss-mtc-transition-ln-project-context` 下 `design/004-big-screen-architecture.md`（共享组件定位）
> 迭代摘要：
> - **迭代 1**：TimeDisplay 组件改造 + 042 共享组件 015 登记（去除 Next.js 导入 + Props 化 + docs 双件套）
> - **迭代 2**：Header 顶部栏拆分（左侧日期 / 右侧时间）—— TimeDisplay `mode` 属性 + Header 三段式布局
> - **迭代 3**：`<FullscreenButton />` 移入 Header + hover-reveal 模式（避免遮挡时间）
> - **迭代 4**：FullscreenButton 形态重构（SVG 触发器 + hover 展开）+ 配色统一到 SVG 主色 `rgb(0, 184, 255)`

---

## 0. 任务信息

| 项        | 值                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 编号-slug | 2026-09-01-071-time-display-组件改造                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 任务类型  | 编码 + L3 文档登记                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 影响范围  | **迭代 1（time-display 组件本体）**：`frontend/src/components/large-screen/time-display/index.tsx`（**L1 自由**，编码改动）；`docs/specs/042-components-common/015-time-display/{spec.md, data-model.md}`（**L3 严控**，需走提案审批，本 task 内由用户直接授权落行）；`docs/specs/042-components-common/README.md`（**L3 严控**，同步登记）；**迭代 2（Header 顶部栏拆分）**：`frontend/src/pages/visual/big-screen/components/header/index.tsx`（**L1 自由**，消费方布局调整）；**迭代 3（FullscreenButton 移入 + hover-reveal）**：`frontend/src/pages/visual/big-screen/components/fullscreen-button/index.tsx`（**L1 自由**，增加 `style` prop）；`frontend/src/pages/visual/big-screen/components/header/index.tsx`（**L1 自由**，接入 FullscreenButton + hover-reveal）；`frontend/src/pages/visual/big-screen/index.tsx`（**L1 自由**，移除 FullscreenButton 渲染 + 透传 props）；**迭代 4（FullscreenButton 形态重构 + 配色优化）**：`frontend/src/pages/visual/big-screen/components/fullscreen-button/index.tsx`（**L1 自由**，结构重构 + 配色统一）；资源引用 `frontend/public/static/images/full-screen-{show,hidden}.svg`（既有，未变动） |
| 验收标准  | ① 组件去除 Next.js 专用 `"use client"` 与 `next/image`（本项目为 Vite + React 19，前述导入将导致运行时报错）；② 提供 `TimeDisplayProps`（mode / dateFormat / timeFormat / intervalMs / placeholder / showIcon / icon / className 等可配置项）；③ Header 顶部栏拆分——左日期 / 右时间；④ `<FullscreenButton />` 从 `index.tsx` 移入 Header，并实现 hover-reveal 模式（移入右侧时间区域时显示，离开时隐藏，避免遮挡时间）；⑤ `pnpm tsc --noEmit` 0 新增错误；⑥ `docs/specs/042-components-common/015-time-display/{spec.md,data-model.md}` 双件套落地；⑦ `042-components-common/README.md` §2 / §6 登记 015 条目；⑧ `Grep "\.trae/\|agents\.md\|\.local-\|task-\d+" docs/` 0 命中；⑨ task 归档 + roadmap §3 / §5 同步；⑩ 迭代 4：FullscreenButton 结构 = wrapper `<div position:fixed>`（hover 控制 `show` 状态） + 始终可见 SVG trigger（`full-screen-show.svg`/`full-screen-hidden.svg` 按 `show` 切换） + 条件渲染 `<button>`（hover 展开 antd icon 按钮）；配色统一到 SVG 主色 `rgb(0, 184, 255)`（background / border / boxShadow 三处 + onMouseEnter/onMouseLeave hover 状态） |

---

## 1. 背景与目标

### 1.1 当前实现问题

`frontend/src/components/large-screen/time-display/index.tsx` 当前实现存在以下与项目栈不符的问题：

| 问题                             | 原因                                             | 影响                                                               |
| -------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------ |
| 文件首 `"use client"` 指令       | Next.js App Router 客户端组件指令                | Vite 项目无效（无副作用，但误导 + 与本仓库其他大屏组件不一致）     |
| `import Image from "next/image"` | Next.js 图片优化组件                             | **运行/编译时报错**：`Module not found: Can't resolve 'next/image` |
| `useIsomorphicLayoutEffect`      | ahooks 提供的 SSR 守卫版本                       | 本项目为 Vite SPA 无 SSR，用 `useEffect` 即可                      |
| `useSetState({ ymd, hms })`      | ahooks 的部分更新 setter                         | 组件仅两个字段，`useState(dayjs())` 更直接                         |
| 无 Props 配置                    | 日期/时间格式写死「YYYY年MM月DD日」/「HH:mm:ss」 | 大屏复用受限（如需英文格式或调整粒度只能改组件）                   |

### 1.2 改造目标

1. **栈对齐**：去除 Next.js 导入；统一用 React 19 + ahooks `useEffect`；Vite 处理 PNG 资源（`import icon from './icon.png'` 返回 URL）原生支持
2. **可配置**：暴露 `TimeDisplayProps`，允许消费方调整日期/时间格式、刷新间隔、占位、是否显示 icon、外层类名
3. **代码风格对齐**：参考 `data-status/index.tsx` / `info-card/index.tsx` 等大屏共享组件（命名导出 + Props interface + JSDoc 注释 + 文件头注释）

### 1.3 迭代 2 触发问题（Header 布局需求）

用户在迭代 1 完成后提出 PM 需求：顶部栏希望**左侧显示年月日 / 右侧显示时分秒**（替代原整组显示），形成对称视觉。

| 问题                           | 原因                                            | 影响                                            |
| ------------------------------ | ----------------------------------------------- | ----------------------------------------------- |
| 整组显示位置固定（左侧或顶部） | 原 TimeDisplay 内部 icon + date + time 三段绑死 | 无法满足大屏顶部栏"左日期 + 右时间"对称布局需求 |
| 拆分需要组件支持               | 当时组件无 mode 字段                            | 必须新增 mode 控制渲染哪几段                    |

### 1.4 迭代 3 触发问题（FullscreenButton 与时间重叠）

原 `index.tsx` 中 `<FullscreenButton active={...} onToggle={...} />` 以 `position: fixed; top: 16; right: 24` 独立浮动于视口右上角，**与右侧时间区域在视觉上重叠**（设计 1920×1080 下，Header 右侧时间也在 top: 10 附近）。

| 问题                      | 原因                                                         | 影响                               |
| ------------------------- | ------------------------------------------------------------ | ---------------------------------- |
| 按钮遮挡时间显示          | `position: fixed` 锚定视口右上角，与 Header 右侧时间区域重叠 | 用户看时间时被按钮遮盖             |
| 按钮位置散落              | 按钮与 Header 顶部栏其他元素（日期/导航/时间）分散在不同组件 | 后续调整位置需要在两处文件之间反复 |
| FullscreenButton 不易复用 | `position: fixed` 硬编码，无法纳入父容器 flex 布局           | 嵌入其他场景受限                   |

### 1.5 迭代 4 触发问题（按钮形态 + 配色优化）

迭代 3 落行后，用户基于实际运行效果提出两个新需求：
- **按钮形态**：希望始终显示一个 SVG 触发器（hover 时旁边展开完整按钮），而非按钮直接占据空间
- **配色**：当前 `rgb(3, 247, 255)` cyan 与 SVG 主色域（`rgb(3, 122, 255)` 外填 + `rgb(0, 184, 255)` 内描边）不搭

| 问题                              | 原因                                                          | 影响                              |
| --------------------------------- | ------------------------------------------------------------- | --------------------------------- |
| 按钮始终占据 Header 区域         | hover 离开后按钮 hidden 但 wrapper paddingLeft 56 永远预留     | 浪费顶部栏水平空间                |
| Cyan 配色与 SVG 跳脱             | SVG 主色是蓝色（`rgb(0, 184, 255)`），cyan 是箭头强调色         | 视觉上按钮与图标像两个独立元素   |
| 配色链路不统一（cyan vs blue）    | 部分颜色已切到 cyan，部分还停留在原 `rgba(96, 195, 255, *)` 蓝色 | hover 时颜色闪烁                  |

---

## 2. 设计定稿

### 2.1 对外 API

```tsx
export type TimeDisplayMode = "date" | "time" | "both";

export interface TimeDisplayProps {
    /** 渲染模式，默认 'both' */
    mode?: TimeDisplayMode;
    /** 自定义日期格式（dayjs 格式串），默认「YYYY年MM月DD日」 */
    dateFormat?: string;
    /** 自定义时间格式（dayjs 格式串），默认「HH:mm:ss」 */
    timeFormat?: string;
    /** 刷新间隔（ms），默认 1000 */
    intervalMs?: number;
    /** 日期占位（首帧 / SSR fallback） */
    datePlaceholder?: string;
    /** 时间占位 */
    timePlaceholder?: string;
    /** 是否显示左侧 icon，默认 true（mode='time' 时建议显式传 false） */
    showIcon?: boolean;
    /** icon 替代（自定义图标 URL/节点），覆盖默认 icon.png */
    icon?: string;
    /** 外层类名 */
    className?: string;
}
```

### 2.2 实现要点

- 用 `useState(() => dayjs())` 存当前时间；`useEffect` 启动 `setInterval(intervalMs)`；返回清理函数 `clearInterval`
- 渲染：`<div className="flex gap-x-2 time-display--root items-center">` + 可选 `<img>` + 两个 `<span>`
- 视觉布局与现有 `index.css`（`.year-month-day` / `.time`）100% 兼容
- 占位策略：`dayjs().format('YYYY年MM月DD日')` 一定返回非空字符串，正常情况下首帧就显示真实时间；占位 props 仅作为父级 layout 兜底参考
- Vite 资源：`import icon from './icon.png'` 返回 URL 字符串，可直接用于 `<img src={icon}>`

### 2.3 改造前后对比

```tsx
// 改造前（Next.js 风格，Vite 项目下运行报错）
"use client";
import Image from "next/image";
import { useSetState, useIsomorphicLayoutEffect } from "ahooks";
// ...

// 改造后（Vite + React 19 风格）
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import icon from "./icon.png";
import "./index.css";
// ...
```

### 2.4 Header 改造要点（迭代 2）

**布局结构变化**：

```tsx
// 改造前：居中（top: 10, left: 50%, translateX(-50%)）
<div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex' }}>
    <div>左组 nav</div>
    <div width={750}>中间大标题</div>
    <div>右组 nav</div>
</div>

// 改造后：全宽三段式（top: 10, left: 0, right: 0, justify-content: space-between）
<div style={{ position: 'absolute', top: 10, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 32px' }}>
    <div><TimeDisplay mode="date" /></div>          {/* 左：日期 */}
    <div style={{ display: 'flex', alignItems: 'center' }}>   {/* 中：原 nav + title 居中组 */}
        <div>左组 nav</div>
        <div width={750}>中间大标题</div>
        <div>右组 nav</div>
    </div>
    <div><TimeDisplay mode="time" showIcon={false} /></div>   {/* 右：时间 */}
</div>
```

关键变化：

- 由居中（`left: 50%; transform: translateX(-50%)`）→ 全宽（`left: 0; right: 0; padding: 0 32px` + `justifyContent: 'space-between'`）
- 新增左/右两个 `<TimeDisplay>` 节点，中间保留原导航+大标题组（结构不变）
- 接受外部传入 `isFullscreen` + `onToggleFullscreen`（迭代 3 用）

### 2.5 FullscreenButton 改造要点（迭代 3）

**`style` prop 支持**：

```tsx
interface FullscreenButtonProps {
    active: boolean;
    onToggle: () => void;
    /** 自定义样式覆盖（晚于默认值 merge） */
    style?: React.CSSProperties;
}

// 内部 merge：{ ...defaults, ...style }，父级可覆盖 position/top/right 等定位字段
```

**Header hover-reveal 实现**：

```tsx
const FULLSCREEN_BTN_AREA = 40 + 16; // 按钮宽 + 间距

const [hoverRightArea, setHoverRightArea] = useState(false);

// 右侧时间 wrapper：paddingLeft 扩展 hover 区域至按钮位置
<div
    onMouseEnter={() => setHoverRightArea(true)}
    onMouseLeave={() => setHoverRightArea(false)}
    style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        paddingLeft: FULLSCREEN_BTN_AREA, // 40 (按钮) + 16 (gap) = 56
    }}
>
    {/* 按钮：absolute 锚定 wrapper 右边缘（视口右上角），hover 时淡入 */}
    <div
        style={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: hoverRightArea ? 1 : 0,
            pointerEvents: hoverRightArea ? 'auto' : 'none',
            transition: 'opacity 0.2s',
        }}
    >
        <FullscreenButton
            active={isFullscreen}
            onToggle={onToggleFullscreen}
            style={{ position: 'static' }} // 覆盖 FullscreenButton 默认 'position: fixed'
        />
    </div>
    <TimeDisplay mode="time" showIcon={false} />
</div>;
```

设计要点：

- **`paddingLeft: 56` 关键作用**：使 wrapper 的 hover 检测区域向左扩展 56px，覆盖按钮所在位置（按钮锚定在 wrapper 右边缘，wrapper 自身的 paddingLeft 给 hover 检测用，避免鼠标从时间移到按钮途中 mouseleave 导致按钮消失）
- **`position: absolute` + `right: 0`**：按钮锚定 wrapper 右边缘（视口右上角），hover 时与时间区域重叠——但仅在 hover 期间出现，默认隐藏时 `opacity: 0` + `pointerEvents: none`，不遮挡时间
- **`pointerEvents` 联动**：按钮隐藏时 `none`（点击穿透到背景）+ 显示时 `auto`（可点击）
- **`opacity` transition 0.2s**：丝滑淡入淡出

**关注点分离**：

- `isFullscreen` 状态拥有者 = `pages/visual/big-screen/index.tsx`（page 层）
- 渲染者 = `Header`（view 层）通过 props 透传
- `FullscreenButton` 仅接收 `active` + `onToggle`，无内部状态

### 2.6 index.tsx 改造要点（迭代 3）

```tsx
// 改造前
import FullscreenButton from './components/fullscreen-button';
// ...
<Background />
<Header />
<FullscreenButton active={isFullscreen} onToggle={toggleFullscreen} />  // 独立浮动
<Suspense fallback={<PageLoading>}>...</Suspense>

// 改造后
// 移除 FullscreenButton import
// ...
<Background />
<Header isFullscreen={isFullscreen} onToggleFullscreen={toggleFullscreen} />  // 透传给 Header
<Suspense fallback={<PageLoading>}>...</Suspense>
```

关键变化：
- 移除 `<FullscreenButton />` 渲染节点
- 移除 `import FullscreenButton from './components/fullscreen-button'`
- `isFullscreen` + `toggleFullscreen` 状态仍在 index.tsx 持有（page 层职责）
- Header 通过 props 透传，渲染由 Header 内部组织（hover-reveal）

### 2.7 FullscreenButton 形态重构（迭代 4）

**最终结构**（SVG 触发器 + hover 展开 antd 图标按钮）：

```tsx
export default function FullscreenButton({ active, onToggle, style }: FullscreenButtonProps) {
    const [show, setShow] = useState(false);  // 内部 hover-show 状态

    return (
        <div
            style={{
                position: 'fixed',
                top: 16,
                right: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(2px)',
                overflow: 'hidden',
            }}
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            {/* 始终可见的 SVG 触发器（hover 时切换箭头方向） */}
            <img
                src={resolvePublicAssetUrl(
                    `/static/images/${show ? 'full-screen-hidden.svg' : 'full-screen-show.svg'}`,
                )}
                alt="全屏"
                style={{ width: 14, height: 40, cursor: 'pointer' }}
            />
            {/* hover 时展开的完整按钮（带 antd 图标） */}
            {show && (
                <button
                    type="button"
                    onClick={() => {
                        setShow(false);
                        onToggle();
                    }}
                    title={active ? '退出全屏' : '全屏显示'}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 40,
                        height: 40,
                        padding: 0,
                        cursor: 'pointer',
                        color: 'rgba(255, 255, 255, 0.92)',
                        fontSize: 20,
                        background: 'rgba(0, 184, 255, 0.1)',
                        border: '1px solid rgb(0, 184, 255)',
                        borderLeft: 'none',          // 与 SVG trigger 拼接，无左侧分割
                        boxShadow: '0 0 8px rgba(0, 184, 255, 0.2)',
                        userSelect: 'none',
                        opacity: 1,
                        transition: 'background 0.2s, border-color 0.2s, opacity 0.2s',
                        ...style,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 184, 255, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 184, 255, 0.1)';
                    }}
                >
                    {active ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                </button>
            )}
        </div>
    );
}
```

**关键设计点**：

| 设计点 | 说明 |
| --- | --- |
| **始终可见的 SVG 触发器** | `<img src=full-screen-show.svg>` 固定渲染在 wrapper 左侧（14×40px），作为视觉锚点 |
| **hover 切换 SVG 方向** | `show=false` 显示 `full-screen-show.svg`（箭头朝上 = "展开"）；`show=true` 显示 `full-screen-hidden.svg`（箭头朝下 = "收起"） |
| **hover 展开完整按钮** | `{show && <button>...</button>}` 条件渲染——`show=true` 时按钮滑出，`false` 时隐藏 |
| **wrapper hover 控制 `show`** | `<div onMouseEnter onMouseLeave>` 控制 `show` 状态，覆盖整个 SVG+button 区域 |
| **button click 关闭** | 点击按钮先 `setShow(false)` 再 `onToggle()`，避免视觉与状态不同步 |
| **`borderLeft: 'none'`** | 按钮与 SVG trigger 拼接处无左侧描边，形成连续视觉整体 |
| **`overflow: hidden`** | wrapper 隐藏任何溢出（如 button 展开过程中的过渡溢出）|
| **`backdropFilter: 'blur(2px)'`** | wrapper 整体添加毛玻璃效果（继承自 button） |

**配色链路（统一到 SVG 主色 `rgb(0, 184, 255)`）**：

| 状态 | background | border | boxShadow |
| --- | --- | --- | --- |
| 默认 | `rgba(0, 184, 255, 0.1)` | `1px solid rgb(0, 184, 255)` | `rgba(0, 184, 255, 0.2)` |
| hover | `rgba(0, 184, 255, 0.2)` | `1px solid rgb(0, 184, 255)`（不变） | `rgba(0, 184, 255, 0.2)`（不变） |

**icon 资源引用**：

```tsx
resolvePublicAssetUrl(`/static/images/${show ? 'full-screen-hidden.svg' : 'full-screen-show.svg'}`)
// 静态资源：frontend/public/static/images/full-screen-{show,hidden}.svg
```

**SVG 内部色值**（来自 `frontend/public/static/images/full-screen-{show,hidden}.svg`）：

| 用途 | 色值 |
| --- | --- |
| 外层 fill | `rgb(3, 122, 255)` 60% 透明 |
| 内层描边 | `rgb(0, 184, 255)` ← button 主色取自此 |
| 箭头（强调色） | `rgb(3, 247, 255)` cyan |

### 2.9 形态对比（迭代 1 → 4）

| 维度 | 迭代 1（Next.js + 整组 button） | 迭代 4（SVG trigger + hover 展开） |
| --- | --- | --- |
| 锚定位置 | `position: fixed; top: 16; right: 24` | `position: fixed; top: 16; right: 0` |
| 始终可见元素 | 完整按钮（40×40） | 14×40 SVG trigger |
| 完整按钮可见时机 | 始终 | hover 时（条件渲染） |
| icon 来源 | `@ant-design/icons` | antd icon（按钮内）+ 自定义 SVG（trigger） |
| 主色 | 默认蓝 `rgba(96, 195, 255, *)` | SVG 主色蓝 `rgb(0, 184, 255)` |
| 触发交互 | 单击 | hover（展开）+ 单击（执行） |

---

## 3. 步骤

### 步骤 1：方向拍板 ✅

- **动作**：与用户对齐改造方向（去除 Next.js 导入 + Props 化）。
- **输出**：§1/§2 设计定稿。
- **🛑 等待用户**：已通过（2026-09-01）。

### 步骤 2：组件改造

- **动作**：按 §2 在 `frontend/src/components/large-screen/time-display/index.tsx` 落地新实现。
- **输出**：`time-display/index.tsx` 新版本。
- **🛑 等待用户**：否。

### 步骤 3：042 共享组件登记（双件套 + README）

- **动作**：
    1. 新建 `docs/specs/042-components-common/015-time-display/spec.md`
    2. 新建 `docs/specs/042-components-common/015-time-display/data-model.md`
    3. 更新 `docs/specs/042-components-common/README.md` §2（表格登记 015）+ §3.1（组合图视情况更新）+ §6（状态表追加一行）
- **输出**：015 子目录双件套 + README 同步。
- **🛑 等待用户**：否（用户直接授权落行）。

### 步骤 4：验收

- **动作**：
    1. `cd frontend && pnpm tsc --noEmit`：确认 0 新增错误（基线错误除外）。
    2. `Grep "next\|useIsomorphicLayoutEffect" frontend/src/components/large-screen/time-display/index.tsx`：0 命中。
    3. `Grep "\.trae/\|agents\.md\|\.local-\|task-\d+" docs/specs/042-components-common/015-time-display/`：0 命中。
    4. `Grep "\.trae/\|agents\.md\|\.local-" docs/specs/042-components-common/README.md`：0 命中。
- **输出**：验收勾选清单。
- **🛑 等待用户**：否。

### 步骤 5：归档

- **动作**：任务完成后，将本文件移至 `plans/done/`，更新 `plans/roadmap-2026-08-11-big-screen.md` §3 任务索引状态 + §5 变更记录。
- **输出**：`plans/done/task-2026-09-01-071-time-display-组件改造.md` + roadmap §3/§5 更新。
- **🛑 等待用户**：否。

### 步骤 6：迭代 2（Header 顶部栏拆分 左日期 / 右时间）✅

- **动作**：
    1. `TimeDisplay` 增加 `mode?: 'date' | 'time' | 'both'` 属性 + 导出 `TimeDisplayMode` 类型
    2. icon 渲染与 `showDate` 联动（`mode='time'` 默认不渲染 icon）
    3. `Header` 由居中改为全宽三段式 flex：左 `<TimeDisplay mode="date" />` + 中原 nav/title 组 + 右 `<TimeDisplay mode="time" showIcon={false} />`
    4. docs/specs/042-components-common/015-time-display/{spec.md, data-model.md} 同步追加 `mode` 字段表 + `mode` 决策矩阵 + Header 接入点路径
    5. 042 README §6 追加 `mode` 说明
- **输出**：见 §5 迭代 2 状态行。
- **🛑 等待用户**：已通过（2026-09-01）。

### 步骤 7：迭代 3（FullscreenButton 移入 Header + hover-reveal）✅

- **动作**：
    1. `FullscreenButton` 增加 `style?: React.CSSProperties` prop（晚于默认值 merge）
    2. `Header` 增加 `isFullscreen` + `onToggleFullscreen` props（关注点分离：state owner = page 层）
    3. 右侧时间 wrapper `paddingLeft: 56` 扩展 hover 区域至按钮位置，按钮 `position: absolute` + `opacity: 0` + `pointerEvents: none` 默认隐藏，hover 时 `opacity: 1` + `pointerEvents: auto`
    4. `index.tsx` 移除 `<FullscreenButton />` 渲染 + 取消 import，状态仍由 page 层持有并透传 Header
- **输出**：见 §5 迭代 3 状态行。
- **🛑 等待用户**：已通过（2026-09-01）。

### 步骤 8：落地验收

- **动作**：
    1. `cd frontend && pnpm tsc --noEmit`：确认 0 新增错误（基线错误除外；迭代 2/3 涉及 `Header` / `FullscreenButton` / `index.tsx` 的 props 透传）
    2. `Grep "next\|useIsomorphicLayoutEffect\|\"use client\"" frontend/src/components/large-screen/time-display/index.tsx`：0 命中
    3. `Grep "next/image" frontend/src/pages/visual/big-screen/`：0 命中
    4. `Grep "FullscreenButton" frontend/src/pages/visual/big-screen/index.tsx`：仅 0 命中（已移除 import 与渲染）
    5. `Grep "\.trae/\|agents\.md\|\.local-\|task-\d+" docs/specs/042-components-common/015-time-display/`：0 命中
    6. `Grep "\.trae/\|agents\.md\|\.local-" docs/specs/042-components-common/README.md`：0 命中
- **输出**：验收勾选清单。
- **🛑 等待用户**：否。

### 步骤 9：归档（与步骤 5 一致）

### 步骤 10：迭代 4（FullscreenButton 形态重构 + 配色统一）✅

- **动作**：
    1. FullscreenButton 重构为 wrapper + SVG trigger + 条件按钮结构：
        - `<div position:fixed; top:16; right:0; backdropFilter:blur(2px); overflow:hidden>`（hover 控制内部 `show` 状态）
        - 始终可见 SVG trigger：`<img src=full-screen-{show,hidden}.svg>`（14×40px），按 `show` 状态切换箭头方向
        - hover 展开 antd icon 按钮：`{show && <button>{active ? <FullscreenExitOutlined /> : <FullscreenOutlined />}</button>}`（40×40）
    2. 配色链路统一到 SVG 主色 `rgb(0, 184, 255)`（SVG 内描边色）：
        - background：`rgba(0, 184, 255, 0.1)`（默认）/ `rgba(0, 184, 255, 0.2)`（hover）
        - border：`1px solid rgb(0, 184, 255)` + `borderLeft: 'none'`（与 SVG trigger 拼接）
        - boxShadow：`0 0 8px rgba(0, 184, 255, 0.2)`
    3. hover handlers 简化（去除冗余的 borderColor 操作，已默认 = `rgb(0, 184, 255)`）
    4. task 文件补完：§2.7 实现要点 + §2.9 形态对比表 + 验收 ⑩
- **输出**：FullscreenButton 文件结构完全重构；配色三处统一；task 文件完整记录。
- **🛑 等待用户**：否。

---

## 4. 依据（任务来源）

| 来源类型 | 路径                                                                                       | 引用章节                                                                 |
| -------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| docs     | 仓库根 `AGENTS.md`                                                                         | §3 前端目录约定 / §5 大屏开发通用要点 / §6 命名与代码风格 / §10 L1/L2/L3 |
| skill    | 技能 `oss-mtc-transition-ln-project-context` 下 `design/004-big-screen-architecture.md`    | §共享组件定位                                                            |
| docs     | `docs/specs/042-components-common/README.md`                                               | §2 已登记组件 / §3.1 组件组合关系图 / §6 状态                            |
| 代码     | `frontend/src/components/large-screen/data-status/index.tsx`                               | 命名导出 + Props interface 风格参考                                      |
| 代码     | `frontend/src/components/large-screen/info-card/index.tsx`                                 | JSDoc 注释 + 类型导出风格参考                                            |
| 代码     | `frontend/src/pages/visual/big-screen/components/header/index.tsx`（迭代 2 前）            | 居中布局结构 + nav/title 居中组                                          |
| 代码     | `frontend/src/pages/visual/big-screen/components/fullscreen-button/index.tsx`（迭代 3 前） | `position: fixed; top: 16; right: 24` 独立浮动实现                       |
| 代码     | `frontend/src/pages/visual/big-screen/index.tsx`（迭代 3 前）                              | `<Header />` + `<FullscreenButton />` 双独立渲染节点                     |
| 资源     | `frontend/public/static/images/full-screen-{show,hidden}.svg`（迭代 4）                    | SVG 内部色值 `rgb(3,122,255)` 外填 + `rgb(0,184,255)` 内描边 + `rgb(3,247,255)` 箭头 |

---

## 5. 状态记录

| 日期       | 迭代   | 变更                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | 落地文件                                                                                                                                                                                            |
| ---------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-01 | 立项   | task 创建（去除 Next.js 导入 + 组件 Props 化 + 015 登记）；状态 ⚪ → 🟡                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | —                                                                                                                                                                                                   |
| 2026-09-01 | 迭代 1 | **TimeDisplay 组件改造 + 042 共享组件 015 登记**——① 编码改造去除 Next.js 专用 `"use client"` + `next/image`（项目栈 Vite + React 19，next/image 在 Vite 下 `Module not found` 运行/编译报错）+ `useIsomorphicLayoutEffect`/`useSetState`(ahooks) → React `useEffect`/`useState`；② Props 化：`TimeDisplayProps`（dateFormat / timeFormat / intervalMs / datePlaceholder / timePlaceholder / showIcon / icon / className）；③ L3 文档双件套：`docs/specs/042-components-common/015-time-display/{spec.md, data-model.md}`（用户直接授权落行）+ README 登记（计数 14→15 / §2 表格 / §6 状态）                                                    | `frontend/src/components/large-screen/time-display/index.tsx`、`docs/specs/042-components-common/015-time-display/{spec.md, data-model.md}`、`docs/specs/042-components-common/README.md`           |
| 2026-09-01 | 迭代 2 | **Header 顶部栏拆分（左侧日期 / 右侧时间）**——① `TimeDisplay` 新增 `mode?: 'date' \| 'time' \| 'both'` 属性（默认 `'both'`，保持向后兼容），导出 `TimeDisplayMode` 类型；② icon 渲染与 `showDate` 联动（`mode='time'` 默认不渲染 icon）；③ `Header` 改为全宽 flex + `justify-content: space-between`：`<TimeDisplay mode="date" />` 左 + 原居中 nav/title 中 + `<TimeDisplay mode="time" showIcon={false} />` 右；④ docs/specs/042-components-common/015-time-display/{spec.md, data-model.md} 同步追加 `mode` 字段表 + `mode` 决策矩阵 + Header 接入点路径；⑤ 042 README §6 追加 `mode` 说明                                                  | `frontend/src/pages/visual/big-screen/components/header/index.tsx`、`docs/specs/042-components-common/015-time-display/{spec.md, data-model.md}`、`docs/specs/042-components-common/README.md`      |
| 2026-09-01 | 迭代 3 | **`<FullscreenButton />` 移入 Header + hover-reveal 模式**——① `FullscreenButton` 增加 `style?` prop（晚于默认值 merge），允许父级覆盖 `position: fixed` 等定位字段；② `Header` 增加 `isFullscreen` + `onToggleFullscreen` props；③ 右侧时间区域 wrapper `paddingLeft: 56`（按钮 40 + gap 16）扩展 hover 区域至按钮位置，按钮 `position: absolute` + `opacity: 0` + `pointerEvents: none` 默认隐藏，hover 时 `opacity: 1` + `pointerEvents: auto`；④ `index.tsx` 移除 `<FullscreenButton />` 渲染 + 取消 import，状态 `isFullscreen` / `toggleFullscreen` 仍由 index.tsx 持有（透传给 Header），关注点分离：state 拥有 = page 层、渲染 = Header | `frontend/src/pages/visual/big-screen/components/fullscreen-button/index.tsx`、`frontend/src/pages/visual/big-screen/components/header/index.tsx`、`frontend/src/pages/visual/big-screen/index.tsx` |
| 2026-09-01 | 迭代 4 | **FullscreenButton 形态重构 + 配色统一**——① 结构重构为 wrapper `<div position:fixed; top:16; right:0; backdropFilter:blur(2px); overflow:hidden>`（hover 控制 `show` 状态）+ 始终可见 SVG trigger（14×40，引用 `frontend/public/static/images/full-screen-{show,hidden}.svg`，按 `show` 切换箭头方向）+ 条件渲染 `<button>`（40×40，hover 展开 antd icon 按钮 `{active ? <FullscreenExitOutlined /> : <FullscreenOutlined />}`）；② 配色链路统一到 SVG 主色 `rgb(0, 184, 255)`（SVG 内描边色）——background 默认 `rgba(0,184,255,0.1)` / hover `rgba(0,184,255,0.2)`；border `1px solid rgb(0,184,255)` + `borderLeft: 'none'`（与 trigger 拼接）；boxShadow `0 0 8px rgba(0,184,255,0.2)`；③ 去除冗余 hover handlers（borderColor 操作），仅保留 background 切换；④ button click 先 `setShow(false)` 再 `onToggle()`，避免视觉与状态不同步 | `frontend/src/pages/visual/big-screen/components/fullscreen-button/index.tsx` |

### 5.1 落地清单（截至 2026-09-01）

```
frontend/src/components/large-screen/time-display/index.tsx                          ✅ 改造（迭代 1）+ mode 属性（迭代 2）
frontend/src/pages/visual/big-screen/components/header/index.tsx                      ✅ 全宽三段式（迭代 2）+ FullscreenButton 接入 + hover-reveal（迭代 3）
frontend/src/pages/visual/big-screen/components/fullscreen-button/index.tsx           ✅ 新增 style prop（迭代 3）+ 形态重构（迭代 4：wrapper + SVG trigger + 条件按钮 + 配色统一）
frontend/src/pages/visual/big-screen/index.tsx                                        ✅ 移除 FullscreenButton 渲染 + 透传 props（迭代 3）
docs/specs/042-components-common/015-time-display/spec.md                             ✅ 创建 + mode 字段表追加（迭代 1+2）
docs/specs/042-components-common/015-time-display/data-model.md                        ✅ 创建 + mode 决策矩阵追加（迭代 1+2）
docs/specs/042-components-common/README.md                                            ✅ §2 表格登记 + §6 状态行追加（迭代 1+2）
plans/task-2026-09-01-071-time-display-组件改造.md                                    ✅ task 文件持续迭代（含迭代 4 完整记录）
plans/roadmap-2026-08-11-big-screen.md                                                 ✅ §3 任务索引 + §5 变更记录同步（待迭代 4 同步）
frontend/public/static/images/full-screen-{show,hidden}.svg                           ✅ 既有资源（迭代 4 引用，未变动）
```

---

## 6. 归档说明（2026-09-01）

- **触发**：用户指令「归档 task」
- **状态变更**：🟡 进行中 → ✅ 完成 → done/
- **归档动作**：本文件 `mv` 至 `plans/done/task-2026-09-01-071-time-display-组件改造.md`（L1 自由，无需审批）
- **roadmap 同步**：
    - §3 任务索引状态列更新（🟡 → ✅ 完成 → done/）
    - §5 变更记录追加归档行
- **完成范围**：迭代 1 → 4 全部落行（组件改造 / docs 双件套 / Header 拆分 / FullscreenButton 移入 / 形态重构 / 配色统一），无遗留未决项
- **遗留非阻塞**（task 完成后用户自行决定是否处理）：
    1. `pnpm tsc --noEmit` 本地验证（沙箱受限未跑）
    2. 4 大屏 Header 接入点确认（消费方梳理，可在其他 task 中跟踪）
