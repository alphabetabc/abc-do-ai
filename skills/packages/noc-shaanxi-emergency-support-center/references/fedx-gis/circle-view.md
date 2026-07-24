# CircleView

聚合圆圈 + 圆圈 Tooltip 容器。基础 Tooltip 由 `ElTooltipBase`/`ElTooltipCircle` 在外层 div 渲染。

> ⚠️ **两个 Tab 实际使用的是本地增强版 [`<GisCustomCircleView>`](#gis-%E8%87%AA%E5%AE%9A%E4%B9%89%E7%89%88-giscustomcircleview)，fedx-gis 原版 CircleView 在本项目中已不再使用。**
>
> - **tab1（日常保障）** → `import { GisCustomCircleView } from '~/web/components/ui/oss-gis/CircleView'` + **传 `enableSelfPopup`**（v1.10 起，shorthand 写法）
> - **tab2（突发保障）** → `import { GisCustomCircleView } from '~/web/components/ui/oss-gis/CircleView'` + **传 `enableSelfPopup={true}`**（v1.10 起）
>
> 详见：[tab-content-1-gis-full.md § `<GisCustomCircleView>` 自定义聚合圆组件](tab-content-1-gis-full.md)

下文分两段：先讲项目实际用的 GisCustomCircleView（**当前**），再讲 fedx-gis 原版（**仅对照，未使用**）。

---

## GIS 自定义版（GisCustomCircleView）

源文件：[CircleView.tsx](web/components/ui/oss-gis/CircleView.tsx)、辅助工具 [gisCommon.ts](web/components/ui/oss-gis/gisCommon.ts)

### Props

```ts
interface CircleProps {
    enableSelfPopup?: boolean;     // ← v1.10 新增；true = 自定位模式（tab1 启用，tab2 不启用）
    source?: any[];
    onMouseMove?: any;
    onClick?: any;
    visible?: boolean;
    toolPupWindowId?: string;      // ← OL overlay 锚点；仍按 tab 区分后缀
    overlayClassName?: string;
    overlayStyle?: object;
    tooltipProperty?: object;
    circleSize?: number;           // 外层圆形容器直径，默认 160
    iconSize?: number;             // 单个图标尺寸，默认 38
    radius?: number;               // 图标轨道半径（容器中心到图标中心的距离），默认 50
}
```

### `enableSelfPopup` 自定位模式（v1.10 起）

传 `enableSelfPopup` 后，组件额外挂一个 `useEffect`（[CircleView.tsx#L74-L102](web/components/ui/oss-gis/CircleView.tsx#L74-L102)），用 OL 的 `getPixelFromCoordinate` + `postrender` 事件手动定位容器：

```ts
useEffect(() => {
    if (!visible || !source?.length || !props.enableSelfPopup) {
        return; // 不写 display
    }

    const dom = domRef.current;
    const lng = source[0].longitude;
    const lat = source[0].latitude;

    const updatePosition = () => {
        if (!dom) return;
        const pixel = mapContext.getPixelFromCoordinate([lng, lat]);
        dom.style.left = (pixel[0] - circleSize / 2) + 'px';
        dom.style.top = (pixel[1] - circleSize / 2) + 'px';
    };
    updatePosition();
    mapContext.on('postrender', updatePosition);

    return () => {
        mapContext.un('postrender', updatePosition);
    };
}, [visible, source, mapContext, props.enableSelfPopup]);
```

要点：

- 容器 id：`enableSelfPopup ? 'freePointContainer' : 'pointContainer'`（自定位模式用 `freePointContainer`，便于和默认 `pointContainer` 区分）
- 定位基准：用 `source[0]` 的经纬度作为锚点；容器中心 = 锚点像素 - `circleSize/2`
- 生命周期：subscribe `postrender` → 卸载 / 重渲时 `un('postrender', updatePosition)` 清理
- visibility：早返回**不再写 `display`**（v1.10 修复了之前直接 DOM 写入 `dom.style.display = 'none'` 覆盖 React 内联 style 的副作用）；改由内联 `style={{ display: visible === true && !isEmpty(source) ? 'block' : 'none' }}` 和顶层 `if (!visible || !source?.length) return null;` 共同控制（[CircleView.tsx#L102-L104](web/components/ui/oss-gis/CircleView.tsx#L102-L104)）

### tab1 / tab2 后缀（仍按 tab 区分）

| tab           | toolPupWindowId          | 外层 div id                       | `enableSelfPopup` | 容器 id              |
| ------------- | ------------------------ | --------------------------------- | ----------------- | -------------------- |
| tab1 日常保障 | `'toolTipWindowCircle1'` | `<div id="toolTipWindowCircle1">` | ✅ `true`         | `freePointContainer` |
| tab2 突发保障 | `'toolTipWindowCircle2'` | `<div id="toolTipWindowCircle2">` | ❌ 不传（默认 falsy）| `pointContainer`   |

> ⚠️ `toolPupWindowId` 后缀**必须保留**，同页面会同时挂这两个组件（可能切换时同时存在），id 重叠会让 OL Tooltip 找错节点。
>
> tab1 在 v1.10 起改用 `enableSelfPopup` 模式后，容器 id 同步变成 `freePointContainer`；**不要在 CSS / 测试代码里硬编码 `pointContainer`**。

### 与 onShowCircle 配合

`VectorLayer.onShowCircle(pointArr)` 接收一组聚合后的点，传给 `setCirclePoints(pointArr)`。`CircleView.source` 用这个数组渲染圆圈。

```ts
const onShowCircle = (pointArr) => {
    setCircleTooltipStyle({ visibility: 'collapse' });
    setCircleTooltipSource(null);
    setCirclePoints([]);
    setTimeout(() => setCirclePoints(pointArr), 1);
};
```

> tab1 已升级为 `flushSync(() => setCirclePoints([]))` + `setTimeout(...)` 两段式，详见 [tab-content-1-gis-full.md § `flushSync` 与 setTimeout 栅栏](tab-content-1-gis-full.md)。

### 回调参数

- `onClick(point)`：单个点对象（同 `VectorLayer.onClick` 的入参结构）
- `onMouseMove(e)`：单个点对象
- `onMouseMove` 与 `onClick` 都不会区分 type，内部统一处理

### 外层 Tooltip div

**v1.11 起，两个 Tab 都不再使用外层锚点 div**——聚合圆 tooltip 改由 `tooltipTileChildren` prop 直接传入：

```tsx
{/* tab1：v1.11 起已注释（保留注释以便回退）
<div id="toolTipWindowCircle1">
    {circleTooltipSource && <ElTooltipCircle source={circleTooltipSource} style={circleTooltipStyle} />}
</div>
*/}

{/* tab2：从来没有外层锚点 div，id 直接内嵌在 tooltipTileChildren 内（见 tab-content-2-gis-full.md） */}

<GisCustomCircleView
    enableSelfPopup={true}
    toolPupWindowId="toolTipWindowCircle1" /* 或 ...2，按 tab */
    tooltipTileChildren={
        <div id="toolTipWindowCircle1"> {/* 或 ...2，按 tab */}
            {circleTooltipSource && (
                <ElTooltipCircle
                    source={circleTooltipSource}
                    style={circleTooltipStyle}
                    onItemClick={...}
                />
            )}
        </div>
    }
/>
```

> `style={{ visibility: 'collapse' }}` 隐藏，`visible: 'visible'` 显示。
> 当 mouse 移入聚合点设置 `circleTooltipSource = [e]`、`circleTooltipStyle = { visibility: 'visible' }`。
>
> **两个 Tab 的 `appendChild` 路径都被 `tooltipTileChildren` 短路**——`CircleView.tsx onCircleViewMouseMove` 的 `if (div && !props.tooltipTileChildren)` 守卫不会触发外部 DOM 寻址。`toolPupWindowId` 仍在调用方传入，**保留只是为了维持 tab1/tab2 id 后缀不重叠的对外契约**，实际未被消费。
>
> 详见 [tab-content-1-gis-full.md § Tooltip 节点](tab-content-1-gis-full.md) 和 [tab-content-2-gis-full.md § `<GisCustomCircleView>` 聚合圆组件](tab-content-2-gis-full.md)。

### 易踩坑

- `source` 必须是 array；空数组 `setCirclePoints([])` 是显式清空，不要传 undefined
- `toolPupWindowId` 是 fedx-gis 自己用 OL `Overlay` 定位元素，**不能改成 `popupParam.containerName`**（那是 VectorLayer 用的）。v1.11 起两个 Tab 都改走 `tooltipTileChildren`，`toolPupWindowId` 仅作 id 后缀约定保留，实际不被消费
- `visible` 控制 CircleView 整体可见，**不要用来控制某个点 Tooltip 显隐**——单点 Tooltip 的显隐改由 `<ElTooltipCircle style={circleTooltipStyle}>` 的 `style.visibility`（`collapse` / `visible`）控制；v1.11 起整体 Tooltip 由 AntD `Tooltip.open` 受 `tipVisible` state 驱动
- `onShowCircle` 频繁触发时记得节流，否则 CircleView 重渲染开销大
- 两个 Tab v1.10 起都 `enableSelfPopup={true}`，`useEffect` 才会真正订阅 `postrender` 做容器自定位。空数据时组件顶层 `if (!visible || !source?.length) return null;` 直接卸载容器，不会留下空 div
- **不要** 在调用方依赖「useEffect 帮我把 display 设成 none」这种隐式行为——display 完全由内联 `style={{ display: visible === true && !isEmpty(source) ? 'block' : 'none' }}` + 顶层 `return null` 控制

---

## fedx-gis 原版（仅对照，**当前未使用**）

> 本节保留仅为类型 / API 形态参考。两个 Tab 当前都使用 `GisCustomCircleView`，没有任何代码仍在 import `'fedx-gis/dist/gis-2d'` 里的 `CircleView`。如果将来需要回退 fedx-gis 原版，再把本节作为迁移入口。

- 类型：[CircleView.d.ts](node_modules/fedx-gis/dist/components/controls/CircleView.d.ts)

### Props

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

### 中屏典型用法（原版）

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

### 相对 GisCustomCircleView 的差异

| 项                                  | fedx-gis 原版 `CircleView`         | `GisCustomCircleView`（本项目）                                                                     |
| ----------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| 图标 baseUrl 来自                   | `view.options_.imageUrl`           | 同                                                                                                  |
| `tooltipProperty` 控制              | `visible`（antd 4）                | `open`（antd 5，规避废弃警告）                                                                      |
| 可配置几何尺寸                      | ❌ 写死 160 / 38 / 50              | ✅ props：`circleSize` / `iconSize` / `radius`                                                      |
| 自定位模式（div 手动定位）          | ❌ 不支持                          | ✅ `enableSelfPopup` + `getPixelFromCoordinate` + `postrender` 事件手动定位                         |
| 容器 id                             | fedx-gis 内部固定                  | `enableSelfPopup ? 'freePointContainer' : 'pointContainer'`                                         |
| `getSiteImgPath` 来源               | fedx-gis 内部实现                  | 本地 [gisCommon.ts](web/components/ui/oss-gis/gisCommon.ts)（fedx-gis 内部实现未对外暴露运行时 JS） |
| 顶层空数据守卫                      | —                                  | ✅ `if (!visible \|\| !source?.length) return null;`                                                |
| 渲染耦合                            | —                                  | 内部有直接 DOM 操作（`appendChild(div)` 搬外部 tooltip），强制重挂载会触发 `removeChild` 错误       |

> 版本：v1.3 · 更新日期：2026-07-24（同步 v1.11：tab1 `toolTipWindowCircle1` 锚点 div 已注释，聚合圆 tooltip 改走 `tooltipTileChildren`；后缀表 +「外层 Tooltip div」段同步标注）
