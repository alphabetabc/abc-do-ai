# api/llm/ + 向量库子系统剖析

扫描范围：`api/llm/*.py`（8 个 LLM 适配器）、`api/core/llm.py`（动态加载分发器）、`api/core/vector_service_base.py`（向量基类）、`api/tools/import_*.py` / `query_vector_db.py` / `download_model.py`、`api/models/embeddings/`。

## LLM 适配器总览

api/core/llm.py#L9-L63 通过 `importlib.import_module("llm." + llm_mode)` 动态加载，`llm.mode` 配置决定加载哪个文件。

| 适配器 | 文件 | 通信方式 | 返回形态 | 流式 | 适用场景 |
| --- | --- | --- | --- | --- | --- |
| **`internal`** | api/llm/internal.py | HTTP POST blocking → Dify `/v1/workflows/run` | dict `{topic, data}` | ❌ | 内网 Dify workflow（带 RAG/FAQ/LLM 三种 channel） |
| **`dify`** | api/llm/llm_dify.py | HTTP POST blocking → Dify `/v1/chat-messages` | dict `{text, controls, message_id}` | ❌ | 通用 Dify chatflow |
| **`hfd`** | api/llm/llm_hfd.py | HTTP POST → 自研 `/ai/chatMessages` | dict `{text, markdown, controls}` | ✅（按 `llm.is_stream` 配置） | 内网"hfd" 服务，base64 解码复杂响应 |
| **`csb_ah`** | api/llm/llm_csb_ah.py | HTTP POST → 自研 `/ai/chatMessages` | dict `{text, markdown, controls, messageId}` | ✅ | 安徽 CSB，支持**链式思考**（deep-think 主题推流） |
| **`csb_stream`** | api/llm/llm_csb_stream.py | SSE 流式 → OpenAI-compatible `/v1/chat/completions` | Generator `{text, controls, finished}` | ✅ | 通用 OpenAI 兼容流式接口 |
| **`dxh`** | api/llm/llm_dxh.py | HTTP POST → 自研 `/interact` | dict `{text, controls}` | ❌ | 电信小号（dxh）接口 |
| **`siliconflow`** | api/llm/siliconflow.py | HTTP POST → `https://api.siliconflow.cn/v1/chat/completions` | dict `{topic, text, controls}` | ❌ | 硅基流动 DeepSeek-R1-Distill-Qwen-7B（云端） |
| **`old`** | api/llm/llm_old.py | — | — | — | **死代码**，只 re-import old |

**所有适配器签名一致**：`def question(content: str, username: str = "User") -> dict | Generator[dict]`

## 适配器关键代码

### `internal` —— 内网 Dify Workflow

api/llm/internal.py#L7-L55：

- 端点：`http://{llm.ip}:{llm.port}/v1/workflows/run`
- 认证：硬编码 `Bearer app-9yxFD8iGX8ACBNyLrRFsTESF`（api/llm/internal.py#L14）—— **生产环境应替换为配置项**
- `response_mode: blocking`（同步阻塞）
- 响应解析：取 `data.outputs.channel` + `data.outputs.payload`，根据 channel 路由 topic：
  - `rag / faq / llm` → `chat-stream`（流式）或 `chat`
  - 其它 channel → 直接作为 topic（如 `report`）

### `dify` —— 通用 Dify Chatflow

api/llm/llm_dify.py#L7-L36：

- 端点：`http://{llm.ip}:{llm.port}/v1/chat-messages`
- `api_key` 来自 `cfg.config["llm"]["api_key"]`
- `response_mode: blocking`
- 直接返回 `{answer, message_id}` 字段
- **无 session 缓存**——多轮对话需自行维护 conversation_id（传入空字符串）

### `hfd` —— 内网自研 HTTP（带 base64 解码）

api/llm/llm_hfd.py#L11-L65：

