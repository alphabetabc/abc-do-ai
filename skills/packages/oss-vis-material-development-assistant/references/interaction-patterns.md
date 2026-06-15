---
title: 交互开发模式
description: 物料交互（下钻/派发）开发模式，包含核心概念、类型常量、5 种模式（基础派发/下钻/动态事件/字段映射/compositionAction）、优先级、选型速查
version: 1.0.0
last_updated: 2026-06-12
---

# 交互开发模式

> 本文档从 `SKILL.md` 抽出，集中说明物料交互（下钻 / 派发）的实现模式。
> SKILL.md 仅作为入口，详细规范在此查阅。

## 1. 核心概念

物料组件通过 `props.interaction` 对象实现与其他组件的通信：

| 字段 | 用途 |
|------|------|
| `interaction.defined` | 用户在配置面板中定义的交互配置 |
| `interaction.dispatch` | 派发数据的方法，触发下钻或传递参数 |

**判空**：`interaction?.dispatch` 必须判空（交互未启用时为 undefined）。

## 2. 交互类型常量

**文件位置**：`src/common/constants/interactions.ts`

```typescript
import { INTERACTION_TYPES } from '@Common/constants';

// 常用常量
INTERACTION_TYPES.INTERACTION_TYPE_MODAL;    // 'Modal'     - 下钻打开弹窗
INTERACTION_TYPES.INTERACTION_TYPE_DRAWER;   // 'Drawer'    - 下钻打开抽屉
INTERACTION_TYPES.INTERACTION_TYPE_CELL;     // 'Dispatch'  - 单元格派发
INTERACTION_TYPES.INTERACTION_TYPE_ROW;      // 'RowDispatch' - 行派发
```

## 3. 五种交互模式

### 3.1 基础派发

最简单的派发逻辑，将数据派发给指定字段。

```typescript
const handleClick = (data) => {
    if (!interaction?.dispatch) return;

    interaction.dispatch({
        data: [
            {
                fieldName: 'myField', // 目标字段名
                state: data,          // 派发的数据
            },
        ],
    });
};
```

### 3.2 下钻（Modal / Drawer）

打开弹窗或抽屉展示详细数据。

```typescript
const handleDrilldown = (record) => {
    if (!interaction?.dispatch) return;

    const drilldownEvent = interaction?.defined?.configurableEvent?.drilldownEvent;

    if (drilldownEvent?.show && (drilldownEvent.effect === 'Modal' || drilldownEvent.effect === 'Drawer')) {
        interaction.dispatch({
            data: [
                {
                    fieldName: 'drilldownEvent',
                    state: {
                        visible: true, // 控制弹窗显示
                        ...record,     // 传递数据
                    },
                },
            ],
        });
    }
};
```

### 3.3 动态事件（按 clickKey 匹配）

支持多事件配置，根据 `clickKey` 匹配不同事件。

```typescript
const handleDynamicClick = (record, clickKey) => {
    if (!interaction?.dispatch) return;

    const dynamicEvents = interaction?.defined?.dynamicEvents || [];
    const matchedEvent = dynamicEvents.find((item) => item.clickKey === clickKey);
    if (!matchedEvent) return;

    if (matchedEvent.effect === 'Modal' || matchedEvent.effect === 'Drawer') {
        // 下钻
        interaction.dispatch({
            data: [
                {
                    fieldName: `${designer.prefix.dynamicEventPrefix}${matchedEvent.clickKey}`,
                    state: { visible: true, ...record, clickKey: matchedEvent.clickKey },
                },
            ],
        });
    } else if (matchedEvent.effect === 'Dispatch') {
        // 派发参数
        interaction.dispatch({
            data: [
                {
                    fieldName: `${designer.prefix.dynamicEventPrefix}${matchedEvent.clickKey}`,
                    state: { ...record, clickKey: matchedEvent.clickKey },
                },
            ],
        });
    }
};
```

### 3.4 字段映射派发

根据配置的字段映射关系进行派发。

