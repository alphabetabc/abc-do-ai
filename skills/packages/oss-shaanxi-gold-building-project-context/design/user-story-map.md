# user-story-map.md · 用户旅程

> **init 草稿 · 待显式确认后生效**（2026-09-04 init）
>
> 证据来源：`docs/design/system-overview.md` §2、`docs/as-is/routes-menus.md`、`docs/specs/001-gold-building/as-is.md`。
>
> 本期无登录态、无 RBAC，所有“用户角色”都是基于现网访问形态反推。引入登录态后必须重写本表。

---

## 用户角色

| 角色 | 关键诉求 | 现网访问方式 |
| --- | --- | --- |
| 运维人员 | 查看金楼告警、资源状态，快速定位异常 | 公开访问 `/gold-building` |
| 管理人员 | 查看综合资源整体可视化、复盘要客场景 | 公开访问 `/` 与 `/gold-building` |
| 演示访客 | 体验金楼 3D 展示 | 公开访问 `/demo-building-viewer` |

> 注：现网不做账号区分，三类角色看到的页面与数据完全一致。角色诉求差异由「需求方 / 验收方」侧体现（见 `docs/specs/001-gold-building/as-is.md` §7.1）。

## 主用户旅程（金楼核心 · 运维视角）

1. **进入**：从 `/` 首页点击“金楼可视化” → 路由到 `/gold-building`。
2. **加载 3D**：浏览器拉取 Cesium 资产 + `/api/goldBuilding/gis` + `/api/goldBuilding/gisData` + `/api/goldBuilding/twinInstance`，构建场景。
3. **查看告警**：打开侧栏告警面板 → 调 `/api/goldBuilding/alarmList` → 点条目调 `/api/goldBuilding/alarmDetail`。
4. **查看资源**：调 `/api/goldBuilding/resourceList` → 点条目调 `/api/goldBuilding/resourceDetail`。
5. **环境监测**：调 `/api/goldBuilding/environment` → 用 ECharts 渲染温度/湿度/能耗等。
6. **孪生联动**：调 `/api/goldBuilding/twinAlarm` 把告警位置高亮在 3D 场景。
7. **侧栏组件**：调 `/api/goldBuilding/sideComp` 拉取侧栏快捷入口。

> 完整 API 清单见 `docs/specs/001-gold-building/as-is.md` §2；本表不重复定义 HTTP 形状。

## 主用户旅程（演示视角）

1. **进入**：`/demo-building-viewer` 直达建筑预览器。
2. **演示操作**：旋转、缩放、剖切；调用的接口与 `/gold-building` 共享。
3. **退出**：返回 `/`。

## 边缘场景

| 场景 | 处理 |
| --- | --- |
| 3D 资产加载失败 | 走 Mock 城市数据降级（见 `docs/design/architecture.md` §可用性） |
| 移动端窄屏 | 3D 场景默认禁用触屏控件；侧栏折叠为底部抽屉（与 as-is 一致） |
| API 500 | 顶层错误边界展示降级提示；不暴露后端栈 |
| Mock 数据过期 | 接生产 API 前必须保留 Mock 路由以便回退（`web/services/` 双轨） |

## 与功能模块的对应

| 旅程阶段 | 对应模块 | 状态 |
| --- | --- | --- |
| 路由 + 壳 | `src/modules/goldBuilding/controller/` + `web/pages/gold-building/` | 已落地（来自 `docs/as-is/routes-menus.md` §2） |
| 3D 加载 | `web/components/earth/` + `public/libs/cesium/` + `web/pages/gold-building/` | 进行中（`docs/specs/000-components/001-earth/` 草稿） |
| 告警 / 资源 / 环境 / 孪生 | `src/modules/goldBuilding/controller/*Api.ts` + `web/services/` | 已落地（`docs/specs/001-gold-building/` 草稿） |
| 演示页 | `web/pages/demo-building-viewer/` | 已落地 |
| 北极星度量 | 后端埋点 / 前端事件 | 待评估 |
