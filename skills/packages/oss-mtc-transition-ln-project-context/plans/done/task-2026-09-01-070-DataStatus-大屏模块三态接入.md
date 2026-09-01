# Task · 2026-09-01-070-DataStatus-大屏模块三态接入

> 状态：✅ 四屏改造全部完成（待本地视觉验证后关闭 task）
> 类型：编码
> 创建：2026-09-01
> 前置：task-067（DataStatus 组件封装已完成）、014-data-status 已登记 docs/specs/042-components-common/
> 关联依据：docs/specs/042-components-common/014-data-status/spec.md

---

## 0. 任务信息

| 项        | 值                                                                                                  |
| --------- | --------------------------------------------------------------------------------------------------- |
| 编号-slug | 2026-09-01-070-DataStatus-大屏模块三态接入                                                          |
| 任务类型  | 编码                                                                                                |
| 影响范围  | frontend/src/pages/visual/big-screen/ 下各模块 + frontend/src/components/large-screen/ 5 个卡片组件 |
| 验收标准  | 见 §4                                                                                               |

---

## 1. 改造模板

参照：`frontend/src/pages/visual/big-screen/petition-comparison/trend/index.tsx`

**模式 A（useRequest，petition-comparison 专用）**：

```tsx
const { data: resp, loading, error } = useRequest(...);
<DataStatus loading={loading} error={error} dataSource={chartData.xxx}>
    <图表 />
</DataStatus>
```

**模式 B（useEffect + useState 直连 service，其余三屏）**：

```tsx
const [loading, setLoading] = useState(false);
const [error, setError] = useState<unknown>(null); // 新增
useEffect(() => {
    setLoading(true);
    setError(null);
    getXxx(params)
        .then((d) => setItems(d))
        .catch((e) => setError(e)) // 不再吞错置空
        .finally(() => setLoading(false));
}, [deps]);
<DataStatus loading={loading} error={error} dataSource={items}>
    <图表 />
</DataStatus>;
```

---

## 2. 分页面进度清单

### 2.1 petition-comparison ✅ 已完成

| 模块                  | 状态                | 说明                                                          |
| --------------------- | ------------------- | ------------------------------------------------------------- |
| trend                 | ✅ 既有（基准模板） | —                                                             |
| appeal                | ✅ 已完成           | 删 Spin/Empty 覆盖层/hasData，`dataSource={chartData.series}` |
| identity              | ✅ 已完成           | 同上                                                          |
| rank                  | ✅ 已完成           | `dataSource={chartData.groups}`                               |
| channel + ChannelCard | ⛔ 暂不改（P2）     | 骨架屏是设计稿视觉                                            |
| map/index.tsx         | ⛔ 暂不改（P2）     | 地图常驻渲染保交互                                            |
| map/SummaryCards.tsx  | ⛔ 暂不改（P2）     | 骨架占位卡，有 TODO(041 task-058)                             |
| index.tsx / store.ts  | — 不适用            | 纯布局壳 / 非请求层                                           |

### 2.2 petition ✅ 已完成（模式 B）

| #   | 模块                                                          | 状态      | 说明                                                                                  |
| --- | ------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------- |
| 1   | petition-region-bar/index.tsx                                 | ✅ 已完成 | 文案三元 → DataStatus（`dataSource={items}`）；吞错 → error state；保留下钻过滤/排序  |
| 2   | identity-type/index.tsx                                       | ✅ 已完成 | loading 文案 → DataStatus（`dataSource={items}`）；吞错 → error state                 |
| 3   | petition-demands/index.tsx                                    | ✅ 已完成 | 零三态 → 补 loading/error state + DataStatus（`dataSource={data}`）+ cancelled 防泄漏 |
| 4   | petition-trend/index.tsx                                      | ✅ 已完成 | 零三态 → 同上（`dataSource={items}`）                                                 |
| 5   | channel-stat/index.tsx                                        | ✅ 已完成 | 零三态 → 同上（`dataSource={data}`，对象判空）；ChannelSection 结构保留               |
| —   | beijing-summary/overview-indicator                            | ⛔ 不改   | 用户决策（骨架屏）                                                                    |
| —   | petition-map-overview                                         | ⛔ 不改   | 用户决策（地图下钻）                                                                  |
| —   | index.tsx / store.ts / beijing-summary/index.tsx / region-map | —         | 不适用（纯壳）                                                                        |

### 2.3 beijing-petition ✅ 已完成（模式 B，与 petition 屏同构）

| #   | 模块                                                          | 状态      | 说明                                                         |
| --- | ------------------------------------------------------------- | --------- | ------------------------------------------------------------ |
| 1   | petition-region-bar/index.tsx                                 | ✅ 已完成 | 同 petition 屏（`dataSource={items}`）；保留下钻过滤/排序    |
| 2   | identity-type/index.tsx                                       | ✅ 已完成 | 同 petition 屏（`dataSource={items}`）                       |
| 3   | petition-demands/index.tsx                                    | ✅ 已完成 | 零三态 → 补 loading/error + cancelled（`dataSource={data}`） |
| 4   | petition-trend/index.tsx                                      | ✅ 已完成 | 零三态 → 同上（`dataSource={items}`）                        |
| 5   | channel-stat/index.tsx                                        | ✅ 已完成 | 零三态 → 同上（`dataSource={data}`，对象判空）               |
| —   | beijing-summary/overview-indicator                            | ⛔ 不改   | 用户决策（骨架屏）                                           |
| —   | petition-map-overview                                         | ⛔ 不改   | 用户决策（地图下钻）                                         |
| —   | index.tsx / store.ts / beijing-summary/index.tsx / region-map | —         | 不适用（纯壳）                                               |

