# user-story-map.md

## 角色

- 运维监控人员：日常使用查询、规则、报表功能的一线用户。
- 接手维护者/开发：在既有架构约束下迭代功能、修缺陷的工程师（含协作 agent）。

## 主旅程

### 指标管理

- 定义/编辑性能指标与度量指标（performance-indicator-manage、performance-mea-indicator、performance-per-indicator）。
- 维护指标分组，支持导入既有指标（performance-indicator-group）。
- 配置自定义变量与指标模板。

### 性能查询

- 单机查询：选网元 + 指标 + 时间段，图表/表格查看当前与历史值（performance-query）。
- 区域查询（performance-query-region）、批量查询（performance-query-batch，支持上传）。
- 类型查询（performance-query-type）、性能趋势（performance-trend）。
- 性能数据查询与视图（performance-data）。

### 规则与阈值

- 配置性能告警规则：指标条件 + 网元条件 + 其他设置（performance-rules/edit-rule）。
- 阈值设置：阈值分组、网络元素、生效时间（threshold-setting）。

### 数据校验

- 数据核对规则设置与删除（data-verifying/rule-setting、del-data-verify）。

### 报表

- 维护报表模板：基础信息、流程设置（performance-report-template/template-setting）。
- 生成与查看报表样例（performance-report-example）。

### 总览监控

- 性能总览监控页，关键指标一屏呈现（performance-over-monitor）。

## 维护者旅程

- 接手：读 oss-pmmp-project-context 的 SKILL.md，按 Pointer Map 加载上下文。
- 新增页面：src/pages/ 建目录 + src/routes/index.js 注册。
- 排查历史决策：git log + design/architecture.md。
