# geoBuilder / seriesBuilder

> 依据 `web/components/ui/rc-echarts/map/option.tsx` 与项目内真实用法整理。builder 是 EChartsMap 的样式层 / 数据层扩展点。

## 契约

```typescript
geoBuilder: (config) => { geoIndex: number; geo: object[] }
seriesBuilder: (config) => object[]   // ECharts series 数组
```

- `geoIndex` 指向「承载交互与数据定位」的那一层 geo，Overlay 的 `convertToPixel({ geoIndex })` 和 series 的 `geoIndex` 都用它对齐坐标系
- builder 内部用 `useLatest` 持有最新 config，因此 **config 引用变化不触发 option 重建**——需要重建的数据（如 `dataSource`）由组件单独监听

## config 内容

两个 builder 收到的同一个 config 对象，关键字段：

| 字段                                                      | 来源                | 说明                                  |
| --------------------------------------------------------- | ------------------- | ------------------------------------- |
| `adcode`                                                  | Props               | 当前行政区划码                        |
| `dataSource`                                              | Props               | 点位数据                              |
| `geoIndex`                                                | geoBuilder 返回值   | seriesBuilder 里系列要绑定的 geo 序号 |
| `geojson`                                                 | useRegisterMap 产物 | 已注册的 geojson（getter）            |
| `isGeoRegistered`                                         | 内部计算            | geo 注册成功后才调 seriesBuilder      |
| `context`                                                 | Props               | 业务透传上下文（如当前图例分组）      |
| `geoSilent` / `geoItemColor` / `showGeoLabel` / `tooltip` | Props               | 同名 Props 透传                       |

## 默认实现（不传 builder 时）

geo 默认三层（`useGeoOption`）：第 0 层描边发光、第 1 层纹理填充（`texture-map-1-2.png`）、第 2 层承载交互与 label，`geoIndex = 2`。

series 默认单 scatter（`useSeriesOption`）：`data = dataSource.map(d => [d.longitude, d.latitude])`，白点样式。

## 真实示例

来源：`web/pages/five-major-center/comprehensive-display-center/modules/center/map-view/map-geo/presets.ts`

### geoBuilder：多层堆叠样式

```typescript
const geoBuilder = (config) => {
    const geoBase = {
        map: `map-${config.adcode}`,
        aspectScale: 1.5,
        silent: true,
        left: 35,
        right: 35,
    };

    return {
        geoIndex: 2, // 交互层序号（此例共 4 层，最后一层可交互）
        geo: [
            // 第 0 层：外描边发光
            {
                ...geoBase,
                top: 40,
                bottom: 15,
                itemStyle: {
                    color: 'transparent',
                    borderColor: 'rgba(0, 141, 255, 1)',
                    borderWidth: 3,
                    shadowColor: 'rgba(147, 255, 255, 0.8)',
                    shadowBlur: 10,
                    shadowOffsetY: 5,
                },
            },
            // 第 1 层：底色
            {
                ...geoBase,
                top: 35,
                bottom: 20,
                itemStyle: { color: 'rgba(1, 12, 17, 1)', shadowColor: 'rgba(7, 195, 255, 1)', shadowBlur: 10 },
            },
            // 第 2 层：粗边框
            {
                ...geoBase,
                top: 25,
                bottom: 24,
                itemStyle: {
                    borderColor: 'rgb(24, 158, 190)',
                    borderWidth: 6,
                    shadowColor: 'rgba(7, 195, 255, 0.6)',
                    shadowBlur: 10,
                },
            },
            // 第 3 层：交互层（可点、可选中）
            {
                ...geoBase,
                silent: false,
                top: 28,
                bottom: 25,
                selectedMode: true,
                itemStyle: { color: 'rgba(41,50,57, 1)', borderColor: 'rgb(24, 158, 190)', borderWidth: 1 },
                emphasis: { itemStyle: { color: 'rgba(21,135,196, 1)' } },
                select: { itemStyle: { color: 'rgba(21,135,196, 1)' } },
            },
        ],
    };
};
```

要点：各层用不同 `top/bottom` 制造错位叠影；只有交互层 `silent: false` + `selectedMode: true`，配合 `geoSelect` dispatchAction 实现选中高亮。

### seriesBuilder：按 context 切换图标 + lines

```typescript
const seriesBuilder = (config) => {
    const result = [];
    const scatterData = [];

    if (config.dataSource) {
        config.dataSource.forEach((d) => {
            scatterData.push({
                name: d.zoneName,
                value: [d.longitude, d.latitude],
                __rawData__: d,            // 挂原始数据，onClick 时经 rawParams.data.__rawData__ 取回
            });
        });
    }

    // 从 context 拿当前图例分组决定 scatter 图标
    const pointImage =
        config.context.legendGroup === 'personal' ? PersonalImage
        : config.context.legendGroup === 'government' ? GovernmentImage : ...;

    if (!isEmpty(scatterData)) {
        result.push({
            type: 'scatter',
            coordinateSystem: 'geo',
            geoIndex: config.geoIndex,     // 绑定交互层坐标系
            data: scatterData,
            z: 1,
            symbol: `image://${pointImage}`,
            symbolSize: [88, 91],
            symbolOffset: [0, -44],
            label: { show: true, formatter: '{b}', position: 'bottom' },
            emphasis: { disabled: true },
        });
    }

    return result;   // 还可 push { type: 'lines', coordinateSystem: 'geo', geoIndex, data } 等
};
```

要点：

- series 必须写 `coordinateSystem: 'geo'` + `geoIndex: config.geoIndex`，否则点不落地图
- 数据项上挂 `__rawData__`，配合 `useRawEvent` 模式的 onClick 从原始 params 里取业务数据
- `context` 变化不重建 option，但 builder 每次被调用时读到的都是最新 context；若需要强制重建，业务侧常用 `key={state.xxx}` 整体重挂 EChartsMap

## geojson 静态资源约定

- 路径：`${constants.STATIC_PATH}/map/geojson/${adcode}.geojson`（STATIC_PATH = `origin + PUBLIC_PATH + static`，见 `web/common/constants.ts`）
- 新增区域：把对应 adcode 的 geojson 放进 `public/static/map/geojson/` 即可，无需改组件