```typescript
const handleMappingDispatch = (record) => {
    if (!interaction?.dispatch) return;

    const rowClickFieldMapping = interaction?.defined?.rowClickFieldMapping || [];

    const dispatchData = rowClickFieldMapping
        .map((item) => {
            if (item.columnKey && item.columnKey in record && item.action) {
                return {
                    fieldName: item.action,
                    state: record[item.columnKey],
                };
            }
            return null;
        })
        .filter(Boolean);

    if (dispatchData.length > 0) {
        interaction.dispatch({ data: dispatchData });
    }
};
```

### 3.5 compositionAction 动态事件

适用于容器组件（如 `common-container`），支持 `title` / `extra` 等区域的点击事件。

**Schema 配置**：

```typescript
compositionAction: {
    type: 'object',
    properties: {
        dynamicActions: {
            type: 'void',
            'x-component': 'DefineActionArray',
            'x-component-props': {
                effectOptions: [
                    { label: '派发参数', value: 'dispatchParams' },
                    { label: '弹出Modal', value: share.interactions.ENUM_DRILL_DOWN.MODAL },
                ],
                itemSetting: {
                    headerKey: {
                        type: 'string',
                        title: '标题字段',
                        'x-decorator': 'FormItem',
                        'x-decorator-props': { tooltip: '取值为title，extra' },
                        'x-component': 'Input',
                    },
                    dataFieldName: {
                        type: 'string',
                        title: '数据字段',
                        'x-reactions': {
                            dependencies: ['.effect'],
                            fulfill: {
                                run: `$self.visible = $deps[0] !== "${share.interactions.ENUM_DRILL_DOWN.MODAL}"`,
                            },
                        },
                        'x-decorator': 'FormItem',
                        'x-component': 'Input',
                    },
                    // ... 其他配置
                },
            },
        },
    },
},
```

**组件实现**：

```typescript
const processDynamicActions = (headerKey: string, matchedItem: any) => {
    const cellDispatchData: any[] = [];

    if (_.isEmpty(interaction?.defined?.compositionAction?.dynamicActions)) {
        return cellDispatchData;
    }

    interaction.defined.compositionAction.dynamicActions.forEach((config: any) => {
        // 1. 按 headerKey 过滤
        if (config.headerKey !== headerKey) return;

        // 2. 按 activeRowKeyField 过滤
        const activeRowKeyField = (config.activeRowKeyField ?? '').split(',').filter((d: any) => !_.isNil(d) && d !== '');
        if (!_.isEmpty(activeRowKeyField) && matchedItem && !activeRowKeyField.includes(matchedItem['rowKey'])) return;

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

// 使用
const handleClick = (headerKey: 'title' | 'extra') => {
    const dispatchData = processDynamicActions(headerKey, matchedItem);
    if (!_.isEmpty(dispatchData)) {
        interaction.dispatch({ data: dispatchData });
    }
};
```

## 4. 交互优先级

当组件同时支持多种交互方式时，按以下优先级处理：

```
1. compositionAction.dynamicActions  （动态事件，优先级最高）
2. configurableEvent.drilldownEvent  （下钻配置）
3. dynamicEvents                     （动态事件数组）
4. 传统派发配置                       （兼容性处理）
```

**完整示例**：

```typescript
const handleClick = (record) => {
    // 1. 优先处理 compositionAction
    const dynamicDispatchData = processDynamicActions(headerKey, record);
    if (!_.isEmpty(dynamicDispatchData)) {
        interaction.dispatch({ data: dynamicDispatchData });
        return;
    }

    // 2. 处理下钻事件
    const drilldownEvent = interaction?.defined?.configurableEvent?.drilldownEvent;
    if (drilldownEvent?.show) {
        // ... 下钻逻辑
        return;
    }

    // 3. 处理传统派发
    // ... 传统逻辑
};
```

## 5. 选型速查

| 场景 | 推荐模式 |
|------|----------|
| 简单派发单个字段 | § 3.1 基础派发 |
| 点击单元格/行打开弹窗/抽屉 | § 3.2 下钻 |
| 一行多事件（不同列不同效果） | § 3.3 动态事件 |
| 用户配置"哪列点击后派发到哪字段" | § 3.4 字段映射 |
| 容器组件 title/extra 区域可点击 | § 3.5 compositionAction |
| 多种交互并存 | § 4 优先级组合 |
