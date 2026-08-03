# metahuman-dispatcher 子项目

> 路径：`metahuman-dispatcher/`（仓库根目录下的独立子项目，独立 `pyproject.toml`）
> 角色：WebSocket 调度分发服务（relay），在大屏展示端与第三方控制端之间充当中转枢纽
> 技术栈：FastAPI + uvicorn + websockets，Python ≥3.11，使用 `mise`+`uv` 管理依赖
> 与 P1 的关系：P1 的 [api-backend-core.md](./api-backend-core.md) 描述的是数字人对话后台（Flask + socket_bridge），而本 dispatcher 是一个**完全独立**的、与数字人无关的、专用于"大屏指令转发"的轻量级服务，二者**不共享代码、不共享进程**

---

## 1. 解决的核心问题

详见 metahuman-dispatcher/docs/specs/001-relay-core/spec.md 第 10–18 行：

- 控制端（第三方中控台）和大屏展示系统往往都处于客户端地位，难以直接建立连接（内网/防火墙/复杂局域网）
- 大屏规范原设计"控制端为客户端、大屏为服务端"不便于多实例组网和穿透
- **成功标准**：双端主动接入、消息定向转发与路由、连接存活心跳监控、提供 HTTP 状态查询接口

---

## 2. 目录结构

```
metahuman-dispatcher/
├── main.py                        # FastAPI 入口（所有业务逻辑都集中在此单文件，352 行）
├── pyproject.toml                 # 依赖：fastapi>=0.100、uvicorn[standard]>=0.22、websockets>=11
├── uv.lock                        # 锁定的依赖版本
├── .mise.toml                     # mise 工具链：python=3.11，关闭 GitHub attestations 校验
├── Dockerfile                     # 基于 python:3.11-slim，内嵌 uv，启动 uvicorn
├── Jenkinsfile                    # CI 构建脚本
├── README.md                      # 架构说明 + 部署方式
├── docs/
│   ├── integration/
│   │   ├── control-integration-guide.md   # 第三方控制端接入文档 (v2.1)
│   │   └── screen-integration-guide.md    # 大屏端接入文档 (v2.1)
│   └── specs/001-relay-core/
│       ├── spec.md                 # 特性规格说明书（背景/接口契约/验收标准）
│       ├── acceptance-tests.md     # 验收用例
│       └── pm-inputs/              # PM 提供的原始需求输入
│           ├── 01-screen-api-readme.md
│           └── 02-get-client-registration-request.md
├── tests/
│   ├── conftest.py                # pytest fixture：动态分配空闲端口、后台线程起 uvicorn
│   └── test_relay.py              # 7 个端到端测试用例
└── html-test/                     # 浏览器端手工测试页（不走 pytest）
    ├── control-test.html
    ├── screen-test.html
    └── sdk-integration-test.html
```

代码与测试体量都极小：**单个 `main.py`（352 行）** 就实现了全部业务；测试 7 个用例约 240 行。

---

## 3. 进程启动与服务拓扑

详见 metahuman-dispatcher/main.py：

- 启动方式：`uv run uvicorn main:app --host 0.0.0.0 --port 8000`（见 metahuman-dispatcher/Dockerfile#L28）
- 默认端口：`8000`
- 中间件：根据 `DISPATCHER_ALLOWED_ORIGINS` 环境变量动态注入 CORS（metahuman-dispatcher/main.py#L14-L31）
- 应用标题：`metahuman-dispatcher`（metahuman-dispatcher/main.py#L10）

**连接拓扑**：

```
                    ┌─────────────────────────────┐
                    │   metahuman-dispatcher      │
                    │   （FastAPI WS Server）     │
                    │                             │
   控制端 A ──WS──►│  /control  ◄─────WS── 大屏 S1│◄── 大屏展示系统
   控制端 B ──WS──►│                             │
   控制端 C ──WS──►│  /screen/{systemId}         │
                    │                             │
   控制端 ──HTTP──►│  /api/clients                │
                    └─────────────────────────────┘
```

调度器是**唯一的 WS 服务端**，控制端与大屏皆作为客户端**主动接入**，避免穿透/防火墙问题。

---

## 4. 核心数据结构：ConnectionManager

metahuman-dispatcher/main.py#L38-L91 定义了一个全局单例 `manager`：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `screen_connections` | `dict[str, dict]` | `systemId` → 屏端连接信息 |
| `control_connections` | `dict[str, dict]` | `sessionId` → 控制端连接信息 |
| `command_route_table` | `dict[str, dict]` | `commandId` → 指令路由表（含 control_ws 和 timeout_task） |
| `lock` | `asyncio.Lock` | 异步锁，保证并发读写安全 |

