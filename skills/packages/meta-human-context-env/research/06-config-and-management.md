# 06. 配置与运营管理

## 配置数据来源（前端静态 + 后端动态）

| 类型 | 路径 | 加载方式 | 作用 |
| --- | --- | --- | --- |
| **数字人清单** | `web/public/static/data/digitalHumanList.json` | 静态 JSON | 配置后台选人界面 |
| **指令模板** | `web/public/static/data/commandTemplateList.json` | 静态 JSON | 配置后台指令编辑 |
| **环境配置** | `metahuman/public/environment.json` | 运行时 fetch | 单页 Demo 的运行时配置 |
| **UE5 客户端配置** | `metahuman-client-ue5/electron/config.js`（多 env：`config.gd.js`、`config.gw.js`） | Electron 启动加载 | 控制 SDK + UE5 + 字幕 + 闲时动画 |
| **后端配置** | `api/config/config.ini` | Python `config_util.load_config()` | 端点、ASR 实例数、LLM 选择 |
| **向量库数据** | `api/data/vector_db/chroma.sqlite3` | Chroma DB 持久化 | 知识库 / QA / 指令语义检索 |
| **声纹模型** | `api/asr/funasr-server/spk/` | 训练后导出 | 说话人识别 |

## 多环境配置（UE5 客户端）

`metahuman-client-ue5/electron/ElectronApp.js`：

```js
const configEnvFilePath = path.join(__dirname, "config-env.json");
const getCurrentEnv = () => {
    if (fs.existsSync(configEnvFilePath)) {
        const envData = JSON.parse(fs.readFileSync(configEnvFilePath, "utf8"));
        return envData.env || "default";
    }
    return process.env.CONFIG_ENV || "default";
};

const getConfig = () => {
    const env = getCurrentEnv();
    const candidates = [
        `./config.${env}`,
        `./config${env.charAt(0).toUpperCase() + env.slice(1)}`,
    ];
    for (const mod of candidates) {
        try { return require(mod).config; } catch (e) {}
    }
    throw new Error(`未找到匹配的配置文件: ${candidates.join(", ")}`);
};
```

- 默认走 `config.js`。
- 如果 `config-env.json` 里写 `{"env": "gd"}`，则加载 `config.gd.js`。
- 找不到时 fallback 到默认。

## SDK 入口配置（environment.json）

```json
{
  "sdkMetahumanWebglConfig": {
    "common": { "entryLocation": "/great-tang-all-day-mall" },
    "digitalHumanService": { "ip": "10.21.2.87" },
    "digitalHumanClient": { "mode": "Web" },
    "microphoneConfig": { "ip": "10.21.2.87" }
  },
  "metaHumanConfig": {
    "ttsConfig": { "ttsUrl": "http://10.21.2.87:8089/v1/tts", "reference_id": "woman", ... },
    "maxCharsPerSubtitle": 20
  }
}
```

- 通过 `window.MetaHuman.SDK(currentSdkConfig)` 注入到 SDK。
- 详见 `metahuman/src/App.tsx` + `metahuman/src/components/metahuman-webgl-render/index.tsx`。

## 指令模板配置

`web/public/static/data/commandTemplateList.json` 把业务抽象成可枚举的"动作 + 参数模板"：

```json
{
  "actionName": "界面选中高亮",
  "action": "SELECTED_OPERATE",
  "template": { "target": ["css选择器"] }
},
{
  "actionName": "界面内容切换",
  "action": "SWITCH_OPERATE",
  "template": { "module": "模块id", "params": {"desc":"按需传参"} }
},
{
  "actionName": "地图覆盖",
  "action": "COVER_OPERATE",
  "template": { "module": "模块id" }
}
```

这些模板就是 LLM "意图→动作" 转换时的候选清单。LLM 根据用户问句决定输出哪个 `action` + 填充哪些字段。

## 数字人管理后台（Streamlit）

`api/metahuman-admin/`：

- 系统监控：CPU / 内存 / GPU / 磁盘。
- 服务管理：ASR / 主程序启动 / 停止 / 重启。
- 声纹训练：上传音频 → 提取特征 → 导出 JSON。
- 配置管理：在线编辑 `config.ini` / `hotword.txt` / `qna.csv`。
- 实时日志：通过 WebSocket（端口 8766）流式推送给前端。

