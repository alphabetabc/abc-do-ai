# CircleView

聚合圆圈 + 圆圈 Tooltip 容器。基础 Tooltip 由 `ElTooltipBase`/`ElTooltipCircle` 在外层 div 渲染。

> ⚠️ **tab1 实际使用的是本地增强版 [`<GisCustomCircleView>`](#gis-%E8%87%AA%E5%AE%9A%E4%B9%89%E7%89%88)，不是 fedx-gis 原版。**
> 详见：[tab-content-1-gis-full.md § `<GisCustomCircleView>` 自定义聚合圆组件](tab-content-1-gis-full.md)。
>
> - **tab1（日常保障）** → `import { GisCustomCircleView } from '~/web/components/ui/oss-gis/CircleView'`
> - **tab2（突发保障）** → `import { CircleView } from 'fedx-gis/dist/gis-2d'`（原版）

下文描述的是 **fedx-gis 原版 CircleView**（仅 tab2 在用）。tab1 用法请直接看 `tab-content-1-gis-full.md`。

- 类型：[CircleView.d.ts](node_modules/fedx-gis/dist/components/controls/CircleView.d.ts)

## Props

```ts
interface CircleProps {
    source?: any[]; // ← 聚合点位数组（一般由 onShowCircle 填充）
    onMouseMove?: (e) => void;
    onClick?: (point) => void;
    visible?: boolean;
    toolPupWindowId?: string; // ← 关键：外层 Tooltip div id
    overlayClassName?: string;
    overlayStyle?: object;
    tooltipProperty?: object;
}
```

## 中屏典型用法（tab2 原版）

```tsx
<CircleView
    visible={true}
    source={circlePoints}
    toolPupWindowId="toolTipWindowCircle2" // ← 必须对应外层 <div id="toolTipWindowCircle2">
    onClick={onPointClick}
    onMouseMove={onPointMove}
    tooltipProperty={{ placement: 'top' }}
    overlayStyle={{ width: 300 }}
/>
```

### tab1 / tab2 后缀

| tab           | toolPupWindowId          | 外层 div id                       | 使用版本 |
| ------------- | ------------------------ | --------------------------------- | -------- |
| tab1 日常保障 | `'toolTipWindowCircle1'` | `<div id="toolTipWindowCircle1">` | `<GisCustomCircleView>` |
| tab2 突发保障 | `'toolTipWindowCircle2'` | `<div id="toolTipWindowCircle2">` | `<CircleView>`（fedx-gis 原版） |

> ⚠️ 这个后缀**必须保留**，因为同页面会同时挂这两个组件（可能切换时同时存在），id 重叠会让 OL Tooltip 找错节点。

## 与 onShowCircle 配合

`VectorLayer.onShowCircle(pointArr)` 接收一组聚合后的点，传给 `setCirclePoints(pointArr)`。`CircleView.source` 用这个数组渲染圆圈。

```ts
const onShowCircle = (pointArr) => {
    setCircleTooltipStyle({ visibility: 'collapse' });
    setCircleTooltipSource(null);
    setCirclePoints([]);
    setTimeout(() => setCirclePoints(pointArr), 1);
};
```

> `setTimeout(..., 1)` 是为了让 React 先 commit 空数据再写入新数据，避免 OL 复用旧聚合位置。
>
> tab1 已升级为 `flushSync(() => setCirclePoints([]))` + `setTimeout(...)` 两段式，详见 [tab-content-1-gis-full.md § `flushSync` 与 setTimeout 栅栏](tab-content-1-gis-full.md)。

## 回调参数

- `onClick(point)`：单个点对象（同 `VectorLayer.onClick` 的入参结构）
- `onMouseMove(e)`：单个点对象
- `onMouseMove` 与 `onClick` 都不会区分 type，内部统一处理

## 外层 Tooltip div

```tsx
<div id="toolTipWindowCircle2">
    {circleTooltipSource && <ElTooltipCircle source={circleTooltipSource} style={circleTooltipStyle} />}
</div>
```

> `style={{ visibility: 'collapse' }}` 隐藏，`visible: 'visible'` 显示。
> 当 mouse 移入聚合点设置 `circleTooltipSource = [e]`、`circleTooltipStyle = { visibility: 'visible' }`。

## 易踩坑

- `source` 必须是 array；空数组 `setCirclePoints([])` 是显式清空，不要传 undefined
- `toolPupWindowId` 是 fedx-gis 自己用 OL `Overlay` 定位元素，**不能改成 `popupParam.containerName`**（那是 VectorLayer 用的）
- `visible` 控制 CircleView 整体可见，**不要用来控制某个点 Tooltip 显隐**——用外层 div 的 style
- `onShowCircle` 频繁触发时记得节流，否则 CircleView 重渲染开销大

## GIS 自定义版

> tab1 已切到本地 `<GisCustomCircleView>`，本节用于对比。详见 [tab-content-1-gis-full.md § `<GisCustomCircleView>` 自定义聚合圆组件](tab-content-1-gis-full.md)。

相对 fedx-gis 原版的差异：

| 项 | fedx-gis 原版 | `GisCustomCircleView` |
| --- | --- | --- |
| `tooltipProperty` 控制 | `visible`（antd 4） | `open`（antd 5，规避废弃警告） |
| 可配置几何尺寸 | ❌ 写死 160 / 38 / 50 | ✅ props：`circleSize` / `iconSize` / `radius` |
| `getSiteImgPath` 来源 | fedx-gis 内部实现（dist 只暴露 `.d.ts`） | 本地 [gisCommon.ts](web/components/ui/oss-gis/gisCommon.ts) |
| 渲染耦合 | — | 内部有直接 DOM 操作（`appendChild(div)` 搬外部 tooltip），强制重挂载会触发 `removeChild` 错误 |

> 版本：v1.1 · 更新日期：2026-07-14
