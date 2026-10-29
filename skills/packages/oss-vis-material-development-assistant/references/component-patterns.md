---
title: 组件代码模式
description: 物料组件实现模式，包含 Designer 真实 props 契约、class 命名、工具/hooks、数据读取、渲染层级、性能、调试
version: 2.0.0
last_updated: 2026-10-29
---

# 组件代码模式

> 本文档所有内容以 **Designer 注入点**（`src/designer/renderer/components/item-field/index.tsx`）
> 与 **类型声明**（`packages/types/DesignerField.d.ts`、`@fedx-vis/designer-types`）为准。

## 1. Designer 如何把 props 注入物料

```typescript
// src/designer/renderer/components/item-field/index.tsx
const mergedProps = {
    ...fullProps,          // 物料默认值 + 用户配置（value/config/dataConfig/interactions/animation）
    ...(fullProps.value || {}),  // ← value 被摊平到 props 顶层
    ...fetchResult,        // ← { dataSource: any[], extraResponse: any }
};

<Field
    {..._.omit(mergedProps, ['interactions','drillDownLevel','children','options','value','onChange'])}
    receivedPropsParams={receivedPropsParams}
    designer={envShare.designer}
    interaction={interactionApi}
    interactionProps={interactionProps}
    onBeforeRender={onBeforeRender}
/>
```

由此得到 4 条关键结论：

1. **`props.config`** = 用户配置对象（`value.config`），含 `title/width/height/left/top/isLock/isHidden` + 自定义项。
2. **`props.dataSource`** = 接口返回数组（`fetchResult.dataSource`），**可能为空数组**。
3. **`props.interactions`** 被 `_.omit` 掉了 —— 交互配置要从 `props.interaction.defined` 读，**不是** `props.interactions`。
4. **`props.extraResponse`** = 接口附加响应（分页 total 等）。

## 2. 真实 props 契约

```typescript
import type { DesignerField } from '@fedx-vis/designer-types';

interface DesignerField {
    className: string;
    readonly uniqueId: string;

    readonly designer: {
        readonly env: any;                    // useEnvironmentModel.data.environment
        readonly constants: any;              // @Common/constants
        readonly mode: string;                // 'preview' | 'development'
        readonly container: HTMLElement;       // 弹窗挂载容器
        readonly prefix: { dynamicEventPrefix: string };  // 'DynamicEvent-'
        readonly permissions: {
            zoneName: any; zoneLevel: any; zoneId: any;
            parentZoneId: any; userId: any; currentLoginInfo: any;
        };
        readonly systemInfo: any;
        readonly cache: IFieldCache;           // 静态上下文缓存
        readonly fieldName: { DRILL_DOWN: string };  // 'drilldownEvent'
        readonly utils: {
            logger: any;
            getDesignerOriginData: (data) => any;    // 取未被裁剪的原始数据
            eachRequestParams: (params, callback) => void;  // 自动注入时间戳
            remoteModuleFetcher: (opts) => Promise<any>;
            parseSubscribeValue: (value) => { subscribeKey: string|null; isSubscribeKey: boolean };
        };
        readonly api: {
            customDataSourceApi: (type:'api'|'dataset', params) => Promise<any>;
            request: (...args) => Promise<any>;
            buildCustomApiParams: (params, paramsMapping, callback?) => { params; hasInvalidateParams };
        };
    };

    customDataSourceApiConfig: any;   // 自定义数据源配置
    receivedPropsParams: any;         // 设计器级查询参数

    readonly interaction: {
        dispatch: (args: { type?: string; data: Array<{ fieldName: string; state: any }> }) => void;
        dispatchRealtimeDataFlow: (list: []) => void;
        subscribe: any;        // 当前组件订阅到的状态数组
        defined: Record<string, any>;  // getter → value.interactions
        action: any;           // getter → Map<fieldName, action>
    };

    readonly interactionProps: any;    // 订阅值对象 { [订阅字段名]: 值 }
    readonly config: Record<string, any>;
    readonly dataSource: any;          // 数组，但类型声明是 any
}
```

> ⚠️ **旧文档的 props 契约不完整**：缺 `interaction.subscribe` / `interaction.action` / `interactionProps` / `designer.utils` / `designer.api` / `extraResponse`。

