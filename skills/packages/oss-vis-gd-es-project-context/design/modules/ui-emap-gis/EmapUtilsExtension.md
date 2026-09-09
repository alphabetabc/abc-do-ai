---
name: "EmapUtilsExtension"
description: "emap.ts 中 EMapUtils 的维护与扩展指南：方法签名约定、返回句柄模式、添加新能力（直通 / 工厂 / 异步）的标准流程"
---

# EMapUtils 扩展与维护指南

> 本文档聚焦 `apps/main/app/components/ui/emap-gis/emap.ts` 中 `EMapUtils` 对象的**维护与扩展**。已有方法的清单与简述见 [SKILL.md](./SKILL.md) 第 4 节；泛光动画的详细 API 见 [GlowPoint.md](./GlowPoint.md)。

## 1. 模块定位

`emap.ts` 是 EMap GIS 能力的**唯一核心工具集**：

- **集中收口**：所有 `map` / `EMap` 操作都通过 `EMapUtils` 暴露，业务侧不再直接调用 EMap SDK
- **统一签名**：所有方法第一参数都是 `TBaseOpts & { map, EMap, ...业务参数 }`
- **统一出口**：业务侧通过 `useEMapUtil` Hook 或 `EMapUtils.xxx` 直调

## 2. 模块加载机制

```ts
import { getEMapLib, deps } from "./emap-loader";

// deps.EMap = 当前地图 SDK 全局对象（懒加载完成后才存在）
// deps.map  = 当前地图实例
```

- `EMap` 通过 `getEMapLib()` 异步加载（脚本注入 / 动态 import）
- 加载完成前 `EMap` 为 `undefined`，所有 EMapUtils 方法内都必须做防御
- **禁止**在模块顶层直接 `new EMap.Style()`，必须放在方法内部或回调里

## 3. 通用签名约定

### 3.1 TBaseOpts

```ts
type TBaseOpts = {
    map: TMapInstance;   // 任意，已 `as any`
    EMap: TEMapLib;      // 任意，已 `as any`
};
```

所有方法第一参数都是 `TBaseOpts & 业务参数`。

### 3.2 opts 风格

```ts
addPoints: (
    opts: TBaseOpts & {
        layerId: string;
        points: Array<TPoint>;
        getIcon: (point: any) => string;
        // ... 业务参数
    },
) => { ... }
```

**约定**：

1. 第一参数统一为 `opts`（不是散列参数）
2. 业务参数写在 `& { ... }` 内，避免污染 `TBaseOpts`
3. 可选参数使用 `?:`，不要用 `undefined` 默认值
4. 复杂类型在文件顶部独立定义（如 `TPoint`）

### 3.3 类型定义位置

```ts
// 1) 简单类型放文件顶部
type TMapInstance = any;
type TEMapLib = any;
type TBaseOpts = { map: TMapInstance; EMap: TEMapLib };
type TPoint = { id: any; type: any; longitude: any; latitude: any };

// 2) 复杂 / 复用类型放同目录其他文件
//    - 域类型 → EmapFormatter（坐标）
//    - 请求类型 → MapEmergencyTransmission.tsx
//    - 动画点类型 → AnimatePointsLayer.ts
```

## 4. 返回值约定（三种模式）

### 4.1 直通模式（无返回值）

适用于一次性操作（设置、清空、聚焦）：

```ts
setCenter: (opts: TBaseOpts & { center: [number, number] }) => {
    const { map } = opts;
    map.setCenter(opts.center);
},

clearLayer: (opts: TBaseOpts & { layer: any }) => {
    const { map } = opts;
    map.clearLayer(opts.layer);
},
```

**特征**：返回 `void`，无状态。

### 4.2 句柄模式（推荐用于图层/资源类）

适用于需要后续清理的资源（图层、动画、覆盖物）：

```ts
addAnimatePoints: (opts: TBaseOpts & { ... }) => {
    const instance = new AnimatePointsLayer(opts);
    return {
        destroy: () => instance.destroy(),
        layer: instance.layer,
        instance,
    };
},
```

**统一结构**：