### 目录结构

```
api/metahuman-admin/
├── app.py                          # 主入口（首页仪表盘，852 行）
├── config.yaml                     # 平台自身配置
├── requirements.txt                # streamlit / psutil / GPUtil / plotly / websockets / watchdog
├── start.sh / start.bat            # 一键启动（拉起 WS + streamlit）
├── stop.sh / stop.bat              # 一键停止
├── start_log_stream.py             # WS 日志流服务器入口
│
├── .streamlit/
│   ├── config.toml                 # streamlit 运行配置
│   └── custom.css                  # 自定义样式
│
├── pages/                          # 5 个功能页（文件名 emoji 影响导航图标）
│   ├── 1_🎤_Speaker_Training.py
│   ├── 2_⚙️_System_Config.py
│   ├── 3_🔄_Service_Management.py
│   ├── 4_📊_Data_Statistics.py
│   └── 5_📦_Data_Management.py
│
├── modules/                        # 业务模块
│   ├── audio_processor.py          # 音频质量检测（音量/时长/格式）
│   ├── config_editor.py            # config.ini / hotword.txt / qna.csv 在线编辑器
│   ├── config_reader.py            # 配置读取（含动态 ASR 端口推断）
│   ├── log_reader.py               # 日志历史查询
│   ├── log_stream_server.py        # WS 日志流服务器（watchdog 监控文件变更）
│   ├── service_controller.py       # 服务启停（subprocess + psutil）
│   ├── speaker_manager.py          # 说话人/录音文件 CRUD + ZIP 导出
│   ├── statistics.py               # 业务统计（聊天记录 / 热门问题 / KPI）
│   ├── system_monitor.py           # CPU/内存/GPU/磁盘 + 进程/端口扫描
│   └── training_manager.py         # 调用 spk_model.py 训练说话人
│
├── components/                     # streamlit 组件
│   ├── custom_audio_recorder.py    # 浏览器录音组件
│   └── log_stream_viewer.py        # 日志流浏览器组件（订阅 WS）
│
└── utils/
    ├── cache_helper.py             # streamlit 缓存管理
    ├── path_helper.py              # 跨平台路径解析（含 Docker / Windows / Linux）
    └── websocket_starter.py        # 自动启动 WS 日志流服务器
```

### 端口与启动顺序

| 端口 | 用途 | 启动方 |
| --- | --- | --- |
| **8766** | WS 日志流服务器 | `start.sh` 自动拉起（或 `app.py` 首次访问时 `ensure_websocket_running` 自动拉起，api/metahuman-admin/utils/websocket_starter.py#L32-L86） |
| **10010** | Streamlit 管理端 | `start.sh` / `streamlit run app.py` |

`start.sh` / `start.bat` 的逻辑：
1. 检查 Python 环境与依赖
2. 后台启动 `python start_log_stream.py`（端口 8766）
3. 前台启动 `streamlit run app.py --server.port 10010`

`stop.sh` / `stop.bat`：杀 streamlit 进程 + 杀 WS 日志流进程。

### 5 个页面能力矩阵

| Page | 核心能力 | 关键模块 |
| --- | --- | --- |
| **首页** `app.py` | CPU/内存/GPU/磁盘仪表盘 + 服务状态表 + KPI 评分（性能/质量/稳定性）+ 关键词 Top 20 + 热门问题 + 对话记录分页 + 声纹统计 + 快捷跳转 | `system_monitor` + `statistics` + `path_helper` + `speaker_manager` |
| **1. 声纹训练** | 浏览器录音组件 + WAV 上传 + 删除录音 + 调 `spk_model.py` 提取 embedding + 下载 `speaker_embeddings.json` + 一键重启 ASR 服务 | `audio_processor` + `speaker_manager` + `training_manager` + `service_controller` |
| **2. 系统配置** | 在线编辑 `config.ini`（按 section 树形展示）+ `hotword.txt`（合并/覆盖模式）+ `qna.csv`（表格 CRUD） | `config_editor` + `config_reader` |
| **3. 服务管理** | 一键启停 ASR、主程序（api/main.py）+ WS 日志流实时推送（无需刷新页面） + 服务健康检查 + 资源占用 | `service_controller` + `log_reader` + `log_stream_viewer` |
| **4. 数据统计** | 对话记录分析 + 识别准确率 + 性能图表 + 日志分析（README 写"待开发"，但首页已实现核心图表） | `statistics` |
| **5. 数据管理** | 向量库 QA / Command 导入（CSV / API）+ 隔离导入上下文（`isolated_api_import` 上下文管理器）| `path_helper` + `config_reader` |

