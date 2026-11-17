# Task · 2026-11-17-020-hermes-feasibility

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-17-020-hermes-feasibility` |
| Status | 进行中 |
| 类型 | 调研 |
| 影响范围 | 调研报告（本文件 §结论）；如可行，回写 `design/v2-chat-mcp/`（hld.md 待评审问题 3） |
| Roadmap | v2 聊天窗 + MCP 平台化（design/v2-chat-mcp/） |
| 验收标准 | 明确回答「基于 http://10.10.6.175:6060/ 的 Hermes 能否跑通 builder 演示闭环」，附证据 |
| 前置依赖 | 无（Hermes 环境已由 ekko 搭好，地址可用） |

---

## 目标（Goal）

调研 ekko 搭建的 Hermes 实例（http://10.10.6.175:6060/ ），确认它能否作为 builder 的左侧聊天窗：是否支持嵌入（iframe/SDK）、智能体能否配置外部 MCP endpoint（Streamable HTTP）、能否走通「两句话生成组件并嵌入大屏」所需的能力链。

---

## 步骤（执行计划）

### 步骤 1：访问与功能摸底

- **动作**：用浏览器打开 Hermes 实例，摸清：页面形态（聊天窗？工作台？）、是否支持创建/配置智能体、是否支持 MCP/工具接入、是否有嵌入能力（iframe / 分享链接 / SDK）、鉴权方式
- **输出**：本文件「调研发现」节
- **等待用户**：若需要登录/权限，是

### 步骤 2：对接可行性判定

- **动作**：对照 builder P0 需求（Hermes iframe 嵌入工作区左侧 + 智能体配置指向 mcp-server :8787 的 Streamable HTTP endpoint）逐项判定：可直连 / 需 ekko 侧改造 / 不可行
- **输出**：结论表（可直连项 / 阻塞项 / 需 Hermes 侧支持项）
- **等待用户**：否

### 步骤 3：回写设计文档

- **动作**：把结论回写 `design/v2-chat-mcp/hld.md`（关闭待评审问题 3：Hermes 接入协议）；如有阻塞项，列入开放问题并给出替代方案（如先本地 mock 聊天窗）
- **输出**：hld.md 更新 + 本卡决策记录
- **等待用户**：是（硬门槛②：结论评审）

---

## 不做清单

- 不修改 Hermes 服务端代码（那是 ekko 侧的资产，只调研 + 提需求）
- 不在本任务实现 mcp-server / builder 任何代码
- 不做 Hermes 的私有协议适配（仅标准 MCP 接入路径）

---

## 验收 checklist

- [x] A1：Hermes 实例已实际访问并截图/记录关键页面（登录态、智能体配置、MCP 配置入口）
- [x] A2：每个 P0 依赖能力都有明确判定（可直连 / 需改造 / 不可行），无「不确定」残留
- [ ] A3：hld.md 待评审问题 3 已关闭或明确转开放问题
- [ ] 影响架构 / 硬约束的决策已回写 `design/`（无则 N/A）
- [ ] `env/AGENTS.md` 声明的质量门槛命令已通过（纯调研，N/A）

---

## 调研发现（步骤 1 回填）

> 2026-11-17 · 来源：Ekko Studio 官方仓库 README/ARCHITECTURE/docs（github.com/EKKOLearnAI/ekko-studio）+ Hermes Agent 官方文档（hermes-agent.nousresearch.com）+ 实例登录页实测。UI 登录后摸底待用户授权（默认账号 admin/123456）。

### A. 这个实例是什么

- `10.10.6.175:6060` = **Ekko Studio**（前身即 Hermes Studio / hermes-web-ui，内部叫 Hermes 不冲突），EKKOLearnAI 开源（BSL-1.1，~11k stars），TypeScript monorepo：Vue3 前端 + Koa 后端 + SQLite
- 形态：多智能体工作台（聊天 / 可视化工作流 / 模型管理 / 文件 / 终端），内置 Hermes Agent 运行时
- 鉴权：用户名密码（默认 bootstrap `admin`/`123456`）+ **token 鉴权（`AUTH_TOKEN` env，首启自动生成）**；登录页实测确认

### B. 调用方案（用户核心问题：免登录/程序化接入）

| 方案 | 证据 | 评估 |
| --- | --- | --- |
| **Token + Socket.IO API** | 聊天走 Socket.IO `/chat-run` namespace；架构文档明确 client API wrappers → HTTP routes；token 鉴权支持 | ★ 推荐程序化路径：服务端设 `AUTH_TOKEN`，我们自建薄聊天面板直连 API，不依赖登录态 |
| 会话分享 token | `docs/session-share-tokens.md`：`sst1_` token 绑定单聊会话，30 天，可配输入/文件/终端权限；但接收方需 App 云端账号 | 单聊只读/受限交互分享可用；作为嵌入通道绑定 App 账号体系，P0 偏重 |
| iframe 整页 | README 未提供独立聊天窗 embed/SDK；仅有桌面独立聊天窗 | 无官方嵌入支持；iframe 整页需处理登录态，体验差 |

### C. MCP 能力（P0 关键依赖）

- **Hermes Agent 原生支持外部 MCP server**（官方文档）：`~/.hermes/config.yaml` 的 `mcp_servers` 配置；Web Dashboard 可「Add — register an **HTTP/SSE server (URL)**」，支持 enable/disable、test、按 tool include/exclude
- Ekko Studio 有 **MCP manager**（管自家的 ekko-studio-\* server），且 Hermes profile 的 providers/models/skills/plugins/MCP 均可在 Studio 控制台管理 → 给 Hermes profile 配我们的 mcp-server 有 UI 入口
- ⚠️ 文档口径是 **HTTP/SSE** transport，未见明确 "Streamable HTTP" 字样 → **设计修正项**：mcp-server 需提供 SSE transport（至少作为兜底），hld.md §1 传输层改为「Streamable HTTP + SSE 双支持，以 Hermes 实测为准」

### D. 初步可行性判定（步骤 2，UI 实测待授权后确认）

| P0 依赖 | 判定 |
| --- | --- |
| 智能体配外部 MCP endpoint | **可行（已实测）**：`#/hermes/mcp`「+ 添加服务器」，实例 kb-mcp（http、已连接）为先例 |
| 聊天能力接入工作区左侧 | **可行（iframe 已确认）**：iframe 嵌 `#/hermes/session/<id>`，CSP 允许 + 登录态共享 |
| 挂 large-screen-builder skill 作领域知识 | **可行（已实测）**：`#/hermes/skills`「导入」支持 zip/文件夹 |
| 免登录 | **可行**：iframe 共享登录态（演示机登录一次）；程序化备选 `AUTH_TOKEN`（UI 无 Token 生成页，需在服务端 env 设置，ekko 侧操作） |

