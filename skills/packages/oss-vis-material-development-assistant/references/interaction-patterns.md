---
title: 交互开发模式
description: 物料交互（下钻/派发）开发模式，含 Designer 交互内核、类型常量、5 种模式、优先级、选型速查
version: 2.0.0
last_updated: 2026-10-29
---

# 交互开发模式

> 本文档以 **Designer 交互内核**（`src/plugins/interaction/`）
> 与 **共享常量**（`packages/share/src/interactions/`）为准。

## 1. 交互内核（Designer 侧）

### 1.1 `interaction` 对象如何生成

`src/plugins/interaction/component/hooks.ts` → `useCreateInteractionApi`：

```typescript
const interaction: InteractionType = Object.freeze({
    dispatch: (args) => {
        dispatchAction(dispatch, { uniqueId: ownerProps.uniqueId, actionArgs: args, callback: ... });
    },
    subscribe: subscribeState,
    get action() { return currentActionGetter.current; },
    get defined() { return definedInteractionGetter.current; },   // = ownerProps.value.interactions
    dispatchRealtimeDataFlow: (list) => { dispatch(RealtimeDataFlow.dispatch(ownerProps.uniqueId, list)); },
});
```

### 1.2 `dispatch` 的实际过滤规则

```typescript
const dispatchAction = (currentDispatch, { uniqueId, actionArgs, callback }) => {
    let actionList = _.isArray(actionArgs.data) ? actionArgs.data : [actionArgs.data];
    actionList = actionList.filter((d) => !_.isNil(d.fieldName) && _.isString(d.fieldName));
    if (_.isEmpty(actionList)) return;
    ...
    currentDispatch({
        type: ACTION_INTERACTION,   // 'component/interactions'
        ...actionArgs,
        data: { uniqueId, actions: actionList.map(formatAction) },
    });
};
```

**规则**：

| 规则 | 说明 |
|---|---|
| `data` 可以是单个对象或数组 | 内部统一转数组 |
| `fieldName` 为空或非字符串 | **被静默丢弃** |
| `actionList` 为空 | 直接 return，不派发 |

### 1.3 订阅（subscribe）如何解析

Designer 在 `useInteractionsPreprocessor` 中扫描配置里的 `:fieldName` 形式：

```
配置值 ":上游字段名"  →  匹配 state.component.interactions 中的 {fieldName:'上游字段名'}
                      →  订阅字段加入 watchedFields
                      →  值写入 requestParams / customDataSourceApiParams
```

组件侧读取订阅值走 `useSubscribeObject`：

```typescript
// 排除 configurableEvent / dynamicEvents 两个特殊键
// 其余键的值形如 ":xxx"，匹配到后 result[key] = subscribeItem.state
```

**结果注入到 `props.interactionProps`**，形如 `{ [订阅键名]: 值 }`。

> 所以：**订阅字段名（subscribe 里的 key）就是 `interactionProps` 的 key**。
> 参考 `src/packages/decoration/common-container/index.tsx`：
> ```typescript
> const subscribe = interaction?.subscribe || {};
> const subscribedTitle = subscribe?.titleSubscribeKey || '';
> ```

## 2. 共享常量

### 2.1 Designer 侧（`packages/share/src/interactions/`）

| 常量 | 值 | 说明 |
|---|---|---|
| `FIELD_NAME_DRILL_DOWN` | `'drilldownEvent'` | 下钻字段名（推荐） |
| `DEPRECATED_FIELD_NAME_DRILL_DOWN` | `'clickEvent'` | **已废弃**，历史数据 |
| `ENUM_DRILL_DOWN.MODAL` | `'Modal'` | 下钻弹窗 |
| `ENUM_DRILL_DOWN.DRAWER` | `'Drawer'` | 下钻抽屉 |
| `DYNAMIC_EVENT_PREFIX` | `'DynamicEvent-'` | 动态事件字段名前缀 |
| `CONFIGURABLE_EVENT` | `'configurableEvent'` | 下钻配置在 interactions 下的键 |
| `DYNAMIC_EVENTS` | `'dynamicEvents'` | 动态事件数组在 interactions 下的键 |
| `COMPOSITION_ACTION` | `'compositionAction'` | 容器组合动作 |
| `COMPOSITION_SUBSCRIBE` | `'compositionSubscribe'` | 容器组合订阅 |
| `ACTION_INTERACTION` | `'component/interactions'` | redux action type |

