# 01 — 数据模型：类型 + state 形状 + 派生索引

> 配套 [00-README.md](./00-README.md) | 关注点：**数据是什么**
>
> 本文合并原 `01-types.md` + `02-state.md`。FlatField / WidgetItem 只定义一次。

---

## 0. 源码类型 vs 概念类型

本仓库大量字段在源码中是 `any`，但运行时有稳定结构。本文统一用下表区分：

| 标注 | 含义 |
| --- | --- |
| **源码类型** | 源码中实际写的 TS 类型（可能是 `any`） |
| **概念类型** | 运行时实际结构，基于源码使用方式推断 |

> 修改源码类型时以**源码类型**为准；写消费代码时按**概念类型**理解字段结构。

---

## 1. 组件树节点类型

### 1.1 WidgetConfig（组件配置）

**源码位置**：`src/designer/renderer/GeneratorWidget.tsx` `WidgetConfig` L9-17

```ts
type WidgetConfig = {
    width?: number;
    height?: number;
    background?: string;
    left?: number;
    top?: number;
    isHidden?: boolean;
    [key: string]: any;
};
```

> 源码只有 6 个显式字段 + index signature。轮播字段（`slider` / `autoplaySpeed` / `fade` / `speed` / `easing`）存在于 `utils.ts` `generatorGroup` configs（L457-471）和 `group-field/index.jsx`，**不导出为 TS 类型**，通过 index signature 访问。

### 1.2 WidgetData（组件数据）

**源码位置**：`src/designer/renderer/GeneratorWidget.tsx` `WidgetData` L19-22

```ts
type WidgetData = {
    config: WidgetConfig;
    [key: string]: any;
};
```

### 1.3 WidgetItem（组件树节点）

**源码位置**：`src/designer/renderer/GeneratorWidget.tsx` `WidgetItem` L24-29

```ts
type WidgetItem = {
    uniqueId: string;
    type: string;
    data: WidgetData;
    children?: WidgetItem[];
};
```

> ⚠️ **不含 `parentUniqueId`**。该字段由 `flatDesignerList`（`utils.ts` L529-547）运行时注入到扁平数组节点上，不在 `WidgetItem` 类型中。

### 1.4 组件类型枚举

**源码位置**：`src/designer/constants.ts` `FIELD_COMP_TYPES` L139-153

```ts
export enum FIELD_COMP_TYPES {
    FIELD = 'field',          // 普通字段
    GROUP = 'group',          // 普通组
    LAYOUT_BLOCK = 'layout-block',  // 布局块
}
```

> 源码用枚举而非字符串 union。`type: string` 字段实际值为这三个枚举成员之一。

### 1.5 DataSource（渲染层数据源）

**源码位置**：`src/designer/renderer/designer-field/types.ts` `DataSource` L3-21

```ts
export type DataSource = {
    uniqueId: string;
    type: string;
    data: {
        config: {
            width?: number;
            height?: number;
            background?: string;
            left?: number;
            top?: number;
            isHidden?: boolean;
            isLock?: boolean;
            transform?: { rotate?: number | null; scale?: string | null };
            [key: string]: any;
        };
        [key: string]: any;
    };
    children?: any[];
};
```

> `DataSource` 与 `WidgetItem` 字段结构不同：`DataSource.data.config` 有更多显式字段（`isLock` / `transform`），`children` 类型是 `any[]`。`DesignerField` 组件 props 用 `DataSource`。

### 1.6 PageConfig（页面配置）

**源码事实**：源码中 `page` 字段类型是 `any`（见 §2.1）。没有独立导出的 `PageConfig` interface。

**概念结构**（基于 `designer-canvas.ts` `initialState.page` L43-58 + `configuration-panel/page/schema.ts`）：

