# Task · 2026-11-12-004-mvp-material-batch4

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-12-004-mvp-material-batch4` |
| Status | 已完成 |
| 类型 | 编码 |
| 影响范围 | `docs/materials/components/ui/<新模块>/`（4 个新物料，源）、`docs/skeleton/src/components/`（消费副本）、`docs/skeleton/src/registry.tsx`（注册）、`docs/skeleton/public/schemas/home.schema.json`、`docs/skeleton/src/renderer-boot.ts` + `index.html`（React 单实例） |
| Roadmap | MVP · 里程碑 2（7 组件齐） |
| 验收标准 | 同一份 `home.schema.json` 不改，渲染出 7 个组件 |
| 前置依赖 | task-2026-11-12-003（契约）、用户提供目标大屏 |

---

## 目标（Goal）

按目标大屏反推 4 个物料缺口，逐个实现并入库，让演示大屏凑齐 7 个组件。

---

## 目标大屏与缺口清单（步骤 0 输出 · 2026-11-12 确认）

**目标屏**：`design/mvp/mvp-schema-design/mvp-schema-design.html` 的 3 列 × 4 行演示屏。

| 位置 | 组件 | 处置 |
| --- | --- | --- |
| 顶部整行 | 标题栏 | **新建** `screen-title` |
| 左中上 | 指标卡 | 复用 `indicator-view`（拷入骨架） |
| 中央跨两行 | 地图（点击联动） | 复用 `echarts-map`（拷入骨架） |
| 右上 | 排名 | **新建** `rank-list` |
| 左下 | 横向条形 | 复用 `echarts-hor-bar`（拷入骨架） |
| 右下 | 表格 | **新建** `data-table` |
| 底部整行 | 时间轴 | **新建** `time-axis` |

4 条缺口（每条含位置 / 数据 / 交互）：

1. **`screen-title`**（顶部整行）：配置 `title` / `subtitle` / `extra` / `showTime`；无数据、无交互。
2. **`rank-list`**（右上）：数据 `RankItem[]`（`name` / `value` / `unit`），按值降序渲染色条；无交互。
3. **`data-table`**（右下）：配置 `columns` + 数据 `dataSource`（行对象数组），支持滚动；无交互（预留 `onRowClick`）。
4. **`time-axis`**（底部整行）：数据 `TimeAxisItem[]`（`time` / `label` / `status`）；无交互（预留 `onItemClick`）。

骨架现状（步骤 0 核对）：

- `docs/skeleton/public/screen.json` 为两段占位 schema，**无** `schemas/` 目录；本卡改为 `public/schemas/home.schema.json` 并更新 `renderer-boot.ts` 的 `SCHEMA_URL`。
- 骨架 `src/components/` 只有基础设施（error-boundary / interaction-store / scaler-container / section-frame），**不含**任何物料；3 个旧物料需从 `docs/materials` 拷入并注册。
- 骨架依赖已含 `echarts` / `echarts-for-react` / `less`，旧物料可原样编译。
- 地图 geojson 默认走 `/static/map/geojson/{adcode}.geojson`，骨架需补 `public/static/map/geojson/210100.geojson`。

---

## 技术设计与实现记录

### 物料（源 → 骨架副本）

| 物料 | type | 目录 | 交互 |
| --- | --- | --- | --- |
| 大屏标题栏 | `screen-title` | `docs/materials/components/ui/screen-title/` | 无 |
| 排名列表 | `rank-list` | `docs/materials/components/ui/rank-list/` | `onClick`（Schema 未启用） |
| 数据表格 | `data-table` | `docs/materials/components/ui/data-table/` | `onRowClick`（Schema 未启用） |
| 横向时间轴 | `time-axis` | `docs/materials/components/ui/time-axis/` | `onItemClick`（Schema 未启用） |

4 个新物料均为自包含 tsx（零 CSS 文件、零外部依赖），`runtime` 契约按 003 定稿填写；副本拷入 `docs/skeleton/src/components/<name>/index.tsx`。

### 旧物料接入

- `indicator-view` → `docs/skeleton/src/components/indicator-view/`（含 `index.less`）
- `echarts-hor-bar` → `docs/skeleton/src/components/echarts-hor-bar/`（含 `index.css`）
- `echarts-map` → `docs/skeleton/src/components/echarts-map/`（整目录，含 `images/`）；geojson 补到 `docs/skeleton/public/static/map/geojson/210100.geojson`

### 联动

- Schema 唯一联动字段：`activeItem`（默认 `{ id: '210102', name: '和平区' }`）。
- 地图 `events: [{ on: 'onClick', dispatch: 'activeItem', pick: 'data' }]`；`indicator-view` 与 `rank-list` 均 `subscribe: ['activeItem']`，按 `id` 匹配高亮。
- 实测 `sectionEvent`：`{"field":"activeItem","value":{"id":"210123","name":"康平县"},"sectionId":"map"}`。

### React 单实例（关键修复）

IIFE 渲染器 external 了 `react` / `react-dom`（映射 `window.React` / `window.ReactDOM`），而物料由骨架打包、使用骨架自己的 React。两份 React 导致物料 hooks 与渲染器 reconciler 的 dispatcher 不匹配（`Invalid hook call`，4 个带 hooks 的组件渲染异常）。

解决：改为 `renderer-boot.ts` 先把骨架的 React / ReactDOM 注入全局，再动态加载 IIFE 产物（`index.html` 移除三条 vendor script）。已记入 `design/mvp/schema-runtime.md` §5.2。

### 验证

- `pnpm check:material-registry`：通过（7 个 `runtime.type` ↔ 7 个 registry 键，无告警）
- `pnpm check:renderer-isolation`：通过
- `pnpm build`（站点）、`pnpm --dir docs/skeleton build`：通过
- 浏览器（dev 5199 + preview 5200）：7 个 section 全部渲染，标题 / 指标 / 地图 / 排名 / 条形 / 表格 / 时间轴同屏，默认 `activeItem` 高亮排名首行；console 无报错。
- `pnpm build:renderer` 重跑后产物与仓库内 `vendors` 字节一致（未改渲染器源码，仅确认版本）。

---

### 步骤 0：确认缺口（硬前置）

- **动作**：用目标大屏与物料库比对，产出缺口清单（4 条），每条写明：叫什么、在屏上哪个位置、数据长什么样、交互有无
- **输出**：缺口清单（写入本卡）
- **等待用户**：**是**（需目标大屏图片或描述）

### 步骤 1~4：逐个物料

- **动作**：每个物料走同一节奏——在 `docs/materials/business/<模块>/` 定 `runtime` 契约 → 写 tsx → 补 example（可独立渲染）→ 拷入 `docs/skeleton/src/components/<name>/` → `docs/skeleton/src/registry.ts` 注册
- **注意**：物料在**骨架内编译**，改完必须重新 build 骨架才生效；这不是 SDK 变更，不需要 `build:renderer`
- **注意**：物料若需像素补偿，读保留 prop `__scale`，**禁止** import 渲染器的 `ScalerContext`，也不假定宿主存在 `useScreenScale`（见 003 的 `constraints`）
- **输出**：4 个物料（源 + 副本）+ 4 条注册
- **等待用户**：否

### 步骤 5：接进 Schema + 验证

- **动作**：在 `home.schema.json` 的占位 section 上填入真实 type 与 props；`pnpm build` + 目视 7 组件
- **输出**：更新后的 schema + 验证结论
- **等待用户**：是（硬门槛②）

---

## 不做清单

- 不做与目标大屏无关的物料
- 不做粒度过细的拆分（相近需求合并为一个 + props 区分）
- 不重构已有物料

## 验收 checklist

- [x] A1：4 个物料均有 `runtime` 契约与 example，example 可独立渲染
- [x] A2：同一份 Schema 不改，7 个组件全部渲染
- [x] A3：无「差一点就复用」的重复物料（相同需求已合并）
- [x] A4：`pnpm build` 通过；渲染器源码未改（`build:renderer` 重跑仅确认产物一致）

## 开放问题

| # | 问题 | 负责人 | 状态 | 结论 |
| - | ---- | ------ | ---- | ---- |
| 1 | 目标大屏是什么 | 用户 | 已关闭 | 设计稿 3 列 × 4 行演示屏（标题 / 指标 / 地图 / 排名 / 条形 / 表格 / 时间轴） |
| 2 | 4 个物料分别是哪 4 个 | 用户 | 已关闭 | `screen-title` / `rank-list` / `data-table` / `time-axis`，按设计稿新做 |
| 3 | 3 个现成物料是否够用 | 架构 | 已关闭 | 够用：`indicator-view` / `echarts-map` / `echarts-hor-bar` |
| 4 | 3 个现成物料是否已在骨架 `src/components/` 中 | 架构 | 已关闭 | 不在，需从 `docs/materials` 拷入并注册 |

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准（用户选定设计稿 + 4 个新物料） | 2026-11-12 | 用户 |
| ② 实现验收 | 已验收通过 | 2026-11-13 | 用户 |

## 变更记录

| 日期 | 变更 |
| --- | --- |
| 2026-11-12 | 缺口清单落卡；4 个新物料四件套完成；旧物料拷入骨架；home schema 接入 7 组件 |
| 2026-11-13 | 修复渲染器与物料 React 双实例（Invalid hook call）；浏览器验证 7 组件与联动字段派发 |

## 关联

> - 前置：`task-2026-11-12-003-mvp-material-contract.md`
> - 物料规范：根 `AGENTS.md`「物料产物规范」
> - 设计：`design/mvp/schema-runtime.md` §5.2（React 单实例约定）
