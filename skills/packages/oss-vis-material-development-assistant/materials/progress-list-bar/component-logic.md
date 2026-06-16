---
title: progress-list-bar 组件逻辑维护
description: 水平进度图物料（progress-list-bar）的组件代码维护要点，包含进度条渲染、动画效果
version: 1.0.0
last_updated: 2026-06-16
---

# progress-list-bar 组件逻辑维护

本文档说明 `progress-list-bar` 组件代码（`index.tsx` + `RowItem` + `Styled`）的维护要点。

> 与 [schema.md](./schema.md)（配置面板）和 [data-model.md](./data-model.md)（数据契约）并列。

## 1. 文件结构

```
progress-list-bar/
├── index.tsx          # 主组件
├── index.less         # 样式
├── schema.ts          # 配置面板（→ schema.md）
├── dataModel.json     # 数据契约（→ data-model.md）
├── oss-material.json  # 物料元信息
├── components/
│   ├── RowItem.tsx    # 单行进度条组件
│   └── Styled.tsx     # styled-components 样式组件
└── doc/readme.md      # 用户向文档
```

## 2. 主组件 `ProgressListBar`

### 2.1 入口签名

```typescript
const ProgressListBar = (props) => {
    const {
        config,
        dataSource,
        designer: { env, constants, utils },
    } = props;
    // ...
};
```

| props | 类型 | 来源 | 用途 |
| --- | --- | --- | --- |
| `config` | object | schema | 用户配置（style） |
| `dataSource` | array | dataConfig | 数据源（数组） |
| `designer` | object | 框架 | 设计器上下文（env、constants、utils） |

### 2.2 关键逻辑

#### 2.2.1 数据解析

```typescript
const { style } = config;
const { progressBarStyle } = style;
const { direction, height, borderRadius, spacing, backgroundColor, enableAnimation } = progressBarStyle;

// 从 dataSource 读取数据
const data = dataSource || [];
```

**注意**：
- `dataSource` 是数组格式
- 每个数据项包含 `label`、`value`、`unit` 字段

#### 2.2.2 进度条渲染

```typescript
return (
    <div className="progress-list-bar" style={{ padding: spacing }}>
        {data.map((item, index) => (
            <RowItem
                key={index}
                item={item}
                direction={direction}
                height={height}
                borderRadius={borderRadius}
                spacing={spacing}
                backgroundColor={backgroundColor}
                enableAnimation={enableAnimation}
            />
        ))}
    </div>
);
```

**注意**：
- 使用 `RowItem` 子组件渲染单行进度条
- 传递配置参数（方向、高度、圆角、间距、背景色、动画开关）

### 2.3 维护检查清单

- [ ] 数据解析是否正确
- [ ] 进度条渲染是否正确
- [ ] 动画效果是否正确

## 3. 子组件 `RowItem`

### 3.1 入口签名

```typescript
const RowItem = (props) => {
    const {
        item,
        direction,
        height,
        borderRadius,
        spacing,
        backgroundColor,
        enableAnimation,
    } = props;
    // ...
};
```

| props | 类型 | 来源 | 用途 |
| --- | --- | --- | --- |
| `item` | object | 数据项 | 单行数据（label、value、unit） |
| `direction` | string | 配置 | 进度条方向（left/right） |
| `height` | number | 配置 | 进度条高度 |
| `borderRadius` | number | 配置 | 进度条圆角 |
| `spacing` | number | 配置 | 进度条间距 |
| `backgroundColor` | string | 配置 | 进度条背景色 |
| `enableAnimation` | boolean | 配置 | 进度点动画开关 |

### 3.2 关键逻辑

#### 3.2.1 进度条样式构建

