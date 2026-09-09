# center-gis 日常操作模块（模块 1-5）

> 本文档从 SKILL.md 拆分，涵盖 warn-gis center-gis 的图例管理、打点管理、弹窗字段、图层管理、调试技巧。

## 模块 1: 图例管理

### 1.1 添加新的图例项

**场景**: 需要在图例面板中添加新的检查项

**步骤**:

1. **确定分类**
    - 风险预测类: 在 `WarnLegend` 的 `riskPredictionValues` 中添加
    - 物资预置类: 在 `WarnLegend` 的 `materialPresetValues` 中添加

2. **添加初始状态**

```typescript
// 文件: apps/main/app/components/center/warn-gis/warn-legend/index.tsx

const riskPredictionValues = {
    // ... existing items
    新增图例项: false, // ← 添加这一行
};
```

3. **添加全选处理**

```typescript
// 在 handleSelectAll 方法中添加
const handleSelectAll = (category: string, checked: boolean) => {
    const newCheckedValues = { ...checkedValues };

    switch (category) {
        // ... existing cases
        case "newCategory": // ← 添加新分类
            newCheckedValues["新增图例项"] = checked;
            break;
    }

    setCheckedValues(newCheckedValues);
};
```

4. **添加全选状态获取**

```typescript
// 在 getSelectAllStatus 方法中添加
const getSelectAllStatus = (category: string) => {
    let allChecked = true;
    let anyChecked = false;

    switch (category) {
        // ... existing cases
        case "newCategory":
            const items = ["新增图例项"];
            for (const item of items) {
                if (!checkedValues[item]) allChecked = false;
                if (checkedValues[item]) anyChecked = true;
            }
            break;
    }

    if (allChecked) return true;
    if (!anyChecked) return false;
    return undefined;
};
```

5. **添加 UI 渲染**

```typescript
// 在返回的 JSX 中添加
{legendSelected === "风险预测" && (
    <div className="warn-legend--content">
        <div className="legend-group">
            {/* ... existing groups */}
            <div className="legend-row" style={{ marginBottom: 2 }}>
                <div className="group-title-container">
                    <Checkbox
                        className="group-checkbox"
                        indeterminate={getSelectAllStatus("newCategory") === undefined}
                        checked={getSelectAllStatus("newCategory") === true}
                        onChange={(e) => handleSelectAll("newCategory", e.target.checked)}
                        style={{ marginRight: 5 }}
                    ></Checkbox>
                    <div className="group-title">新增分类:</div>
                </div>
                <div className="group-items-container">
                    <div className="group-item" style={{ marginRight: 1 }}>
                        <Image
                            className="group-icon"
                            preview={false}
                            src={`${constants.IMAGE_PATH}/emergency/icon-legend/your-icon.svg`}
                        />
                        <Checkbox
                            className="group-checkbox"
                            value={"新增图例项"}
                            checked={checkedValues["新增图例项"]}
                            onChange={(e) => handleCheckboxChange("新增图例项", e.target.checked)}
                        ></Checkbox>
                        <span className="group-name" style={{ width: 100 }}>
                            新增图例项名称
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
)}
```

**验证点**:

- [ ] 图例面板显示新增项
- [ ] 全选/取消全选功能正常
- [ ] 选中状态正确传递到 `onLegendSelected`
- [ ] 对应的图层显示/隐藏正常

---

## 模块 2: 打点管理

### 2.1 新增打点类型

**场景**: 需要在地图上新增一种类型的打点显示

**步骤**:

1. **创建打点组件**

```typescript
// 文件: apps/main/app/components/center/warn-gis/risk-prediction-points/new-type/index.tsx

import { useMemo } from "react";
import styled from "styled-components";
import { useOverlayPoint } from "../OverlayPoint";

const NewTypeIcon = styled.div`
    width: 44px;
    height: 38px;
    border-radius: 3px;
    background: #your-color;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
`;

export const NewType = (props: { data: any; legendSelected: any }) => {
    const overlayCtx = useOverlayPoint();

    const show = useMemo(() => {
        // 检查图例是否选中
        return props.legendSelected.some((d: any) => d[0] === "newType" && d[1] === true);
    }, [props.legendSelected]);

    if (!show || !props.data) return null;

    return (
        <NewTypeIcon
            className="icon-div"
            onClick={() => {
                // 点击事件处理
                overlayCtx.createPortal(
                    <div className="overlay-item-info-card">
                        <h3>新增类型详情</h3>
                        <p>{props.data.description}</p>
                    </div>
                );
            }}
        >
            {props.data.count ?? 0}
        </NewTypeIcon>
    );
};
```

2. **在 OverlayPoint 中注册**

