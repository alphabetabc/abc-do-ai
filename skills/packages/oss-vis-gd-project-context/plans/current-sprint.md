# current-sprint · 当前任务索引

> 按 phase 推进；任务卡从 `templates/task-template.md` 复制后在此登记。

## 进行中

| 任务 | Status | 类型 |
| ---- | ------ | ---- |
| （空） |        |      |

## 最近完成

- 2026-10-29：`task-2026-10-29-001-scguarantee-fallback-data`（深圳保障屏 fallback 兜底能力：区域页 5 接口接 viewItemDataFallbackApi + 运维文件名映射 api-item-map.md（15 接口）+ `_` 前缀占位 json；map-area-layer 经确认不拼参，事后补卡）→ `done/2026-10/`

- 2026-10-28：`task-2026-10-28-001-scguarantee-baseservice-split`（深圳保障屏数据源拆分：新增 shenzhenMeetingViewService 服务（两份 environment 配置同步，direct 暂同旧地址）+ 模块 7 个 service baseUrlType 替换；002-architecture.md 回填「服务地址选择」公用能力，事后补卡）→ `done/2026-10/`

- 2026-10-22：`task-2026-10-20-002-scguarantee-intl-roam-requirement`（反拉终端 4+6·通信服务：intl-roam-top5 升级新结构（userCnt 总数+环比/topN TOP10/flowChart/港澳台）+ RoamingTop5 重构（头部总数+双列榜单+港澳台双轴锥形图）+ 15min 轮询；家庭简化 2 项（有线宽带/IPTV）、政企简化 2 项（物联网连接数/双线到达规模，「专线客户数」label 待后端确认）；含 002-communication-service spec/data-model 同步，用户验收通过）→ `done/2026-10/`

- 2026-10-22：`task-2026-10-20-004-scguarantee-top-apec-slogan`（反拉终端 7·中顶部保障目标：zero-excellent 组件（APEC LOGO + 四零/双优双轮播卡 3s 各自轮巡、「零」「优」highlight 突出）、天气卡移除挂载（组件保留可回退）、标题改「深圳APEC会议通信保障」，提交 9a9a3bb；含 007-zero-excellent spec 新增 + 001-weather-card/000-overview README 同步，用户验收通过）→ `done/2026-10/`

- 2026-10-21：`task-2026-10-21-002-scguarantee-area-business-rework`（F2 网络规模再次调整·样式层：Card1 左右结构/斜杠双值/绿渐变、Card2 重排、新背景素材+表头装饰 ind-label、重保专线行按需求删除；数据链路未动，spec 已同步）

- 2026-10-21：`task-2026-10-20-003-scguarantee-map-requirement` + `task-2026-10-21-004-scguarantee-map-visual`（反拉终端 5·地图整包：003 交互骨架——重保 intId 白名单（纯 env `homeConfig.centerMap`）+ 地图两层 series + 类型过滤联动/轮播启停/下钻/返回重置；004 视觉——亮版背景素材、重保专属图标+常显黄色 tip+外移引导线、区县画入底图、tip 重做；含 003-center-map / 001-top-type-filter / 007-area-carousel / 006-area-carousel spec 同步，提交 90bab6a，用户验收通过）→ `done/2026-10/`

- 2026-10-21：`task-2026-10-21-003-scguarantee-safety-monitor-module`（首屏新增安全监测模块：网络规模下方 744×391，两指标左右布局（上值下 label + ind-bg 背景 + \n 换行），useEnvironment 直读 staticData 无 service，含 006-safety-monitor spec 落地，用户验收通过）→ `done/2026-10/`

- 2026-10-21：`task-2026-10-21-001-scguarantee-area-carousel-style`（区域轮播卡片背景切图替换：普通/激活两态 100% 拉伸 + padding/缩略图对位微调，含 006-area-carousel spec 同步，用户验收通过）→ `done/2026-10/`

- 2026-10-21：`task-2026-10-20-001-scguarantee-scene-network-scale-static`（反拉终端 1+2：场景 5 类改名+静态直出 + 网络规模全网/重保双列重构 + 面板描边渐变，含 2026-10-21 新设计稿与描边颜色修订，用户验收通过）→ `done/2026-10/`

- 2026-10-16：`task-2026-10-16-002-scguarantee-home-polish`（首屏四处优化：左上角 logo 透明热区回首页 + 个人业务其他→2G用户数 + 漫入TOP5 titleUnit/pollingInterval 可配置 + 左侧面板模糊修复，用户验证通过）→ `done/2026-10/`

- 2026-10-16：`task-2026-10-16-001-scguarantee-intl-roam-top5-placeholder`（漫入TOP5 初始化占位：环境配置 key + data ?? 占位、接口返回即覆盖，事后补卡）→ `done/2026-10/`

- 2026-10-12：`task-2026-10-12-008-00-scguarantee-intl-roam-area-layer-api`（深圳保障屏新接口接数联调：intl-roam-top5 漫入TOP5 + map-area-layer 区域轮巡两屏同源）→ `done/2026-10/`

- 2026-10-12：`task-2026-10-12-007-00-scguarantee-area-context-sync`（区域选中态跨屏同步：ViewContext.activeArea 唯一事实源，轮巡高亮/地图浮层/widget field 三者对齐）→ `done/2026-10/`

> 更早归档（2026-10-12 以前）见 `done/` 各任务卡。
