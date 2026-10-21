# 004-area-business · 重保区域业务汇总（spec）

> 2026-10-10 实现完成（004-03）；2026-10-20 反拉终端重构：删小区/退服率、全网/重保双列、静态直出（task-2026-10-20-001）；2026-10-21 按新设计稿落地三张背景图 + Card1/Card2 样式重做（task-2026-10-21-002，**重保专线行按需求删除**）。

## 职责

首屏右侧，**保障区域的汇总统计**（非单区域）：

- 2G / 4G / 5G 基站：全网数 + 重保区域数（双列）
- 5G-A 低空站点：单值（站点数 198）

（原小区子行与退服率指标已于 2026-10-20 删除；**重保专线行已于 2026-10-21 按需求删除**（less 中 `data-bg='zhongbao'` 样式与 bg-重保.svg 为预留）；原「通感站」行不再展示。）

## 布局

- PanelRight 744×1564，widgets 注册 left 2970 / top 362
- 内容纵向 space-between 分布；按 viewType 选择呈现组件与背景

## 组件构成（2026-10-21 新设计稿）

- `index.tsx`：`VIEW_RENDERERS` 注册表按 `item.viewType` 分发，未注册类型兜底 Card2
    - **Card1**（`viewType: card1`，基站行）：名称在左下，指标容器绝对定位底部（`bottom: 70px`）；左侧 children[0] 居中单值，右侧 children[1]/[2] 以 `A / B` 斜杠拼接（第二数字白→绿渐变），背景 `bg-基站`
    - **Card2**（`viewType: card2`，单值行）：label + num 基线对齐横排（`marginLeft: 30px`），外层 group `data-bg={item.key}` 区分背景（5ga → `bg-5g-a`、zhongbao 预留 → `bg-重保`）
- `index.less`：背景图 bg-基站 659×290 / bg-5g-a 689×243 / bg-重保 679×210（预留）+ 根节点 `::after` 顶部表头装饰 ind-label.png（651×92）；数值渐变文字（白→蓝），D-DIN-PRO 900 / Source Han Sans CN
- 类型 `AreaBusinessItem`：平铺结构 `{ key, title, viewType, children: [{label, value}] }`，不再有 group/嵌套行

## 数据（静态直出）

- service `getKeyGuaranteeAreaBusinessApi`（section-right.ts）读取环境配置 key `shenzhen-communication-guarantee-view-key-guarantee-area-business`，`enableStaticData=true` 时跳过接口直接返回 `staticData`（接口 rows 同构 `{ type, num, retireNum }`）；未下发时回退源码默认模板。详见 `000-overview/environment-config.md`
- 回填逻辑抽为 `fillTemplateValues`：按 `title === row.type` 匹配、深拷贝不改模板引用；静态直出与接口回填共用
- 默认数值（PM 2026-10-20 需求原文）：2G 3627/21、4G 47200/293、5G 49500/288、5G-A 低空 198（重保专线 2 已随行删除）
- **模板维持上一轮结构（2026-10-21-002 确认）**：源码默认模板与数据链路（fillTemplateValues / 静态直出 / fallback）本轮未改动；card1 children 的 label 语义（基站/基站/小区）与 Card1 渲染结构（leftMetric + 斜杠双值）的最终措辞由 env 模板下发调整

## 交互

静态展示，不参与类型联动（统计为保障区域汇总，非按类型过滤）。

## 边界

- `enableStaticData=false` / 未配置时保持接口请求 + 模板回填（开关可回退）
