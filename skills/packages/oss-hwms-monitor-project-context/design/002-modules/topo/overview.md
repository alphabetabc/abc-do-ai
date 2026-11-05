# topo / alarm-topo · 拓扑模块

> 上位文档：`001-overview/001-overview.md`

## topo（集客端到端拓扑）

路由 `/topo`。Tabs：拓扑信息（topology/topo-view）、客户信息（business）、接入网资源（access-net）、城域网资源（man-resources）、CDN 信息（cdn-info），按资源类型条件显示。

- 服务层：`src/common/services/topoService.js`（baseUrlType `situationUrl`，视图服务）

## alarm-topo（告警拓扑）

路由 `/alarm-topo`。基于 `oss-topo` 库（ProcessingNetwork/NetworkDom），按 resType 加载 OLT（OltPartialS3X）/ ONU（OnuPartialS3X）拓扑 XML 并支持分组展开。

- 拓扑 XML 走 `topoXmlProxyUrl`（environment.json 独立条目，当前指向 server-gcss）
- 子组件：left-tabs、terminal
- 显隐开关：`topoOptionShow`（机顶盒选项）、`topoCodeGd`（广东特殊参数）

## 已知问题

- alarm-topo 未读取到模块专属 service 文件（接口经代理直连，未走统一 baseUrlType 机制）
