---
name: gd-es-next-right-real-time-impact-damage-to-towns-config-reference
title: 环境配置参考文档（合并 Skill · damage-to-towns 子模块）
description: environment.json 中 damage-to-towns 配置树、zoneLevel 映射、单列配置字段与示例。所属 Skill: gd-es-next-right-real-time-impact（damage-to-towns 子模块）。
version: 1.1.0
---

# 环境配置参考文档（damage-to-towns 子模块）

配置文件：`apps/main/public/config/environment.json`

---

## 配置树

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

---

## zoneLevel 映射

| 配置键值 | 对应层级          | 说明                   |
| -------- | ----------------- | ---------------------- |
| `"2"`    | province → region | 省级下钻到区域级数据   |
| `"3"`    | region → city     | 区域级下钻到市级数据   |
| `"4"`    | city → town       | 市级下钻到区县级数据   |
| `"town"` | town → 乡镇       | 区县级下钻到乡镇级数据 |

---

## 单列配置完整字段

| 字段名            | 类型                  | 必填 | 说明                                                 |
| ----------------- | --------------------- | ---- | ---------------------------------------------------- |
| `fieldName`       | string                | 是   | 数据源字段名，对应 StyledTable 的 dataIndex          |
| `label`           | string                | 是   | 表头显示文本                                         |
| `width`           | number \| string      | 是   | 列宽度，数值单位为像素，"auto" 自适应                |
| `ellipsis`        | boolean               | 否   | 是否启用文本省略                                     |
| `sortable`        | boolean               | 否   | 启用排序（数字优先，字符串 localeCompare("zh-CN")）  |
| `sortOrder`       | "ascend" \| "descend" | 否   | 默认排序方向，需配合 sortable                        |
| `tooltipTemplate` | string                | 否   | Tooltip 模板，支持 `{{字段名}}` 占位符               |
| `formatCellText`  | string                | 否   | 单元格文本模板，支持 `{{字段名}}` 占位符             |
| `cellStyle`       | object                | 否   | 单元格样式，合并默认 `{fontSize: 18}`                |
| `headerStyle`     | object                | 否   | 表头样式，合并默认 `{fontSize: 18, fontWeight: 500}` |

---

## 列配置示例

### 物理退服 - 省级（"2"）

```json
[
    { "fieldName": "region", "width": 300, "label": "地市" },
    { "fieldName": "phyBlock", "width": 200, "label": "物理退服", "tooltipTemplate": "总数：{{phyTotal}}" },
    { "fieldName": "hxcBlock", "width": 200, "label": "重保站点核心层" },
    { "fieldName": "zycBlock", "width": 200, "label": "重保站重要层" },
    { "fieldName": "zccBlock", "width": "auto", "label": "重保站点支撑层" }
]
```

### 物理退服 - 区县级（"4"）

```json
[
    { "fieldName": "town", "width": 300, "label": "乡镇" },
    { "fieldName": "phyBlock", "width": 200, "label": "物理退服", "formatCellText": "{{phyBlock}}/{{phyTotal}}" },
    { "fieldName": "hxcBlock", "width": 200, "label": "重保站点核心层", "formatCellText": "{{hxcBlock}}/{{hxcTotal}}" },
    { "fieldName": "zycBlock", "width": 200, "label": "重保站重要层", "formatCellText": "{{zycBlock}}/{{zycTotal}}" },
    { "fieldName": "zccBlock", "width": "auto", "label": "重保站点支撑层", "formatCellText": "{{zccBlock}}/{{zccTotal}}" }
]
```

### 逻辑退服 - 省级（"2"）

```json
[
    { "fieldName": "region", "width": 200, "label": "地市", "ellipsis": true },
    { "fieldName": "gsmBlock", "width": 120, "label": "2G退服数" },
    { "fieldName": "gsmRate", "width": 120, "label": "2G退服率", "formatCellText": "{{gsmRate}}%" },
    { "fieldName": "enodeBlock", "width": 120, "label": "4G退服数" },
    { "fieldName": "enodeRate", "width": 120, "label": "4G退服率", "formatCellText": "{{enodeRate}}%" },
    { "fieldName": "gnodeBlock", "width": 120, "label": "5G退服数" },
    { "fieldName": "gnodeRate", "width": 120, "label": "5G退服率", "formatCellText": "{{gnodeRate}}%" }
]
```

