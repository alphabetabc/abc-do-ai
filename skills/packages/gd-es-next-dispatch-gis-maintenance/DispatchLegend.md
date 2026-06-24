# DispatchLegend 组件维护文档

## 1. 概述

`DispatchLegend` 是指挥调度 GIS 模块中的**图例控制组件**，负责管理地图上各种图层的显示/隐藏状态。该组件提供了应急物资、物理站点、传输路由、动环机房等多种图例类型的复选框控制，支持单选和批量选择操作。

**组件定位**: 作为地图图例的交互控制中心，协调各图层的可见性状态，实现用户与地图图层的交互。

## 2. 组件结构

```
dispatch-legend/
├── index.tsx                                # 主组件，管理状态和交互逻辑
├── index.css                                # 样式文件
└── useEmergencyTransmissionLegendIcons.ts   # 传输路由图例图标 hook
```

**关联文件**：
- `apps/main/app/components/center/dispatch-gis/presets.ts` — 包含 `LAYER_CONFIG`（`defaultLegendIcon` 兜底）和 `useCurrentEmergencyTransmissionLayerSettings`（按 zoneLevel 取分级配置）

## 3. 核心功能实现

### 3.1 默认状态配置

**文件**: `apps/main/app/components/center/dispatch-gis/dispatch-legend/index.tsx`

组件维护了一个完整的图例状态映射表：

```typescript
const defaultValues = {
    // 应急物资和抢修队伍
    任务中: true,
    应急通信车: false,
    抢修车辆: false,
    无线队伍: false,
    空闲: false,
    应急发电车: false,
    卫星便携包: false,
    传输队伍: false,
    跨市调度: showCrossLine,

    // 物理站点
    核心层: true,
    重要层: false,
    支撑层: false,
    普通站: false,
    光缆: false,
    机房: false,

    // 传输路由
    二干: false,
    骨干层路由: false,
    汇聚路由: false,
    接入层: false,
    乡镇三路由: false,
    节点机房: false,

    // 传输路由状态
    传输路由中断: false,
    传输路由正常: false,

    // 物理站址状态
    物理站址退服: true,
    物理站址正常: false,

    // 动环机房
    动环机房停电: false,
    动环机房环境: false,
    动环机房正常: false,
    核心机楼: false,
    重要汇聚: false,
    普通汇聚: false,
    业务汇聚: false,
};
```

### 3.2 单个复选框变化处理

```typescript
const handleCheckboxChange = (value: string, checked: boolean) => {
    // 定义应急物资和抢修队伍的checkbox值
    const resourceTypes = ["应急通信车", "抢修车辆", "卫星便携包", "应急发电车", "无线队伍", "传输队伍"];

    // 检查当前操作的checkbox是否属于资源类型
    if (resourceTypes.includes(value)) {
        // 计算当前选中的资源类型数量
        let currentCheckedCount = 0;
        resourceTypes.forEach((type) => {
            if (checkedValues[type]) {
                currentCheckedCount++;
            }
        });

        // 如果是勾选操作且已达到最大限制
        if (checked && currentCheckedCount >= dispatchResourceLegendMaxCount) {
            message.warning(`最多可选择${dispatchResourceLegendMaxCount}种资源类型`);
            return; // 阻止勾选
        }
    }

    // 正常处理checkbox变化
    const newCheckedValues = { ...checkedValues, [value]: checked };

    // 获取newCheckedValues里属于resourceTypes应急资源的为true的数据
    const currentResourceTypesChecked = Object.entries(newCheckedValues)
        .filter(([type, checked]) => resourceTypes.includes(type) && checked)
        .map(([type]) => type);

    resourceTypesChecked(currentResourceTypesChecked);

    setCheckedValues(newCheckedValues);
};
```

### 3.3 批量复选框变化处理

