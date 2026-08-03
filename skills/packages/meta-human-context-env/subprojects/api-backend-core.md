# api/ 后端核心代码剖析

扫描范围：`api/main.py` / `api/global_vars.py` / `api/meta_human_launcher.py` / `api/core/` / `api/scheduler/` / `api/utils/` / `api/web/flask_server.py`。

## 进程入口与启动 8 步

api/main.py#L297-L475 是整个数字人后端的进程入口，启动序列固定为 8 步：

| # | 动作 | 关键调用 | 行号 |
| --- | --- | --- | --- |
| 1 | 清临时文件 | `__clear_samples()` + `__clear_audio_cache()` | api/main.py#L358-L366 |
| 2 | 端口占用检查（5 个端口） | `check_port_available()` × 5 | api/main.py#L375-L381 |
| 3 | 数字人 WebSocket (10002) | `wsa_server.new_meta_human_instance(port=10002).start_server()` | api/main.py#L402-L411 |
| 4 | Web UI WebSocket (10003) | `wsa_server.new_web_instance(port=10003).start_server()` | api/main.py#L414-L423 |
| 5 | HTTP 服务 (5000) | `flask_server.start()` | api/main.py#L426-L434 |
| 6 | 数字人核心初始化 | `meta_human_launcher.start()` | api/main.py#L437-L441 |
| 7 | 注册控制台命令监听 | `console_listener()` (仅当 `sys.stdin.isatty()`) | api/main.py#L447-L461 |
| 8 | 系统就绪打印 | `print_service_info()` | api/main.py#L464-L472 |

**5 个端口全部硬编码在 api/main.py#L375-L381**：10001 / 10002 / 10003 / 5000 / 9001，任何一个被占用即退出。

**控制台命令集**（api/main.py#L192-L233）：`help` / `start` / `stop` / `restart` / `in <msg>` / `exit`。`in` 命令会构造 `Interact("content", 1, {"username":"Console","msg":msg})` 后调 `meta_human.on_interact(interact)`。

## 模块地图：谁调用谁

```
                          main.py
                            │
        ┌───────────────────┼──────────────────────────────┐
        ▼                   ▼                              ▼
  wsa_server.start()  meta_human_launcher.start()    flask_server.start()
   (10002, 10003)            │                              │
                             │ new_instance()               │ /api/*
                             ▼                              ▼
                       MetaHuman()              Flask + gevent.pywsgi
                             │                       │
        ┌────────────────────┼─────────────────┐     │
        ▼                    ▼                 ▼     ▼
   Recorder × N      async_processor      socket_bridge  command_service
   (10001 TCP)       (5 worker queue)     (9001 WS→TCP)  qa_service
        │                    │                              │
        ▼                    ▼                              ▼
   SpeakerConvManager  message_handler             external HTTP
   + ASR client          ├─ command_service          (Node web/
   (internal-funasr /    ├─ qa_service                doManage API)
     funasr WS)          └─ llm (importlib dynamic)
```

## `meta_human_launcher.py` —— 设备连接管理器

api/meta_human_launcher.py 不创建数字人核心，只管"远程音频输入设备"的 TCP socket 连接。

| 能力 | 关键代码 | 行号 |
| --- | --- | --- |
| 启动核心 | `meta_human = get_meta_human_core()` → `meta_human.start()` | api/meta_human_launcher.py#L517-L519 |
| 启动音频 socket 监听 (10001) | `accept_audio_device_output_connect()` 绑 `0.0.0.0:10001` | api/meta_human_launcher.py#L351-L440 |
| 启动 socket 桥接 WS (9001) | `socket_bridge_service.new_instance().start_service()` | api/meta_human_launcher.py#L525-L529 |
| 每连接一个 Recorder | `Recorder(deviceConnector, meta_human).start()` | api/meta_human_launcher.py#L402-L407 |
| 心跳检测 (5s) | `device_socket_keep_alive()` 每连接发 `b"PING"`，失败 3 次断 | api/meta_human_launcher.py#L212-L347 |
| 连接频率限制 | `MAX_CONNECTIONS_PER_MINUTE = 10` 每 IP 每分钟 | api/meta_human_launcher.py#L21-L24 |
| 连接标识迁移 | `<username>...</username>` 触发 `update_recorder_identifier()`：键从 `ip:port` → `username@ip:port`，同 IP 不同 port 视为重连关闭旧连接 | api/meta_human_launcher.py#L107-L209 |
| 安全发送 | `safe_socket_send(sock, data, timeout=5)` 包装 `BrokenPipeError` / `ConnectionResetError` | api/meta_human_launcher.py#L61-L93 |