- 端点：`http://{llm.ip}:{llm.port}/ai/chatMessages`
- **per-user `sessionId` 缓存**（api/llm/llm_hfd.py#L8-L8）—— 会话上下文跨调用保持
- 响应解析：base64 解码后尝试解析 JSON `{normal, unreal, controls}`；失败则回退到原文
- `normal` → markdown（前端显示），`unreal` → text（UE5 显示）

### `csb_ah` —— 链式思考 + 并行调用

api/llm/llm_csb_ah.py 是最复杂的适配器（305 行）：

**双接口**：
- `/ai/chargeChain`：判断是否走链式回答，返回 `messageId`
- `/ai/chatMessages`：拿对话正文
- `/ai/getChainData`：轮询链式思考中间步骤

**并行调用**（api/llm/llm_csb_ah.py#L257-L294）：
```python
with ThreadPoolExecutor(max_workers=2) as executor:
    chain_future = executor.submit(_get_chain_data, ...)
    chat_future = executor.submit(_get_chat_message, ...)
    for future in as_completed([chain_future, chat_future], timeout=60):
        ...
```

**链式思考推流**（api/llm/llm_csb_ah.py#L55-L63）：
链式步骤通过 `msg_utils.send_web_msg("deep-think", username, {...})` 单独推送，前端订阅 `topic="deep-think"` 渲染思考过程。

**降级行为**（api/llm/llm_csb_ah.py#L36-L67）：
若 `/ai/getChainData` 不存在（老接口），模拟 3 段中文提示文案（"问题识别" / "智能体调用" / "思考规划"）。

**轮询策略**（api/llm/llm_csb_ah.py#L70-L138）：最多 30 次 × 2 秒。

### `csb_stream` —— OpenAI 兼容 SSE 流式

api/llm/llm_csb_stream.py#L14-L80：

- 端点：`http://{llm.ip}:{llm.port}/v1/chat/completions`
- 全局 `SESSION_ID = str(uuid.uuid4())`（api/llm/llm_csb_stream.py#L11）—— **所有用户共享同一个 session**（不是 per-user）
- 请求：`{model, temperature=0.7, stream=True, messages, summary=True}`，默认模型 `boco-agent-v1`（可配置）
- 重试 3 次，每次 timeout=30s

**流解析**（api/llm/llm_csb_stream.py#L157-L245）：
- SSE `data: ` 前缀剥离
- 结束标记：`[DONE]`
- 句子结束符集合：`{"!", "?", "。", "！", "？", "；", "\n"}`（**移除了 `.`**，避免小数点/缩写误判，api/llm/llm_csb_stream.py#L99）
- 每遇到结束符就 yield 一个 chunk（`finished=False`），最后 yield `finished=True`
- 缓冲区残留处理（api/llm/llm_csb_stream.py#L230-L235）

### `dxh` —— 电信小号接口

api/llm/llm_dxh.py#L6-L29：

- 端点：`http://{llm.ip}:{llm.port}/interact`
- 请求：`{query, stream}`
- 响应：`payload.text` / `payload.controls`
- **无认证头、无 session**

### `siliconflow` —— 硅基流动云端

api/llm/siliconflow.py#L4-L48：

- 端点：**HTTPS** `https://api.siliconflow.cn/v1/chat/completions`
- 模型：`deepseek-ai/DeepSeek-R1-Distill-Qwen-7B`（**硬编码**，不可配置）
- **特殊处理 R1 思考链**：若响应含 `</think>`，取其后内容（api/llm/siliconflow.py#L37-L38）
- 参数：`stream=False / max_tokens=512 / enable_thinking=False / thinking_budget=4096 / min_p=0.05 / temperature=0.7 / top_p=0.7 / top_k=50 / frequency_penalty=0.5 / n=1`
- `api_key` 来自 `cfg.config["llm"]["api_key"]`

### `old` —— 死代码

api/llm/llm_old.py#L1-L29：

- 端点：`/interact`（**和 `dxh` 完全一样**——疑似 `dxh` 改名前的代码）
- 配置项硬编码，无 session
- 仓库里**没有任何地方 import 它**（`llm.mode=old` 才会加载）

