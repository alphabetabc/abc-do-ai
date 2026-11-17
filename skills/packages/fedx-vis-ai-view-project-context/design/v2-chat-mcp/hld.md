# v2 概要设计 · 聊天窗 + MCP 平台化（技术架构）

> 状态：待评审 · 日期：2026-11-17
> 上游：[chat-mcp.md](./chat-mcp.md)（产品形态 / 部署形态 / MCP 接口契约 / 分期）
> 本文定位：**概要设计（HLD）**——技术栈、模块划分、数据流、传输约定、目录规划、分发与验证回路。详细设计（每个 tool 的 zod schema、SSE 协议细节、错误码表）在 P0 任务卡阶段落。

## 1. 技术栈与选型

| 层 | 选型 | 状态 |
| --- | --- | --- |
| MCP 实现 | TypeScript + `@modelcontextprotocol/sdk` | 锁定（`ScreenSchema` 类型 / 物料契约在本仓 TS 生态） |
| mcp-server 形式 | **独立 Node 进程**：dev 用 `tsx watch src/index.ts`，构建校验 `tsc -b` | 锁定（chat-mcp.md D2；不用 Vite 插件寄生、不用 MCP 聚合 app） |
| 传输 | **http+SSE** | 锁定（020 实测：Ekko 实例验证的是 http+SSE 形态，见 §9） |
| schema 校验 | zod（`ScreenSchema` 类型 → zod schema，错误结构化返给智能体自纠） | 待评审（默认 zod，手写校验为备选） |
| 构建工具 | 不引入新构建工具（明确**不用 Snowpack**，已停止维护；mcp-server 是纯 Node 进程，无浏览器 ESM 需求） | 锁定 |
| 前端 | 宿主项目（skeleton 派生）现有 React + Vite；聊天窗 iframe；呈现区 EventSource(SSE) | 锁定 |
| 包管理 | pnpm workspace（新顶层目录 `packages-platform/`） | 锁定 |

## 2. 部署形态与模块划分

### 2.1 部署形态（P0 · 产品定义驱动，见 chat-mcp.md §1/§5）

```
P0：产品 = platform-apps/builder（本仓运行）
  builder 页面（场景列表 + 工作区）
    ├── chat-panel ← Hermes iframe
    └── live-screen ← SSE ← screen-events
  mcp-server（独立 Node 进程 :8787，--root 指向 builder 的场景数据目录）
    └── material-repo 读本仓物料（docs/materials 经 registry）

后续演进（不在 P0）：mcp-server 经 --root 参数化即可操作任意渲染宿主
（含 skill 生成的项目），平台侧与宿主解耦是架构预留，不是 P0 交付项。
```

### 2.2 本仓目录（开发态）

```
platform-apps/            ★ 新顶层目录 · P0 产品载体（全新独立应用）
└── builder/                 对话搭建平台
    └── src/pages/
        ├── scenes/          场景列表页（新建/进入场景）
        └── workspace/       工作区页（chat-panel + live-screen）

packages-platform/         ★ 新顶层目录 · 平台能力层（对领导口径 = 平台 MCP 化）
├── mcp-server/               MCP 接入：HTTP 入口 + 5 个 tool（一文件一 tool）
│   │                         tools/{list-materials, get-material-detail,
│   │                         get-current-screen, assemble-screen, upsert-component}.ts
│   └── src/index.ts          入口：HTTP server 启动 + SSE 端点挂载
├── screen-store/             schema 仓库：内存态权威 + 落盘快照（P1 扩版本历史）
├── screen-events/            SSE 广播通道：schema 变更广播
└── material-repo/            物料读取（宿主本地 registry → 结构化检索）

docs/skeleton/             既有骨架 · 不动（不预埋聊天，保持纯渲染宿主）
apps/playground/           既有骨架镜像 · 不动（platform 验证不占用 mirror 通道）
packages/screen-renderer/  既有 · builder 的 live-screen 消费其渲染能力
docs/materials/            既有 · 只读（material-repo 的数据源）
```

### 2.3 依赖规则（对齐 `check:renderer-isolation` 风格，新增 `check:mcp-isolation`）

- `packages-platform/*` 禁止 import `src/`（站点代码）、`apps/**`、`packages/screen-renderer`；子包间依赖单向：`mcp-server → screen-store / screen-events / material-repo`
- `packages-platform` 与 `screen-renderer` 的唯一共享物是 `ScreenSchema` **类型定义**（放 screen-store 内副本，或提共享 types——P0 任务卡定）
- mcp-server 的物料/schema 读写对象经 `--root` 启动参数指定（P0 指向 platform-apps/builder 的数据目录），路径硬编码为零
- builder（platform-apps）只通过 SSE + HTTP 消费 platform，不 import packages-platform 内部模块（workspace 依赖仅限类型）

## 3. 数据流（三条链路，P0 运行在 builder 内）

### 3.1 物料检索（读）

```
Hermes 智能体 → MCP list_materials / get_material_detail
  → material-repo 读物料 registry + manifest/spec（源：docs/materials）
  → 返回结构化结果
```

### 3.2 大屏写入（写 + 广播）