## `core/meta_human/` —— 数字人核心（重构后拆 5 文件）

入口仅做向后兼容 re-export（api/core/meta_human/__init__.py#L1-L55）。

### `MetaHuman` 主类

api/core/meta_human/meta_human.py#L17-L322

| 方法 | 作用 |
| --- | --- |
| `on_interact(interact)` | 入口。先异步触发 `__update_mood()`（**当前是 `pass`，见 api/core/meta_human/meta_human.py#L69-L71**），再 `__process_interact()` 入队。 |
| `say(interact, answer, task_seq)` | 流式 → `__process_stream_output()`；字典 → `__process_output_text()`。两者最终都通过 `msg_utils.send_web_msg("unreal", ...)` 把内容抛给 UE5 客户端渲染。 |
| `__send_chunk_to_unreal()` | 流式 chunk → `unreal` topic WS，包含 `speed / volume / pitch`（取自 `cfg.attributes`）。 |
| `__process_output_text()` | 整段文本 → 同 `unreal` topic，外加 `interrupt` 字段。 |
| `stop()` | 停异步线程、清理所有用户状态。 |

**情绪相关代码是死代码**：`self.X / self.W` 是 8 维 numpy 向量，api/core/meta_human/meta_human.py#L22-L25，但 `__update_mood()` 整段 `pass`，没有任何写入或读出。

### 用户状态

api/core/meta_human/user_manager.py

| 字段 | 用途 | 行号 |
| --- | --- | --- |
| `speaking / processing` | 忙闲判断（拾音时遇 speaking=true 跳过） | api/core/meta_human/user_manager.py#L12-L13 |
| `last_chat_seq` | 同用户多轮对话时，type=1 任务以 seq 序号丢弃过期任务 | api/core/meta_human/user_manager.py#L16-L16 |
| `wakeup_matched / wakeup_timer` | 唤醒状态机用 | api/core/meta_human/user_manager.py#L18-L19 |
| `entry` | 前端路由路径（哪个大屏页面） | api/core/meta_human/user_manager.py#L17-L17 |

`cleanup_idle_users(max_idle_time=300)`（api/core/meta_human/user_manager.py#L128-L144）删除 5 分钟无活动的非忙碌用户。

### 异步处理队列

api/core/meta_human/async_processor.py

- **5 个 worker 线程**（api/core/meta_human/async_processor.py#L160-L164），daemon=True
- 全局 `_async_processing_queue = Queue()`，无上限
- task 形态：`{interact, meta_human, seq, message_id, timestamp}`
- type=1（聊天）：先发 `topic="question"`，发 `status=thinking`，调 `_handle_chat_message_sync()`，再发 answer ws，最后调 `meta_human.say()` 走 UE5
- type=2（开场/结束/play）：直接拼装 answer_result 走 ws + say
- 死线程自动重启（api/core/meta_human/async_processor.py#L169-L186）

### 消息处理路由

api/core/meta_human/message_handler.py#L23-L176 `_handle_chat_message_sync()`：

```
输入 msg
  ├─ command_service.get_command(username, msg)   # 内部固定指令 → 外部指令
  │   ├─ SPEAK            → topic=chat,    text=command.text
  │   ├─ SPEAK_SCHEME     → topic=report,  text=拼合方案内容
  │   ├─ METAHUMAN_CONTROL / SPEAK_PAUSE(false) → topic=control, text=None
  │   └─ 其它             → topic=control, text="好的"
  ├─ qa_service.question(msg)                      # 知识库问答
  └─ get_llm_question(llm_mode)(msg, username)     # 大语言模型（流式返回 Generator）
```

LLM 适配器是**动态加载**（api/core/llm.py#L9-L63）：`importlib.import_module("llm." + llm_mode)`。配置 `llm.mode` 决定加载哪个文件（dify / siliconflow / hfd / csb_ah / csb_stream / internal / dxh / old 等）。

### 流式包装

api/core/meta_human/stream_processor.py `_wrap_stream_result()`：为 LLM 流式 chunk 添加统一结构 `topic / type=stream_chunk / channel=llm / streamInfo{isStream,isFinal,chunkIndex,timestamp} / accumulated{text,controls,markdown}`。

