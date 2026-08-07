---
title: params-trigger - 踩坑记录
description: 参数触发器物料开发与维护中的坑、最佳实践和性能注意点
version: 1.0.0
last_updated: 2026-08-04
---

# 踩坑记录

> 本文档记录 params-trigger 物料开发和维护中的坑、最佳实践和性能注意点。

## 1. ArrayCollapse.CollapsePanel 必须用 `type: 'void'`

### 问题

最初 schema 中 `items` 写成 `type: 'object'`，会被 formily 当作数据结构 schema 处理，导致 ArrayCollapse 的 Index/Remove 组件渲染异常，或数据收集层级不对。

### 现状

已修正为 `type: 'void'`，panel 仅作布局容器使用：

```typescript
items: {
    type: 'void',  // ✅ 必须 void,不要用 object
    'x-component': 'ArrayCollapse.CollapsePanel',
    // ...
}
```

### 原则

-   **布局/面板节点**（`FormCollapse.CollapsePanel` / `ArrayCollapse.CollapsePanel` / `ArrayCollapse.Index` / `ArrayCollapse.Remove` / `ArrayCollapse.Addition`）→ 统一 `type: 'void'`
-   **数据字段节点**（用户配置项、数组数据等）→ 对应类型（`string` / `array` / `object`）

---

## 2. `constants.ts` 必须独立成文件（tree-shaking）

### 问题

最初 `DISPATCH_PREFIX` / `SUBSCRIBE_KEYS` / `COMPONENT_NAME` 放在 `schema.ts` 中，并通过 `import { DISPATCH_PREFIX } from './schema'` 在 `index.tsx` 引用。这会导致：

-   `index.tsx` 是 runtime bundle 的一部分
-   `schema.ts` 包含了完整的 formily schema 描述（`Input` / `Select` / `FormCollapse` / `ArrayCollapse` 等 x-component 引用）
-   通过 `./schema` 间接 import 时，bundler 无法 tree-shake，整个 schema 模块被打进 runtime bundle
-   **结果**：runtime bundle 体积膨胀，可能出现 formily 组件在 release 环境加载失败

### 现状

已抽取到独立的 `constants.ts`：

```typescript
// constants.ts - 纯常量,无 formily 依赖
export const SUBSCRIBE_KEYS = [...];
export const DISPATCH_PREFIX = 'paramsTrigger_';
export const COMPONENT_NAME = 'params-trigger';
```

```typescript
// index.tsx - 只 import 轻量常量
import { DISPATCH_PREFIX, COMPONENT_NAME } from './constants';
```

### 原则

**任何需要被 `index.tsx` 引用的常量，都应该放在独立的轻量模块（`constants.ts` / `config.ts`），避免通过 schema 模块间接 import。**

---

## 3. 派发字段名前缀（避免命名冲突）

### 问题

最初派发字段名直接用 `sourceKey`（如 `type`），会污染全局参数表——任何下游物料订阅 `:type` 都会被命中，即使它们想消费的是另一个物料派发的 `:type`。

### 现状（v1.1 起支持用户配置）

默认前缀 `DISPATCH_PREFIX = 'paramsTrigger_'`；用户可在 schema 的 `dispatchPrefix` 字段自定义：

```typescript
// schema.ts 中作为可配置字段暴露
dispatchPrefix: {
    type: 'string',
    title: '派发前缀',
    'x-component': 'Input',
    'x-decorator-props': {
        tooltip: '...',
    },
}

// index.tsx 中读取,空字符串回退到默认值
const dispatchPrefix = config?.dispatchPrefix || DISPATCH_PREFIX;
const fieldName = `${dispatchPrefix}${sourceKey}`;
// 默认: 'type' → 'paramsTrigger_type'
// 自定义: 'type' + 'pt_' → 'pt_type'
```

下游订阅时使用 `:${dispatchPrefix}${sourceKey}`，与上游派发的 `:type` 隔离。

### ⚠️ 重要：空字符串无法生效

JS 的 `||` 短路规则会让 falsy 值（`''` / `null` / `undefined`）全部回退到 `DISPATCH_PREFIX`：

```typescript
config?.dispatchPrefix || DISPATCH_PREFIX;
// undefined → 'paramsTrigger_'
// null      → 'paramsTrigger_'
// ''        → 'paramsTrigger_'  ⚠️ 空字符串也被拦截
// 'myProject_' → 'myProject_'
```

