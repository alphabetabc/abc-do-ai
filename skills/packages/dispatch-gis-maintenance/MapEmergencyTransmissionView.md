# MapEmergencyTransmissionView 组件维护文档

## 1. 概述

`MapEmergencyTransmissionView` 是指挥调度 GIS 模块中负责**传输路由告警图层渲染**的核心组件。该组件根据图例选中状态动态加载和显示传输线路的告警数据，支持二干、骨干层、汇聚层、接入层、乡镇三路由等多种传输路由类型。

**组件定位**: 作为传输路由告警数据与地图图层之间的桥梁，负责数据请求、过滤、转换和图层渲染。

**核心特性**:

- 支持多选图例，各类型独立请求和渲染
- 按需请求：最多两个独立的全量数据请求（二干 + 本地）
- 主图层可见性控制：通过 `mainLayerVisible` 属性控制
- 子图层支持：通过 `enableSubLayer` 属性启用子图层渲染

## 2. 组件结构

```
MapEmergencyTransmissionView/
└── index.tsx          # 主组件，管理状态和数据流转
    ├── LAYER_CONFIG   # 图层配置常量
    └── TransmissionAlarmLayer  # 内部组件，封装单图层逻辑
```

## 3. 核心功能实现

### 3.1 图层配置

**文件**: `apps/main/app/components/center/dispatch-gis/MapEmergencyTransmissionView.tsx`

```typescript
const LAYER_CONFIG = {
    二干: { serverCodeName: "省级传输二干告警图层", filterType: "1", dataTimeId: "15" },
    骨干层路由: { serverCodeName: "地市骨干层路由告警图层", filterType: "3", dataTimeId: "16" },
    汇聚路由: { serverCodeName: "区县汇聚层路由告警图层", filterType: "4", dataTimeId: "16" },
    接入层: { serverCodeName: "乡镇接入层路由告警图层", filterType: "2", dataTimeId: "16" },
};
```

### 3.2 内部组件 - TransmissionAlarmLayer

封装单个图层的完整流程：参数计算、数据请求和图层渲染：

```typescript
interface TransmissionAlarmLayerProps {
    serverCodeName: string;
    filterType: string;
    fullData: any[];
    currentZone: any;
    emergencyTransmissionCqlFilter: string;
    interval: number;
    mainLayerVisible?: boolean;
}

function TransmissionAlarmLayer(props: TransmissionAlarmLayerProps) {
    const { serverCodeName, filterType, fullData, emergencyTransmissionCqlFilter, mainLayerVisible } = props;

    const circuitNames = useMemo(() => {
        return Array.from(
            new Set(
                (fullData ?? [])
                    .filter((d: any) => d.type === filterType)
                    .flatMap((d: any) => String(d.optical ?? "").split(";"))
                    .map((d: string) => d.trim())
                    .filter(Boolean),
            ),
        );
    }, [fullData, filterType]);

    const { data: alarmLayerData } = useRequest(
        async () => {
            if (!isEmpty(circuitNames)) {
                return getEmergencyTransmissionAlarmLayerDataApi({ serverCodeName, circuitNames });
            }
            return [];
        },
        {
            refreshDeps: [serverCodeName, circuitNames],
        },
    );

    return (
        <MapEmergencyTransmission
            mainLayerVisible={mainLayerVisible}
            serverCodeName={serverCodeName}
            cqlFilter={emergencyTransmissionCqlFilter}
            subLayerList={alarmLayerData}
            enableSubLayer
        />
    );
}
```

### 3.3 circuitNames 计算与 optical 去重

`TransmissionAlarmLayer` 会从全量告警数据中提取当前图层所需的传输电路名称列表，并作为 `getEmergencyTransmissionAlarmLayerDataApi` 的 `circuitNames` 参数。

**处理规则**：

1. 按当前图层的 `filterType` 过滤 `fullData`。
2. 读取每条数据的 `optical` 字段。
3. `optical` 可能是单个名称，也可能是 `"线路A;线路B;线路A"` 这类分号拼接字符串。
4. 需要按 `;` 拆分，`trim()` 去掉首尾空格，过滤空字符串。
5. 使用 `Set` 去重，避免重复请求相同传输电路图层。