## 适配器返回结构差异（核心痛点）

各适配器返回 dict/Generator 的字段**不统一**：

| 适配器 | text 字段 | markdown 字段 | controls 字段 | messageId | 其它 |
| --- | --- | --- | --- | — | — |
| `internal` | `payload.get("data")` | ❌ | ❌ | ❌ | 有 `topic` |
| `dify` | `answer` | ❌ | `[]` | `message_id` | — |
| `hfd` | `data.unreal` | `data.normal` | `data.controls` | ❌ | — |
| `csb_ah` | `data.unreal` | `data.normal` | `data.controls` | `messageId` | — |
| `csb_stream` | `text` (chunk) | ❌ | `[]` | ❌ | `finished: bool` |
| `dxh` | `payload.text` | ❌ | `payload.controls` | ❌ | — |
| `siliconflow` | `text` | ❌ | `[]` | ❌ | 有 `topic` |

`async_processor._handle_chat_message_sync()` 调用适配器时通过 `__wrap_stream_result()`（P1 文档已述）统一包装为 `accumulated.{text,controls,markdown}`，但**直接调用适配器的代码**（如 `/api/send`）需要自己解析——容易出错。

## LLM 适配器的统一调用链

```
api/core/meta_human/message_handler.py
    └─ get_llm_question(llm_mode)          # 动态加载
        └─ llm.<mode>.question(content, username)
            ├─ 流式 (csb_ah/hfd/csb_stream) → Generator
            └─ 阻塞 (其它) → dict

async_processor._handle_chat_message_sync
    └─ for chunk in llm_generator:
        ├─ chunk["text"] → ws.send_web_msg("chat-stream", ...)
        ├─ chunk["controls"] → 解析 controls（表情/动作）
        └─ chunk["markdown"] → ws.send_web_msg("report", ...)

meta_human.say(interact, final_text, ...)
    └─ msg_utils.send_web_msg("unreal", ..., {msg, speed, volume, pitch})
```

注意 `message_handler.py` 的调用方式（详见 .trae/skills/meta-human-context-env/subprojects/api-backend-core.md）：

```python
get_llm_question(llm_mode)(msg, username)  # 流式时是 generator
for result in get_llm_question(llm_mode)(msg, username):  # 真阻塞适配器也接受 for 循环（yield 一次）
    accumulated_text += result.get("text", "")
    ...
```

## 向量库（VectorServiceBase）

api/core/vector_service_base.py#L17-L451 是 QA / Command 共享的本地向量层。

### 三大组件

| 组件 | 来源 | 行号 |
| --- | --- | --- |
| **Sentence-Transformers**（嵌入模型） | 本地 `./models/embeddings/<model_name>/`，无网优先；有网自动下载 | api/core/vector_service_base.py#L64-L99 |
| **ChromaDB**（持久化向量库） | `./data/vector_db/` 持久化目录 | api/core/vector_service_base.py#L101-L122 |
| **搜索** | 余弦距离 → 1-距离 = 相似度 → 阈值过滤 | api/core/vector_service_base.py#L316-L373 |

### 模型路径解析

api/core/vector_service_base.py#L64-L99：

1. 把 `model_cache_dir` 相对路径解析为 `<api>/models/embeddings`
2. `local_model_path = cache_path / model_name`
3. **若本地存在**：`SentenceTransformer(local_model_path, local_files_only=True)` 纯离线
4. **若本地不存在**：`SentenceTransformer(model_name, cache_folder=cache_path)` 自动下载到本地

### 默认模型

api/core/vector_service_base.py#L42-L44：

```
model_name = BAAI/bge-small-zh-v1.5   # ~100MB，192 维，中文优化
```

### HNSW 自愈机制（容错）

api/core/vector_service_base.py#L263-L314：

`_is_hnsw_segment_error()` 检测 `hnsw segment nothing found on disk`（断电/异常退出后索引段文件丢失）。

`_recover_collection()`：
1. `delete_collection(collection_name)` 失败则 `chroma_client.reset()` 重置
2. 重新 `get_or_create_collection`
3. **数据全部丢失**，需重跑 `tools/import_*_to_vector.py`

