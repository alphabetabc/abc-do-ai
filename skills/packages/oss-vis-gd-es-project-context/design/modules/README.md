# modules/ · 模块文档索引

按大屏模块归档的功能维护文档。每模块入口为 `modules/<name>/readme.md`，附属文档在其子目录。原 skill 目录名（`.trae/skills/gd-es-next-*`）与本目录短名的对应关系见文末。

| 模块 | 覆盖范围 |
| --- | --- |
| header | 顶部 header：任务选择、通知滚动、响应级别 |
| assurance-progress | 左屏保障进度（进度列表、步骤编辑） |
| left-emergency-resources | 左屏应急资源（图表、详情弹窗、资源 Tab） |
| interaction-fields | 跨模块交互字段注册表（fields.ts 派发/消费映射） |
| dispatch-gis-maintenance | 中屏应急传输 GIS（center-gis、图例、飞线、弹窗） |
| warn-gis-maintenance | 中屏预警感知 GIS（风险预测打点、天气/水情预警） |
| ui-emap-gis | 通用地图底座 emap-gis（WFS/WMS、动画点、弹窗） |
| right-dispatch-tasks | 右屏抢修调度（汇总、工单 Steps、资源使用） |
| right-real-time-impact | 右屏实时影响（网络规模、乡镇受损下钻） |
| emergency-api-generator | 应急模块标准 API 函数生成（viewItemId 取数） |

同名 skill 仍在 `.trae/skills/` 下作为可用 skill（目录名带 `gd-es-next-` 前缀）；本目录为其文档快照，内容以两边较新者为准，改动时须同步。
