# v2 · 聊天窗 + MCP 平台化设计

> 状态：设计稿（待评审） · 日期：2026-11-17
> 背景：leader.md 会议决策——现有 skill MVP（v1）保留，转向「引导式对话 + 组件库」产品形态。

## 1. 产品定义（本设计的唯一出发点）

**一句话**：一个用户打开一个网站，聊几句话，得到一块能看的大屏——这个页面本身就是产品。

领导的核心关切不是技术路线，而是「这是否是一个产品」。据此，所有技术物（MCP、schema、spec、AI 开发管线）都是实现手段，**不出现在产品语言里**。

**用户看到的产品形态**：

```
产品 = 一个网站
├── 场景列表页：创建「场景」（项目）→ 进入工作区
├── 工作区：左聊天 + 右大屏
│   ├── 聊天 = 引导式（给选项，不是开放题）
│   └── 右侧 = 所见即所得，聊完即变
├── 能保存、能再进来继续改（场景持久化 / 版本入口）
└── （远期）能分享/发布出去给别人看
```

**目标用户**：不懂技术的业务用户（零代码、无研发介入）。

**验收口径**：演示时领导**自己点开、自己聊、自己看到出屏**，全程不需要我们操作或解释。

## 2. 演示脚本（领导自助操作的 3 分钟）

```
1. 打开网站 → 点「新建场景」→ 输入名字「设备监控」
2. 工作区聊天窗引导：
   「你想要什么布局？」→ 点选 [三段式] [左右分栏] [上下结构]
   「左边放什么？」→ 点选 [指标卡] [排行榜] [图表] ...（来自组件库）
   「右边放什么？」→ 点选 [地图] [视频] ...
3. 右侧大屏逐块出现（每答一题刷新一次）
4. 继续聊：「把指标卡换成翻牌器」→ 右侧立刻变
5. 退出再进入 → 场景还在，能继续改
```

第 2-4 步即领导要求的「两句话生成组件并嵌入大屏」极简闭环。

## 3. P0 边界（最小可演示产品）

**做**：

- 场景工作区页：左聊天（Hermes iframe，支持收起/展开，收起后呈现区占满）+ 右呈现区（screen-renderer 渲染，SSE 热刷新）
- 引导式对话：首版引导只覆盖 布局选择 → 组件选择 两级（点选为主）
- MCP 能力：物料检索 + 大屏 schema 读写（接口清单 §4）
- 场景持久化：schema 落盘，刷新/重进不丢

**不做清单**：

- 不做多用户/账号系统（演示单机）
- 不做分享/发布（远期）
- 不做 ES、图数据库数据源（领导明确 P2，先 mock/DB）
- 不做设计稿图像识别还原（多模态远期）
- 不做 spec → AI 开发的工程化沉淀链路（P1 评估，见 §6）
- 不改物料内容、不改 playground 既有定位

## 4. MCP 接口契约（P0 · 实现层，产品语言里不出现）

| tool | 入参 | 出参 | 用途 |
| --- | --- | --- | --- |
| `list_materials` | `category?`, `keyword?` | `[{name, category, description, tags}]` | 供聊天层做组件选型引导 |
| `get_material_detail` | `name` | `{spec, dataModel, examples}` | 供智能体理解 Props/契约 |
| `get_current_screen` | — | 当前完整 schema JSON | 迭代前提：知道屏上有什么 |
| `assemble_screen` | `schema`（完整） | `{ok, screenId}` | 全量生成/替换大屏 |
| `upsert_component` | `sectionId`, `component`（物料名 + props） | `{ok}` | 单组件增改——「两句话迭代」核心 |
| `list_assets` | `type?`（background / decoration / icon） | `[{id, name, type, url}]` | 检索素材库，供聊天层选背景/装饰/图标 |
| `get_asset` | `id` | `{id, name, type, url}` | 取单个素材，schema 中以 `asset://id` 引用 |