### 2.2 物料仓侧（`src/common/constants/interactions.ts`）

```typescript
export const INTERACTION_TYPE_CELL = 'Dispatch';
export const INTERACTION_TYPE_ROW = 'RowDispatch';
export const INTERACTION_TYPE_MODAL = share.interactions.ENUM_DRILL_DOWN.MODAL;   // 'Modal'
export const INTERACTION_TYPE_DRAWER = share.interactions.ENUM_DRILL_DOWN.DRAWER; // 'Drawer'
export const INTERACTION_TYPE_CheckBoxCELL = 'CheckBoxDispatch';
```

`src/common/constants/index.ts` 中以命名空间导出：

```typescript
export * as INTERACTION_TYPES from './interactions';
```

### 2.3 ⚠️ 正确导入写法（**旧文档有误**）

```typescript
// ✅ 正确：命名空间 + 不带 S 的常量名
import { INTERACTION_TYPES } from '@Common/constants';
INTERACTION_TYPES.INTERACTION_TYPE_CELL;    // 'Dispatch'
INTERACTION_TYPES.INTERACTION_TYPE_ROW;     // 'RowDispatch'
INTERACTION_TYPES.INTERACTION_TYPE_MODAL;   // 'Modal'
INTERACTION_TYPES.INTERACTION_TYPE_DRAWER;  // 'Drawer'

// ❌ 错误：旧文档写的 INTERACTION_TYPES.INTERACTION_TYPES_MODAL 不存在
```

## 3. 五种交互模式

### 3.1 基础派发

```typescript
const handleClick = (data: any) => {
    if (!interaction?.dispatch) return;

    interaction.dispatch({
        data: [
            {
                fieldName: 'myField',   // 目标字段名（必须非空字符串）
                state: data,             // 派发的数据
            },
        ],
    });
};
```

### 3.2 下钻（Modal / Drawer）

下钻走 `configurableEvent.drilldownEvent`。Designer 的 `DrillDownItem` 组件负责渲染弹窗，
**组件只负责「点亮」状态**：

```typescript
const handleDrilldown = (record: any) => {
    if (!interaction?.dispatch) return;

    const drilldownEvent = interaction?.defined?.configurableEvent?.drilldownEvent;

    if (
        drilldownEvent?.show &&
        (drilldownEvent.effect === INTERACTION_TYPES.INTERACTION_TYPE_MODAL ||
         drilldownEvent.effect === INTERACTION_TYPES.INTERACTION_TYPE_DRAWER)
    ) {
        interaction.dispatch({
            data: [
                {
                    fieldName: interaction?.designer?.fieldName?.DRILL_DOWN ?? 'drilldownEvent',
                    state: {
                        visible: true,
                        ...record,
                    },
                },
            ],
        });
    }
};
```

> 💡 推荐用 `props.designer.fieldName.DRILL_DOWN`（Designer 注入，值为 `'drilldownEvent'`），
> 而不是硬编码字符串 —— 兼容旧版字段切换。

**下钻字段名**：`interaction.defined.configurableEvent.drilldownEvent`。
`DrillDownItem` 侧读取 `drilldownItemFields`（逗号分隔的字段名）拼 query 参数。

### 3.3 动态事件（按 clickKey 匹配）

配置在 `interactions.dynamicEvents` 数组，每项含 `clickKey` 与 `effect`。

```typescript
const dynamicEvents = interaction?.defined?.dynamicEvents || [];
const matched = dynamicEvents.find((item: any) => item.clickKey === clickKey);
if (!matched) return;

const fieldName = `${props.designer.prefix.dynamicEventPrefix}${matched.clickKey}`;
// → 'DynamicEvent-{clickKey}'

if (
    matched.effect === INTERACTION_TYPES.INTERACTION_TYPE_MODAL ||
    matched.effect === INTERACTION_TYPES.INTERACTION_TYPE_DRAWER
) {
    interaction.dispatch({
        data: [{ fieldName, state: { visible: true, ...record, clickKey: matched.clickKey } }],
    });
} else if (matched.effect === INTERACTION_TYPES.INTERACTION_TYPE_CELL) {
    interaction.dispatch({
        data: [{ fieldName, state: { ...record, clickKey: matched.clickKey } }],
    });
}
```