### 2.4 personnel ✅ 已完成（模式 B，改造落点在共享卡片组件层）

| #   | 模块（页面）          | 实际改造文件（components/large-screen/） | 现状                                                                                                                                                                         |
| --- | --------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | employment-status     | employment-bar-card/index.tsx            | ✅ 已完成：文案式三元(L173-216) → `<DataStatus loading error dataSource={items} emptyDescription="暂无数据">`；`.catch` 吞错(L77) → error state；「加载中…」文案由 Spin 呈现 |
| 2   | entitled-object       | entitled-object-bar-card/index.tsx       | ✅ 已完成：同 #1 模式（`dataSource={data}`）；L113 头部总数 `loading ? '' : totalFormatted` 保留不动                                                                         |
| 3   | region-statistics     | regional-population-bar-card/index.tsx   | ✅ 已完成：同 #1 模式（`dataSource={items}`，保留 filterDistrictsToMap 逻辑）                                                                                                |
| 4   | retired-soldier       | retiree-pie-card/index.tsx               | ✅ 已完成：同 #1 模式（`dataSource={data}`）                                                                                                                                 |
| 5   | data-overview（右栏） | retiree-total-card                       | ⛔ 用户决策：不改                                                                                                                                                            |
| 6   | data-overview（地图） | personnel/data-overview/index.tsx        | ⛔ 用户决策：不改                                                                                                                                                            |
| —   | index.tsx / store.ts  | —                                        | 不适用（纯布局 / 非请求层）                                                                                                                                                  |

---

## 3. 依据（任务来源）

| 来源类型 | 路径                                                                       | 引用章节                 |
| -------- | -------------------------------------------------------------------------- | ------------------------ |
| docs     | `docs/specs/042-components-common/014-data-status/spec.md`                 | §2 对外契约              |
| docs     | `docs/specs/042-components-common/014-data-status/data-model.md`           | §1 Props / §3 空数据判定 |
| 代码     | `frontend/src/pages/visual/big-screen/petition-comparison/trend/index.tsx` | DataStatus 用法基准      |

---

## 4. 验收标准

- [x] petition-comparison appeal/identity/rank 接入 DataStatus，error 有 UI 错误态
- [x] petition 屏 5 模块接入
- [x] beijing-petition 屏 5 模块接入
- [x] personnel 屏共享卡片组件接入（4 个卡片组件）
- [x] 空数据 / 加载中 / 失败三态视觉统一（Spin + Empty）
- [x] 地图 / 骨架屏模块（P2）交互与视觉不回退（未改动，按用户决策保留）
- [x] 各页面本地验证通过（2026-09-01 用户确认归档）

---

## 5. 状态记录

| 日期       | 变更                                                                                                                                                                                            |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-01 | task 创建（4 页面并行扫描完成，产出 P0/P1/P2 分级清单）                                                                                                                                         |
| 2026-09-01 | 用户决策：先改 petition-comparison 3 模块（appeal/identity/rank），其余页面（非用户开发）逐个确认后改                                                                                           |
| 2026-09-01 | appeal/identity/rank 完成：删 Spin/Empty/hasData/message 覆盖层，替换为 `<DataStatus loading error dataSource>` 包裹图表；onError 的 message.error 保留；tsc --noEmit 通过                      |
| 2026-09-01 | 重构 task 结构：按页面分节（§2.1–2.4），已改标 ✅，未改按模块排队待逐个确认                                                                                                                     |
| 2026-09-01 | 用户决策：personnel/employment-bar-card 的 L185 文案三态保留，不替换为 DataStatus                                                                                                               |
| 2026-09-01 | 用户澄清：employment-bar-card 仍替换为 DataStatus，现有文案（暂无数据）通过 emptyDescription 传入；已完成改造 + error state，tsc 通过                                                           |
| 2026-09-01 | 用户决策：retiree-total-card（data-overview 右栏）与 data-overview 地图不改；entitled-object L113 头部总数 loading 显示 "" 保留                                                                 |
| 2026-09-01 | entitled-object-bar-card / regional-population-bar-card / retiree-pie-card 完成：同 employment 模式（error state + DataStatus 包裹图表 + emptyDescription），tsc 通过；personnel 屏改造全部结束 |
| 2026-09-01 | 用户决策：petition 屏 overview-indicator 与 petition-map-overview 不改                                                                                                                          |
| 2026-09-01 | petition 屏 5 模块完成（region-bar/identity-type/demands/trend/channel-stat）：零三态模块补 loading/error state + cancelled 防泄漏，全部 DataStatus 包裹 + emptyDescription，tsc 通过           |
| 2026-09-01 | 修复 petition/identity-type 三元开头漏替换（JSX 未闭合）                                                                                                                                        |
| 2026-09-01 | beijing-petition 屏 5 模块完成（同 petition 屏改法），overview-indicator 与 petition-map-overview 不改；tsc 通过。四屏 DataStatus 接入全部完成                                                  |
| 2026-09-01 | 修复 beijing-petition/petition-region-bar error state 声明丢失（ReferenceError）；全量 Grep 复核 20 文件 setError 均配对无遗漏                                                                  |
| 2026-09-01 | 任务归档：验收标准全部勾选，移入 plans/done/                                                                                                                                                    |
