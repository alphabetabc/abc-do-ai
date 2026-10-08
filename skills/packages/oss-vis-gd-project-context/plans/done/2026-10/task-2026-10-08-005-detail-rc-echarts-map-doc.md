# Task · 2026-10-08-005-detail-rc-echarts-map-doc

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-10-08-005-detail-rc-echarts-map-doc` |
| Status | 已完成（待验收） |
| 类型 | skill（组件文档细化，无业务代码改动） |
| 影响范围 | skill `oss-vis-gd-project-context` 下 `design/components/003-rc-echarts-map/README.md` |
| Roadmap | skill 结构治理延续（task-002 后续） |
| 验收标准 | 见下方验收 checklist |
| 前置依赖 | task-2026-10-08-002（目录结构已就位） |

---

## 目标（Goal）

把 003-rc-echarts-map/README.md 细化为完整底层组件文档：补 Overlay 体系（`Overlay` / `OverlayItem` / `useOverlayContext`）的用法与代码示例、`useRenderHtmlOverlay` 等 hooks 说明、MapGeo 对该组件的实际使用方式（builder 模式如何落地）。

---

## 步骤（执行计划）

### 步骤 1：源码调研

- **动作**：补读 `web/components/ui/rc-echarts/map/overlay/index.tsx` 剩余部分（OverlayItem 实现细节）；Read 一份 map-geo（建议 comprehensive-display-center 份）的 `presets.ts` / `index.tsx`，梳理 seriesBuilder / geoBuilder 实际写法
- **输出**：调研结论（对话中呈现）
- **等待用户**：否

### 步骤 2：文档细化

- **动作**：更新 `design/components/003-rc-echarts-map/README.md`：Overlay 体系用法与示例代码、hooks（`useECMapOption` / `useRenderHtmlOverlay`）适用场景、builder 模式真实示例（取自 map-geo presets.ts）、geojson 静态资源约定（`public/map/geojson/`、`STATIC_PATH`）
- **输出**：更新后的 README.md
- **等待用户**：否

### 步骤 3：验收

- **动作**：核对文档所有路径 / API / 示例与源码一致；与 `design/modules/five-major-center/map-geo/README.md` 交叉引用无死链、职责不重叠（底层 vs 业务）
- **输出**：验收 checklist 勾选
- **等待用户**：是（硬门槛②，验收后归档）

---

## 不做清单

- 不改 `web/components/ui/rc-echarts` 源码
- 不重复 map-geo 业务侧维护内容（那是 `design/modules/five-major-center/map-geo/README.md` 的职责）
- 不写 ECharts geo 官方 API 教程
- **组件层文档纪律（源自 task-003 验收教训，必须遵守）**：
  - 不列举「哪些业务页面在用本组件」——引用方向只允许业务文档 → 组件文档，不允许反向；builder 示例可取自 map-geo 源码作为 Props 用法说明，但不列业务使用清单
  - design/ 文档是长期真实源，**不写任务溯源 / 变更记录 / 过程性信息**（这些只进任务卡）
  - README 保持入口薄层：定位 + 快速上手 + 文档索引；内容拆分到主题子文档，不堆在单 README 里

---

## 验收 checklist

- [x] A1：Overlay 体系（Overlay / OverlayItem / useOverlayContext）有用法说明 + 示例代码，与源码一致 → `overlay.md`（含 useRenderHtmlOverlay、useOverlayItemContext、getOverlayContainer）
- [x] A2：builder 模式（seriesBuilder / geoBuilder）有取自 map-geo 的真实示例 → `builders.md`（comprehensive-display-center presets.ts 四层 geo + context 切图标 scatter）
- [x] A3：与 five-major-center/map-geo/README.md 职责边界清晰（底层 vs 业务），交叉引用有效 → map-geo/README.md 已补指向 `design/components/003-rc-echarts-map/README.md` 的引用
- [x] 影响架构 / 硬约束的决策已回写 `design/`（无则 N/A）
- [x] `env/AGENTS.md` 声明的质量门槛命令已通过（纯 docs 改动，N/A）

---

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-10-08 | user（「执行下一个task」） |
| ② 实现验收 | 待验收 |  |  |

---

## 关联

> - 前置：`task-2026-10-08-002-design-restructure-map-geo`
> - 同系列：`task-2026-10-08-003-detail-emap-gis-doc`、`task-2026-10-08-004-detail-react-echarts-doc`
