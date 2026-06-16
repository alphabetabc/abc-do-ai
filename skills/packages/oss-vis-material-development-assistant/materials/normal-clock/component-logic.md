---
title: normal-clock - 组件逻辑维护
description: 时钟物料的组件渲染逻辑、状态管理和生命周期
version: 1.0.0
last_updated: 2026-06-16
---

# 🟨 组件逻辑维护

> 本文档描述 `packages/normal-clock/index.jsx` 中的组件实现逻辑。

## 组件概览

```jsx
const NormalClock = (props) => {
    // 1. 解构配置
    // 2. 状态管理
    // 3. 样式计算
    // 4. 定时器逻辑
    // 5. 渲染
}
```

## Props 结构

```typescript
interface Props {
    config: {
        normal: {
            timeFormat: string;
            isTimeParams: boolean;
            timeParamsFormat: string;
            timeParamsDate: string;
            textStyle: {
                fontSize: number;
                color: string;
                fontFamily: string;
                fontWeight: string | number;
                textAlign: string;
            };
        };
    };
    interaction?: {
        dispatch: (params: { data: Array<{ fieldName: string; state: any }> }) => void;
        defined?: {
            timeParamsKey?: string;
        };
    };
}
```

## 核心逻辑

### 1. 配置解构

```jsx
const { config } = props;
const { normal: textSetting } = config;
```

从 `config.normal` 中获取所有文本相关配置。

### 2. 状态管理

```jsx
const [timeStr, setTimeStr] = useState('');
```

仅使用一个状态 `timeStr` 存储当前格式化的时间字符串。

### 3. 样式计算

```jsx
const labelTextStyle = {
    ..._.pick(textSetting?.textStyle, ['fontSize', 'fontWeight', 'textAlign', 'fontFamily', 'color']),
    width: '100%',
    display: 'inline-block',
    lineHeight: isNaN(textSetting?.textStyle.fontSize) 
        ? textSetting?.textStyle.fontSize 
        : `${textSetting?.textStyle.fontSize}px`,
};
```

**关键点：**
- 使用 `_.pick` 从 `textStyle` 中提取 5 个样式属性
- 添加 `width: 100%` 和 `display: inline-block`
- `lineHeight` 处理：如果 `fontSize` 是数字则加 `px`，否则直接使用

### 4. 定时器逻辑

```jsx
useEffect(() => {
    const timer = setInterval(() => {
        // 1. 格式化时间
        // 2. 检查整点传参
        // 3. 更新状态
    }, 1000);
    
    return () => {
        clearInterval(timer);
    };
}, [textSetting]);
```

**依赖项：** `[textSetting]` - 当配置变化时重启定时器。

#### 4.1 时间格式化

```jsx
let str = '';
switch (textSetting?.timeFormat) {
    case 1:
        str = new Date().toLocaleDateString();
        break;
    case 2:
        str = new Date().toLocaleTimeString();
        break;
    case 3:
        str = new Date().toLocaleString();
        break;
    default:
        try {
            str = dayjs().format(textSetting?.timeFormat);
        } catch (error) {
            str = new Date().toLocaleString();
        }
        break;
}
```

**兼容逻辑：**
- `case 1/2/3`：旧版本兼容，使用原生 `Date` API
- `default`：新版本使用 `dayjs().format()`，格式由 `timeFormat` 字符串指定

#### 4.2 整点传参

```jsx
if (textSetting?.isTimeParams && textSetting?.timeParamsDate === dayjs().format(`HH:mm:ss`)) {
    props.interaction?.dispatch({
        data: [{ 
            fieldName: props.interaction?.defined?.timeParamsKey, 
            state: dayjs().format(textSetting?.timeParamsFormat) 
        }],
    });
}
```

**触发条件：**
1. `isTimeParams === true`（启用整点传参）
2. `timeParamsDate === 当前时间的 HH:mm:ss`（到达指定时间点）

**派发内容：**
- `fieldName`：来自 `interaction.defined.timeParamsKey`
- `state`：使用 `timeParamsFormat` 格式化的当前时间

### 5. 渲染

```jsx
return (
    <div className="normal-clock-root">
        <span style={labelTextStyle}>{timeStr}</span>
    </div>
);
```

简单的结构：外层 `div` + 内层 `span` 显示时间字符串。

## 生命周期

| 阶段 | 行为 |
|------|------|
| 挂载 | 启动 `setInterval`，每秒更新时间 |
| 配置变化 | 清理旧定时器，启动新定时器 |
| 卸载 | 清理定时器，避免内存泄漏 |

## 关键依赖

| 依赖 | 用途 |
|------|------|
| `dayjs` | 时间格式化和获取当前时间 |
| `oss-web-toolkits` | `_.pick` 工具函数 |
| `React.useState` | 状态管理 |
| `React.useEffect` | 副作用处理 |

## 注意事项

1. **定时器清理**：`useEffect` 返回清理函数，防止组件卸载后定时器继续运行
2. **配置响应**：`textSetting` 变化时会重启定时器，确保新配置生效
3. **错误处理**：`dayjs().format()` 失败时回退到 `new Date().toLocaleString()`
4. **可选链**：大量使用 `?.` 防止配置未定义时报错

## 相关文档

- 配置项定义 → [🟦 schema.md](./schema.md)
- 数据默认值 → [🟩 data-model.md](./data-model.md)
