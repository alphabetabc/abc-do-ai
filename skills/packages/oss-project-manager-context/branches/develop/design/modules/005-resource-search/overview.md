# 005-resource-search

工程资源查询页。src/pages/resource-search。

## 功能

- 多级条件检索工程资源：专业（二级专业）、厂商、网元、区域/地市/城市级联。
- 结果 VirtualTable 分页展示（默认 20 条/页），列由查询条件动态生成（getColumns，含表单项内嵌 Select）。
- 行勾选汇总：模块级变量 rowSummary 累计跨页勾选数据。
- 导出：projectResource/export。

## 结构

```text
index.jsx    主容器（类组件 + hox withModel）
api.js       3 个接口 + loadJSON
style.less
```

## 关键实现

- 下拉数据源：apiSqlm 风格 loadJSON 加载本地配置（secondaryMajor、manufacturer、networkElementCollection），专业切换时按 typeList/dataId=14 过滤网元列表。
- 区域树：projectResourceOptions({ parameterName: 'region', userId })，取首个 region 的 children 为城市。
- 接口域（baseUrlType=exportUrl）：appointment/options、projectResource/findObjectsByCondition（核心查询）、projectResource/export。
- rowSummary 为模块级变量，组件卸载不清空，跨实例共享——改动勾选逻辑时注意副作用。

## 六要素补齐（2026-11-19 真源核查）

- **路由与入口**：/resource-search（src/routes/index.js）。
- **组件树**：src/pages/resource-search → 仅 index.jsx（页面主体，条件区/结果表都在其中）+ api.js + style.less，无子组件目录。
- **状态管理**：无全局状态，组件内 state。
- **接口清单**：src/pages/resource-search/api.js（exportUrl）：appointment/options（区域树）、projectResource/findObjectsByCondition（查询）、projectResource/export（导出）。
- **可复用点**：appointment/options parameterName='region' 的区域级联模式（取 children 为城市）。
- **已知坑**：无。