```typescript
const handleCheckboxChangeBatch = (obj: any) => {
    const newCheckedValues = { ...checkedValues };
    const resourceTypes = ["应急通信车", "抢修车辆", "卫星便携包", "应急发电车", "无线队伍", "传输队伍"];

    Object.keys(obj).forEach((value) => {
        const checked = obj[value];
        if (resourceTypes.includes(value)) {
            let currentCheckedCount = 0;
            resourceTypes.forEach((type) => {
                if (checkedValues[type]) {
                    currentCheckedCount++;
                }
            });

            if (checked && currentCheckedCount >= dispatchResourceLegendMaxCount) {
                message.warning(`最多可选择${dispatchResourceLegendMaxCount}种资源类型`);
                return;
            }
        }

        Object.assign(newCheckedValues, { [value]: checked });
    });

    const currentResourceTypesChecked = Object.entries(newCheckedValues)
        .filter(([type, checked]) => resourceTypes.includes(type) && checked)
        .map(([type]) => type);

    resourceTypesChecked(currentResourceTypesChecked);
    setCheckedValues(newCheckedValues);
};
```

### 3.4 状态同步机制

```typescript
useEffect(() => {
    if (onLegendSelected) {
        onLegendSelected(checkedValues);
    }
}, [checkedValues, onLegendSelected]);
```

### 3.5 联动场景处理

#### 3.5.1 调度队伍/订单选中联动

```typescript
useEffect(() => {
    if (selectedDispatchTeamOrOrder) {
        const newCheckedValues = { ...checkedValues, 任务中: true, 空闲: true, 无线队伍: true, 传输队伍: true };
        const resourceTypes = ["应急通信车", "抢修车辆", "卫星便携包", "应急发电车", "无线队伍", "传输队伍"];
        const currentResourceTypesChecked = Object.entries(newCheckedValues)
            .filter(([type, checked]) => resourceTypes.includes(type) && checked)
            .map(([type]) => type);
        setTimeout(() => {
            resourceTypesChecked(currentResourceTypesChecked);
            setCheckedValues(newCheckedValues);
        }, selectedDispatchTeamOrOrderTimeout * 1000);
    }
}, [selectedDispatchTeamOrOrder]);
```

#### 3.5.2 乡镇退服告警联动

```typescript
useEffect(() => {
    if (["乡镇单断", "乡镇双断", "乡镇全阻"].includes(damageToTownsGisPin?.alarmType) && damageToTownsGisPin?.selected) {
        const newCheckedValues = { ...checkedValues, 光缆: true, 机房: true };
        setTimeout(() => {
            setCheckedValues(newCheckedValues);
        }, damageToTownsGisPinTimeout * 1000);
    }
}, [damageToTownsGisPin]);
```

#### 3.5.3 区域层级变化联动

```typescript
useEffect(() => {
    setCheckedValues({ ...checkedValues, ...defaultValues });
}, [currentZone]);
```

### 3.6 传输路由状态控制

传输路由部分新增了传输路由中断和传输路由正常两个状态的复选框：

```typescript
<div className="flex items-center mb-[10px]">
    <span className="legend-item-title">传输路由：</span>
    <div className="group-item">
        <div className="flex items-center">
            <div className="group-dot" style={{ background: "rgba(255, 82, 82, 1)" }}></div>
            <Checkbox
                className="group-checkbox"
                value={"传输路由中断"}
                checked={checkedValues["传输路由中断"]}
                onChange={(e) => handleCheckboxChange("传输路由中断", e.target.checked)}
            />
            <span className="group-name" onClick={() => handleCheckboxChange("传输路由中断", !checkedValues["传输路由中断"])}>中断</span>
        </div>
        <div className="flex items-center ml-[10px]">
            <div className="group-dot" style={{ background: "rgba(68, 215, 182, 1)" }}></div>
            <Checkbox
                className="group-checkbox"
                value={"传输路由正常"}
                checked={checkedValues["传输路由正常"]}
                onChange={(e) => handleCheckboxChange("传输路由正常", e.target.checked)}
            />
            <span className="group-name" onClick={() => handleCheckboxChange("传输路由正常", !checkedValues["传输路由正常"])}>正常</span>
        </div>
    </div>
</div>
```

### 3.7 传输路由图例图标分级配置

