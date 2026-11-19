# 宿主（20020）iframe 菜单接入

宿主 http://10.10.6.53:20020（docker 容器 oss-broadnet-cq-frontend），「性能监控」根菜单下 15 条 external_iframe 子菜单嵌入 pmmp。

## 已部署菜单清单（2026-11-19）

| 菜单名 | path | pmmp 路由 |
| --- | --- | --- |
| 告警条件设置 | /ext/pmmp-rules | performance-rules |
| 性能分类查询 | /ext/pmmp-query-type | performance-query-type |
| 缺数检测设置 | /ext/pmmp-data-verifying | data-verifying |
| 性能指标组管理 | /ext/pmmp-indicator-group | performance-indicator-group |
| 性能趋势 | /ext/pmmp-trend-modal | performance-trend-modal |
| 性能趋势页面 | /ext/pmmp-trend | performance-trend |
| 阈值设置 | /ext/pmmp-threshold | threshold-setting |
| 性能数据查询 | /ext/pmmp-query | performance-query |
| 性能指标管理 | /ext/pmmp-indicator-manage | performance-indicator-manage |
| 报告模板管理 | /ext/pmmp-report-template | performance-report-template |
| 总体监控视图 | /ext/pmmp-over-monitor | performance-over-monitor |
| 测量指标查询 | /ext/pmmp-mea-indicator | performance-mea-indicator |
| 报告实例管理 | /ext/pmmp-report-example | performance-report-example |
| 性能指标查询 | /ext/pmmp-per-indicator | performance-per-indicator |
| 性能批量查询 | /ext/pmmp-query-batch | performance-query-batch |

- external_url 模板：`http://10.10.6.53:9016/pmmp/<路由>`
- parent_id（性能监控根菜单）：`eda2200e-66c7-457c-b88a-1db527e251db`
- 超管角色 roleId：`91189641-c612-472f-aa70-9cfb38b710f0`（已授权全量 34 条）

## API（登录后在浏览器控制台执行，token 取 `localStorage.getItem('token')`，请求头 `Authorization: Bearer <token>`）

### 建 iframe 子菜单：POST /api/v1/menus

```json
{
  "name": "菜单名",
  "path": "/ext/pmmp-<slug>",
  "icon": null,
  "parent_id": "eda2200e-66c7-457c-b88a-1db527e251db",
  "sort_order": 1,
  "level": 2,
  "status": 1,
  "is_visible": true,
  "is_default_route": false,
  "external_link": true,
  "menu_type": "external_iframe",
  "external_url": "http://10.10.6.53:9016/pmmp/<路由>",
  "allow_sensitive_params": false,
  "iframe_sandbox": "allow-scripts allow-same-origin allow-forms allow-popups",
  "action_id": null
}
```

约束：path 必须 `/ext/` 开头；menu_type `external_iframe` = Shell 内 iframe 嵌入；子菜单路径不必以父级为前缀。

### 角色授权：PUT /api/v1/roles/{roleId}/menus

body：`{"menu_ids": ["<全量菜单id>"]}`（幂等，传全量）。
注意：`PUT /api/v1/roles/{id}`（角色本体）不会更新 menu_ids，必须用 `/menus` 子接口。

### 其他

`GET /api/v1/menus`（树）、`PUT /api/v1/menus/{id}`（改）、`DELETE /api/v1/menus/{id}`（删）、`PUT /api/v1/menus/reorder`（排序）。

## 批量建菜单脚本

```js
const h = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') };
const PARENT = 'eda2200e-66c7-457c-b88a-1db527e251db';
// (名称, path slug, pmmp路由, sort)
const items = [
  ['告警条件设置','pmmp-rules','performance-rules',1],
  ['性能分类查询','pmmp-query-type','performance-query-type',2],
  ['缺数检测设置','pmmp-data-verifying','data-verifying',3],
  ['性能指标组管理','pmmp-indicator-group','performance-indicator-group',4],
  ['性能趋势','pmmp-trend-modal','performance-trend-modal',5],
  ['性能趋势页面','pmmp-trend','performance-trend',6],
  ['阈值设置','pmmp-threshold','threshold-setting',7],
  ['性能数据查询','pmmp-query','performance-query',8],
  ['性能指标管理','pmmp-indicator-manage','performance-indicator-manage',9],
  ['报告模板管理','pmmp-report-template','performance-report-template',10],
  ['总体监控视图','pmmp-over-monitor','performance-over-monitor',11],
  ['测量指标查询','pmmp-mea-indicator','performance-mea-indicator',12],
  ['报告实例管理','pmmp-report-example','performance-report-example',13],
  ['性能指标查询','pmmp-per-indicator','performance-per-indicator',14],
  ['性能批量查询','pmmp-query-batch','performance-query-batch',15],
];
const created = [];
for (const [name, slug, route, sort] of items) {
  const res = await fetch('/api/v1/menus', { method: 'POST', headers: h, body: JSON.stringify({
    name, path: '/ext/' + slug, icon: null, parent_id: PARENT, sort_order: sort, level: 2,
    status: 1, is_visible: true, is_default_route: false, external_link: true,
    menu_type: 'external_iframe', external_url: 'http://10.10.6.53:9016/pmmp/' + route,
    allow_sensitive_params: false, iframe_sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups',
    action_id: null }) });
  const j = await res.json();
  if (j.code === 200) created.push(j.data.id); else console.error(name, j.message);
}
console.log('created:', created.length);
// 全量授权：现有授权 + 新建菜单
const role = (await (await fetch('/api/v1/roles', { headers: h })).json()).data.items[0];
const auth = await fetch(`/api/v1/roles/${role.id}/menus`, { method: 'PUT', headers: h,
  body: JSON.stringify({ menu_ids: [...role.menu_ids, ...created] }) });
console.log('授权:', (await auth.json()).message);
```

## 权限策略

当前 buttonAuthorize=false，前端按钮权限全开（src/components/auth-button/index.jsx：buttonAuthorize 为 false 时按钮全部显示，不校验权限 key），不依赖宿主 Token。后续收紧：宿主菜单支持「允许 URL 传递 Token」（allow_sensitive_params），24 个权限 key 可通过 `POST /api/v1/permissions` + `PUT /api/v1/roles/{roleId}/permissions` 迁移。
