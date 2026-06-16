---
title: normal-clock - 常见修改任务
description: 时钟物料的常见修改场景和操作指南
version: 1.0.0
last_updated: 2026-06-16
---

# 常见修改任务

> 本文档提供 normal-clock 物料的常见修改场景和操作指南。

## 任务索引

| 任务 | 涉及文件 | 难度 |
|------|---------|------|
| [添加新的时间格式](#添加新的时间格式) | schema.ts | ⭐ |
| [修改默认样式](#修改默认样式) | schema.ts | ⭐ |
| [添加新的整点时间点](#添加新的整点时间点) | schema.ts | ⭐ |
| [修改更新频率](#修改更新频率) | index.jsx | ⭐⭐ |
| [添加新的文本样式属性](#添加新的文本样式属性) | schema.ts + index.jsx | ⭐⭐ |
| [移除旧版本兼容代码](#移除旧版本兼容代码) | index.jsx | ⭐⭐ |
| [修改整点传参逻辑](#修改整点传参逻辑) | index.jsx | ⭐⭐⭐ |

---

## 添加新的时间格式

### 场景
需要在时间格式下拉框中添加新的格式选项。

### 步骤

1. **打开** `packages/normal-clock/schema.ts`

2. **找到** `timeFormat` 字段的 `enum` 数组（约第 46-60 行）

3. **添加**新的格式选项：

```typescript
{ value: 'YYYY-MM-DD HH:mm:ss.SSS', label: '2022-01-01 13:00:00.000', discription: '' },
```

4. **同步添加**到 `timeParamsFormat` 的 `enum`（约第 88-102 行），如果需要支持整点传参：

```typescript
{ value: 'YYYY-MM-DD HH:00:00.000', label: '2022-01-01 13:00:00.000', discription: '' },
```

### 验证
- 在配置面板中检查新格式是否显示
- 选择新格式后检查时间显示是否正确

---

## 修改默认样式

### 场景
修改时钟的默认字体大小、颜色等样式。

### 步骤

1. **打开** `packages/normal-clock/schema.ts`

2. **找到** `defaultValue.config.normal.textStyle`（约第 292-298 行）

3. **修改**对应的默认值：

```typescript
textStyle: {
    fontSize: 32,           // 修改字号
    color: '#00FF00',       // 修改颜色
    fontFamily: 'Arial',    // 修改字体
    fontWeight: 500,        // 修改粗细
    textAlign: 'left',      // 修改对齐
}
```

### 注意
- 只影响新添加的组件，已存在的组件不受影响
- 字体名称必须在 `GLOBAL_FONTS` 中存在

---

## 添加新的整点时间点

### 场景
需要支持更精细的整点时间选择（如半点）。

### 步骤

1. **打开** `packages/normal-clock/schema.ts`

2. **找到** `timeParamsDate` 字段的 `enum` 数组（约第 120-145 行）

3. **添加**新的时间点：

```typescript
{ value: '00:30:00', label: '00点30分' },
{ value: '01:30:00', label: '01点30分' },
// ... 更多半点选项
```

### 注意
- `value` 格式必须为 `HH:mm:ss`
- 组件中使用 `dayjs().format('HH:mm:ss')` 进行匹配

---

## 修改更新频率

### 场景
将时间更新频率从 1 秒改为其他值（如 100ms 更流畅，或 60000ms 节省性能）。

### 步骤

1. **打开** `packages/normal-clock/index.jsx`

2. **找到** `setInterval` 调用（约第 25 行）

3. **修改**间隔时间：

```jsx
// 改为 100ms 更新
const timer = setInterval(() => {
    // ...
}, 100);  // 原为 1000

// 或改为 1 分钟更新（仅显示到分钟时可用）
const timer = setInterval(() => {
    // ...
}, 60000);
```

### 注意
- 更频繁的更新会增加 CPU 使用
- 如果时间格式不包含秒，可以改用 60000ms
- 整点传参的判断依赖每秒检查，频率过低可能错过整点

---

## 添加新的文本样式属性

### 场景
添加新的样式配置，如字体风格（italic）、文字阴影等。

### 步骤

1. **在 schema.ts 中添加配置项**

找到 `textStyle.properties`（约第 164-226 行），添加新字段：

```typescript
fontStyle: {
    title: '字体风格',
    type: 'string',
    'x-decorator': 'FormItem',
    'x-component': 'Select',
    enum: [
        { label: '正常', value: 'normal' },
        { label: '斜体', value: 'italic' },
    ],
},
```

2. **在 index.jsx 中提取新属性**

修改 `_.pick` 的参数（约第 18 行）：

```jsx
..._.pick(textSetting?.textStyle, ['fontSize', 'fontWeight', 'textAlign', 'fontFamily', 'color', 'fontStyle']),
```

3. **在 defaultValue 中添加默认值**

找到 `textStyle` 默认值（约第 292-298 行），添加：

```typescript
fontStyle: 'normal',
```

---

## 移除旧版本兼容代码

### 场景
清理 switch case 1/2/3 的旧版本兼容代码。

### 步骤

1. **打开** `packages/normal-clock/index.jsx`

2. **找到** switch 语句（约第 27-45 行）

3. **替换为**：

```jsx
let str = '';
try {
    str = dayjs().format(textSetting?.timeFormat);
} catch (error) {
    str = new Date().toLocaleString();
}
```

### 注意
- 确认没有旧项目使用数字格式的 `timeFormat`
- 建议先灰度测试

---

## 修改整点传参逻辑

### 场景
改变整点传参的触发条件或派发内容。

### 当前逻辑

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

### 修改示例 1：改为范围触发

```jsx
const currentTime = dayjs().format('HH:mm:ss');
const targetTime = textSetting?.timeParamsDate;
// 在目标时间前后 5 秒内触发
const timeDiff = Math.abs(dayjs(currentTime, 'HH:mm:ss').diff(dayjs(targetTime, 'HH:mm:ss'), 'second'));
if (textSetting?.isTimeParams && timeDiff <= 5) {
    // 派发逻辑
}
```

### 修改示例 2：添加额外参数

```jsx
props.interaction?.dispatch({
    data: [{ 
        fieldName: props.interaction?.defined?.timeParamsKey, 
        state: dayjs().format(textSetting?.timeParamsFormat),
        timestamp: Date.now(),  // 添加时间戳
    }],
});
```

---

## 相关文档

- 配置项定义 → [🟦 schema.md](./schema.md)
- 组件逻辑 → [🟨 component-logic.md](./component-logic.md)
- 注意事项 → [gotchas.md](./gotchas.md)
