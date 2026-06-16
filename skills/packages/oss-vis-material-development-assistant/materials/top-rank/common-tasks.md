---
title: 常见修改任务
description: top-rank 最常见的修改需求及对应的代码定位
version: 1.0.0
last_updated: 2026-06-16
---

# 常见修改任务

本文档列出针对 `top-rank` 最常见的修改需求及对应的代码定位。

## 任务 1：调整前三名配色

**场景描述**：用户希望前三名配色调整为金 / 银 / 铜。

涉及：
- 🟦 Schema：[schema.md § 2.3](./schema.md#23-分项设置itemsset) `itemsSet`
- 🟨 组件逻辑：[component-logic.md § 2.2.4](./component-logic.md#224-列表渲染)
- ⬜ 数据：（无）

**步骤**：

1. 在 `schema.ts` 末尾 `defaultValue.config.itemsSet` 调整三项配色
2. 用户也可在 schema 面板**手动修改**前三项的颜色（实时生效）
3. 第四名及之后**不受** `itemsSet` 影响，统一用 `itemStyle` 的 fallback

## 任务 2：调整字体样式

**场景描述**：用户希望调整序号 / 名称 / 数值的字号、颜色。

涉及：
- 🟦 Schema：[schema.md § 2.4-2.7](./schema.md#24-序号样式indexfontstyle) 四个 `*FontStyle` 面板
- 🟨 组件逻辑：[component-logic.md § 2.2.4](./component-logic.md#224-列表渲染)
- ⬜ 数据：（无）

**步骤**：

1. 序号样式 → `indexFontStyle`
2. 名称样式 → `nameFontStyle`
3. 数值样式 → `valueFontStyle`（**注意拼写**，不是 `valueStyle`）
4. 单位样式 → `unitFontStyle`

## 任务 3：调整间距 / 尺寸

**场景描述**：用户希望行间距更大 / 每行更高 / 容器更宽。

涉及：
- 🟦 Schema：[schema.md § 2.2](./schema.md#22-通用itemstyle) `itemStyle`
- 🟨 组件逻辑：[component-logic.md § 2.2.2](./component-logic.md#222-单项样式-style)
- ⬜ 数据：（无）

**步骤**：

1. `itemStyle.width / height` 控制每行宽高
2. `itemStyle.marginTop` 控制除第一项外的行间距
3. 外层 `config.width / height` 控制整个组件容器（独立于 `itemStyle`）

## 任务 4：修改默认数据

**场景描述**：用户首次拖入时希望展示具体排名数据。

涉及：
- 🟦 Schema：[schema.md § 4](./schema.md#4-默认值参考)
- ⬜ 组件逻辑：（无）
- 🟩 数据：[data-model.md § 4](./data-model.md#4-默认数据示例)

**步骤**：

修改 `schema.ts` 末尾 `defaultValue.dataConfig.json`：

```typescript
dataConfig: {
    json: [
        { name: '机房A', value: '1234', unit: '次' },
        { name: '机房B', value: '567', unit: '次' },
    ],
    // ...
}
```

> 注意：默认数据**不包含 `id` 字段**（详见 data-model.md § 6.3）。

## 任务 5：新增排名字段（如 "趋势"）

**场景描述**：用户希望每行显示"上升 / 下降"图标。

涉及：
- 🟦 Schema：[schema.md § 2.3](./schema.md#23-分项设置itemsset) 在 `itemsSet` 加字段
- 🟨 组件逻辑：[component-logic.md § 2.2.4](./component-logic.md#224-列表渲染) 新增 DOM 节点
- 🟩 数据：[data-model.md § 2.2](./data-model.md#22-indicators指标) 添加新字段

**步骤**：

1. 在 `dataModel.json` 的 `indicators` 数组添加 `{ fieldName: 'trend', dataType: 'string' }`
2. 在 `index.jsx` 的 `dataSource.map` 中读取 `item.trend` 并渲染图标
3. （如需样式可配）在 `schema.ts` 添加 trend 样式面板

## 任务 6：调整默认值

**涉及文件**：`schema.ts` 末尾 `defaultValue.config.{xxx}`

### 6.1 调整前三名配色

```typescript
itemsSet: [
    { itemSetting: { backgroundImage: '', indexBgColor: '#FFD700', indexBorderColor: '#FFEB99', color: '#FFEB99' } },  // 金
    { itemSetting: { backgroundImage: '', indexBgColor: '#C0C0C0', indexBorderColor: '#E0E0E0', color: '#E0E0E0' } },  // 银
    { itemSetting: { backgroundImage: '', indexBgColor: '#CD7F32', indexBorderColor: '#E0A872', color: '#E0A872' } },  // 铜
],
```

### 6.2 调整序号默认样式

```typescript
itemStyle: {
    indexSize: 32,            // 圆形直径
    indexBgColor: '#0037a1',  // 序号背景色
    indexBorderColor: '#bcdbff',  // 序号边框色
}
```

### 6.3 调整数值默认字体

```typescript
valueFontStyle: {
    fontFamily: 'DIN',
    fontSize: 26,
    fontWeight: 500,
    color: '#b3e1ff',
}
```

## 任务 7：实现点击派发（功能补全）

**场景描述**：`doc/README.md` 声称支持"点击排名项时向外派发数据"，但代码**未实现**。如需补全此功能：

涉及：
- 🟦 Schema：[schema.md § 5](./schema.md#5-数据面板与交互面板) 添加 `defineInteractionSchema`
- 🟨 组件逻辑：[component-logic.md § 2.2.4](./component-logic.md#224-列表渲染) 加 onClick
- 🟩 数据：[data-model.md § 2.2](./data-model.md#22-indicators指标) 用 item.id 做派发

**步骤**：

1. 在 `schema.ts` 添加交互面板：
    ```typescript
    defineInteractionSchema({
        action: {
            $actionCollapse: {
                type: 'void',
                'x-component': 'FormCollapse',
                properties: {
                    $onClickAction: {
                        type: 'void',
                        'x-component': 'FormCollapse.CollapsePanel',
                        'x-component-props': { header: '行点击事件' },
                        properties: {
                            // 派发参数
                        },
                    },
                },
            },
        },
    }),
    ```
2. 在 `index.jsx` 解构 `interaction`：
    ```javascript
    const { config, dataSource, designer, interaction } = props;
    ```
3. 在 `index.jsx` 的 `dataSource.map` 渲染时加 onClick：
    ```javascript
    <div
        className="top-rank-container-item"
        style={getMarginTop(index)}
        onClick={() => {
            interaction.dispatch({
                data: [{ fieldName: 'rowId', state: item.id }],
            });
        }}
    >
    ```

> ⚠️ 此任务是**新功能**而非修复，需评估是否在当前 PR 范围。
> 详细背景见 [gotchas.md § 1](./gotchas.md#1-docreadmemd-与实际代码多处不一致)

## 任务 8：实现 TOP 数量限制（功能补全）

**场景描述**：`doc/README.md` 声称支持"自定义 TOP 数量"，但 schema **未实现**。如需补全：

涉及：
- 🟦 Schema：在 `itemStyle` 面板添加 `topCount: number` 字段
- 🟨 组件逻辑：`dataSource.slice(0, topCount)` 限制显示数量

**步骤**：

1. 在 `schema.ts` 的 `itemStyle` 加：
    ```typescript
    topCount: {
        title: 'TOP 数量',
        type: 'number',
        'x-decorator': 'FormItem',
        'x-component': 'NumberPicker',
        'x-component-props': { min: 1 },
    },
    ```
2. 在 `defaultValue.config.itemStyle` 加默认值 `topCount: 10`
3. 在 `index.jsx` 限制：
    ```javascript
    const displayData = itemStyle.topCount ? dataSource?.slice(0, itemStyle.topCount) : dataSource;
    ```
    然后用 `displayData.map(...)` 替换 `dataSource.map(...)`

> ⚠️ 同 § 7，此任务是**新功能**而非修复。
