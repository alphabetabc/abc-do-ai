# Task · 2026-10-09-003-shenzhen-communication-guarantee-skeleton

## 任务元信息

| 项       | 值                                                                                                                                                                                                                    |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 编号     | `task-2026-10-09-003-shenzhen-communication-guarantee-skeleton`                                                                                                                                                       |
| Status   | 已完成                                                                                                                                                                                                                |
| 类型     | 编码                                                                                                                                                                                                                  |
| 影响范围 | `web/pages/shenzhen-communication-guarantee/`（新建）、`public/static/mock/shenzhen-communication-guarantee/`（新建）                                                                                                 |
| Roadmap  | 2026 年深圳重要通信保障屏建设（PM 素材 2026-10）                                                                                                                                                                      |
| 验收标准 | 见下方验收 checklist（A1–A4）                                                                                                                                                                                         |
| 前置依赖 | 无（mock 先行）；后续 [task-2026-10-09-004](./task-2026-10-09-004-shenzhen-communication-guarantee-migrate.md)、[task-2026-10-09-005](./task-2026-10-09-005-shenzhen-communication-guarantee-new-widgets.md) 依赖本卡 |

---

## 目标（Goal）

搭建深圳重要通信保障大屏的**骨架屏（只做占位）**：可访问、可两屏切换、各区块按原型布局占位，**不含任何业务指标逻辑与真实取数**。

> 本卡由原 `task-2026-10-09-003-shenzhen-communication-guarantee-build` 拆分而来（变更记录见文末）。

---

## 步骤（执行计划）

### 步骤 1：屏壳与路由

- **动作**：从 info-management-bureau 物理复制 render/视图 screen 范式到 `web/pages/shenzhen-communication-guarantee/`；`LargeScreenEnv` designWidth/Height 改 **3840/2160**；标题「2026年深圳重要通信保障」；天气卡占位（固定深圳，mock 数据）
- **输出**：`render.tsx / render.less`、`share/presets.ts`（视图枚举 home/area）、`images/`（复制信管局视觉资产）
- **等待用户**：否

### 步骤 2：两屏手动切换

- **动作**：简化信管局 view-state 为**纯手动两屏切换**：SubPageView（常驻 DOM + opacity 切换）+ 左下角互斥菜单按钮（首页屏展开仅「重保区域」，区域屏展开仅「首页」）；**删除**自动轮换/日期判定/倒计时/今日赛程
- **输出**：`sub-pages/components/screen-switch/`、两视图空壳 screen
- **等待用户**：否

### 步骤 3：区块占位

- **动作**：按原型图（image_002/image_003）布局各区块**占位面板**（复用 container 面板容器，含区块标题、空内容占位），不做指标/地图/轮巡逻辑
- **输出**：两视图各 widget 占位模块（top-type-filter / chbn-business / center-map / area-business / emergency-resource / guarantee-log / area-carousel / network-business / preposition-resource 均为空壳）
- **等待用户**：是（硬门槛②验收：骨架可访问、可切换、布局对齐原型）

---

## 功能列表

- F1：`/shenzhen-communication-guarantee` 可访问，3840×2160 适配
- F2：屏标题 + 深圳天气占位
- F3：左下角按钮两屏互斥切换，无自动轮巡
- F4：两屏各区块占位（面板 + 标题 + 空内容）

## 不做清单

- 一切业务指标逻辑、接口取数、地图、轮巡、联动（属 004/005）
- 后端真实接口对接（接口未定，mock 先行）
- 信管局的自动轮换 / 倒计时 / 今日赛程

## 验收 checklist

- [x] A1：路由可访问，3840×2160 大屏引擎适配正常
- [x] A2：左下角按钮互斥菜单正确切换两屏，无自动轮巡
- [x] A3：两屏区块占位布局对齐原型图（image_002 / image_003；后续按设计稿坐标精调，见技术设计回填）
- [x] A4：`pnpm lint` 通过
- [x] `env/AGENTS.md` 声明的质量门槛命令已通过（`pnpm lint`）

## 技术设计（阶段二回填）

- 目录结构按 `design/modules/shenzhen-communication-guarantee/000-overview/README.md` §1–§4（骨架阶段各 widget 为空壳）
- 实际落地差异：
    - 天气卡为纯静态 mock（深圳/晴/26℃/优），未接接口；004 迁移 `getWeatherDataApi`（固定深圳地市）
    - `fields.ts` 已按设计声明 `areaTypeFilter` / `activeArea`（home）与空数组（area），仅字段声明，联动逻辑属 004/005
    - 区域屏 `network-business` 一套组件两份入口（`with-4g.tsx` / `with-5g.tsx`），按 `networkType` prop 区分
    - 视觉资产经脚本物理复制：`scripts/copy-shenzhen-skeleton-assets.js`（页面 images 2 项、screen-switch 6 项、static 背景图 1 项）
    - 尺寸按 1920×1080 → 3840×2160 约 2 倍放大（字号/坐标为估算值，验收 A3 时以原型图为准调整）
- mock 目录已建：`public/static/mock/shenzhen-communication-guarantee/`（readme 占位）
- 骨架完成后按设计稿坐标精调（2026-10-09，本阶段追加）：
    - 首屏：通信服务 720×1564（l130/t362）、应急资源 1998×158（NoStylePanel 无标题，l920/t1558）、重保区域业务 744×1564（l2970/t362）、区域轮巡 1968×174.51（l934/t1760）；删除重大保障 LOG 模块（widget 及目录）
    - 区域屏：4G 业务 926×600（l120/t216）、5G 业务 926×600（l2800/t216）、新增 4G/5G 指标趋势 926×1126（l120·l2800/t840，从 network-business 拆出趋势部分）、区域轮巡 1682×160（NoStylePanel，l1079/t1496）、前置资源更名「保障资源」1668×280（Panel 含标题，l1086/t1680）
    - 页面标题样式：80px / line-height 104px / letter-spacing 7.2px（YouSheBiaoTiHei）
    - 调试支持：search 带 `enableViewSync=1` 时视图状态与 `view` 参数同步（`sub-pages/index.tsx`）
    - 各模块布局详情已回填 `design/modules/shenzhen-communication-guarantee/`（001-home / 002-area 子文档）

## 变更记录

| 日期       | 变更                                                          | 原因             | 是否重新过硬门槛① |
| ---------- | ------------------------------------------------------------- | ---------------- | ----------------- |
| 2026-10-09 | 原合并卡（build）拆分为 003 骨架 / 004 迁移 / 005 新组件 三卡 | 用户要求任务拆小 | 是                |

## 审批记录

| 门槛       | 状态   | 日期       | 批准人                                         |
| ---------- | ------ | ---------- | ---------------------------------------------- |
| ① 需求审批 | 已批准 | 2026-10-09 | 用户（对话指令「执行task 003」）               |
| ② 实现验收 | 已验收 | 2026-10-09 | 用户（对话指令「骨架屏已经搭建完成，请归档」） |

---

## 关联

> - 相关 task：[task-2026-10-09-004-shenzhen-communication-guarantee-migrate](./task-2026-10-09-004-shenzhen-communication-guarantee-migrate.md)、[task-2026-10-09-005-shenzhen-communication-guarantee-new-widgets](./task-2026-10-09-005-shenzhen-communication-guarantee-new-widgets.md)
> - 设计文档：`design/modules/shenzhen-communication-guarantee/`
