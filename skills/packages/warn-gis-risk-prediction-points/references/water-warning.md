# WaterWarning 水情预警组件

## 文件范围

- `apps/main/app/components/center/warn-gis/risk-prediction-points/water-warning/index.tsx`
- `apps/main/app/components/center/warn-gis/risk-prediction-points/water-warning/Water.tsx`
- `apps/main/app/components/center/warn-gis/risk-prediction-points/water-warning/Rainfall.tsx`
- `apps/main/app/components/center/warn-gis/risk-prediction-points/water-warning/presets.tsx`

## 职责

WaterWarning 是水情相关打点入口组件，负责协调水情预警（Water）和降雨量（Rainfall）两个子组件的展示。

## Presets

**文件位置**：`water-warning/presets.tsx`

**核心导出**：

| 导出 | 类型 | 说明 |
| --- | --- | --- |
| `getWaterWarningLegendTypes` | `() => { title: string, list: Array<{ label, value, color, warningTitle, Icon }> }` | 读取 `gd-emergency-support.risk-prediction-points.waterWarning.legend`，返回标题为"水情预警"的图例对象。使用模块变量懒加载缓存。 |
| `getRainfallLegendTypes` | `() => { title: string, list: Array<{ label, value, color, Icon }> }` | 读取 `gd-emergency-support.risk-prediction-points.rainfall.legend`，返回标题为"降雨量"的图例对象。使用模块变量懒加载缓存。 |

**图例配置格式**：

**水情预警**（`waterWarning.legend`）：

```json
{
    "label": "图例显示名称",
    "value": "预警类型值（与接口 type 字段匹配）",
    "color": "#RRGGBB",
    "warningTitle": "详情卡片标题",
    "icon": "图标路径"
}
```

**降雨量**（`rainfall.legend`）：

```json
{
    "label": "图例显示名称",
    "value": "类型值（与接口 type 字段匹配）",
    "color": "#RRGGBB",
    "icon": "图标路径"
}
```

注意：水情预警和降雨量是两套独立的图例配置，通过不同的环境配置路径读取，在组件中使用不同的图例判断逻辑。

## 交互

1. **点击水情预警图标**：点击后调用 `getWaterWarningDetailCardApi` 获取详情数据，通过 Portal 渲染水情预警详情卡片（480px 宽度），卡片展示标题和内容。
2. **点击降雨量图标**：点击后调用 `getWaterWarningRainfallDetailApi` 获取详情数据，通过 Portal 渲染降雨量详情表格（435px 宽度），表格展示地市/区县/降雨量。
3. **关闭详情**：水情预警和降雨量详情均有独立的关闭按钮。
4. **图例过滤**：Water 和 Rainfall 组件分别依赖各自的图例配置进行图例选中状态过滤（`legendSelected`）。

## 子组件

### Water（水情预警详情卡片）

**文件位置**：`water-warning/Water.tsx`

| 项目 | 说明 |
| --- | --- |
| 请求 API | `getWaterWarningDetailCardApi` |
| 请求参数 | `{ zoneId: string, zoneLevel: string, warningTitle: string }` |
| 请求方式 | `ahooks useRequest`，`manual: true` |
| 触发时机 | 点击图标 |
| 响应数据 | `rows[0].title`, `rows[0].content` |
| 卡片样式 | 480px 宽度，高度自适应，标题栏 44px |
| 错误处理 | 空数据时 `WaterWarningDataSource` 为 null，`DataStatus` 展示空状态 |
| Portal 挂载 | `overlayPointCtx.createPortal` |
| 图例控制 | 使用 `getWaterWarningLegendTypes` 过滤 `legendSelected` |

**请求参数说明**：

| 参数 | 来源 | 说明 |
| --- | --- | --- |
| `zoneId` | `props.data.zoneId` | 点位数据中的区域 ID |
| `zoneLevel` | `props.data.zoneLevel` | 点位数据中的区域级别 |
| `warningTitle` | `d.warningTitle` | 由 presets 图例配置提供，仅用于详情卡片标题 |

**后端接口**：