```typescript
const progressBarStyle = {
    height: `${height}px`,
    borderRadius: `${borderRadius}px`,
    backgroundColor,
    marginBottom: `${spacing}px`,
};

const progressStyle = {
    width: `${item.value}%`,
    borderRadius: `${borderRadius}px`,
    background: `linear-gradient(to right, #1890ff, #52c41a)`,
};
```

**注意**：
- 进度条高度、圆角、间距、背景色来自配置
- 进度条宽度来自数据项的 `value` 字段
- 渐变色使用 `linear-gradient` 实现

#### 3.2.2 进度点动画

```typescript
{enableAnimation && (
    <ProgressDot
        $size={height}
        $color="#1890ff"
        $enableAnimation={enableAnimation}
    />
)}
```

**注意**：
- 使用 `ProgressDot` 组件渲染进度点动画
- 使用 transient props（`$size`、`$color`、`$enableAnimation`）避免 DOM 透传

#### 3.2.3 渲染结构

```typescript
return (
    <div className="row-item" style={progressBarStyle}>
        <div className="progress" style={progressStyle}>
            {enableAnimation && (
                <ProgressDot
                    $size={height}
                    $color="#1890ff"
                    $enableAnimation={enableAnimation}
                />
            )}
        </div>
        <div className="label">{item.label}</div>
        <div className="value">{item.value}{item.unit}</div>
    </div>
);
```

**注意**：
- 渲染结构包含进度条、标签、值
- 进度点动画在进度条内部渲染

### 3.3 维护检查清单

- [ ] 进度条样式是否正确
- [ ] 进度点动画是否正确
- [ ] 渲染结构是否正确

## 4. styled-components `Styled`

### 4.1 ProgressDot 组件

```typescript
export const ProgressDot = styled.div<{ $size: number; $color: string; $enableAnimation: boolean }>`
    width: ${(props) => props.$size}px;
    height: ${(props) => props.$size}px;
    border-radius: 50%;
    background-color: ${(props) => props.$color};
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    animation: ${(props) => props.$enableAnimation && 'pulse 1.5s infinite'};

    @keyframes pulse {
        0% {
            transform: translateY(-50%) scale(1);
            opacity: 1;
        }
        50% {
            transform: translateY(-50%) scale(1.2);
            opacity: 0.5;
        }
        100% {
            transform: translateY(-50%) scale(1);
            opacity: 1;
        }
    }
`;
```

**注意**：
- 使用 transient props（`$size`、`$color`、`$enableAnimation`）避免 DOM 透传
- 进度点动画使用 `keyframes` 实现
- 动画效果为 `pulse`（缩放 + 透明度变化）

### 4.2 维护检查清单

- [ ] transient props 是否正确
- [ ] 动画效果是否正确

## 5. 样式 `index.less`

### 5.1 命名规范

```less
.progress-list-bar {
    .row-item {
        .progress {
            // ...
        }
        .label {
            // ...
        }
        .value {
            // ...
        }
    }
}
```

### 5.2 关键样式

```less
.progress-list-bar {
    width: 100%;
    height: 100%;
    overflow: auto;

    .row-item {
        display: flex;
        align-items: center;
        position: relative;

        .progress {
            position: relative;
            flex: 1;
        }

        .label {
            margin-right: 10px;
        }

        .value {
            margin-left: 10px;
        }
    }
}
```

**注意**：
- 根 class 与 `oss-material.json.name` 一致
- 使用 flex 布局

### 5.3 维护检查清单

- [ ] 根 class 与 `oss-material.json.name` 一致
- [ ] 布局是否正确

## 6. 常用工具函数

| 函数 | 来源 | 用途 |
| --- | --- | --- |
| `styled` | `styled-components` | 创建 styled-components |
| `keyframes` | `styled-components` | 创建动画 |

## 7. 性能要点

| 场景 | 注意事项 |
| --- | --- |
| 进度点动画 | 使用 `keyframes` 实现，避免频繁重绘 |
| transient props | 使用 `$` 前缀避免 DOM 透传 |

## 8. 调试技巧

### 8.1 查看数据

```typescript
console.log('dataSource:', dataSource);
console.log('data:', data);
```

### 8.2 查看样式

```typescript
console.log('progressBarStyle:', progressBarStyle);
console.log('progressStyle:', progressStyle);
```

## 9. 维护历史

| 日期 | 变更 | 原因 |
| --- | --- | --- |
| 2026-06-16 | 首次文档化 | 物料文档体系建设 |
