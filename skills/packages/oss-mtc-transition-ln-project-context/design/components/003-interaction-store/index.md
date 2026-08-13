# 003 · InteractionStore 大屏交互状态管理

> 性质：组件设计文档（概述）
> 日期：2026-08-13
> 维护规则：本文件不入 `docs/`、不入 Git

---

## 1. 用途

大屏可视化场景下的**跨组件交互状态共享**。

基于 zustand v5，提供轻量的 `runtime` 状态池 + `dispatch` 写入 + `useSubscribe` 订阅，解决大屏中「组件 A 的操作需要触发组件 B 刷新」的联动需求。

### 1.1 适用场景

- **地图下钻联动**（全局）：用户点击地图地市 → cantCode / cantType 更新 → 所有模块重新请求 API
- **跨组件状态传递**：组件 A 点击后，组件 B 需要读取该状态做出响应（如右栏卡片点击 → 中栏图表高亮某系列）
- 4 个大屏页面各自独立的交互态（不跨大屏共享）

### 1.2 不适用

- **模块内局部状态**（如指标下钻的展开/折叠、返回按钮）→ 用组件 `useState`
- **跨大屏/跨路由状态传递** → 用 URL query 参数（如 `?cantCode=210100`）
- **持久化状态**（如用户登录态）→ 用现有 `useUserStore`
- **异步数据缓存**（如 API 响应）→ 用 React Query / SWR，不进 store

### 1.3 设计决策

| 决策            | 选择                                                  | 理由                                                                          |
| --------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------- |
| immer 中间件    | ❌ 不用                                               | runtime 是扁平 key-value，展开运算符足够；与项目现有 store 风格一致           |
| 浅比较          | `useShallow`（`zustand/react/shallow`）               | zustand v5 原生支持，替代手写 isEqual，避免 selector 内副作用                 |
| FieldDescriptor | `{ value: string; name: string; [key: string]: any }` | 保留 name + value 双字段，支持任意扩展属性（label / type / default 等）       |
| defineFields    | ✅ 保留                                               | 集中定义字段集，返回 `getField(nameOrValue)` 快速查找；调用方一次定义多处复用 |
| Store 实例      | 每个大屏页面各创建一个                                | 不跨大屏共享；页面卸载时自动 GC                                               |

---

## 2. 核心 API

### 2.1 类型定义

```typescript
/**
 * 字段描述符：标识 runtime 中的一个交互字段
 * - name: 字段名（语义标识，如 "cantCode"）
 * - value: runtime 存储键（如 "cant_code"）
 * - 支持任意扩展属性（label / type / default 等）
 */
interface FieldDescriptor {
    name: string;
    value: string;
    [key: string]: any;
}

/**
 * 大屏交互运行时状态
 * runtime: 扁平 key-value 池
 * dispatch: 写入某个 field 的值
 * setState: 批量更新（用于一次写入多个 field）
 */
interface InteractionState {
    runtime: Record<string, any>;
    dispatch: (field: FieldDescriptor, payload: any) => void;
    setState: (partial: Record<string, any>) => void;
}
```

### 2.2 defineFields()

集中定义一个大屏的字段集，返回 `getField(nameOrValue)` 快速查找。

```typescript
const widgetFields = defineFields([
    { name: "cantCode", value: "cant_code", label: "行政区划代码" },
    { name: "cantType", value: "cant_type", label: "行政区划类型" },
    { name: "activeCardKey", value: "active_card_key", label: "当前选中卡片" },
]);

// 通过 name 或 value 查找
widgetFields.getField("cantCode"); // 按 name 查
widgetFields.getField("cant_code"); // 按 value 查
// → { name: "cantCode", value: "cant_code", label: "行政区划代码" }
```

**设计要点**：

- `name` 和 `value` 都可作为查找键，`getField` 返回完整 FieldDescriptor
- 扩展属性（如 `label`）可在运行时读取，用于 UI 展示
- 类型层面：`defineFields` 推导出字段联合类型，`getField` 返回精确类型（非 `any`）

### 2.3 createInteractionStore()

每个大屏页面调用一次，创建独立的 store 实例：

```typescript
const { useInteractionStore, useSubscribe, useDispatch } = createInteractionStore();
```

| 返回项                 | 用途                                                      |
| ---------------------- | --------------------------------------------------------- |
| `useInteractionStore`  | 底层 zustand hook（偶尔直接用，如读取 `getState()`）      |
| `useSubscribe(fields)` | 订阅若干 field，返回 `{ [key]: value }`，浅比较防多余渲染 |
| `useDispatch()`        | 获取 dispatch 函数，用于写入状态                          |

