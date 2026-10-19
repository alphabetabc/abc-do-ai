# current-sprint · 当前任务索引

> 按 phase 推进；任务卡从 `templates/task-template.md` 复制后在此登记。

## 进行中

| 任务                                                                                                                                                                                                       | Status | 类型 |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---- |
| [task-2026-10-12-008-00-scguarantee-intl-roam-area-layer-api](./done/2026-10/task-2026-10-12-008-00-scguarantee-intl-roam-area-layer-api.md)（深圳保障屏新接口接数联调：intl-roam-top5 漫入TOP5 + map-area-layer 区域轮巡两屏同源，已完成） | 已完成 | 编码 |
| [task-2026-10-09-004-00-scguarantee-backend-api-confirm](./done/2026-10/task-2026-10-09-004-00-scguarantee-backend-api-confirm.md)（深圳保障屏后端接口确认：清单全条目闭环，落码由 006-00/007-00/008-00 承接验收通过，已归档） | 已完成 | 其它 |

## 最近完成

- 2026-10-16：`task-2026-10-16-002-scguarantee-home-polish`（首屏四处优化：左上角 logo 透明热区回首页 + 个人业务其他→2G用户数 + 漫入TOP5 titleUnit/pollingInterval 可配置 + 左侧面板模糊修复（backdrop-filter 移至 ::before 使文字脱离合成层），用户验证通过）→ `done/2026-10/`

- 2026-10-16：`task-2026-10-16-001-scguarantee-intl-roam-top5-placeholder`（漫入TOP5 初始化占位：新增环境配置 key shenzhen-communication-guarantee-view-intl-roam-top5（仅 defaultRows），data ?? 占位、接口返回即覆盖，已登记 environment-config.md；事后补卡）→ `done/2026-10/`

- 2026-10-12：`task-2026-10-12-007-00-scguarantee-area-context-sync`（区域选中态跨屏同步：ViewContext.activeArea 唯一事实源，区域屏 auto+click 回写、首屏 defaultActiveItemId 恢复，回屏轮巡高亮/地图浮层/widget field 三者对齐，A1–A3 用户验证通过；调试 console.log 用户知情保留待上线前清理）→ `done/2026-10/`

- 2026-10-12：`task-2026-10-09-004-04-scguarantee-area-widgets-migrate`（深圳保障屏区域屏组件迁移：4G/5G 指标与趋势、前置资源；验证通过 A1–A2，资源顺序按用户裁决修正，遗留 console.log 待上线前清理）→ `done/2026-10/`

- 2026-10-12：`task-2026-10-12-006-00-scguarantee-area-business-api`（首屏重保区域业务接数：key-guarantee-area-business 接口落码 + viewItemDataTemplate 树形模板（env 可覆盖）+ 出数回填深拷贝隔离 + useRequest 直接渲染模板 + 父/子行样式修复）→ `done/2026-10/`

- 2026-10-10：`task-2026-10-09-005-shenzhen-communication-guarantee-new-widgets`（深圳保障屏新建组件：区域轮巡双屏 + 地图 TOOLTIP 联动 + 类型过滤三联动；LOG 勘误为 logo 挂图留联调）→ `done/2026-10/`

- 2026-10-10：`task-2026-10-09-004-03-scguarantee-home-widgets-migrate`（深圳保障屏首屏组件迁移：6 块定稿——通信服务/地图静态+打点图标/重保区域业务自写静态 UI/应急资源/类型统计卡静态展示/首屏背景层；TOOLTIP/联动留 005）→ `done/2026-10/`

- 2026-10-09：`task-2026-10-09-004-02-scguarantee-panel-style`（深圳保障屏模块框样式：SVG 渐变边框保留、rx/圆角/blur20/标题 48px + 用户手调 line-height 1.2 + 底部 logo l1699/t2019）→ `done/2026-10/`

- 2026-10-09：`task-2026-10-09-004-01-scguarantee-services-migrate`（深圳保障屏接口层迁移：7 个复用接口落地（statistics/point/resources/chbn×3/weather）+ 零自造纪律（新增接口只留占位注释，需求挂 004-00）+ 7 个 mock + 天气卡接数 + chbn→communication-service 改名）→ `done/2026-10/`

- 2026-10-09：`task-2026-10-09-003-shenzhen-communication-guarantee-skeleton`（深圳保障屏骨架：3840×2160 屏壳 + 两屏手动切换 + 区块占位，并按设计稿坐标精调各模块布局、删除重大保障 LOG、新增 4G/5G 指标趋势拆分、enableViewSync 调试参数）→ `done/2026-10/`

- 2026-10-09：`task-2026-10-09-002-shenzhen-communication-guarantee-docs`（深圳重要通信保障文档：pm-input 整理 + as-is 绿地资产盘点 + To-Be 五件套，接口待定项全部记开放问题）→ `done/2026-10/`

- 2026-10-09：`task-2026-10-09-001-init-shenzhen-communication-guarantee`（深圳重要通信保障模块骨架初始化：_template 五件套 + pm-inputs，index.md 登记，新增幂等脚本 init-spec-module.js）→ `done/2026-10/`

- 2026-10-08：`task-2026-10-08-008-info-management-bureau-doc`（信管局模块文档：000-overview + 001-view-state + 三视图 × widget 子目录，共 21 个 spec/data-model 子文档）→ `done/2026-10/`

- 2026-10-08：`task-2026-10-08-007-five-major-center-overview`（README 升级为 000-overview/ 入口；追加 iframe-page 子文档与 004-iframe-loader 组件文档）→ `done/2026-10/`

- 2026-10-08：`task-2026-10-08-006-detail-map-geo-doc`（map-geo 细化为按中心 × 主题 9 份子文档 + diff；修正 useRefCache / getCacheValue 失真）→ `done/2026-10/`

- 2026-10-08：`task-2026-10-08-005-detail-rc-echarts-map-doc`（EChartsMap 细化为 README + props / builders / overlay，删组件间对比句）→ `done/2026-10/`

- 2026-10-08：`task-2026-10-08-004-detail-react-echarts-doc`（ReactECharts 按源码细化为 README 薄层 + props / update-behavior / style-presets / examples 四子文档）→ `done/2026-10/`

- 2026-10-08：`task-2026-10-08-003-detail-emap-gis-doc`（emap-gis 按源码重写并拆分多文件；沉淀「组件层文档纪律」）→ `done/2026-10/`

- 2026-10-08：`task-2026-10-08-002-design-restructure-map-geo`（design/ 组件层/业务层分层重构，map-geo 归 five-major-center）→ `done/2026-10/`
- 2026-10-08：`task-2026-10-08-001-migrate-trae-documents`（`.trae/documents` 整体迁入 skill，源目录已删除）→ `done/2026-10/`