> ⚠️ 动态事件**没有 clickKey** 的那一项代表「行级事件」，见 §3.4。

### 3.4 行级事件 + 字段映射派发

`dynamicEvents` 中 `clickKey` 为空的那一项是行事件，effect 为 `RowDispatch`：

```typescript
const dynamicEvents = interaction?.defined?.dynamicEvents || [];
const rowDynamicEvents = dynamicEvents.filter((d: any) => !d.clickKey);

if (_.get(rowDynamicEvents, '[0].effect') === INTERACTION_TYPES.INTERACTION_TYPE_ROW) {
    // rowClickFieldMapping 只在 schema 中声明，仅存在于组件侧
    const rowClickFieldMapping = _.get(rowDynamicEvents, '[0].rowClickFieldMapping');

    const data = rowClickFieldMapping
        .map((item: any) => {
            if (item?.columnKey && item.columnKey in record && item.action) {
                return { fieldName: item.action, state: record[item.columnKey] };
            }
            return false;
        })
        .filter(Boolean);

    if (!_.isEmpty(data)) {
        interaction.dispatch({ data });
    }
}
```

参考：`src/packages/table-detail/TableDetailImp.tsx`、`src/packages/pagination-table/index.tsx`。

### 3.5 compositionAction 动态事件（容器组件）

配置在 `interactions.compositionAction.dynamicActions`，由 `DefineActionArray` widget 渲染。
每项含：`actionField`（事件标识）、`effect`、`headerKey`（`title`/`extra`）、`dataFieldName`、`activeRowKeyField`。

```typescript
const processDynamicActions = (headerKey: string, matchedItem: any) => {
    const cellDispatchData: any[] = [];

    const dynamicActions = interaction?.defined?.compositionAction?.dynamicActions || [];
    if (_.isEmpty(dynamicActions)) return cellDispatchData;

    dynamicActions.forEach((config: any) => {
        // 1. 按 headerKey 过滤
        if (config.headerKey !== headerKey) return;

        // 2. 按 activeRowKeyField 过滤（逗号分隔）
        const activeRowKeyField = (config.activeRowKeyField ?? '')
            .split(',')
            .filter((d: any) => !_.isNil(d) && d !== '');
        if (
            !_.isEmpty(activeRowKeyField) &&
            matchedItem &&
            !activeRowKeyField.includes(matchedItem.rowKey)
        ) {
            return;
        }

        // 3. 按 effect 处理
        if (config.effect === 'dispatchParams') {
            cellDispatchData.push({
                fieldName: config.actionField,
                state: matchedItem ? matchedItem[config.dataFieldName] : null,
            });
        } else if (config.effect === 'Modal') {
            cellDispatchData.push({
                fieldName: config.actionField,
                state: { visible: true, ...(matchedItem || {}) },
            });
        }
    });

    return cellDispatchData;
};

const handleClick = (headerKey: 'title' | 'extra', matchedItem: any) => {
    const dispatchData = processDynamicActions(headerKey, matchedItem);
    if (!_.isEmpty(dispatchData)) {
        interaction.dispatch({ data: dispatchData });
    }
};
```

参考：`src/packages/decoration/common-container/schema.ts`（schema）+ `src/packages/table/index.jsx`、`src/packages/table-fixedColumns/index.tsx`（实现）。

> ⚠️ `DefineActionArray` 的 `effect` 选项由 `effectOptions` 决定，
> `common-container` 用的是 `'dispatchParams'` / `'Modal'`（**不是** `INTERACTION_TYPE_CELL` 的 `'Dispatch'`）。

## 4. 交互优先级

当组件同时支持多种交互方式时，按以下优先级处理：

```
1. compositionAction.dynamicActions  （容器动态事件，优先级最高）
2. configurableEvent.drilldownEvent  （下钻配置）
3. dynamicEvents                     （动态事件数组）
4. 行级 RowDispatch / 字段映射        （兼容性处理）
```

**完整示例**：

