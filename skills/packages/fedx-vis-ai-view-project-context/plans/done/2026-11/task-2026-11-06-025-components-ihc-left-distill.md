# Task · 2026-11-06-025-components-ihc-left-distill

> InformationHub 左侧子组件聚合 蒸馏为物料站四件套。tier=B（定档记录：research/materials.db module_survey #23，distill_status=queued）。台账母任务：./task-2026-11-03-002-component-inventory.md

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-06-025-components-ihc-left-distill` |
| Status | 已拒绝（A 档已覆盖） |
| 类型 | docs |
| 影响范围 | `docs/materials/components/business/components-ihc-left/`（新增四件套）、台账「二」备注列回填 |
| Roadmap | 阶段 3（业务模块蒸馏） |
| 验收标准 | 四件套齐全、category=business、`pnpm build` 通过、examples 在 dev:preview 可渲染且无 console error |
| 前置依赖 | research 定档结论；无 |

---

## 目标（Goal）

把源模块 InformationHub 左侧子组件聚合 蒸馏为物料站模块 `docs/materials/components/business/components-ihc-left/`（零外部新依赖、不跨模块 import、业务数据 mock 化）。

## 源码位置
  - `web/pages/five-major-center/information-hub-center/modules/section-left/components`
- ⚠️ 备注：源目录名 components，蒸馏时按实际内容拆分命名
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
- **输出**：`docs/materials/components/business/components-ihc-left/`
- **等待用户**：否

### 步骤 2：验证
- **动作**：`pnpm build` + `pnpm dev:preview` 渲染验证（无 console error）
- **等待用户**：否

### 步骤 3：回填与归档
- **动作**：台账「二」备注回填；更新 current-sprint；归档本卡
- **等待用户**：是（硬门槛②）

---

## 验收 checklist

- [ ] A1：四件套齐全，manifest category=business
- [ ] A2：code/ 可直接 import，无跨模块/未声明依赖
- [ ] A3：`pnpm build` 通过
- [ ] A4：examples 渲染正常，无 console error
- [ ] A5：台账「二」对应条目备注已更新

---

## 审批记录（硬门槛）

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已拒绝（A 档已覆盖） | 2026-11-06 | user |
| ② 实现验收 | 不适用（未进入实现） |  |  |

---

## 进度日志（按需追加）

### 2026-11-06

- 建卡（脚本批量生成，依据 research 定档 B 档）。
- 精读源码 5 个子组件并与物料站对账，发现能力已 100% 覆盖，按 A 档处置关闭（用户确认）：
  - IndicatorView → `docs/materials/business/indicator-view/`（spec 明写源自 information-hub-center 左右 section 合并双版）
  - DispatchProgress → `docs/materials/business/dispatch-progress/`
  - DetailTable → `docs/materials/business/detail-table/`
  - ChartBarPie / ChartPie → `docs/materials/business/chart-bar-pie/`（chart-pie 已收编为 `examples/chart-pie-variant.tsx`）
- 不产四件套、不建 `components-ihc-left` 目录；materials.db #23 distill_status 更新为 covered。

---

## 关联

> - 台账母任务：../../done/2026-11/task-2026-11-03-002-component-inventory.md
> - 定档记录：research/materials.db（module_survey #23，distill_status=covered，定档与关闭理由见 reason 列）