#### 3.7.1 设计目标

将"二干 / 骨干层路由 / 汇聚路由 / 接入层"4 个图例项的图标从**组件内硬编码**改为**按 `currentZone.zoneLevel` 读取 `EMapConfig.emergencyTransmission.layerSettings` 中的 `legendIcon` 字段**，未命中或为空字符串时使用 `presets.ts` 中 `LAYER_CONFIG` 提供的 `defaultLegendIcon` 兜底。

`乡镇三路由` / `节点机房` 不在 `LAYER_CONFIG` 中，保持硬编码。

#### 3.7.2 数据流

```
currentZone.zoneLevel
    ↓
useCurrentEmergencyTransmissionLayerSettings(currentZone)  // presets.ts
    ↓
currentLayerSettings  // 来自 EMapConfig.emergencyTransmission.layerSettings
    ↓
useEmergencyTransmissionLegendIcons(currentZone)         // dispatch-legend/useEmergencyTransmissionLegendIcons.ts
    ↓
legendIcons: Record<serverCodeName, 图标文件名>           // useMemo 缓存
    ↓
LegendItem / BackboneNetworkLegend / <Image src>
```

#### 3.7.3 关键代码

**hook 文件** [useEmergencyTransmissionLegendIcons.ts](../../../../../../e:/oss-fe-git/phoenix/oss-visual-gd-emergency-support-next/apps/main/app/components/center/dispatch-gis/dispatch-legend/useEmergencyTransmissionLegendIcons.ts)：

```typescript
import { useMemo } from "react";
import { LAYER_CONFIG, useCurrentEmergencyTransmissionLayerSettings } from "../presets";

const useEmergencyTransmissionLegendIcons = (currentZone: any) => {
    const currentLayerSettings = useCurrentEmergencyTransmissionLayerSettings(currentZone);

    return useMemo(() => {
        const result: Record<string, string> = {};
        Object.values(LAYER_CONFIG).forEach((cfg) => {
            const configuredIcon = currentLayerSettings?.[cfg.serverCodeName]?.legendIcon;
            result[cfg.serverCodeName] = configuredIcon || cfg.defaultLegendIcon;
        });
        return result;
    }, [currentLayerSettings]);
};

export { useEmergencyTransmissionLegendIcons };
```

**在 `TownThreeRouteLegendV2Root` 中调用**：

```typescript
const legendIcons = useEmergencyTransmissionLegendIcons(currentZone);
```

**4 处图例图标使用**（位于 `index.tsx`）：

| 图例项   | serverCodeName                  | 旧硬编码          | 新表达式                                                                |
| -------- | ------------------------------- | ----------------- | ----------------------------------------------------------------------- |
| 二干     | `省级传输二干告警图层`          | `二干.png`        | `legendIcons[LAYER_CONFIG["二干"].serverCodeName]`                       |
| 骨干层   | `地市骨干层路由告警图层`        | `骨干层路由.png`  | `legendIcons[LAYER_CONFIG["骨干层路由"].serverCodeName]`（传入 BackboneNetworkLegend 的 `icon` prop）|
| 汇聚层   | `区县汇聚层路由告警图层`        | `汇聚路由.png`    | `legendIcons[LAYER_CONFIG["汇聚路由"].serverCodeName]`（Image src 拼接）|
| 接入层   | `乡镇接入层路由告警图层`        | `接入层路由.png`  | `legendIcons[LAYER_CONFIG["接入层"].serverCodeName]`                    |

**`BackboneNetworkLegend` 改造**（接受 `icon` prop）：

```typescript
// props.icon ?? "骨干层路由.png" 兜底
src={`${constants.IMAGE_PATH}/emergency/map/图例/${props.icon ?? "骨干层路由.png"}`}
```

#### 3.7.4 兜底语义

| 场景                          | 实际显示图标                       |
| ----------------------------- | ---------------------------------- |
| 配置 `legendIcon` 有值        | 配置值                             |
| 配置 `legendIcon: ""` 空字符串 | 视为未配置，走 `defaultLegendIcon` |
| 配置 key 缺失（town 级别等）  | 走 `defaultLegendIcon`             |
| `layerSettings` 整个缺失      | 走 `defaultLegendIcon`             |

