---
title: params-trigger - 组件逻辑维护
description: 参数触发器物料的组件代码（index.tsx + constants.ts + index.less）的维护要点
version: 1.0.0
last_updated: 2026-08-04
---

# 🟨 组件逻辑维护

> 本文档描述 `packages/params-trigger/index.tsx` 中的组件实现逻辑。

## 组件概览

```typescript
const ParamsTrigger: React.FC<DesignerField> = (props) => {
    // 1. 解构 props + 记忆化 mappingList
    // 2. 计算 dispatchPrefix(config 可配置,空字符串回退到 DISPATCH_PREFIX)
    // 3. 判断 isDesigner(设计器/运行时)
    // 4. useEffect #1: 订阅值变化 → 匹配映射 → 派发
    // 5. useEffect #2: 运行时注入 pointer-events: none
    // 6. 条件渲染: 设计器显示占位 / 运行时返回 null
};
```

## Props 结构

```typescript
interface Props {
    config: {
        mappingList: Array<{
            sourceKey: string;   // 订阅键名
            input: string;       // 输入值
            output: string;      // 输出值
        }>;
        dispatchPrefix?: string;  // 派发字段名前缀(用户可配置,空字符串回退到默认)
        // ...继承自 BASE_LAYOUT + getCompTitle
    };
    interaction?: {
        dispatch: (params: { data: Array<{ fieldName: string; state: any }> }) => void;
        defined?: Record<string, any>;
    };
    interactionProps?: Record<string, any>;  // 来自 subscribe 的当前值
    designer?: { mode: 'development' | string };  // 设计器模式标识
    uniqueId?: string | number;  // 框架生成的实例唯一标识（用于 pointer-events 注入）
}
```

## 核心逻辑

### 1. 配置解构 + 记忆化

```typescript
const { config, interaction, interactionProps } = props;
const mappingList = useMemorizedObject(config?.mappingList || []);
// 派发前缀:用户可在 schema 配置;空字符串时回退到默认 DISPATCH_PREFIX
const dispatchPrefix = config?.dispatchPrefix || DISPATCH_PREFIX;
const isDesigner = useDevelopmentMode(props);
```

**关键点**：
- `useMemorizedObject` 对 `mappingList` 做深度记忆化，避免父组件 re-render 时的引用变化触发不必要的 useEffect
- `dispatchPrefix` 支持用户自定义；空字符串时回退到 `DISPATCH_PREFIX = 'paramsTrigger_'`
- `useDevelopmentMode` 返回 `designer?.mode === 'development'`，用于区分设计器/运行时

### 2. useEffect #1：订阅监听 + 映射匹配 + 派发

```typescript
useEffect(() => {
    if (!interaction?.dispatch || !interactionProps) return;
    if (!Array.isArray(mappingList) || mappingList.length === 0) return;

    // 1. 遍历 mappingList,对每个 sourceKey 找首个命中项
    const dispatchData = [];
    const unmatchedKeys = [];

    _.forEach(mappingList, ({ sourceKey, input, output }) => {
        if (!sourceKey) return;
        const subscribedValue = interactionProps[sourceKey];
        if (subscribedValue === undefined || subscribedValue === null) return;

        if (String(subscribedValue) === String(input)) {
            // 派发字段名带前缀,避免命名冲突
            const fieldName = `${DISPATCH_PREFIX}${sourceKey}`;
            if (!dispatchData.some((d) => d.fieldName === fieldName)) {
                dispatchData.push({ fieldName, state: output });
            }
        }
    });

    // 2. 计算未命中的 sourceKey(已接线但所有 mapping 都未匹配)
    const matchedKeys = new Set(dispatchData.map((d) => d.fieldName));
    _.forEach(mappingList, ({ sourceKey }) => {
        if (!sourceKey) return;
        const subscribedValue = interactionProps[sourceKey];
        if (subscribedValue === undefined || subscribedValue === null) return;
        // matchedKeys 存的是带前缀的 fieldName,对比时也要加前缀
        if (!matchedKeys.has(`${DISPATCH_PREFIX}${sourceKey}`) && !unmatchedKeys.includes(sourceKey)) {
            unmatchedKeys.push(sourceKey);
        }
    });

    // 3. 缓存签名,避免相同结果重复派发
    const signature = JSON.stringify(dispatchData);
    if (signature === lastDispatchedRef.current) return;
    lastDispatchedRef.current = signature;

    // 4. 未命中 console.warn
    unmatchedKeys.forEach((key) => {
        console.warn(`[${COMPONENT_NAME}] 未找到匹配的映射规则, sourceKey="${key}", value="${interactionProps[key]}"`);
    });

    // 5. 派发
    if (dispatchData.length > 0) {
        interaction.dispatch({ data: dispatchData });
    }
}, [interactionProps, mappingList, interaction]);
```

#### 2.1 派发字段名格式

```
派发字段名 = `${dispatchPrefix}${sourceKey}`
           = `(用户配置前缀 或 'paramsTrigger_')${sourceKey}`

示例:
  默认: sourceKey='type'    → fieldName='paramsTrigger_type'
  自定义: sourceKey='type', dispatchPrefix='pt_'  → fieldName='pt_type'
```

下游物料订阅时使用 **`:${dispatchPrefix}${sourceKey}`**（冒号前缀引用语法，详见 `packages/params-trigger/doc/readme.md`）。

