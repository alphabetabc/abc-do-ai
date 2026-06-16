---
title: single-image - 组件逻辑维护
description: 单张图片物料的组件逻辑，包含渲染流程、双模式图片处理、点击事件处理和可见性控制
version: 1.0.0
last_updated: 2026-06-16
---

# 🟨 组件逻辑维护

> 源码文件：[`packages/single-image/index.jsx`](../../../../../packages/single-image/index.jsx)
> 样式文件：[`packages/single-image/index.less`](../../../../../packages/single-image/index.less)

## Props 结构

```js
const {
  className,          // 外部 className
  config,             // 🟦 Schema 面板配置
  dataSource: data,   // 🟩 数据源
  interaction,        // 交互能力（dispatch / defined）
  designer: { env, constants, permissions },  // 设计器环境信息
  interactionProps,   // 交互传入的参数（urlParam, otherParam1~5）
} = props;
```

## 渲染流程

```
1. 解构 config → backgroundStyle, clickEventConfig
2. 计算 visible 状态（基于 permissions.zoneLevel）
3. 计算 backgroundSizeRepeatStyle（图片尺寸和重复）
4. 计算 backgroundImageStyle（useMemo 缓存图片路径样式）
5. 渲染：visible ? <div with background> : ''
```

## 双模式图片渲染

### 位图模式（backgroundType === 'Image'）

- 使用 CSS `backgroundImage` 属性
- 图片来源优先级：**数据源 `data[0].content`** > **配置面板 `backgroundDefine`**
- 图片路径通过 `getImageUrl()` 处理，`isMaterial: true` 标记为物料资源

### 矢量图模式（backgroundType === 'SVG'）

- 使用 CSS `WebkitMaskImage` 属性（非标准，仅 Webkit 内核）
- 背景色由 `backgroundColor` 控制
- SVG 路径通过 `getImageUrl()` 处理，`localDir: 'svg'` 指定 SVG 目录
- 额外设置 `ImageRendering: '-webkit-optimize-contrast'` 优化渲染

### 图片重复处理

```
backgroundRepeat === 'full'
  → backgroundSize: '100% 100%' + backgroundRepeat: 'no-repeat'
  （SVG 模式对应 WebkitMaskSize / WebkitMaskRepeat）

其他值
  → 直接设置 backgroundRepeat / WebkitMaskRepeat
```

## useMemo 缓存

`backgroundImageStyle` 使用 `useMemo` 缓存，依赖项：

```js
[constants, backgroundStyle.backgroundColor, backgroundStyle.backgroundDefine,
 backgroundStyle.backgroundImage, backgroundStyle.backgroundType, dataImageUrl, env]
```

> ⚠️ 注意：`backgroundSizeRepeatStyle` **没有**使用 useMemo，每次渲染都会重新计算。

## 点击事件处理（onImageClick）

点击事件有 **三种互斥分支**，按优先级排列：

### 分支 1：参数派发 + 拼接参数（isJoinParam === true）

```
条件：patchParams.length > 0 && clickParams && dispatch && isJoinParam
行为：
  1. 依次替换 clickParams 中的 otherParam1~5 为 interactionProps 中的实际值
  2. 使用 _.replace 链式替换（注意：非正则，仅替换首次匹配）
  3. dispatch 派发 { fieldName: imageClickParams, state: 替换后的字符串 }
```

### 分支 2：参数派发（无拼接）

```
条件：patchParams.length > 0 && clickParams && dispatch
行为：直接 dispatch { fieldName: imageClickParams, state: clickParams }
```

### 分支 3：下钻事件

```
条件：clickEvent.show === true
行为按 effect 分：
  - Modal / Drawer → dispatch { fieldName: 'clickEvent', state: { visible: true, param, otherParam1~5 } }
  - page → window.open(params + urlParam)
  - Window → window.open(params + urlParam)（新窗口）
  - WindowSelf → window.open(params + urlParam, '_self')（当前窗口）
```

> ⚠️ 注意：`effect === 'page'` 分支在 Schema 中已无对应选项，但代码中仍保留。

## 可见性控制

```js
useEffect(() => {
  // visible === 'all' || 未设置 → 显示
  // visible === 'province' && zoneLevel === 2 → 显示
  // visible === 'city' && zoneLevel === 3 → 显示
  // 其他 → 隐藏
}, [config, permissions]);
```

| visible 值 | zoneLevel | 是否可见 |
|------------|-----------|---------|
| `all` | 任意 | ✅ |
| `province` | 2（省级） | ✅ |
| `province` | 其他 | ❌ |
| `city` | 3（地市级） | ✅ |
| `city` | 其他 | ❌ |
| 未设置 | 任意 | ✅ |

## 设计器模式

- 使用 `useDevelopmentMode(props)` 判断是否在设计器中
- 设计器模式下添加 `single-image-wrapper-designer` class
- 该 class 通过 `::after` 伪元素覆盖一层 `pointer-events: all` 的遮罩（z-index: 9），防止设计器中点击图片触发点击事件

## 样式结构（index.less）

```less
.single-image-wrapper           // 外层容器，100% 宽高
  &.single-image-wrapper-designer  // 设计器模式
    &::after                    // 透明遮罩，拦截点击
  .visual-base-single-image-item  // 图片元素，100% 宽高
.single-image-modal             // Modal 弹窗样式
  .oss-ui-modal-content         // 透明背景
```

## 跨文档引用

- 🟦 配置面板字段定义 → [schema.md](./schema.md)
- 🟩 数据源字段说明 → [data-model.md](./data-model.md)