调用时机：api/core/vector_service_base.py#L176-L195 / api/core/vector_service_base.py#L230-L261 / api/core/vector_service_base.py#L379-L398 / api/core/vector_service_base.py#L412-L425。

### 集合元数据约定

| 集合 | 来源 | metadata 字段 |
| --- | --- | --- |
| `qa_knowledge` | `QAService.vector_qa` | `answer` / `extra` |
| `command_knowledge` | `CommandService.vector_command` | `control_content` / `entry` / `type="command"` |

`where={"entry": "home"}` 是搜索时的过滤条件（仅 command 支持）。

## 工具脚本

`api/tools/` 下 5 个工具，按使用频率排序：

### 1. `download_model.py` —— 嵌入模型下载

api/tools/download_model.py：

```bash
# 推荐模型（中文）
python tools/download_model.py --source modelscope         # 默认 BAAI/bge-small-zh-v1.5
python tools/download_model.py --source huggingface
python tools/download_model.py --model BAAI/bge-small-zh-v1.5 --source modelscope
python tools/download_model.py --list                       # 列出推荐
python tools/download_model.py --auto                       # 读 cfg.vector_service.model_name
```

| 推荐 | 模型 | 大小 |
| --- | --- | --- |
| 1 | `BAAI/bge-small-zh-v1.5` | ~100MB |
| 2 | `moka-ai/m3e-base` | ~400MB |
| 3 | `paraphrase-multilingual-MiniLM-L12-v2` | ~420MB |

下载完会自动跑 `model.encode("今天天气如何")` 验证。

### 2. `import_qa_to_vector.py` —— QA CSV → 向量库

api/tools/import_qa_to_vector.py：

```bash
python tools/import_qa_to_vector.py                       # 读 cfg.qna.qna_file
python tools/import_qa_to_vector.py --csv-file data/qna.csv
python tools/import_qa_to_vector.py --force               # 清空重导
python tools/import_qa_to_vector.py --stats                # 只看统计
```

CSV 格式：表头 `问题,答案,备注`，**多个近义问法用 `;` 分隔**（api/tools/import_qa_to_vector.py#L128）。

### 3. `import_command_to_vector.py` —— 外部指令 API → 向量库

api/tools/import_command_to_vector.py：

- 数据来源：HTTP `GET /doManage/v1/command/list?screenPath=<entry>`（Node `web/` 后台）
- **过滤带参数/正则的模板**（api/tools/import_command_to_vector.py#L182-L185）—— 含 `${...}` 或 `? * + | [ ] ( ) 的不进向量库`
- `_safe_split_templates()` 自定义逗号分割（api/tools/import_command_to_vector.py#L27-L67）—— 只分割不在 `{}` 或 `()` 内的逗号
- item ID：`f"cmd_{idx}_{hash(template)}"`

### 4. `query_vector_db.py` —— 调试 / 运维

api/tools/query_vector_db.py：

```bash
python tools/query_vector_db.py --type command --stats
python tools/query_vector_db.py --type qa --stats
python tools/query_vector_db.py --type command --list 20
python tools/query_vector_db.py --type command --search "打开灯" --entry home
python tools/query_vector_db.py --type qa --search "天气怎么样"
python tools/query_vector_db.py --type command --analyze-entries
```

### 5. `download_all_models.py` —— 一键下载 ASR + 嵌入

api/tools/download_all_models.py：批量下载 ASR 模型 + 嵌入模型。

## 模型文件状态

api/models/embeddings 实际已下载：

```
models/embeddings/
├── BAAI/
│   └── bge-small-zh-v1.5/              # sentence-transformers 标准布局
│       ├── 1_Pooling/config.json
│       ├── model.safetensors
│       ├── tokenizer.json
│       └── ... (sentence_bert_config, vocab.txt, etc.)
└── models--BAAI--bge-small-zh-v1.5/    # HF 风格布局
    ├── snapshots/7999e1d3.../
    └── refs/main
```

