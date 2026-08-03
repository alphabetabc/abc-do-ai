# api/asr/ 子系统剖析

扫描范围：`api/asr/*.py`（客户端）+ `api/asr/funasr-server/*`（服务端，含声纹）。

## 体系总览

ASR 链路分三层，按 `asr.asr_mode` 配置切换：

| 层 | 文件 | 角色 |
| --- | --- | --- |
| 客户端（后端核心调用方） | api/asr/funasr.py | 单实例 HTTP 客户端（已过期） |
| 客户端（多实例） | api/asr/internal.py | WebSocket 客户端 + 负载均衡 + 重连 |
| 服务端（本地模型） | api/asr/funasr-server/ASR_server.py | FunASR 本地模型推理（模型在 models/） |
| 服务端（在线模型） | api/asr/funasr-server/ASR_server_local.py | FunASR 在线下载模型推理 |
| 服务端（声纹） | api/asr/funasr-server/spk/spk_model.py | campplus 说话人 embedding 提取与匹配 |
| 监控 API（可选） | api/asr/asr_manager.py | Flask + gevent，监听 `:5001`，监控多实例 |

工厂入口在 api/core/asr.py#L1-L10：

```python
def get_asr_client(asr_mode):
    if asr_mode == "funasr":
        return FunASR()
    elif asr_mode == "internal-funasr":
        return InternalFunASR()
```

`recorder.py` 的 `add_frame / send` / `start / end / get_final_results_and_reset` 都是面向这个客户端 API。

## 单实例 HTTP 客户端（已过期，不推荐）

api/asr/funasr.py#L1-L22：22 行的 `requests.post`，无连接复用、无流式支持。`asr.asr_mode == "funasr"` 时被选中。仓库内**没有启用**——生产配置走 `internal-funasr`。

## 多实例 WebSocket 客户端

api/asr/internal.py 是当前线上唯一在用的客户端：

### 生命周期

| 阶段 | 行为 | 行号 |
| --- | --- | --- |
| `__init__` | `get_load_balancer().get_instance()` 选首个实例；失败回退到单实例 `cfg.config["asr"]["port"]` | api/asr/internal.py#L13-L29 |
| `start()` | 检查重入锁后启 `Thread(__connect)`，发 `StartTranscription` 控制帧 | api/asr/internal.py#L326-L345 |
| `send(buf)` / `add_frame(frame)` | 入 `__frames` 队列（**1000 帧上限**，超出则丢弃最旧） | api/asr/internal.py#L263-L286 |
| `end()` | flush 队列 + 发 `StopTranscription` | api/asr/internal.py#L347-L361 |
| `send_url(url, request_id)` | 文件路径方式识别；返回生成的 `request_id` | api/asr/internal.py#L288-L324 |

### 协议帧

控制帧（dict，JSON 序列化）：
```json
{ "vad_need": false, "state": "StartTranscription" | "StopTranscription" }
```

数据帧：
- 二进制：原始 PCM bytes（流式模式）
- 文本：文件路径方式（`{"url": "/path.wav", "request_id": "req_xxx"}`）或 base64（`{"audio_data": "...", "format": "wav"}`）

服务端的响应帧：
- 文本（api/asr/internal.py#L51-L133）：
  - `{"text": "...", "request_id": "..."}`
  - `{"sentence_info": [{"text":..., "start":ms, "end":ms, "spk": "name"}], "request_id": "..."}`
  - `{"error": "..."}`

### 重连 / 故障转移

api/asr/internal.py#L169-L210 `__attempt_reconnect()`：

- 最多 3 次重试
- 每次 sleep `__reconnect_delay` 秒（指数退避，上限 30s）
- **每次重试都调 `load_balancer.get_instance()`，可能换到不同实例**——这就是"故障转移"
- 出错会 `mark_instance_down(id)`，把实例从可用池摘掉

### 队列与统计

