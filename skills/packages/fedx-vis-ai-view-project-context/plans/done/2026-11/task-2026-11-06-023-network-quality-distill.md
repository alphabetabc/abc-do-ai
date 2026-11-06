# Task · 2026-11-06-023-network-quality-distill

> NetworkQuality 网络质量 蒸馏为物料站四件套。tier=B（定档记录：research/materials.db module_survey #19，distill_status=queued）。台账母任务：./task-2026-11-03-002-component-inventory.md

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-06-023-network-quality-distill` |
| Status | 已完成（2026-11-06 硬门槛②通过，与 024 联合归档） |
| 类型 | docs |
| 影响范围 | `docs/materials/components/ui/ui-indicator-carousel/`（合并物料四件套）、台账「二」备注列回填 |
| Roadmap | 阶段 3（业务模块蒸馏） |
| 验收标准 | 四件套齐全、category=business、`pnpm build` 通过、examples 在 dev:preview 可渲染且无 console error |
| 前置依赖 | research 定档结论；无 |

---

## 目标（Goal）

把源模块 NetworkQuality 网络质量 蒸馏为物料站模块 `docs/materials/components/business/network-quality/`（零外部新依赖、不跨模块 import、业务数据 mock 化）。

## 源码位置
  - `web/pages/five-major-center/comprehensive-display-center/modules/section-right/network-quality`

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
- **输出**：`docs/materials/components/business/network-quality/`
- **等待用户**：否

### 步骤 2：验证
- **动作**：`pnpm build` + `pnpm dev:preview` 渲染验证（无 console error）
- **等待用户**：否

### 步骤 3：回填与归档
- **动作**：台账「二」备注回填；更新 current-sprint；归档本卡
- **等待用户**：是（硬门槛②）

---

## 验收 checklist

- [x] A1：四件套齐全，manifest category=business（实际产出路径 `docs/materials/business/network-quality/`，与仓库存量物料结构一致；卡内原路径 `components/business/` 系建卡脚本笔误，以实际目录为准）
- [x] A2：code/ 可直接 import，无跨模块/未声明依赖（仅 antd Carousel + lodash-es isEmpty，均为物料站既有依赖）
- [x] A3：`pnpm build` 通过（tsc + vite 全量，2 次：首版 + 箭头修复后复验）
- [x] A4：examples 渲染正常，无 console error（浏览器实测 PASS：索引可见、tab 切换生效、dynamic 数值刷新、箭头可见、console 零 error 零 warning）
- [x] A5：台账「二」对应条目备注已更新（network-quality / network-scale 两行均回填合并物料指向）

---

## 审批记录（硬门槛）

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-06 | user（「通过 请执行」） |
| ② 实现验收 | 已通过 | 2026-11-06 | user（「023 024 归档」；合并物料 ui-indicator-carousel，样式修正 4 点复验通过） |

---

## 技术设计（回填）

- 改动点：新增 `docs/materials/business/network-quality/`（manifest.json / spec.md / data-model.md / code/index.tsx + index.less / examples/basic.tsx + dynamic.tsx）
- 内联映射（对照 distill-workflow §3）：
  - antd `Flex` → div + CSS flex；antd `Carousel` 保留（物料站既有依赖，源即用）
  - `classnames` → 模板字符串；`isEmpty`（@fedx-web-common/utils）→ lodash-es
  - `useRequest` + services 请求层（5min 轮询）→ Props 化，轮询职责上移调用方（dynamic 示例用 3s setInterval 模拟）
  - `Box` → 内联 box-title/box-content 面板；`FedxDataStatus` → 剥离（数据同步注入无 loading 态）
  - 源 svg/png 背景（tab 选中背景、指标卡背景）与 img 图标 → CSS 渐变 / 文字符号块等价实现，不分发二进制
- Props 面：`title` / `data`（NetworkQualityCategory[]）/ `personalBusinessData` / `style`，与源组件入参（data + personalBusinessData）一致
- 踩坑：antd Carousel 自定义 prevArrow/nextArrow 若用裸元素（`<div/>`）会收到 rc-carousel 注入的 `currentSlide` 等 props 触发 React DOM 属性警告 → 改用不接收 props 的函数组件（PrevArrow/NextArrow）吞掉，复验 console 干净

---

## 进度日志（按需追加）

### 2026-11-06

- 建卡（脚本批量生成，依据 research 定档 B 档）。
- 硬门槛①批准，进入阶段二：精读源码（comprehensive-display-center/modules/section-right/network-quality）→ 产出四件套 → `pnpm build` 通过（2 次）→ dev:preview 浏览器实测 PASS（tab 切换、轮播箭头、dynamic 刷新、console 干净）→ 任务卡回填。待硬门槛②。
- **合并变更（用户指令「task23 和 task24 组件几乎一模一样 → 合并成一个 ui 组件」）**：与 task-024（NetworkScale，结构相似度约 0.96）合并为一个通用物料 `docs/materials/components/ui/ui-indicator-carousel/`（category=indicator）。差异走 Props：`showMainIndicator`（tab 上翻主指标，024 形态）/ `mainIndicatorInCarousel`（主指标是否进轮播）/ `slidesToShow`（一屏张数，024 形态 7）。examples ×3（basic=023 形态 / main-indicator=024 形态 / dynamic）。原 `docs/materials/business/network-quality/` 已删除。验证：`pnpm build` 通过；dev:preview 浏览器实测 PASS（三示例渲染、tab 切换、动态刷新、console 无 error/warning；列表中 network-quality/network-scale 已消失）。本卡与 task-024 共同指向合并物料，待硬门槛②。
- **样式还原修正（用户反馈 4 点）**：① 补源共享 Box 容器特征——标题栏 44px/24px 白字/底部分隔线/半透明白底，根高度按形态默认 258/274；② 根宽度改 100%（源 1568 定宽超出站点容器）；③ 面板底回退深蓝渐变（用户认可初版）；④ tab 图标原图（quality 3 svg + scale 4 png）拷入 `examples/assets/`，`icon` 改 `React.ReactNode` 接收 `<img>`。另：tab 选中态按源 svg 还原为描边圆角矩形（绿/青），指标卡背景还原青绿横纹渐变。复验：build 通过、浏览器 5 项全 PASS、console 干净。
- 硬门槛②通过（「023 024 归档」），A5 台账回填完成，Status → 已完成，归档至 `plans/done/2026-11/`（与 024 联合归档，合并物料 `ui-indicator-carousel`）。

---

## 关联

> - 台账母任务：./task-2026-11-03-002-component-inventory.md
> - 定档记录：research/materials.db（module_survey #19，distill_status=queued，人工审定档与理由见 reason 列）
