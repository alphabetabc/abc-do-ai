# rc-shared · rc-echarts 组件目录的共享基础设施

> 源码位置：`web/components/ui/rc-echarts/`（目录内除三个图表组件目录外的公共部分）
> 三个图表组件：见 `rc-bar3d-line/overview.md`、`rc-gauge/overview.md`、`rc-pie-3d/overview.md`。

## 1. rc-echarts 目录定位

`web/components/ui/rc-echarts/` 是大屏通用 ECharts 业务封装层（项目内源码，非 npm 包），目录结构：`<组件名>/index.tsx`（React 组件）+ `<组件名>/utils.ts`（纯函数生成 option）。当前含三个组件：

| 组件 | 一句话 | 是否用 IntersectionObserver |
| --- | --- | --- |
| Bar3dLineChart | 伪 3D 柱（custom series 手绘）+ 折线 + 标记线，双 Y 轴 | 否 |
| Gauge | 180° 半环仪表盘，双层 gauge series 叠加 | 是 |
| Pie3d | echarts-gl surface 参数方程拼立体饼 | 否（rAF + opacity 淡入） |

## 2. ReactIntersectionObserver（ReactIntersectionObserver.tsx）

**作用**：图表"进入视口才渲染"的懒加载容器。未进入视口时子组件（ECharts 实例）**完全不渲染**；离开视口后 `isIntersecting` 置 false 会卸载子树，再次进入又重建。

**实现细节**：

- 全项目共享一个 `IntersectionObserver` 单例，root 为 `document.body`。
- `observerDomList` 为 `WeakMap<domElement, {update, isCancel}>`：回调以闭包对象形式挂在 DOM 上，observer 触发时反查调用。
- `observe(dom, updater)` 返回 unobserve 函数；取消时置 `isCancel = true` 防止残留回调再触发。
- 调 `globalObserver.takeRecords()` 立即冲刷积压观察记录，首帧状态尽快同步。
- 容器渲染 `<section style="width:100%;height:100%;position:relative">` —— **父级必须给定确定高度**。

## 2.1 useMemorizedObject（web/hooks/useMemorizedObject.ts）

**作用**：深比较记忆化对象——每次 render 传新对象字面量时，若与上次**深相等**则返回旧引用，避免下游 `useMemo` 因引用变化而重算。

**实现细节**（重建需等价）：

```
isEqualWith(a, b, customizer)，其中 customizer：
  - 两边均为 function → 按 value.toString() === other.toString() 比较（函数以源码字符串判等）
  - 其余返回 undefined → 走 lodash 默认深比较
内部用 optsRef（useRef）保存上次对象：不等则替换，相等则返回旧引用
```

注意函数按 `toString()` 判等的语义：内联箭头函数每次 render 生成的新实例只要源码文本相同即视为相等；`useLatest`（bar3d-line 用）则是另一种策略（不比较、永远存最新、不进依赖）。

## 2.2 ReactECharts 的真实来源

`web/components/large-screen/lib/index.tsx` 只是**本地 minified bundle 的 re-export**：`ReactECharts` 来自 `./rc-echarts.min.js`，TypeScript 类型对标 `@fedx-vis/react-echarts` 的 `ReactECharts`。重建时可直接依赖 `@fedx-vis/react-echarts`；本仓库因历史编译环境问题改为本地打包副本（文件头注释："环境有问题，放 node_modules 里面编译不了"）。minified 文件内部行为（setOption 合并模式、resize 时机等）**未逆向**，以 `@fedx-vis/react-echarts` 官方行为为准。

## 3. 三个组件的共同外部依赖

| 依赖 | 来源 | 用途 |
| --- | --- | --- |
| `ReactECharts` | `web/components/large-screen/lib` | 项目统一 ECharts React 包装，接受 `option / onEvents / replaceMerge / style / className` |
| `useMemorizedObject` | `web/hooks/useMemorizedObject` | 深比较记忆化对象，防 inline 对象字面量每帧使 useMemo 失效（gauge、pie-3d 使用） |
| `useLatest` | `@fedx-web-common/react-hooks` | 回调存 ref，避免进入 useMemo 依赖（bar3d-line 的 optionBuilder） |
| `cloneDeep / merge / get / set / isEmpty / isUndefined` | `@fedx-web-common/utils` | 通用工具 |
| `Decimal` | `~/web/utils/decimal` | gauge 百分比格式化 |
| `d3`（max / scaleLinear） | npm d3 | pie-3d 数值归一化 |
| `echarts-gl` | pie-3d 内 `import 'echarts-gl'` 副作用导入 | 注册 surface 3D 系列类型 |
