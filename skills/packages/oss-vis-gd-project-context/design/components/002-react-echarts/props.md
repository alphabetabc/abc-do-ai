# ReactECharts Props

> 依据 `web/components/large-screen/lib/rc-echarts.min.js` 内实现整理（类型来自 `@fedx-vis/react-echarts`）。默认值取自组件 `defaultProps` 与实现内解构默认值。

## Props 表

| Prop            | 类型                                     | 默认值    | 说明                                                                                                   |
| --------------- | ---------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------ |
| `option`        | `object`                                 | 必传      | ECharts option 配置项，全量传入（组件内部调 `instance.setOption`）                                     |
| `notMerge`      | `boolean`                                | `false`   | `setOption` 是否不与旧 option 合并（`true` = 整体替换）                                                |
| `lazyUpdate`    | `boolean`                                | `false`   | `setOption` 的 lazyUpdate，延迟到下一帧渲染                                                            |
| `replaceMerge`  | `string \| string[]`                     | —         | `setOption` 的 replaceMerge，指定按 id/名称整体替换的组件（典型 `['series']`），见 update-behavior.md   |
| `showLoading`   | `boolean`                                | —         | `true` 时每次 setOption 后调 `instance.showLoading(loadingOption)`，否则调 `hideLoading()`             |
| `loadingOption` | `object`                                 | `null`    | loading 动画配置                                                                                       |
| `theme`         | `string \| object`                       | —         | ECharts 主题；**变更会触发组件整体销毁重建**（见 update-behavior.md）                                  |
| `opts`          | `object`                                 | —         | `echarts.init` 的 opts（renderer 等）；**变更同样触发销毁重建**                                        |
| `onEvents`      | `Record<string, Function>`               | —         | 事件名 → 回调，如 `{ click: (params, instance) => {} }`；回调第二参为 echarts 实例                     |
| `onChartReady`  | `(instance: ECharts) => void`            | —         | 图表就绪回调，**获取实例句柄的唯一途径**（组件不转发 ref）                                             |
| `autoResize`    | `boolean`                                | `true`    | 挂 size-sensor 监听容器尺寸变化，自动 `instance.resize({ width: 'auto', height: 'auto' })`            |
| `shouldSetOption` | `(preProps, props) => boolean`         | —         | 更新闸门：返回 `false` 时本次渲染跳过 setOption（用于数据未变时阻止无效更新）                          |
| `style`         | `React.CSSProperties`                    | —         | 容器 style，组件内合并 `{ height: 300, ...style }`（即不传 height 时高 300px）                        |
| `className`     | `string`                                 | —         | 容器 class，最终为 `react-echarts ${className}`                                                       |

## 事件绑定（onEvents）

- 格式：`{ [echarts事件名]: (params, instance) => void }`，如 `click` / `legendselectchanged` 等 ECharts 事件
- 绑定时机：首次就绪后统一 `instance.on(eventName, cb)`；option 更新不会重复绑定

## 实例句柄

组件未实现 ref 转发，无法通过 `ref.current` 拿实例。需要 `dispatchAction`、`getDataURL` 等实例能力时：

```tsx
const handleReady = (instance: EChartsType) => {
    instanceRef.current = instance;
};

<ReactECharts option={option} onChartReady={handleReady} />;
```
