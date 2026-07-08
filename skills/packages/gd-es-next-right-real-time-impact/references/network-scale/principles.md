# 配置驱动设计原则

> 🎯 **本文档是 NetworkScale 组件扩展的"硬性规范"**，所有新功能 / 新组件必须严格遵守。
> 不论是新增指标、组合视图、轮播方式、图表系列、表格列——所有展示逻辑都必须**声明在配置中**，组件不写业务硬编码。

---

## 目录

- [§1 核心原则](#1-核心原则)
- [§2 反面案例：idMap 硬编码](#2-反面案例idmap-硬编码)
- [§3 正确做法：配置驱动](#3-正确做法配置驱动)
- [§4 落地清单（新增功能时自查）](#4-落地清单新增功能时自查)

---

## 1. 核心原则

**所有展示逻辑由 `presets.ts` / `environment.json` 声明式配置控制，组件内部不写业务硬编码。**

| 维度 | ✅ 正确做法 | ❌ 错误做法 |
| --- | --- | --- |
| **指标数据** | 在 `presets.ts` 的 `items[]` 中声明 `id` / `label` / `detailTitle` | 在组件里 `if (id === "14") label = "传输一干"` |
| **组合视图** | 在 `presets.ts` 的 `groupViews[]` 中声明 `children` / `viewType` | 在组件里 `if (id === "14/15") ...` |
| **轮播方式** | 在 `presets.ts` 中设置 `groupViewType: "carouselSection"` | 在组件里 `if (group === "powerAndEnv") return <CarouselSection>` |
| **图表系列** | 在 `environment.json` 的 `unitIdSettings` 中声明 `seriesType` | 在 `DetailChartOption.tsx` 写死 `{ name: "移动", fieldName: "kpiValue1" }` |
| **故障清单列** | 在 `environment.json` 的 `rightNetworkCompactFaultListTable.columns` 中声明 | 在 `FaultListTable.tsx` 中 `if (id === "1") columns = [...]` |
| **重映射规则** | 在 `presets.ts` 中通过 `groupViews.children` 反查 | 在 `index.tsx` 中维护 `idMap` 硬编码 |

---

## 2. 反面案例：idMap 硬编码

> 🔴 **本节是"反面教材"**——`index.tsx` 中维护的 `idMap` 已确认为**冗余逻辑**（SimpleCard 已传单 ID），新功能请勿扩展，详见 [main-render-flow.md §5.4](./main-render-flow.md#54-组合-id-重映射idmap--已确认为冗余逻辑)。

### 2.1 错在哪

```typescript
// ❌ 错误：组件内部自定义业务规则
// index.tsx L110-146
useEffect(() => {
    setState((pre) => {
        const idMap = {
            "14": { id: "14/15", label: "传输一干", detailTitle: "传输一干", valueKey: "value14" },
            "15": { id: "14/15", label: "传输二干", detailTitle: "传输二干", valueKey: "value15" },
            // ...
        };
        // ...
    });
}, [data]);
```

**问题**：

- "传输一干"等中文文案写死在组件内，**与 `presets.ts` 重复**
- 业务规则（"14 + 15 = 14/15 组合"）隐藏在组件中
- 新增组合 ID 必须改组件源码

### 2.2 为什么是冗余的

证据链（5 步）：

1. `presets.ts` 的 `groupViews.children` 已经声明了"14 + 15 = 14/15 组合"
2. `SimpleCard.combined` 在 onClick 时已经按 children 拆好，传上来的就是"单 ID dataItem"（不是 groupView 合成对象）
3. `CarouselNormal` spread `dataItem` 后调用 `onItemClick`，id 已是单 ID
4. `handleIndClick` 直接 `setState({ activeIndItem: item })`，已是正确的值
5. `idMap` 在 `useEffect [data]` 中重复加工一次几乎相同的结果

### 2.3 已知问题

- 硬编码 label / detailTitle → 与 `presets.ts` 不同步
- 不支持动态新增组合 ID → 必须改组件源码
- 耦合 `value14` / `value15` 字段名 → 后端 schema 变化会静默失败

### 2.4 重构建议（按改动量从小到大）

| 方案 | 改动量 | 描述 |
| --- | --- | --- |
| 方案 A：直接删除 idMap | 🟢 小 | SimpleCard 已经传对了，可整段删除 `useEffect` L110-146 |
| 方案 B：从 presets.ts 自动生成 idMap | 🟡 中 | 遍历 `groupViews` 中 `viewType: "combined"` 的项 |
| 方案 C：API 改造 | 🔴 大 | 让详情 API 直接支持 groupView 组合 ID |

---

## 3. 正确做法：配置驱动

```typescript
// ✅ 正确：所有信息都在 presets.ts
// presets.ts
{
    group: "transmission",
    type: "transmission",
    items: [
        { id: "14", label: "传输一干", detailTitle: "传输一干", unit: "个" },
        { id: "15", label: "传输二干", detailTitle: "传输二干", unit: "个" },
    ],
    groupViews: [
        {
            id: "14/15",
            label: "传输一干/二干",
            viewType: "combined",
            children: [{ id: "14" }, { id: "15" }],
        },
    ],
}

// ✅ 组件只负责渲染，不写业务硬编码
// SimpleCard.tsx
combined: () => {
    return (props.currentItem?.children || []).map((item, index) => {
        const dataItem = props.dataSource?.find((d) => d.id === item.id);
        //           ↑ 单纯按 id 反查，不写"14/15 是哪些的组合"这类业务规则
        return <span onClick={() => props.onClick(dataItem)}>{dataItem.data.value}</span>;
    });
}
```

---

## 4. 落地清单（新增功能时自查）

| 自查项 | 是否通过 |
| --- | --- |
| ✅ 指标 ID / 名称 / 单位是否都在 `presets.ts` 中声明？ | |
| ✅ 组合关系是否通过 `groupViews.children` 表达？ | |
| ✅ 轮播方式是否通过 `groupViewType` 表达？ | |
| ✅ 图表系列映射是否在 `environment.json` 中配置？ | |
| ✅ 表格列配置是否在 `environment.json` 中配置？ | |
| ✅ 组件中**没有** `if (id === "xxx")` 这类业务判断？ | |
| ✅ 改文案 / 改业务关系只改 `presets.ts` / `environment.json`，不需要改组件源码？ | |

**任一未通过 → 重新设计。**

---

## 相关文档

- [presets-config.md](./presets-config.md) — 所有可用配置项速查
- [main-render-flow.md](./main-render-flow.md) — 渲染流程（包含 idMap 完整证据链）
- [troubleshooting.md §1.6](./troubleshooting.md#16-选中状态异常) — 选中态异常排查
