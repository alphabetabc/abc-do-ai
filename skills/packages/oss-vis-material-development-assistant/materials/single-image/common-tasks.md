---
title: single-image - 常见修改任务
description: 单张图片物料的常见修改任务指南，包含新增配置项、修改交互逻辑、调整样式等场景
version: 1.0.0
last_updated: 2026-06-16
---

# 📋 常见修改任务

## 1. 新增一个图片样式配置项

**场景**：在「图片样式」面板中新增一个配置项（如图片圆角）。

### 步骤

1. **修改 🟦 Schema**（`schema.ts`）
   - 在 `backgroundStyle.properties` 中添加新字段定义
   - 设置合适的组件类型和条件显隐

```ts
// 示例：新增圆角配置
borderRadius: {
  title: '圆角',
  type: 'number',
  'x-decorator': 'FormItem',
  'x-component': 'NumberPicker',
  'x-component-props': { min: 0, max: 100 },
},
```

2. **添加默认值**（`schema.ts` → `defaultValue`）
   - 在 `config.backgroundStyle` 中添加默认值

```ts
backgroundStyle: {
  // ...existing fields
  borderRadius: 0,
}
```

3. **修改 🟨 组件逻辑**（`index.jsx`）
   - 在 `backgroundSizeRepeatStyle` 或 `backgroundImageStyle` 中消费新配置

```js
// 在 backgroundImageStyle 的 result 中添加
if (backgroundStyle.borderRadius) {
  result.borderRadius = `${backgroundStyle.borderRadius}px`;
}
```

## 2. 新增一种下钻事件效果

**场景**：除 Modal / Drawer / Window / WindowSelf 外，新增一种事件效果（如全屏弹窗 Fullscreen）。

### 步骤

1. **修改 🟦 Schema**
   - 在 `effect` 的 Select options 中新增选项

```ts
{ label: '全屏弹窗', value: 'Fullscreen' },
```

2. **新增下钻子配置面板**
   - 参照 `modalSet` / `drawerSet` / `windowSet` 的模式，新增 `fullscreenSet`
   - 使用 `x-reactions` 控制显隐：`when: '{{ $deps[0] === "Fullscreen" }}'`

3. **修改 🟨 组件逻辑**
   - 在 `onImageClick` 的分支 3 中添加新的 `else if`

```js
else if (clickEvent.effect === 'Fullscreen') {
  interaction.dispatch({
    data: [{ fieldName: 'fullscreenEvent', state: { visible: true, param: clickEventConfig?.clickParams } }],
  });
}
```

4. **添加默认值**
   - 在 `defaultValue.interactions.configurableEvent.clickEvent` 中添加 Fullscreen 相关默认值

## 3. 新增一个拼接参数（otherParam6）

**场景**：扩展参数透传能力，新增 otherParam6。

### 步骤

1. **修改 🟦 Schema**
   - 在 `defineInteractionSchema` 的 `subscribe` 中添加 `otherParam6` 字段定义

```ts
otherParam6: {
  type: 'string',
  title: '拼接参数6',
  'x-decorator': 'FormItem',
  'x-component': 'Input',
},
```

2. **修改 🟨 组件逻辑**
   - 在 `onImageClick` 的分支 1 中新增替换链

```js
const replace6 = _.replace(replace5, 'otherParam6', interactionProps?.otherParam6 || '');
```

   - 在分支 3 的 Modal/Drawer dispatch 中添加 `otherParam6`

3. **注意**：替换链是串行的，必须在上一个 replace 结果上继续替换

## 4. 修改可见范围级别

**场景**：新增「区域」级别的可见性（如 district）。

### 步骤

1. **修改 🟦 Schema**
   - 在 `visible.properties.visible` 的 Select options 中新增

```ts
{ label: '区县用户可见', value: 'district' },
```

2. **修改 🟨 组件逻辑**
   - 在 `useEffect` 中添加新的判断分支

```js
else if (config?.visible?.visible === 'district' && permissions?.zoneLevel === 4) {
  setVisible(true);
}
```

## 5. 修改图片渲染方式

**场景**：将位图模式从 `backgroundImage` 改为 `<img>` 标签渲染。

### 步骤

1. **修改 🟨 组件逻辑**（`index.jsx`）
   - 将 `<div>` 背景图方式改为 `<img>` 标签
   - 需要调整 `backgroundSizeRepeatStyle` 的计算逻辑
   - `backgroundRepeat` 映射为 `<img>` 的 CSS 属性

2. **修改样式**（`index.less`）
   - 调整 `.visual-base-single-image-item` 的样式

> ⚠️ 这是一个较大的改动，会影响图片重复、尺寸控制等所有相关逻辑。

## 6. 修改参数派发逻辑

**场景**：修改 `isJoinParam` 的替换行为（如改为正则全局替换）。

### 步骤

1. **修改 🟨 组件逻辑**
   - 当前使用 `_.replace` 仅替换首次匹配
   - 改为全局替换：

```js
// 改前（仅替换首次）
const replace1 = _.replace(clickEventConfig?.clickParams, 'otherParam1', interactionProps?.otherParam1 || '');

// 改后（全局替换）
const replace1 = (interactionProps?.otherParam1 || '').length
  ? clickEventConfig?.clickParams?.replaceAll('otherParam1', interactionProps.otherParam1)
  : clickEventConfig?.clickParams;
```

## 7. 修改 Modal 下钻的默认尺寸

**场景**：修改 Modal 弹窗的默认宽高。

### 步骤

1. **修改 🟦 Schema** 中的 `defaultValue`

```ts
interactions: {
  configurableEvent: {
    clickEvent: {
      width: 800,   // 改前 600
      height: 600,  // 保持不变
    },
  },
},
```

> 仅需修改 `defaultValue`，不影响 Schema 面板定义。

## 跨文档引用

- 🟦 Schema 面板结构 → [schema.md](./schema.md)
- 🟨 组件渲染和交互逻辑 → [component-logic.md](./component-logic.md)
- 🟩 数据字段说明 → [data-model.md](./data-model.md)
- ⚠️ 注意事项 → [gotchas.md](./gotchas.md)
