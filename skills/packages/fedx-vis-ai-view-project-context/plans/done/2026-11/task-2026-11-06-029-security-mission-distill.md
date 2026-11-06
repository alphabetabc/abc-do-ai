# Task · 2026-11-06-029-security-mission-distill

> SecurityMission 安保任务 蒸馏为物料站四件套。tier=B（定档记录：research/materials.db module_survey #38，distill_status=queued）。台账母任务：./task-2026-11-03-002-component-inventory.md

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-06-029-security-mission-distill` |
| Status | 已完成 |
| 类型 | docs |
| 影响范围 | `docs/materials/components/business/security-mission/`（新增四件套）、台账「二」备注列回填 |
| Roadmap | 阶段 3（业务模块蒸馏） |
| 验收标准 | 四件套齐全、category=business、`pnpm build` 通过、examples 在 dev:preview 可渲染且无 console error |
| 前置依赖 | research 定档结论；无 |

---

## 目标（Goal）

把源模块 SecurityMission 安保任务 蒸馏为物料站模块 `docs/materials/components/business/security-mission/`（零外部新依赖、不跨模块 import、业务数据 mock 化）。

## 源码位置
  - `web/pages/gd-emergency-support/modules/section-left/security-mission`

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
- **输出**：`docs/materials/components/business/security-mission/`
- **等待用户**：否

### 步骤 2：验证
- **动作**：`pnpm build` + `pnpm dev:preview` 渲染验证（无 console error）
- **等待用户**：否

### 步骤 3：回填与归档
- **动作**：台账「二」备注回填；更新 current-sprint；归档本卡
- **等待用户**：是（硬门槛②）

---

## 验收 checklist

- [x] A1：四件套齐全，manifest category=business
- [x] A2：code/ 可直接 import，无跨模块/未声明依赖
- [x] A3：`pnpm build` 通过
- [x] A4：examples 渲染正常，无 console error（浏览器实测 PASS，截图见浏览器代理报告）
- [x] A5：台账「二」对应条目备注已更新

---

## 审批记录（硬门槛）

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-06 | user（对话：「蒸馏 开工」） |
| ② 实现验收 | 已验收 | 2026-11-06 | user（对话：「归档」） |

---

## 进度日志（按需追加）

### 2026-11-06

- 建卡（脚本批量生成，依据 research 定档 B 档）。
- 硬门槛①通过（对话批准），源码精读：外壳 Box(400×276) + MissionItem（政府/省际级别大数字 + 市级四级占比条形 + 前端聚合）。
- 四件套产出于 `docs/materials/business/security-mission/`（注意：卡内原写 `components/business/` 为建卡脚本笔误，实际分组按仓库既有结构 `business/`）：
  - manifest.json：category=business，name「SecurityMission 保障任务」
  - code/MissionItem.tsx：Props 化（governmentLevel / provincialLevel / cityRows），聚合逻辑 useMemo 内置，antd Tooltip → 原生 title，request/useEnvironment/Box/useRequest 全剥离
  - examples：basic（静态 8 城市数据）+ dynamic（2s 推进响应等级模拟轮询）
  - spec.md / data-model.md：Props 表、聚合契约、源接口 → Props 映射、零依赖声明
- `pnpm build` 通过（MissionItem chunk 产出）；dev:preview 浏览器实测两个示例渲染正常、动态示例周期变化、console 无站点 error。
- 硬门槛②通过（「归档」），A5 台账回填完成，Status → 已完成，归档至 `plans/done/2026-11/`。

---

## 关联

> - 台账母任务：./task-2026-11-03-002-component-inventory.md
> - 定档记录：research/materials.db（module_survey #38，distill_status=queued，人工审定档与理由见 reason 列）