### 2.4 useSubscribe

```typescript
const { useSubscribe } = createInteractionStore();

// 直接传 FieldDescriptor 对象
const { cantCode, cantType } = useSubscribe({
    cantCode: { name: "cantCode", value: "cant_code" },
    cantType: { name: "cantType", value: "cant_type" },
});

// 或配合 defineFields 使用（推荐）
const { cantCode, cantType } = useSubscribe({
    cantCode: widgetFields.getField("cantCode"),
    cantType: widgetFields.getField("cantType"),
});
// cantCode / cantType 变化时才重渲染
```

**实现要点**：

- 使用 `useShallow`（`zustand/react/shallow`）做浅比较，**不在 selector 内写 ref**
- `subscribeFields` 对象在每次渲染都是新引用，但 `useShallow` 只比较返回值，不比较 selector 函数本身
- 返回值类型为 `{ [K in keyof T]: any }`

### 2.5 useDispatch

```typescript
const { useDispatch } = createInteractionStore();

const dispatch = useDispatch();

// 写入单个 field（配合 defineFields）
dispatch(widgetFields.getField("cantCode"), "210100");
dispatch(widgetFields.getField("cantType"), "6");

// 批量写入（通过 setState）
const { useInteractionStore } = createInteractionStore();
useInteractionStore.getState().setState({
    cant_code: "210100",
    cant_type: "6",
});
```

---

## 3. 文件位置

| 类型       | 路径                                                              |
| ---------- | ----------------------------------------------------------------- |
| Store 工厂 | `frontend/src/components/large-screen/interaction-store/index.ts` |
| 类型定义   | 同上文件内导出                                                    |
| 使用方     | 各大屏页面入口（如 `pages/bigdata/Personnel/index.tsx`）          |

> 遵循项目约定：kebab-case 目录名，store 工厂为纯 TS 文件（无 JSX）。

---

## 4. 使用示例

### 4.1 页面初始化 + 地图下钻联动

```typescript
// pages/bigdata/Personnel/index.tsx
import { ScalerContainer } from '@/components/large-screen/scaler-container';
import { EChartsMap } from '@/components/large-screen/ec-map';
import { createInteractionStore, defineFields } from '@/components/large-screen/interaction-store';

// 1. 集中定义字段
const widgetFields = defineFields([
    { name: "cantCode", value: "cant_code", label: "行政区划代码" },
    { name: "cantType", value: "cant_type", label: "行政区划类型" },
    { name: "activeCardKey", value: "active_card_key", label: "当前选中卡片" },
]);

// 2. 每个大屏页面创建独立 store 实例
const { useSubscribe, useDispatch } = createInteractionStore();

function PersonnelScreen() {
    return (
        <ScalerContainer designWidth={1920} designHeight={1080}>
            <PersonnelMap />
            <PersonnelAgeChart />
            <PersonnelRegionChart />
        </ScalerContainer>
    );
}

function PersonnelMap() {
    const dispatch = useDispatch();

    return (
        <EChartsMap
            adcode="210000"
            onClick={(info) => {
                // 点击地图 → 写入全局联动态
                dispatch(widgetFields.getField("cantCode"), info.data.adcode);
                dispatch(widgetFields.getField("cantType"), '6');
            }}
        />
    );
}

function PersonnelAgeChart() {
    // 订阅 cantCode，变化时重新请求 API
    const { cantCode } = useSubscribe({
        cantCode: widgetFields.getField("cantCode"),
    });

    const { data } = useQuery({
        queryKey: ['personnel-age', cantCode],
        queryFn: () => fetchPersonnelAge(cantCode),
    });

    return <PieChartWidget data={data} />;
}
```

### 4.2 跨组件状态传递（组件 A → 组件 B）

```typescript
// 右栏卡片点击 → 中栏地图高亮对应区域
function CardList() {
    const dispatch = useDispatch();

    return (
        <CardListWidget
            onClick={(card) => {
                // 组件 A 写入状态
                dispatch(widgetFields.getField("activeCardKey"), card.key);
            }}
        />
    );
}

function CenterMap() {
    // 组件 B 订阅状态
    const { activeCardKey } = useSubscribe({
        activeCardKey: widgetFields.getField("activeCardKey"),
    });

    // 根据 activeCardKey 高亮地图某区域
    return <EChartsMap highlightRegion={activeCardKey} />;
}
```

