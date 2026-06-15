---
title: 组件逻辑维护
description: digital-card 组件代码（index.jsx）的维护要点
version: 1.0.0
last_updated: 2026-06-15
---

# 组件逻辑维护

本文档说明 `digital-card` 组件代码（`index.jsx`）的维护要点。

> 与 [schema.md](./schema.md)（配置面板）和 [data-model.md](./data-model.md)（数据契约）并列。

## 1. 文件结构

```
digital-card/
├── index.jsx        # 主组件（Class 组件）
├── index.less       # 样式
├── schema.ts        # 配置面板（→ schema.md）
├── dataModel.json   # 数据契约（→ data-model.md）
├── oss-material.json# 物料元信息
└── doc/
    ├── README.md    # 用户向文档
    └── CHANGELOG.md # 更新日志
```

## 2. 主组件 `index.jsx`

### 2.1 入口签名

```jsx
class DigitalCard extends React.Component {
    fnGetStyle = (key) => {
        return this.props.config[key];
    };
    render() {
        // ...
    }
}
```

| props        | 类型   | 来源       | 用途                           |
| ------------ | ------ | ---------- | ------------------------------ |
| `config`     | object | schema     | 用户配置（背景/标题/数值样式） |
| `dataSource` | array  | dataConfig | 数据数组，读取 `dataSource[0]` |

### 2.2 关键逻辑

#### 2.2.1 背景渐变

```jsx
style={{
    width: `${this.props.config?.width}px`,
    height: `${this.props.config?.height}px`,
    background: `linear-gradient(${this.fnGetStyle('containerStyle')?.bgColorStart}, ${
        this.fnGetStyle('containerStyle')?.bgColorEnd
    })`,
}}
```

**注意**：渐变方向固定为从上到下（`linear-gradient` 默认方向）。

#### 2.2.2 标题颜色回退

```jsx
color:
    this.fnGetStyle('listItemLabel')?.color && this.fnGetStyle('listItemLabel')?.color.length
        ? this.fnGetStyle('listItemLabel')?.color
        : this.fnGetStyle('containerStyle')?.bgColorEnd,
```

**注意**：当标题文字颜色未设置（空字符串）时，自动回退到背景渐变结束色。

#### 2.2.3 左边框处理

```jsx
borderLeft: !this.fnGetStyle('listItemLabel')?.showLeftBorder
    ? ''
    : `solid ${this.fnGetStyle('listItemLabel')?.borderLeftWidth}px ${this.fnGetStyle('containerStyle')?.bgColorEnd}`,
paddingLeft: this.fnGetStyle('listItemLabel')?.showLeftBorder ? this.fnGetStyle('listItemLabel')?.paddingLeft : 0,
```

**注意**：左边框颜色**固定使用背景渐变结束色**（`bgColorEnd`），而非 `borderLeftColor` 配置项。`borderLeftColor` 字段存在于 schema 但组件中未使用。

#### 2.2.4 数据读取

```jsx
{
    this.props.dataSource[0].label;
} // 标题
{
    this.props.dataSource[0].value;
} // 数值
```

**注意**：直接读取 `dataSource[0]`，无空值保护。如果 `dataSource` 为空数组会报错。

### 2.3 维护检查清单

-   [ ] `dataSource[0]` 无空值保护，需注意空数据时的渲染
-   [ ] `borderLeftColor` 字段在 schema 中存在但组件未使用（始终使用 `bgColorEnd`）
-   [ ] 标题颜色回退逻辑依赖 `color.length` 判断，空字符串 `''` 会回退
-   [ ] `fnGetStyle` 读取 `config[key]`，key 需与 schema 分组名一致

## 3. 样式 `index.less`

```less
.digital-card-wrapper {
    .item-label {
        display: flex;
        align-items: center;
        width: 100%;
        height: 30%;
    }
    .item-value {
        color: #fff;
        height: 70%;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
}
```

### 3.1 布局比例

-   `.item-label`：高度占 30%，flex 水平居中
-   `.item-value`：高度占 70%，flex 垂直居中

### 3.2 维护检查清单

-   [ ] 根 class 为 `digital-card-wrapper`（硬编码在 `index.jsx` 的 `className` 中）
-   [ ] 标题与数值的高度比例为 30% : 70%
-   [ ] 容器 `position: relative` 由框架层保证

## 4. 性能要点

| 场景       | 注意事项                                          |
| ---------- | ------------------------------------------------- |
| Class 组件 | 使用 Class 而非函数组件，每次 render 重新计算样式 |
| 无 useMemo | 样式计算未缓存，每次渲染重新执行                  |

## 5. 调试小技巧

### 5.1 查看完整 props

```jsx
// 在 render 中临时添加
console.log('DigitalCard props:', this.props);
```

## 6. 维护历史

| 日期       | 变更     | 原因            |
| ---------- | -------- | --------------- |
| 2026-06-15 | 创建文档 | 首次 5+1 文档化 |