**推荐实现**：

```typescript
const circuitNames = useMemo(() => {
    return Array.from(
        new Set(
            (fullData ?? [])
                .filter((d: any) => d.type === filterType)
                .flatMap((d: any) => String(d.optical ?? "").split(";"))
                .map((d: string) => d.trim())
                .filter(Boolean),
        ),
    );
}, [fullData, filterType]);
```

**注意事项**：

- 不要直接 `.map((d) => d.optical)`，否则 `"A;B"` 会被当作一个整体传给图层接口。
- 去重应在拆分后执行，避免 `A;B` 与 `A` 这类数据造成重复图层请求。
- `String(d.optical ?? "")` 可兼容空值，避免 `split` 报错。

### 3.4 数据时间计算

根据图例选中状态分别计算二干和本地的数据时间：

```typescript
const shouldRequestErgan = legendSelected["传输路由中断"] && legendSelected["二干"];
const shouldRequestLocal = legendSelected["传输路由中断"] && (legendSelected["骨干层路由"] || legendSelected["汇聚路由"] || legendSelected["接入层"]);

// 二干告警时间
const erganDataTime = useMemo(() => {
    if (!shouldRequestErgan || isEmpty(networkScaleData)) {
        return null;
    }
    return networkScaleData.find((d: any) => d.id === "15")?.data?.dataTime ?? "";
}, [shouldRequestErgan, networkScaleData]);

// 本地告警时间
const localDataTime = useMemo(() => {
    if (!shouldRequestLocal || isEmpty(networkScaleData)) {
        return null;
    }
    return networkScaleData.find((d: any) => d.id === "16")?.data?.dataTime ?? "";
}, [shouldRequestLocal, networkScaleData]);
```

### 3.5 全量告警数据请求（按需）

重构后分为两个独立请求，按需触发：

```typescript
// 二干告警数据请求
const { data: erganFullData = EmptyObject.Array } = useRequest(
    async () => {
        return getTransmissionRouteInterruptionAlarmApi({
            regionName: currentZone?.regionName,
            cityName: currentZone?.cityName,
            townName: currentZone?.townName,
            dataTime: erganDataTime,
        });
    },
    {
        ready: isDefined(erganDataTime) && isDefined(currentZone),
        refreshDeps: [currentZone, erganDataTime, shouldRequestErgan],
        pollingInterval: interval * TIME_RANGE.SECOND,
    },
);

// 本地告警数据请求（骨干层/汇聚/接入层共用）
const { data: localFullData = EmptyObject.Array } = useRequest(
    async () => {
        return getTransmissionRouteInterruptionAlarmApi({
            regionName: currentZone?.regionName,
            cityName: currentZone?.cityName,
            townName: currentZone?.townName,
            dataTime: localDataTime,
        });
    },
    {
        ready: isDefined(localDataTime) && isDefined(currentZone),
        refreshDeps: [currentZone, localDataTime, shouldRequestLocal],
        pollingInterval: interval * TIME_RANGE.SECOND,
    },
);
```

### 3.6 图层渲染

根据图例选中状态渲染对应的传输路由图层，支持多选：