### 4.3 模块内局部状态（不进 store）

```typescript
// 指标下钻：只影响右栏自身，用 useState
function RightPanel() {
    const [drilldownCategory, setDrilldownCategory] = useState<string | null>(null);

    if (drilldownCategory) {
        return (
            <DrilldownPanel
                category={drilldownCategory}
                onBack={() => setDrilldownCategory(null)}
            />
        );
    }

    return <CardListWidget onClick={(c) => setDrilldownCategory(c.key)} />;
}
```

---

## 5. 实现参考

```typescript
import { useMemo } from "react";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

// ─── 类型定义 ────────────────────────────────────────────

interface FieldDescriptor {
    name: string;
    value: string;
    [key: string]: any;
}

interface InteractionState {
    runtime: Record<string, any>;
    dispatch: (field: FieldDescriptor, payload: any) => void;
    setState: (partial: Record<string, any>) => void;
}

// ─── defineFields ─────────────────────────────────────────

/**
 * 集中定义字段集，返回 getField(nameOrValue) 快速查找。
 * 类型层面推导出 name ↔ field / value ↔ field 的映射，getField 返回精确类型。
 */
const defineFields = <
    T extends Array<{ name: N; value: V; [key: string]: any }>,
    N extends string = T[number]["name"],
    V extends string = T[number]["value"],
>(
    fields: T,
) => {
    type Field = T[number];

    type NameToFieldMap = { [F in Field as F["name"]]: F };
    type ValueToFieldMap = { [F in Field as F["value"]]: F };
    type MapKeys = keyof NameToFieldMap | keyof ValueToFieldMap;

    const fieldMap = new Map<MapKeys, Field>();

    fields.forEach((field) => {
        fieldMap.set(field.name, field);
        fieldMap.set(field.value, field);
    });

    return {
        getField<K extends MapKeys>(
            nameOrValue: K,
        ): K extends keyof NameToFieldMap ? NameToFieldMap[K] : K extends keyof ValueToFieldMap ? ValueToFieldMap[K] : null {
            return (fieldMap.get(nameOrValue) ?? null) as any;
        },
        fields,
    };
};

// ─── createInteractionStore ───────────────────────────────

function createInteractionStore() {
    const useInteractionStore = create<InteractionState>((set) => ({
        runtime: {},
        dispatch: (field, payload) =>
            set((state) => ({
                runtime: { ...state.runtime, [field.value]: payload },
            })),
        setState: (partial) =>
            set((state) => ({
                runtime: { ...state.runtime, ...partial },
            })),
    }));

    const useSubscribe = <T extends Record<string, FieldDescriptor>>(subscribeFields: T) => {
        const keys = useMemo(() => Object.keys(subscribeFields), [subscribeFields]);

        return useInteractionStore(
            useShallow((state) => {
                const runtime = state.runtime;
                const result: Record<string, any> = {};
                for (const key of keys) {
                    const field = subscribeFields[key];
                    result[key] = field ? runtime[field.value] : undefined;
                }
                return result;
            }),
        ) as { [K in keyof T]: any };
    };

    const useDispatch = () => useInteractionStore((state) => state.dispatch);

    return { useInteractionStore, useSubscribe, useDispatch };
}

export { createInteractionStore, defineFields };
export type { FieldDescriptor, InteractionState };
```

---

## 6. 与架构文档的关系

| 架构文档章节                                                  | 本文对应                               |
| ------------------------------------------------------------- | -------------------------------------- |
| [004 §4.1](../../004-big-screen-architecture.md) 地图下钻联动 | §4.1 示例                              |
| [004 §4.2](../../004-big-screen-architecture.md) 指标下钻联动 | §4.3 示例（模块内局部态，不进 store）  |
| [004 §3.2](../../004-big-screen-architecture.md) 待建组件清单 | 本文作为 `InteractionStore` 的设计载体 |

---

## 7. 开放问题

| ID  | 问题                                                                     | 状态      | 备注                                           |
| --- | ------------------------------------------------------------------------ | --------- | ---------------------------------------------- |
| B1  | 是否需要 `reset()` 方法在页面卸载时清空 runtime                          | ⚪ 待定   | 页面卸载时 store 实例自动 GC，可能不需要       |
| B2  | `useSubscribe` 的 `subscribeFields` 如果动态变化（key 增减）是否正常工作 | ⚪ 待验证 | `useMemo` 依赖了 `subscribeFields`，理论上可以 |