**本物料不存在"无前缀派发"模式**——用户即使手动清空输入框，派发字段名仍带默认前缀。这是有意的安全设计，防止派发字段名退化为全局 `type` / `category` 等污染其他物料的订阅。

### 副作用

-   派发字段名变长（默认 14 字符前缀）
-   下游接线时需要知道前缀
-   breaking change（v1.0 → v1.1）：已搭好的画布若用户自定义前缀需重新接线

### 缓解

文档 `packages/params-trigger/doc/readme.md` 中明确说明下游接线方式 + 默认前缀 + 空字符串行为。

---

## 4. matchedKeys 对比必须用带前缀的 fieldName

### 问题

`matchedKeys` Set 由 `dispatchData.map((d) => d.fieldName)` 构建，存的是**带前缀**的 fieldName（如 `paramsTrigger_type`）。但 `unmatchedKeys` 的判断中曾错误地用未加前缀的 `sourceKey`：

```typescript
// ❌ 错误(matchedKeys.has(sourceKey) 永远为 false)
if (!matchedKeys.has(sourceKey) && !unmatchedKeys.includes(sourceKey)) { ... }

// ✅ 正确(对比时也加前缀)
if (!matchedKeys.has(`${DISPATCH_PREFIX}${sourceKey}`) && !unmatchedKeys.includes(sourceKey)) { ... }
```

### 后果

错误版本会导致未命中判断失效，每个 sourceKey 都会重复触发 warn（即使实际已派发成功）。

### 教训

**任何与 `dispatchData` 中的 `fieldName` 比对的地方，都必须保持一致的前缀处理逻辑**。提取一个公共 helper 函数会更安全：

```typescript
const getDispatchFieldName = (sourceKey: string) => `${DISPATCH_PREFIX}${sourceKey}`;
```

---

## 5. `JSON.stringify` 派发签名去重的局限

### 问题

用 `JSON.stringify(dispatchData)` 做签名去重，对**对象顺序敏感**：

```typescript
[{ fieldName: 'a', state: 1 }][({ fieldName: 'b', state: 2 }, { fieldName: 'a', state: 1 })]; // signature: '[{"fieldName":"a","state":1}]' // signature 不同
```

当前 input/output 都是**字符串**，派发数据稳定，无问题。但若未来扩展为对象类型，需注意：

-   同一逻辑结果但不同字段顺序 → 签名抖动 → 重复派发
-   包含 `undefined` 字段 → `JSON.stringify` 会忽略，但 Object.keys 不会，可能不一致

### 缓解

-   保持 output 是字符串类型（**当前约定**）
-   如需支持对象，可改用 `useRef` 存结构化对比（`_.isEqual`），或用 useEffect 的精确 deps

---

## 6. 运行时点击穿透用 `useEffect` 而非 `<style>` 渲染

### 问题

最初运行时直接 return `<style dangerouslySetInnerHTML={...}>` 注入 CSS：

```typescript
// ❌ 不推荐
return (
    <style
        dangerouslySetInnerHTML={{
            __html: `[data-id="${props.uniqueId}"] { pointer-events: none; }`,
        }}
    />
);
```

**问题**：

-   每次 React re-render 都会创建新的 `<style>` 节点，DOM 中可能堆积多个 style 标签
-   `dangerouslySetInnerHTML` 是重武器，简单 CSS 注入不需要
-   React 18+ 对组件树中的 `<style>` 处理不一致，可能被丢弃或触发 hydration 警告

### 现状

改为 `useEffect` 注入到 `<head>`，带 `id` 去重 + 卸载清理：

```typescript
useEffect(() => {
    if (isDesigner) return;
    const uniqueId = props.uniqueId;
    if (!uniqueId) return;

    const styleId = `${COMPONENT_NAME}-pointer-events-${uniqueId}`;
    if (document.getElementById(styleId)) return; // 去重

    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = `...`;
    document.head.appendChild(styleEl);

    return () => {
        styleEl.remove();
    }; // 卸载清理
}, [props.uniqueId, isDesigner]);
```

### 关键点

-   **`CSS.escape(String(uniqueId))`**：uniqueId 可能含特殊字符（虽然实际场景大多是数字），用 `CSS.escape` 转义避免破坏 CSS 选择器
-   **依赖 `[props.uniqueId, isDesigner]`**：仅当 uniqueId 变化或模式切换时重新评估，不会因其他 props 变化重复注入
-   **设计器模式不注入**：设计器需要拖拽/选中，若注入 `pointer-events: none` 会破坏交互

---

## 7. subscribe 槽位框架约束（无法运行时动态注册）

### 问题

