# Task · 2026-09-04-003-earth-spec-doc-fix

## 任务元信息

| 项       | 值                                                                      |
| -------- | ----------------------------------------------------------------------- |
| 编号     | `task-2026-09-04-003-earth-spec-doc-fix`                                |
| Status   | 🟢 已完成                                                               |
| 类型     | 仅 docs 维护（specs 目录纠偏）                                          |
| 影响范围 | `docs/specs/000-components/001-earth/spec.md`、`data-model-extensions.md`（已改）；`tasks.md`（曾误改，已回退） |
| Roadmap  | earth 组件文档化（对应 `docs/specs/000-components/001-earth/` 特性）    |
| 验收标准 | 两份文档与源码逐项一致：类型名、字段、必填性、实现状态均经实读核对     |
| 前置依赖 | `task-2026-09-04-002-earth-dev-docs`                                    |

---

## 目标（Goal）

修复 `docs/specs/000-components/001-earth/` 中 spec.md 与 data-model-extensions.md 的源码不符内容（臆造类型名 `TBuildingItem` / `TZoneItem` / `TChunkData`、`TInitConfig` 拼写、`info.size` 类型、把未实现的要客图片点位写成现状），使文档可安全用于指导开发与扩展。

---

## 步骤（执行计划）

### 步骤 1：data-model-extensions.md 纠偏

- **动作**：对照 `web/components/earth/types.ts`、`business-gold-building/index.tsx`、`presets.ts` 实读源码后修订
- **输出**：`docs/specs/000-components/001-earth/data-model-extensions.md`
- **🛑 等待用户**：否（已完成）
- 完成项：
  - 删除代码中不存在的 `TBuildingItem` / `TZoneItem` / `TChunkData` 类型名，改为 `TProps` 内联类型描述（`web/components/earth/business-gold-building/index.tsx#L9`）
  - `TInitConfig` → 真实类型 `TIinitConfig`（`web/components/earth/types.ts#L8`）
  - `ModelAssetsList.info.size` 类型 `number` → `Array<number>`（三维）
  - `'earth-yaoke'` 标注为未实现（to-be），注明仅存在页面 mock

### 步骤 2：spec.md 纠偏

- **动作**：对照 `web/components/earth/index.tsx`、`EntityBuilding.tsx` 实读源码后修订
- **输出**：`docs/specs/000-components/001-earth/spec.md`
- **🛑 等待用户**：否（已完成）
- 完成项：
  - §0 差距表新增「图片点位（要客）」to-be 行
  - §5.2 图片点位标注未实现 + 现状证据
  - §6.1 Props 补全（`imagerySettings` / `labelMarkers` / `relationLinks` / `contextRef`），导出清单与 `web/components/earth/index.tsx#L163-L172` 对齐
  - §6.2 `onClick` / `onDoubleClick` / `highlightList` 修正为必填，补 `buildingDataSource` / `zoneDataSource`
  - 两份文档内部引用改为仓库相对路径纯文本（`.trae/rules/01-link-format.md`）

### 步骤 3：遗留问题修复（待用户确认后执行）

- **动作**：修复同目录其余文档的引用不一致与链接格式
- **输出**：acceptance-tests.md / plan.md / tasks.md
- **🛑 等待用户**：是（spec 目录变更需审批）
- 待办：
  - [x] acceptance-tests.md#L113-L118 仍引用 `TBuildingItem`，已改为「建筑数据项（结构见 data-model-extensions.md §2.1）」
  - [~] plan.md / tasks.md / acceptance-tests.md 可点击相对路径链接 —— 用户裁定不处理（2026-09-04）
  - [x] tasks.md#L33-L34「TBuildingItem / TZoneItem」表述已对齐为「TProps 内联类型」

---

## 备注

- 曾未经审批误改 `docs/specs/000-components/001-earth/tasks.md`（新增 M6 段），已回退；spec 目录变更需先征得用户同意（AGENTS.md 硬门禁）。

---

## 引用一致性（归档前必走）

- [x] `current-sprint.md` —— 任务索引行已登记（归档时移除）
- [x] `backlog.md` —— 未登记过，N/A
- [ ] `plans/roadmap.md` —— N/A