素材管理页面与场景列表平级（原型见 prototype.html 页面 3）：上传/删除/删除保护（被引用素材禁止删除）；素材落盘于 builder 数据目录，schema 通过 `asset://id` 引用保持可序列化（P1 版本管理不被素材耦合破坏）。

校验：zod 结构校验 + 物料 type 必须在 registry 中；不合法返回 `{code, message, issues[]}` 供智能体自纠。接口只收结构化 schema，不收自由文本（语言理解归智能体 + skill 领域知识）。

## 5. 架构（实现备注，细节见 hld.md）

```
本仓新增两个平行顶层目录（与 packages/、apps/ 同级）：

platform-apps/              ★ P0 产品载体 · 全新独立应用（产品本身）
└── builder/                   对话搭建平台（场景列表页 + 工作区页）
    └── src/pages/
        ├── scenes/            场景列表：新建/进入场景
        └── workspace/         工作区：chat-panel(Hermes iframe) + live-screen(SSE 热刷新)

packages-platform/          平台能力层
└── mcp-server（独立 Node 进程 :8787，Streamable HTTP）
      ├── material-repo   读物料 registry（组件库 → 聊天引导的选项来源）
      ├── screen-store    schema 内存权威 + 落盘（场景持久化）
      └── screen-events   SSE 广播
```

- mcp-server 读写对象经 `--root` 参数化指向宿主，天然支持 playground 验证与后续任意宿主
- 骨架（docs/skeleton/）**不预埋聊天**，保持纯渲染宿主定位；对话能力住平台侧
- 技术选型：TS + `@modelcontextprotocol/sdk` + Streamable HTTP + tsx/tsc；不引入 Snowpack

## 6. 迭代分层（应对「配置级 vs 文档级」的路线分歧）

| 层 | 内容 | 状态 |
| --- | --- | --- |
| 快速迭代层（P0） | 聊天 → schema/组件配置 → 立即刷新（领导要的演示形态） | 本设计主体 |
| 工程沉淀层（P1 评估） | 聊稳定后生成 docs/pm、docs/specs → AI 照 spec 开发为正式工程（复用既有 spec 驱动链路） | 挂起，演示反馈后决策 |

两层不冲突：上层管体验与速度，下层管交付物完整性。P0 不做下层。

## 7. 分期

| 阶段 | 内容 |
| --- | --- |
| P0 | 产品定义 §1-§3：工作区页 + 引导对话 + 5 tool MCP + 场景持久化，支撑领导自助演示 |
| P1 | 版本管理（`list_versions`/`restore_version`，领导点名）+ 工程沉淀层评估 |
| P2 | 数据层（§7.1）：聊天中自动建表 + 生成 API + 组件绑定（领导点名「自动生成 API 与表结构」） |

### 7.1 P2 数据层概要（对话式建表）

领导原话：「自动生成 API 与表结构」「当前阶段仅需先支持数据库查询，聚焦查询性能与库表定义」。产品形态：**用户全程不碰 SQL / 后台，从展示需求倒推数据模型**——

```
用户：「这块翻牌器展示真实告警数，别用演示数据」
  → define_table(alarm_stats: level, count, updated_at)   建表（SQLite 起步）
  → create_api(GET /api/q/alarm-stats)                    生成查询接口
  → bind_datasource(翻牌器 → /api/q/alarm-stats)          组件 props 绑定
  → 翻牌器显示真实数字
```

| tool | 入参 | 出参 | 用途 |
| --- | --- | --- | --- |
| `define_table` | `name`, `cols[]`（名/类型） | `{ok, tableName}` | 聊天中建表（SQLite 起步，后续扩展 ES/图数据库） |
| `create_api` | `table`, `method?`, `path?` | `{ok, apiPath}` | 生成查询接口（查询性能在此层优化） |
| `bind_datasource` | `componentId`, `apiPath` | `{ok}` | 组件 props 绑定接口，替换 mock 数据 |