api/core/meta_human/websocket_handler.py `_send_single_chat_message()`：把 chunk 派发到对应 topic 的 WebSocket——`chat` / `chat-stream` / `control` / `report` / 其它（全部用 `send_web_msg`，最终落到 10003 的 WebServer）。**所有消息都额外写 `logs/chat_detail.jsonl`**（api/core/meta_human/websocket_handler.py#L146-L150）。

## `core/wsa_server.py` —— WebSocket 框架

api/core/wsa_server.py#L14-L264：

- 异步事件循环跑在 `MyThread` 里（api/core/wsa_server.py#L240）
- 每个连接 spawn 两个 task：consumer（读消息） + producer（从 `__listCmd` 推消息），任一完成即取消另一个（api/core/wsa_server.py#L139-L150）
- `add_cmd(content)` 推消息：群发（无 username）或单播（有 username）由 producer 处理（api/core/wsa_server.py#L71-L101）
- 客户端用 `{id, websocket, username, entry}` 结构记录

两个子类（单例）：

| 子类 | 端口 | 行为 |
| --- | --- | --- |
| `WebServer` | 10003 | 接收 `topic="location"` 消息维护 `entry`（大屏页面）并同步到 `user_manager.UserState.entry`（api/core/wsa_server.py#L272-L301） |
| `MetaHumanServer` | 10002 | on_connect / on_close 时往 WebServer 发 `{"is_connect": ...}`，前端能感知数字人端是否在线（api/core/wsa_server.py#L305-L323） |

**注意**：`MetaHumanServer.on_receive_handler()` 是 `pass`（api/core/wsa_server.py#L309-L310）—— 数字人端只发不收（说话人不通过 10002 收控制指令，控制指令通过 `meta_human_launcher` 的 10001 TCP 走另一条路）。

## `core/interact.py`

就一个 dataclass：

```python
class Interact:
    def __init__(self, source: str, interact_type: int, data: dict):
        self.source = source            # "content" / "prologue" / "epilogue" / "play"
        self.interact_type = interact_type  # 1=chat, 2=prologue/play
        self.data = data
```

| source 值 | 触发位置 |
| --- | --- |
| `"content"` | 用户语音/文字交互（type=1），或 feedback 文案（type=2） |
| `"prologue"` | 唤醒成功后打招呼（type=2） |
| `"epilogue"` | 睡眠时告别（type=2） |
| `"play"` | 直接通过 HTTP `/api/play` 触发（type=2） |

## `core/recorder.py` —— 远程音频采集（1858 行，最大文件）

api/core/recorder.py#L171-L2111 每个远程音频设备连接一个实例，工作模式有两种：

### 两种录音模式

| mode | 协议 | VAD | ASR 入口 | 行号 |
| --- | --- | --- | --- | --- |
| `"websocket"` | 完整 WAV（带 RIFF 头）一次性发送 | ❌ | `save_wav_to_file()` | api/core/recorder.py#L1426-L1467 |
| `"socket"` | 持续 PCM 流（16kHz mono 16-bit） | ✅ 动态阈值（基于 `_history_level` deque） | `save_buffer_to_file()` + `audioop.rms` | api/core/recorder.py#L1469-L1648 |

模式切换由 `<mode>...</mode>` 命令触发（api/core/recorder.py#L569-L582）。

### 关键资源

| 资源 | 用途 | 关键配置 |
| --- | --- | --- |
| `StreamCache` (40MB) | 音频字节缓冲 | `stream_util.StreamCache(1024 * 1024 * 40)` |
| `__audio_buffer` (10MB bytearray) | 拾音中累计的 PCM | `__max_buffer_size = 10 * 1024 * 1024` |
| `__temp_file_pool` (5 个 wav) | 临时文件复用 | `_init_temp_file_pool()` |
| `__asr_task_queue` (maxsize=5) | ASR 任务异步队列 | `task_queue_maxsize=5`、`task_timeout=10s` |
| `__history_level` (deque 1000) / `__history_data` (deque 100) | 动态阈值计算 | `_ATTACK=0.1s`、`_RELEASE=0.7s` |

### 唤醒 / 睡眠 / 反馈 / 快速响应 状态机

`_handle_asr_result()`（api/core/recorder.py#L1102-L1222）：

```
ASR 文本 → 查 config["attributes"]
  ├─ wake_word_enabled=false       → 直接 on_thinking(text)
  └─ wake_word_enabled=true
      ├─ 唤醒词命中 → 发 activation + 发 "waking" 状态 + 播 prologue (Interact type=2)
      │   ├─ wake_word_type="common" → 直接处理输入
      │   ├─ wake_word_type="front"  → 删除唤醒词后处理
      │   └─ 睡眠词命中 → reset_wakeup_status() → 播 epilogue
      └─ 未唤醒 → 不响应，状态 "待唤醒"
```

