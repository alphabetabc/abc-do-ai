# Task · 2026-11-06-024-network-scale-distill

> NetworkScale 网络规模 蒸馏为物料站四件套。tier=B（定档记录：research/materials.db module_survey #20，distill_status=queued）。台账母任务：./task-2026-11-03-002-component-inventory.md

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-06-024-network-scale-distill` |
| Status | 已完成（2026-11-06 硬门槛②通过，与 023 联合归档） |
| 类型 | docs |
| 影响范围 | `docs/materials/components/ui/ui-indicator-carousel/`（合并物料四件套）、台账「二」备注列回填 |
| Roadmap | 阶段 3（业务模块蒸馏） |
| 验收标准 | 四件套齐全、category=business、`pnpm build` 通过、examples 在 dev:preview 可渲染且无 console error |
| 前置依赖 | research 定档结论；无 |

---

## 目标（Goal）

把源模块 NetworkScale 网络规模 蒸馏为物料站模块 `docs/materials/components/business/network-scale/`（零外部新依赖、不跨模块 import、业务数据 mock 化）。

## 源码位置
  - `web/pages/five-major-center/comprehensive-display-center/modules/section-right/network-scale`

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
- **输出**：`docs/materials/components/business/network-scale/`
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
- [x] A5：台账「二」对应条目备注已更新（network-scale / network-quality 两行均回填合并物料指向）

---

## 审批记录（硬门槛）

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-06 | user |
| ② 实现验收 | 已通过 | 2026-11-06 | user（「023 024 归档」；随 023 合并物料 ui-indicator-carousel 统一验收） |

---

## 进度日志（按需追加）

### 2026-11-06

- 建卡（脚本批量生成，依据 research 定档 B 档）。
- 用户批准门槛①，Status → 已批准。
- 源码精读（单文件组件，无子组件）：顶部分类 tab 带主指标（children[0] 上翻）+ 底部 antd Carousel（一屏 7 张）；处置点：classnames→模板字符串、isEmpty→lodash-es、useRequest/services→Props 化、Box/DataStatus 剥离、6 张 png 图标与 svg/png 背景→CSS 渐变/文字符号块。参照同源物料 business/network-quality 约定产出。
- 产出四件套 `docs/materials/business/network-scale/`（manifest / spec / data-model / code / examples×2）。
- 验证：`pnpm build` 通过；dev:preview 浏览器实测 PASS（检索、两示例渲染、tab 切换、动态数据轮换均正常，console 无 error；存在 antd Carousel 自定义箭头透传 currentSlide/slideCount 的已知 React 警告，与 network-quality 同模式，非 error）。
- 待门槛②：A5 台账回填 + current-sprint 移除 + 归档。
- **合并变更（用户指令「task23 和 task24 组件几乎一模一样 → 合并成一个 ui 组件」）**：与 task-023（NetworkQuality，结构相似度约 0.96）合并为通用物料 `docs/materials/components/ui/ui-indicator-carousel/`（category=indicator）。024 特有形态（tab 上翻主指标 children[0]、一屏 7 张）由 Props `showMainIndicator` / `mainIndicatorInCarousel` / `slidesToShow` 覆盖，examples/main-indicator.tsx 即本源形态。原 `docs/materials/business/network-scale/` 已删除。验证随 023 合并物料统一执行（`pnpm build` 通过、dev:preview PASS、console 无 error/warning）。本卡与 task-023 共同指向合并物料，待硬门槛②。
- 硬门槛②通过（「023 024 归档」），A5 台账回填完成，Status → 已完成，归档至 `plans/done/2026-11/`（与 023 联合归档，合并物料 `ui-indicator-carousel`）。

---

## 关联

> - 台账母任务：./task-2026-11-03-002-component-inventory.md
> - 定档记录：research/materials.db（module_survey #20，distill_status=queued，人工审定档与理由见 reason 列）