每个 screen connection 的 dict 包含：
- `websocket`：FastAPI WebSocket 对象
- `name`：友好展示名（默认 = `systemId`）
- `address`：`"host:port"` 形式的客户端地址
- `connected_at`：ISO 格式连接时间
- `pong_event`：`asyncio.Event`，用于心跳 PING/PONG 同步

每个 control connection 的 dict 包含：`websocket`、`address`、`connected_at`（**没有** pong_event，控制端不参与服务端发起的 PING）。

### 4.1 唯一性约束

metahuman-dispatcher/main.py#L48-L52：
若同一 `systemId` 重复连入，会**主动关闭旧连接**以保证连接池唯一性。这是 dispatcher 唯一的"挤下线"行为。

### 4.2 控制端断线清理

metahuman-dispatcher/main.py#L80-L88：
控制端断线时，会扫描 `command_route_table`，取消所有由该控制端发起且仍在 TTL 内的超时清理任务，并从路由表中删除，防止内存泄漏。

---

## 5. 三个对外接口

### 5.1 HTTP：`GET /api/clients`

metahuman-dispatcher/main.py#L120-L142

返回当前所有已注册客户端的快照（无锁读 dict，**存在竞态**——见第 10 节）。

响应结构：

```json
{
  "screens": [
    { "systemId": "five-major-center", "name": "五大中心大屏",
      "address": "192.168.1.102:54890", "connectedAt": "2026-07-01T16:10:16+08:00" }
  ],
  "controls": [
    { "sessionId": "ctrl-session-uuid-1",
      "address": "192.168.1.50:54123", "connectedAt": "2026-07-01T16:05:00+08:00" }
  ]
}
```

### 5.2 WebSocket：`/screen/{systemId}?name=...`

metahuman-dispatcher/main.py#L145-L197

- 路径参数 `systemId`（必填，唯一）
- 查询参数 `name`（可选，URL 编码，例：`?name=%E4%BA%94%E5%A4%A7%E4%B8%AD%E5%BF%83%E5%A4%A7%E5%B1%8F`）
- 注册成功后立即启动 `heartbeat_loop` 后台任务
- 接收消息按 `type` 分支处理：
  - `PONG`：置位 `pong_event`（回应服务端心跳）
  - `COMMAND_RESULT`：从 `command_route_table` 中弹出对应 `commandId`，定向转发给原控制端
  - `SCREEN_EVENT`：**广播**给所有在线控制端
- 异常退出时取消心跳任务并执行 `unregister_screen`

### 5.3 WebSocket：`/control`

metahuman-dispatcher/main.py#L200-L352

- 无路径参数；服务端自动用 `uuid.uuid4()` 生成 `sessionId`
- 接收消息处理优先级（自上而下）：
  1. JSON 解析失败 → 直接回 `COMMAND_RESULT{success:false, message:"JSON 格式解析失败"}`
  2. `type == "PING"` → 回 `{"type":"PONG"}`（控制端可主动探测服务端存活）
  3. `action == "GET_CLIENTS"` → 在 WS 通道内返回客户端列表快照（metahuman-dispatcher/main.py#L234-L268）
  4. 校验 `commandId` 与 `data.target.systemId`，缺失则返回错误
  5. 大屏离线 → 直接回 `success:false, message:"大屏系统 X 处于离线状态"`
  6. 记录路由 + 启动 `command_timeout_handler`（30s TTL）+ 转发指令给屏端

控制端**不参与**服务端发起的 PING 心跳，只对屏端连接做心跳探测。

---

## 6. 心跳机制（PING/PONG）

metahuman-dispatcher/main.py#L34-L36 定义常量：

| 环境变量 | 默认值 | 含义 |
| --- | --- | --- |
| `DISPATCHER_HEARTBEAT_INTERVAL` | `30.0` | PING 发送周期（秒） |
| `DISPATCHER_HEARTBEAT_TIMEOUT` | `5.0` | 等待 PONG 超时（秒） |
| `DISPATCHER_COMMAND_TIMEOUT` | `30.0` | 指令响应 TTL（秒） |

metahuman-dispatcher/main.py#L96-L117 的 `heartbeat_loop`：

```
loop:
  sleep(HEARTBEAT_INTERVAL)
  pong_event.clear()
  ws.send({type:"PING"})
  try:
    await asyncio.wait_for(pong_event.wait(), timeout=HEARTBEAT_TIMEOUT)
  except TimeoutError: break
finally:
  ws.close()
  manager.unregister_screen(systemId)
```