```ts
{
    destroy: () => void,  // 必须：释放资源（卸载 RAF / 清空 features / 解绑事件）
    layer?: any,          // 可选：EMap 矢量图层引用
    instance?: any,       // 可选：底层类实例，供高级用法
    [key]: ...            // 业务自定义字段（如 layerPromise）
}
```

### 4.3 异步图层模式

适用于 WFS / WMS 这类**网络请求驱动的图层**：

```ts
addWFSLayer: (opts: TBaseOpts & { layerCode, keyCode, ... }) => {
    const state = {
        cancelFlag: false,
        layerPromise: null as any,
        layerPromiseResolver: null as any,
    };

    state.layerPromise = new Promise((resolve) => {
        state.layerPromiseResolver = resolve;
    });

    requestWFS
        .then((layer: any) => {
            if (state.cancelFlag) return;  // 已取消的请求不落地
            wfsLayer = layer;
            map.addLayer(wfsLayer);
            state.layerPromiseResolver({ layer, defaultStyle });
        })
        .catch((err) => { ... });

    const remove = () => {
        state.cancelFlag = true;
        if (wfsLayer) {
            map.removeLayer(wfsLayer);
            wfsLayer = null;
        }
    };

    return {
        remove,
        get layer() { return wfsLayer; },
        get layerPromise() {
            return state.layerPromise as Promise<{ layer: any; defaultStyle: any }>;
        },
    };
},
```

**关键点**：

1. **`cancelFlag` 模式**：组件卸载时调用 `remove()`，通过 `cancelFlag` 让迟到的 `then` 失效，避免"卸载后还往地图加图层"
2. **`get layer()` getter**：layer 是异步生成的，必须用 getter，不能直接挂字段
3. **`layerPromise`**：让调用方可以 `await` 图层就绪后再做事

## 5. EMapUtils 方法完整索引

### 5.1 地图初始化

| 方法 | 签名 | 返回 |
| --- | --- | --- |
| `initMap` | `(containerId, { callback })` | 通过 callback 注入 map/EMap |

### 5.2 图层操作

| 方法 | 签名 | 返回 |
| --- | --- | --- |
| `addPoints` | `(opts: TBaseOpts & { layerId, points, getIcon, ... })` | `{ remove, layer }` |
| `addPoint` | `(opts: TBaseOpts & { layer, style, point, data })` | `{ remove, feature }` |
| `addAnimatePoints` | `(opts: TBaseOpts & { layerId, points, mode, ... })` | `{ destroy, layer, instance }` |
| `addLayer` | `(opts: TBaseOpts & { id })` | `layer` |
| `addPointLayer` | `(opts: TBaseOpts & { id })` | `layer` |
| `addWFSLayer` | `(opts: TBaseOpts & { layerCode, keyCode, layerId, ... })` | `{ remove, layer, layerPromise }` |
| `addEmergencyTransmissionLayer` | `(opts: TBaseOpts & { serverCodeName, cqlFilter, ... })` | `{ remove, layer, layerPromise, ... }` |
| `addWKTFeature` | `(opts: { layer, id, wktString })` | — |
| `getLayerById` | `(opts: TBaseOpts & { id })` | `layer` |
| `clearLayer` | `(opts: TBaseOpts & { layer })` | — |
| `clearAllLayer` | `(opts: TBaseOpts)` | — |
| `setLayerStatus` | `(opts: TBaseOpts & { filter: any[] })` | — |
| `setTileFilterColor` | `(map, filter)` | — |
| `refreshTileFilterLayer` | `(map)` | — |

### 5.3 交互功能

| 方法 | 签名 | 返回 |
| --- | --- | --- |
| `createPopup` | `(opts: TBaseOpts & { getTipContainer, onMove, onClick, ... })` | popup + events |
| `createToolbar` | `(opts: TBaseOpts & { type, onAoiPlaceItemClick })` | toolbar |
| `createDrawSelect` | `(opts: TBaseOpts & { callback })` | draw control |

### 5.4 视图控制

| 方法 | 签名 |
| --- | --- |
| `setCenter` | `(opts: TBaseOpts & { center })` |
| `zoomToExtent` | `(opts: TBaseOpts & { extent })` |
| `updateSize` | `(opts: TBaseOpts)` |
| `focusPositionPoint` | `(opts: TBaseOpts & { center, zoom, duration })` |
| `focusPositionExtent` | `(opts: TBaseOpts & { extent \| layerId, padding, duration })` |