```
Hermes 智能体 → MCP assemble_screen / upsert_component
  → zod 校验（不合法 → 结构化错误返回，智能体自纠）
  → screen-store 更新内存态 + 落盘场景 schema（builder 数据目录）
  → screen-events SSE 广播 {type:'schema-updated', schema}
  → builder 工作区 live-screen EventSource 收到 → 重挂 screen-renderer
```

### 3.3 状态读取（读）

```
Hermes 智能体 → MCP get_current_screen
  → screen-store 内存态 → 返回当前 schema
```

## 4. 接口与传输约定（概要）

MCP tool 契约（入参/出参/用途）见 chat-mcp.md §4，传输层：

- **SSE 端点**：`GET http://localhost:8787/events`（`text/event-stream`）
- **事件载荷**：`{ type: 'schema-updated', screenId, version, schema }`
- **HTTP 端口**：mcp-server 默认 `:8787`，`MCP_PORT` 可配；宿主根目录经 `--root` 启动参数传入
- **错误返回**：MCP tool error 内嵌 `{ code, message, issues[] }`（zod issues 透传），供智能体自纠
- **CORS**：`/events` 与 MCP 端点 dev 阶段 `*`，后续收紧

## 5. 关键时序（写入链路）

```
智能体        mcp-server(:8787)             builder 工作区
  │ upsert_component              │
  │──────────────►│               │
  │               │ zod 校验       │
  │   (失败) ◄────│ 结构化错误      │
  │   (成功)      │ store 更新+落盘 │
  │      ok ──────│               │
  │               │ SSE 广播 ──────► EventSource onmessage
  │               │               │ 重挂 renderer → 局部刷新
```

## 6. 验证回路与远期分发

**P0 验证（本仓内闭环，不占 mirror 通道）**：

- builder 自身即验证载体：`platform-apps/builder` dev 起 builder 页面 + mcp-server 两进程，跑通 chat-mcp.md §2 演示脚本即为验收
- `check:mcp-isolation`：platform 零站点/零 app/零 renderer 依赖校验
- playground / skeleton / mirror 校验均不受影响（零改动）

**远期分发（不在 P0，演示反馈后决策）**：

- mcp-server 经 `--root` 参数化操作任意渲染宿主（含 skill 生成项目）的架构预留已就位
- 是否把 platform 打进 skill 随宿主分发（源码拷贝 vs 构建产物依赖），待产品方向确认后另立设计

## 7. 分期对照

| 阶段 | 本设计覆盖范围 |
| --- | --- |
| P0 | 本文全部（builder 应用 + 4 子包 + 5 tool + SSE + 场景持久化） |
| P1 | 版本管理：store 增 version 历史 + `list_versions` / `restore_version`（§3.2 链路自然扩展）+ 工程沉淀层评估 |
| P2 | 数据源绑定：props 契约扩展（另出设计增量） |

## 8. 待评审问题

1. `ScreenSchema` 类型共享方式：screen-store 内副本 vs 抽共享 types 包（倾向前者，避免 P0 动 renderer 包结构）
2. zod vs 手写校验（默认 zod）
3. mcp-server 端口（默认 :8787）
4. ~~Hermes iframe 接入协议~~ 已定（020 实测，详见 chat-mcp.md §9）：iframe 嵌 `#/hermes/session/<id>`；会话管理走平台侧 REST（`POST/GET/DELETE /api/studio/sessions`，Bearer JWT）；**transport 定为 http+SSE**（实例已验证的形态，非 Streamable HTTP）
5. builder 技术栈沿用 React + Vite + antd（与仓库现状一致），是否需要引入路由/状态库细节在任务卡定

## 9. Hermes（Ekko Studio）接入实测（020 调研，2026-11-17）

实例 `http://10.10.6.175:6060/`，P0 外部依赖全部实测可行，详细规格见 chat-mcp.md §9 与任务卡 020。对本文的影响：

- §4 transport：~~Streamable HTTP~~ → **http+SSE**（mcp-server 需实现 SSE transport 端点）
- builder 工作区新增「会话管理薄 UI」：会话 tab / 新建会话，经平台侧 BFF 代理调 Hermes REST（`Authorization: Bearer <hermes_api_key>`，token 来自浏览器 localStorage，约 30 天）
- 场景模型：**场景 = 1 schema + N 会话**（平台维护映射），iframe 嵌当前激活会话；聊天渲染归 Ekko，管理归平台

## 变更记录

- 2026-11-17 初稿
- 2026-11-17 修订 1：MCP 能力独立为顶层 `packages-platform/`（4 子包）；前端宿主 show-case
- 2026-11-17 修订 2：**部署形态重定位**——运行底座改为 skill 生成的宿主项目（对话页预埋 skeleton、platform 随 skill 分发、mcp-server 独立 Node 进程、本仓只做源码 + playground 镜像验证）；明确不引入 Snowpack
- 2026-11-17 修订 3：**P0 载体定为 `platform-apps/builder` 全新独立应用**——产品定义驱动（chat-mcp.md 修订 3/4）；骨架/playground/show-case 全部不动；分发降级为远期预留；验证回路改为 builder 自身
- 2026-11-17 修订 4（当前）：020 调研回写——transport 定为 http+SSE；新增 §9 Hermes 接入实测（iframe 会话路由 + REST 会话管理 + Bearer JWT）；场景模型「1 schema + N 会话」；关闭待评审问题 4
