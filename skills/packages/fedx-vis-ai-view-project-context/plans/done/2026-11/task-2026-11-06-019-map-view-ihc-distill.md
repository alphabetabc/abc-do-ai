# Task · 2026-11-06-019-map-view-ihc-distill

> MapView（information-hub 版） 蒸馏为物料站四件套。tier=C（定档记录：research/materials.db module_survey #21，distill_status=queued）。台账母任务：./task-2026-11-03-002-component-inventory.md

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-06-019-map-view-ihc-distill` |
| Status | 已完成（降级处置） |
| 类型 | docs |
| 影响范围 | `docs/materials/components/rc-echarts/echarts-map/examples/info-card-overlay.tsx`（新增 example，降级处置）；台账「二」备注列回填 |
| Roadmap | 阶段 3（业务模块蒸馏） |
| 验收标准 | echarts-map 新增 info-card-overlay example；`pnpm build` 通过；example 在 dev:preview 可渲染、点击弹出/刷新更新/关闭全链路正常且无 console error |
| 前置依赖 | research 定档结论；多版本源码均已勘察 |

---

## 目标（Goal）

~~把源模块 MapView（information-hub 版） 蒸馏为物料站模块 `docs/materials/components/business/map-view-ihc/`~~

**降级处置（2026-11-06，卡内预留路径）**：勘察确认 MapGeo 核心即 `EChartsMap + OverlayItem`，通用能力已由 echarts-map 物料覆盖；「独有」部分重心是业务配置（SVG 图标 URL、五分类枚举、轮询、useBoxContext 联动），不构成独立物料。唯一有复用价值的结构——info-card（点击弹出 + convertToPixel 跟随 + 底部智能翻转 + 数据刷新重定位）——以 echarts-map example 形式下沉：`docs/materials/components/rc-echarts/echarts-map/examples/info-card-overlay.tsx`。不新建独立模块。

## 源码位置
  - `web/pages/five-major-center/information-hub-center/modules/center/map-view`
- ⚠️ 备注：information-hub-center 专版 map-view；与 echarts-map 物料的边界：通用能力不重复蒸馏，仅抽该版独有挂件/图层结构；若勘察后判断可全部下沉为 echarts-map examples，则在卡内记录并降级处置
## 功能列表

- F1：manifest.json（category=business）
- F2：spec.md（Props 表 + 交互说明）
- F3：data-model.md（类型 + 数据契约 + mock 数据结构）
- F4：code/（源码蒸馏；@fedx-web-common 工具内联或改用 lodash-es；请求层 mock 化）
- F5：examples/（≥2 个：基础 + 数据动态变化）

## 不做清单

- 不新增 npm 依赖（echarts/antd 等物料站已有除外，逐项核对）
- 不跨模块 import（含已有 ui/rc-echarts 物料）
- 不搬真实接口地址与密钥类内容
- 不分发字体/图片二进制（CSS 声明可保留）

---

## 步骤（执行计划）

### 步骤 1：源码精读 + 四件套产出
- **输出**：`docs/materials/components/business/map-view-ihc/`
- **等待用户**：否

### 步骤 2：验证
- **动作**：`pnpm build` + `pnpm dev:preview` 渲染验证（无 console error）
- **等待用户**：否

### 步骤 3：回填与归档
- **动作**：台账「二」备注回填；更新 current-sprint；归档本卡
- **等待用户**：是（硬门槛②）

---

## 验收 checklist

- [x] A1：echarts-map 新增 `examples/info-card-overlay.tsx`（覆盖原 F1-F5 的降级等价物）
- [x] A2：example 仅依赖同模块 `code/`，无跨模块 import、无新 npm 依赖
- [x] A3：`pnpm build` 通过（3496 modules）
- [x] A4：浏览器验证 PASS——点击点位弹卡、刷新数据原位更新数值、✕ 关闭、无 console error
- [x] A5：台账「二」对应条目备注已更新

---

## 审批记录（硬门槛）

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准（口头：同意作为 example 下沉） | 2026-11-06 | user |
| ② 实现验收 | 已验收（2026-11-06 用户口头验收后指示归档） | 2026-11-06 | user |

---

## 进度日志（按需追加）

### 2026-11-06

- 建卡（脚本批量生成，依据 research 定档 C 档）。
- 源码勘察：确认 MapGeo ≈ EChartsMap + OverlayItem + 业务配置，与用户确认走降级路径（echarts-map example 下沉）。
- 新增 `examples/info-card-overlay.tsx`；spec.md 示例清单同步。
- 浏览器验证发现两 bug 并修复：① componentSubType 只认 `scatter` 漏 `effectScatter`；② 物料 `map.tsx` click 闭包 stale（onClick 改存 ref），示例侧 activeSite 改从最新 sites 派生。复验全链路 PASS。
- 附带处理：business 目录上移到 materials 一层（全仓零引用影响，build 验证通过）；根 AGENTS.md 目录结构与 glob 描述同步更新。

---

## 关联

> - 台账母任务：./task-2026-11-03-002-component-inventory.md
> - 定档记录：research/materials.db（module_survey #21，distill_status=queued，人工审定档与理由见 reason 列）