### 5.5 要素查询

| 方法 | 签名 |
| --- | --- |
| `findFeatureByPoint` | `(opts: TBaseOpts & { point })` |
| `pickFeatureByPoint` | `(opts: TBaseOpts & { point })` |
| `pickFeatureByPointId` | `(opts: TBaseOpts & { point })` |

### 5.6 其他

| 方法 | 签名 | 返回 |
| --- | --- | --- |
| `getScheduler` | `(opts: TBaseOpts)` | `TaskScheduler` |
| `addDestroy` | `(opts: TBaseOpts & { callback })` | — |
| `destroyMap` | `(map)` | — |

## 6. 添加新能力的标准流程

### 6.1 简单直通方法（设置 / 清空 / 聚焦）

**适用场景**：一次性操作，不需要销毁句柄。

**模板**：

```ts
/**
 * 一句话能力说明
 * @param opts.map    地图实例
 * @param opts.EMap   EMap 库引用
 * @param opts.xxx    业务参数
 */
mySimpleMethod: (opts: TBaseOpts & {
    xxx: SomeType;
}) => {
    const { map } = opts;
    map.someSdkCall(opts.xxx);
},
```

**示例**（参考 `setCenter`）：

```ts
/**
 * 设置地图中心点
 */
setCenter: (opts: TBaseOpts & { center: [number, number] }) => {
    const { map } = opts;
    map.setCenter(opts.center);
},
```

**步骤**：
1. 在 `emap.ts` 的 `EMapUtils = { ... }` 对象中添加方法
2. 写入 JSDoc（说明、参数、副作用）
3. 完成

### 6.2 工厂入口模式（创建图层 / 资源 + 返回句柄）

**适用场景**：创建图层、动画、覆盖物等**有生命周期的资源**。

**模板**：

```ts
/**
 * 创建 XXX 并返回销毁句柄
 * @returns { destroy, layer, instance }
 */
myFactory: (opts: TBaseOpts & {
    layerId: string;
    // ... 业务参数
}) => {
    // 1) 防御
    if (!opts.map || !opts.EMap) throw new Error("[myFactory] map/EMap 必填");

    // 2) 创建或复用图层
    let layer = opts.map.getLayerById(opts.layerId);
    if (!layer) {
        layer = new opts.EMap.ELayer({ ... });
        opts.map.addLayer(layer);
    } else {
        opts.map.clearLayerFeatures(layer);  // 复用前清空
    }

    // 3) 委托给独立的类/模块（推荐）
    const instance = new MyClass({ map: opts.map, EMap: opts.EMap, layer, ... });

    // 4) 返回句柄
    return {
        destroy: () => instance.destroy(),
        layer,
        instance,
    };
},
```

**示例**（参考 `addAnimatePoints`）：

```ts
addAnimatePoints: (
    opts: TBaseOpts & {
        layerId: string;
        points: IAnimatePoint[];
        mode?: AnimateMode;
        // ...
    },
) => {
    const instance = new AnimatePointsLayer(opts);
    return {
        destroy: () => instance.destroy(),
        layer: instance.layer,
        instance,
    };
},
```

**步骤**：
1. 在同目录新建类文件（如 `MyClass.ts`），封装核心逻辑（类内置 RAF / d3 / state）
2. 在 `emap.ts` 顶部 `import { MyClass }`
3. 在 `EMapUtils` 中加薄包装方法（参数透传 + 返回句柄）
4. 如需在 React Hook 中直接调用，**无需修改 hooks.ts**（已通过泛型自动支持）

### 6.3 异步图层模式（WFS / WMS 网络请求）

**适用场景**：图层数据来自网络请求（GeoJSON / WFS / WMS）。

**模板**：