超时即主动 `close()` 屏端连接并从连接池移除。

测试中通过环境变量注入短心跳周期（metahuman-dispatcher/tests/test_relay.py#L9-L11）：
```python
os.environ["DISPATCHER_HEARTBEAT_INTERVAL"] = "1.0"
os.environ["DISPATCHER_HEARTBEAT_TIMEOUT"] = "0.5"
os.environ["DISPATCHER_COMMAND_TIMEOUT"] = "1.0"
```

---

## 7. 指令路由与 TTL

metahuman-dispatcher/main.py#L304-L328：

- 控制端下发指令时，记录 `command_route_table[commandId] = { control_ws, timeout_task }`
- 同时启动 `command_timeout_handler` 协程，`sleep(COMMAND_TIMEOUT)` 后**主动推送**一条 `success:false, message:"大屏响应超时"` 给控制端并清理路由表项
- 屏端 `COMMAND_RESULT` 到达时，按 `commandId` 弹出路由项并**取消**对应的 timeout_task，再定向转发给原 `control_ws`
- 若 `send_text(control_ws)` 失败（连接已断开），静默 `pass`——**不会**回滚路由表（这是个小漏洞，见第 10 节）

任何一条指令的最长生命周期为 `COMMAND_TIMEOUT`（默认 30 秒）。

---

## 8. SCREEN_EVENT 广播

metahuman-dispatcher/main.py#L185-L192：

大屏端主动向调度器发 `{"type":"SCREEN_EVENT", "systemId":..., "action":..., "data":{...}}` 时，调度器**遍历所有在线控制端**并原样转发。

注意区别：
- `SCREEN_EVENT`（大屏 → 所有控制端）= **广播**
- `COMMAND_RESULT`（大屏 → 发起该指令的控制端）= **定向**

由 metahuman-dispatcher/tests/test_relay.py#L191-L239 测试保证：C1 与 C2 都会收到 `SCREEN_EVENT`。

---

## 9. 部署与运维

### 9.1 容器化

metahuman-dispatcher/Dockerfile：
- 基础镜像：`python:3.11-slim`
- 启用 `PYTHONDONTWRITEBYTECODE=1` 与 `PYTHONUNBUFFERED=1`
- 内嵌 `uv`（从 `ghcr.io/astral-sh/uv:latest` multi-stage 拷贝 `/uv` 与 `/uvx`）
- `uv sync --frozen --no-cache` 安装依赖
- 仅复制 `main.py` 到镜像（不复制测试、文档、html-test），镜像极小
- 暴露端口 `8000`
- 启动命令：`uv run uvicorn main:app --host 0.0.0.0 --port 8000`（无 `--reload`）

### 9.2 本地开发

- `.mise.toml` 指定 `python = "3.11"`
- 使用 `uv sync` 装依赖，`uv run uvicorn main:app --reload` 启动
- 也提供 metahuman-dispatcher/README.md 中的 PM2 启动方案（node 生态之外的 PM2 也可托管 Python 进程）

### 9.3 测试

metahuman-dispatcher/tests/conftest.py：
- `get_free_port()` 动态获取空闲端口
- `server_url` fixture = `"127.0.0.1:<port>"`
- `start_server` autouse fixture：在独立 daemon 线程中 `uvicorn.Server.run()` 启动 FastAPI 应用（Windows 下避免 spawn 问题）

metahuman-dispatcher/tests/test_relay.py 7 个用例：

| 用例 | 覆盖点 |
| --- | --- |
| `test_clients_api_and_connection` | `/api/clients` 列表查询 + screen/control 注册 |
| `test_command_relay_and_targeted_response` | C1 → S1 → C1 的完整指令闭环，且 C2 不应收 |
| `test_offline_fallback` | 大屏离线时立即返回错误结果 |
| `test_ping_pong_heartbeat` | PING → PONG → 第二个 PING 链路存活 |
| `test_heartbeat_timeout_disconnect` | 不回 PONG 时服务端主动断连 |
| `test_clients_ws_query` | WS 通道内 `GET_CLIENTS` 指令 |
| `test_screen_active_event_broadcast` | `SCREEN_EVENT` 多控制端广播 |

### 9.4 浏览器手工测试页

metahuman-dispatcher/html-test/ 下三个静态 HTML（不走 pytest）：

- `control-test.html`：控制端连接器（含 GET_CLIENTS、SWITCH_OPERATE 等按钮）
- `screen-test.html`：大屏端模拟器（含 PING/PONG 显示、SCREEN_EVENT 上报）
- `sdk-integration-test.html`：SDK 集成联调页

