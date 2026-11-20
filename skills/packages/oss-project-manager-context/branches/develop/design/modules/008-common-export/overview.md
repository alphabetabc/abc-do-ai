# 008-common-export

页面公共导出工具。src/pages/common/export.js。非路由页面，仅一个模块。

## 功能

- exportExcel(columns, dataSource, fileName, filter)：按表格列定义把 dataSource 生成前端本地 Excel（xlsx 库，Sheet1）。
- filter 传 dataIndex 数组时只导出勾选列（配合 home-page 的导出列设置 home-page-export-column）；为空导出全部列。
- 列头取 item.title，数据取 item[dataIndex]，不支持 render 转换——依赖列原始值可读。

## 使用方

- home-page 及各列表页的前端导出场景。注意与后端导出接口（netWork/exportProInfo 等）是两条路径：本工具纯前端拼文件，大数据量会卡 UI。

## 六要素补齐（2026-11-19 真源核查）

- **路由与入口**：无路由；工具模块（src/pages/common/export.js）。
- **组件树**：单文件 exportExcel(columns, dataSource, fileName, filter=[])。
- **状态管理**：无。
- **接口清单**：无（纯前端，xlsx 库拼装）。
- **可复用点**：即本模块本体；filter 传 dataIndex 数组支持勾选列导出。
- **已知坑**：不支持 render 定制单元格；大数据量卡 UI（走后端 netWork/export* 代替）。
