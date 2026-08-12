# Task 010 · 大屏基础组件封装（ScalerContainer）

> 状态：✅ 完成
> 关联：`plans/roadmap-2026-08-11-big-screen.md`
> 类型：**代码实现**
> 创建：2026-08-11
> 前置：无（基础组件，可独立开发）

---

## 1. 目标

封装大屏通用缩放适配容器 `ScalerContainer`，供 4 个大屏页面共用。

## 2. 产出物

| 文件 | 路径 | 说明 |
|------|------|------|
| 组件代码 | `frontend/src/components/large-screen/scaler-container/index.tsx` | ScalerContainer 主组件 |
| Context | `frontend/src/components/large-screen/scaler-container/context.ts` | ScalerContext + useScaler() |
| Overlay Context | `frontend/src/components/large-screen/scaler-container/overlay-context.ts` | OverlayRootContext + useOverlayRoot() |
| 工具函数 | `frontend/src/components/large-screen/scaler-container/utils.ts` | calcScale + debounce + ScaleMode 类型 |
| 设计文档 | `design/components/001-scaler-container/` | 组件设计记录（index.md 概述 + reference.md 技术实现） |

## 3. 功能清单

- [x] 外层容器撑满父级（100%），内层容器固定 designWidth × designHeight
- [x] CSS transform: scale() 缩放适配
- [x] 4 种缩放模式：scaleX / scaleY / scaleFull / none
- [x] ResizeObserver + 150ms debounce 监听容器尺寸
- [x] Context 分离：ScalerContext（scale）+ OverlayRootContext（overlay root ref）
- [x] overlay 挂载点：子组件通过 createPortal 渲染到此
- [x] Fast Refresh 兼容：index.tsx 只导出组件

## 4. 状态记录

| 日期       | 变更                                                                 |
| ---------- | -------------------------------------------------------------------- |
| 2026-08-11 | 完成组件设计与实现；拆分 context / overlay-context / utils 为独立文件 |
| 2026-08-11 | 组件目录调整为 `components/large-screen/scaler-container/`          |