# OverlayPoint 覆盖层打点组件

## 文件范围

- `apps/main/app/components/center/warn-gis/risk-prediction-points/OverlayPoint.tsx`

## 职责

OverlayPoint 是打点定位与 Portal 管理的核心组件，被 `RiskPredictionPoints` 包裹在每个 `labelPoints.points` 上，负责：

1. **坐标映射**：将经纬度转换为地图像素坐标并实时跟随地图渲染。
2. **Portal 挂载**：通过 React Context 暴露 `createPortal` 给所有子模块使用，承载各类详情弹窗。
3. **zIndex 自管理**：通过 `MutationObserver` 监听弹窗容器的子节点变化，自动提升 zIndex，避免被其他浮层遮挡。
4. **点位标识**：计算 `data-overlay-point-root-id` 属性供调试与外部联动使用。

## 入参

```typescript
interface OverlayPointProps {
    point: { name: string; longitude: number; latitude: number; [k: string]: any };
    weather?: any; // 来自 state.weatherPoints.find(...) 的匹配结果
    waterSituation?: any; // 来自 state.waterWarningPoints.find(...) 的匹配结果
    highRiskTown?: any; // 来自 state.highRiskPoints.find(...) 的匹配结果
    legendSelected: Array<[string, boolean]>; // 图例选中列表
}
```

## 关键机制

### 1. 坐标映射（`useEffect` 订阅 `overlayManager.onRender`）

```typescript
useEffect(() => {
    const pre = { left: null, top: null };
    return overlayManager.onRender(() => {
        const pos = overlayManager.getPixelFromCoordinate([props.point.longitude, props.point.latitude]);
        if (isEmpty(pos)) {
            overlayRootRef.current!.style.display = "none";
            return;
        }
        const [left, top] = pos;
        if ((pre.left !== left || pre.top !== top) && overlayRootRef.current) {
            pre.left = left;
            pre.top = top;
            overlayRootRef.current.style.transform = `translate(${left}px, ${top}px)`;
            overlayRootRef.current.style.display = "block";
        }
    });
}, [props.point]);
```

- **位置计算**：使用 `transform: translate()` 而非 `left/top` 提升性能。
- **可见性控制**：当经纬度无法转换为像素时（地图未加载完成或点位超出可视范围）隐藏根元素。
- **去重更新**：仅在 `left/top` 变化时才更新 DOM，避免无意义的重排。

### 2. zIndex 自管理（`MutationObserver`）

```typescript
useEffect(() => {
    if (!bottomTipRef.current || !overlayRootRef.current) return;

    const preZIndex = getComputedStyle(overlayRootRef.current).zIndex;
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === "childList" && mutation.target === bottomTipRef.current) {
                if (bottomTipRef.current.children.length > 0) {
                    overlayRootRef.current!.style.zIndex = `999`;
                    bottomTipRef.current.style.pointerEvents = "auto";
                } else {
                    overlayRootRef.current!.style.zIndex = preZIndex;
                    bottomTipRef.current.style.pointerEvents = "none";
                }
            }
        });
    });
    observer.observe(bottomTipRef.current, { childList: true });
    return () => observer.disconnect();
}, []);
```

- 当 `bottomTipRef`（底部 portal 容器）出现子节点（即弹窗打开）时，临时将根元素 zIndex 提升到 `999`，并启用 `pointerEvents`。
- 当弹窗关闭（子节点为空）时，恢复原 zIndex 和 `pointerEvents: none`，避免点位图标拦截地图交互。

### 3. Portal Context 暴露

```typescript
const OverlayPointContext = createContext({
    createPortal: (node: any) => null as any,
});

// 在 useMemo 中绑定底部 ref
const overlayPointCtx = useMemo(() => {
    return {
        createPortal: (node: any) => {
            if (!bottomTipRef.current) return null;
            return createPortal(node, bottomTipRef.current!);
        },
    };
}, []);

// 子组件通过 hook 访问
export function useOverlayPoint() {
    return useContext(OverlayPointContext);
}
```

**子模块使用方式**：