## 3. `interaction` 三个字段的真实语义

| 字段 | 实现 | 语义 |
|---|---|---|
| `defined` | `get defined() { return ownerProps.value.interactions; }` | **getter**，读的是交互面板配置 `{configurableEvent, dynamicEvents, compositionAction, ...subscribe}` |
| `subscribe` | `useSelector` 过滤 `subscribeKeys` | 数组，`[{uniqueId, fieldName, state}]` |
| `action` | `get action() { return currentActionGetter.current; }` | `Map<fieldName, action>`，本组件**已派发**出去的数据 |

**因为 `defined` 是 getter，不要在闭包里缓存它**；需要快照时显式取值：

```typescript
const defined = interaction?.defined;   // 此刻取值
```

## 4. 基础模板

```typescript
import type { DesignerField } from '@fedx-vis/designer-types';
import React from 'react';
import { _ } from 'oss-web-toolkits';
import './index.less';

const MyComponent: React.FC<DesignerField> = (props) => {
    const { config, dataSource, designer } = props;

    const getContainerStyle = (): React.CSSProperties => {
        const style: React.CSSProperties = {
            width: config?.width,
            height: config?.height,
        };

        const bgType = config?.containerStyle?.bgType;
        if (bgType === 'image' && config?.containerStyle?.bgImage) {
            style.backgroundImage = `url(${config.containerStyle.bgImage})`;
        } else if (config?.containerStyle?.bgColor) {
            style.backgroundColor = config.containerStyle.bgColor;
        }

        return style;
    };

    const first = dataSource?.[0];

    return (
        <div className="my-material-root" style={getContainerStyle()}>
            <div className="my-material-content">{first?.label ?? ''}</div>
        </div>
    );
};

export default MyComponent;
```

## 5. Class 命名规范

基于 `oss-material.json.name`（kebab-case）：

```typescript
const COMPONENT_NAME = 'common-container';

// 根
`${COMPONENT_NAME}-root`       // common-container-root
`${COMPONENT_NAME}-header`     // common-container-header
`${COMPONENT_NAME}-title`      // common-container-title
`${COMPONENT_NAME}-extra`      // common-container-extra
`${COMPONENT_NAME}-content`    // common-container-content
```

**根 class 可省略 `-root`**（存量物料确有此写法）：

```typescript
// src/packages/free-layout-indicators-viewer/index.tsx
<section className="free-layout-indicators-viewer" ...>
```

> 子节点 class 并不强制带前缀（如 `ind-item`、`item-label`、`digital-card-wrapper` 均为存量写法）。
> 规范要求：**根 class 必须能由 `oss-material.json.name` 推导**，便于样式隔离与排查。

## 6. 常用工具

| 工具 | 导入路径 | 用途 |
|---|---|---|
| `getImageUrl` | `@Utils` / `@Src/utils` | 通用图片地址解析 |
| `getMaterialImageUrl` | `@Src/utils/getImageUrl` | 物料静态资源解析 |
| `useLatest` | `@Src/hooks/useLatest` | 闭包内取最新值 |
| `_` | `oss-web-toolkits` | lodash 工具集（**必须用 `_.get` 兜底**） |
| `DigitalNumber` | `@Components/digital-number` | 数字翻牌器 |
| `renderModalSet` / `renderDrawerSet` / `renderDynamicEvents` | `@Common/schema`（`events.ts`） | 交互 schema 片段 |

### 6.1 `getMaterialImageUrl` 签名

```typescript
export const getMaterialImageUrl = (name: any, ownerProps: any, localDir: string) => { ... };
```

| `name` 类型 | 行为 |
|---|---|
| `string` | 走 `enableVisualMaterial` → 物料仓本地目录（`localDir` 生效） |
| `{ url, isMaterial }` | 走通用分支（`isMaterial` 决定是否指向物料仓服务） |

```typescript
// 典型用法
const bg = getMaterialImageUrl(config?.background, props, 'static/images/free-layout-indicators-viewer');
const icon = getMaterialImageUrl('no-app.png', { designer: props.designer }, 'static/images');
```

## 7. hooks 注意事项