```typescript
{legendSelected["骨干层路由"] && (
    <TransmissionAlarmLayer
        {...LAYER_CONFIG["骨干层路由"]}
        fullData={shouldRequestLocal ? localFullData : EmptyObject.Array}
        currentZone={currentZone}
        emergencyTransmissionCqlFilter={emergencyTransmissionCqlFilter}
        interval={interval}
        mainLayerVisible={legendSelected["传输路由正常"]}
    />
)}

{legendSelected["汇聚路由"] && (
    <TransmissionAlarmLayer
        {...LAYER_CONFIG["汇聚路由"]}
        fullData={shouldRequestLocal ? localFullData : EmptyObject.Array}
        currentZone={currentZone}
        emergencyTransmissionCqlFilter={emergencyTransmissionCqlFilter}
        interval={interval}
        mainLayerVisible={legendSelected["传输路由正常"]}
    />
)}

{legendSelected["接入层"] && (
    <TransmissionAlarmLayer
        {...LAYER_CONFIG["接入层"]}
        fullData={shouldRequestLocal ? localFullData : EmptyObject.Array}
        currentZone={currentZone}
        emergencyTransmissionCqlFilter={emergencyTransmissionCqlFilter}
        interval={interval}
        mainLayerVisible={legendSelected["传输路由正常"]}
    />
)}

{legendSelected["乡镇三路由"] && (
    <MapEmergencyTransmission
        serverCodeName="乡镇三路由告警图层"
        cqlFilter={emergencyTransmissionCqlFilter}
        mainLayerVisible={legendSelected["传输路由正常"]}
    />
)}

{legendSelected["节点机房"] && (
    <MapEmergencyTransmission
        serverCodeName="乡镇路由站点告警图层表"
        cqlFilter={emergencyTransmissionCqlFilter}
        mainLayerVisible={legendSelected["传输路由正常"]}
    />
)}

{legendSelected["二干"] && (
    <TransmissionAlarmLayer
        {...LAYER_CONFIG["二干"]}
        fullData={shouldRequestErgan ? erganFullData : EmptyObject.Array}
        currentZone={currentZone}
        emergencyTransmissionCqlFilter={emergencyTransmissionCqlFilter}
        interval={interval}
        mainLayerVisible={legendSelected["传输路由正常"]}
    />
)}
```

## 4. API 接口说明

| 接口名                                      | 功能                     | 参数                                             | 返回值   |
| ------------------------------------------- | ------------------------ | ------------------------------------------------ | -------- |
| `getTransmissionRouteInterruptionAlarmApi`  | 获取传输路由中断告警数据 | `regionName`, `cityName`, `townName`, `dataTime` | 告警数组 |
| `getEmergencyTransmissionAlarmLayerDataApi` | 获取告警图层数据         | `serverCodeName`, `circuitNames`                 | 图层数据 |

## 5. 图例状态映射

| 图例名称   | 图层服务名             | 类型枚举值 | dataTimeId |
| ---------- | ---------------------- | ---------- | ---------- |
| 二干       | 省级传输二干告警图层   | 1          | 15         |
| 骨干层路由 | 地市骨干层路由告警图层 | 3          | 16         |
| 汇聚路由   | 区县汇聚层路由告警图层 | 4          | 16         |
| 接入层     | 乡镇接入层路由告警图层 | 2          | 16         |
| 乡镇三路由 | 乡镇三路由告警图层     | -          | -          |
| 节点机房   | 乡镇路由站点告警图层表 | -          | -          |

## 6. 数据流程

```
图例状态变化 → 传输路由中断判断 → 数据时间计算 → 全量告警数据请求（按需）→ 图层数据请求 → 地图渲染
    ↓                      ↓                ↓                ↓                       ↓            ↓
 legendSelected → shouldRequest判断 → useMemo → useRequest(二干/本地) → TransmissionAlarmLayer → MapEmergencyTransmission
```

**关键控制点**：

1. **按需请求**：只有当对应类型被选中时才发起请求
    - 二干请求：`shouldRequestErgan = legendSelected["传输路由中断"] && legendSelected["二干"]`
    - 本地请求：`shouldRequestLocal = legendSelected["传输路由中断"] && (骨干层路由 || 汇聚路由 || 接入层)`

2. **数据源安全**：使用条件判断确保只在应该请求时使用数据

    ```typescript
    fullData={shouldRequestLocal ? localFullData : EmptyObject.Array}
    ```

3. **主图层可见性**：`mainLayerVisible={legendSelected["传输路由正常"]}` 控制主图层显示

4. **子图层启用**：`enableSubLayer` 属性启用子图层渲染，用于显示告警信息

## 7. 配置参数

### 7.1 请求配置

**文件**: `apps/main/app/environment.ts`

```typescript
{
    "gd-emergency-support": {
        "modules": {
            "dispatch-gis": {
                "request": {
                    "interval": 300  // 轮询间隔（秒）
                }
            }
        }
    }
}
```

### 7.2 组件属性

| 属性名                           | 类型     | 说明         |
| -------------------------------- | -------- | ------------ |
| `currentZone`                    | `any`    | 当前区域信息 |
| `legendSelected`                 | `any`    | 图例选中状态 |
| `emergencyTransmissionCqlFilter` | `string` | CQL过滤条件  |

