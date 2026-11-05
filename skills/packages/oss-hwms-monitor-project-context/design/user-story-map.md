# user-story-map

## 角色

- 家客运维监控人员：日常盯屏、处理家客网络故障（主角色）
- 规则维护人员：配置故障分析规则与预处理规则

## 主旅程

1. 态势总览：进入 situation，查看家客网络整体告警态势与地图分布
2. 告警定位：从态势下钻 topo / alarm-topo，定位故障影响的网络拓扑与范围
3. 故障诊断：进入 fault-diagnosis 发起诊断，在 diagnosis-result 查看诊断结论与明细
4. 规则管理：诊断不命中时，到 fault-rules-management / analysis-rules-management 维护规则
5. 业务跟踪：broadband-service / television-service 查看家宽、电视业务实例详情与处理进展
6. 应急处理：emergency 页面支撑应急上报与报表

## 辅助故事

- 运维人员切换主题、导出表格（common/export、xlsx）
- 规则维护人员按类型/ID 进入规则设置子页（路由参数 :type/:id）
