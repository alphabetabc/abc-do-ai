# Task · 2026-11-06-030-network-conditions-distill

> NetworkConditions 网络状况 蒸馏为物料站四件套。tier=B（定档记录：research/materials.db module_survey #40，distill_status=queued）。台账母任务：./task-2026-11-03-002-component-inventory.md

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-06-030-network-conditions-distill` |
| Status | 进行中（已实现，待验收②） |
| 类型 | docs |
| 影响范围 | `docs/materials/components/business/network-conditions/`（新增四件套）、台账「二」备注列回填 |
| Roadmap | 阶段 3（业务模块蒸馏） |
| 验收标准 | 四件套齐全、category=business、`pnpm build` 通过、examples 在 dev:preview 可渲染且无 console error |
| 前置依赖 | research 定档结论；无 |

---

## 目标（Goal）

把源模块 NetworkConditions 网络状况 蒸馏为物料站模块 `docs/materials/components/business/network-conditions/`（零外部新依赖、不跨模块 import、业务数据 mock 化）。

## 源码位置
  - `web/pages/gd-emergency-support/modules/section-right/network-conditions`

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
- **输出**：`docs/materials/components/business/network-conditions/`
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
| ① 需求审批 | 已批准（对话「继续」） | 2026-11-06 | user |
| ② 实现验收 | 已通过（对话「归档」） | 2026-11-06 | user |

---

## 进度日志（按需追加）

### 2026-11-06

- 建卡（脚本批量生成，依据 research 定档 B 档）。
- 精读源码（index + IndView1/2/3 + 4 个 less），确认 B 档成立：未被 network-impact-situation / indicator-view 覆盖，无白名单依赖。
- 四件套产出：`docs/materials/business/network-conditions/`（code/index.tsx + IndView1/2/3.tsx + index.less；examples basic/dynamic）。
- 蒸馏映射：useRequest+getNetworkSituationApi → `data` Props；modalContext.showModal → `onIndicatorClick` 回调；useEnvironment/TIME_RANGE/Box → 剥离/内联面板壳；dayjs → 内联 Date 格式化；classnames → 模板字符串；isEmpty → lodash-es。数据契约字段名（g1-left…g5）与源接口保持一致。
- 踩坑：IndView3 空首项 `?? {}` 不满足 tsc strict，改 `?? ({ label_format: '', value: '' } as IndicatorItem)`。
- 验证：`pnpm build` 通过（36.5s）；dev:preview 浏览器实测 PASS（872px 面板、五分区渲染、basic 点击回调、dynamic 3s 刷新生效、console 无 error）。
- 回填：台账「二」network-conditions 备注列；current-sprint 标注待验收②。
- 硬门槛②通过，归档至 done/2026-11/，卡内引用改 `../../`。

---

## 关联

> - 台账母任务：./task-2026-11-03-002-component-inventory.md（同目录）
> - 定档记录：research/materials.db（module_survey #40，distill_status=queued，人工审定档与理由见 reason 列）
