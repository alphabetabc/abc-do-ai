---
name: 'damage-to-towns-exit-service-detail'
description: '维护 damage-to-towns 的 ExitServiceDetail 组件，处理乡镇退服数据展示、物理/逻辑切换、多级下钻。Invoke when 修改、修复或优化 ExitServiceDetail 组件。'
---

# ExitServiceDetail 组件维护 Skill

## 名称与描述

维护 `damage-to-towns` 模块下的 ExitServiceDetail 组件，该组件用于展示乡镇退服数据详情，支持物理退服/逻辑退服切换和多层级下钻功能。

## 功能特性

- **数据类型切换**：支持通过按钮组在物理退服和逻辑退服模式间切换（与 Part.Middle 样式保持一致）
- **多层级下钻**：支持从省级下钻到区域、市、乡镇级别的数据
- **表格渲染**：动态从环境配置获取列配置，使用 StyledTable（styled 封装的 antd Table）渲染数据
- **排序能力**：通过配置 `sortable: true` 为指定列启用智能排序，支持数字排序和中文本地化排序；配合 `sortOrder` 可设置默认排序方向
- **格式化单元格**：内置 FormattedCell 组件，支持 tooltip 和自定义格式化文本
- **返回上一级**：非顶层时提供返回按钮，支持逐级回退

## 环境配置说明

配置文件位置：`apps/main/public/config/environment.json`

### 完整配置树结构

```
gd-emergency-support.modules.damage-to-towns
├─ desc: "乡镇受损"
├─ request
│  ├─ interval-desc: "刷新间隔时间，单位秒"
│  └─ interval: 300
└─ detailModal
   ├─ physical (物理退服)
   │  ├─ label: "物理退服"
   │  └─ columns
   │     ├─ desc: "2-省，region-地市，4-区县，town-乡镇"
   │     ├─ "2" (省级层级)
   │     ├─ "3" (市级层级)
   │     └─ "4" (区县级层级)
   └─ logic (逻辑退服)
      ├─ label: "逻辑受损"
      └─ columns
         ├─ desc: "2-省，3-地市，4-区县，town-乡镇"
         ├─ "2" (省级层级)
         ├─ "3" (市级层级)
         └─ "4" (区县级层级)
```

### 支持的 zoneLevel 映射

| 配置键值 | 对应层级               |
| -------- | ---------------------- |
| "2"      | 省级下钻到区域级数据   |
| "3"      | 区域级下钻到市级数据   |
| "4"      | 市级下钻到区县级数据   |
| "town"   | 区县级下钻到乡镇级数据 |

### 单列配置完整字段

| 字段名            | 类型             | 必填 | 说明                                                                          |
| ----------------- | ---------------- | ---- | ----------------------------------------------------------------------------- |
| `fieldName`       | string           | 是   | 数据源字段名，对应 StyledTable 的 dataIndex                                   |
| `label`           | string           | 是   | 表头显示文本                                                                  |
| `width`           | number \| string | 是   | 列宽度，数值单位为像素，"auto" 表示自适应                                     |
| `ellipsis`        | boolean          | 否   | 是否启用文本省略（超出显示省略号）                                            |
| `sortable`        | boolean          | 否   | 是否启用排序功能，为 true 时自动添加 antd Table 的 sorter 函数                |
| `sortOrder`       | string           | 否   | 默认排序顺序，支持 "ascend"（升序）或 "descend"（降序），需配合 sortable 使用 |
| `tooltipTemplate` | string           | 否   | Tooltip 模板字符串，支持 `{{字段名}}` 占位符，通过 formatString 解析          |
| `formatCellText`  | string           | 否   | 单元格文本模板，支持 `{{字段名}}` 占位符，通过 formatString 解析              |
| `cellStyle`       | object           | 否   | 单元格自定义样式对象，会合并默认的 {fontSize: 18}                             |
| `headerStyle`     | object           | 否   | 表头单元格自定义样式对象，会合并默认的 {fontSize: 18, fontWeight: 500}        |

