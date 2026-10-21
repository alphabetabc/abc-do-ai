# Task · 2026-10-21-001-scguarantee-area-carousel-style

> 源需求：2026-10-21 用户拆分（源于 2026-10-20 反拉终端反馈第 5 点的延伸）
> 现状模块：[area-carousel](web/pages/shenzhen-communication-guarantee/sub-pages/components/area-carousel/index.tsx)（首屏/区域屏共用，含 [index.less](web/pages/shenzhen-communication-guarantee/sub-pages/components/area-carousel/index.less)）

## 任务元信息

| 项       | 值                                                                                                                                                                                |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 编号     | `task-2026-10-21-001-scguarantee-area-carousel-style`                                                                                                                             |
| Status   | 已完成                                                                                                                                                                            |
| 类型     | 编码                                                                                                                                                                              |
| 影响范围 | `web/pages/shenzhen-communication-guarantee/sub-pages/components/area-carousel/index.less`（背景图替换）；素材已就位 `.../area-carousel/images/area-bg.png`、`area-bg-active.png` |
| Roadmap  | 深圳保障屏反拉终端调整（2026-10-20）                                                                                                                                              |
| 验收标准 | 见下方 checklist                                                                                                                                                                  |
| 前置依赖 | 素材已由用户放入（2026-10-21），无需等待设计稿                                                                                                                                    |

## 目标（Goal）

区域轮播卡片背景改为设计稿切图：普通态用 `area-bg.png`、激活态用 `area-bg-active.png`，替换现有 CSS 渐变/描边/阴影方案。

## 背景与现状

- 卡片背景现为纯 CSS：`linear-gradient(90deg, rgba(21,61,110,0.6)…)` + `backdrop-filter: blur(6px)`，激活态叠加 `border: 2px solid rgba(0,208,255,1)` + 内外发光 box-shadow（[index.less](web/pages/shenzhen-communication-guarantee/sub-pages/components/area-carousel/index.less) `.area-card` / `.area-card-active`）
- 用户已放入两张背景切图：`images/area-bg.png`（普通态）、`images/area-bg-active.png`（激活态），与现有 `arrow.png` 同目录，less 内 `url(./images/area-bg.png)` 直接可引用
- 组件 `size` 双规格（`area-card-default` 区域屏 500×159 / `area-card-large` 首屏 450×159），背景图需 cover 适配两规格

## 功能列表

- F1 普通态背景：`.area-card` 的 linear-gradient + backdrop-filter 替换为 `background: url(./images/area-bg.png) no-repeat center / cover`（替代原 CSS 渐变）
- F2 激活态背景：`.area-card-active` 的 border + box-shadow 方案替换为 `area-bg-active.png`（是否保留额外高亮效果以切图实际效果为准，不叠加旧阴影）
- F3 背景图按卡片尺寸 `cover` 拉伸适配 default/large 两种规格（不裁切内容区；切图若含内边距视觉元素，需按 padding 对齐微调）
- F4 首屏 + 区域屏两屏回归（组件共用，样式变更同时生效）

## 不做清单

- 轮播启停逻辑（未过滤不轮播/过滤才轮播）——归 task-003 F6
- 地图 tip（ActiveOverlayItem）样式——归 task-003 F4
- 卡片内部布局（缩略图尺寸、名称字号、间距）——不在本卡，除非背景图替换后明显错位需微调
- 轮巡间隔、取数逻辑（use-area-carousel-data.ts）——不动

## 开放问题

| #   | 问题                                                           | 负责人 | 状态   | 结论                                                                                        |
| --- | -------------------------------------------------------------- | ------ | ------ | ------------------------------------------------------------------------------------------- |
| 1   | 激活态是否还需保留边框/发光叠加（纯切图 or 切图+微效果）？     | 用户   | 已关闭 | 纯切图，不叠加旧 border/box-shadow（2026-10-21 用户裁决）                                   |
| 2   | 切图是否为固定设计尺寸（对应哪个规格）？cover 拉伸是否可接受？ | 用户   | 已关闭 | **背景图尺寸用 100% 拉伸（background-size: 100% 100%），不用 cover**（2026-10-21 用户裁决） |
| 3   | 与地图 tip 的样式是否统一调整（联动范围）？                    | 待定   | 开放   | 归 task-003 F4 联动评估                                                                     |