最初尝试用 `ArrayCollapse` 在 schema 中动态定义 subscribe 槽位，但 formily 框架的 `subscribe` 字段必须在 schema **构建时静态声明**，运行时无法新增。

### 现状

预声明 10 个语义化槽位（`SUBSCRIBE_KEYS`）：

| 槽位                              | 适用     |
| --------------------------------- | -------- |
| type / category / status          | 业务枚举 |
| mode / tag                        | 状态标识 |
| value / code / level / id / group | 通用命名 |

### 缓解

-   10 个常见命名已覆盖 90% 场景
-   若全局参数命名特殊（如 `:foo`），可接到任意一个槽位（如 `type`），dispatch 字段名是 `paramsTrigger_type`，下游按此订阅即可

---

## 8. `useMemorizedObject` 包装 mappingList

### 问题

父组件（如画布）re-render 时，`config.mappingList` 数组引用每次都是新的（即使内容相同），导致 useEffect #1 的 deps 变化触发不必要的执行。

### 现状

用 `useMemorizedObject` 深度记忆化：

```typescript
const mappingList = useMemorizedObject(config?.mappingList || []);
```

### 验证

-   在 React DevTools 中观察 props，`mappingList` 在用户未编辑时引用稳定
-   useEffect 仅在 `interactionProps` 变化或用户实际修改映射表时触发

---

## 9. `props.uniqueId` 可能为 undefined

### 问题

某些渲染上下文（如预览/快照）可能不传 `uniqueId`，导致 `pointer-events` 注入失败（直接 return）。

### 现状

```typescript
const uniqueId = props.uniqueId;
if (!uniqueId) return; // 静默跳过,不影响主逻辑
```

### 接受度

`pointer-events` 注入是锦上添花（解决点击穿透体验），缺失不会导致功能异常。静默跳过是合理的容错。

---

## 10. `dataModel.json` 占位文件的去留

### 问题

`oss-material.json` 中 `"dataModel": ""` 表示不启用数据源，但目录下保留了 `dataModel.json` 占位文件（dimensions/indicators 为空）。

### 现状

保留 `dataModel.json`，用于框架元信息描述（`title` / `description`）。

### 理由

-   框架扫描 `oss-material.json.dataModel` 来判断是否加载数据源逻辑，空字符串即跳过
-   保留 dataModel.json 不影响功能，反而方便后续若要扩展为"带数据的混合模式"时直接修改

### 验证

```bash
# 物料被加载时,dataSource 应为空数组
# useEffect 中 interaction?.dispatch 仍按预期工作
```

---

## 调试小技巧

### 1. 临时查看派发数据

```typescript
// 在 useEffect #1 末尾、interaction.dispatch 之前插入
console.log(`[${COMPONENT_NAME}] 派发数据:`, dispatchData);
```

### 2. 临时查看订阅值

```typescript
// useEffect #1 开头
console.log(`[${COMPONENT_NAME}] 当前 interactionProps:`, interactionProps);
```

### 3. 检查样式注入是否生效

```typescript
// useEffect #2 中,appendChild 后
console.log('[pointer-events 注入成功]', document.getElementById(styleId));
```

---

## 维护历史

| 日期       | 问题 / 变更                            | 原因 / 修复                                             |
| ---------- | -------------------------------------- | ------------------------------------------------------- |
| 2026-08-04 | items 用 `type: 'object'`              | 改为 `type: 'void'`，按布局节点规范统一                 |
| 2026-08-04 | DISPATCH_PREFIX 在 schema.ts           | 抽到 `constants.ts`，避免 tree-shaking 失效             |
| 2026-08-04 | 派发字段名无前缀                       | 加 `paramsTrigger_` 前缀，避免命名冲突                  |
| 2026-08-04 | matchedKeys 对比未加前缀               | 修复：对比时同步加 `${dispatchPrefix}`                  |
| 2026-08-04 | `<style dangerouslySetInnerHTML>` 渲染 | 改为 useEffect 注入到 head，避免 style 堆积             |
| 2026-08-04 | 设计器无视觉占位                       | 加虚线框 + 标签，仅设计器可见                           |
| 2026-08-04 | 派发前缀写死为常量                     | 改为 schema 可配置 `dispatchPrefix`，空字符串回退到默认 |

---

## 相关文档

-   常见修改任务 → [common-tasks.md](./common-tasks.md)
-   组件逻辑详解 → [🟨 component-logic.md](./component-logic.md)
-   配置面板 → [🟦 schema.md](./schema.md)
