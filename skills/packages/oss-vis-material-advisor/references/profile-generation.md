# 画像生成规范（Profile Generation）

物料能力画像（任务 A）的**生成手册**。本文件定义了如何从代码 + schema + dataModel 生成 `profiles/{name}.json`。

## 生成流程

```
定位物料 src/packages/{name}/
        │
        ▼
读 4 类文件
├── oss-material.json  → 基础信息（name/category/title/main）
├── schema.ts          → 配置能力（capabilities.visual_configs）
├── index.tsx          → 组件能力（capabilities.interactions）
└── dataModel.json     → 数据契约（capabilities.data_formats）
        │
        ▼
按 JSON Schema 填充 profiles/{name}.json
        │
        ▼
交叉验证：对照 materials/{name}/ 5+1 文档
        │
        ▼
输出画像
```

## 详细解析规则

### 1. 基础信息（basic）

```json
{
  "main_file": "index.tsx",     // 从 oss-material.json.main 读取
  "schema_file": "schema.ts",   // 固定
  "data_model_file": "dataModel.json",  // 固定
  "has_doc_readme": true,       // 检查 src/packages/{name}/doc/readme.md
  "has_5plus1_docs": true,      // 检查 oss-vis-material-development-assistant/materials/{name}/ 6 个文件
  "complexity": "中"            // 从 materials/README.md 读取
}
```

### 2. 数据格式（capabilities.data_formats）

从 `dataModel.json` 提取：

```json
{
  "data_formats": [
    {
      "format": "单系列一维数组",   // 业务化命名
      "example": "[{ name: 'A', value: 100 }]",
      "match_pattern": "data[0].field",
      "fields": [
        { "name": "name", "type": "string", "required": true, "description": "类别名" },
        { "name": "value", "type": "number", "required": true, "description": "数值" }
      ]
    }
  ]
}
```

**字段命名建议**：
- `format`：用业务化描述，不要写"数组""对象"
- `match_pattern`：用 `data[0].name` 这种路径，标明字段在 dataSource 中的位置
- `fields`：每个字段给出 `name/type/required/description`

### 3. 交互能力（capabilities.interactions）

从 `index.tsx` 中搜索：

| 关键词 | 交互类型 |
|---|---|
| `onClick` + `dispatch` / `emit` | drilldown（下钻）|
| `onClick` + URL/window.open | link（跳转）|
| `onClick` + `setState` | toggle（切换）|
| `onHover` + tooltip 配置 | tooltip（提示）|
| `useMouseEvent` / hotArea | hotArea（热区）|
| `dispatchEvent` / `messageCenter.emit` | 自定义事件 |

```json
{
  "interactions": [
    {
      "type": "drilldown",
      "trigger": "click",
      "config_field": "drilldownId",   // schema 中控制该交互的字段
      "payload_fields": ["name", "value"]
    }
  ]
}
```

### 4. 视觉配置（capabilities.visual_configs）

从 `schema.ts` 的 `properties` 提取，**只记录有 default 值的字段**：

```json
{
  "visual_configs": {
    "color": {
      "field": "colorField",
      "type": "string | string[]",
      "default": "['#1890ff', '#52c41a']"
    },
    "size": {
      "field": "size",
      "type": "number",
      "default": 16
    },
    "layout": {
      "field": "direction",
      "type": "string",
      "default": "horizontal"
    }
  }
}
```

### 5. 默认值（capabilities.default_values）

把 `visual_configs` 中所有字段的 default 值平铺：

```json
{
  "default_values": {
    "colorField": "['#1890ff']",
    "size": 16,
    "direction": "horizontal",
    "drillable": false
  }
}
```

### 6. 业务场景（business_scenarios）

**这部分最难自动化**。生成规则：

1. 从 `oss-material.json.title` / `description` 提取业务关键词
2. 从 `materials/{name}/README.md`（如存在）提取"典型应用"
3. 从 schema 字段名反推（`categoryField` → "分类对比"）
4. **至少列 3 个场景**，不够则补通用场景

```json
{
  "business_scenarios": [
    "销售业绩 Top10 排行",
    "各地区营收对比",
    "部门 KPI 横向对比",
    "库存数量预警（横向条形）"
  ]
}
```