#### 3.7.5 注意事项

- `LAYER_CONFIG` 当前只包含 4 个图层（`二干` / `骨干层路由` / `汇聚路由` / `接入层`），与 `MapEmergencyTransmissionView.tsx` 的 `LAYER_CONFIG` 结构对齐
- `legendIcon` 是**字符串图标名**（不含路径前缀），由 `Image src` 中 `constants.IMAGE_PATH/emergency/map/图例/` 前缀拼接
- `zoneLevel` 切换时会自动触发 `useMemo` 重算（依赖 `currentLayerSettings`），图标即时更新

## 4. 图例分组结构

### 4.1 布局结构

```
图例组件
├── 第一列（应急物资）
│   ├── 应急物资组：任务中、应急通信车、卫星便携包、无线队伍、跨市调度
│   └── 抢修队伍/资源调度组：空闲、应急发电车、传输队伍
├── 主容器
│   ├── 物理站点组：退服、正常、核心层、重要层、支撑层、普通站
│   ├── 传输路由组（TownThreeRouteLegendV2）：二干、骨干层、汇聚层、接入层、乡镇三路由、节点机房
│   │   └── 传输路由状态：传输路由中断、传输路由正常
│   └── 动环机房组：停电、环境、正常、核心机楼、重要汇聚、普通汇聚、业务汇聚
```

### 4.2 图例类型映射

| 分组             | 图例名称     | 默认状态      | 说明             | 图标可配       |
| ---------------- | ------------ | ------------- | ---------------- | -------------- |
| **应急物资**     | 任务中       | true          | 任务进行中的资源 |
|                  | 应急通信车   | false         | 应急通信车辆     |
|                  | 抢修车辆     | false         | 抢修车辆         |
|                  | 无线队伍     | false         | 无线通信队伍     |
|                  | 空闲         | false         | 空闲资源         |
|                  | 应急发电车   | false         | 应急发电车辆     |
|                  | 卫星便携包   | false         | 卫星通信设备     |
|                  | 传输队伍     | false         | 传输线路抢修队伍 |
|                  | 跨市调度     | showCrossLine | 跨地市调度飞线   |
| **物理站点**     | 核心层       | true          | 核心层站点       |
|                  | 重要层       | false         | 重要层站点       |
|                  | 支撑层       | false         | 支撑层站点       |
|                  | 普通站       | false         | 普通站点         |
|                  | 光缆         | false         | 光缆线路         |
|                  | 机房         | false         | 机房设施         |
| **传输路由**     | 二干         | false         | 省级传输二干     | ✅ 可配        |
|                  | 骨干层路由   | false         | 地市骨干层       | ✅ 可配        |
|                  | 汇聚路由     | false         | 区县汇聚层       | ✅ 可配        |
|                  | 接入层       | false         | 乡镇接入层       | ✅ 可配        |
|                  | 乡镇三路由   | false         | 乡镇三路由       | ❌ 硬编码      |
|                  | 节点机房     | false         | 节点机房         | ❌ 硬编码      |
| **传输状态**     | 传输路由中断 | false         | 传输路由中断告警 |
|                  | 传输路由正常 | false         | 传输路由正常状态 |
| **物理站址状态** | 物理站址退服 | true          | 站址退服告警     |
|                  | 物理站址正常 | false         | 站址正常状态     |
| **动环机房**     | 动环机房停电 | false         | 机房停电告警     |
|                  | 动环机房环境 | false         | 机房环境告警     |
|                  | 动环机房正常 | false         | 机房正常状态     |
|                  | 核心机楼     | false         | 核心机楼类型     |
|                  | 重要汇聚     | false         | 重要汇聚类型     |
|                  | 普通汇聚     | false         | 普通汇聚类型     |
|                  | 业务汇聚     | false         | 业务汇聚类型     |

## 5. 环境配置