### 物理退服默认列配置示例

```json
{
  "2": [
    { "fieldName": "region", "width": 300, "label": "地市" },
    {
      "fieldName": "phyBlock",
      "width": 200,
      "label": "物理退服",
      "tooltipTemplate": "总数：{{phyTotal}}"
    },
    { "fieldName": "hxcBlock", "width": 200, "label": "重保站点核心层" },
    { "fieldName": "zycBlock", "width": 200, "label": "重保站重要层" },
    { "fieldName": "zccBlock", "width": "auto", "label": "重保站点支撑层" }
  ]
}
```

### 逻辑退服默认列配置示例

```json
{
  "2": [
    { "fieldName": "region", "width": 200, "label": "地市", "ellipsis": true },
    { "fieldName": "gsmBlock", "width": 120, "label": "2G退服数" },
    {
      "fieldName": "gsmRate",
      "width": 120,
      "label": "2G退服率",
      "formatCellText": "{{gsmRate}}%"
    },
    { "fieldName": "enodeBlock", "width": 120, "label": "4G退服数" },
    {
      "fieldName": "enodeRate",
      "width": 120,
      "label": "4G退服率",
      "formatCellText": "{{enodeRate}}%"
    },
    { "fieldName": "gnodeBlock", "width": 120, "label": "5G退服数" },
    {
      "fieldName": "gnodeRate",
      "width": 120,
      "label": "5G退服率",
      "formatCellText": "{{gnodeRate}}%"
    }
  ]
}
```

## 请求参数构建

### buildRequestParams() 函数说明

构建请求 API 的参数对象，根据当前下钻路径动态生成：

#### 初始状态（顶层，无下钻路径）

```typescript
{
  zoneName: "广东省",
  zoneLevel: ZoneLevelEnum.province,
  parentName: "-1",
  regionName: "-1",
  dataTime: dayjs().format("YYYY-MM-DD HH:mm:ss")
}
```

#### 各层级参数映射

| 场景说明                                        | 请求目标层级 | zoneName 值来源           | 最终 zoneLevel 值      | 附加参数                                                                         |
| ----------------------------------------------- | ------------ | ------------------------- | ---------------------- | -------------------------------------------------------------------------------- |
| 初始状态（无下钻路径），直接加载省级数据        | province     | "广东省"（固定值）        | ZoneLevelEnum.province | parentName=-1, regionName=-1                                                     |
| 点击一条 zoneLevel=province 的行 → 请求地市数据 | region       | 该行的 `region`（地市名） | ZoneLevelEnum.region   | parentName=-1, regionName=-1                                                     |
| 点击一条 zoneLevel=region 的行 → 请求区县数据   | city         | 该行的 `city`（区县名）   | ZoneLevelEnum.city     | parentName=该行的 `region`（所属地市名）, regionName=-1                          |
| 点击一条 zoneLevel=city 的行 → 请求乡镇数据     | town         | 该行的 `town`（乡镇名）   | ZoneLevelEnum.town     | parentName=该行的 `city`（所属区县名）, regionName=该行的 `region`（所属地市名） |

### dataTime 处理

- 如果下钻路径最后一条记录有 `dataTime`，则复用该时间戳
- 否则使用当前时间格式化后的字符串

## 请求说明

### 两个 API 接口

1. **物理退服接口**：`getTownshipOutOfServiceCountPhysicsApi`
2. **逻辑退服接口**：`getTownshipOutOfServiceCountLogicApi`

接口文件位置：`apps/main/request/right.ts`，位于约 750-870 行区域。

### 接口入参类型

```typescript
opts: {
  zoneName?: string;        // 区域名称
  zoneLevel?: string;       // 区域级别
  parentName?: string;      // 父区域名称
  regionName?: string;      // 地市名称
  dataTime?: string;        // 时间戳
}
extra: { dataZoneLevel: any }
```