`__frames` 上限 **1000**，超出会丢弃并打印丢帧率（api/asr/internal.py#L263-L273）。`get_queue_status()` / `get_load_balancer_status()` 供监控 API 调用。

## 负载均衡器

api/asr/load_balancer.py 是 ASRLoadBalancer 单例：

### 实例发现

api/asr/load_balancer.py#L43-L71：
- 多实例：`multi_instance_enabled=true` → 从 `start_port` 开始连开 `instance_count` 个端口
- 单实例：`port=10197` 单点

### 策略实现

| 策略 | 实际行为 | 关键代码 |
| --- | --- | --- |
| `round_robin`（默认） | **不是纯轮询**：先过滤 `instance_status[True]`，找 `connection_counts` 最少的若干实例，再在它们之间轮询 | api/asr/load_balancer.py#L104-L140 |
| `random` | 70% 概率选最少连接池，30% 随机 | api/asr/load_balancer.py#L142-L171 |
| `least_connections` | 选最少连接；并列时挑 `last_used_times` 最小的（最久未用的） | api/asr/load_balancer.py#L173-L202 |

**注意**：`round_robin` 实际行为是 "min-connections + RR"，不是字面意义的"轮询"。如果负载不均匀，应改 `least_connections`。

### 健康检查

| 函数 | 用法 | 行号 |
| --- | --- | --- |
| `simple_health_check()` | TCP `connect_ex` 1s 超时，**不发任何数据**——避免 WS 握手错误 | api/asr/load_balancer.py#L228-L256 |
| `health_check()` | 真连 WS 发 `{"action":"status"}`，3s 等待——但会产生握手错误日志 | api/asr/load_balancer.py#L278-L303 |
| `_check_websocket_health()` | 单实例 WS 探活，失败回退到 TCP | api/asr/load_balancer.py#L305-L378 |

`/api/asr/health` 用 `simple_health_check()`，`/api/asr/health/detailed` 用 `health_check()`。

## 监控 API（asr_manager.py）

api/asr/asr_manager.py 是一个独立的 Flask + gevent.pywsgi 服务，监听 `:5001`。路由：

| Method | Path | 作用 | 行号 |
| --- | --- | --- | --- |
| GET | `/api/asr/status` | 调 `get_status()` 返回 LB 整体快照 | api/asr/asr_manager.py#L25-L32 |
| GET | `/api/asr/health` | **TCP 健康检查**，避免 WS 握手错误 | api/asr/asr_manager.py#L34-L50 |
| POST | `/api/asr/instance/<id>/status` | 手动 mark up/down | api/asr/asr_manager.py#L52-L72 |
| GET | `/api/asr/config` | 返回 ASR 配置（关键字段全在这里读） | api/asr/asr_manager.py#L74-L95 |
| GET | `/api/asr/instances` | 列出每个实例的 id/url/connections/uptime | api/asr/asr_manager.py#L97-L130 |
| GET | `/api/asr/health/detailed` | 完整 WS 探活 | api/asr/asr_manager.py#L132-L148 |

**注意**：这个服务需要在 `api/start.sh` 或类似启动脚本里手动 `python3 asr/asr_manager.py`——**主进程 `main.py` 不会自动起它**。

## 服务端 ASR_server.py（本地模型版）

api/asr/funasr-server/ASR_server.py 是个 1579 行的 `websockets.serve` 单文件服务。

### 启动参数

api/asr/funasr-server/ASR_server.py#L25-L61：

```bash
python -u ASR_server.py --host 0.0.0.0 --port 10197 --device auto --workers 4 \
                        [--enable-spk] [--spk-debug] [--spk-threshold 0.35] [--spk-no-dynamic]
```