```ts
// 概念类型（源码未导出，实际是 any）
interface PageConfig {
    pageSize: string;              // '1920 x 1080' | 'custom' | ...
    zoom: string;                  // 'scaleX' | 'scaleY' | 'cover' | 'none'
    backgroundMode: string;        // 'define' | 'custom' | 'video' | 'none'
    backgroundColor: string;
    backgroundImage: string;
    backgroundDefine: string;
    backgroundBlur: number;
    backgroundOpacity: number;
    width: number;
    height: number;
    customPageSize: { width: number; height: number };  // 自定义尺寸
    // schema.ts 中还有：grid / backgroundVideoUrl / thumbnail 等
}
```

**源码位置**：
- `designer-canvas.ts` `initialState.page` L43-58（运行时默认值）
- `configuration-panel/page/schema.ts` L1（表单 schema，导出 `schema` 对象非类型）

### 1.7 SchemaConfig（大屏 schema）

**源码事实**：源码无独立 TS interface。`designer-parser/index.jsx` L15 运行时解构：

```jsx
const { page, components } = schemaConfig || {};
```

**概念结构**（基于 `DesignerContent.tsx` `handleSave` L357-363 + `designer-parser/index.jsx`）：

```ts
// 概念类型（源码未导出 interface）
interface SchemaConfig {
    page: PageConfig;
    components: WidgetItem[];
    realtimeDataFlow?: Array<{ uniqueId: string; sourceId: string }>;
    customFieldsListMapping?: Record<string, string>;
    meta?: Record<string, any>;
}
```

> `customFieldsListMapping` 保存时序列化为 `{}`（见 [03-read-path.md](./03-read-path.md) §保存序列化）。

---

## 2. DesignerCanvasState（slice state 形状）

### 2.1 源码类型定义

**源码位置**：`src/store/modules/designer-canvas.ts` `DesignerCanvasState` L19-36

```ts
export interface DesignerCanvasState {
    appScopeId: string | null;                       // 应用/场景 scope id
    components: any[];                                // 组件树（唯一真相源）
    byId: Record<string, FlatField>;                  // 派生索引：id → FlatField
    parentMap: Record<string, string>;                // 派生索引：id → parentId
    page: any;                                        // 页面级配置（概念类型见 §1.6）
    realtimeDataFlow: any[];                          // 实时数据流
    customFieldsListMapping: Record<string, string>;  // 自定义字段映射
    meta: Record<string, any>;                        // 杂项元数据
}
```

> ⚠️ 源码中 `components` / `page` / `realtimeDataFlow` 都是 `any` / `any[]`，无泛型约束。概念类型见 §1。

### 2.2 initialState

**源码位置**：`src/store/modules/designer-canvas.ts` `initialState` L38-62

| 字段 | 初始值 | 说明 |
| --- | --- | --- |
| `appScopeId` | `null` | |
| `components` | `[]` | |
| `byId` | `{}` | |
| `parentMap` | `{}` | |
| `page` | 见下 | 含 `customPageSize: { width: 0, height: 0 }` |
| `realtimeDataFlow` | `[]` | |
| `customFieldsListMapping` | `{}` | |
| `meta` | `{}` | |

`initialState.page`（L43-58）：

```ts
{
    pageSize: '1920 x 1080',
    zoom: 'scaleX',
    backgroundMode: 'define',
    backgroundColor: 'rgba(0,17,52,1)',
    backgroundImage: '',
    backgroundDefine: 'background-2.png',
    backgroundBlur: 0,
    backgroundOpacity: 100,
    width: 1920,
    height: 1080,
    customPageSize: { width: 0, height: 0 },
}
```

> `customPageSize` 在旧文档中未提及，源码 L54-57 确实存在。

### 2.3 持久化

**当前**：`whitelist = []`，**不持久化任何 slice**（仅保留 `PersistGate` 占位）。`designerCanvas` 不进入 redux-persist 白名单，编辑器状态不跨会话持久化。

---

## 3. 派生索引：FlatField / buildIndex / ROOT_UNIQUE_ID

### 3.1 FlatField（扁平化索引条目）

