# Task · 2026-10-29-001-scguarantee-fallback-data

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-10-29-001-scguarantee-fallback-data` |
| Status | 已完成（事后补卡） |
| 类型 | 编码 + docs |
| 影响范围 | `web/services/shenzhen-communication-guarantee/area/*`、`home/center.ts`、`public/static/fallback/shenzhen-communication-guarantee/`、design/modules/shenzhen-communication-guarantee/000-overview/008-fallback-data/spec.md |
| Roadmap | 深圳保障屏数据链路稳定性 |
| 验收标准 | 模块全部接口均接 viewItemDataFallbackApi 兜底；运维可按 api-item-map.md 对照落 fallback 文件 |
| 前置依赖 | 无 |

---

## 目标（Goal）

补齐深圳通信保障模块接口空数据的静态 fallback 能力：区域页 5 个接口接入 `viewItemDataFallbackApi` 兜底；为全部 15 个接口建立 fallback 文件名映射文档（面向运维）及 `_` 前缀占位数据文件。

---

## 步骤（执行计划）

1. 清理：删除未使用的 `getAreaListApi`（area/section-center.ts）。
2. 兜底接线：区域页 4G/5G 业务（section-left.ts）、4G/5G 趋势（trend.ts）、保障资源（section-center.ts）5 个接口补 `fallback`，走 `getFallbackUrl('shenzhen-communication-guarantee', 'open-close-ceremonies-view-<viewItemId>')`。
3. 文件名规则：带参接口（4G/5G 业务/趋势，参数 `area`）按既有惯例拼 `_<参数值>` 后缀；`time` 不参与文件名；区域图层（map-area-layer）经确认**不拼参数**（调用方均不传参，运维侧一文件一接口）。
4. 运维文档：`public/static/fallback/shenzhen-communication-guarantee/api-item-map.md`——15 个接口的 viewItemId / viewPageId / fallback 文件名 + 带参接口示例，供运维对照落盘。
5. 占位文件：15 个 `_` 前缀 json（`_真实文件名.json`），数据按代码消费字段构造，待真实数据替换后去前缀生效。

---

## 技术设计

- fallback 结果 merge 进 response 后仍走 `defaultConverter`（读 `data.viewItemData.rows`；intl-roam-top5 读 `data.viewItemData.data`），故占位文件结构为 `{ code: 200, data: { viewItemData: { rows } } }`
- 区域页 `area` 参数实际取值为区域ID（map-area-layer 返回的 areaId，经 `resolveAreaAdcode` 多级回退解析），非行政区 adcode；文档措辞已按此修正
- `_` 前缀占位文件不会被 fallback 接口命中（URL 不带 `_`），属刻意的「未就绪」标记

## 不做清单

- 不为 `time` 参数做时间维度的 fallback 文件
- 区域图层不按 areaType/area 拆分 fallback 文件
- 不修改首页既有接口的兜底行为

---

## 变更记录

| 日期 | 变更 | 原因 | 是否重新过硬门槛① |
| --- | --- | --- | --- |
| 2026-10-29 | map-area-layer fallback 文件名由拼参改回无后缀 | 调用方均不传参；文档面向运维，一接口一文件更简 | 否（用户确认） |

---

## 进度日志

### 2026-10-29

- 删除 getAreaListApi；区域页 5 接口接 fallback；建立 api-item-map.md 与 15 个占位 json
- 用户逐轮修订文档：删除规则推导性内容（信管局引用等）、补充文件示例、修正 area 语义（区域ID 非 adcode）、map-area-layer 确定不拼参

---

## 关联

> - 相关 task：task-2026-10-12-008-00-scguarantee-intl-roam-area-layer-api（接口接数）、task-2026-10-28-001-scguarantee-baseservice-split（baseUrlType）