### 7.1 `useMemo` 依赖必须完整

```typescript
const points = useMemo(() => {
    return config.layout.points.map((point) => {
        const dataItem = dataSource.find((item) => item.indicatorId === point.id);
        return { ...point, ...dataItem };
    });
}, [config.indicatorItemSetting, config.layout.points, dataSource]);
```

### 7.2 闭包陷阱 → `useLatest`

```typescript
import { useLatest } from '@Src/hooks/useLatest';

const latestProps = useLatest(props);

useMemo(() => {
    return getMaterialImageUrl(name, latestProps.current, dir);
}, [name, latestProps]);
```

> `useLatest` 实现极简（`ref.current = value`），每次渲染同步最新值，**不触发重渲染**。

### 7.3 `interaction.defined` 不要放进 `useMemo` 依赖

`defined` 是 getter，`useMemo` 依赖数组里放它等于每次都取新值，失去缓存意义：

```typescript
// ✅ 在 memo 外取值
const defined = interaction?.defined;
const events = useMemo(() => defined?.dynamicEvents ?? [], [defined?.dynamicEvents]);
```

## 8. 数据读取规范

```typescript
// ✅ 推荐：_.get 兜底
const value = _.get(props, 'dataItem.indicatorValue', '');
const fontSize = _.get(props, 'indicatorValueSetting.fontSetting.fontStyle.fontSize', 16);
const first = _.get(props, 'dataSource[0]', {});

// ❌ 禁止：直接点链访问
const value = props.dataItem.indicatorValue;  // dataItem 不存在时崩溃
```

**`dataSource` 永远可能为空数组**，读取第 N 条必须兜底：

```typescript
const row = dataSource?.[0] ?? {};
```

## 9. 渲染层级最佳实践

```
组件根（position: relative）
├── 背景层（position: absolute, z-index: 0）
├── 内容层（position: relative, z-index: 1）
└── 事件层（position: absolute, z-index: 999）
```

**事件层置顶**确保点击事件能正确触发（避免被内容层遮挡）。

## 10. 性能要点

| 场景 | 建议 |
|---|---|
| 列表项 < 20 | 无需优化 |
| 20-50 | `useMemo` 缓存列表 |
| 50-200 | 虚拟滚动 / canvas 渲染 |
| ≥ 200 | 重构，避免 React 全量渲染 |

补充：

- ECharts 类物料用 `shouldSetOption` 之类的浅比较，避免每次 `setOption` 全量重建。
- 定时器类（时钟）注意 `setInterval` 清理。
- styled-components 用 transient props（`$` 前缀）避免透传到 DOM。

## 11. 调试技巧

```typescript
// 临时查看最终 props
console.log('[component]', { config, dataSource, designer, interaction });

// 临时高亮边界
style={{ ..., outline: '1px solid red' }}

// 临时禁用某个功能
$enableGradient={false}
```

**调试交互时的正确姿势**：

```typescript
console.log('[interaction]', {
    defined: interaction?.defined,   // 交互面板配置
    subscribe: interaction?.subscribe, // 订阅到的数据
    action: interaction?.action,       // 已派发数据
});
```

## 12. 常见陷阱

| 陷阱 | 后果 | 正确做法 |
|---|---|---|
| 从 `props.interactions` 读交互配置 | 恒为 `undefined` | 读 `props.interaction.defined` |
| `interaction.defined` 当普通对象缓存 | 值不更新 | 它是 getter，按需取值 |
| 直接访问 `props.dataSource[0].x` | 空数据崩溃 | `_.get(props,'dataSource[0].x','')` |
| 组件内调用 `props.designer.api.request` | 绕过数据源统一管理 | 优先用 `props.dataSource` |
| `useMemo` 依赖漏项 | 拿到旧值 | 依赖写全，或用 `useLatest` |
| 派发时 `fieldName` 为空/非字符串 | 被 Designer 静默丢弃 | `dispatch` 前校验 `fieldName` |
| `dispatch` 传单个对象而非数组 | 不生效 | 必须 `data: [{fieldName, state}]` |
| 根 class 与 `oss-material.json.name` 不一致 | 样式难维护 | 严格对齐 |
