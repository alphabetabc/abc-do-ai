# Task · 2026-10-20-001-scguarantee-scene-network-scale-static

> 源需求：`docs/specs/shenzhen-communication-guarantee/pm-inputs/assets/20261020/反拉终端---2026年10月20日.md` 第 1、2 点（前端静态数据）

## 任务元信息

| 项       | 值                                                                                                                                                                                                                                                                         |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 编号     | `task-2026-10-20-001-scguarantee-scene-network-scale-static`                                                                                                                                                                                                               |
| Status   | 已完成（2026-10-21 用户验收通过并归档）                                                                                                                                                                                                                                    |
| 类型     | 编码                                                                                                                                                                                                                                                                       |
| 影响范围 | `web/pages/shenzhen-communication-guarantee/sub-pages/home/modules/top-type-filter/`、`.../area-business/`、`web/services/shenzhen-communication-guarantee/home/center.ts`、`.../home/section-right.ts`、图标资源 `public/.../shenzhen-communication-guarantee/icon-*.svg` |
| Roadmap  | 深圳保障屏反拉终端调整（2026-10-20）                                                                                                                                                                                                                                       |
| 验收标准 | 见下方 checklist                                                                                                                                                                                                                                                           |
| 前置依赖 | 无（纯前端静态数据）                                                                                                                                                                                                                                                       |

## 目标（Goal）

按 2026-10-20 反拉终端反馈，将首屏「顶部类型统计（场景）」与「右侧重保区域业务（网络规模）」两块改为前端静态数据：场景改为 5 类新名称与新数值；网络规模保留基站数并新增全网/重保区域双列展示，删除小区与退服率。

## 功能列表

**F1 场景（顶部类型统计，现状 [top-type-filter](web/pages/shenzhen-communication-guarantee/sub-pages/home/modules/top-type-filter/index.tsx)）**

- F1.1 数据支持静态直出：`getTopIndicatorsApi` 环境配置 key 增加 `enableStaticData` + `staticData`（5 类新数值），为 true 时不发接口请求与 15 分钟轮询、直接返回 staticData；为 false/未配置时保持现接口逻辑
- F1.2 类型名称与展示顺序均以需求原文为准：重要场地 8、指挥部 1、保障酒店 85、参访区 25、交通枢纽 10（文案、顺序照抄 PM 需求，不做自行排序）。展示名与过滤名解耦：数据项新增 `title` 字段作展示名，`type` 保留原语义继续参与地图/轮巡等模块的过滤（组件渲染改为 `item.title ?? item.type`）
- F1.3 类型选中过滤（areaTypeFilter 广播 → 地图图层 + 底部轮巡）保持可用，同步更新 `MAP_AREA_TYPE_CODES` 类型字典与 `icon-<类型>.svg` 图标命名映射

**F2 网络规模（右侧重保区域业务，现状 [area-business](web/pages/shenzhen-communication-guarantee/sub-pages/home/modules/area-business/index.tsx)）**

- F2.1 保留基站行，删除小区行与退服率指标
- F2.2 静态数据：2G 基站（全网 3627 / 重保区域 21）、4G 基站（全网 47200 / 重保 293）、5G 基站（全网 49500 / 重保 288）、5G-A 低空站点 198、重保专线（待补充，暂 2）
- F2.3 `getKeyGuaranteeAreaBusinessApi` 同样增加 `enableStaticData` + `staticData`（key：`shenzhen-communication-guarantee-view-key-guarantee-area-business`），为 true 时跳过接口直接返回 staticData，模板结构调整为新结构（基站 + 全网/重保双列）
- F2.4 "全网/重保区域"双列展示样式：暂沿用现有 metric 行布局（label 区分全网/重保区域）过渡实现，最终 UI 等设计稿出来后再调整（见开放问题 6）

## 业务规则

- **enableStaticData 静态直出机制**（参照 `design/modules/shenzhen-communication-guarantee/000-overview/environment-config.md` 既有模式扩展）：
    - 各 key 在 `viewPageArgs` / `viewItemDataTemplate` 基础上新增 `enableStaticData: boolean` 与 `staticData`（结构与 viewItemDataTemplate 渲染结构一致，value 直接为最终值）
    - `enableStaticData === true` 时：service 层跳过 `getViewItemDataApi` 请求（组件层 useRequest 的轮询也跳过或不触发），直接返回 `staticData`（未下发 staticData 时回退源码默认模板）
    - 为 false / 未配置时：保持现接口请求 + 模板回填逻辑，接口链路不删除
    - 本任务的静态默认值（源码内默认模板同步更新）：场景 8/1/85/25/10；网络规模 3627/21、47200/293、49500/288、5G-A 低空 198、重保专线 2
- 静态数据落点：源码默认模板 + 环境配置下发侧可覆盖（结构两侧一致），PM 源注明于注释
- 场景类型改名后，需同步检查引用类型中文名的联动链：`MAP_AREA_TYPE_CODES`、地图打点过滤、底部区域轮巡、`icon-<type>.svg` 文件名
- 实现后同步更新 `environment-config.md` 清单（新增 enableStaticData/staticData 说明与两个 key 的新结构）