| 参数 | 默认 | 含义 |
| --- | --- | --- |
| `--host` | `0.0.0.0` | 监听地址 |
| `--port` | `10197` | WS 端口 |
| `--device` | `auto` → `cuda:0` 优先，否则 `cpu` | 推理设备 |
| `--workers` | `4` | 内部识别任务并发数 |
| `--enable-spk` | 关 | 启用 campplus 声纹模型 |
| `--spk-debug` | 关 | 声纹详细日志 |
| `--spk-threshold` | `0.35` | 说话人匹配相似度阈值 |
| `--spk-no-dynamic` | 关 | 禁用动态阈值 |

### 模型配置

api/asr/funasr-server/ASR_server.py#L224-L247：

| 模型 | 路径 | 来源 |
| --- | --- | --- |
| ASR | `models/iic/speech_seaco_paraformer_large_asr_nat-zh-cn-16k-common-vocab8404-pytorch` | 本地（`download_models.py`） |
| VAD | `models/iic/speech_fsmn_vad_zh-cn-16k-common-pytorch` | 本地 |
| 标点 | `models/iic/punc_ct-transformer_zh-cn-common-vocab272727-pytorch` | 本地 |
| 声纹 | `models/iic/speech_campplus_sv_zh_en_16k-common_advanced` | 本地（可选） |

`disable_update=True`（api/asr/funasr-server/ASR_server.py#L236）跳过 modelscope 的版本检查。

VAD 配置：`max_single_segment_time: 12000ms`（api/asr/funasr-server/ASR_server.py#L232）。

### WebSocket handler（api/asr/funasr-server/ASR_server.py#L369-L1221）

支持的动作（按字符串 `action` 字段路由）：

| action | 作用 | 行号 |
| --- | --- | --- |
| `status` | 返回 `queue_size/max_queue_size/queue_usage/stats/active_connections/workers/spk_enabled/spk_speakers_count/hotwords_count` | api/asr/funasr-server/ASR_server.py#L452-L476 |
| `spk_train` | 从 `folder_path`（默认 `/opt/funasr/spk/speaker_data`）批量提取 embedding，覆盖 `speaker_embeddings.json` | api/asr/funasr-server/ASR_server.py#L478-L556 |
| `spk_upload` | 接收 base64 编码的 embeddings JSON 字符串，写入文件并重载 | api/asr/funasr-server/ASR_server.py#L558-L616 |
| `spk_download` | 返回 base64 编码的 embeddings JSON | api/asr/funasr-server/ASR_server.py#L618-L669 |
| `spk_upload_audio` | 接收 base64 编码 WAV 文件，存到 `spk/speaker_data/<name>.wav`，重名自动加 `_N` 后缀 | api/asr/funasr-server/ASR_server.py#L671-L743 |
| `hotword_update` | 更新 `data/hotword.txt`，支持 merge / replace 两种模式 | api/asr/funasr-server/ASR_server.py#L745-L795 |

流式控制帧兼容：
- `state: "StartTranscription"` / `"StopTranscription"`：被忽略，仅保活（api/asr/funasr-server/ASR_server.py#L797-L802）

识别请求：
- `{"url": "/abs/path.wav", "request_id": "..."}`：文件路径方式
- `{"audio_data": "<base64>", "format": "wav", "request_id": "..."}`：文件流方式

`request_id` 是必传字段，缺失则服务端自动生成 `req_<16位hex>`。

### 队列与 worker

api/asr/funasr-server/ASR_server.py#L365-L365：
- `task_queue = asyncio.Queue(maxsize=100)`：服务端识别任务队列，**100 上限**
- `queue_stats = {"total_tasks", "dropped_tasks", "processed_tasks"}`：统计
- `N` 个 `worker()` 协程并发处理（`--workers` 控制）
- 队列满时回 `{"error": "ASR服务繁忙，请稍后重试", "request_id": "...", "queue_size": ..., "max_queue_size": 100, "drop_rate": "..."}`

### 推理调用

api/asr/funasr-server/ASR_server.py#L1314-L1536：