### 7. 可组合性（composability）

**初始为空，跑完所有画像后批量计算**：

```json
{
  "composability": {
    "compatible_with": [],
    "incompatible_with": [],
    "note": "需等所有画像生成后由 composition-rules.md 计算"
  }
}
```

### 8. 评级（rating）

**初始为空，跑完画像后由 rating-rules.md 计算**。

### 9. 搭建成本（build_cost）

**根据配置项数和 dataModel 字段数估算**：

```json
{
  "build_cost": {
    "config_items_to_set": 5,        // 必填 + 必改的配置项数
    "data_fields_to_provide": 2,     // 必填的数据字段数
    "needs_custom_dev": false,         // 是否需要写胶水代码/二开
    "estimated_minutes": 15           // 搭出可演示原型预估时长
  }
}
```

**估算规则**（粗略）：
- `estimated_minutes` = `config_items_to_set` × 1 + `data_fields_to_provide` × 2
- 如果 `needs_custom_dev = true`，再加 30 分钟

## 交叉验证清单

生成画像后，对照 `oss-vis-material-development-assistant/materials/{name}/` 文档：

| 检查项 | 验证方式 |
|---|---|
| 业务场景是否准确 | 对照 `README.md` 摘要 + `data-model.md` 的"典型数据" |
| 配置项是否完整 | 对照 `schema.md` 的字段清单 |
| 交互是否遗漏 | 对照 `component-logic.md` 的交互描述 |
| 踩坑是否记录 | 对照 `gotchas.md` 是否有未在画像中体现的限制 |

如果发现不一致，**以代码为准，标注在画像的 `_validation_notes` 字段**：

```json
{
  "_validation_notes": [
    "README.md 提到支持 4 种下钻，但代码中只找到 3 种，疑似文档超前",
    "gotchas.md 提示 data.id 派发无效，但未在 capabilities.interactions 中标注"
  ]
}
```

## 输出示例

以 `echarts-bar` 为例（**示例，待实际生成时核对**）：

```json
{
  "name": "echarts-bar",
  "category": "图表/ECharts",
  "version": "develop",
  "scanned_at": "2026-06-16",
  "basic": {
    "main_file": "index.tsx",
    "schema_file": "schema.ts",
    "data_model_file": "dataModel.json",
    "has_doc_readme": true,
    "has_5plus1_docs": true,
    "complexity": "中"
  },
  "capabilities": {
    "data_formats": [
      {
        "format": "多系列横向条形",
        "example": "[{ name, value, series }]",
        "match_pattern": "data[*]",
        "fields": [
          { "name": "name", "type": "string", "required": true },
          { "name": "value", "type": "number", "required": true },
          { "name": "series", "type": "string", "required": false }
        ]
      }
    ],
    "interactions": [
      { "type": "drilldown", "trigger": "click", "config_field": "drillable" }
    ],
    "visual_configs": {
      "color": { "field": "colorField", "default": "['#1890ff']" },
      "layout": { "field": "direction", "default": "horizontal" }
    },
    "default_values": {
      "colorField": "['#1890ff']",
      "direction": "horizontal",
      "drillable": false
    }
  },
  "business_scenarios": [
    "销售业绩 Top10 排行",
    "地区营收对比",
    "部门 KPI 横向对比"
  ],
  "composability": {
    "compatible_with": [],
    "incompatible_with": [],
    "note": "待批量计算"
  },
  "rating": null,
  "build_cost": {
    "config_items_to_set": 5,
    "data_fields_to_provide": 2,
    "needs_custom_dev": false,
    "estimated_minutes": 9
  },
  "_validation_notes": []
}
```

## 待办

- [x] `composition-rules.md` —— 组合方案评级（已完成于 2026-06-16）
- [x] `cost-estimation.md` —— 搭建成本详细校准规则（已完成于 2026-06-16）
- [x] `profiles/echarts-bar.json` 等 11 个首批画像实际生成（已完成 11/11）
- [x] `profiles/drilldown-table.json` 等 9 个第二批表格画像生成（已完成 9/9）