### 关键模块要点

#### `service_controller.py` —— 服务启停核心

api/metahuman-admin/modules/service_controller.py#L16-L839：

**进程匹配规则**（api/metahuman-admin/modules/service_controller.py#L375-L418）：
- **排除自身**：`streamlit` / `app.py` / `metahuman-admin` / `start_log_stream`
- **必须含**：`main.py` 出现在非 `-` 开头的 arg
- **进程名匹配**：`python` / `python3` / `python.exe`

**跨平台脚本执行**（api/metahuman-admin/modules/service_controller.py#L160-L289）：
- Windows + `.bat` → 直接执行
- Windows + `.sh` → 用 Git Bash 跑（api/metahuman-admin/modules/service_controller.py#L135-L158 自动转 `D:\...` → `/d/...`）
- Linux/Mac + `.sh` → `bash`
- Python 脚本 → `python` / `python3`
- 启动后 sleep 3 秒检查进程是否还在（立即失败 = 报错）

**ASR 启动健康等待**（api/metahuman-admin/modules/service_controller.py#L479-L571）：
- 每 2 秒轮询 ASR 实例端口
- timeout 默认 60 秒
- 返回 `{ready_instances, total_instances, elapsed_time, warning?}`

#### `path_helper.py` —— Docker/Windows/Linux 路径统一

模块基于：
- `/.dockerenv` 存在 → Docker 环境（api/metahuman-admin/modules/service_controller.py#L71）
- `/proc/1/cgroup` 含 `docker` → Docker
- `DOCKER_CONTAINER=true` 环境变量 → Docker

Docker 中 `project_root = /app`（= api 目录）；本地 `project_root = ../../..`（= 项目根）。

#### `log_stream_server.py` —— 实时日志流

- `websockets.serve` 监听 8766
- `watchdog` 监控 `api/logs/log-*.log`（主程序日志）+ `api/logs/asr_instances/asr_instance_*.log`（ASR 实例日志）
- 新行推送 `{timestamp, log_name, content, level}` JSON 给所有订阅者
- 前端用 `components/log_stream_viewer.py` 订阅显示（自动重连）

#### `speaker_manager.py` —— 说话人 CRUD

api/metahuman-admin/modules/speaker_manager.py：
- `get_speakers()` 扫描 `speaker_data/*.wav`，按 `_N` 后缀归并同一人
- `get_speaker_info()` 质量评级：≥5 段=优秀，≥3 良好，≥2 一般，<2 不足
- `export_speaker_recordings()` 打成 ZIP
- `get_statistics()` 返回 `{speakers_count, recordings_count, total_size_mb, embeddings_exists, embeddings_count, last_training_time}`

#### `statistics.py` —— KPI 计算

首页用到的字段来源：

| KPI | 来源 |
| --- | --- |
| `overall_score` | `performance_score + quality_score + stability_score` 加权（默认权重相等）|
| `performance_score` | ASR RTF + LLM first-response-time |
| `quality_score` | 声纹识别准确率（基于 `speaker_embeddings.json` 时间跨度） |
| `stability_score` | `total_errors / total_warnings` 计数（来自 `logs/` 文本匹配） |
| `top_keywords` | `chat_detail.jsonl` 里 jieba 分词计数 |
| `hot_questions` | `chat_detail.jsonl` 中 `topic='chat'` 的 question 聚合 |
| `total_conversations / unique_users / avg_response_time` | 同上聚合 |

#### `config_editor.py` —— 三类文件在线编辑

| 文件 | 编辑器 | 特性 |
| --- | --- | --- |
| `config.ini` | `ConfigIniEditor` | 按 section 分组，section 折叠/展开；保存前做 schema 校验 | 
| `hotword.txt` | `HotwordEditor` | 支持 merge / replace 模式（直接调 `ASR_server.py` 的 `hotword_update` action） |
| `qna.csv` | `QnAEditor` | 表格 CRUD，多问题用 `;` 分隔 |