### 5.1 配置参数

**文件**: `apps/main/app/environment.ts`

```typescript
{
    "EMapConfig": {
        "dispatchResourceLegendMaxCount": 6,  // 应急资源最大选择数量
        "showCrossLine": false,               // 是否显示跨市调度飞线
        "damageToTownsGisPinTimeout": 3,      // 乡镇退服联动延迟（秒）
        "selectedDispatchTeamOrOrderTimeout": 1  // 调度队伍联动延迟（秒）
    }
}
```

## 6. 数据流程

```
用户操作 → handleCheckboxChange → 状态更新 → 外部回调 → 地图图层更新
    ↓              ↓                ↓              ↓              ↓
点击复选框 → 验证限制 → setCheckedValues → onLegendSelected → 图层显示/隐藏
```

**图例图标数据流**（传输路由相关，详见 §3.7）：

```
currentZone.zoneLevel
    ↓
useCurrentEmergencyTransmissionLayerSettings → currentLayerSettings
    ↓
useEmergencyTransmissionLegendIcons → legendIcons (Record<serverCodeName, 图标名>)
    ↓
LegendItem.icon / BackboneNetworkLegend.icon / <Image src>
    ↓
zoneLevel 切换时 useMemo 自动重算 → 图标即时更新
```

## 7. 事件联动机制

### 7.1 触发条件

| 联动场景     | 触发条件                                 | 联动动作                                 | 延迟时间                             |
| ------------ | ---------------------------------------- | ---------------------------------------- | ------------------------------------ |
| 调度队伍选中 | `selectedDispatchTeamOrOrder` 有值       | 自动勾选任务中、空闲、无线队伍、传输队伍 | `selectedDispatchTeamOrOrderTimeout` |
| 乡镇退服告警 | `damageToTownsGisPin` 选中且告警类型匹配 | 自动勾选光缆、机房                       | `damageToTownsGisPinTimeout`         |
| 区域层级变化 | `currentZone` 变化                       | 重置为默认值                             | 立即                                 |

## 8. 常见问题解决方案

### 8.1 资源类型选择限制

**问题**: 应急资源类型超过最大限制

**解决方案**:

```typescript
const resourceTypes = ["应急通信车", "抢修车辆", "卫星便携包", "应急发电车", "无线队伍", "传输队伍"];
const currentCheckedCount = resourceTypes.filter((type) => checkedValues[type]).length;

if (checked && currentCheckedCount >= dispatchResourceLegendMaxCount) {
    message.warning(`最多可选择${dispatchResourceLegendMaxCount}种资源类型`);
    return; // 阻止勾选
}
```

### 8.2 图例状态不同步

**问题**: 图例状态与地图图层不一致

**解决方案**:

```typescript
// 确保每次状态变化都通知外部
useEffect(() => {
    if (onLegendSelected) {
        onLegendSelected(checkedValues);
    }
}, [checkedValues, onLegendSelected]);
```

### 8.3 联动延迟问题

**问题**: 联动操作过于频繁

**解决方案**:

```typescript
// 使用 setTimeout 延迟执行
setTimeout(() => {
    setCheckedValues(newCheckedValues);
}, timeout * 1000);
```

### 8.4 图例图标分级配置

**问题**: 传输路由图例图标原本在 `index.tsx` 中硬编码，切换 `zoneLevel`（省/市/区县）时无法呈现不同样式。

**解决方案**:

1. 在 `presets.ts` 的 `LAYER_CONFIG` 中为 4 个路由图层（`二干` / `骨干层路由` / `汇聚路由` / `接入层`）新增 `defaultLegendIcon` 字段
2. 在 `dispatch-legend/useEmergencyTransmissionLegendIcons.ts` 中按 `currentZone.zoneLevel` 读取分级配置 `legendIcon`，未命中走兜底
3. 在 `index.tsx` 中调用 hook 拿到 `legendIcons` 替换 4 处硬编码；`BackboneNetworkLegend` 改造为接受 `icon` prop

**配置示例** (`public/config/environment-local.json`)：

