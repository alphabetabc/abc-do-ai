---
title: normal-clock - 踩坑记录
description: 时钟物料开发中的注意事项和常见问题
version: 1.0.0
last_updated: 2026-06-16
---

# 踩坑记录

> 本文档记录 normal-clock 物料开发和维护中的注意事项。

## 1. 定时器清理

### 问题
组件卸载后定时器继续运行，导致内存泄漏或报错。

### 现状
代码已正确处理：

```jsx
useEffect(() => {
    const timer = setInterval(() => {
        // ...
    }, 1000);
    return () => {
        clearInterval(timer);  // ✅ 正确清理
    };
}, [textSetting]);
```

### 注意
- 修改定时器逻辑时，务必保留清理函数
- 如果有多个定时器，需要在清理函数中全部清除

---

## 2. 旧版本兼容

### 问题
`timeFormat` 历史上有数字格式（1/2/3）和字符串格式两种。

### 现状
代码保留 switch case 兼容：

```jsx
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
        str = dayjs().format(textSetting?.timeFormat);
        break;
}
```

### 注意
- 不要删除 switch case，除非确认所有旧数据已迁移
- 新增格式只走 default 分支
- 代码注释标记为 `TODO: 兼容旧版本，后期去掉`

---

## 3. 整点传参时机

### 问题
整点传参依赖每秒检查，可能错过触发时机。

### 现状
```jsx
if (textSetting?.isTimeParams && textSetting?.timeParamsDate === dayjs().format(`HH:mm:ss`)) {
    // 派发
}
```

### 潜在问题
- 如果定时器间隔 > 1000ms，可能跳过整点
- 如果页面卡顿，定时器延迟执行，可能错过整点
- 浏览器标签页后台运行时，定时器可能被节流

### 建议
- 保持 1000ms 或更短的更新间隔
- 如果需要更可靠的触发，考虑使用范围判断（前后几秒内）

---

## 4. 配置变化重启定时器

### 问题
`useEffect` 依赖 `textSetting`，配置变化会重启定时器。

### 现状
```jsx
useEffect(() => {
    const timer = setInterval(() => {
        // ...
    }, 1000);
    return () => {
        clearInterval(timer);
    };
}, [textSetting]);  // 依赖整个 textSetting 对象
```

### 注意
- `textSetting` 是对象引用，每次配置面板修改都会创建新对象
- 频繁修改配置会导致定时器频繁重启
- 如果只需要依赖特定字段，可以改为依赖具体字段：

```jsx
}, [textSetting?.timeFormat, textSetting?.isTimeParams, ...]);
```

---

## 5. 样式 lineHeight 处理

### 问题
`fontSize` 可能是数字或字符串（如 `24px`、`2em`）。

### 现状
```jsx
lineHeight: isNaN(textSetting?.textStyle.fontSize) 
    ? textSetting?.textStyle.fontSize 
    : `${textSetting?.textStyle.fontSize}px`,
```

### 注意
- Schema 中 `fontSize` 类型是 `number`，但用户可能通过其他方式传入字符串
- `isNaN()` 判断：数字返回 false，字符串返回 true
- 确保传入的字符串是合法的 CSS line-height 值

---

## 6. 字体颜色与渐变

### 问题
`color` 字段在渐变模式下隐藏。

### 现状
```typescript
color: {
    'x-reactions': {
        dependencies: ['.isGradient'],
        when: '{{ $deps[0] === false }}',
        fulfill: { state: { visible: true } },
        otherwise: { state: { visible: false } },
    },
}
```

### 注意
- `isGradient` 字段在当前 schema 中未定义，可能是历史遗留
- 如果不需要渐变功能，可以移除这个条件判断
- 组件中直接读取 `color`，如果为 undefined 会使用浏览器默认值

---

## 7. 可选链保护

### 问题
配置可能未完全初始化，直接访问会报错。

### 现状
代码大量使用可选链：

```jsx
textSetting?.textStyle?.fontSize
textSetting?.timeFormat
props.interaction?.dispatch
props.interaction?.defined?.timeParamsKey
```

### 注意
- 新增配置访问时，继续使用可选链
- 特别是 `interaction` 对象，在编辑器和预览中可能不存在

---

## 8. dayjs 格式化错误处理

### 问题
无效的格式字符串会导致 dayjs 抛出异常。

### 现状
```jsx
try {
    str = dayjs().format(textSetting?.timeFormat);
} catch (error) {
    str = new Date().toLocaleString();  // 回退方案
}
```

### 注意
- 回退方案使用 `toLocaleString()`，格式与配置无关
- 如果用户自定义格式，确保格式字符串符合 dayjs 规范
- 常见错误：使用 `YYYY-MM-DD` 时误写为 `YYYY-MM-DD`（中文冒号）

---

## 9. 数据源配置冗余

### 问题
`defaultValue` 中包含完整的 `dataConfig`，但组件不使用。

### 现状
```typescript
dataConfig: {
    dataType: 'json',
    sql: {},
    dataSet: { current: {}, params: {} },
    api: { mode: 'get', url: '', headers: {}, params: {} },
    json: { content: '', iconType: '' },
}
```

### 注意
- 这是框架要求的标准结构，不能删除
- 组件中不读取 `props.data` 或 `props.dataSource`
- 修改时保持结构完整，避免框架报错

---

## 10. 整点时间格式匹配

### 问题
`timeParamsDate` 的 value 格式必须与 `dayjs().format('HH:mm:ss')` 匹配。

### 现状
```typescript
enum: [
    { value: '00:00:00', label: '00点' },
    { value: '01:00:00', label: '01点' },
    // ...
]
```

```jsx
textSetting?.timeParamsDate === dayjs().format(`HH:mm:ss`)
```

### 注意
- `value` 必须是 `HH:mm:ss` 格式，24 小时制，补零
- 不要使用 `H:mm:ss`（不补零）或 `hh:mm:ss`（12 小时制）
- 添加新时间点后，确保格式正确

---

## 相关文档

- 常见修改任务 → [common-tasks.md](./common-tasks.md)
- 组件逻辑详解 → [🟨 component-logic.md](./component-logic.md)