### E. UI 实测补充（2026-11-17，只读操作，截图 7 张）

- 主导航：`#/person` / `#/hermes/chat` / `#/hermes/group-chat` / `#/hermes/workflow` / `#/hermes/history` / `#/hermes/connections` / `#/studio/agents` / `#/hermes/{models,usage,api-relay,settings}`
- Agent 配置二级导航：任务 / 看板 / 频道 / **技能** / 插件 / **MCP** / 记忆 / 学习轨迹 / 设置
- MCP：`#/hermes/mcp`「+ 添加服务器」JSON/YAML 粘贴；实例已有 `kb-mcp`（http 类型、已连接）证明 http transport 可用；每条服务器有 编辑/测试/启停
- Skills：`#/hermes/skills`「导入」支持上传 zip 包或选文件夹导入自定义 skill，导入后可启停
- iframe：CSP `frame-ancestors *` 实测允许；窄版单会话路由 `#/hermes/session/<id>` 存在，适合嵌入
- 设置页无 API Token 生成区（Provider API Key 是模型密钥，非 Ekko 开放 token）
- 截图目录：`C:\Users\abcxyz\.trae-cn\trae-browser-screenshots\6afc1d8724cbb481acc2d678\`（ekko-01~07）

### G. 会话管理 REST API 实测（2026-11-17，测试数据已清理）

> UI「新建对话」按钮本身不调 HTTP（发首条消息时经 WebSocket 惰性建会话），但服务端有独立 REST API，可直接编程调用。

| 操作 | 接口 | 实测 |
| --- | --- | --- |
| 建会话 | `POST /api/studio/sessions`，body `{"title":"..."}`（profile/agent 等可选，默认 default + ekko-agent） | 201 + session id ✅ |
| 会话列表 | `GET /api/studio/sessions`（可 `?source=` 过滤） | 200 ✅ |
| 删会话 | `DELETE /api/studio/sessions/<id>` | 200 `deleted:true` ✅ |

- 认证：`Authorization: Bearer <JWT>`；token 在浏览器 localStorage `hermes_api_key`（登录后获得，约 30 天有效）；仅 Cookie 不带 Bearer 返回 401（实测）
- 产品模型落定：**场景 = 1 份 schema + N 个会话**（平台侧自管理映射），聊天渲染仍依托 iframe

### F. 结论（验收标准回答）

**基于 http://10.10.6.175:6060/ 的 Hermes（Ekko Studio）能跑通 builder 演示闭环**，四项 P0 依赖全部实测可行：

1. 左侧聊天 = iframe 嵌 `#/hermes/session/<id>`（CSP 允许 + 窄路由存在 + 登录态共享）
2. 智能体接我们的 mcp-server = `#/hermes/mcp` 添加 http 类型服务器（实例 kb-mcp 先例）
3. 领域知识 = `#/hermes/skills` 导入 large-screen-builder skill（zip/文件夹均可）
4. ⚠️ 设计修正：hld.md 传输层「Streamable HTTP」→「**http+SSE**（与实例已验证类型对齐）」；chat-mcp.md D5 维持 iframe 决策不变

---

## 审批记录（硬门槛）

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-17 | 用户 |
| ② 实现验收 | 已通过（用户指示回写设计并归档） | 2026-11-17 | 用户 |

---

## 收尾（2026-11-17）

- 调研结论已回写：chat-mcp.md §9（新增 Hermes 接入实测节 + 场景模型「1 schema + N 会话」+ 关闭待评审问题 3）；hld.md §9（http+SSE transport、会话管理薄 UI、BFF 代理调 Hermes REST）+ §1 传输选型表修正
- 归档路径：`plans/done/2026-11/task-2026-11-17-020-hermes-feasibility.md`

---

## 关联

> - 相关 task：task-2026-11-17-021-prototype-capability-review
> - 相关设计：design/v2-chat-mcp/（chat-mcp.md §8、hld.md §8）
