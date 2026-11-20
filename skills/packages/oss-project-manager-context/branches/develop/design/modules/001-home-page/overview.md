# 001-home-page

工程预约首页/总览。src/pages/home-page。

## 功能

- 左侧两栏：时间轴（我的工程、未执行）+ 日历视图（按天聚合工程状态：未执行/正在执行/已执行）。
- 右侧：工程列表（多条件查询：时间范围、我的工程/全部工程、专业类型、工程类型、地区、周期、工程名）。
- 左侧统计卡片（未执行/正在执行/已执行数量）可点击过滤右侧列表。
- 定时刷新：每 300 秒重新拉取列表。
- 列表行操作：编辑、重新预约时间、影响分析、审批、提前结束工程、删除、网元导入导出、告警标记查询、导出列设置。
- 剩余时间告警：surplus-alarm-list（通用）与 surplus-alarm-list-hn（河南版本）。
- 个人设置：home-page-userset 维护查询时间窗等偏好。
- 导出：同步/异步/批量网元 Excel 导出（含进度查询与文件下载），工程导出。

## 结构

```text
index.jsx                    主容器（类组件，hox withModel 注入登录/环境模型）
home-page-list/              右侧列表（含 surplus-alarm-list、surplus-alarm-list-hn 告警）
home-page-calendar/          日历视图
home-page-timeline/          时间轴
home-page-period/            时间范围筛选
home-page-edit/              编辑弹窗（edit 子表单）
home-page-export-column/     导出列设置
home-page-userset/           个人设置
service/api.js               接口层
```

## 关键实现

- 状态：React 类组件 + hox withModel（useLoginInfoModel、useEnvironmentModel）。
- 查询时间窗默认前 3 天到后 4 天，来自 environment.homeQueryConfig。
- surplusTime 三态：未执行(0)/正在执行(1)/已执行(2)；正在执行的剩余时间展示为结束时间戳。
- 专业类型下拉数据从 mock data.json（constants.MOCK_DATA_PATH）加载。
- 定时器为模块级变量 startRefreshListData，卸载时清理；注意并发查询时先 clearInterval。

## 接口域（service/api.js，baseUrlType=exportUrl）

- homePage/getProjectInfo：工程查询（核心）。
- homePage/terminateProject、deleteProject、findAlarmMarked、getLegalUsers、addUrgentUser。
- appointment/*：selectArProjectInfoByPrimaryKey、options、senior/insetProjectInfo、updateArProInfo、getUserInfo。
- arProStatusImp/*：网元/链路临时表与正式表 CRUD（约 20 个方法，链路相关受 dateLk 开关控制，dateLk 来自版本常量 type=23 的 isShow）。
- netWork/*：网元导入导出、异步导出进度、模板下载、列配置。
- api.js 中 deleteTmpArProStatusImp 定义重复两次（第 397 与 411 行），后者覆盖前者，重构时注意。

## 关联

- home-executing 复用本模块（props.executing 固定查询「正在执行」）。
- 编辑/审批/导入导出弹窗与 new-project 的 control/ 目录结构同源。

## 六要素补齐（2026-11-19 真源核查）

- **路由与入口**：/home-page（主页）、/home-page/home-page-edit、/home-page/home-page-period（src/routes/index.js）。
- **组件树**：src/pages/home-page：
- index.jsx — 入口，状态都在此
- home-page-calendar/index.jsx — 日历视图
- home-page-list/index.jsx — 列表视图；surplus-alarm-list（河南 surplus-alarm-list-hn 与通用告警弹窗两套分叉）
- home-page-timeline/index.jsx — 时间轴视图
- home-page-userset/index.jsx — 用户偏好设置（加急用户等）
- home-page-edit/index.jsx + edit/index.jsx — 编辑弹窗（路由 /home-page/home-page-edit）
- home-page-period/index.jsx — 周期预约（路由 /home-page/home-page-period）
- home-page-export-column/index.jsx — 导出列配置弹窗
- service/api.js — 接口层
（注：本模块无 control/ 目录，审批/影响分析等弹窗由 new-project 的 control/ 提供）详情弹窗在 control/ 目录（project-info-demo 见 new-project）。
- **状态管理**：无全局状态，全部组件内 state（类组件 setState）+ hox useLoginInfoModel 取用户。300 秒刷新用 src/common/timer/index.js initTimer（可见性感知）。
- **接口清单**：见本文件「接口域」节 + references/api-catalog.md home-page 节（含 arProStatusImp 系列约 30 个端点）。
- **可复用点**：Timer（src/common/timer/index.js）、导出列配置持久化模式（queryColumnConfig/saveColumnConfig）、异步导出三段式（exportNwInfoAsync→getProcess 轮询→downloadExportedFile）。
- **已知坑**：service/api.js 中 deleteTmpArProStatusImp 定义两次（L397/L412，类字段后者覆盖前者）；surplusTime 0/1/2 三态字典仅散落判断。



