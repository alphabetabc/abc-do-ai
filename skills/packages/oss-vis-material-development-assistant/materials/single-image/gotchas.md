---
title: single-image - 踩坑记录
description: 单张图片物料的踩坑记录和注意事项，包含已知问题、易错点和最佳实践
version: 1.0.0
last_updated: 2026-06-16
---

# ⚠️ 踩坑记录

## 1. 矢量图模式的浏览器兼容性

**问题**：SVG 模式使用 `WebkitMaskImage`，这是 **非标准 CSS 属性**，仅在 Webkit 内核浏览器（Chrome / Edge / Safari）中有效。

**影响**：Firefox 不支持 `-webkit-mask-image`，SVG 模式下图片将不可见。

**Schema 中的提示**：
> `backgroundType` 字段的 tooltip：「矢量图配置存在浏览器兼容性问题，谨慎使用」

**建议**：
- 优先使用位图模式（`Image`）
- 如果必须使用 SVG，考虑添加 Firefox 兼容方案（如 `mask` 标准属性 fallback）

## 2. _.replace 仅替换首次匹配

**问题**：`onImageClick` 中使用 `_.replace` 替换 `otherParam1~5`，但 `_.replace` 底层是 `String.prototype.replace(string, ...)`，**仅替换第一个匹配**。

```js
// 如果 clickParams = "a=otherParam1&b=otherParam1"
// 结果只会替换第一个 otherParam1
const replace1 = _.replace(clickEventConfig?.clickParams, 'otherParam1', interactionProps?.otherParam1 || '');
```

**建议**：如果需要全局替换，应使用正则 `new RegExp('otherParam1', 'g')` 或 `String.replaceAll()`。

## 3. effect === 'page' 已废弃但代码保留

**问题**：`onImageClick` 中存在 `clickEvent.effect === 'page'` 分支，但 🟦 Schema 中 `effect` 的 Select options 已不包含 `page` 选项。

```js
// 此分支永远不会被触发（除非旧数据残留）
else if (clickEvent.effect === 'page') {
  window.open(`${clickEvent.params}${interactionProps?.urlParam}`);
}
```

**建议**：清理废弃代码前需确认是否有旧项目数据仍使用 `page` 值。

## 4. backgroundSizeRepeatStyle 未使用 useMemo

**问题**：`backgroundImageStyle` 使用了 `useMemo` 缓存，但 `backgroundSizeRepeatStyle` 每次渲染都重新计算。

```js
// 每次渲染都会重新创建对象
const backgroundSizeRepeatStyle = {};
if (backgroundStyle.backgroundType === 'Image') { ... }
```

**影响**：性能影响较小（对象创建开销低），但与 `backgroundImageStyle` 的处理不一致。

**建议**：如需优化，可将两者合并到一个 `useMemo` 中。

## 5. 参数派发与下钻的互斥逻辑不完整

**问题**：Schema 中通过 `x-reactions` 禁用了派发参数面板（当 `drilldownEvent.show === true`），但：

1. 代码中判断的是 `configurableEvent`，而 Schema 中 `x-reactions` 依赖的是 `.configurableEvent`（相对路径）
2. 组件中 `onImageClick` 的分支判断顺序是：先检查 `patchParams`（派发参数），再检查 `clickEvent.show`（下钻）
3. 如果通过代码层面同时设置了两者，行为取决于 `patchParams.length > 0` 是否为真

**建议**：互斥逻辑应同时在 Schema 和组件中保证一致性。

## 6. 设计器模式遮罩层 z-index 冲突

**问题**：设计器模式下 `::after` 伪元素的 `z-index: 9` 可能与其他物料的遮罩层冲突。

```less
&.single-image-wrapper-designer {
  &::after {
    z-index: 9;  // 如果其他物料也使用类似的 z-index，可能产生冲突
  }
}
```

**建议**：确认项目统一的 z-index 层级规范。

## 7. dataImageUrl 取值可能为 undefined

**问题**：`data?.[0]?.content` 在数据源为空数组或 `content` 字段缺失时为 `undefined`。

```js
const dataImageUrl = data?.[0]?.content;  // 可能为 undefined
```

**影响**：`useMemo` 的依赖项中包含 `dataImageUrl`，当它从有效值变为 `undefined`（或反过来）时会触发重新计算。回退逻辑会生效（使用配置面板的图片）。

**建议**：这是预期行为，但需确保 `getImageUrl` 能正确处理 `undefined` 输入。

## 8. visible 判断中 zoneLevel 为字符串

**问题**：`permissions?.zoneLevel` 与数字 `2` / `3` 进行 `===` 严格比较。如果后端返回的是字符串 `"2"` / `"3"`，判断将失败。

```js
config?.visible?.visible === 'province' && permissions?.zoneLevel === 2  // 如果 zoneLevel 是 "2"，结果为 false
```

**建议**：确认 `permissions.zoneLevel` 的数据类型，必要时使用 `==` 或先转换类型。

## 9. Window 和 WindowSelf 的 URL 拼接

**问题**：`Window` 和 `WindowSelf` 模式下直接拼接 `clickEvent.params + interactionProps?.urlParam`，没有 `&` 分隔符。

```js
window.open(`${clickEvent.params}${interactionProps?.urlParam || ''}`);
```

**影响**：如果 `clickEvent.params = "https://example.com?a=1"` 且 `urlParam = "b=2"`，结果是 `https://example.com?a=1b=2`（缺少 `&`）。

**建议**：确保 `clickEvent.params` 末尾已包含 `&`，或在拼接时自动添加。

## 10. Modal 关闭图标位置默认值

**问题**：`closeIconLeft: 550` 和 `closeIconTop: 25` 是基于 `width: 600` 的默认值计算的。如果修改了 Modal 宽度，关闭图标位置不会自动调整。

**建议**：修改 Modal 宽度时，同步调整 `closeIconLeft` 值。

## 跨文档引用

- 🟦 Schema 配置详情 → [schema.md](./schema.md)
- 🟨 组件逻辑详情 → [component-logic.md](./component-logic.md)
- 🟩 数据契约详情 → [data-model.md](./data-model.md)
- 📋 常见修改任务 → [common-tasks.md](./common-tasks.md)
