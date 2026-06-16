---
name: gd-es-next-right-damage-to-towns-exit-service-detail
title: 退服统计弹窗实现参考
description: ExitServiceDetail 弹窗实现（handleRowClick / onRow / btns / 拖拽控制）的唯一代码片段维护点。所属 Skill: gd-es-next-right-damage-to-towns。
version: 1.5.0
---

# ExitServiceDetail 退服统计弹窗

> **职责定位**：本文件是 `ExitServiceDetail.tsx` 弹窗**实现**的唯一维护点（代码片段、handleRowClick、onRow、btns、拖拽控制）。
>
> 跨切面概念（GIS 派发分流、选中态双轨制、dataTime 同步链路等）请查阅 [SKILL.md](./SKILL.md#关键概念一次讲清楚)。
>
> 维护约定：跨切面概念**不**在此处重述，违反者视为 PR 不通过。

---

## 概述

- **组件文件**：`apps/main/app/components/right/network-compact/damage-to-towns/ExitServiceDetail.tsx`
- **样式文件**：`apps/main/app/components/right/network-compact/damage-to-towns/index.css`
- **弹窗容器**：`index.tsx` 中 `StyledDraggableModal`（受 `state.disabledDraggable` 控制拖拽）
- **GIS 派发**：`props.onCellClick` → `index.tsx` → `sectionRight:damageToTownsModalGisPin` 字段（详见 [SKILL.md 关键概念 §1](./SKILL.md#1-oncellclick-三表派发)）
- **选中态**：内部 `state.selectedRowKey`（详见 [SKILL.md 关键概念 §2](./SKILL.md#2-选中态双轨制)）

---

## 功能特性

| 特性 | 说明 |
|------|------|
| **数据类型切换** | 按钮组在物理退服 / 逻辑退服间切换 |
| **多层级下钻** | 省级 → 地市 → 区县 → 乡镇，通过 `state.drillDownPath` 维护下钻栈 |
| **区县行 GIS 联动** | 区县粒度点击 → 内部 `selectedRowKey` 切换 + `props.onCellClick` 派发 |
| **动态列** | 从 `environment.json` 读取列配置 |
| **智能排序** | 数字优先，字符串走 `localeCompare("zh-CN")` |
| **格式化单元格** | `FormattedCell` 组件，支持 `tooltipTemplate` 和 `formatCellText` |
| **返回上一级** | 非顶层时显示「返回上一级」按钮，逐级回退 |
| **拖拽控制** | 鼠标悬停顶部数据时间 + 按钮区域时启用拖拽 |

---

## 按钮组实现（btns 双实现）

### 当前生效：`ExitServiceDetail.tsx`（物理退服/逻辑退服）

```tsx
// ExitServiceDetail.tsx
import { ServiceType } from "./Context";

const btns = [
    {
        label: "物理退服",
        get value() {
            return ServiceType.Physical;
        },
    },
    {
        label: "逻辑退服",
        get value() {
            return ServiceType.Logical;
        },
    },
];

<div className="btns">
    {btns.map((item) => (
        <div
            className={cx("btn", { active: state.exitServiceType === item.value })}
            key={item.value}
            onClick={() => setState({ exitServiceType: item.value })}
        >
            {item.label}
        </div>
    ))}
</div>;
```

> 使用 `get value()` getter 写法（每次访问都返回最新枚举值，避免被静态属性快照）。

### 备用：`Part.Middle.Settings.tsx`（物理站/逻辑站，导出但未启用）

```tsx
// Part.Middle.Settings.tsx
const btns = [
    {
        label: "逻辑站",
        get value() {
            return ServiceType.Logical;
        },
    },
    {
        label: "物理站",
        get value() {
            return ServiceType.Physical;
        },
    },
];
```

> 当前 `Part.Middle.tsx` import 已注释（未启用），保留以备未来扩展。

---

## 下钻参数构建（`buildRequestParams`）

`ExitServiceDetail.tsx:buildRequestParams()` 根据 `currentZone.zoneLevel` 构造不同层级的请求参数（switch 覆盖 province/region/city/town 四级）。

```
buildRequestParams()
  ├─ province: { zoneName: currentZone.zoneName, zoneLevel: province }
  ├─ region:   { zoneName: currentZone.zoneName, zoneLevel: region }
  ├─ city:     { zoneName: currentZone.zoneName, zoneLevel: city }
  └─ town:     { zoneName: currentZone.zoneName, zoneLevel: town }
```

> 如需新增第 5 级（村/网格），需在 switch 中追加 case，并在 `ZoneLevelEnum` 添加新值。详见 [SKILL.md 场景 4](./SKILL.md#场景-4新增弹窗下钻层级)。

---

## 行点击与下钻

`handleRowClick` 分两路处理：**点击区县行**触发 GIS 派发 + 内部行高亮，**点击其它行**触发下钻。

### 区县行点击（GIS 派发 + 内部选中态）

```typescript
// ExitServiceDetail.tsx
const getRowKey = (record: any) =>
    `${record?.region ?? ""}|${record?.city ?? ""}|${record?.town ?? ""}|${record?.alarmType}`;

const handleRowClick = (record: any) => {
    if (record.zoneLevel === ZoneLevelEnum.city) {
        // 区县粒度：点击乡镇行向外部传入选中数据
        const rowKey = getRowKey({ ...record, alarmType: state.exitServiceType });
        const isSelected = state.selectedRowKey === rowKey;
        const nextSelected = !isSelected;

        setState({ selectedRowKey: nextSelected ? rowKey : null });

        props.onCellClick?.({
            table: "exitServiceDetailModal",
            record: { ...record, alarmType: state.exitServiceType },
            tableType: state.exitServiceType,
            selected: nextSelected,
        });

        return;
    }
    const newDrillDownPath = [...state.drillDownPath, record];
    setState({ drillDownPath: newDrillDownPath, selectedRowKey: null });
};
```

### 内部状态 vs 外部 store

| 关注点 | 内部管理（弹窗） | 外部 store（主屏中栏） |
| ------ | ----------------- | ---------------------- |
| **行高亮** | `state.selectedRowKey === getRowKey(record)` | `getSelectRowKey(selectedTableRecord, ...)` |
| **GIS 派发** | `props.onCellClick` → `index.tsx` → `damageToTownsModalGisPin` | — |
| **联动高亮** | 不消费 store | 消费 store 的 `sectionRight:damageToTownsSelectedRecord` |
| **`index.tsx:216` prop** | 已注释 | — |

---

## onRow 内部高亮判定

`onRow` 在组件顶层用 `useLatest` + `useMemoizedFn` 提取为独立变量，避免行级回调重建；点击事件中会把 `state.exitServiceType` 注入 `record` 后再走 `handleRowClick`：

```typescript
// ExitServiceDetail.tsx
const latest = useLatest({
    selectedRowKey: () => state.selectedRowKey,
});

const onRow = useMemoizedFn((record: any) => {
    const isActive =
        record.zoneLevel === ZoneLevelEnum.city &&
        latest.current.selectedRowKey() === getRowKey({ ...record, alarmType: state.exitServiceType });

    return {
        onClick: () => handleRowClick({ ...record, alarmType: state.exitServiceType }),
        className: isActive ? "active" : "",
        style: { cursor: "pointer" },
    };
});

// 表格渲染时绑定
<StyledTable
    ...
    onRow={onRow}
    rowKey={(record: any) => record.renderKey}
    ...
/>
```

> **维护注意**：
> - `latest.selectedRowKey` 包装为 getter 函数（`() => state.selectedRowKey`）而非直接传 `state.selectedRowKey`，避免 `useLatest` 缓存值滞后
> - `onRow` 内部统一把 `state.exitServiceType` 注入 `record.alarmType`，保证 `getRowKey` 与 `handleRowClick` 拿到一致的 `alarmType`

---

## 重置时机

`state.selectedRowKey` 会在以下场景被清空（`setState({ selectedRowKey: null })`）：

- 弹窗首次打开（`useSetState` 初始值 `null`）
- 任意下钻后（`handleRowClick` 的非 city 分支）
- 返回上一级后（`handleBack`）

> **不再重置的场景**（旧文档中曾列出，已与源码对齐后移除）：
> - ~~数据重新拉取成功后（`onSuccess` 回调内）~~ —— 源码中 `// selectedRowKey: null,` 已被注释，**`onSuccess` 不再重置选中态**
> - ~~切换物理/逻辑退服按钮后~~ —— `btns.onClick` 仅 `setState({ exitServiceType })` 触发重新拉取，但 `onSuccess` 不再重置 `selectedRowKey`；若需联动清空，需在 `onClick` 显式追加 `setState({ selectedRowKey: null })`

---

## 弹窗拖拽控制

```
鼠标进入"顶部数据时间 + 按钮区域" → onMouseOver → setDisabledDraggable(false)
鼠标离开该区域                       → onMouseOut  → setDisabledDraggable(true)
```

- `state.disabledDraggable` 在 `index.tsx` 维护
- 触发区域由 `ExitServiceDetail` 顶部条包装 div 控制
- `getContainer` 必须指向正确 DOM 节点（否则拖拽异常）

---

## 相关资源

- **API 契约**：[api-reference.md](./api-reference.md) — 6 个 viewItemId、请求参数、响应结构
- **配置 schema**：[config-reference.md](./config-reference.md) — `detailModal.{physical|logic}.columns.{zoneLevel}` 配置规范
- **GIS 派发分流**：[SKILL.md 关键概念 §1](./SKILL.md#1-oncellclick-三表派发) — 三表 payload 差异表
- **选中态双轨制**：[SKILL.md 关键概念 §2](./SKILL.md#2-选中态双轨制) — 弹窗 vs 主屏中栏

---

## 版本信息

| 字段 | 值 |
|------|---|
| **文档 ID** | `gd-es-next-right-damage-to-towns-exit-service-detail` |
| **当前版本** | `1.5.0` |
| **最后更新** | `2026-06-16` |
| **维护者** | Emergency Support Team |
| **所属 Skill** | [gd-es-next-right-damage-to-towns](./SKILL.md)（v1.5.0） |
| **组件文件** | `apps/main/app/components/right/network-compact/damage-to-towns/ExitServiceDetail.tsx` |
| **关联接口** | `getTownshipOutOfServiceCountPhysicsApi` / `getTownshipOutOfServiceCountLogicApi`（详见 [api-reference.md](./api-reference.md)） |
| **关联配置** | `gd-emergency-support.modules.damage-to-towns.detailModal.{physical\|logic}.columns.{zoneLevel}`（详见 [config-reference.md](./config-reference.md)） |

## 版本历史

| 版本 | 日期 | 变更摘要 |
|------|------|---------|
| `1.5.0` | `2026-06-16` | **评审修复**：补 frontmatter（与 SKILL.md 结构约定一致）+ 末尾"版本信息"表 + 所属 Skill 交叉链接 |
| `1.0.0` | `2026-06-16` | 初版发布：覆盖弹窗实现（handleRowClick / onRow / btns / 拖拽控制 / 重置时机） |

## 适用范围

- ✅ **适用**：调整物理/逻辑退服按钮顺序、调整区县行的 GIS 派发参数、调整 `state.selectedRowKey` 重置时机、调整按钮样式
- ✅ **适用**：调整 `buildRequestParams()` 层级映射关系
- ✅ **适用**：调整 `FormattedCell` 组件（tooltip/formatCellText）
- ✅ **适用**：调整拖拽触发区域与 `disabledDraggable` 切换逻辑
- ⚠️ **谨慎**：把 `state.selectedRowKey` 改回依赖外部 `selectedTableRecord`（会与主屏中栏/右栏的高亮语义耦合，且 `index.tsx:216` 的 prop 已被注释）
- ⚠️ **谨慎**：修改 `zoneLevel === ZoneLevelEnum.city` 终止下钻的判断（影响所有下钻栈 + GIS 派发分流）
- ❌ **不适用**：弹窗外部容器（`StyledDraggableModal`）的全局样式修改（应在 `StyledDraggableModal` 自身处处理）
- ❌ **不适用**：跨切面概念重述（GIS 派发、选中态等已在 SKILL.md）