`_should_listen()`（api/core/recorder.py#L1404-L1424）的拾音开关是 per-user 的：

```python
key = f"pickup_enabled:{current_username}"
if not global_vars.get(key):  # 默认启用
    return False
if user_state.speaking:        # 数字人播报时静音拾音
    return False
return True
```

`global_vars` 见 api/global_vars.py，是个迷你 pub-sub：set 触发 listener、get 取值。HTTP 接口 `/api/microphone` 直接读写这个 key。

### SpeakerConversationManager（说话人识别）

api/core/recorder.py#L58-L168：

- 依赖 FunASR 的声纹 diarization（`sentence_info` 字段）
- 同 IP 不同说话人 → 重新打招呼（`张三，你好！`）
- 同对话内切换说话人 → 只称呼名字（`张三，...`）
- 配置项：`spk_model_enabled`、`conversation_timeout`（默认 60s）

### ASR 适配

api/core/asr.py#L1-L10 是一个 10 行的工厂：

```python
def get_asr_client(asr_mode):
    if asr_mode == "funasr":
        return FunASR()
    elif asr_mode == "internal-funasr":
        return InternalFunASR()
```

`funasr` 走外置 ASR WebSocket，`internal-funasr` 走内置 ASR 二进制协议（`asr/internal.py`）。详见 `api/asr/` 子系统（后续 P2 扫描）。

## `core/broadcast.py` + `broadcast_service.py` —— 方案播报

两个文件协作：

| 函数 | 文件 | 行号 | 作用 |
| --- | --- | --- | --- |
| `get_current_solution()` | api/core/broadcast.py#L10-L25 | 入口，按 `entry` + `scheme_id` 选方案 |
| `get_broadcast_content()` | api/core/broadcast.py#L28-L75 | 替换 `articleList[].text` 中的 `${indicator_id}` 占位符 |
| `get_all_solutions()` | api/core/broadcast_service.py#L41-L59 | HTTP `GET /doManage/v1/voiceScheme/screenPath` 取所有方案 |
| `get_solutions_by_entry()` | api/core/broadcast_service.py#L62-L106 | 缓存版，按 entry 过滤，`solution_cache_enabled` 开关 |
| `get_indicator_value()` | api/core/broadcast_service.py#L12-L38 | HTTP `POST /doManage/v1/dataObject/executeDataOperation/{id}` 取指标值 |
| `clear_solutions()` | api/core/broadcast_service.py#L110-L116 | 定时清缓存（按 `cache_expiry` 秒） |

**管理服务器地址来自配置**：`cfg.config["management_server"]["ip"]` + `port`，实际是 Node `web/` 子项目（独立 HTTP 服务）。调用模式为请求-响应，**无 WebSocket**。

可选 `cn2an` 阿拉伯数字→中文数字转换（api/core/broadcast.py#L59-L69）。

## `core/command_service.py` —— 指令匹配

api/core/command_service.py#L493-L873 三大指令源：

| 优先级 | 源 | 数据 | 行号 |
| --- | --- | --- | --- |
| 1 | **内部固定指令** | 硬编码列表：暂停/继续/业务播报/静音/打开关闭对话框 等 7 类 | api/core/command_service.py#L496-L546 |
| 2 | **外部指令（传统相似度 + 正则）** | HTTP `GET /doManage/v1/command/list?screenPath={entry}` | api/core/command_service.py#L331-L352 |
| 3 | **向量指令** | `VectorServiceBase` 配 `BAAI/bge-small-zh-v1.5` | api/core/command_service.py#L705-L767 |

匹配模式通过 `cfg.vector_command.mode` 切换（api/core/command_service.py#L626-L703）：

- `traditional`（默认）：精确匹配 → 相似度匹配 → 复杂正则匹配
- `vector`：只走向量
- `hybrid`：简单指令优先向量，未命中降级到相似度；复杂指令强制走正则

### 模板与参数提取

`ParameterExtractor`（api/core/command_service.py#L19-L329）支持：

- 模板语法：`请?打开${A:number}的${B:string}场景`（参数带类型）
- **安全检查**：`MAX_TEMPLATE_LENGTH=500`、`MAX_REGEX_DEPTH=10`、ReDoS 危险模式黑名单（api/core/command_service.py#L32-L52）
- **中文数字自动转换**：`cn2an.cn2an(value, "smart")` 把"三百"转 300（api/core/command_service.py#L279-L291）
- 真/假值白名单：api/core/command_service.py#L24-L29 含 `["true","真","是","开启","启用","开","1"]` 等