配套：工作区数据面板（已建表 / 已生成 API / 组件绑定关系，见原型页面 4）。P0 组件全部 mock 数据（examples 自带），演示叙事不受影响；建表能力为 P2 有设计预留，非一句占位。

## 8. 原型与待评审问题

交互原型：[prototype.html](./prototype.html)（场景列表 / 工作区 / 素材管理 / P2 数据链路共四页，含 MCP 调用轨迹与 P2 对话式建表形态）。

待评审：

1. ~~P0 载体~~ 已定：`platform-apps/builder` 全新独立应用（playground / show-case 均不动）
2. 引导对话的选项结构（布局模板清单、组件分组）需与物料库现状对齐后定首版
3. ~~Hermes iframe 接入协议~~ 已定（020 实测）：iframe 嵌 `#/hermes/session/<id>`（CSP 允许、登录态共享）；会话管理走平台侧 REST；transport 为 http+SSE

## 9. Hermes（Ekko Studio）接入实测结论（020 调研，2026-11-17）

实例：`http://10.10.6.175:6060/`（Ekko Studio，内部叫 Hermes）。P0 全部外部依赖实测可行：

| # | 能力 | 实测结论 |
| --- | --- | --- |
| 1 | iframe 嵌聊天窗 | ✅ CSP `frame-ancestors *` 允许；窄版单会话路由 `#/hermes/session/<id>`；登录态与浏览器共享 |
| 2 | 平台程序化管理会话 | ✅ REST：`POST /api/studio/sessions`（建，body `{"title"}`）/ `GET /api/studio/sessions`（列）/ `DELETE /api/studio/sessions/<id>`（删） |
| 3 | 认证 | `Authorization: Bearer <JWT>`；token 在浏览器 localStorage `hermes_api_key`（约 30 天），演示机登录一次 |
| 4 | 智能体挂外部 MCP server | ✅ `#/hermes/mcp` UI 入口；实例已有 http 类型连接成功的先例（kb-mcp）→ **transport 定为 http+SSE** |
| 5 | 挂 large-screen-builder skill | ✅ `#/hermes/skills` 支持导入 zip/文件夹 |

要点与产品模型影响：

- UI「新建对话」不走 HTTP（发首条消息时 WebSocket 惰性建会话），REST API 独立存在，平台侧直接调
- **场景 = 1 份 schema + N 个会话**（平台侧自管理「场景 ↔ 会话 id 集 ↔ schema」映射）；聊天渲染依托 iframe 嵌当前激活会话；会话 tab / 新建会话为平台自建薄 UI（调 REST）
- 详见任务卡 `plans/done/2026-11/task-2026-11-17-020-hermes-feasibility.md`（含 curl 与截图目录）

## 变更记录

- 2026-11-17 初稿（依据 leader.md 会议决策）
- 2026-11-17 修订 1：MCP 能力独立为 `packages-platform/`；宿主 show-case
- 2026-11-17 修订 2：运行底座改为 skill 生成宿主项目、platform 随 skill 分发
- 2026-11-17 修订 3：**重定位为产品定义驱动**——「这是否是产品」为唯一评判标准；骨架不预埋聊天、对话能力住平台侧；补演示脚本（领导自助 3 分钟）、P0 边界、迭代分层（配置级 P0 / spec 工程沉淀 P1）；hld.md 降级为实现备注
- 2026-11-17 修订 4：P0 载体定为新顶层 `platform-apps/builder`（全新独立应用，playground / show-case 均不动）
- 2026-11-17 修订 5：020 调研结论回写——新增 §9 Hermes 接入实测；场景模型定为「1 schema + N 会话」；transport 定为 http+SSE；关闭待评审问题 3
- 2026-11-17 修订 6：补 P2 数据层概要 §7.1（对话式建表：define_table / create_api / bind_datasource，SQLite 起步），回应领导「自动生成 API 与表结构」要求；原型同步新增页面 4 数据链路
