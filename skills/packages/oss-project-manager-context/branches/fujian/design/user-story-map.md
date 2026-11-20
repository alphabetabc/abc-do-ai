# user-story-map.md

## 角色

- 调度/管理员：创建与审批工程预约（new-project、quick-project）。
- 运维/施工人员：查看工程安排与执行状态（home-page、home-executing）。
- 资源管理员：检索工程资源（resource-search）。
- 系统管理员：维护系统配置表（system-options）。

## 主旅程

1. 查询工程：在 home-page 按时间、我的工程、专业类型查询，看统计与列表、日历、时间轴。
2. 新建预约：在 new-project 选通用或专题模板（达泛、FGSS、GCSS、精细、IP、链路、端口、SPC 等）填写表单。
3. 审批流转：经 project-audit/auditgb 完成审批；支持重新预约时间、影响分析。
4. 执行监控：home-executing 跟踪正在执行的工程，含剩余时间告警与定时刷新。
5. 资源联动：resource-search 按专业、厂商、网元、区域检索并勾选汇总资源。
6. 配置支撑：system-options 维护工程状态等枚举配置，支撑上述流程。

## 辅助旅程

- 导出：列表导出 Excel（pages/common/export.js）。
- 导入：new-project 支持模板下载与导入。
- 提醒：短信与时间提醒（new-project 配置）。
