---
title: 常见修改任务
description: popover-check 最常见的修改需求及对应的代码定位
version: 1.0.0
last_updated: 2026-06-16
---

# 常见修改任务

本文档列出针对 `popover-check` 最常见的修改需求及对应的代码定位。

## 任务 1：调整选择框边框 / 文本样式

**场景描述**：用户希望选择框更宽 / 更高 / 边框换色 / 文字变色。

涉及：
- 🟦 Schema：[schema.md § 2.3](./schema.md#23-选择框样式selectedstyle)
- 🟨 组件逻辑：[component-logic.md § 2.1](./component-logic.md#21-入口签名) + § 4
- ⬜ 数据：（无）

**步骤**：

1. 在 `schema.ts` 的 `selectedStyle` 调整 `width / height / borderColor / textStyle`
2. 运行时 `containerStyle`（`index.jsx` 第 42-49 行）自动应用

## 任务 2：调整弹窗样式

**场景描述**：用户希望弹窗边框更粗、背景更暗、加旋转装饰。

涉及：
- 🟦 Schema：[schema.md § 2.4](./schema.md#24-弹窗样式popoverstyle)
- 🟨 组件逻辑：[component-logic.md § 3](./component-logic.md#3-子组件-tooltip-borderjsx)
- ⬜ 数据：（无）

**步骤**：

1. 在 `schema.ts` 的 `popoverStyle` 调整 `borderWidth / borderColor / backgroundColor`
2. 旋转通过 `popoverBorderRotate` 调整（作用于 SVG 容器的 `transform: rotate(...)`）
3. 弹窗高度 `maxHeight` 调整滚动行为

## 任务 3：调整箭头样式

**场景描述**：用户希望三角形箭头更大 / 颜色变化 / 位置调整。

涉及：
- 🟦 Schema：[schema.md § 2.5](./schema.md#25-箭头样式arrowstyle)
- 🟨 组件逻辑：[component-logic.md § 2.3](./component-logic.md#23-渲染结构)（`triangleCSS` 段）
- ⬜ 数据：（无）

**步骤**：

1. `size` 调整边长，`rotate` 调整角度，`color` 调整颜色
2. 四个 `margin*` 调整位置；注意 `marginTop` 默认 fallback `selectedStyle.height - 20`

## 任务 4：调整单选 / 多选模式

**场景描述**：用户希望从多选改为单选。

涉及：
- 🟦 Schema：[schema.md § 2.3](./schema.md#23-选择框样式selectedstyle) `checkMode`
- 🟨 组件逻辑：[component-logic.md § 2.2.2](./component-logic.md#222-选中--取消逻辑)
- ⬜ 数据：（无）

**步骤**：

1. `schema.ts` 修改 `checkMode: 'single'`
2. `index.jsx` 第 84-86 行：单选模式下点击后自动关闭弹窗
3. 切换单 / 多选时 `index.jsx` 第 127-132 行会清空已选

## 任务 5：新增派发参数

**场景描述**：用户希望派发选中项的其他字段（如 `value`）。

涉及：
- 🟦 Schema：[schema.md § 3.2](./schema.md#32-交互面板-defineinteractionschema)
- 🟨 组件逻辑：[component-logic.md § 2.2.1](./component-logicmd#221-派发选中事件)
- 🟩 数据：[data-model.md § 2.2](./data-modelmd#22-indicators指标)

**步骤**：

1. 在 `dataModel.json` 的 `indicators` 数组添加新字段
2. 在 `schema.ts` 的 `defineInteractionSchema` 添加新派发参数（如 `selectValue`）
3. 在 `index.jsx` 的 `onChange` 函数中追加派发：
    ```javascript
    {
        fieldName: interaction.defined?.selectValue,
        state: data.filter((item) => _.includes(checkedListIds, item.id)).map((item) => item.value),
    }
    ```

## 任务 6：修改默认数据

**场景描述**：用户首次拖入时希望展示具体选项。

涉及：
- 🟦 Schema：[schema.md § 5](./schema.md#5-默认值参考)
- ⬜ 组件逻辑：（无）
- 🟩 数据：[data-model.md § 4](./data-modelmd#4-默认数据示例)

**步骤**：

修改 `schema.ts` 末尾 `defaultValue.dataConfig.json`：

```typescript
dataConfig: {
    json: [
        { id: 'value-1', label: '选项一' },
        { id: 'value-2', label: '选项二' },
    ],
    // ...
}
```

## 任务 7：关闭点击外部自动关闭

**场景描述**：用户希望点外部不关闭弹窗。

涉及：
- 🟦 Schema：（无）
- 🟨 组件逻辑：[component-logic.md § 2.2.4](./component-logic.md#224-点击外部关闭弹窗)
- ⬜ 数据：（无）

**步骤**：

注释或删除 `index.jsx` 第 117-125 行的 `useEffect`。

> ⚠️ 此修改会改变用户预期行为，需谨慎。

## 任务 8：调整默认值

**涉及文件**：`schema.ts` 末尾 `defaultValue.config.{xxx}`

### 8.1 调整选择框尺寸

```typescript
selectedStyle: {
    width: 252,
    height: 44,
    // ...
}
```

### 8.2 调整弹窗默认位置

```typescript
popoverStyle: {
    popoverTop: 50,  // 弹窗距顶 50px
    popoverBorderRotate: 0,  // 不旋转
}
```

### 8.3 调整箭头默认位置

```typescript
arrowStyle: {
    size: 12,
    color: '#44b0f9',
    rotate: 44,
    marginTop: 10,  // 注意：fallback 是 selectedStyle.height - 20
}
```

## 任务 9：暴露 `defaultCheckedValue` 为可配置项

**场景描述**：用户希望控制默认已选项（当前是隐式字段）。

涉及：
- 🟦 Schema：[schema.md § 2.3](./schema.md#23-选择框样式selectedstyle)（在 `funcSettings` 加字段）
- 🟨 组件逻辑：[component-logic.md § 2.1](./component-logicmd#21-入口签名) + 自动初始化
- ⬜ 数据：（无）

**步骤**：

1. 在 `schema.ts` 的 `funcSettings` 面板添加 `defaultCheckedValue: { type: 'array', title: '默认已选项', 'x-component': 'Input.TextArea' }`
2. 修复 `index.jsx` 第 52 行：`useState(defaultCheckedValue || [])` 已经是正确读取，只需要在 defaultValue 中补：
    ```typescript
    funcSettings: {
        defaultCheckedValue: [],
        // ...
    }
    ```

> 详细背景见 [gotchas.md § 1](./gotchas.md#1-隐式字段-defaultcheckedvalue)
