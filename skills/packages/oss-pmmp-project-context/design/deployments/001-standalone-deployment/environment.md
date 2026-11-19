# environment.json 配置说明

## 加载机制

- 代码位置：src/hox/index.js（环境信息 model）。`REACT_APP_CONFIG_LOCAL === 'true'` 时读随产物部署的本地 `${MICRO_APP_URL}/environment.json`；否则读远端 `${CONFIG_HOST}/configmanage/environment.json?isApply=true&projectName=oss-pmmp`。
- 独立部署（6.53）无 configmanage 服务 → 用 `yarn build:standalone`（scripts/build-standalone.js 设 `REACT_APP_CONFIG_LOCAL=true` 后复用 scripts/build.js）走本地文件。
- 服务器上实际生效文件：`/opt/iptv/web/pmmp/build/environment.json`，可直接编辑，**无需重新构建**。
- 模式说明：各服务块 `mode: direct` 用 `direct` 地址；`discover` 为服务发现 key（当前全部未用）。

## 后端地址清单（2026-11-19 状态）

| 配置项 | 影响功能 | 现值（6.53 部署） | 结论 |
| --- | --- | --- | --- |
| alarmModelUrl | 告警条件设置、阈值设置、总体监控视图 | http://10.10.6.53:8099 | ✅ 服务端确认走 8099 |
| performanceQueryUrl | 性能数据查询 | http://10.10.6.53:8099 | ✅ 服务端确认走 8099 |
| dataVerifyUrl | 缺数检测设置 | http://10.10.6.53:8099 | 待服务端确认 |
| kpiMonitorService | 性能指标管理、报告模板、报告实例 | http://10.10.6.53:8099 | 待服务端确认 |
| viewItemUrl | 性能趋势（告警右键视图） | http://10.10.2.22:8085 | 待服务端确认 |
| logOperUrl | 按钮操作日志上报（失败可容忍） | http://10.10.2.8:7001 | 待服务端确认 |
| servicesConfig.objectManage / dataObjectManage | 对象管理、数据对象管理 | http://10.10.2.8:7011 | 待服务端确认 |
| varManagerService | 变量管理（阈值/指标功能） | http://10.10.5.98:8762 | 待服务端确认 |

仓库源文件 public/environment.json 与服务器版本同步维护；改仓库版需推送 + Jenkins 重打包才能进入新构建产物。

## 非地址类配置

- `buttonAuthorize: false`：按钮权限全开（src/components/auth-button/index.jsx，false 时不校验权限 key），不接宿主 Token。
- `overMonitorConfig`：总体监控磁贴颜色（按 topic_id）。
- `performanceTrendAlarmConfig`：性能趋势告警设备指标映射（org_type / network_type_top / eqp_object_class → 指标 id）。
- `performanceQueryParamConfig`：性能查询条件显隐（specialty/vendor/region/unitName，true 隐藏）。2.8 现网版本无此块，行为取代码默认。
- `provinceId`、`timeout`、`serviceDiscovery`：省份编号 / 请求超时 / 服务发现路径。