```python
param_dict = {
    "sentence_timestamp": True,  # 必须：返回分句时间戳
    "batch_size_s": 120,
    "batch_size_threshold_s": 30,
}
if hotword: param_dict["hotword"] = hotword  # 热词空格分隔
res = asr_model.generate(input=url, is_final=True, **param_dict)
```

返回结构：

```python
res[0] = {
  "text": "...",
  "sentence_info": [{"text", "start", "end", "spk"}, ...]  # 启动 spk 时才有
}
```

### 声纹处理

api/asr/funasr-server/ASR_server.py#L1224-L1273：

- 入口仅在 `--enable-spk` 时启用
- `SPK_EMBEDDING_MANAGER` 延迟初始化（首次调用时 `from spk_model import SpeakerEmbeddingManager`）
- 调用高层接口 `identify_speakers_from_sentences(audio_path, sentence_info, known_embeddings, threshold=0.35, min_duration_ms=500, use_dynamic_threshold=True)`
- `use_dynamic_threshold` 受 `--spk-no-dynamic` 控制，**默认开**
- 失败时返回 `{}`，sentence_info 里所有 spk 都标 `"unknown"`

最终返回客户端：

```json
{
  "text": "你好世界",
  "request_id": "...",
  "sentence_info": [
    { "text": "你好", "start": 100, "end": 500, "spk": "张三" },
    { "text": "世界", "start": 500, "end": 900, "spk": "李四" }
  ]
}
```

### 热词机制

api/asr/funasr-server/ASR_server.py#L67-L204：
- 启动时一次性加载到 `HOTWORD_CACHE`，识别时不再读盘
- `hotword_update` action 三种入参：string（空格分隔）/ list / base64 编码文件
- merge 模式：去重并保留旧顺序
- replace 模式：去重覆盖

### 服务端关键配置

| 项 | 值 | 行号 |
| --- | --- | --- |
| `CACHE_DIR` | `funasr-server/cache/` | api/asr/funasr-server/ASR_server.py#L217-L220 |
| `task_queue` maxsize | 100 | api/asr/funasr-server/ASR_server.py#L365 |
| `websocket.timeout` | 300 秒（5 分钟） | api/asr/funasr-server/ASR_server.py#L406 |
| WebSocket ping/pong | `ping_interval=20s / ping_timeout=120s / close_timeout=30s` | api/asr/funasr-server/ASR_server.py#L1553-L1555 |
| 模型预热 | 0.1s 静音 PCM_16 | api/asr/funasr-server/ASR_server.py#L344-L359 |
| 每请求 gc.collect() | ✅（避免频繁 `torch.cuda.empty_cache()` 抖动） | api/asr/funasr-server/ASR_server.py#L1536 |

## 服务端 ASR_server_local.py（在线模型版）

api/asr/funasr-server/ASR_server_local.py 与 `ASR_server.py` **几乎逐行相同**，差异：

| 差异点 | ASR_server.py | ASR_server_local.py |
| --- | --- | --- |
| 模型路径 | 本地 `models/iic/...` | 直接传 HuggingFace 仓库名 `iic/...`（首次运行时 modelscope 自动下载） | api/asr/funasr-server/ASR_server_local.py#L222-L228 |
| 日志详细度 | DEBUG（每个时间点都打点） | INFO（精简版，少 ~150 行日志） |
| `disable_update` | True | True（在线版禁用更新检查是关键，否则会卡住） |

**何时用哪个**：
- 离线生产 → `ASR_server.py`（模型在 `models/`，启动快、不需联网）
- 临时测试 / 资源有限的开发环境 → `ASR_server_local.py`（首次下载约 2GB）

## 声纹模块 spk/spk_model.py

api/asr/funasr-server/spk/spk_model.py 提供 4 个高层 API（其余代码详见文件）：

