# 快装服务能力（四档星级）· 需求与契约

> 提炼自 docs/specs/001-gold-building（2026-11-05 全量提炼；该 spec 目录后续不再维护，本文为延续权威）。
> 代码现状见 `page-code.md` §2.9。

## 1. 背景与目标

在商务楼宇详情（GoldBuildingViewer 3D 弹窗）的「开通级别」上新增「快装服务能力」信息，四档判定：

| 档位 | 判定规则 | 文案 |
| --- | --- | --- |
| 5 星 | 当前楼层有分光器 | 快装服务能力:资源到层 |
| 4 星 | 当前楼层无分光器，但商务楼宇有分光器 | 快装服务能力:资源到楼 |
| 3 星 | 楼层和楼宇均无分光器，且 IS_FIBER = 是 | 快装服务能力:资源到园区 |
| 2 星 | 楼层和楼宇均无分光器，且 IS_FIBER = 否 | 快装服务能力:资源到微网格 |

- 需求出处：2026-ZYZX-5.1.2《资源中心要客资源可视化功能需求》docx §3.2.2.1（要客能力 §3.2.2.2 已迁出至 003，见 `vip-customer.md`）。
- 面板固定 3 行：`<楼宇名><楼层>层` / `<N>星开通` / `快装服务能力:资源到<层/楼/园区/微网格>`。
- 触发点：楼宇详情弹窗楼层点击（onFloorClick）。
- 目标用户约 200 人、100 人/天，公开系统无鉴权。
- 防御性边界：IS_FIBER 缺失/无记录/解析失败时默认按 2 星（资源到微网格）。

## 2. 接口契约

5/4 星判定：复用分光器列表接口 `GET /goldBuilding/gisDataApi/query-for-page-data4`（`bmClassId='T_COVERAGE_SCENE_AN_POS'`，`value=buildingId`），返回 `recordInfoList`（分光器列表，含 RELATED_FLOOR 楼层信息）。

3/2 星判定（本能力新增）：`GET /goldBuilding/gisDataApi/query-for-page-judge-three-star`

- 参数：`value=buildingId`（覆盖场景 CUID）。
- 原始返回：`recordInfoList[0].IS_FIBER`（字符串 `是`/`否`）。
- BFF service 层归一化为顶层 boolean `IS_FIBER`（是→true→3 星；否→false→2 星）。前端实际收到 `{data:{IS_FIBER:boolean}}`。

商务楼宇实体字段增量（接口契约层面，非本仓建表）：快装服务能力（string）、开通级别星级（int 1-5）、标准地址标识（string，供要客关联用）、`IS_FIBER`（boolean）。

## 3. 实现现状（源码事实）

- 判定逻辑已实现：`web/pages/gold-building/components/gold-building-viewer/index.jsx` `getOpenLevelInfo(floorNo)`（L31-48）。
- 面板组件：`components/open-level/`（纯展示 CommonInfoLstPanel）。
- 数据已接：`getData()` 内 queryForPageData4 + queryForPageJudgeThreeStar。

## 4. 验收要点

- 冻结项回归：商务楼宇列表显示不变、3D 场景正常加载。
- 4 个星级场景逐一验证（含 IS_FIBER 是/否两分支），文案精确匹配。
- 面板 3 行结构验证。
- 接口断言：three-star 返回经 BFF 归一化为顶层 boolean。

## 5. 遗留（spec tasks 全未勾，但代码已实现——以源码为准核对）

- 单元/E2E/合同测试、冻结项回归测试均未做。
- 非功能指标 TBD（楼宇详情加载时长、标签渲染时长）。