```ts
myAsyncLayer: (opts: TBaseOpts & {
    layerId: string;
    url: string;
    // ...
}) => {
    const { EMap, map } = opts;
    let myLayer: any = null;

    // 1) 异步状态
    const state = {
        cancelFlag: false,
        layerPromise: null as any,
        layerPromiseResolver: null as any,
    };
    state.layerPromise = new Promise((resolve) => {
        state.layerPromiseResolver = resolve;
    });

    // 2) 发起请求
    fetchData(opts.url)
        .then((data) => {
            if (state.cancelFlag) return;  // 已取消，丢弃结果

            myLayer = new EMap.ELayer({
                type: "WFS",  // 或 WMS / Vector
                id: opts.layerId,
                url: opts.url,
                // ...
            });
            map.addLayer(myLayer);
            state.layerPromiseResolver({ layer: myLayer, defaultStyle: null });
        })
        .catch((err) => {
            console.error("[myAsyncLayer]", err);
        });

    // 3) remove 句柄
    const remove = () => {
        state.cancelFlag = true;
        if (myLayer) {
            map.removeLayer(myLayer);
            myLayer = null;
        }
    };

    return {
        remove,
        get layer() { return myLayer; },         // 异步字段用 getter
        get layerPromise() {
            return state.layerPromise as Promise<{ layer: any; defaultStyle: any }>;
        },
    };
},
```

**示例参考**：`addWFSLayer`（L809-1074）、`addEmergencyTransmissionLayer`（L1113-1238）

### 6.4 React 组件封装（可选）

如果该能力需要 React 组件包装（如自动随组件卸载）：

**模板**（参考 `MapWidgetWFSLayer.tsx`、`MapEmergencyTransmission.tsx`）：

```tsx
import { useEffect } from "react";
import { useEMapUtil } from "./hooks";

export function MyLayer({ layerId, ...props }: Props) {
    const myFactory = useEMapUtil("myFactory");

    useEffect(() => {
        const handle = myFactory({ layerId, ...props });
        return handle.destroy;  // 卸载时自动清理
    }, [layerId]);

    return null;
}
```

**步骤**：
1. 在 `index.tsx` 中导出新组件
2. 业务侧按需使用

## 7. 防御性编程清单

每个新方法都应满足：

| 项 | 说明 |
| --- | --- |
| ✅ map / EMap 校验 | `if (!map \|\| !EMap) throw / return` |
| ✅ 参数校验 | `if (!layerId) throw / return null` |
| ✅ 复用前清空 | `map.getLayerById(x)` 命中后 `clearLayerFeatures(layer)` |
| ✅ 销毁句柄 | 返回 `{ destroy / remove }` |
| ✅ 异常捕获 | `try { ... } catch (_) {}` 防止 SDK 抛错污染 RAF |
| ✅ JSDoc 注释 | 方法顶部写清 `@param` `@returns` |

## 8. 集成路径（React 侧）

业务侧使用 EMapUtils 有三种方式：

### 8.1 直调（MapContext 外）

```ts
import { EMapUtils } from "@/app/components/ui/emap-gis";

const result = EMapUtils.addAnimatePoints({ map, EMap, ... });
```

### 8.2 useEMapUtil Hook（MapContext 内，推荐）

```tsx
import { useEMapUtil } from "@/app/components/ui/emap-gis";

const addAnimatePoints = useEMapUtil("addAnimatePoints");

useEffect(() => {
    return addAnimatePoints({ layerId: "x", points, mode: "ripple" }).destroy;
}, [points]);
```

**hooks.ts 自动适配**：无需修改，新加的 EMapUtils 方法会被 `useEMapUtil` 通过泛型自动支持。

### 8.3 类直调（不通过 EMapUtils）

```tsx
import { AnimatePointsLayer } from "@/app/components/ui/emap-gis";

const layer = new AnimatePointsLayer({ map, EMap, layerId, points, mode });
// ... 自行管理生命周期
```

**何时用直调**：
- 需要暴露类的更多内部 API（如 `layer.getCurrentFrame()`）
- 多个 hook / 组件需要共享同一实例（提升到 ref/store）

## 9. 类型导出

`emap.ts` 末尾统一导出：

```ts
export {
    EMapUtils,
    EMapFormatter,
    EMapGlobalRequest,
    setTileFilterColor,
    refreshTileFilterLayer,
    destroyMap,
    EMapRequest,
};

export type {
    TMapInstance,
    TEMapLib,
    TBaseOpts,
};
```