两种布局并存——sentence-transformers 加载时按 `cache_path / model_name` 直接读 `BAAI/bge-small-zh-v1.5/`。

## 配置模板

```ini
[llm]
mode = dify                              # 关键：选哪个适配器
ip = 127.0.0.1
port = 8000
is_stream = true                         # 是否流式
api_key = app-xxx                        # dify / siliconflow 必填

[vector_service]
model_name = BAAI/bge-small-zh-v1.5
model_cache_dir = ./models/embeddings
persist_directory = ./data/vector_db
similarity_threshold = 0.7

[vector_qa]
enabled = true
mode = hybrid                            # traditional | vector | hybrid
collection_name = qa_knowledge
top_k = 3

[vector_command]
enabled = true
mode = hybrid
collection_name = command_knowledge
top_k = 5

[qna]
qna_file = config/qna.csv
```

## 端到端数据流

```
用户文字 / ASR 文本
    │
    ▼
message_handler._handle_chat_message_sync
    │
    ├─ QAService.question(msg)            # traditional / vector / hybrid
    │   └─ if vector_qa.enabled:
    │       └─ VectorServiceBase.search(top_k=3, threshold=0.7)
    │           └─ ChromaDB.query(query_embeddings)
    │
    ├─ CommandService.get_command(...)   # 同上，top_k=5 + where={entry}
    │
    └─ get_llm_question(llm.mode)(msg)   # 流式 / 阻塞
        └─ 适配器（dify / hfd / csb_ah / ...）
            └─ HTTP POST / SSE
```

## 已识别的"未实现 / 死代码 / 注意事项"

| 位置 | 现象 |
| --- | --- |
| api/llm/internal.py#L14 | Dify API key **硬编码**为 `app-9yxFD8iGX8ACBNyLrRFsTESF` —— 生产环境应改为 `cfg.config["llm"]["api_key"]` |
| api/llm/llm_csb_stream.py#L11 | `SESSION_ID = str(uuid.uuid4())` 是**全进程共享**的，所有用户同一个 session —— 多用户上下文会互相污染 |
| api/llm/siliconflow.py#L12 | 模型名硬编码 `deepseek-ai/DeepSeek-R1-Distill-Qwen-7B`，不可配置 |
| api/llm/llm_old.py | 完全无引用，是 `dxh` 的旧版 —— 可考虑删除或合并 |
| `csb_ah` 链式思考超时 | `_get_chain_data()` 30 次 × 2 秒 = 最长 60 秒，可能比 chat 还慢 |
| 各适配器返回字段不一致 | `internal/siliconflow` 用 `topic`；`csb_stream` 用 `finished`；`hfd/csb_ah` 用 `markdown` —— `__wrap_stream_result` 只统一了"流式"那一支；同步适配器需要适配器自己写 topic |
| `llm_csb_ah.py:36-67` | 链式思考降级文案是**硬编码中文**，写死"应急大屏问答智能体"等专用话术，不通用 |
| api/core/vector_service_base.py#L60-L62 | 模型加载失败后**静默继续**（`self.model = None`），但仍尝试 `get_or_create_collection` —— 会抛异常 |
| ChromaDB 持久化路径 | `./data/vector_db/` —— Docker 部署时必须挂载到持久卷，否则重启数据丢失 |
| HNSW 自愈 | 自愈后**数据丢失但代码不报警** —— 只有 `util.system_log(2, ...)` 提示用户重跑 import 脚本 |
| api/core/llm.py | 动态加载用 `importlib.import_module("llm." + llm_mode)` —— 拼字符串路径，**没有白名单**。`llm.mode = "__import__('os').system('rm -rf /')"` 这种攻击面存在（配置来源若不可信） |
| api/core/meta_human/message_handler.py 调用 LLM | 用 `for result in get_llm_question(...)` 同时支持阻塞和流式 —— 阻塞适配器被迭代一次后即结束，行为依赖适配器是否真为 generator |