```json
{
    "EMapConfig": {
        "emergencyTransmission": {
            "layerSettings": {
                "province": {
                    "地市骨干层路由告警图层": {
                        "color": "csyj_blue_line_2",
                        "legendIcon": "骨干层-省.png"
                    }
                }
            }
        }
    }
}
```

> 详见 [§3.7](#37-传输路由图例图标分级配置)。

## 9. 乡镇退服联动（damageToTownsGisPin）

`damageToTownsGisPin` 是全局状态变量，用于实现乡镇退服告警与地图的联动功能。

### 9.1 在图例组件中的使用

```typescript
useEffect(() => {
    if (["乡镇单断", "乡镇双断", "乡镇全阻"].includes(damageToTownsGisPin?.alarmType) && damageToTownsGisPin?.selected) {
        let newCheckedValues = { ...checkedValues };

        // 乡镇出局路由选中时（isTownExitRoute = true）
        if (damageToTownsGisPin?.isTownExitRoute) {
            // 选中乡镇三路由
            newCheckedValues["乡镇三路由"] = true;
            // 取消退服和核心层选中
            newCheckedValues["物理站址退服"] = false;
            newCheckedValues["核心层"] = false;
        } else {
            // 乡镇退服选中时（isTownExitRoute = false）
            // 选中物理站点的所有选项
            newCheckedValues["核心层"] = true;
            newCheckedValues["重要层"] = true;
            newCheckedValues["支撑层"] = true;
            newCheckedValues["普通站"] = true;
            newCheckedValues["光缆"] = true;
            newCheckedValues["机房"] = true;
        }

        setTimeout(() => {
            setCheckedValues(newCheckedValues);
        }, damageToTownsGisPinTimeout * 1000);
    }
}, [damageToTownsGisPin]);
```

### 9.2 联动逻辑说明

| 场景             | 条件                      | 联动动作                                                         |
| ---------------- | ------------------------- | ---------------------------------------------------------------- |
| **乡镇出局路由** | `isTownExitRoute = true`  | 选中「乡镇三路由」，取消「物理站址退服」和「核心层」             |
| **乡镇退服**     | `isTownExitRoute = false` | 选中物理站点所有选项：核心层、重要层、支撑层、普通站、光缆、机房、物理站址退服、物理站址正常 |

### 9.3 详细文档

请参考: [damageToTownsGisPin 全局状态变量维护文档](./damageToTownsGisPin.md)

## 10. 相关文件

| 文件路径                                                                        | 说明                 |
| ------------------------------------------------------------------------------- | -------------------- |
| `apps/main/app/components/center/dispatch-gis/dispatch-legend/index.tsx`        | 图例主组件           |
| `apps/main/app/components/center/dispatch-gis/dispatch-legend/index.css`        | 图例样式文件         |
| `apps/main/app/components/center/dispatch-gis/dispatch-legend/useEmergencyTransmissionLegendIcons.ts` | 传输路由图例图标 hook |
| `apps/main/app/components/center/dispatch-gis/presets.ts`                       | 共享 presets（含 LAYER_CONFIG / useCurrentEmergencyTransmissionLayerSettings） |
| `apps/main/app/components/center/dispatch-gis/MapEmergencyTransmissionView.tsx` | 传输路由告警视图组件 |
| `apps/main/app/components/center/dispatch-gis/center-gis/index.tsx`             | 中心GIS主组件        |
| `apps/main/app/components/center/zone-select/index.tsx`                         | 区域选择组件         |
| `apps/main/app/components/right/network-compact/damage-to-towns/index.tsx`      | 乡镇退服告警组件     |
| `apps/main/app/components/fields.ts`                                            | 全局字段定义         |

---

**文档版本**: 1.2
**最后更新**: 2026-06-11
**维护团队**: GD Emergency Support Team
**更新内容**: 新增 §3.7 传输路由图例图标分级配置（hook `useEmergencyTransmissionLegendIcons`），更新 §2 组件结构、§4.2 图例可配列、§6 数据流、§8.4 常见问题