**源码位置**：`src/designer/renderer/utils.ts` `FlatField` L642-647

```ts
export interface FlatField {
    uniqueId: string;
    type: string;
    parentId: string;                          // ROOT_UNIQUE_ID 表示根
    data: { config: any; [key: string]: any }; // 不含 children
}
```

> `data` 是 `node.data` 的**浅引用**（`buildIndex` 内 `data: node.data`，L686）。禁止在 reducer 之外修改 `byId[id].data`。

### 3.2 ROOT_UNIQUE_ID

**源码位置**：`src/designer/renderer/utils.ts` L22

```ts
export const ROOT_UNIQUE_ID = '-';
```

根节点的 `uniqueId` 用 `'-'` 表示。`parentMap[id] === '-'` 表示该节点是顶层组件。

### 3.3 buildIndex（构建派生索引）

**源码位置**：`src/designer/renderer/utils.ts` `buildIndex` L664-697

**签名**：

```ts
export function buildIndex(
    components: any[],
    oldById?: Record<string, FlatField>,
): { byId: Record<string, FlatField>; parentMap: Record<string, string> };
```

**关键逻辑**：

1. **只遍历 `node.children`**（L689-691），**不遍历 `node.data.config.drillDown`**。drillDown 是配置数据（轮播层级），非渲染树，level 由 `setLevelPath` 单独维护。
2. **引用复用**（L678-687）：`oldEntry.data === node.data` 时复用旧 `byId` 条目，保持 `useFieldConf` shallowEqual 订阅粒度。未修改节点经 Immer 结构共享返回原引用，引用比较成立。
3. **`oldById` 必须从 produce 外捕获**（`state.byId`），不能传 `draft.byId`（Immer proxy 会破坏 `===`）。
4. **循环引用**：不做检测，依赖 Immer 保证无环。

> ⚠️ `buildIndex` 在 `setComponents` / `setState` / `updateFieldConfig` reducer 内部、**produce 外**调用。produce 内 `draft.components` 是 Immer proxy，`oldEntry.data === node.data` 永远 false（引用复用失效）。

---

## 4. 单源契约

### 4.1 核心命题

`components` 是**唯一真相源**，`byId` / `parentMap` 是**纯派生索引（只读）**。

### 4.2 不变式

任何时候（dispatch 同步完成后）：

```
state.byId       = buildIndex(state.components).byId
state.parentMap  = buildIndex(state.components).parentMap
```

### 4.3 维护方

**仅以下 3 个 reducer** 维护派生索引（都在 produce **外**调用 `buildIndex`）：

| reducer | action type | 改 components | 重建 byId/parentMap |
| --- | --- | --- | --- |
| `setComponents` | `designerCanvas/setComponents` | 直接赋值 | ✅ |
| `setState` | `designerCanvas/setState` | 直接赋值（payload 含 components 时） | ✅（仅含 components 时） |
| `updateFieldConfig` | `designerCanvas/updateFieldConfig` | Immer produce 改树 | ✅ |

详见 [02-write-path.md](./02-write-path.md)。

### 4.4 禁止

- ❌ 绕过 `buildIndex` 直接赋值 `byId` / `parentMap`（`setState` reducer 会 console.error + 删除，见 [02-write-path.md](./02-write-path.md) §异常输入边界）
- ❌ 在 reducer 之外调用 `buildIndex` 修改 `byId` / `parentMap`
- ✅ 所有 `byId` / `parentMap` 更新都通过 reducer 改 `components` 树 + `buildIndex` 重建

详见 [04-principles.md](./04-principles.md)。

---

## 5. 相关文档

- [00-README.md](./00-README.md) —— 索引页
- [02-write-path.md](./02-write-path.md) —— 写路径（如何改 state）
- [03-read-path.md](./03-read-path.md) —— 读路径（如何读 state）
- [04-principles.md](./04-principles.md) —— 架构原则与禁区
- [05-deleted-api.md](./05-deleted-api.md) —— 已删除 API 速查
