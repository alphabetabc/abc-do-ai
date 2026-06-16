---
title: 组件逻辑维护
description: 基础标签组件代码（index.tsx）的维护要点
version: 1.0.0
last_updated: 2026-06-16
---

# 组件逻辑维护

本文档说明 `normal-label` 组件代码（`index.tsx`）的维护要点。

> 与 [schema.md](./schema.md)（配置面板）和 [data-model.md](./data-model.md)（数据契约）并列。

## 1. 文件结构

```
normal-label/
├── index.tsx        # 主组件（唯一组件文件）
├── index.less       # 样式（当前为空）
├── schema.ts        # 配置面板（→ 🟦 schema.md）
├── dataModel.json   # 数据契约（→ 🟩 data-model.md）
└── oss-material.json # 物料元信息
```

## 2. 主组件 `index.tsx`

### 2.1 入口签名

```typescript
const NormalLabel: React.FC<DesignerField> = (props) => {
    const { dataSource, config } = props;
    // ...
};
```

| props | 类型 | 来源 | 用途 |
| ----- | ---- | ---- | ---- |
| `config` | object | schema 配置面板 | 用户配置，含 `config.common.textStyle`（→ 🟦 schema.md § 2.1） |
| `dataSource` | array | dataConfig | 数据数组，组件读取 `dataSource[0].labelText`（→ 🟩 data-model.md § 2.2） |
| `designer` | object | 框架 | 设计器上下文（当前未使用） |
| `interaction` | object | 框架 | 交互配置（当前未启用） |

### 2.2 关键逻辑

#### 2.2.1 渲染逻辑

```typescript
<section style={config.common.textStyle}>
    <span>{dataSource?.[0]?.labelText}</span>
</section>
```

**注意**：
- 组件仅读取 `dataSource` 数组**第 0 项**的 `labelText` 字段，其余数据项被忽略
- 使用可选链 `?.` 处理 `dataSource` 为空或 `labelText` 不存在的情况（此时渲染空白）
- `config.common.textStyle` 由 VisualTextStyle 组件生成，包含 `color`、`fontFamily`、`fontSize`、`fontWeight`、`lineHeight` 等 CSS 属性，直接作为 React `style` 对象使用

### 2.3 维护检查清单

- [ ] 修改渲染结构时确保 `dataSource` 为空时不会报错
- [ ] 新增配置项后同步更新 `config.xxx` 的读取逻辑
- [ ] 确保 `textStyle` 中的 CSS 属性与 VisualTextStyle 输出一致

## 3. 子组件

当前无子组件。

## 4. 样式 `index.less`

### 4.1 命名规范

```less
.normal-label {  // 根 class（当前未使用，组件使用 <section> 直接渲染）
    ...
}
```

### 4.2 关键样式

当前 `index.less` 为空文件，组件样式完全由 `config.common.textStyle` 内联样式控制。

### 4.3 维护检查清单

- [ ] 如需添加 class 样式，根 class 应与 `oss-material.json` 的 `name` 字段一致（`normal-label`）
- [ ] 容器 `position: relative`（如需定位子元素）

## 5. 常用工具函数

当前无使用。

## 6. 性能要点

| 场景 | 注意事项 |
| ---- | -------- |
| 数据更新 | 组件无状态、无副作用，数据更新时直接重新渲染，性能开销极低 |
| 高频刷新 | 纯文本渲染无性能瓶颈 |

## 7. 调试小技巧

### 7.1 查看当前配置

```typescript
// 在 index.tsx 中临时添加
console.log('config:', config);
console.log('dataSource:', dataSource);
```

### 7.2 模拟默认数据

组件默认数据在 `schema.ts` 的 `defaultValue.dataConfig.json` 中定义：`[{ labelText: '文本内容' }]`。修改此处可改变首次拖入时的展示文本。

## 8. 维护历史

| 日期 | 变更 | 原因 |
| ---- | ---- | ---- |
| 2026-06-16 | 初始文档创建 | 物料文档体系建设 |
