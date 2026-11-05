# environment-config · 运行时环境配置（public/environment.json）

> 上位文档：`001-overview/001-overview.md` §3 网络层（URL 重写机制）
> 姊妹篇：`./url-composition.md`（URL 组合机制：拼接算法、两种 mode 示例、不走管道的特例）
> 配置样例：仓库 `public/environment.json`（开发默认值）；线上样例见 `pm/2026-11-05/家客前端配置.json`（k8s）

## 定位

- 运行时加载（非构建时注入），经 `oss-web-common` useEnvironment 进 `src/hox` 的 `useEnvironmentModel`
- **代码不写死环境地址**（仓库硬约束）；所有后端地址、省份参数、UI 显隐开关集中于此
- 部署形态：仓库 `public/environment.json` 为开发默认；线上由 k8s 配置（`家客前端配置.json`）覆盖
- 本地调试：`src/setupProxy.js` 名义上将 `/serviceDiscovery` 前缀代理到测试网关，但默认配置下不生效（详见 `./url-composition.md`）

## 条目结构总则

三类条目：

1. **全局标量**：单值配置，直接消费
2. **URL 三元组**：`{ describe1, direct, discover, mode }`
   - `mode: "direct"` → 请求走 `direct + path`（直连）
   - `mode: "discover"` → 请求走 `serviceDiscovery + "/" + discover + path`（经服务发现网关）
   - 约定 direct / discover 双写，切换只改 mode
   - 特例 `iceUrl`：嵌套多个三元组 + 布尔/数值项（ICE 流水窗参数族）
3. **UI 配置**：对象结构，控制组件显隐与行为，不含地址

## 全局标量键

| 键 | 职责 | 消费方 |
| --- | --- | --- |
| `serviceDiscovery` | 服务发现基地址（仅作 discover 模式前缀） | 网络层（见上位文档 §3） |
| `test` | 测试标记 | 全局 |
| `timeout` | 请求超时（ms，默认 60000） | 网络层 |
| `buttonAuthorize` | 按钮权限开关 | auth-button / useLoginInfoModel |
| `provinceId` | 省份 ID | 全局 |
| `filterIdList` / `filterNameList` | 默认过滤条件（告警） | 告警相关组件 |
| `colDispTemplet` / `statusDispTemplet` | 列 / 状态显示模板 ID | 告警相关组件 |
| `map` | 地图参数（name / mapLevel / layoutCenter / aspectScale / layoutSize） | echarts-map / situation-map |
| `emergencyServerExport` | 应急报表服务端导出开关 | emergency |
| `topoXmlProxyUrl` | 拓扑 XML 代理地址 | alarm-topo |

## URL 三元组键

| 键 | 职责 | 主要消费方 |
| --- | --- | --- |
| `situationUrl` / `broadbandUrl` | 视图服务（cloud.view.server-gcss）：getViewItemData、导出 | situation / topo / broadband / television |
| `situationConfigUrl` | 业务概览设置服务（dictionary-config 族） | situation |
| `configUrl` | 指标配置服务（indicator-config 族，cloud.view.manager） | broadband / television |
| `AnalysisRuleUrl` | 故障分析/诊断规则管理（cloud-diagnose 族） | fault-diagnosis / 各规则管理模块 |
| `preProcessingManagementUrl` | 预处理任务/查询（配置注明"打包发布时需修改"） | falutRules-management |
| `experiencesUrl` | sqlm 下沉查询（direct 含路径后缀 `/sqlm/v2.0`） | emergency / dataService |
| `viewItemExportUrl` / `viewItemUrl` | 视图服务导出 / 告警右键视图 | 告警相关组件 |
| `filterUrl` / `monitorSetUrl` | 过滤模型（discover 模式）/ 告警设置 | 告警相关组件 |
| `logOperUrl` | 日志记录 | loggerApi |
| `iceUrl` | ICE 流水窗参数族（嵌套：directSvcId / directServiceUrl / icegridSvcId / isUseIceGrid / icegridUrl / icegridBackupUrl / refreshInterval） | 告警窗 |
| `alarmSoundUrl` | 告警发声服务 | 告警窗 |

## UI 配置键

| 键 | 职责 | 消费方 |
| --- | --- | --- |
| `contextAndToolbar` | 告警右键菜单（active / confirm / clear / cleardAck 四态，含 subMenus）+ 工具栏（四态键列表） | alarm-window-view |
| `legendPosition` | 业务概览地图图例位置（style） | situation-map |
| `topoOptionShow` | 拓扑下拉机顶盒显隐 | topo |
| `topoCodeGd` | 拓扑参数广东特殊处理开关 | topo |

## 已知配置事实（2026-11-05，对照 k8s 线上值）

线上配置键齐全，但部分 `direct` 值与目标服务不符：

| 键 | 线上 direct 值 | 目标服务 | 事实 |
| --- | --- | --- | --- |
| `situationConfigUrl` | `https://10.206.144.252:9011/serviceDiscovery/cloud.view.server-gcss` | cloud.view.manager | 值绕回 server-gcss，未指向目标服务 |
| `configUrl` | `http://10.206.144.137:8888/cloud.view.manager` | cloud.view.manager | 已指向目标服务（网关路径待确认） |
| `AnalysisRuleUrl` | `http://10.206.158.227:11557` | cloud-diagnose | 是否即该服务待确认 |

另：线上镜像 `1.0.0-20240320084444.A2` 实测 4 类接口仍走 server-gcss，与旧镜像调用点未带 `baseUrlType` 一致（当前仓库代码已带）。相关变更任务见 plans/task-2026-11-05-001-api-url-routing.md。

## 维护规则

- 新增 URL 三元组键：须同步仓库 `public/environment.json` 与 k8s 线上配置，双写 direct / discover，否则环境漂移
- 新增调用点：请求必须携带 `baseUrlType` 指向既有键；未携带会被拼到 `serviceDiscovery`（历史坑，见上位文档 §3）
- `describe1` 字段为键用途注释，随键维护

## 变更记录

- 2026-11-05：初版，自 001-overview §3.1/§3.2 拆出并补全键清单