### 逻辑退服 - 区县级（"4"）

```json
[
    { "fieldName": "town", "width": 300, "label": "乡镇", "ellipsis": true },
    { "fieldName": "gsmBlock", "width": 120, "label": "2G退服数", "formatCellText": "{{gsmBlock}}/{{gsmTotal}}" },
    { "fieldName": "gsmRate", "width": 120, "label": "2G退服率", "formatCellText": "{{gsmRate}}%" },
    { "fieldName": "enodeBlock", "width": 120, "label": "4G退服数", "formatCellText": "{{enodeBlock}}/{{enodeTotal}}" },
    { "fieldName": "enodeRate", "width": 120, "label": "4G退服率", "formatCellText": "{{enodeRate}}%" },
    { "fieldName": "gnodeBlock", "width": 120, "label": "5G退服数", "formatCellText": "{{gnodeBlock}}/{{gnodeTotal}}" },
    { "fieldName": "gnodeRate", "width": 120, "label": "5G退服率", "formatCellText": "{{gnodeRate}}%" }
]
```

---

## 版本信息

| 字段               | 值                                                                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| **Skill ID**       | `gd-es-next-right-damage-to-towns`                                                                                               |
| **当前版本**       | `1.1.0`                                                                                                                          |
| **最后更新**       | `2026-06-16`                                                                                                                     |
| **维护者**         | Emergency Support Team                                                                                                           |
| **所属 Skill**     | `gd-es-next-right-damage-to-towns`（[SKILL.md](./SKILL.md)）                                                                     |
| **配置文件**       | `apps/main/public/config/environment.json`                                                                                       |
| **配置根键**       | `gd-emergency-support.modules.damage-to-towns`                                                                                   |
| **列配置消费方**   | `ExitServiceDetail.tsx`（详见 [exit-service-detail.md](./exit-service-detail.md)）                                               |
| **轮询配置消费方** | `Context.tsx:78`（`useEnvironment("gd-emergency-support.modules.damage-to-towns.request.interval")`）                            |
| **关联接口**       | `getTownshipOutOfServiceCountPhysicsApi` / `getTownshipOutOfServiceCountLogicApi`（详见 [api-reference.md](./api-reference.md)） |

## 版本历史

| 版本    | 日期         | 变更摘要                                                                                                                                      |
| ------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `1.1.0` | `2026-06-16` | 补充 frontmatter 关联元数据；明确配置根键、轮询与列配置的消费方文件/行号引用；强化 zoneLevel 映射的 4 级层级（province/region/city/town）说明 |
| `1.0.0` | `2026-06-02` | 初版发布：覆盖配置树、zoneLevel 映射、单列配置 10 字段、4 个列配置示例（物理/逻辑 × 省级/区县级）                                             |

## 适用范围

- ✅ **适用**：新增/修改/删除 `detailModal.{physical\|logic}.columns.{zoneLevel}` 配置项
- ✅ **适用**：新增/调整 `tooltipTemplate` / `formatCellText` 模板占位符
- ✅ **适用**：调整轮询间隔 `request.interval`（单位秒）
- ✅ **适用**：调整列宽（`width: number \| "auto"`）
- ⚠️ **谨慎**：修改 zoneLevel 字符串键（`"2" / "3" / "4" / "town"`）——需同步检查后端 `viewItemId` 与 mock 文件命名
- ⚠️ **谨慎**：新增颜色枚举或告警类型 —— 需同步 `Context.tsx:AlarmLevelString`
- ❌ **不适用**：跨模块配置（如网络规模、左屏应急资源）——应查阅各自 Skill 文档
