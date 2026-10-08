# 项目内真实图表示例

> 示例直接摘自源码，注明路径；只取代表性写法，不穷举项目内所有图表。

## line / bar 动态类型（large-screen-demo）

来源：`web/pages/large-screen-demo/modules/ind-trend/index.tsx`

最简用法：option 内联、系列 type 由 props 决定（line / bar 可切换），`useMemo` 只依赖数据。

```tsx
import { useMemo } from 'react';
import { ReactECharts } from '~/web/components/large-screen/lib';

export const IndTrend = (props) => {
    const option = useMemo(() => ({
        tooltip: {},
        xAxis: { type: 'category', data: lineData.xData },
        yAxis: { type: 'value' },
        series: [{ data: lineData.yData, type: props.chartType }],
    }), [lineData, props.chartType]);

    return <ReactECharts style={{ height: '100%' }} option={option} />;
};
```

## 多环 pie + graphic 背景图（info-management-bureau）

来源：`web/pages/info-management-bureau/sub-pages/open-and-close/modules/wireless-scale/scale-pie-card.tsx`

三个同心 `pie` 系列叠出多环效果，`graphic.elements` 放置中心背景图，`backgroundColor: 'transparent'` 防止容器底色覆盖：

```tsx
const option = useMemo(() => {
    const bgSize = 168 * 0.9;
    return {
        backgroundColor: 'transparent',
        graphic: {
            elements: [{
                type: 'image',
                style: { image: PieImg, width: bgSize, height: bgSize },
                left: 'center',
                top: 'center',
            }],
        },
        series: [
            {
                name: '小区数',
                type: 'pie',
                radius: ['70%', '72%'],   // 窄环描边
                color: ['rgba(0, 215, 156, 1)', 'rgba(0, 145, 255, 1)'],
                label: { normal: { show: false } },
                data: dataSource?.chartData || [],
            },
            // 其余两环 radius 依次 ['50%','55%'] / ['68%','55%']，第三环加 z: 2 提层
        ],
    };
}, [dataSource]);

<ReactECharts style={{ width: '100%', height: '100%' }} option={option} />;
```

要点：

- 多 series 用 `radius` 百分比叠层，配合 `hoverAnimation: false` / `legendHoverLink: false` 关闭联动
- 中心图/数值叠层用 `graphic` 或绝对定位 DOM 覆盖在图表容器上（本例为后者）