### 调用参数

```typescript
api(params, {
  dataZoneLevel: 计算后的目标数据层级,
});
```

`dataZoneLevel` 自动计算公式：

- 当前 zoneLevel 为 province → dataZoneLevel = ZoneLevelEnum.region
- 当前 zoneLevel 为 region → dataZoneLevel = ZoneLevelEnum.city
- 其他情况 → dataZoneLevel = ZoneLevelEnum.town

### Mock 数据文件路径

支持本地mock模式，mock文件存放在：

- 物理退服：`/static/mock/emergency/township-out-of-service-count-physics-{zoneLevelSuffix}.json`
- 逻辑退服：`/static/mock/emergency/township-out-of-service-count-logic-{zoneLevelSuffix}.json`

### converter 转换器逻辑

API 内部使用自定义转换器处理响应数据：

- 提取 `data.viewItemData.rows` 作为数据源
- 合并 dimFieldList 和 counterFieldList 为列数组
- 自动注入 zoneLevel 和 parentZoneLevel 属性

### 错误降级处理

接口请求失败时自动返回安全默认值：

```typescript
{
  type: "physical" | "logic",
  rows: [],
  columns: [],
  dataTime: "",
  zoneLevel: opts.zoneLevel
}
```

### 数据时间获取

dataTime 从第一条数据的 scanTime 字段获取：
`dataTime: result.rows[0]?.scanTime || ""`

### API 返回结果完整结构

```typescript
{
  type: "physical" | "logical",  // 标识当前数据类型
  zoneLevel: string,              // 当前请求的区域层级
  rows: any[],                    // 表格数据源
  columns: any[],                 // 后端返回的原始列定义
  dataTime: string                // 数据采集时间戳，来自第一条记录的 scanTime
}
```

### viewItemId 和 viewPageId 常量

- 物理退服：`viewItemId: "township-out-of-service-count-physics"`
- 逻辑退服：`viewItemId: "township-out-of-service-count-logic"`
- 公共：`viewPageId: "guarantee-right-page"`

## 按钮组实现说明

组件使用按钮组替代原有的 StyledSwitch 实现，与 Part.Middle.tsx 样式完全一致：

1. 定义 `btns` 数组配置按钮选项
2. 使用 `cx` 工具函数处理 active 样式
3. 外层添加 `exit-service-detail-modal` 类名用于样式隔离
4. 按钮样式定义在 `index.css` 中，保持视觉一致性

```typescript
const btns = [
    { label: "逻辑退服", value: "logical" },
    { label: "物理退服", value: "physical" },
];

<div className="btns">
    {btns.map((item) => (
        <div
            className={cx("btn", { active: state.exitServiceType === item.value })}
            key={item.value}
            onClick={() => setState({ exitServiceType: item.value })}
        >
            {item.label}
        </div>
    ))}
</div>
```

## 使用方法

1. 修改组件文件：`apps/main/app/components/right/network-compact/damage-to-towns/ExitServiceDetail.tsx`
2. API 接口：`getTownshipOutOfServiceCountPhysicsApi`、`getTownshipOutOfServiceCountLogicApi` 从 `@/request/right` 导入
3. 区域层级常量：使用 `ZoneLevelEnum` 枚举
4. 环境配置键：`gd-emergency-support.modules.damage-to-towns.detailModal.${type}.columns.${zoneLevel}`
5. 样式文件：`apps/main/app/components/right/network-compact/damage-to-towns/index.css`

## 输入输出示例

组件接收 props 传入模态框相关上下文，无特定返回值，完全使用内部 state 管理状态。

## 依赖关系

- React + TypeScript
- antd (ConfigProvider, Tooltip, Button)
- ahooks (useSetState, useRequest)
- dayjs
- 项目内部组件：StyledTable
- 工具函数：getEnvironment、formatString、cx
