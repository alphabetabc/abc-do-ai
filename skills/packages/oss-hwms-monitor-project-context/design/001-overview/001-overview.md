# 001 · 项目总体设计（Overview）

> 层级：design/ 意图层 · 项目全貌篇；模块级设计见 `002-modules/<模块>/overview.md`
> 姊妹篇：`design/architecture.md`（技术栈/目录）、`design/vision.md`（定位/北极星）、`design/user-story-map.md`（角色旅程）

---

## 1. 定位与运行形态

OSS 集中故障·家客监控前端，**微前端子应用**：不独立运行完整框架，由宿主应用注入全局状态（登录信息、主题、路由跳转），通过 postMessage 与宿主通信。

- 入口 `src/index.js` 双模式：BrowserRouter（独立调试）/ MemoryRouter（微前端嵌入）
- 应用壳 `src/App.js` 消费宿主 props（`onGlobalStateChange`、curRoute 等）
- 跨应用事件：`src/share/actions.js` postMessage

## 2. 运行时骨架

```
宿主应用
  └─ 注入 props（登录信息 / 主题 / 路由）
       └─ src/App.js（应用壳）
            ├─ src/hox/             全局模型：useLoginInfoModel / useEnvironmentModel / usePageInfoModel
            ├─ src/routes/index.js  集中路由表（oss-web-common router.buildRoutes 构建，17 条路由）
            └─ src/pages/<模块>/     页面模块（模块内 common/interface-config.js 声明接口）
```

## 3. 网络层（横切关键机制）

```
页面 / services 层
  └─ src/common/api/index.js  createWebService 统一实例
       ├─ requestTransforms
       │    请求带 baseUrlType → 查 environment.json[baseUrlType]
       │      ├─ mode:direct   → direct + pathname + search
       │      └─ mode:discover → serviceDiscovery + "/" + discover + path
       │    未带 baseUrlType   → 直接拼 serviceDiscovery（历史行为，旧镜像问题来源）
       └─ responseTransforms   401 处理 / sqlm 数据 camelCase
```

- 地址来源：`public/environment.json`（运行时加载，进 `useEnvironmentModel`），**代码不写死环境地址**（仓库硬约束）
- 本地调试：`src/setupProxy.js` 把 `/serviceDiscovery` 代理到测试网关
- 配置条目统一 `{ direct, discover, mode }` 三元组，direct/discover 双写、mode 切换
- **键清单（全局标量 / URL 三元组 / UI 配置三类）、部署形态与已知配置事实**：见 `002-modules/environment-config/overview.md`

## 4. 页面模块地图

| 路由 | 模块 | 职责一句话 | 服务层 | baseUrlType | 模块设计 |
| --- | --- | --- | --- | --- | --- |
| `/situation` | situation | 业务概况大屏（规模/故障/质量三视图 + 设置抽屉） | situationService | situationUrl / situationConfigUrl | 002-modules/situation |
| `/topo` | topo | 集客端到端拓扑与资源信息 Tabs | topoService | situationUrl | 002-modules/topo |
| `/alarm-topo` | alarm-topo | 告警拓扑（oss-topo，OLT/ONU XML 拓扑） | topoXmlProxyUrl 直连 | — | 002-modules/topo |
| `/report/emergency` | emergency | 应急保障概况报表（查询 + Excel 导出） | dataService | experiencesUrl | 002-modules/emergency |
| `/fault-diagnosis`、`/diagnosis-result*` | fault-diagnosis | OLT/ONU/用户端到端故障诊断 + 结果查询 | interface-config 驱动 | AnalysisRuleUrl | 002-modules/fault-diagnosis |
| `/fault-rules-management` | fault-rules-management | 故障诊断规则 CRUD + 导入 | 模块内 interface-config | AnalysisRuleUrl | 002-modules/rules-management |
| `/analysis-rules-management` | analysis-rules-management | 故障分析规则 CRUD + 导入导出（与上同构） | 模块内 interface-config | AnalysisRuleUrl | 002-modules/rules-management |
| `/falut-rules-management` | falutRules-management（目录名拼写如此） | 预处理任务管理 | 模块内 api.js | preProcessingManagementUrl | 002-modules/rules-management |
| `/broadband-service`（+/detail） | broadband-service | 宽带业务场景（panel/ring 图 + 指标配置） | broadbandService | broadbandUrl / configUrl | 002-modules/broadband-television |
| `/television-service`（+/detail） | television-service | 电视业务场景（同构，gauge 仪表盘） | broadbandService | broadbandUrl / configUrl | 002-modules/broadband-television |
| `/` | test | 开发调试导航页（无业务） | — | — | — |
| （未注册） | home | 脚手架默认页，无业务功能 | — | — | — |

## 5. 通用组件与共享层

- `src/components/`：alarm-window-view（告警窗口视图，含右键菜单/工具栏配置消费）、auth-button（按钮权限）、column-chart / line-chart / echarts-map / situation-map（图表与地图）、search-condition / select-search（查询条件）、drawer-alarm-table、page-container、upload / upload-modal（导入）、row-delete、custom-modal-footer
- `src/common/services/`：situationService / topoService / broadbandService（视图服务族）、dataService（sqlm 下沉查询）、mapConfigService + mapConfigs（场景配置 JSON 按名加载，带缓存）
- `src/hox/`：useLoginInfoModel（含按钮权限、systemInfo/theme）、useEnvironmentModel（environment.json）、usePageInfoModel

## 6. 硬约束（承接 architecture.md / AGENTS.md）

- 不改 `config/`、`scripts/` 脚手架；不升级 webpack/react 大版本
- UI 统一 `oss-ui` 系内部库，不引入新 UI 库
- 环境地址只进 `public/environment.json`，不写死代码
- 新页面进 `src/pages/` 并在 `src/routes/index.js` 注册；路径别名 `@Src` → `src/`

## 7. 模块级设计索引（002-modules）

| 模块 | 文档 |
| --- | --- |
| situation（业务概览） | `002-modules/situation/overview.md` |
| topo / alarm-topo（拓扑） | `002-modules/topo/overview.md` |
| emergency（应急保障） | `002-modules/emergency/overview.md` |
| fault-diagnosis（故障诊断） | `002-modules/fault-diagnosis/overview.md` |
| rules-management（三模块规则管理族） | `002-modules/rules-management/overview.md` |
| broadband-television（宽带/电视业务） | `002-modules/broadband-television/overview.md` |
| environment-config（运行时环境配置 environment.json） | `002-modules/environment-config/overview.md` |

## 8. 变更记录

- 2026-11-05：初版项目级总体设计回填（基于全模块调研）