## 开放问题

| #   | 问题                                                                                                                              | 负责人  | 状态   | 结论                                                                                                                                        |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | ------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | "类型名称以低端的名字为准"——确认最终 5 类名称是否即「重要场地/指挥部/保障酒店/参访区/交通枢纽」？原「其它」是否替换为「指挥部」？ | PM      | 已关闭 | 以需求原文为准：重要场地/指挥部/保障酒店/参访区/交通枢纽，顺序与文案照抄需求（2026-10-20 用户裁决）                                         |
| 2   | 场景数值中"重保区域：待补充（21/293/288/2）"括号数字是否即采用值（21 日中午 PM 确认）？                                           | PM      | 已关闭 | 是，括号内即补充值：重保区域采用 21/293/288/2（2026-10-20 用户裁决；后续有变走配置更新）                                                    |
| 3   | 重保专线数值"待补充"——当前先按 2 展示还是占位？                                                                                   | PM      | 已关闭 | 先按 2 填入；数值均为 staticData/模板配置，不影响代码，PM 确认后改配置即可（2026-10-20 用户裁决）                                           |
| 4   | 5G-A 低空站点 198 是否只有单值（无全网/重保双列）？                                                                               | PM      | 已关闭 | 是，单值 198，不做全网/重保双列（2026-10-20 用户裁决）                                                                                      |
| 5   | 类型改名后，地图打点/区域轮巡接口返回的 areaTypeName 字典是否同步改（服务端）？若不改，前端是否需要旧名→新名映射？                | 服务端  | 已关闭 | 无需改：title（展示名）与 type（过滤名）解耦后，过滤链路继续用原 type 字典，服务端 areaTypeName 不动，前端也无需映射（2026-10-20 用户裁决） |     |
| 6   | 网络规模双列展示的 UI 设计稿——本卡先用现有布局过渡，UI 定稿后再调整样式                                                           | PM/设计 | 已关闭 | 2026-10-21 已按新设计稿落地（viewType card1/card2 + 三张背景图）                                                                            |
| 7   | 面板容器新设计稿（2026-10-21 用户提供）：是否用纯 CSS 替换现有 PanelBgSvg 背景方案？                                              | 用户    | 已关闭 | 不改纯 CSS，保留 SVG 背景方案；仅描边按新设计稿调整（粗细 4px 不变，颜色改回渐变：白 1.0 → 白 0 @0.446 → 蓝 rgb(30,118,240) 0.46）          |

## 步骤（执行计划）

### 步骤 1：需求审批（硬门槛①）

- **动作**：确认开放问题 6（UI 设计稿可后补，本卡先过渡），批准本任务卡
- **输出**：批准结论回填任务卡
- **等待用户**：是

### 步骤 2：enableStaticData 机制 + F1 场景 ✅（2026-10-21 完成）

- **动作**：center.ts `getTopIndicatorsApi` 增加 enableStaticData/staticData 逻辑，源码默认模板更新为新 5 类与数值；更新类型字典与联动映射；补/改名图标资源
- **输出**：代码变更
- **等待用户**：否
- **实际落地**：
    - [center.ts](web/services/shenzhen-communication-guarantee/home/center.ts)：新增环境配置 key `shenzhen-communication-guarantee-view-competition-homepage-statistics`（enableStaticData/staticData/viewPageArgs/viewItemDataTemplate），`enableStaticData=true` 时直接返回 `staticData ?? 默认模板`；默认模板为 5 类新数值（8/1/85/25/10），`type` 过滤名 + `title` 展示名解耦
    - [scale-item-card.tsx](web/pages/shenzhen-communication-guarantee/sub-pages/home/modules/top-type-filter/scale-item-card.tsx)：渲染 `item.title ?? item.type`，点击过滤/图标取图仍走 `item.type`
    - 类型字典 `MAP_AREA_TYPE_CODES` 与 `icon-<type>.svg`：按开放问题 5 结论无需变更（原 5 类 icon 齐全）
    - `environment-config.md`：已登记新 key 与 enableStaticData 机制（key 计数 9→10）
    - 备注：组件层 `useRequest` 15 分钟轮询仍触发，仅静态模式下无网络调用；lint 由用户 review 时执行

### 步骤 3：F2 网络规模重构 ✅（2026-10-21 完成）

