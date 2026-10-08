# 挂载、更新与销毁机制

> 依据 `web/components/large-screen/lib/rc-echarts.min.js` 内实现整理。

## 挂载流程

1. `echarts.init(dom, theme, opts)` 初次初始化
2. 监听实例 `finished` 事件读取容器真实宽高，`dispose` 后以 `{ width, height, ...opts }` 二次 `init`（把测得的尺寸固化为初始化参数）
3. 首次 `setOption(option)`
4. 绑定 `onEvents`、调用 `onChartReady(instance)`
5. `autoResize`（默认 true）时挂 size-sensor（优先 ResizeObserver，降级 object 元素方案），容器尺寸变化触发 `instance.resize({ width: 'auto', height: 'auto' })`

**DPR 校正**：init 后按容器 CSS transform 缩放比修正 `painter.dpr = devicePixelRatio * max(scale, 1)`。这是为整屏缩放（ViewScaleManager）场景准备的——容器被 CSS transform 放大时保持 canvas 清晰度。

## 更新机制（props 变化）

组件在 `useEffect` 中对更新做如下分支：

| 条件                                                     | 行为                                       |
| -------------------------------------------------------- | ------------------------------------------ |
| `shouldSetOption(preProps, props)` 返回 `false`          | 跳过本次更新（数据未变时阻止无效 setOption） |
| `theme` 或 `opts` 变更（浅比较）                          | `dispose` + 走完整挂载流程（整体重建）      |
| `option` / `notMerge` / `lazyUpdate` / `replaceMerge` / `showLoading` / `loadingOption` 任一浅比较变更 | `setOption(option, { notMerge, lazyUpdate, replaceMerge? })`，随后按 `showLoading` 调 `showLoading/hideLoading` |
| `style` 或 `className` 变更                               | 仅 `instance.resize({ width: 'auto', height: 'auto' })` |

比较方式为浅比较（对 option 相关 props 用 lodash `pick` 后逐项比较），所以 **option 需保持引用稳定**（`useMemo`），否则每次渲染都会触发 setOption。

## notMerge 与 replaceMerge

两者都控制 setOption 与旧 option 的关系，区别：

- `notMerge: true`：整个 option 不与旧的合并，全量替换。粒度最粗，会丢失所有未在新 option 中声明的配置
- `replaceMerge: ['series']`：只对指定组件类型（series / xAxis / yAxis / legend 等）按 id/名称整体替换，其余正常合并

**何时需要 `replaceMerge={['series']}`**：series 数量随数据动态增减（如切换指标、多系列过滤）。默认合并模式下，新 option 的 series 不足时旧的尾部 series 会残留在图上。项目内约定：数据驱动的动态 series 一律启用。

```tsx
<ReactECharts option={option} replaceMerge={['series']} />
```

## 销毁

卸载时先移除 size-sensor 监听，再 `echarts.dispose(dom)`。