**新增类型时**：
1. 简单类型放 `emap.ts` 顶部 + `export type`
2. 复杂类型放独立文件（与类同文件），通过 `index.tsx` 二次导出

## 10. 常见陷阱

### 10.1 EMap 未加载完成就调用

```ts
// ❌ 错误
addLayer: (opts) => {
    new opts.EMap.ELayer({ ... });  // opts.EMap 可能是 undefined
},

// ✅ 正确
addLayer: (opts) => {
    const { EMap, map } = opts;
    if (!EMap || !map) return null;
    new EMap.ELayer({ ... });
},
```

### 10.2 复用图层前不清空

```ts
// ❌ 错误：复用旧 layer，会导致 feature 累积
let layer = map.getLayerById(layerId) ?? new EMap.ELayer({ id: layerId, ... });

// ✅ 正确：复用前清空
let layer = map.getLayerById(layerId);
if (!layer) {
    layer = new EMap.ELayer({ id: layerId, ... });
    map.addLayer(layer);
} else {
    map.clearLayerFeatures(layer);
}
```

### 10.3 异步请求未取消

```ts
// ❌ 错误：组件卸载后请求还在飞，回调里 map.addLayer 会报错
fetchData().then((data) => {
    map.addLayer(newLayer);  // map 已被销毁
});

// ✅ 正确：cancelFlag 短路
const state = { cancelFlag: false };
fetchData().then((data) => {
    if (state.cancelFlag) return;  // 已卸载
    map.addLayer(newLayer);
});
const remove = () => { state.cancelFlag = true; };
```

### 10.4 在模块顶层 new EMap

```ts
// ❌ 错误：模块加载时 EMap 还没加载完
const eStyle = new EMap.Style();  // EMap is undefined

// ✅ 正确：在方法内部或回调里 new
addLayer: (opts) => {
    const eStyle = new opts.EMap.Style();
    // ...
};
```

### 10.5 useEMapUtil 泛型不识别新方法

如果新加方法后 `useEMapUtil("xxx")` 报类型错误，检查：
- `EMapUtils` 对象中**确实有**同名键
- 没有用 `// @ts-ignore` 绕过类型
- 重启 TS Server

## 11. 完整示例：添加新方法 `addHeatmap`

假设要添加一个"热力图"图层能力：

```ts
// 1) 在 emap.ts 顶部定义类型（如果简单）
type THeatmapPoint = { lng: number; lat: number; weight: number };

// 2) 在 emap.ts 中添加方法
addHeatmap: (
    opts: TBaseOpts & {
        layerId: string;
        points: THeatmapPoint[];
        blur?: number;
        radius?: number;
    },
) => {
    const { EMap, map } = opts;
    if (!EMap || !map) return { destroy: () => {}, layer: null };

    let layer = map.getLayerById(opts.layerId);
    if (!layer) {
        layer = new EMap.ELayer({
            type: "Heatmap",
            id: opts.layerId,
            zIndex: 50,
            blur: opts.blur ?? 15,
            radius: opts.radius ?? 20,
        });
        map.addLayer(layer);
    }

    // ... 配置数据源、监听事件

    return {
        destroy: () => {
            try {
                if (layer && map.getLayerById(opts.layerId)) {
                    map.removeLayer(layer);
                }
            } catch (_) {}
        },
        layer,
    };
},

// 3) 业务侧直接使用（无需改 hooks.ts / index.tsx）
const { destroy, layer } = EMapUtils.addHeatmap({
    map, EMap, layerId: "x", points: [...],
});
```

## 12. 版本

- **文档版本**: 1.0
- **最后更新**: 2026-06-25
- **变更说明**:
  - 初始版本：基于现有 `emap.ts` 中 27 个 EMapUtils 方法的归纳总结
  - 沉淀三种方法模式（直通 / 工厂 / 异步）+ 防御性编程清单 + 常见陷阱
  - 为后续添加新能力（如 `addHeatmap` / `addCluster` / `addDrawControl`）提供标准 SOP
- **依赖**: 与 SKILL.md 第 11 节一致（EMap SDK、ahooks、clsx、blueimp-md5、lodash-es、d3）