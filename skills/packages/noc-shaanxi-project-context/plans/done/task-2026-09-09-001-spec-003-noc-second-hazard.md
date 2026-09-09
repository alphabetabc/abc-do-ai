# task-2026-09-09-001-spec-003-noc-second-hazard

## 背景与动机

`docs/specs/` 目前仅有 001（远程浏览器控制）、002（大唐不夜城）两个特性 spec。NOC 管理总览第二屏（`/management-overview-second`）的隐患模块群（隐患解决情况 / 隐患分类统计 / 隐患整改计划）尚无 spec。本次为「现状蒸馏」型初始化：登记 003 编号，复制 `_template/`，**填完 as-is.md**，其余五件套保持模板骨架。

## 目标文件（待审批后写入 docs/）

- `docs/specs/index.md` —— 追加 003 行（编号、目录、名称、路由、优先级、状态 `盘点中`）
- `docs/specs/003-noc-second-hazard/`（新建目录，六文件）：
  - `as-is.md` —— 按下方草案填写
  - `spec.md` / `plan.md` / `tasks.md` / `acceptance-tests.md` / `data-model-extensions.md` —— 复制模板原样，仅替换 `{特性名}` 为「NOC 第二屏隐患模块与隐患整改计划」

## as-is.md 草案

```markdown
# as-is：NOC 第二屏隐患模块与隐患整改计划

> **门禁**：本文件未填完，不得将 plan.md 标为可实现，不得编码。
> 项目级盘点见 docs/as-is/README.md。本文件只写**本特性**更细的现状。

## 0. 证据

| 项 | 值 |
| --- | --- |
| 盘点日期 | 2026-09-09 |
| 证据来源 | web/pages/management-overview-second/modules/hazard-solve/index.tsx；…/hazard-statistics/index.tsx、Tabs.tsx、ContentList.tsx；…/hazard-rectify/index.tsx、option.ts；web/services/management-overview-second/left/hazardSolve.ts、left/hazardStatistics.ts、share/index.ts、request-api.ts；web/pages/management-overview-second/modules/overview-statistics/index.tsx、notice/index.tsx、metaHumanPresets.ts |

## 1. 现网入口与交互

- 路由：`/management-overview-second`（render.tsx 入口，页面左侧栏）。
- 三个隐患区块（Panel 标题为切图）：
  1. **隐患解决情况**（hazard-solve）：Bar3dLineChart（3D 柱线混合图），按当前选中区域（zoneSelect 的 zoneId/zoneLevel）刷新，轮询 30 分钟；DataStatus 包 loading/空态。
  2. **隐患分类统计**（hazard-statistics）：四个 tab（来源/专业/原因/类型，本地写死 dict），8 秒自动轮播（鼠标悬停暂停、离开恢复）；来源/类型用 Pie2D，专业/原因用 BarChart；四组数据按 indicatorGroup 1–4 分别请求，轮询 30 分钟。
  3. **隐患整改计划**（hazard-rectify，副标题「近期安排」）：antd Carousel 双页（本月安排 data1 / 近三个月安排 data3），10 秒自动翻页（悬停暂停）；每页为柱线混合图（indicatorGroup '1' 为柱系列 x 轴 + 柱数据，其余为线系列）；数字人可通过 SWITCH_OPERATE 动作指定切换 tab/页。
- 元宇宙数字人联动：隐患分类统计 tab 切换、隐患整改计划页切换均注册了 useMetaHumanEffect（presets 键：`隐患分类统计`、`隐患整改计划`，见 metaHumanPresets.ts）。
- 关联区块：overview-statistics（隐患总览，消费 risk-overview 数据）、notice（隐患公告，消费 risk-announcements 数据）。

## 2. 现网 API 与数据

统一走 `getViewItemDataApi`（viewPageId 均为 `noc-module-oriented-left-page`）：

| viewItemId | requestId | 消费方 | 返回结构要点 |
| --- | --- | --- | --- |
| risk-resolve | 8830 | hazard-solve | Bar3dLineChart dataSource（presets 定义左右轴与系列） |
| risk-dict | 8869 | （Tabs.tsx 引用的 getDict 已注释，当前未消费） | —— |
| risk-announcements | 8845 | notice | rows[].noticeContent |
| risk-overview | 5401 | overview-statistics | rows[] 按 indicatorId 索引为对象 |
| risk-type | 5404 | （未见消费方） | —— |
| risk-resolve-plan | 8833 | hazard-rectify | data1（本月）/data3（近三月）：数组元素 indicatorGroup/indicatorName/indicatorValue |

- 隐患分类统计四组数据（hazard-statistics）通过 `getHazardStatisticsIndicatorApi` 按 indicatorGroup 1–4 请求（viewItemId 见 left/hazardStatistics.ts）。
- 所有请求参数携带 zoneId/zoneLevel（区域选择联动），轮询 30 分钟。
- indicatorId→颜色映射硬编码在 ContentList.tsx（100011/100012/100013/100029–100033）。

## 3. 冻结项（改完必须保持不变）

| 冻结项 | 原因 |
| --- | --- |
| 路由 `/management-overview-second` 及左侧栏布局 | 存量页面入口 |
| viewItemId/requestId 契约（risk-resolve 8830、risk-resolve-plan 8833 等） | 后端视图配置 |
| 区域联动（zoneId/zoneLevel 入参）与 30 分钟轮询 | 现网行为 |
| 数字人 presets 键（`隐患分类统计`、`隐患整改计划`） | 元宇宙联动契约 |
| 隐患分类统计四 tab 8 秒轮播 / 整改计划 10 秒翻页及悬停暂停 | 现网交互 |

## 4. 差距（相对 to-be，简述；详细差距写在 spec.md §0）

| # | 现状 | 目标 | 差距说明 |
| --- | --- | --- | --- |
| 1 | 本文件为现状蒸馏，to-be 待定义 | spec.md 待补充 | 需求方向未定（保持现状 / 改版 / 新增能力） |
| 2 | risk-dict（8869）、risk-type（5404）接口已注册但前端未消费 | 待确认是否废弃或补消费 | 待与后端确认 |
| 3 | indicatorId→颜色映射硬编码在前端组件内 | 待定 | 无变化则维持 |
```

## index.md 登记草案

在「业务特性（001+）」表追加：

```markdown
| 003 | docs/specs/003-noc-second-hazard/ | NOC 第二屏隐患模块与隐患整改计划 | `/management-overview-second` | - | 盘点中 |
```

## 不做清单

- 不改任何代码
- 不填 spec.md §0 差距表之外的内容（to-be 未定义）
- 不更新 docs/design/（data-models.md 等，本特性无实体/HTTP/路由变更）

## 审批记录

- 状态：**已批准（已执行）**
- 日期：2026-09-09
- 备注：用户于 2026-09-09 批准。已执行：新建 docs/specs/003-noc-second-hazard/ 六文件 + index.md 登记 003（状态：盘点中）。
