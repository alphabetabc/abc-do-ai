# Task · 2026-11-06-021-hot-business-distill

> HotBusiness 热点业务 蒸馏为物料站四件套。tier=B（定档记录：research/materials.db module_survey #16，distill_status=queued）。台账母任务：./task-2026-11-03-002-component-inventory.md

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-06-021-hot-business-distill` |
| Status | 已完成 |
| 类型 | docs |
| 影响范围 | `docs/materials/components/business/hot-business/`（新增四件套）、台账「二」备注列回填 |
| Roadmap | 阶段 3（业务模块蒸馏） |
| 验收标准 | 四件套齐全、category=business、`pnpm build` 通过、examples 在 dev:preview 可渲染且无 console error |
| 前置依赖 | research 定档结论；无 |

---

## 目标（Goal）

把源模块 HotBusiness 热点业务 蒸馏为物料站模块 `docs/materials/components/business/hot-business/`（零外部新依赖、不跨模块 import、业务数据 mock 化）。

## 源码位置
  - `web/pages/five-major-center/comprehensive-display-center/modules/section-left/hot-business`

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
- 不分发字体二进制（font-family 声明可保留）
- 图片素材放 `examples/` 下随示例分发（用户 2026-11-06 纠正：素材归 examples，code/ 保持零静态资源）

---

## 步骤（执行计划）

### 步骤 1：源码精读 + 四件套产出
- **输出**：`docs/materials/components/business/hot-business/`
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
| ① 需求审批 | 已批准 | 2026-11-06 | 用户 |
| ② 实现验收 | 已通过 | 2026-11-06 | user（对话批准「收官 020—022，没有问题就归档」） |

---

## 进度日志（按需追加）

### 2026-11-06

- 建卡（脚本批量生成，依据 research 定档 B 档）。
- 精读源码（3 文件：index.tsx / AppTopView.tsx / index.less），确认 B 档无误判。蒸馏要点：useRequest+Box 剥离改 Props 化；antd Flex→div+CSS；AppTopView 补 TS 类型；图片素材处置经用户两次澄清定案：放 `examples/` 下随示例分发，code/ 保持零静态资源；字体 D-DIN-PRO 仅保留声明。

### 2026-11-06（实现完成，待验收）

- 门槛①批准，Status → 进行中。
- 落盘路径修正：任务卡原文写 `docs/materials/components/business/hot-business/`，仓库实际约定（根 AGENTS.md 与全部既有物料）为 `docs/materials/business/hot-business/`，按实际约定落盘。
- 四件套产出：manifest（category=business）/ spec.md / data-model.md / code（index.tsx + index.less，Box 壳内联、antd Flex→div+CSS、useRequest+getHotBusinessApi 剥离改 `dataSource` Props 化、app-top-{1,2,3}.svg 底座改 CSS 渐变等价、图标 `<img>` 改 `icon?: ReactNode`、D-DIN-PRO 仅保留声明）/ examples（basic + dynamic，3s setInterval 模拟轮询）。图片素材未随 examples 分发：底座已 CSS 等价、图标走内联 SVG，无二进制可分发（此前「素材放 examples」的决定未被触发）。
- 验证：`pnpm build`（tsc + vite）通过；dev:preview 浏览器实测 PASS（basic 结构/样式正确、dynamic 数值 3s 刷新、console 无 error/warning）。
- 用户反馈 dynamic 示例丑 → 定位为示例参数问题（width=380 + 单组，48% 组宽 ≈163px 装不下 3 个指标位约 208px，右侧裁切、文字拥挤，且与 basic 723px 不协调）→ dynamic 改为与 basic 同尺寸两组、仅数值动 → 浏览器复验 PASS（无裁切/溢出、3s 刷新、console 无 error）。组件本身未改。
- 收官（硬门槛②通过）：`pnpm build` 复跑 ✅、台账「二」hot-business（comprehensive-display-center）备注回填、归档 done/2026-11/。

---

## 关联

> - 台账母任务：./task-2026-11-03-002-component-inventory.md
> - 定档记录：research/materials.db（module_survey #16，distill_status=queued，人工审定档与理由见 reason 列）