- **动作**：section-right.ts `getKeyGuaranteeAreaBusinessApi` 增加 enableStaticData/staticData，模板改为基站+全网/重保双列新结构，删小区/退服率；新增 5G-A 低空站点行
- **输出**：代码变更
- **等待用户**：否
- **实际落地**：
    - [section-right.ts](web/services/shenzhen-communication-guarantee/home/section-right.ts)：模板重构为平铺 5 行（2G/4G/5G 基站双列 + 5G-A 低空站点单值 + 重保专线），删小区行与退服率；`AreaBusinessItem` 类型简化（去掉 group/嵌套 AreaBusinessRow），新增 `viewType` 字段（card1/card2）区分呈现组件；回填逻辑抽为 `fillTemplateValues`（按 `title === row.type` 匹配、深拷贝不改模板引用）
    - staticData 为接口 rows 同构结构（`{ type, num, retireNum }`）：静态直出与接口回填共用 `fillTemplateValues`，配置侧只维护数值层；未下发时回退源码默认模板值
    - [area-business/index.tsx](web/pages/shenzhen-communication-guarantee/sub-pages/home/modules/area-business/index.tsx)：`VIEW_RENDERERS` 注册表按 `item.viewType` 分发 Card1（基站双列左右结构，名称底部居中 + 全网/重保指标 space-between）/ Card2（单值行，label+num 基线对齐横排），未注册类型兜底 Card2；外层 group 带 `data-bg={item.key}` 供 card2 区分背景
    - [area-business/index.less](web/pages/shenzhen-communication-guarantee/sub-pages/home/modules/area-business/index.less)：三张新背景图（bg-基站 659×290 / bg-5g-a 689×243 / bg-重保 679×210），card1/card2 按 viewType + data-bg 组合选择；数值渐变文字（白→蓝）+ D-DIN-PRO 900 / Source Han Sans CN
    - `environment-config.md`：key-guarantee-area-business 已回填新结构（enableStaticData + staticData rows 结构 + viewItemDataTemplate 含 viewType）

### 步骤 4：面板容器样式按新设计稿调整 ✅（2026-10-21 完成）

- **动作**：按用户裁决（开放问题 7：不改纯 CSS，保留 SVG 方案，仅调描边），将 PanelBgSvg 描边按新设计稿恢复为渐变
- **输出**：代码变更
- **等待用户**：否
- **实际落地**：
    - [panel-bg-svg.tsx](web/pages/shenzhen-communication-guarantee/sub-pages/components/container/panel-bg-svg.tsx) `<defs>`：新增 linearGradient `paint_linear_stroke_<实例唯一后缀>`（objectBoundingBox，x1=1,y1=0 → x2=0,y2=1 即右上→左下），三个 stop：offset 0 `#FFF` rgb(40,168,255) opacity 1 / offset 0.446 `#FFF` opacity 0 / offset 1 `#1E76F0`（rgb(30,118,240)）opacity 0.46
    - 同文件描边 rect：stroke 由实色 `#FFF` 改为 `url(#paint_linear_stroke_...)`，strokeWidth 4、rx 20 不变；背景径向渐变不动

### 步骤 5：验证 + 回填 ✅（2026-10-21 完成）

- **动作**：`pnpm start` 本地验证两块显示与类型过滤联动；文档回填（任务卡 + 涉及 spec 同步）
- **输出**：验收结论
- **等待用户**：是（硬门槛②）
- **实际落地**：
    - 用户 2026-10-21 本地验证通过，任务截止（用户裁决「task 到此为止」）
    - 文档同步：`design/modules/shenzhen-communication-guarantee/001-home/001-top-type-filter/spec.md`（5 类改名 + title/type 解耦 + 静态直出）、`.../001-home/004-area-business/spec.md`（新结构全量重写）、`.../000-overview/002-container/spec.md`（PanelBgSvg 渐变描边，颜色含 2026-10-21 修订 rgb(40,168,255)）；`environment-config.md` 此前已同步
    - 代码尾改：panel-bg-svg.tsx 描边渐变前两个 stop 由白 `#FFF` 改 `rgb(40,168,255)`（任务卡 2026-10-21 修订）
    - `pnpm lint`：用户已于 2026-10-21 自行执行通过

## 验收 checklist

- [x] A1：enableStaticData=true（或未下发配置走默认模板）时，顶部类型统计展示 5 类新名称与数值 8/1/85/25/10，Network 无 top-indicators 调用（用户本地验证）
- [x] A5：enableStaticData=false/未配置走 staticData 之外路径时，原接口逻辑仍完整可用（开关可回退）（代码路径保留，回填逻辑共用）
- [x] A2：类型点击过滤地图打点与底部轮巡联动仍工作（type 字典未动，链路不变）
- [x] A3：右侧重保区域业务仅展示基站（无小区行、无退服率），数值为 3627/21、47200/293、49500/288、5G-A 低空 198、重保专线按确认值（用户本地验证）
- [x] A4：无 Network 请求 key-guarantee-area-business（用户本地验证）
- [x] A6：`environment-config.md` 已登记两个 key 的 enableStaticData/staticData 新结构
- [x] `pnpm lint` 通过（2026-10-21 用户执行）

## 审批记录

| 门槛       | 状态   | 日期       | 批准人                                                           |
| ---------- | ------ | ---------- | ---------------------------------------------------------------- |
| ① 需求审批 | 已批准 | 2026-10-21 | 用户（「先完成顶部的那块」视为批准，UI 过渡方案照开放问题 6）    |
| ② 实现验收 | 已验收 | 2026-10-21 | 用户（本地验证 + lint 通过，「task 到此为止」）                  |