#### 2.2 匹配规则

| 规则 | 说明 |
|------|------|
| **类型宽松比较** | `String(subscribedValue) === String(input)`，数字 `1` 与字符串 `'1'` 视为相等 |
| **首条命中** | 同 sourceKey 多条 mapping，仅首条命中生效 |
| **未接线跳过** | `interactionProps[sourceKey] === undefined \|\| null` 不参与匹配 |
| **空 mappingList 跳过** | 整个 useEffect 直接 return |

#### 2.3 派发去重

`lastDispatchedRef` 用 `useRef` 缓存 `JSON.stringify(dispatchData)`，相同结果不重复派发。React re-render 触发的 useEffect 会被签名比对拦截。

> ⚠️ 注意 `JSON.stringify` 对对象顺序敏感，若 `output` 是对象（含 undefined 字段），签名可能抖动。**当前 input/output 都是字符串，无此问题**。

### 3. useEffect #2：运行时点击穿透样式注入

```typescript
useEffect(() => {
    if (isDesigner) return; // 设计器模式不注入(占位需要可选中/拖拽)
    const uniqueId = props.uniqueId;
    if (!uniqueId) return;

    const styleId = `${COMPONENT_NAME}-pointer-events-${uniqueId}`;
    if (document.getElementById(styleId)) return; // 已存在则跳过

    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = `
        [data-id="${CSS.escape(String(uniqueId))}"] {
            pointer-events: none;
        }
        [data-id="${CSS.escape(String(uniqueId))}"] .item-field-container {
            pointer-events: none;
        }
    `;
    document.head.appendChild(styleEl);

    return () => {
        styleEl.remove();
    };
}, [props.uniqueId, isDesigner]);
```

**关键点**：
- **注入时机**：仅运行时（`isDesigner === false`）注入，设计器不注入（保留拖拽/选中能力）
- **去重**：通过 `styleId` 检查 DOM 中是否已存在，避免重复注入
- **CSS.escape**：用 `CSS.escape(String(uniqueId))` 转义 uniqueId 中的特殊字符，防止破坏 CSS 选择器
- **清理**：组件卸载时 `styleEl.remove()` 移除注入的 style，避免内存泄漏

### 4. 渲染（条件分支）

```typescript
// 设计器模式:显示占位标签(便于拖拽/选中/编辑)
if (isDesigner) {
    return (
        <section className={`${COMPONENT_NAME}-root`}>
            <span className={`${COMPONENT_NAME}-label`}>{COMPONENT_NAME}</span>
        </section>
    );
}

// 运行时:不渲染 DOM(返回 null,样式由 useEffect 注入到 <head>)
return null;
```

| 模式 | DOM 输出 | 视觉效果 |
|------|----------|----------|
| 设计器 (designer.mode === 'development') | `<section className="params-trigger-root">...label...</section>` | 虚线边框 + `params-trigger` 标签 |
| 运行时 | `null`（无 DOM） | 不可见 |

## 常量模块 `constants.ts`

> ⚠️ **必须独立成文件**：`constants.ts` 不能合并到 `schema.ts`，否则 `index.tsx` import 时会把 formily schema 全部拉进 runtime bundle，导致 tree-shaking 失效。详见 [gotchas.md § 2](./gotchas.md)。

```typescript
export const SUBSCRIBE_KEYS = [
    { key: 'type', title: '类型' },
    { key: 'category', title: '分类' },
    // ... 共 10 项
];

export const DISPATCH_PREFIX = 'paramsTrigger_';
export const COMPONENT_NAME = 'params-trigger';
```

**职责**：
- `SUBSCRIBE_KEYS` → schema.ts 用它生成 subscribe 槽位 + sourceKey Select 的 enum
- `DISPATCH_PREFIX` → index.tsx 用它构造派发字段名
- `COMPONENT_NAME` → index.tsx 用它做 console.warn 前缀、className 拼接

## 样式 `index.less`

```less
.params-trigger-root {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    user-select: none;

    .params-trigger-label {
        color: rgba(255, 255, 255, 0.45);
        font-size: 12px;
        font-family: monospace;
    }
}
```

**关键点**：
- 仅设计器占位使用，运行时返回 null 不渲染
- 嵌套 class 用 BEM 命名（`${COMPONENT_NAME}-root` / `${COMPONENT_NAME}-label`）

## 性能要点

| 场景 | 注意事项 |
|------|----------|
| `mappingList` 引用变化 | `useMemorizedObject` 包装，深度记忆化 |
| 派发去重 | `useRef` + `JSON.stringify` 签名比对 |
| useEffect deps | `[interactionProps, mappingList, interaction]`，三者任一变化触发 |
| 样式注入 | 通过 `id` 去重避免重复 appendChild |

## 调试小技巧

### 临时调试派发数据

```typescript
// 在 useEffect 末尾 dispatch 之后临时插入
console.log(`[${COMPONENT_NAME}] 派发数据:`, JSON.stringify(dispatchData));
```

### 临时调试订阅值

```typescript
// useEffect 开头插入
console.log(`[${COMPONENT_NAME}] 当前订阅值:`, interactionProps);
```

## 相关文档

- 配置项定义 → [🟦 schema.md](./schema.md)
- 数据默认值 → [🟩 data-model.md](./data-model.md)