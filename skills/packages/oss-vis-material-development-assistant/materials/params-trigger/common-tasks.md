---
title: params-trigger - 常见修改任务
description: 参数触发器物料的常见修改场景和操作指南
version: 1.0.0
last_updated: 2026-08-04
---

# 常见修改任务

> 本文档提供 params-trigger 物料的常见修改场景和操作指南。

## 任务索引

| 任务                                            | 涉及文件                 | 难度   |
| ----------------------------------------------- | ------------------------ | ------ |
| [新增订阅槽位](#任务-1新增订阅槽位)             | constants.ts             | ⭐     |
| [调整映射项默认值](#任务-2调整映射项默认值)     | constants.ts + schema.ts | ⭐     |
| [修改派发字段名前缀](#任务-3修改派发字段名前缀) | constants.ts             | ⭐     |
| [修改派发未命中行为](#任务-4修改派发未命中行为) | index.tsx                | ⭐⭐   |
| [修改匹配比较规则](#任务-5修改匹配比较规则)     | index.tsx                | ⭐⭐   |
| [调整设计器占位样式](#任务-6调整设计器占位样式) | index.less               | ⭐     |
| [运行时改为有 DOM](#任务-7运行时改为有-dom)     | index.tsx + index.less   | ⭐⭐⭐ |

---

## 任务 1：新增订阅槽位

### 场景

需要订阅未在 10 个预声明槽位中的全局参数（如 `:priority`）。

### 步骤

1. **打开** `packages/params-trigger/constants.ts`

2. **在 `SUBSCRIBE_KEYS` 数组中添加**：

```typescript
export const SUBSCRIBE_KEYS: Array<{ key: string; title: string }> = [
    // ... 已有 10 项
    { key: 'priority', title: '优先级' }, // 新增
];
```

> ⚠️ **单一真相源**：只需修改这一处，`schema.ts` 中的 subscribe 槽位 + sourceKey Select 的 enum 会自动同步派生。

### 验证

-   物料的"交互 → 订阅管理"中应出现 `优先级(priority)` 槽位
-   "配置 → 映射规则 → 订阅键"下拉中应出现 `优先级(priority)` 选项

### 注意

-   真实运行时框架仅支持**静态声明**的 subscribe 槽位，新增槽位生效需要编辑器版本支持
-   若全局参数命名超出常规（如 `:priority`），可接到任意已有槽位上，下游订阅对应 `paramsTrigger_${槽位名}`（详见 [component-logic.md § 2.1](./component-logic.md)）

---

## 任务 2：调整映射项默认值

### 场景

用户点击"添加映射"按钮时，希望默认值是 `priority` 而不是 `type`。

### 步骤

**方式 A：修改默认项的 sourceKey**

打开 `packages/params-trigger/schema.ts`，找到 `addition` 的 `defaultValue`：

```typescript
defaultValue: {
    sourceKey: SUBSCRIBE_KEYS[0].key,  // 当前是 'type'
    input: '',
    output: '',
},
```

直接改成具体值：

```typescript
defaultValue: {
    sourceKey: 'priority',  // 改成指定默认值
    input: '',
    output: '',
},
```

**方式 B：让默认值跟随最新添加的槽位**

```typescript
defaultValue: {
    sourceKey: SUBSCRIBE_KEYS[SUBSCRIBE_KEYS.length - 1].key,  // 数组最后一项
    input: '',
    output: '',
},
```

---

## 任务 3：自定义派发字段名前缀

### 步骤（推荐：每个实例独立配置）

1. 选中物料实例，打开"配置 → 映射规则 → 派发前缀"输入框
2. 输入自定义前缀（如 `pt_`、`myProject_`）
3. 下游物料订阅时使用 `:${你配置的前缀}${sourceKey}`

### ⚠️ 重要约束：空字符串无法生效

```typescript
// index.tsx 中的回退逻辑
const dispatchPrefix = config?.dispatchPrefix || DISPATCH_PREFIX;
// undefined / null / '' 都回退到 'paramsTrigger_'
```

-   用户即使手动清空输入框，派发字段名仍带默认前缀
-   本物料**不存在"无前缀派发"模式**，是有意的安全设计
-   如需更换默认前缀，需修改 `packages/params-trigger/constants.ts` 中的 `DISPATCH_PREFIX` 常量（不推荐，会影响所有新建物料）

### 注意

-   前缀建议保持足够独特，避免与其他物料冲突
-   修改后记得同步更新 `packages/params-trigger/doc/readme.md`

---

## 任务 4：修改派发未命中行为

### 场景

当前未命中会 `console.warn`，但生产环境希望直接静默（不污染控制台）。

### 步骤

1. **打开** `packages/params-trigger/index.tsx`

2. **找到 useEffect #1 中的 warn 块**（约第 67-70 行）：

```typescript
// 未命中时 console.warn(便于排查映射缺失)
unmatchedKeys.forEach((key) => {
    console.warn(`[${COMPONENT_NAME}] 未找到匹配的映射规则, sourceKey="${key}", value="${interactionProps[key]}"`);
});
```

3. **按需调整**：

```typescript
// 方案 A: 完全静默
// 直接删除整个 forEach 块

// 方案 B: 仅在开发环境 warn
import.meta.env.DEV &&
    unmatchedKeys.forEach((key) => {
        console.warn(`[${COMPONENT_NAME}] 未找到匹配的映射规则, sourceKey="${key}", value="${interactionProps[key]}"`);
    });

// 方案 C: 改为抛错(更激进,适合强校验场景)
if (unmatchedKeys.length > 0) {
    throw new Error(`[${COMPONENT_NAME}] 未匹配的映射: ${unmatchedKeys.join(', ')}`);
}
```

---

## 任务 5：修改匹配比较规则

### 场景

当前用 `String(value) === String(input)` 做宽松比较，希望区分大小写或严格类型比较。

### 步骤

1. **打开** `packages/params-trigger/index.tsx`

2. **找到匹配逻辑**（约第 36 行）：

```typescript
if (String(subscribedValue) === String(input)) {
    // ...派发
}
```

3. **按需替换**：

```typescript
// 严格相等(不宽松类型)
if (subscribedValue === input) { ... }

// 宽松类型 + 忽略大小写
if (String(subscribedValue).toLowerCase() === String(input).toLowerCase()) { ... }

// 正则匹配(input 配置为正则字符串)
try {
    if (new RegExp(input).test(String(subscribedValue))) { ... }
} catch (e) {
    console.warn(`[${COMPONENT_NAME}] 无效正则: ${input}`);
}
```

---

## 任务 6：调整设计器占位样式

### 场景

觉得虚线边框太显眼，希望改成纯文字占位。

### 步骤

打开 `packages/params-trigger/index.less`：

```less
.params-trigger-root {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    /* border: 1px dashed rgba(255, 255, 255, 0.2); */ /* 注释或删除边框 */
    background: rgba(255, 255, 255, 0.05); /* 改成浅色背景 */
    user-select: none;
}

.params-trigger-label {
    color: rgba(255, 255, 255, 0.45);
    font-size: 12px;
    font-family: monospace;
}
```

---

## 任务 7：运行时改为有 DOM

### 场景

希望在运行时也显示一些视觉元素（如当前映射命中状态、调试信息等），而不只是空白。

### 步骤

1. **打开** `packages/params-trigger/index.tsx`

2. **修改运行时分支**（约第 113 行）：

```typescript
// 原代码: return null;

// 改为:
if (!isDesigner) {
    return (
        <section className={`${COMPONENT_NAME}-runtime`}>
            {mappingList.length > 0 ? <span>已配置 {mappingList.length} 条映射</span> : <span>请在配置面板添加映射</span>}
        </section>
    );
}
```

3. **同步修改** `packages/params-trigger/index.less`：

```less
.params-trigger-runtime {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.4);
    font-size: 12px;
}
```

4. **删除或保留 useEffect #2**：若运行时仍有 DOM 展示，pointer-events 注入可以删除（不再需要穿透）；若仍需穿透（如调试信息框不该拦截下层点击），保留。

### 注意

-   运行时若有 DOM，会占据画布布局空间
-   若想"既显示又穿透"，保留 useEffect #2 的 pointer-events 注入

---

## 相关文档

-   配置项定义 → [🟦 schema.md](./schema.md)
-   组件逻辑 → [🟨 component-logic.md](./component-logic.md)
-   注意事项 → [gotchas.md](./gotchas.md)