| 字段 | 值 |
| --- | --- |
| `viewPageId` | `guarantee-middle-page` |
| `viewItemId` | `water-situation-detail` |
| `viewPageArgs` | `{ zoneId, zoneLevel }` |

**响应数据**（`rows` 每条记录）：

| 字段 | 类型 | 组件使用 |
| --- | --- | --- |
| `title` | `string` | 详情卡片标题（`dataSource[0].title`） |
| `content` | `string` | 详情卡片内容（`dataSource[0].content`） |

### Rainfall（降雨量详情表格）

**文件位置**：`water-warning/Rainfall.tsx`

| 项目 | 说明 |
| --- | --- |
| 请求 API | `getWaterWarningRainfallDetailApi` |
| 请求参数 | `{ zoneId: string, zoneLevel: string }` |
| 请求方式 | `ahooks useRequest`，`manual: true` |
| 触发时机 | 点击图标 |
| 响应数据 | `rows` 数组，使用字段：`type`, `regionName`, `cityName`, `rainfall` |
| 表格列 | `type`（颜色圆点）、`regionName`（地市）、`cityName`（区县）、`rainfall`（降雨量） |
| 卡片样式 | 435px 宽度，296px 高度 |
| 错误处理 | 空数组时 `DataStatus` 展示空状态 |
| Portal 挂载 | `overlayPointCtx.createPortal` |
| 图例控制 | 使用 `getRainfallLegendTypes` 过滤 `legendSelected` |

**请求参数说明**：

| 参数 | 来源 | 说明 |
| --- | --- | --- |
| `zoneId` | `props.data.zoneId` | 点位数据中的区域 ID |
| `zoneLevel` | `props.data.zoneLevel` | 点位数据中的区域级别 |

**后端接口**：

| 字段 | 值 |
| --- | --- |
| `viewPageId` | `guarantee-middle-page` |
| `viewItemId` | `rain-fall-detail` |
| `viewPageArgs` | `{ zoneId, zoneLevel }` |

**响应数据**（`rows` 每条记录）：

| 字段 | 类型 | 组件使用 |
| --- | --- | --- |
| `type` | `string` | 匹配图例配置 `value`，渲染对应颜色的圆点标识 |
| `regionName` | `string` | 表格"地市"列 |
| `cityName` | `string` | 表格"区县"列 |
| `rainfall` | `string` | 表格"降雨量(mm)"列 |

## 请求说明

### 点位数据获取

由 `risk-prediction-points/index.tsx` 通过 `getWaterWarningMapPointsApi` 统一获取。

**请求参数**：

| 参数 | 说明 |
| --- | --- |
| `rainfallType` | 从降雨量图例各 `value` 用逗号拼接 |
| `waterLevelWaringType` | 从水情预警图例各 `value` 用逗号拼接 |
| `zoneId` | 当前选中区域 ID |
| `zoneLevel` | 当前选中区域级别 |
| `labelPoints` | 用于经纬度匹配 |

**后端接口**：

| interface | viewItemId | viewPageArgs |
| --- | --- | --- |
| 降水量 | `rain-fall` | `{ zoneId, zoneLevel, type: rainfallType }` |
| 水情预警 | `water-situation` | `{ zoneId, zoneLevel, type: waterLevelWaringType }` |

## 响应说明

**点位数据结构**：经过 `getWaterWarningMapPointsApi` 聚合后，每个点位包含：

```typescript
{
    longitude: any;
    latitude: any;
    config?: any;
    zoneLevel?: any;
    name: any;
    zoneId: any;
    rainfall?: any;      // 降水量 row 原始数据
    waterWarning?: any;  // 水情预警 row 原始数据
}
```

- `Water` 组件接收 `props.data.waterWarning`。
- `Rainfall` 组件接收 `props.data.rainfall`。
- 只有对应字段有数据时，组件才会渲染入口图标。

## 维护要点

- 水情预警和降雨量图例是两套配置，修改时不要混用。
- 降雨量表格列配置集中在 `Rainfall.tsx` 的 `rainfallTableColumns`。
- 水情详情卡片样式集中在 `Water.tsx` 的 `CardRoot`。
- 点击交互是手动触发请求（`manual: true`），每次点击都会重新请求详情数据。