# 002-react-echarts · ECharts 图表组件

> 源码：`web/components/large-screen/lib/index.tsx`（重导出自 `web/components/large-screen/lib/rc-echarts.min.js`，类型对应 `@fedx-vis/react-echarts@^0.0.2`）。ECharts 版本 ^5.6.0。

## 快速上手

```tsx
import React, { useMemo } from 'react';
import { ReactECharts } from '~/web/components/large-screen/lib';

const Chart: React.FC<{ data: { labels: string[]; series: { name: string; data: number[] }[] } }> = ({ data }) => {
    const option = useMemo(
        () => ({
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: data.labels },
            yAxis: { type: 'value' },
            series: data.series.map((s) => ({ ...s, type: 'line' })),
        }),
        [data],
    );

    return <ReactECharts option={option} style={{ width: '100%', height: '100%' }} replaceMerge={['series']} />;
};
```

约定要点：

1. `useMemo` 缓存 option，依赖数据本身，避免无关渲染触发 setOption
2. 容器默认样式写 `{ width: '100%', height: '100%' }`（不传 style 时组件默认 `height: 300`）
3. series 数量随数据增减时启用 `replaceMerge={['series']}`，防止旧系列残留（见 [update-behavior.md](./update-behavior.md)）

## 文档索引

| 文档                                       | 内容                                                    |
| ------------------------------------------ | ------------------------------------------------------- |
| [props.md](./props.md)                     | ReactECharts 全量 Props 表、事件绑定、实例句柄获取      |
| [update-behavior.md](./update-behavior.md) | 挂载/更新/销毁生命周期、option 合并与 replaceMerge 机制 |
| [style-presets.md](./style-presets.md)     | 统一数据结构、大屏字体与坐标轴配色预设、渐变色写法      |
| [examples.md](./examples.md)               | 项目内真实图表示例（line / bar / pie）与代表性写法      |
