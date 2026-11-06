# Task · 2026-11-04-017-business-inventory-refine

> 业务模块（原台账「二」）形态勘察 + 四档处置标注。规划源为 research/ 归类表（原台账 002 已于 2026-11-04 归档，规划权移交本卡）。

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-04-017-business-inventory-refine` |
| Status | 已完成 |
| 类型 | docs（勘察 + 台账细化） |
| 影响范围 | `../research/`（新增勘察产物，本任务唯一规划载体）、scripts/（新增扫描脚本） |
| Roadmap | 阶段 3（蒸馏执行·业务模块前置） |
| 验收标准 | 37+ 业务模块全部有四档标注（A 已覆盖 / B 独立物料 / C 多版本形态 / D 低价值），归类建议表可支撑分工决策 |
| 前置依赖 | 无 |

---

## 目标（Goal）

把台账「二」从「目录/体积清单」细化为「形态归类 + 处置档位」，让后续蒸馏可以直接按表执行、分派同事。

## 背景与动机

- 用户指出：单中心模块 37 个，可能大量是「同款 UI 换数据」（如多款表格），逐目录蒸馏工作量不可接受
- 地图定制能力可下沉为 echarts-map 物料的 examples，不必立独立物料
- 需要识别「已可由现有物料组合覆盖」「无复用价值」的模块，避免无效蒸馏

## 方案

### 四档处置口径

| 档 | 判定标准 | 处置 |
| --- | --- | --- |
| A · 已覆盖 | 本质 = 现有物料组合 + 业务数据映射 | 不蒸馏；典型形态补进对应物料 examples/（表格类 → ui-table / vertical-infinite-info；地图定制 → echarts-map） |
| B · 独立物料 | 有独立可复用 UI 结构 | 后续立卡蒸馏，category=business |
| C · 多版本形态 | 跨中心多版本（map-view / carousel-view / iframe-view / ensure-progress / components 聚合） | 合并蒸馏成一个物料，版本差异走 Props/examples |
| D · 低价值 | 一次性业务定制、无复用场景 | 搁置，台账标记理由 |

### 地图系专项口径

map-view（4 版）+ gd 的 map / map-gis 不立独立物料：通用能力归 echarts-map 物料，各中心定制（图层/挂件/交互配置）做成 echarts-map 的多个 examples。

### 产出物位置（新约定）

- 机器产物（脚本扫描的原始数据、归类表）→ `../research/`（`2026-11-04-business-module-shape.{json,md}`），不内联进任务卡/台账
- 台账「二」只保留：四档标注 + 指向 research 产物的链接 + 人工决策记录
- **跨项目约定**：research/ 产物保留供后续项目对比（代码一致/相似模块识别），换项目时新脚本读取既有产物做 diff

## 功能列表

- F1：扫描脚本 `scan-business-module-shape.mjs`（scripts/，Node 内置 API，读取各模块 import 依赖 + UI 结构特征，输出 json）
- F2：归类分析 `research/2026-11-04-business-module-shape.md`（每模块：UI 形态、底层依赖、相似聚类、建议档位 + 理由）
- F3：归类建议表 md（四档结构，细粒度：不再按 section-left/right 分组）——本任务唯一规划载体
- F4：C 档与地图专项在归类表标注归属物料

## 不做清单

- 不在本卡内执行任何蒸馏（B/C 档仅出建议，后续逐卡立项过硬门槛①）
- 不修改已有物料产物（examples 补充属后续卡）
- 不回写原台账 002（已归档，规划源为 research 归类表）
- 不人工逐文件精读 37 个模块（脚本扫描 + 抽样精读校验，抽样率 ~20%）

---

## 步骤（执行计划）

### 步骤 1：脚本扫描

- **动作**：写 scan-business-module-shape.mjs → 产 json（模块 × {文件、import 依赖、UI 组件使用、echarts option 特征}）
- **输出**：`../research/2026-11-04-business-module-shape.json`
- **等待用户**：否

### 步骤 2：归类分析 + 抽样校验

- **动作**：基于 json 聚类相似模块；抽 ~7 个模块精读校验脚本结论（防止误判 A/D 档）
- **输出**：`../research/2026-11-04-business-module-shape.md`（含每档建议清单）
- **等待用户**：是（归类建议表交用户审定档位边界，硬门槛①的细化审批）

### 步骤 3：归类表定稿

- **动作**：按审定意见把档位决策回写 research 归类 md（定稿版，作为后续蒸馏立项的唯一规划源；原台账 002 已归档，不再回写）
- **输出**：`../research/2026-11-04-business-module-shape.md` 定稿
- **等待用户**：是（硬门槛②）

---

## 验收 checklist

- [x] A1：research/ 目录与 README 就位，脚本产物入 research（不内联台账）
- [x] A2：37+ 模块全部有档位标注与理由，无「未分类」
- [x] A3：抽样校验模块（≥7 个）档位与人工精读结论一致
- [x] A4：归类表定稿，四档结构清晰可分工（规划源唯一：research md）
- [x] A5：C 档/地图系标注归属物料（2026-11-05 修正：map-gis 实测为真 GIS，独立于 echarts 体系，归搁置档；地图专项仅 map-view ×3 + map → echarts-map examples）

---

## 审批记录（硬门槛）

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-04 | 用户 |
| ② 实现验收 | 已通过（4 项决策全定稿） | 2026-11-05 | 用户 |

---

## 进度日志（按需追加）

### 2026-11-04

- 建卡。新增 research/ 目录约定（脚本产物与任务卡分离，跨项目保留可对比）。
- 步骤 1 完成：scan-business-module-shape.mjs 扫描 40 模块（比台账多发现 1 个 modal section），json 入 research。
- 步骤 2 完成：聚类分析 + 7 模块抽样精读校验（5 成立 / 2 修正：duty-table→D、network-conditions→A）；归类建议表产出（research md）。**待用户审定四档边界**。

### 2026-11-05

- 步骤 3 完成：用户 4 项决策定稿（四档边界认可 / map-gis 单独评估→搁置 / info 五件拆分 / 后续补精读）。map-gis 实测：依赖 fedx-gis（OpenLayers 6.9 + Cesium 1.100），非 echarts 体系，归搁置档。
- 归类表定稿为业务模块蒸馏唯一规划源，含 6 步立项队列。任务完成，归档。

---

## 关联

> - 前任（已归档）：`./task-2026-11-03-002-component-inventory.md`（同 done/2026-11/）
> - research 产物：`../research/2026-11-04-business-module-shape.md`（定稿）
> - 脚本：`../scripts/scan-business-module-shape.mjs`