```typescript
// 文件: apps/main/app/components/center/warn-gis/risk-prediction-points/OverlayPoint.tsx

import { Weather } from "./weather";
import { WeatherWarning } from "./weather-warning";
import { WaterWarning } from "./water-warning";
import { HighRiskTown } from "./high-risk-town";
import { NewType } from "./new-type";  // ← 添加导入

export function OverlayPoint(props: any) {
    // ... existing code

    return (
        <>
            {/* ... existing components */}
            <NewType data={props.newTypeData} legendSelected={props.legendSelected} />
            {/* ... rest of the code */}
        </>
    );
}
```

3. **在 RiskPredictionPoints 中添加数据请求**

```typescript
// 文件: apps/main/app/components/center/warn-gis/risk-prediction-points/index.tsx

// 添加新的 useRequest
useRequest(
    () => {
        return getNewTypeMapApi({
            zoneId: props.currentZone.zoneId,
            zoneLevel: props.currentZone.zoneLevel,
            taskId: props.supportTask.id,
            labelPoints,
        });
    },
    {
        ready: isDefined(props.currentZone) && isDefined(props.supportTask) && isDefined(labelPoints),
        refreshDeps: [props.currentZone, props.supportTask, labelPoints],
        pollingInterval: TIME_RANGE.MINUTE * 15,
        onSuccess: (dataSource) => {
            setState({
                newTypePoints: dataSource,
            });
        },
    },
);
```

4. **在 OverlayPoint 渲染中匹配数据**

```typescript
// 在 RiskPredictionPoints 的返回中
{(labelPoints?.points ?? []).map((point) => {
    // ... existing matches
    const newTypeData = state.newTypePoints.find((d) => {
        if (props.legendSelected["newType"] !== true) {
            return false;
        }
        try {
            return d.config.name === point.name;
        } catch (e) {
            console.error("[中屏打点-新增类型-未命中]", { data: d, labelPoint: point });
            return false;
        }
    });

    return (
        <OverlayPoint
            key={point.name}
            point={point}
            weather={weather}
            waterSituation={waterSituation}
            highRiskTown={highRiskTown}
            newTypeData={newTypeData}  // ← 传递数据
            legendSelected={legendSelectedList}
        />
    );
})}
```

**验证点**:

- [ ] 新打点类型在地图上正确显示
- [ ] 图例选中/取消影响打点显示
- [ ] 点击打点显示详情弹窗
- [ ] 数据轮询正常更新

---

## 模块 3: 弹窗字段管理

### 3.1 添加弹窗字段

**场景**: 需要在鼠标悬浮提示或点击弹窗中添加新字段

**步骤**:

1. **修改字段配置**

```typescript
// 文件: apps/main/app/components/center/warn-gis/center-gis/utils/field.ts

export const fieldSource = [
    {
        key: "无线队伍",
        label: "无线队伍",
        showPopup: true,
        title: "队伍详情",
        field: [
            { key: "userlabel", label: "队伍名称" },
            { key: "resourceTypeName", label: "专业" },
            // ... existing fields
            { key: "newField", label: "新字段", hideEmpty: true }, // ← 添加这一行
        ],
    },
    // ... existing sources
];

export const commonFieldSource = {
    key: "通用物资",
    label: "通用物资",
    showPopup: true,
    title: "物资预置详情",
    field: [
        { key: "resourceTypeName", label: "物资类型" },
        { key: "resourceName", label: "物资编号" },
        // ... existing fields
        { key: "newField", label: "新字段", hideEmpty: true }, // ← 添加这一行
    ],
};
```

2. **在数据源中确保字段存在**

```typescript
// 确保 API 返回的数据包含 newField 字段
// 如果需要转换数据格式，可以在 useRequest 的 converter 中处理
```

**验证点**:

- [ ] 悬浮提示显示新字段
- [ ] 点击弹窗显示新字段
- [ ] `hideEmpty: true` 的字段在为空时正确隐藏

---

## 模块 4: 地图图层管理

### 4.1 添加新的地图图层

**场景**: 需要在地图上添加新的图层类型

**步骤**:

1. **在 MapInit 中添加图层创建方法**

```typescript
// 文件: apps/main/app/components/center/warn-gis/center-gis/utils/mapInit.tsx

export default {
    // ... existing methods

    addNewLayer: function (ctxOpt: any, data: any) {
        const { map, EMap } = ctxOpt;
        if (!map) return;

        const eStyle = new EMap.Style();

        // 清理旧数据
        const gLayer = map.getLayerById("newLayer");
        gLayer && map.clearLayerFeatures(gLayer);

        let layer = map.getLayerById("newLayer");
        if (!layer) {
            layer = new EMap.ELayer({
                type: "Vector",
                id: "newLayer",
                zIndex: 99,
                source: { wrapX: false },
                style: eStyle.style({
                    stroke: eStyle.stroke({
                        color: "#FF5722",
                        lineCap: "round",
                        width: 3,
                    }),
                }),
            });
            map.addLayer(layer);
        }

        // 添加要素
        data.forEach((item: any) => {
            const feature = new EMap.EFeature({
                type: "LineString",
                coordinates: item.coordinates,
                id: item.id,
                layer: layer,
            });
            feature.add();
        });
    },

    setNewLayerStatus: function (ctxOpt: any, visible: boolean) {
        const { map } = ctxOpt;
        if (!map) return;

        const layer = map.getLayerById("newLayer");
        if (layer) {
            layer.setVisible(visible);
        }
    },
};
```