## 技术设计（阶段二回填）

- 改动仅 [index.less](web/pages/shenzhen-communication-guarantee/sub-pages/components/area-carousel/index.less)：
    - `.area-card`：`background` 改 `url(./images/area-bg.png) center / cover no-repeat`；`backdrop-filter` 视切图不透明度决定是否保留（切图不透明则删）
    - `.area-card-active`：改 `url(./images/area-bg-active.png) center / cover no-repeat`，删除/保留 border、box-shadow 视开放问题 1 结论
    - 复用判断：无需新组件/配置，纯样式层；素材引用方式与 `arrow.png`（`.slick-arrow` background url）一致
- 风险：两屏规格不同（500×159 / 450×159），cover 下切图内容（若含边框性视觉元素）可能比例失真；必要时按 size 分别设 background-size

## 步骤（执行计划）

### 步骤 1：需求审批（硬门槛①）✅（2026-10-21 通过）

- **动作**：确认开放问题 1–2（激活态叠加效果、切图适配），批准本任务卡
- **等待用户**：是
- **实际落地**：用户裁决开放问题 1（纯切图）与 2（background-size: 100% 100%）并关闭，视为批准

### 步骤 2：实现 ✅（2026-10-21 完成）

- **动作**：index.less 背景替换（F1–F3）
- **等待用户**：否
- **实际落地**：[index.less](web/pages/shenzhen-communication-guarantee/sub-pages/components/area-carousel/index.less) `.area-card` 普通态改 `url(./images/area-bg.png)` + `background-size: 100% 100%`，删除 linear-gradient/backdrop-filter/box-shadow；`.area-card-active` 改 `url(./images/area-bg-active.png)` + `100% 100%`，删除 border/内外发光
- **用户微调（同日，背景切图对位）**：
    - `.area-card-default`（区域屏）：新增 `padding-left: 20px`；缩略图尺寸 180×135 → 180×110
    - `.area-card-large`（首屏）：新增 `padding-left: 20px`；缩略图尺寸 180×135 → 156×110
    - 目的：适配背景切图的内边距视觉，微调卡片内容与背景对位

### 步骤 3：验证 + 回填 ✅（2026-10-21 完成）

- **动作**：`pnpm start` 本地验证首屏 + 区域屏两屏卡片背景（普通/激活/悬停/箭头翻页），`pnpm lint`；文档回填
- **等待用户**：是（硬门槛②）
- **实际落地**：用户本地验证通过（「这个task可以」）；design 同步 [006-area-carousel/spec.md](../design/modules/shenzhen-communication-guarantee/000-overview/006-area-carousel/spec.md)（卡片视觉/激活高亮/size 规格更新为切图方案）
- 备注：本卡仅改 less，eslint 覆盖 js/ts/tsx，lint 项对本卡为 N/A

## 验收 checklist

- [x] A1：普通态卡片展示 area-bg.png，无旧渐变残留
- [x] A2：激活态卡片展示 area-bg-active.png，高亮效果符合切图设计
- [x] A3：default/large 两种规格下背景图无错位、明显拉伸失真（用户微调 padding/缩略图尺寸对位）
- [x] A4：区域屏（两屏共用组件）同步生效无回归；hover 暂停/箭头翻页正常
- [x] `pnpm lint` 通过（N/A：仅改 less，eslint 不覆盖）

## 审批记录

| 门槛       | 状态   | 日期       | 批准人                                |
| ---------- | ------ | ---------- | ------------------------------------- |
| ① 需求审批 | 已批准 | 2026-10-21 | 用户（开放问题 1/2 裁决关闭视为批准） |
| ② 实现验收 | 已通过 | 2026-10-21 | 用户（本地验证通过，批准归档）        |

## 关联

> - 相关 task：`task-2026-10-20-003-scguarantee-map-requirement`（F4/F6）
