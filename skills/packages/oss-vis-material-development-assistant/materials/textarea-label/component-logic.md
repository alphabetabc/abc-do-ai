---
title: textarea-label 组件逻辑维护
description: 文本域物料（textarea-label）的组件代码维护要点，包含 Input.TextArea 渲染
version: 1.0.0
last_updated: 2026-06-16
---

# textarea-label 组件逻辑维护

本文档说明 `textarea-label` 组件代码（`index.tsx`）的维护要点。

> 与 [schema.md](./schema.md)（配置面板）和 [data-model.md](./data-model.md)（数据契约）并列。

## 1. 文件结构

```
textarea-label/
├── index.tsx          # 主组件
├── schema.ts          # 配置面板（→ schema.md）
├── dataModel.json     # 数据契约（→ data-model.md）
└── oss-material.json  # 物料元信息
```

## 2. 主组件 `TextareaLabel`

### 2.1 入口签名

```typescript
const TextareaLabel: React.FC<DesignerField> = (props) => {
    const { dataSource, config } = props;
    // ...
};
```

| props | 类型 | 来源 | 用途 |
| --- | --- | --- | --- |
| `config` | object | schema | 用户配置（common） |
| `dataSource` | array | dataConfig | 数据源（数组） |

### 2.2 关键逻辑

#### 2.2.1 渲染 TextArea

```typescript
return (
    <Input.TextArea
        style={config.common.textStyle}
        autoSize={config.common.autoSize}
        bordered={config.common.bordered}
        value={dataSource?.[0]?.labelText}
    ></Input.TextArea>
);
```

**注意**：
- 使用 oss-ui 的 Input.TextArea 组件
- `style` 直接传递 textStyle 对象
- `autoSize` 控制是否自适应高度
- `bordered` 控制是否显示边框
- `value` 从 dataSource[0].labelText 读取

### 2.3 维护检查清单

- [ ] textStyle 是否正确传递
- [ ] autoSize 是否正确传递
- [ ] bordered 是否正确传递
- [ ] value 是否正确读取

## 3. 常用工具函数

| 函数 | 来源 | 用途 |
| --- | --- | --- |
| `Input.TextArea` | oss-ui | 多行文本输入组件 |

## 4. 性能要点

| 场景 | 注意事项 |
| --- | --- |
| 组件渲染 | 无状态组件，直接渲染 |
| 数据读取 | 仅读取 dataSource[0]，不支持多条数据 |

## 5. 调试技巧

### 5.1 查看数据

```typescript
console.log('dataSource:', dataSource);
console.log('config:', config);
```

### 5.2 查看样式

```typescript
console.log('textStyle:', config.common.textStyle);
```

## 6. 维护历史

| 日期 | 变更 | 原因 |
| --- | --- | --- |
| 2026-06-16 | 首次文档化 | 物料文档体系建设 |