| 方法 | 作用 |
| --- | --- |
| `process_audio_folder(folder, output_json)` | 遍历 `folder/<name>_*.wav`，取平均 embedding，写入 JSON |
| `load_embeddings(json_path)` | 读 embeddings 文件 → `{name: np.ndarray}` |
| `extract_embedding(audio_path)` | 单文件 → 192 维 float32 向量（L2 归一化） |
| `identify_speakers_from_sentences(audio_path, sentence_info, known_embeddings, threshold, min_duration_ms=500, use_dynamic_threshold=True)` | 在 ASR 分句上做识别，返回 `{spk_id: name}` |
| `calculate_similarity(emb1, emb2)` | 余弦相似度（已归一化等价点积） |

**音频预处理**：
- `use_volume_normalize=True`（默认）：归一化音量
- `use_noise_reduce=False`（默认）：可用 noisereduce，但 ASR 已做 VAD，无需重复
- 不做 VAD（因为 ASR 阶段已做）

**音频缓存**：`_audio_cache` 字典，最多缓存 10 个文件（api/asr/funasr-server/spk/spk_model.py#L97-L98）。

## 端到端数据流

```
[远程音频设备 / 客户端浏览器]
    │ raw PCM 16kHz / WAV bytes
    ▼
api/meta_human_launcher.Recorder (10001 TCP)
    │ 拾音 → bytearray 缓冲 → VAD
    ▼
Recorder.add_frame / send → asr_server (internal.py)
    │ ws frame (binary)
    ▼
ASR_server.py (10197 WS, n 实例)
    │ task_queue (maxsize=100)
    ▼
worker() → asr_model.generate()
    │ {"text", "sentence_info[{start, end, spk}]"}
    ▼
internal.py.on_message → finalResults + sentence_info
    │
    ▼
recorder.py._handle_asr_result → wake/sleep/asr command 分支
    │
    ▼
meta_human.message_handler → llm / qa / command
```

## 配置模板（`config/config.ini`）

来自 api/asr/README_MULTI_INSTANCE.md#L11-L21：

```ini
[asr]
ip = 127.0.0.1
port = 10197
asr_mode = internal-funasr
asr_save_audio = true

multi_instance_enabled = true
server_mode = server              # server | local
instance_count = 3
start_port = 10197
workers_per_instance = 4
load_balance_strategy = round_robin
```

## 启动方式

| 场景 | 命令 |
| --- | --- |
| 单实例（开发） | `python -u ASR_server.py --port 10197 --device auto --workers 4` |
| 多实例 | `bash start_asr_multi.sh`（在 `api/` 下，自动启 N 个端口实例） |
| 在线模型 | `python -u ASR_server_local.py ...` |
| 监控 API | `python3 asr/asr_manager.py`（端口 5001，**非自动启动**） |

停止：`pkill -f "python -u ASR_server.py"` 或 `bash stop_asr.sh`。

## 已识别的"未实现 / 死代码 / 注意事项"

| 位置 | 现象 |
| --- | --- |
| api/asr/funasr.py#L1-L22 | HTTP 单实例客户端已过期，生产配置走 `internal-funasr`，可考虑移除 |
| api/asr/load_balancer.py#L104-L140 | `round_robin` 实际是 `min-connections + RR`，命名易误导 |
| api/asr/asr_manager.py | Flask 监控服务**未被 `main.py` 自动拉起**，需手动启——容易遗漏 |
| api/asr/funasr-server/ASR_server.py#L220 | `CACHE_DIR` 默认在 `funasr-server/cache/`，Docker 部署时需挂载到持久卷，否则临时音频会丢 |
| api/asr/funasr-server/ASR_server.py#L1536 | 每请求 `gc.collect()`——开销约 5-10ms，吞吐影响在 GPU 推理占比高时可忽略 |
| `round_robin` 实际行为 | **过滤 down 实例后会"压缩"索引**——重启后实例 0+2+3 都可达时，会一直选 0。生产环境建议改 `least_connections` |
| 训练声纹 vs 编辑声纹 | 只能整库 `spk_upload` 覆盖，没有增删单个说话人的接口，需要重启服务 |