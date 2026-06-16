# 搭建成本估算规则（Cost Estimation）

搭建成本（任务 D）的**可执行规则手册**。本文件定义了如何基于画像评估"用这个物料搭出原型需要多少工作量"。

## 任务目标

**输入**：物料名（或物料组合）
**输出**：成本表
- `config_items_to_set`：必填/必改的配置项数
- `data_fields_to_provide`：必填的数据字段数
- `needs_custom_dev`：是否需要二次开发
- `estimated_minutes`：搭出可演示原型的预估时长
- 成本明细（哪几项耗时）

## 估算公式

```
estimated_minutes =
    config_items_to_set × 单项配置耗时 +
    data_fields_to_provide × 单字段数据耗时 +
    (needs_custom_dev ? 二次开发耗时 : 0)
```

### 默认单项耗时

| 操作类型 | 单项耗时 | 备注 |
|---|---|---|
| 改一个配置项（颜色/尺寸/文本） | 1 分钟 | 简单 |
| 配置一个复杂组件（多联动） | 3 分钟 | 涉及 2+ 字段联动 |
| 准备一个数据字段 | 2 分钟 | mock 或后端字段 |
| 写一个交互胶水 | 15 分钟 | 涉及 dispatch/事件订阅 |
| 数据格式预处理 | 10 分钟 | 写 transform 函数 |

> 时长仅为**预估基线**，实际视团队熟练度 ±50%。

---

## 配置项数计算（`config_items_to_set`）

### 判定规则

从 `schema.ts` 的 `properties` 提取所有字段，按以下规则计数：

| 字段状态 | 计入 `config_items_to_set` |
|---|---|
| `required: true` 且无 `default` | ✅ 必填 +1 |
| 无 `required` 且无 `default` 但实际影响渲染 | ✅ +1（视代码推断） |
| 有 `default` 且符合常见需求 | ❌ 不计入 |
| `x-hidden: true` 或 `x-display: hidden` | ❌ 不计入 |
| `x-component: Switch` 默认 `false` 的功能开关 | ❌ 不计入（按需开启才计） |
| 联动字段（`x-reactions` 依赖其他字段） | ✅ +1（必须先配前置字段） |

### 分类统计

```json
{
  "config_items_to_set": {
    "must_fill": 2,        // 必填无默认
    "must_recommend": 3,   // 推荐必改（无默认但场景必需）
    "optional": 5,         // 可选
    "total_required": 5    // must_fill + must_recommend
  }
}
```

`build_cost.config_items_to_set` 字段使用 `total_required` 值。

### 案例：echarts-bar

| 字段 | default | required | 计入 |
|---|---|---|---|
| `categoryField` | 'name' | false | ❌ |
| `valueField` | 'value' | false | ❌ |
| `colorField` | - | false | ✅ +1（视觉必需） |
| `direction` | 'horizontal' | false | ❌ |
| `drillable` | false | false | ❌ |
| `title` | - | false | ✅ +1（业务标识必需） |
| `seriesField` | - | false | ⏳ 多系列时 +1 |
| `themeColor` | '#1890ff' | false | ❌ |

**`config_items_to_set = 2`（最低配置）**，多系列场景 = 3。

---

## 数据字段数计算（`data_fields_to_provide`）

### 判定规则

从 `dataModel.json` 提取所有字段：

| 字段状态 | 计入 |
|---|---|
| `required: true` | ✅ 必填 +1 |
| 无 `required` 但代码实际消费 | ✅ +1 |
| `required: false` 且代码未消费 | ❌ |
| 仅文档说明，无对应字段 | ❌ |

### 案例：echarts-bar

```json
{
  "fields": [
    { "name": "name", "required": true },     // ✅ +1
    { "name": "value", "required": true },    // ✅ +1
    { "name": "series", "required": false }   // 多系列时 ✅
  ]
}
```

**`data_fields_to_provide = 2`（基础）**，多系列 = 3。