---

## 10. 已知问题与观察（事实记录）

以下**仅基于代码事实**列出，未做改进：

1. **CORS 默认值过宽**：metahuman-dispatcher/main.py#L14 默认 `DISPATCHER_ALLOWED_ORIGINS="*"`，且通配符场景下 `allow_credentials=False`（metahuman-dispatcher/main.py#L19），依赖部署方显式设置白名单。

2. **`/api/clients` 读字典无锁**：metahuman-dispatcher/main.py#L122-L137 在 `for` 循环内直接遍历 `screen_connections` / `control_connections`，未加 `async with manager.lock`。FastAPI 单线程 asyncio 下虽不会爆 GIL 问题，但理论上注册/反注册与读取并发时可能拿到不一致快照或 KeyError（实测触发需极快时序）。

3. **screen 注册失败回滚不完整**：metahuman-dispatcher/main.py#L145-L152 若 `register_screen` 抛异常（理论上不会，但若 `close()` 失败），心跳任务未被启动却也不影响；不过正常路径已覆盖。

4. **`COMMAND_RESULT` 转发失败不回滚**：metahuman-dispatcher/main.py#L181-L184 若 `route["control_ws"].send_text` 抛异常，仅 `pass`；但因为 `command_route_table.pop` 已先执行，路由已清理，**不会重复发送**——此处实际安全，只是静默失败不易排查。

5. **大屏"挤下线"无通知**：旧屏被关闭后，**没有任何**主动推送告知"被新连接替换"。如果旧屏实现了本地状态恢复逻辑，会产生"我以为还连着但其实早就被踢了"的困惑。

6. **指令转发失败回滚后未通知超时协程停止**：metahuman-dispatcher/main.py#L331-L347 转发异常时已 `cancel()` `timeout_task`，路径正确；但**兜底错误消息**仅在 `send_text` 抛错时构造，正常 `send_text` 完成后**不再处理 send 内部错误**——属于边界情况，可忽略。

7. **测试依赖 `server.started` 标志**：metahuman-dispatcher/tests/conftest.py#L41 轮询 5 秒等 `server.started`；若首次启动慢于 5 秒（CI 上偶发），测试会拿不到已启动的服务端而直接开始请求。

8. **无认证/鉴权**：所有 `/screen/*`、`/control` 与 `/api/clients` 均无任何 token/session 校验；任何能访问 8000 端口的网络实体都可注册/查询/广播。这是设计上"内网中转"的取舍，但**接入公网时风险极高**。

9. **不支持 TLS**：`uvicorn` 直接监听明文 WS/HTTP；生产部署需前置 Nginx 反代提供 `wss://`。

10. **历史 API 与 v2.1 不一致**：metahuman-dispatcher/README.md 中部分章节仍描述旧版"控制端=客户端、大屏=服务端"拓扑，与 metahuman-dispatcher/docs/specs/001-relay-core/spec.md 的 v2.1 设计存在叙述差异，**以 spec.md 与集成文档为准**。

---

## 11. 与其他子项目的关系

| 子项目 | 关系 |
| --- | --- |
| [api-backend-core.md](./api-backend-core.md)（P1） | 完全独立进程，无任何代码共享。api/ 内的 socket_bridge 是给数字人 UE5 客户端用的 WebSocket；本 dispatcher 是给大屏+第三方控制台用的 WebSocket，**两套协议、两套客户端**。 |
| [api-asr.md](./api-asr.md)（P2） | 无关。ASR 是音频流，dispatcher 是 JSON 指令。 |
| [api-llm-vector.md](./api-llm-vector.md)（P3） | 无关。 |
| `api/metahuman-admin/`（P4） | 无关。Streamlit 管理平台不涉及 dispatcher。 |
| P6（web Node 后台） | 待扫描，可能存在与本 dispatcher 的 HTTP 互通。 |
| P7（audio-microphone） | 无关。 |
| P8（docker） | Dockerfile 独立（仅含 main.py，不含 tests/）；与 docker-compose 的编排关系待扫描。 |

---

## 12. 一句话总结

`metahuman-dispatcher` 是一个**极致轻量**（单文件 352 行、依赖仅 3 个三方包）的 WebSocket 调度器，唯一职责是：让任意数量的控制端和任意数量的大屏端都"主动连进来"，由它在中间按 `systemId`/`commandId` 做消息定向转发和广播，并通过 PING/PONG + TTL 双保险保证连接健康与指令生命周期可控。**与数字人/UE5/ASR/LLM 全无耦合**。