2. **在 CenterGis 中使用**

```typescript
// 文件: apps/main/app/components/center/warn-gis/center-gis/index.tsx

// 添加新的数据请求
const { data: newData = EmptyObject.Array } = useRequest(
    () =>
        getNewLayerDataApi({
            /* params */
        }),
    {
        ready: isDefined(currentZone),
        refreshDeps: [currentZone],
        pollingInterval: interval * TIME_RANGE.SECOND,
    },
);

// 添加 Effect
useEffect(() => {
    if (ctxOpt && newData) {
        MapInit.addNewLayer(ctxOpt, newData);
    }
}, [ctxOpt, newData]);

// 在 setLegendLayerStatus 中添加
const setLegendLayerStatus = () => {
    // ... existing code
    const newTypeCheckList = Object.keys(legendSelected).filter((key) => key === "newType" && legendSelected[key] === true);
    if (newTypeCheckList.length > 0) {
        MapInit.setNewLayerStatus(ctxOpt, true);
    } else {
        MapInit.setNewLayerStatus(ctxOpt, false);
    }
};
```

**验证点**:

- [ ] 新图层正确添加到地图
- [ ] 图层显示/隐藏控制正常
- [ ] 数据更新时图层正确刷新
- [ ] 图层清理正常

---

## 模块 5: 调试技巧

### 5.1 数据不更新问题排查

**问题**: 数据请求未触发或数据未更新

**排查步骤**:

1. **检查依赖项**

```typescript
// 确保所有依赖项都在 refreshDeps 中
useRequest(
    () =>
        getDataApi({
            /* params */
        }),
    {
        ready: isDefined(param1) && isDefined(param2),
        refreshDeps: [param1, param2], // ← 检查这里
        pollingInterval: 300000,
    },
);
```

2. **添加调试日志**

```typescript
useRequest(
    () => {
        console.log("[调试日志] 数据请求触发", { param1, param2 });
        return getDataApi({ param1, param2 });
    },
    {
        // ... existing config
        onSuccess: (data) => {
            console.log("[调试日志] 数据返回", data);
            // ... existing code
        },
        onError: (error) => {
            console.error("[调试日志] 数据请求失败", error);
        },
    },
);
```

3. **检查轮询间隔**

```typescript
// 确保轮询间隔正确
const { interval = 300 } = useEnvironment("gd-emergency-support.modules.warn-gis.request") ?? {};
const pollingInterval = interval * TIME_RANGE.SECOND; // 300 * 1000 = 300000ms
```

4. **检查 ready 条件**

```typescript
// 确保 ready 条件正确
ready: isDefined(param1) && isDefined(param2) && isDefined(param3);
// 如果 param3 是可选的，使用 isDefined(param3) || true
```

### 5.2 地图图层不显示

**问题**: 图层已添加但不可见

**排查步骤**:

1. **检查图层可见性**

```typescript
// 在浏览器控制台执行
const layer = map.getLayerById("your-layer-id");
console.log("图层状态:", {
    id: layer.id_,
    visible: layer.getVisible(),
    zIndex: layer.getZIndex(),
});
```

2. **检查图层样式**

```typescript
// 确保样式正确
const eStyle = new EMap.Style();
layer.setStyle(
    eStyle.style({
        stroke: eStyle.stroke({
            color: "#FF5722", // ← 确保颜色可见
            width: 3,
        }),
    }),
);
```

3. **检查数据**

```typescript
// 确保数据不为空
if (data.length > 0) {
    console.log("[调试日志] 添加图层数据", data.length, "条");
    MapInit.addPoints(ctxOpt, data);
} else {
    console.warn("[调试日志] 图层数据为空");
}
```

### 5.3 弹窗不显示

**问题**: 鼠标悬浮或点击后弹窗不显示

**排查步骤**:

1. **检查 showPopup 配置**

```typescript
// 在 field.ts 中
{
    key: "无线队伍",
    showPopup: true,  // ← 确保为 true
    // ...
}
```

2. **检查 legendSelected**

```typescript
// 在 RiskPredictionPoints 中
if (props.legendSelected["riskPrediction"] !== true) {
    return null; // ← 确保不返回 null
}
```

3. **检查数据**

```typescript
// 在 CenterGis 的 curPoint Effect 中
console.log("[调试日志] 点击数据", {
    intId,
    dataPoint,
    fieldSet,
    state: state.curPoint,
});
```