```typescript
const handleClick = (record: any) => {
    // 1. 容器动态事件
    const dynamicDispatchData = processDynamicActions(headerKey, record);
    if (!_.isEmpty(dynamicDispatchData)) {
        interaction.dispatch({ data: dynamicDispatchData });
        return;
    }

    // 2. 下钻
    const drilldownEvent = interaction?.defined?.configurableEvent?.drilldownEvent;
    if (drilldownEvent?.show) {
        if (
            drilldownEvent.effect === INTERACTION_TYPES.INTERACTION_TYPE_MODAL ||
            drilldownEvent.effect === INTERACTION_TYPES.INTERACTION_TYPE_DRAWER
        ) {
            interaction.dispatch({
                data: [{
                    fieldName: props.designer.fieldName.DRILL_DOWN,
                    state: { visible: true, ...record },
                }],
            });
            return;
        }
    }

    // 3. 单元格动态事件
    const dynamicEvents = interaction?.defined?.dynamicEvents || [];
    const matched = dynamicEvents.find((item: any) => item.clickKey === columnSetting.dataIndex);
    if (matched) {
        interaction.dispatch({
            data: [{
                fieldName: `${props.designer.prefix.dynamicEventPrefix}${matched.clickKey}`,
                state: { ...record, clickKey: matched.clickKey },
            }],
        });
        return;
    }

    // 4. 行级字段映射
    // ...
};
```

## 5. 订阅（Subscribe）模式

### 5.1 Schema 侧

```typescript
defineInteractionSchema({
    subscribe: {
        titleSubscribeKey: {
            type: 'string',
            title: '标题订阅字段',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            'x-component-props': { tooltip: '接收外部派发的标题值，优先级高于配置的标题' },
        },
    },
});
```

用户在下拉里选一个上游组件的字段，Designer 存成 `':上游字段名'`。

### 5.2 组件侧读取

```typescript
// 方式 A：读 interaction.subscribe（原始数组）
const subscribe = interaction?.subscribe || [];
const first = subscribe[0];

// 方式 B：读 interactionProps（键值对象，更常用）
const { titleSubscribeKey } = props.interactionProps ?? {};
```

> `interactionProps` 由 Designer 的 `useSubscribeObject` 生成，键就是 schema 里声明的订阅字段名。

### 5.3 订阅到请求参数

若订阅字段用于接口参数，只需在 `dataConfig.api.params` 里写 `':字段名'`，
Designer 的 `useInteractionsPreprocessor` 会自动把它替换成实际值。

```typescript
// api.params
{ policyId: ':policyId' }
```

## 6. 选型速查

| 场景 | 推荐模式 |
|---|---|
| 简单派发单个字段 | §3.1 基础派发 |
| 点击单元格/行打开弹窗/抽屉 | §3.2 下钻 |
| 一行多事件（不同列不同效果） | §3.3 动态事件 |
| 用户配置「哪列点击后派发到哪字段」 | §3.4 行级 + 字段映射 |
| 容器组件 title/extra 区域可点击 | §3.5 compositionAction |
| 接收上游组件的值 | §5 订阅 |
| 多种交互并存 | §4 优先级组合 |

## 7. 常见陷阱

| 陷阱 | 后果 | 正确做法 |
|---|---|---|
| 用 `INTERACTION_TYPES.INTERACTION_TYPES_MODAL` | 编译报错 | `INTERACTION_TYPES.INTERACTION_TYPE_MODAL` |
| 从 `props.interactions` 读配置 | 恒 `undefined` | `props.interaction.defined` |
| 硬编码 `'drilldownEvent'` | 不兼容旧版字段切换 | `props.designer.fieldName.DRILL_DOWN` |
| 硬编码 `'DynamicEvent-'` 前缀 | 前缀变更即失效 | `props.designer.prefix.dynamicEventPrefix` |
| `dispatch` 传 `data: {fieldName, state}` 单对象 | 能工作（内部转数组）但易漏字段 | 统一传数组 |
| `fieldName` 传空串 | 被静默丢弃，无任何提示 | 派发前校验 |
| `defined` 放进 `useMemo` 依赖 | 缓存失效 | 按 `defined?.xxx` 粒度取值 |
| `rowClickFieldMapping` 未判空直接 `.map` | 配置为空时崩溃 | `_.get(rowDynamicEvents,'[0].rowClickFieldMapping',[])` |
| 用 `Effect` 值 `'Dispatch'` 而非 `'dispatchParams'` | compositionAction 不触发 | 按 `DefineActionArray` 的 `effectOptions` 值 |
