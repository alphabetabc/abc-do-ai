# Task · 2026-11-06-032-components-gd-modal-distill

> gd-emergency-support modal 子组件聚合 蒸馏为物料站四件套。tier=B（定档记录：research/materials.db module_survey #33，distill_status=shelved）。台账母任务：../../done/2026-11/task-2026-11-03-002-component-inventory.md

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-06-032-components-gd-modal-distill` |
| Status | 已拒绝（精读后不蒸馏） |
| 类型 | docs |
| 影响范围 | `docs/materials/components/business/components-gd-modal/`（新增四件套）、台账「二」备注列回填 |
| Roadmap | 阶段 3（业务模块蒸馏） |
| 验收标准 | 四件套齐全、category=business、`pnpm build` 通过、examples 在 dev:preview 可渲染且无 console error |
| 前置依赖 | research 定档结论 |

---

## 目标（Goal）

把源模块 gd-emergency-support modal 子组件聚合 蒸馏为物料站模块 `docs/materials/components/business/components-gd-modal/`（零外部新依赖、不跨模块 import、业务数据 mock 化）。源目录名 components，蒸馏时按实际内容拆分命名。

## 源码位置

- `web/pages/gd-emergency-support/modules/modal/components`

## 功能列表

- F1：manifest.json（category=business）
- F2：spec.md（Props 表 + 交互说明）
- F3：data-model.md（类型 + 数据契约 + mock 数据结构）
- F4：code/（源码蒸馏；@fedx-web-common 工具内联或改用 lodash-es；请求层 mock 化）
- F5：examples/（≥2 个：基础 + 数据动态变化）

## 不做清单

- 不新增 npm 依赖（echarts/antd 等物料站已有除外，逐项核对）
- 不跨模块 import（含已有 ui/rc-echarts/business 物料）
- 不搬真实接口地址与密钥类内容
- 不分发字体/图片二进制（CSS 声明可保留）

---

## 步骤（执行计划）

### 步骤 1：源码精读 + 四件套产出
- **输出**：`docs/materials/components/business/components-gd-modal/`
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
| ① 需求审批 | 已拒绝（精读后不蒸馏） | 2026-11-06 | user |
| ② 实现验收 | 不适用（未进入实现） |  |  |

---

## 进度日志（按需追加）

### 2026-11-06

- 建卡（补建：首轮批量建卡遗漏的 B 档项）。
- 精读源码（modal/components 全量：NetworkConditionsModal + RowIndicators/TrendChart/BarChart/DetailTable + ModalWidgets/Context，约 800 行）后判定不蒸馏（user 确认关闭）：
  - 本质是「下钻详情抽屉」模式而非物料：Drawer + 指标条 + 折线/柱状双图 + 明细表的四级联动（指标 → 时间点 → 柱选中 → 表格参数），子区域全部是 antd/echarts 基础拼接，无可独立复用 UI。
  - 可复用价值只有两点且是模式级而非物料级：弹窗参数契约（open/info/onClose 从图元携带上下文）与「交互后清下游、参数逐级收窄」的联动状态机；硬蒸馏等于花大工作量搬运不可复用的皮（4 个接口 mock 化 + 4 个子组件）。
  - 处置：不产四件套、不建 `components-gd-modal` 目录；materials.db #33 distill_status 更新为 shelved。联动详情模式如需沉淀，另立「模式文档」类任务，不挂本卡。

---

## 关联

> - 台账母任务：../../done/2026-11/task-2026-11-03-002-component-inventory.md
> - 定档记录：research/materials.db（module_survey #33，distill_status=shelved，关闭理由见 reason 列）
