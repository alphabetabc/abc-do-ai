# Task · 2026-11-06-020-network-impact-situation-distill

> NetworkImpactSituation 网络影响态势 蒸馏为物料站四件套。tier=B（定档记录：research/materials.db module_survey #8，distill_status=queued）。台账母任务：./task-2026-11-03-002-component-inventory.md

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-06-020-network-impact-situation-distill` |
| Status | 已完成 |
| 类型 | docs |
| 影响范围 | `docs/materials/components/business/network-impact-situation/`（新增四件套）、台账「二」备注列回填 |
| Roadmap | 阶段 3（业务模块蒸馏） |
| 验收标准 | 四件套齐全、category=business、`pnpm build` 通过、examples 在 dev:preview 可渲染且无 console error |
| 前置依赖 | research 定档结论；无 |

---

## 目标（Goal）

把源模块 NetworkImpactSituation 网络影响态势 蒸馏为物料站模块 `docs/materials/components/business/network-impact-situation/`（零外部新依赖、不跨模块 import、业务数据 mock 化）。

## 源码位置
  - `web/pages/five-major-center/cmd-dispatcher-center/modules/section-right/network-impact-situation`
- ⚠️ 备注：低置信（0.5），实现前先精读确认档位，误判则回退上报
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
- **输出**：`docs/materials/components/business/network-impact-situation/`
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
- [x] A4：examples 渲染正常，无 console error
- [x] A5：台账「二」对应条目备注已更新

---

## 审批记录（硬门槛）

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 通过 | 2026-11-06 | 用户（对话批准「执行task20」「好开始吧」） |
| ② 实现验收 | 已通过 | 2026-11-06 | user（对话批准「收官 020—022，没有问题就归档」） |

---

## 进度日志（按需追加）

### 2026-11-06

- 建卡（脚本批量生成，依据 research 定档 B 档）。
- 精读源码（index.tsx / trend.tsx / trendBar.tsx / ItemCard.tsx / index.less，.bak 为历史版本不蒸馏），**确认 B 档成立，低置信疑虑解除**。蒸馏要点：useRequest（3 处轮询/refreshDeps）+ Box + services 全剥离，数据 Props 化（data / trendData / barData）；@fedx-web-common chunk/isEmpty/isNil→lodash-es；echarts 直接依赖（物料站已有）；antd Carousel 保留（物料站已有 antd，detail-table 先例）；ItemCard.tsx 属另一形态（emerEventTypeName 事件维度）且未被 index 引用，**不纳入本次蒸馏**；trend/trendBar 的 useEffect 手动 init/dispose 蒸馏时保持源逻辑。门槛①用户对话批准。
- 实现完成：四件套落 `docs/materials/business/network-impact-situation/`；验证通过（`pnpm build`，2026-11-06 收官复跑 ✅）。此前实现会话未回填本卡，本次收官补记。
- 收官（硬门槛②通过）：checklist 全勾、台账「二」network-impact-situation（cmd-dispatcher-center）备注回填、归档 done/2026-11/。

---

## 关联

> - 台账母任务：./task-2026-11-03-002-component-inventory.md
> - 定档记录：research/materials.db（module_survey #8，distill_status=queued，人工审定档与理由见 reason 列）
