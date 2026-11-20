# 002-home-executing

安徽版本「正在执行工程预约列表」。src/pages/home-executing。

## 功能

- 完整复用 home-page：仅以 `executing={true}` 包一层。
- home-page 收到 executing 后，getProjectList / getProjectCalendarList 的查询参数固定追加 `executeStatus: '正在执行'`，列表与日历只展示正在执行的工程。

## 结构

```text
index.jsx    10 行 PureComponent 包装器，无自有状态与接口
```

## 维护要点

- 无独立逻辑。改本页行为实际是改 home-page（见 oss-project-manager-context/design/modules/001-home-page/overview.md）。
- 若安徽版本与通用首页需要分叉行为，当前唯一开关就是 executing 布尔值，勿再加隐性条件。

## 六要素补齐（2026-11-19 真源核查）

- **路由与入口**：/home-executing（src/routes/index.js）。
- **组件树**：src/pages/home-executing/index.jsx，10 行包装器，仅渲染 Home 并传 executing=true。
- **状态管理**：完全落在 001-home-page。
- **接口清单**：无自有接口（继承 home-page，固定 executeStatus='正在执行'）。
- **可复用点**：演示「复用既有页 + 布尔过滤」即可派生新视图的最低成本模式。
- **已知坑**：本页无逻辑，改安徽正在执行页要去 001 改。

