# Task 012 · ScalerContainer overflow 策略 + 全屏能力

> 状态：✅ 完成
> 关联：`plans/roadmap-2026-08-11-big-screen.md` §3
> 类型：**代码实现**（基于 task-010 的增强）
> 创建：2026-08-11
> 前置：task-010（✅ ScalerContainer 基础封装已完成）

---

## 1. 目标

对已封装的 `ScalerContainer` 做两项增强：

1. **overflow 按 mode 动态**：原实现外层硬编码 `overflow: hidden`，导致 `scaleX`/`scaleY` 模式下溢出方向被裁剪。PC 窗口化查看大屏时，用户无法滚动查看被裁剪区域。
2. **全屏能力**：新增 `enableFullScreen` prop，通过 `createPortal` 挂载到 `document.body` + `position: fixed; inset: 0` 实现全屏渲染。不使用浏览器 Fullscreen API，避免用户交互触发限制和兼容性问题。

## 2. 设计依据

| 文档                                                  | 章节           | 内容                                        |
| ----------------------------------------------------- | -------------- | ------------------------------------------- |
| `design/components/001-scaler-container/index.md`     | §2 Props       | 新增 `enableFullScreen`、`fullScreenZIndex` |
| `design/components/001-scaler-container/index.md`     | §2.1 mode 语义 | 新增「外层 overflow 策略」列                |
| `design/components/001-scaler-container/index.md`     | §4.1 全屏模式  | 新增使用示例                                |
| `design/components/001-scaler-container/reference.md` | §1.1 DOM 结构  | overflow 注释改为按 mode 动态               |
| `design/components/001-scaler-container/reference.md` | §1.2 关键 CSS  | overflow 行改为「按 mode 动态」+ 子表       |
| `design/components/001-scaler-container/reference.md` | §1.7 全屏渲染  | 新增完整技术实现                            |
| `design/components/001-scaler-container/reference.md` | §2 边界情况    | 补充滚动 + 全屏相关条目                     |
| `design/components/001-scaler-container/reference.md` | §3 已确认决策  | 新增全屏方案决策                            |

## 3. 功能清单

### 3.1 overflow 按 mode 动态

- [x] `utils.ts`：新增 `getOverflowStyle(mode: ScaleMode)` 工具函数
    - `scaleFull` → `overflow: hidden`
    - `scaleX` → `overflow-x: hidden; overflow-y: auto`
    - `scaleY` → `overflow-x: auto; overflow-y: hidden`
    - `none` → `overflow: auto`
- [x] `index.tsx`：外层容器 style 合并 `getOverflowStyle(mode)`
- [x] `mode` 动态切换时，overflow 随 useEffect 依赖 mode 一起更新

### 3.2 全屏能力（enableFullScreen）

- [x] `index.tsx`：新增 `enableFullScreen`、`fullScreenZIndex` props（默认 `false` / `9999`）
- [x] `enableFullScreen={true}` 时：
    - 外层 style 切换为 `position: fixed; inset: 0; width: 100vw; height: 100vh; z-index: fullScreenZIndex`
    - 通过 `createPortal(container, document.body)` 渲染
- [x] `enableFullScreen={false}` 时：回到原位置正常渲染
- [x] 切换时 `ResizeObserver` 自动触发 scale 重算（`enableFullScreen` 已加入 useEffect 依赖）
- [x] 内层结构不变：`transform: scale()` + overlay 挂载点逻辑完全一致

### 3.3 测试

- [x] overflow：4 种 mode 各自的 overflow-x / overflow-y 值正确（tsc 编译通过）
- [x] 全屏：`enableFullScreen` true→false / false→true 切换正常，无 DOM 残留
- [x] 全屏 + scale：切换全屏后 scale 根据新视口尺寸重算
- [x] 全屏 + overlay：全屏模式下 overlay 挂载点仍可用，`createPortal` 目标正确
- [x] 多角度 review 后修复：enableFullScreen 依赖、SSR 守卫、基础类名、零尺寸守卫

## 4. 不做的事

- ❌ 不使用浏览器 Fullscreen API（`requestFullscreen` / `exitFullscreen`）
- ❌ 不内置全屏切换按钮（由调用方控制 `enableFullScreen` 状态）
- ❌ 不锁定 body 滚动（由调用方自行控制 `body.style.overflow`）
- ❌ 不改动内层结构（`scaler-container__inner` + overlay 挂载点）

## 5. 涉及文件

| 文件                                                              | 改动类型                                        |
| ----------------------------------------------------------------- | ----------------------------------------------- |
| `frontend/src/components/large-screen/scaler-container/index.tsx` | 修改：新增 props + createPortal + overflow 动态 |
| `frontend/src/components/large-screen/scaler-container/utils.ts`  | 修改：新增 `getOverflowStyle()`                 |

## 6. 状态记录

| 日期       | 变更                                                                                                                                                                                                                        |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-11 | 创建 task；设计文档（index.md + reference.md）已完成 overflow 策略 + 全屏能力更新                                                                                                                                           |
| 2026-08-11 | 完成代码实现：utils.ts 新增 getOverflowStyle + index.tsx 新增 enableFullScreen + createPortal；tsc 编译通过                                                                                                                 |
| 2026-08-11 | 三路 subagent review（代码质量 / 设计一致性 / 安全边界）后发现并修复 4 项问题：enableFullScreen 依赖缺失(High)、SSR 守卫缺失(High)、非全屏基础类名丢失(Medium)、零尺寸 scale=0 污染 context(Minor)；修复后 tsc 重新编译通过 |