```typescript
import { useOverlayPoint } from "../OverlayPoint";

const MyDetail = (props) => {
    const overlayPointCtx = useOverlayPoint();
    return state.show && overlayPointCtx.createPortal(<MyModal {...props} />);
};
```

### 4. zoneId 兜底计算

```typescript
const uniqueId = useId();
const zoneId = props.weather?.zoneId ?? props.waterSituation?.zoneId ?? props.highRiskTown?.zoneId ?? `unknown-zoneId-${uniqueId}`;
```

- **优先级**：`weather.zoneId` > `waterSituation.zoneId` > `highRiskTown.zoneId`。
- **兜底**：当三个数据源都没有 `zoneId` 时，使用 React `useId()` 生成唯一 ID 拼上 `unknown-zoneId-` 前缀。
- **用途**：渲染到 `data-overlay-point-root-id` DOM 属性，可用于浏览器开发者工具定位点位、外部 E2E 测试或埋点。

## 内部布局

```text
<div ref={overlayRootRef" data-overlay-point-root-id="...">
    <PointRoot className="risk-prediction-point---root">  <!-- 顶部：图标 + 标签 + 波纹 -->
        <div className="overlay-item-icons">              <!-- 四类业务图标横向排列 -->
            <Weather data={weather?.cityWeather} />
            <WeatherWarning data={weather?.weatherWarning} />
            <WaterWarning waterWarning={...} rainfall={...} />
            <HighRiskTown data={highRiskTown} />
        </div>
        <div className="overlay-item-label">              <!-- 区域名称标签 -->
            <span>{point.name.replace("市", "")}</span>
        </div>
        <div className="overlay-point-ripple" />          <!-- 波纹动画 -->
    </PointRoot>
    <div ref={bottomTipRef" className="bottom-tip">      <!-- 底部 Portal 挂载点 -->
        <!-- 子模块的详情弹窗、详情表格通过 createPortal 渲染到这里 -->
    </div>
</div>
```

**特殊处理**：`point.name` 会去掉末尾的 `市` 字再显示（如"广州市" → "广州"）。

## 维护要点

- 修改坐标定位逻辑时，注意 `transform: translate()` 性能优于 `left/top`。
- 调整 zIndex 阈值（`999`）需要评估全站浮层层级（如 ECharts tooltip、其他 Modal）。
- 子模块弹窗组件**必须**使用 `useOverlayPoint().createPortal` 挂载，否则 zIndex 自管理会失效。
- 不要在 `bottomTipRef` 容器上手动添加子节点（仅限子模块通过 portal 挂载），避免影响观察器判断。

## 依赖

| 依赖项                           | 用途                                                                |
| -------------------------------- | ------------------------------------------------------------------- |
| `useMapContext().overlayManager` | 获取地图 overlay 管理器（来自 `ui/emap-gis`）                       |
| `ripplePoint`                    | 波纹动画 PNG（`@/images/gis-points/gis-ripple-point.png`）          |
| `pointTriangle`                  | 标签底部三角形 PNG（`@/images/gis-points/label-icon-triangle.png`） |

## 故障排查

### 打点不显示

- 检查 `overlayManager` 是否正确初始化。
- 检查 `props.point.longitude/latitude` 是否为有效数字。
- 检查 `getPixelFromCoordinate` 返回值是否为空（地图未加载完成）。

### 弹窗被遮挡

- 确认子模块使用的是 `useOverlayPoint().createPortal` 而非 `document.body`。
- 检查 zIndex `999` 是否被全局更高层级（如导航栏 1000+）覆盖。
- 排查其他 Modal 是否设置了 `zIndex: 999999` 等高优先级值。

### 弹窗打开后点位无法点击

- 检查 `pointerEvents` 是否正确切换：`children.length > 0` 时应为 `auto`。

## 更新日志

| 版本  | 日期       | 变更说明                                                                                     |
| ----- | ---------- | -------------------------------------------------------------------------------------------- |
| 1.0.0 | 2026-06-17 | 从 SKILL.md 拆分独立文档，补全坐标映射、zIndex 自管理、Portal Context、zoneId 兜底等机制说明 |