---

## 二次开发判定（`needs_custom_dev`）

### 触发条件

满足**任一**即标记 `true`：

| 条件 | 说明 |
|---|---|
| **数据格式不匹配** | dataModel 要求的字段与用户已有数据不一致，需要写 transform |
| **下钻目标缺失** | schema 配置了下钻但目标物料/页面不存在 |
| **样式深度定制** | 默认配置无法满足，需要覆盖 CSS / styled-components |
| **多数据源融合** | 单物料消费多份 dataSource，需写合并逻辑 |
| **特殊交互** | schema 未支持的交互（如自定义拖拽、热区点击） |

### 二次开发耗时

| 复杂度 | 耗时 | 判定 |
|---|---|---|
| 简单 | 15 分钟 | 单个 transform 函数 + 单次样式覆盖 |
| 中等 | 30 分钟 | 多文件改动 + 2-3 处样式覆盖 |
| 复杂 | 60+ 分钟 | 跨物料交互 + 完整组件扩展 |

默认记 **30 分钟**（中等），根据代码扫描结果调整。

---

## 输出格式

在画像的 `build_cost` 字段下：

```json
{
  "build_cost": {
    "config_items_to_set": 5,
    "data_fields_to_provide": 2,
    "needs_custom_dev": false,
    "custom_dev_minutes": 0,
    "estimated_minutes": 9,
    "breakdown": {
      "config_minutes": 5,
      "data_minutes": 4,
      "custom_minutes": 0
    },
    "config_required": ["colorField", "title", "categoryField", "valueField", "drillable"],
    "data_required": ["name", "value"],
    "assumptions": [
      "假设使用默认横向条形",
      "假设无需多系列",
      "假设无下钻"
    ]
  }
}
```

### 关键字段说明

| 字段 | 用途 |
|---|---|
| `config_required` | 列具体哪些字段必填/必改，方便 PM 核对 |
| `data_required` | 列具体哪些数据字段必须提供 |
| `assumptions` | 估算前提（如"无下钻""单系列"），不同假设会改耗时 |
| `breakdown` | 耗时拆分，可叠加到组合方案的总时长 |

---

## 组合方案的总成本

对于组合方案，总成本 = 累加 + 集成成本：

```
total_minutes = Σ(单物料 estimated_minutes) + integration_minutes
```

**integration_minutes**（集成耗时）：

| 物料数 | 集成耗时 |
|---|---|
| 1 | 0 |
| 2-3 | 5 分钟 |
| 4-5 | 10 分钟 |
| 6+ | 15-20 分钟 |

集成耗时包含：
- 主题/样式统一
- 布局/尺寸对齐
- 数据流串联
- 整体联调

---

## 案例：echarts-bar 完整成本估算

### 假设场景

- 基础场景（无下钻、无多系列、无二开）

### 计算

```
config_items_to_set = 2（colorField + title）
data_fields_to_provide = 2（name + value）
needs_custom_dev = false
custom_dev_minutes = 0

config_minutes = 2 × 1 = 2
data_minutes = 2 × 2 = 4
custom_minutes = 0
total = 6 分钟
```

### 实际画像示例

```json
{
  "build_cost": {
    "config_items_to_set": 2,
    "data_fields_to_provide": 2,
    "needs_custom_dev": false,
    "custom_dev_minutes": 0,
    "estimated_minutes": 6,
    "breakdown": {
      "config_minutes": 2,
      "data_minutes": 4,
      "custom_minutes": 0
    },
    "config_required": ["colorField", "title"],
    "data_required": ["name", "value"],
    "assumptions": [
      "使用默认横向条形",
      "无下钻",
      "无多系列"
    ]
  }
}
```

---

## 待办

- [ ] 真实跑 echarts-bar 端到端（验证耗时与实际感受是否一致）
- [ ] 收集多个物料的成本数据，校准公式
- [ ] 维护"二次开发常见模式"清单