`get_external_command_keyword()` 有两层缓存：指令原始列表 + 已预分类（simple/complex）api/core/command_service.py#L456-L490。

## `core/qa_service.py` —— 知识库问答

api/core/qa_service.py#L24-L338 与 command_service 对称：

- 数据源：`config/qna.csv`（**CSV**，不是数据库）
- 三种模式：`traditional / vector / hybrid`，配置项 `vector_qa.{mode, enabled}`
- 向量模式启动时**自动导入** CSV（如果向量库为空，api/core/qa_service.py#L248-L285）
- CSV 格式：`问题;近义问法 | 答案 | 备注`
- 新增问答：`add_qa_pair()` 同时写 CSV 和向量库（api/core/qa_service.py#L287-L328）

CSV 读有进程级缓存 `qna_cache`（api/core/qa_service.py#L179-L203）。

## `core/vector_service_base.py` —— 向量服务基类

api/core/vector_service_base.py#L17-L451 是 QAService / CommandService 共享的底层：

- **本地 sentence-transformers + ChromaDB**，无外部 API
- 默认模型：`BAAI/bge-small-zh-v1.5`（api/core/vector_service_base.py#L42-L44）
- 模型路径：`./models/embeddings/{model_name}/`，优先本地，无网络也能跑
- ChromaDB 持久化目录：`./data/vector_db/`（api/core/vector_service_base.py#L23-L23）
- 支持元数据过滤：`search(query_text, top_k, threshold, where={"entry": "home"})`
- **HNSW 段错误自愈**：检测到 `hnsw segment nothing found on disk` 后自动 `delete + recreate` 集合（api/core/vector_service_base.py#L263-L314），但恢复后数据丢失，需重新跑 `tools/import_*_to_vector.py`

## `core/socket_bridge_service.py` —— WS↔TCP 桥

api/core/socket_bridge_service.py#L18-L194 在 9001 起 WebSocket 服务，桥接到 10001 的 TCP socket：

```
WebSocket Client (e.g., audio-microphone, admin page)
    │ binary frames
    ▼
SocketBridgeService.handler (port 9001)
    │
    ▼
Raw TCP Socket 127.0.0.1:10001  ←→  meta_human_launcher.Recorder
```

- 连接池最大 5（api/core/socket_bridge_service.py#L27-L28），复用 socket 但要 `b"PING"` 探活
- 异步事件循环独立线程跑（api/core/socket_bridge_service.py#L187-L194）
- 单例模式（`__wss` 模块级变量）

## `scheduler/thread_manager.py`

api/scheduler/thread_manager.py#L6-L34 是 `threading.Thread` 子类：

- 自动注册到全局 `__thread_list`
- 提供 `get_id()` 和 `raise_exception()`（后者用 `ctypes.pythonapi.PyThreadState_SetAsyncExc` 异步抛 SystemExit）
- `stopAll()` 紧急停所有线程（api/scheduler/thread_manager.py#L52-L54）—— 但**代码里没调用**，可能为调试预留

## `utils/msg_utils.py`

api/utils/msg_utils.py#L5-L19 和 api/utils/msg_utils.py#L21-L35 两个工具：

| 函数 | 目标 WS 实例 | 触发条件 |
| --- | --- | --- |
| `send_web_msg(topic, username, data)` | `wsa_server.get_web_instance()` (port 10003) | 该 username 在 10003 上已连接 |
| `send_meta_human_msg(topic, username, data)` | `wsa_server.get_meta_human_instance()` (port 10002) | 该 username 在 10002 上已连接 |

两条都自动包裹 `entry + time` 字段。

## `global_vars.py`

api/global_vars.py#L1-L32 是一个带 listener 的进程级 KV 字典：

- `set/get/remove` 普通 KV
- `add_listener(name, fn)` 注册值变化回调
- 主要用于跨模块共享状态（per-user `pickup_enabled` 标志）

## `web/flask_server.py` —— HTTP API 全表

api/web/flask_server.py#L598-L601 监听 `:5000`，启用 CORS（`*`）。所有路由：