### `config.yaml` 配置项（管理平台自身）

| 段 | 关键项 | 说明 |
| --- | --- | --- |
| `app` | `port: 10010` | streamlit 监听端口 |
| `services.fixed_ports` | 6 个固定端口 | 9001 / 5000 / 10001 / 10002 / 10003 / 10010 |
| `services.dynamic_ports.asr` | `multi_instance_enabled` + `instance_count` + `start_port` | 从 `config.ini` 读取，运行时推断 |
| `paths` | 全部相对路径 | 支持 Docker / Windows / Linux 三种环境 |
| `integration` | `spk_model_script` / `main_start_script` / `asr_start_script` / `asr_stop_script` | 调用的脚本路径 |
| `statistics` | `cache_expiry: 60` | 业务统计缓存秒数 |

### 与 api/ 主进程的边界

管理平台**只通过下列方式操作 api 主进程**：
1. `subprocess` 启动 `start.sh` / `start_asr_multi.sh` / `stop_asr.sh` —— 间接操作
2. `psutil` 查进程 + 杀进程 —— 不改业务代码
3. **HTTP API 调用 `api/web/flask_server.py`** —— 不直接调，但首页的 KPI 指标是从日志文件聚合的（不调主进程 HTTP API）

**管理平台完全独立运行**，不依赖 `api/main.py` 启动；停掉主进程只影响"实时对话统计"，其它功能照常。

### 已知问题 / 注意事项

| 位置 | 现象 |
| --- | --- |
| api/metahuman-admin/app.py#L31-L34 | `st.session_state.websocket_checked = True` 后才调 `ensure_websocket_running(auto_start=True)` —— Streamlit 每次会话都会执行，但只起一次 |
| api/metahuman-admin/modules/service_controller.py#L379 | `_is_main_process` 排除列表写死；若主程序用 `gunicorn` / `uvicorn` 启动则匹配不到 |
| api/metahuman-admin/modules/service_controller.py#L246-L247 | 启动后 `time.sleep(wait_time=3)` —— 长跑脚本 3 秒内若无 stdout 不算失败，可能误判成功 |
| api/metahuman-admin/modules/log_stream_server.py | watchdog 只监控 `log-*.log` 通配符，但**不会重新发现**新出现的 ASR 实例日志 —— 重启 ASR 后需手动重启 WS 流服务器 |
| api/metahuman-admin/modules/statistics.py | KPI 评分公式简单（线性加权），没有权重可配置 |
| api/metahuman-admin/pages/4_%F0%9F%93%8A_Data_Statistics.py | README 写"待开发"，但首页已实现大部分图表，pages/4 内容基本是首页的复制 |
| api/metahuman-admin/pages/5_%F0%9F%93%A6_Data_Management.py#L27-L37 | 用 `isolated_api_import` 上下文管理器隔离 api/utils 与 metahuman-admin/utils 的命名空间 —— 复杂且脆弱，命名空间冲突未完全解决 |

## Node.js 业务后台

`web/` 目录（Egg.js 风格）：

- 数据源管理：MySQL / Oracle / 达梦数据库连接配置。
- 数字人 / 大屏模板绑定。
- 加密（SM4 / AES）与 SQL 注入防护。
- 通过 PM2 部署（`web/pm2.config.js`）。

## 用户上下文

`userInfo` 在三处出现，含义一致但来源不同：

| 位置 | 来源 | 用途 |
| --- | --- | --- |
| `sdk/common.userInfo` | SDK 调用方传入 | 标识当前用户身份、用户名 |
| `digitalHumanService.username` | 上行 `topic: location` 时附带 | 后端按用户隔离状态 |
| `electron/electronAPI` | Electron `preload.js` 注入 | 桌面端本地用户信息 |

## 配置变更的热加载

| 模块 | 改动后生效方式 |
| --- | --- |
| `config.ini` | 需要重启 `main.py`（通过管理平台"重启"按钮） |
| `environment.json` | Web 端刷新页面 |
| `digitalHumanList.json` / `commandTemplateList.json` | Web 端刷新页面 |
| UE5 客户端配置 | 重启 Electron |
| 向量库 | 立即生效（Chroma 文件持久化） |