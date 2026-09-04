# earth 组件文档 · 索引

> 组件路径：`web/components/earth`
> 证据日期：2026-09-04（各文档行号均来自当日逐文件 Read 实读）

earth 组件基于 Cesium（远程 UMD 包 `gis3d-lib.umd.js` 动态加载，不直接 npm install）+ valtio + resium 风格 React 绑定，分为**通用层**与**业务层**两份文档：

| 文档 | 范围 | 什么时候读 |
| --- | --- | --- |
| `common-layer.md` | 入口（EarthViewer/EarthApiLoader/EarthRenderer）、hooks（useGis3dLib/useSubscribeKeyState/useClickAction 等）、store（earthRendererStore/editorStore/createRef）、helpers、stage 舞台层全部 13 个子组件（Viewer/场景/I3S/后处理/模型/管体/关系线/顶牌/城市 GeoJSON） | 开发/调试通用渲染能力、扩展舞台层组件、排查 store 联动问题时 |
| `business-layer.md` | business/（EarthInitializer/EarthStageLoader/api 数据工厂/TwinTypeEnumEarth）、business-gold-building/（金牌楼宇查看器：chunk 渲染/hover/高亮/飞行）、editor/（编辑器 UI 面板），含二次开发指南与选型指引 | 搭建业务地球页面、扩展金牌楼宇场景、定制编辑器时 |

两份文档均包含：组件树与数据流、完整 Props/签名、源码行号锚点、开发纪律与约定、已知问题清单（bug 表格）。文档目标是**自足的开发指导**——正常开发无需回读源码。
