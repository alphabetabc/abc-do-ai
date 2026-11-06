# Task · 2026-11-06-022-guarantee-business-distill

> GuaranteeBusiness 保障业务 蒸馏为物料站四件套。tier=B（定档记录：research/materials.db module_survey #18，distill_status=queued）。台账母任务：./task-2026-11-03-002-component-inventory.md

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-06-022-guarantee-business-distill` |
| Status | 已完成 |
| 类型 | docs |
| 影响范围 | `docs/materials/components/business/guarantee-business/`（新增四件套）、台账「二」备注列回填 |
| Roadmap | 阶段 3（业务模块蒸馏） |
| 验收标准 | 四件套齐全、category=business、`pnpm build` 通过、examples 在 dev:preview 可渲染且无 console error |
| 前置依赖 | research 定档结论；无 |

---

## 目标（Goal）

把源模块 GuaranteeBusiness 保障业务 蒸馏为物料站模块 `docs/materials/components/business/guarantee-business/`（零外部新依赖、不跨模块 import、业务数据 mock 化）。

## 源码位置
  - `web/pages/five-major-center/comprehensive-display-center/modules/section-right/guarantee-business`

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
- **输出**：`docs/materials/components/business/guarantee-business/`
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
- [x] A3：`pnpm build` 通过（tsc -b && vite build ✅）
- [x] A4：examples 渲染正常，无 console error（浏览器代理验证 PASS）
- [x] A5：台账「二」对应条目备注已更新（归档时随台账母任务批量回填 → 2026-11-06 收官已回填）

---

## 审批记录（硬门槛）

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-06 | user（对话确认：图片放 examples、env 转 Props 保留 env 样式、dayjs 新增依赖） |
| ② 实现验收 | 已通过 | 2026-11-06 | user（对话批准「收官 020—022，没有问题就归档」） |

---

## 进度日志（按需追加）

### 2026-11-06

- 建卡（脚本批量生成，依据 research 定档 B 档）。
- 硬门槛①批准，口径调整（用户对话确认）：
  1. 图片二进制**允许随模块分发**（源模块本地的 `app-icon-bottom-bg.png` 复制到 `examples/assets/`；外部服务图片 `IMAGE_PATH/icons/*.svg` 仍不搬，走 icon Props / CSS 占位）。修正原「不分发字体/图片二进制」的绝对口径。
  2. `envComprehensiveDisplayCenter.guaranteeBusiness` 配置整体 **Props 化**（appIconList / indViewSettings），保留 env 缺省行为（未传用内置默认值）。
  3. 请求层照常剥离，图表数据 `chartData` Props 化。
  4. 新增依赖 dayjs（用户自行安装；仅用于 HH:mm 格式化）。
  5. 产出路径按仓库现有惯例落 `docs/materials/business/guarantee-business/`（任务卡原文 `components/business/` 与现存业务物料目录不符，以现有惯例为准）。
- antd Carousel/Flex、echarts-for-react、lodash-es 均为物料站既有依赖，直接使用。
- 产出 `docs/materials/business/guarantee-business/`：manifest / spec / data-model / code（index + AppIconView + IndView + IndViewChart + types + index.less）/ examples（basic + dynamic + assets/app-icon-bottom-bg.png）。
- 蒸馏实现要点：
  - `Box` → 模块内 `guarantee-business--root` 容器壳（header + content，源样式保留）。
  - env → Props（appIconList / indViewSettings / iconBottomBg），缺省值 = 源内置默认（28 App 名单 + 两组 presets），数据合并逻辑与源一致（indicatorName/indicatorUnit 接口优先）。
  - `useRequest` + services 剥离 → `chartData` Props；IndViewChart 补齐 TS 类型。
  - 外部 `IMAGE_PATH` 图标不分发：`AppIconItem.icon` Props，缺省前两字文字占位；底座 png 经 `iconBottomBg` Props 由 examples 传入，缺省 CSS radial-gradient 等价。
- 踩坑：
  1. antd v6 `Carousel` 的 `dotPosition` 已弃用（console 警告）→ 改 `dotPlacement="end"`（v6 枚举为 top/bottom/start/end）。
  2. `prevArrow/nextArrow` 直接写 `<div className/>` 会透传 react-slick 的 `currentSlide/slideCount` 到 DOM（React 警告）→ 抽成 `PrevArrow/NextArrow` 组件。
  3. tsc 增量缓存出现陈旧报错（指向未提交的 WIP 模块 network-impact-situation），`tsc -b --force` 全量重跑即通过，非真实错误。
- 验证：`pnpm build` ✅；浏览器代理验证 PASS（详情页四标签、两示例 14 canvas、dynamic 3s 刷新稳定、无 console error）。
- 收官（硬门槛②通过）：`pnpm build` 复跑 ✅、台账「二」guarantee-business（comprehensive-display-center）备注回填、归档 done/2026-11/。

---

## 关联

> - 台账母任务：./task-2026-11-03-002-component-inventory.md
> - 定档记录：research/materials.db（module_survey #18，distill_status=queued，人工审定档与理由见 reason 列）
