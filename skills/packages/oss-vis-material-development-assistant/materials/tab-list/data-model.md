# tab-list 数据格式

## 1. 概述

tab-list 使用 `dataModel.json` 定义数据契约，包含 3 个指标字段。组件接收数组格式数据，每个元素代表一个 Tab 项。

## 2. dataModel.json

```json
{
    "dataModelDefinition": {
        "name": "visual-tab-list",
        "title": "可视化大屏TAB列表",
        "description": "可视化大屏TAB列表数据。前缀图标,支持Icon 名称及 image名称，如果为img，提供无后缀的图片名称，仅支持 .png 类型",
        "header": {
            "dimensions": [],
            "indicators": [
                {
                    "dataType": "String",
                    "fieldLabel": "tabId",
                    "fieldName": "id",
                    "fieldUnit": "",
                    "list": "true"
                },
                {
                    "dataType": "String",
                    "fieldLabel": "名称",
                    "fieldName": "content",
                    "fieldUnit": "",
                    "list": "true"
                },
                {
                    "dataType": "String",
                    "fieldLabel": "前缀图标",
                    "fieldName": "icon",
                    "fieldUnit": "",
                    "list": "true"
                }
            ]
        },
        "rowConfig": {
            "dimensionCount": "unknown",
            "isUseDimensionParams": "false"
        }
    }
}
```

## 3. 数据结构

### 3.1 字段定义

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `id` | String | Tab 唯一标识 | `"1"` |
| `content` | String | Tab 显示文本 | `"数字乡村"` |
| `icon` | String | 前缀图标名称 | `"visual-manager-logo-shuzixiangcun"` |

### 3.2 数据示例

```json
[
    { "id": "1", "content": "数字乡村", "icon": "visual-manager-logo-shuzixiangcun" },
    { "id": "2", "content": "工信部", "icon": "visual-manager-gongxinbu" },
    { "id": "3", "content": "交通枢纽", "icon": "visual-manager-jiaotongshuniu" }
]
```

### 3.3 字段映射

| dataModel 字段 | 组件使用 | 说明 |
|----------------|----------|------|
| `id` | `item.id` | Tab 唯一标识，用于选中状态管理 |
| `content` | `item.content` | Tab 显示文本 |
| `icon` | `item.icon` | 前缀图标名称（Icon 名称或图片名称） |

**注意**：组件还使用了 `param`、`params1-9` 字段，但这些字段未在 dataModel 中定义，属于**隐式字段**。

## 4. 数据流

```
数据源 (dataSource)
    ↓
组件接收 data 属性
    ↓
遍历渲染 Radio.Group
    ↓
选中项变化触发 interaction.dispatch
    ↓
派发 12 个参数到交互系统
```

## 5. 默认数据

```json
[
    { "id": "1", "content": "数字乡村", "icon": "visual-manager-logo-shuzixiangcun", "params1": "", "params2": "", "params3": "" },
    { "id": "2", "content": "工信部", "icon": "visual-manager-gongxinbu", "params1": "", "params2": "", "params3": "" },
    { "id": "3", "content": "交通枢纽", "icon": "visual-manager-jiaotongshuniu", "params1": "", "params2": "", "params3": "" }
]
```

## 6. 数据校验

```typescript
const isSuccess = useMemo(() => {
    if (lodash.isArray(data) && data.length === 0) {
        return true;
    }
    return !lodash.isNil(data?.[0]?.content);
}, [data]);
```

**校验规则**：
- 空数组：视为成功（显示空状态）
- 非空数组：第一项必须有 `content` 字段
- 非数组：视为失败

## 7. 跨文档引用

- **Schema 配置**：`dataConfig.json` 默认数据 → 参见 [schema.md](./schema.md#6-默认值defaultvalue)
- **组件逻辑**：数据遍历与渲染 → 参见 [component-logic.md](./component-logic.md#22-选中状态管理)
- **交互派发**：字段映射关系 → 参见 [component-logic.md](./component-logic.md#23-交互派发)
