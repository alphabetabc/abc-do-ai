# 007-demo-debug-pages

> fujian 状态：test 页有 diff，其余与 develop 一致。

开发调试残留页，无实际业务。合并记录 src/pages 下三个目录：

## demo

index.jsx 仅渲染静态文本「demo页面」。空壳。

## search-demo

index.jsx + style.less，检索示例/演示页，无业务引用价值。

## test

index.jsx 一组路由跳转按钮（首页 /home-page、新建工程 /new-project、系统选项 /system-options 等），用于独立运行时手工验证路由连通。

## 维护要点

- 三页均不承载业务，保留仅为路由占位与开发调试。
- 不扩展、不重构；若清理需同步删除 src/routes/index.js 中的路由项。

## 六要素补齐（2026-11-19 真源核查）

- **路由与入口**：/ 与 /test（test 页）、/search-demo（src/routes/index.js）；本仓无 /demo 路由。
- **组件树**：src/pages/demo/、src/pages/search-demo/（index.jsx，约 900 行的网元查询调试页）、src/pages/test/。
- **状态管理**：组件内 state。
- **接口清单**：search-demo/index.jsx：appointment/options、neInfo/findNeinfo、neInfo/exportNeinfo（exportUrl）。
- **可复用点**：无（调试残留，禁止复用）。
- **已知坑**：路由仍在线上暴露；新增需求不得落在此模块。

