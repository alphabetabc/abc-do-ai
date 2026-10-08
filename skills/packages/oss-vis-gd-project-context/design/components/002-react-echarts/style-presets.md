# 大屏样式与配色预设

## 统一数据结构

图表数据统一收敛为 labels + series 形式，再在 `useMemo` 里映射为 option：

```typescript
const data = {
    labels: ['2024/01', '2024/02', '2024/03'],
    series: [{ name: '系列名称', data: [14000, 14200, 14500] }],
};
```

## 坐标轴配色预设

```typescript
xAxis: {
    axisLabel: {
        color: 'rgba(255, 255, 255, 1)',
        fontFamily: 'Source Han Sans CN',
        fontSize: 16,
        fontWeight: 500,
    },
    axisLine: { lineStyle: { color: 'rgba(152, 103, 113, 1)' } },
    axisTick: { show: false },
},
yAxis: {
    axisLabel: {
        formatter: '{value}',
        color: 'rgba(255, 255, 255, 1)',
        fontFamily: 'Source Han Sans CN',
        fontSize: 16,
        fontWeight: 500,
    },
    axisLine: { show: true, lineStyle: { color: 'rgba(162, 162, 163, 1)' } },
    splitLine: {
        lineStyle: { type: [5, 10], color: 'rgba(255, 255, 255, 0.3)', width: 0.5 },
    },
},
```

大屏统一字体 `Source Han Sans CN`、字号 16；颜色以 `rgba()` 全量书写，便于带透明度微调。

## 渐变色

```javascript
// 线性渐变（x/y/x2/y2 为包围盒百分比 0-1；global: true 时为绝对像素）
{
  type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
  colorStops: [
      { offset: 0, color: 'red' },
      { offset: 1, color: 'blue' },
  ],
  global: false,
}

// 径向渐变（x/y 为圆心，r 为半径）
{ type: 'radial', x: 0.5, y: 0.5, r: 0.5, colorStops: [/* 同上 */] }

// 纹理填充（image 为 HTMLImageElement / HTMLCanvasElement，不支持路径字符串）
{ image: imageDom, repeat: 'repeat' }
```

## 系列颜色 + 面积渐变的组合预设

面积图常用「实色描边 + 同色透明渐变填充」，颜色与渐变成对定义：

```typescript
const presetColors = [
    {
        value: 'rgba(200, 116, 255, 1)',
        gradient: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
                { offset: 0, color: 'rgba(200, 116, 255, 0.13)' },
                { offset: 1, color: 'rgba(200, 116, 255, 0)' },
            ],
        },
    },
];

// series 映射时按索引取色
const series = data.series.map((item, index) => {
    const color = presetColors[index % presetColors.length];
    return {
        name: item.name,
        type: 'line',
        data: item.data,
        itemStyle: { color: color.value },
        areaStyle: { color: color.gradient },
        lineStyle: { width: 2 },
        symbol: 'circle',
        symbolSize: 8,
    };
});
```

legend 样式同字体预设：

```typescript
const options_parts = {
    legend: {
        data: series.map((item, index) => ({
            name: item.name,
            icon: 'rect',
            itemWidth: 14,
            itemHeight: 14,
            textStyle: {
                color: 'rgba(255, 255, 255, 1)',
                fontFamily: 'Source Han Sans CN',
                fontSize: 16,
                fontWeight: 400,
            },
            itemStyle: { color: presetColors[index % presetColors.length].value },
        })),
        top: 10,
        right: 10,
    },
    grid: { top: 50, left: 0, right: 50, bottom: 5, containLabel: true },
};
```