### 7.3 TransmissionAlarmLayer 属性

| 属性名                           | 类型      | 说明             |
| -------------------------------- | --------- | ---------------- |
| `serverCodeName`                 | `string`  | 图层服务名       |
| `filterType`                     | `string`  | 类型枚举值       |
| `fullData`                       | `any[]`   | 全量告警数据     |
| `currentZone`                    | `any`     | 当前区域信息     |
| `emergencyTransmissionCqlFilter` | `string`  | CQL过滤条件      |
| `interval`                       | `number`  | 轮询间隔（毫秒） |
| `mainLayerVisible`               | `boolean` | 主图层可见性     |

## 8. 修复记录

| 修复项                        | 修复内容                                                            | 代码位置  |
| ----------------------------- | ------------------------------------------------------------------- | --------- |
| `optical` 分号拆分去重        | `optical` 可能包含 `A;B;A`，需拆分、去空、去重后生成 `circuitNames` | L58-68    |
| `enableSubLayer`              | 添加 `enableSubLayer` 属性启用子图层渲染                            | L56       |
| `refreshDeps`                 | 添加 `shouldRequestErgan` 和 `shouldRequestLocal` 到依赖数组        | L99, L115 |
| `TransmissionAlarmLayerProps` | 添加 `currentZone` 和 `interval` 属性                               | L25-26    |

## 9. 常见问题解决方案

### 9.1 传输路由不显示

**问题**: 图例已选中但传输路由不显示

**解决方案**:

```typescript
// 检查数据时间是否获取成功
if (!erganDataTime && !localDataTime) {
    console.warn("[MapEmergencyTransmissionView] 数据时间为空");
    return;
}

// 检查告警数据是否返回
if (!erganFullData || erganFullData.length === 0) {
    console.warn("[MapEmergencyTransmissionView] 二干告警数据为空");
}

if (!localFullData || localFullData.length === 0) {
    console.warn("[MapEmergencyTransmissionView] 本地告警数据为空");
}
```

### 9.2 图层重复渲染

**问题**: 多次选中图例导致图层重复渲染

**解决方案**:

```typescript
// 使用 refreshDeps 确保依赖变化时重新请求
{
    refreshDeps: [serverCodeName, circuitNames], // 依赖变化时重新请求
}
```

### 9.3 多选图例不生效

**问题**: 同时选中多个图例类型时只有部分生效

**解决方案**:

确保每个图层使用独立的数据源和参数：

```typescript
// 每个类型使用对应的数据
fullData={shouldRequestLocal ? localFullData : EmptyObject.Array}  // 本地类型
fullData={shouldRequestErgan ? erganFullData : EmptyObject.Array}   // 二干类型
```

### 9.4 optical 分号拼接导致图层缺失或重复

**问题**: 接口返回的 `optical` 可能是 `"线路A;线路B;线路A"`，如果直接作为一个字符串传给图层接口，会导致部分子图层不显示；如果不去重，会导致重复请求。

**解决方案**:

```typescript
const circuitNames = Array.from(
    new Set(
        (fullData ?? [])
            .filter((d: any) => d.type === filterType)
            .flatMap((d: any) => String(d.optical ?? "").split(";"))
            .map((d: string) => d.trim())
            .filter(Boolean),
    ),
);
```

## 10. 相关文件

| 文件路径                                                                        | 说明                          |
| ------------------------------------------------------------------------------- | ----------------------------- |
| `apps/main/app/components/center/dispatch-gis/MapEmergencyTransmissionView.tsx` | 主组件                        |
| `apps/main/app/ui/emap-gis/index.ts`                                            | MapEmergencyTransmission 组件 |
| `apps/main/app/request/center.ts`                                               | API 请求定义                  |
| `apps/main/app/components/center/dispatch-gis/dispatch-legend/index.tsx`        | 图例组件                      |

---

**文档版本**: 2.2
**最后更新**: 2026-06-09
**维护团队**: GD Emergency Support Team
**更新内容**: 补充 `optical` 分号拼接拆分、去空、去重规则，避免传输路由子图层缺失或重复请求