| Method | Path | 作用 | 行号 |
| --- | --- | --- | --- |
| GET | `/api/get-config` | 取全部配置 | api/web/flask_server.py#L122-L128 |
| POST | `/api/save-config` | 写配置（递归 merge） | api/web/flask_server.py#L87-L119 |
| POST | `/api/start-live` | 调 `meta_human_launcher.start()` | api/web/flask_server.py#L131-L141 |
| POST | `/api/stop-live` | 调 `meta_human_launcher.stop()` | api/web/flask_server.py#L144-L152 |
| POST | `/api/restart-live` | stop + start | api/web/flask_server.py#L155-L165 |
| POST | `/api/restart-irp` | HTTP 转发到 LLM 服务 `/reload_irp`（IRP） | api/web/flask_server.py#L168-L190 |
| POST | `/api/send` | 文字输入 → `on_interact(content, 1)` | api/web/flask_server.py#L193-L213 |
| POST | `/api/play` | 直接播报文本 → `on_interact(play, 2)` | api/web/flask_server.py#L216-L275 |
| GET | `/api/asr-status` | 取 ASR 队列/连接状态 | api/web/flask_server.py#L278-L291 |
| POST | `/api/clear-asr-queue` | 清空 Recorder ASR 任务队列 | api/web/flask_server.py#L294-L306 |
| POST | `/api/get_run_status` | 简单探活 | api/web/flask_server.py#L309-L316 |
| POST | `/api/adopt_msg` | 把当前问答写进 QA（CSV + 向量库） | api/web/flask_server.py#L319-L334 |
| POST | `/api/microphone` | 切换某用户拾音开关 | api/web/flask_server.py#L338-L371 |
| POST | `/api/microphone-status` | 查询拾音开关 | api/web/flask_server.py#L375-L405 |
| GET | `/audio/<filename>` | 静态音频文件（`samples/` 目录） | api/web/flask_server.py#L409-L415 |
| POST | `/api/clear-cache` | 清指令/播报/QA 三类缓存（可指定类型） | api/web/flask_server.py#L418-L457 |
| POST | `/api/asr/speakers/audio` | 上传声纹训练音频（multipart 或 base64） | api/web/flask_server.py#L460-L493 |
| POST | `/api/asr/speakers/train` | 调用 `spk_model.SpeakerEmbeddingManager` 生成 embeddings | api/web/flask_server.py#L496-L539 |
| POST | `/api/asr/speakers/embeddings` | 上传 embeddings JSON（base64） | api/web/flask_server.py#L542-L568 |
| GET | `/api/asr/speakers/embeddings` | 下载 embeddings JSON（base64） | api/web/flask_server.py#L571-L592 |

`run()` 用 gevent WSGIServer（api/web/flask_server.py#L598-L601）；`start()` 包成 MyThread（api/web/flask_server.py#L604-L605）；`stop()` 关 server。

## 与 UE5 客户端的协议边界

**关键观察**：数字人后端**从不直接生成音频**。TTS、播放、面部动画全部由 UE5 端负责。后端只把"说什么、用什么语速/音量/音调、messageId"通过 `topic="unreal"` 推到 10003 WS，UE5 客户端接收后自行处理：

```json
{
  "topic": "unreal",
  "username": "...",
  "data": {
    "source": "content",
    "topic": "chat",
    "msg": "您好",
    "speed": 1.0, "volume": 1.0, "pitch": 1.0,
    "messageId": "uuid",
    "streamInfo": {"isStream": true, "isFinal": false}
  },
  "entry": "/dashboard/home",
  "time": 1735689600
}
```

详见 metahuman-client-ue5/docs/%E6%95%B0%E5%AD%97%E4%BA%BA%E6%8E%A5%E5%85%A5%E6%96%87%E6%A1%A3-1.1.0.md。

## 已识别的"未实现 / 死代码"标注

| 位置 | 现象 | 影响 |
| --- | --- | --- |
| api/main.py#L4-L6 | 拼接 `test/ovr_lipsync/ffmpeg/bin` 到 PATH，目录不存在 | 无关口型，PATH 拼接在 Windows 下也无效，可清理 |
| api/core/meta_human/meta_human.py#L22-L25 | `X / W / mood` 8 维 numpy 数组声明但 `__update_mood` 为 `pass` | 情绪系统**完全空跑** |
| api/core/wsa_server.py#L309-L310 | `MetaHumanServer.on_receive_handler` 是 `pass` | 数字人端 WS 只发不收，控制指令走 TCP 10001 |
| api/scheduler/thread_manager.py#L52-L54 | `stopAll()` 未被任何地方调用 | 紧急停机机制未接入 |