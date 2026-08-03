# 镜像与编排子项目（docker/）

> **本目录实际只有一个空 README**：仓库根目录下 docker/README.md 文件存在但内容为空。
> 因此本附录不是描述 `docker/` 目录，而是描述**整个仓库内散落的 Docker 镜像构建与编排文件**——它们共同构成该项目的"容器化部署层"。
> 与 P5 的关系：P5 [dispatcher.md](./dispatcher.md) 已经记录了 `metahuman-dispatcher/Dockerfile`；本文不再重复，**仅汇总 api/ 与 metahuman-dispatcher 之间的镜像设计差异**。

---

## 1. 镜像总览

| 镜像名 | Dockerfile | 基础镜像 | 用途 | 是否已发布 |
| --- | --- | --- | --- | --- |
| `fedx-metahuman-api-base:latest` | api/Dockerfile.base | python:3.10-slim-bookworm | API 公共底座（系统依赖+Python 依赖+模型） | 否（本地构建） |
| `fedx-metahuman-api-base:latest`（国内版） | api/Dockerfile.base.china | python:3.10-slim-bookworm + Aliyun 源 | 国内加速版 base | 否 |
| `fedx-meta-human-sdk-api:latest` | api/Dockerfile | fedx-metahuman-api-base | 完整 API 应用镜像 | 否 |
| `fedx-meta-human-sdk-api:latest`（国内版） | api/Dockerfile.china | python:3.10-slim-bookworm + Aliyun 源 | 单层全包（含 base+app），避免本地先建 base | 否 |
| `fedx-meta-human-sdk-api:latest`（无 FunASR 版） | api/Dockerfile.withoutFunASR | python:3.10-slim-bookworm | 轻量 API（不含 FunASR/ASR 服务） | 否 |
| `fedx-meta-human-sdk-api:latest`（增量版） | api/Dockerfile.incremental | fedx-meta-human-sdk-api:latest | 仅覆盖源代码，几秒级重建 | 否 |
| `fedx/funasr:latest` | api/asr/Dockerfile | python:3.10-slim-bookworm | **独立** ASR 服务（FunASR 模型+WS） | 否 |
| `fedx-metahuman-sdk-streamlit:latest`（示例） | api/metahuman-admin/Dockerfile.example | python:3.10-slim | Streamlit 管理平台（仅示例） | 否 |
| `metahuman-dispatcher:latest` | metahuman-dispatcher/Dockerfile | python:3.11-slim + uv | WS 调度分发（详见 [dispatcher.md](./dispatcher.md)） | 否 |

**总览图**：

```
                        ┌───────────────────────────────────────┐
                        │   python:3.10-slim-bookworm           │
                        │   + netcat/procps/ffmpeg/portaudio    │
                        │   + gcc/g++/make                      │
                        └─────────┬─────────────────────────────┘
                                  │
                  ┌───────────────┴───────────────┐
                  │   fedx-metahuman-api-base     │  ←── Dockerfile.base 或 Dockerfile.base.china
                  │   + requirements.txt          │
                  │   + asr/funasr-server reqs    │
                  │   + metahuman-admin reqs      │
                  │   + ASR models                │
                  │   + BGE embedding models      │
                  └─────────┬─────────────────────┘
                            │
                            ▼
                  ┌───────────────────────────────────┐
                  │   fedx-meta-human-sdk-api        │  ←── Dockerfile（生产）
                  │   + 全部源代码 + 配置             │
                  │   + start.sh 启动脚本             │
                  │   EXPOSE 5000/9001/10001~10003   │
                  │            /10010/10197~10199    │
                  │            /5001/8766             │
                  └─────────┬─────────────────────────┘
                            │ (快速重建)
                            ▼
                  ┌───────────────────────────────────┐
                  │   fedx-meta-human-sdk-api (同标签)│  ←── Dockerfile.incremental
                  │   (仅复制 core/llm/utils/...源码) │
                  │   EXPOSE 同上                    │
                  └───────────────────────────────────┘
```

```
   ┌──────────────────────────────────────┐
   │   fedx/funasr:latest                 │  ←── api/asr/Dockerfile（独立 ASR）
   │   + FunASR + silero + cam++          │
   │   + 说话人数据（可选 build-time）     │
   │   HEALTHCHECK 30s 探活               │
   └──────────────────────────────────────┘
```

---

## 2. 公共底座镜像：Base

### 2.1 标准版 api/Dockerfile.base

**基础镜像**：`python:3.10-slim-bookworm`（api/Dockerfile.base#L7）

**系统依赖**（api/Dockerfile.base#L18-L28）：

| 包名 | 用途 |
| --- | --- |
| `netcat-openbsd` | 启动脚本轮询 ASR 端口连通性 |
| `procps` | `pkill`/`ps` 进程管理 |
| `ffmpeg` | 音频转码 |
| `portaudio19-dev` | `pyaudio` 编译依赖 |
| `gcc/g++/make` | Python C 扩展编译 |

**Python 依赖**（三层独立 `RUN pip install`，最大化层缓存）：
1. api/Dockerfile.base#L45-L46：主依赖 `requirements.txt`
2. api/Dockerfile.base#L49-L51：`asr/funasr-server/requirements.txt`
3. api/Dockerfile.base#L54-L56：`metahuman-admin/requirements.txt`

**模型下载**：
- ASR 模型：`cd /app/asr/funasr-server && python download_models.py`（api/Dockerfile.base#L67），自动检测 `models/` 是否存在；不存在则从 ModelScope 拉取
- 向量嵌入模型（BGE-small-zh）：`python tools/download_model.py --auto`（api/Dockerfile.base#L73）
- 清理：`rm -rf /root/.cache/modelscope/ast_indexer`（api/Dockerfile.base#L76）避免 ModelScope AST 索引报错

**预设目录**（api/Dockerfile.base#L81-L85）：
```
/app/logs/asr_instances   （运行时由 start.sh 备份）
/app/data/vector_db       （Chromadb 持久化目录）
/app/config               （配置 + 热加载目录）
/app/cache_data           （recorder.py 临时 WAV 池）
```

**默认 CMD**：`python --version`（仅用于测试 base 镜像）

### 2.2 国内版 api/Dockerfile.base.china

与标准版差异：
- 强制覆盖 Debian 源为 `mirrors.aliyun.com`（api/Dockerfile.base.china#L11-L13）
- pip 源：`pypi.tuna.tsinghua.edu.cn`（api/Dockerfile.base.china#L35-L36）
- 其余结构一致

构建脚本 api/build-base.sh 提供 1/2 选项（Standard/China Mirror）：

```bash
# 1: 标准
docker build -f Dockerfile.base -t fedx-metahuman-api-base:latest .
# 2: 国内
docker build -f Dockerfile.base.china -t fedx-metahuman-api-base:latest .
```

---

## 3. API 应用镜像

### 3.1 标准版 api/Dockerfile

```dockerfile
ARG BASE_IMAGE=fedx-metahuman-api-base:latest
FROM ${BASE_IMAGE}
WORKDIR /app
COPY ./ /app
VOLUME /app/config
VOLUME /app/asr/funasr-server/models
VOLUME /app/logs
VOLUME /app/data
RUN chmod -R 777 /app/logs && chmod +x /app/start.sh 2>/dev/null || true
EXPOSE 5000 9001 10001 10002 10003 10197 10198 10199 5001 10010 8766
CMD ["/bin/bash", "/app/start.sh"]
```

**镜像分层逻辑**（与 base 完全解耦）：
- base 层永远不变（除非模型/依赖变更）
- 应用层每次代码变更才会重建 → 构建时间从几十分钟降到几秒

**4 个 VOLUME**：
- `/app/config`：运行时配置 + 热加载
- `/app/asr/funasr-server/models`：ASR 模型（覆盖 base 内置）
- `/app/logs`：ASR 实例日志
- `/app/data`：运行时数据

**11 个 EXPOSE 端口**（详见第 6 节端口矩阵）

**启动**：直接 `CMD /app/start.sh`，由 `start.sh` 内串联启动 ASR + ASR manager + Streamlit + log_stream + main.py。

### 3.2 国内单层版 api/Dockerfile.china

**特点**：base 与 app **不分层**——所有安装步骤在一个 Dockerfile 内（api/Dockerfile.china#L1-L108）。

适用场景：
- **国内 CI 环境**：避免先 build base 再 build app 的两次网络拉取
- **单机快速部署**：只想要"一个 docker build 命令出最终镜像"

**关键差异**：
- 直接 `FROM python:3.10-slim-bookworm`（api/Dockerfile.china#L2），不依赖 `fedx-metahuman-api-base`
- 添加 `bookworm-backports` 源（api/Dockerfile.china#L8）
- 添加 sources.list.backup（api/Dockerfile.china#L11）
- 注释掉 `--upgrade pip` 避免国内源 403（api/Dockerfile.china#L40）
- pip 安装时显式 `--trusted-host pypi.tuna.tsinghua.edu.cn`（api/Dockerfile.china#L41）

### 3.3 增量版 api/Dockerfile.incremental

**特点**：基于 `fedx-meta-human-sdk-api:latest`（已经构建完成的应用镜像），**只覆盖源代码**，跳过 pip install 和模型下载。

```dockerfile
FROM fedx-meta-human-sdk-api:latest
WORKDIR /app
ENV PYTHONPATH=/app
COPY core/ /app/core/
COPY llm/ /app/llm/
COPY utils/ /app/utils/
COPY web/ /app/web/
COPY scheduler/ /app/scheduler/
COPY ai_cemotion/ /app/ai_cemotion/
COPY asr/ /app/asr/
COPY tts/ /app/tts/
COPY config/ /app/config/
COPY main.py /app/main.py
COPY meta_human_launcher.py /app/meta_human_launcher.py
COPY global_vars.py /app/global_vars.py
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh
CMD ["/bin/bash", "/app/start.sh"]
```

**限制**：api/Dockerfile.incremental#L9 注释写明"首次构建需用 Dockerfile 或 Dockerfile.china"。

构建脚本 api/build-incremental.sh 提供 3 种模式：
1. `update`（默认）：原地更新 + 自动 `docker image prune -f`
2. `new`：保留旧镜像 `fedx-meta-human-sdk-api-new:latest`
3. `custom`：自定义 name:tag

### 3.4 无 FunASR 版 api/Dockerfile.withoutFunASR

**用途**：轻量部署，仅 Python 主进程 + 管理平台，**不含 ASR/funasr-server/requirements**。

**差异**（api/Dockerfile.withoutFunASR#L1-L60）：
- 不安装 `asr/funasr-server/requirements.txt`
- 不下载 ASR 模型
- 不下载 BGE embedding 模型
- 仅下载向量模型（注释说"必需"）——但其实不需要 FunASR 也能用？实际是 `tools/download_model.py` 单独运行
- 端口声明少（`10197-10199` 不暴露）

**适用场景**：已有外部独立 ASR 服务，仅需 Python 主进程 + LLM + 向量数据库 + 管理平台。

---

## 4. 独立 ASR 镜像：api/asr/Dockerfile

详见 api/asr/README_DOCKER.md 完整文档。

### 4.1 镜像特性

- **基础镜像**：`python:3.10-slim-bookworm`（api/asr/Dockerfile#L7）
- **系统依赖**：`ffmpeg/libsndfile1/git/curl`（api/asr/Dockerfile#L11-L17）
- **工作目录**：`/opt/funasr`（不是 `/app`）
- **构建上下文路径**：`asr/funasr-server/`（api/asr/Dockerfile#L28），与 docker-compose.yml `context: ../` 一致
- **默认端口**：10197
- **健康检查**：30s 间隔 + 10s 超时 + 3 次重试 + 60s 启动期（api/asr/Dockerfile#L77-L78）

### 4.2 启动参数（entrypoint.sh 解析）

api/asr/entrypoint.sh 解析 5 个环境变量为命令行参数：

| 环境变量 | 默认 | 启动参数 |
| --- | --- | --- |
| `ASR_HOST` | `0.0.0.0` | `--host` |
| `ASR_PORT` | `10197` | `--port` |
| `ASR_DEVICE` | `auto` | `--device`（`auto/cpu/cuda/cuda:N`） |
| `ASR_WORKERS` | `4` | `--workers` |
| `ASR_ENABLE_SPK` | `false` | `--enable-spk`（声纹识别开关） |
| `ASR_SPK_DEBUG` | `false` | `--spk-debug` |
| `ASR_SPK_THRESHOLD` | `0.35` | `--spk-threshold` |
| `ASR_SPK_DYNAMIC` | `true` | `false` 时加 `--spk-no-dynamic` |

最终：`exec python -u ASR_server.py --host ... --port ... --device ... --workers ... [--enable-spk ...]`

### 4.3 声纹数据可选 build-time 嵌入

api/asr/Dockerfile#L43-L44：

```dockerfile
COPY asr/funasr-server/spk/speaker_embeddings.json /opt/funasr/spk/
COPY asr/funasr-server/spk/speaker_data/ /opt/funasr/spk/speaker_data/
```

**问题**：如果 `speaker_embeddings.json` 或 `speaker_data/` 不存在，构建会直接失败。建议运行时挂载（见 4.4）。

### 4.4 Volume 设计

api/asr/Dockerfile#L56：

```dockerfile
VOLUME ["/opt/funasr/models", "/opt/funasr/spk", "/opt/funasr/data"]
```

- `models/`：ASR 模型（覆盖 build-time 下载）
- `spk/`：说话人数据（训练音频+embeddings）
- `data/`：热词文件（`hotword.txt`）

---

## 5. 编排：唯一一份 docker-compose

api/asr/docker-compose.yml 是仓库内**唯一的编排文件**。

### 5.1 单实例模式

```yaml
version: '3.8'
services:
  asr:
    build:
      context: ../                # api/ 目录
      dockerfile: asr/Dockerfile
    image: fedx/funasr:latest
    container_name: asr-service
    restart: unless-stopped
    environment:
      ASR_HOST: "0.0.0.0"
      ASR_PORT: "10197"
      ASR_DEVICE: "auto"
      ASR_WORKERS: "4"
      ASR_ENABLE_SPK: "false"
      ASR_SPK_DEBUG: "false"
      ASR_SPK_THRESHOLD: "0.35"
      ASR_SPK_DYNAMIC: "true"
    ports:
      - "10197:10197"
    volumes:
      - ./funasr-server/data:/opt/funasr/data
      - ./logs:/opt/funasr/logs
    healthcheck:
      test: ["CMD", "python", "-c", "import socket; ..."]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    deploy:
      resources:
        limits: { memory: 8G }
        reservations: { memory: 4G }
```

### 5.2 多实例模式（注释示例）

```yaml
  asr-instance:
    build: ...
    ports: ["10197-10199:10197"]   # 端口范围映射
    deploy:
      replicas: 1                    # 默认 1，可通过 docker-compose up --scale 扩展
```

启动命令（来自 api/asr/docker-compose.yml#L64-L65）：
```bash
docker-compose up --scale asr-instance=3
```

### 5.3 网络

```yaml
networks:
  default:
    name: asr-network
```

### 5.4 编排覆盖范围

**重要事实**：这份 docker-compose 仅编排 ASR。**主 API、MetaHuman Admin、Streamlit、dispatcher、web Node、audio-microphone 均未被编排**——它们需要单独启动，或由外部 k8s / docker swarm / 手动 docker run 启动。

---

## 6. 端口矩阵

| 端口 | 服务 / 进程 | 来源 | 暴露镜像 |
| --- | --- | --- | --- |
| 5000 | Flask 主 API (`meta_human_launcher.py`) | api/ | api/Dockerfile, Dockerfile.china, Dockerfile.withoutFunASR, Dockerfile.incremental |
| 9001 | socket_bridge WebSocket (UE5 数字人客户端) | api/core/wsa_server.py | 同上 |
| 10001 | 拾音端 socket 服务（api/microphone 客户端接入） | api/main.py:54 | 同上 |
| 10002 | 拾音端 WS 服务（audio-microphone 接入） | api/core/recorder.py | 同上 |
| 10003 | 配置保留 | — | 同上 |
| 10197 | ASR 服务实例 1 | api/asr/funasr-server/ASR_server.py | api/Dockerfile, Dockerfile.china, api/asr/Dockerfile |
| 10198 | ASR 服务实例 2 | 同上 | 同上 |
| 10199 | ASR 服务实例 3 | 同上 | 同上 |
| 5001 | ASR Manager | api/asr/asr_manager.py | api/Dockerfile, Dockerfile.china |
| 10010 | Streamlit MetaHuman Admin | api/metahuman-admin/app.py | api/Dockerfile, Dockerfile.china, Dockerfile.withoutFunASR, Dockerfile.incremental, metahuman-admin/Dockerfile.example |
| 8766 | WebSocket 日志流（浏览器端订阅） | api/metahuman-admin/start_log_stream.py | api/Dockerfile, Dockerfile.china, Dockerfile.withoutFunASR, Dockerfile.incremental |
| 3009 | web/ Node BFF SSR | web/bootstrap.js | web/pm2.config.js（不在 docker 编排） |
| 8000 | metahuman-dispatcher | metahuman-dispatcher/main.py | metahuman-dispatcher/Dockerfile（详见 [dispatcher.md](./dispatcher.md)） |

---

## 7. .dockerignore 与启动脚本

### 7.1 api/.dockerignore

**关键排除**（api/.dockerignore#L14-L21）：

- `venv/`、`*.venv`、`asr/funasr-server/venv-py311/`（500MB-1GB 的虚拟环境）
- `logs/`、`cache_data/`（运行时数据）
- `microphone/build/`、`microphone/dist/`（PyInstaller 产物）
- `Dockerfile*`、`.dockerignore`、`docker/`、`docker-compose*.yml`
- `tests/`、`samples/`、`*.example`、`*.sample`
- `*.bat`、`build*.sh`、`build*.bat`（构建脚本）
- `.git/`、`.vscode/`、`.idea/`、`.cursor/`、`.DS_Store`、`Thumbs.db`
- 模型文件（注释可启用）：`asr/funasr-server/models/`

### 7.2 api/start.sh 启动顺序

```
1. pkill 现有 ASR_server / main.py / asr_manager
2. 读取 config/config.ini 的 multi_instance_enabled
3. 若 true → ./start_asr_multi.sh
4. 若 false → 单实例 ASR (python3 -u asr/funasr-server/ASR_server.py --host 0.0.0.0 --port 10197 ...)
5. nc -z 127.0.0.1 10197 轮询 60s 等 ASR 就绪
6. 启动 asr_manager.py
7. 启动 start_log_stream.py (WebSocket 8766)
8. 启动 Streamlit (nohup streamlit run app.py --server.port 10010 ... > /app/logs/metahuman-admin.log 2>&1 &)
9. 启动 python3 main.py （前台运行，阻塞主进程）
```

**关键设计**：
- `start.sh` 是 entrypoint → `python3 main.py` 是前台进程（容器主进程），其余都 daemon 化
- ASR 实例日志备份到 `logs/asr_instances/backup_<timestamp>/`（api/start.sh#L42-L49）
- 串行启动通过 `sleep 2` 隔离

### 7.3 构建脚本

| 脚本 | 作用 |
| --- | --- |
| api/build-base.sh | 1/2 选项：标准/国内；交互式输入版本号；构建 `fedx-metahuman-api-base` |
| api/build.sh | 自动检测 base 是否存在（缺则提示先 build-base）；1/2 选项：默认/自定义 base；构建 `fedx-meta-human-sdk-api` |
| api/build-incremental.sh | 增量构建：1/2/3 选项（update/new/custom）；自动 prune dangling |
| api/asr/build.sh | ASR 镜像构建：`-t/-n/--no-cache` 参数 |
| api/asr/build.bat | Windows 版 ASR 镜像构建 |

---

## 8. 镜像分层与缓存策略

```
┌────────────────────────────────────────────────────────────┐
│ Layer 1: python:3.10-slim-bookworm (官方镜像, ~150MB)      │
├────────────────────────────────────────────────────────────┤
│ Layer 2: apt-get install (ffmpeg/portaudio/gcc 等, ~600MB) │
│ Layer 3: pip install requirements.txt (主依赖, ~500MB)     │
│ Layer 4: pip install asr/funasr-server reqs (~1.5GB 模型)   │
│ Layer 5: pip install metahuman-admin reqs (~50MB)          │
│ Layer 6: ASR 模型下载 (~1.5GB)                              │
│ Layer 7: BGE embedding 模型 (~100MB)                       │
│ Layer 8: mkdir + chmod                                      │
│  ≈ fedx-metahuman-api-base (约 4GB)                       │
├────────────────────────────────────────────────────────────┤
│ Layer 9: COPY ./ (代码, ~10MB)                              │
│ Layer 10: chmod logs                                        │
│  ≈ fedx-meta-human-sdk-api (约 4GB)                       │
└────────────────────────────────────────────────────────────┘
```

**变更频率**：
- Layer 1-8：依赖/模型变更时重建（罕见）
- Layer 9-10：代码变更时重建（频繁）

`Dockerfile.incremental` 利用此分层实现"快速增量"——只重建 Layer 9-10。

---

## 9. 部署工作流（推荐步骤）

### 9.1 首次部署

```bash
# 1. 构建 base 镜像（耗时 30+ 分钟）
cd api
chmod +x build-base.sh
./build-base.sh                   # 选择 1/2

# 2. 构建应用镜像
./build.sh                        # 选择 1（默认 base）

# 3. 构建 ASR 镜像（如使用内置 ASR）
cd asr
./build.sh

# 4. 启动主应用
cd ..
docker run -d --name fedx-api \
  -p 5000:5000 -p 9001:9001 \
  -p 10010:10010 -p 8766:8766 \
  -p 10197:10197 \
  -v $(pwd)/config:/app/config \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/data:/app/data \
  fedx-meta-human-sdk-api:latest
```

### 9.2 日常更新（推荐用增量）

```bash
cd api
./build-incremental.sh            # 选择 1（update，自动 prune）
docker restart fedx-api
```

### 9.3 国内环境快捷部署

```bash
# 一条命令搞定（不分层）
cd api
docker build -f Dockerfile.china -t fedx-meta-human-sdk-api:latest .
docker run -d --name fedx-api \
  -p 5000:5000 -p 9001:9001 -p 10197:10197 \
  fedx-meta-human-sdk-api:latest
```

### 9.4 启动 ASR 集群

```bash
cd api/asr
docker-compose up --scale asr-instance=3
```

---

## 10. 已知问题与观察（事实记录）

1. **`docker/README.md` 是空文件**：仓库根 `docker/` 目录只有空 README，**没有 docker-compose.yml、没有 .env 模板**。所有编排信息散落在各子项目目录。

2. **`docker-compose.yml` 不编排主 API**：仓库**唯一一份**编排文件只管 ASR；主 API、Streamlit、dispatcher、web Node 均**无统一编排**，部署时需要手工组合。

3. **`fedx-metahuman-api-base` 是隐式前置依赖**：构建 `fedx-meta-human-sdk-api` 镜像时**不会自动触发 base 构建**（api/Dockerfile#L9 `ARG BASE_IMAGE` 默认本地），build.sh 才会检测并提示——CI 上若 base 缺失会**静默失败**于 base 镜像 pull。

4. **`Dockerfile.incremental` COPY 目录白名单**：只覆盖 8 个目录（core/llm/utils/web/scheduler/ai_cemotion/asr/tts/config）+ 4 个顶层 .py + start.sh。**新增顶层文件**（如新建 `tts/` 子模块未在白名单）**不会被增量更新**——这是历史 bug，新模块需手工追加。

5. **ASR Dockerfile 的 build-time 嵌入声纹数据会失败**：api/asr/Dockerfile#L43-L44 注释中提到"如果文件不存在，构建会失败"——但仓库里 `speaker_embeddings.json` 仅是 spk_model.py 动态生成，**首次构建必然失败**。建议运行时挂载或先建空文件。

6. **`Dockerfile.china` 与 `Dockerfile.base.china` 的源列表行为不一致**：`Dockerfile.china` 同时覆盖 bookworm 4 个组件（含 backports），而 `Dockerfile.base.china` 只覆盖 3 个（无 backports）。如需 fastcache 包可能 base 版会失败。

7. **`start.sh` 的多实例分流仅在 config.ini 有 `multi_instance_enabled=true` 时启用**：api/start.sh#L28，但 `start_asr_multi.sh` **未在仓库内**——需要在外部补充。Dockerfile.china 默认仍是单实例。

8. **Streamlit 是 nohup + & 而非容器主进程**：api/start.sh#L92 `nohup streamlit run ... &` 把 Streamlit 后台化，**容器主进程是 `python3 main.py`**，Streamlit 异常退出不会触发容器重启。

9. **没有 k8s/Helm chart**：仅有 docker-compose 单实例 ASR 编排；**无 deployment.yaml、Service、Ingress、ConfigMap**。生产 k8s 部署需自行编写。

10. **`Dockerfile` 内没有 `HEALTHCHECK`**：api/Dockerfile 仅 `EXPOSE` 端口，没有 `HEALTHCHECK`——docker-compose / k8s 探活需自配。

11. **`Dockerfile.withoutFunASR` 注释与代码不一致**：注释说"向量化功能必需"故保留 BGE 模型下载，但实际上**主程序 + LLM 服务可以不带向量化运行**（向量库为可选模块）。轻量化效果有限。

12. **镜像版本管理仅靠 build.sh 交互式输入**：没有 `VERSION` 文件、没有 git tag 注入，CI/CD 链路不完整。日常靠 build-incremental.sh 维持 `:latest`。

13. **`metahuman-dispatcher` 与 `api/` 镜像分属不同 Python 版本**（dispatcher 用 3.11，api 系列用 3.10）——如未来需要合并部署，需注意 `pyaudio`/`funasr` 在 3.11 上的兼容性（funasr-server 要求 Python ≥ 3.8 但 ≤ 3.12）。

14. **BASE_IMAGE 用 ARG 而非 FROM**：理论上可 `--build-arg BASE_IMAGE=other` 替换，但 build.sh 检测的固定名为 `fedx-metahuman-api-base:latest`——CI 替换 base 名会失败。

15. **没有任何 Jenkinsfile 在仓库内**（Glob 搜索结果为空）——P5 dispatcher 的 Jenkinsfile 是子项目内的（Glob 默认排除 `metahuman-dispatcher`？实际再查）。这意味着仓库**无内置 CI**——构建完全靠本地 docker build。

---

## 11. 与其他子项目的关系

| 子项目 | 关系 |
| --- | --- |
| [api-backend-core.md](./api-backend-core.md)（P1） | api/Dockerfile 直接打包整个 api/ 目录；start.sh 启动 main.py + recorder.py + streamlit |
| [api-asr.md](./api-asr.md)（P2） | api/asr/Dockerfile 独立打包 funasr-server；与主 API 镜像可通过网络互通 |
| [api-llm-vector.md](./api-llm-vector.md)（P3） | 在 api/Dockerfile.base 中下载 BGE embedding 模型；与 api 同进程 |
| `api/metahuman-admin/`（P4） | api/Dockerfile.base 单独安装 `metahuman-admin/requirements.txt`；start.sh 内 Streamlit 启动 |
| [dispatcher.md](./dispatcher.md)（P5） | 独立 Python 3.11 镜像，独立 pyproject；与 api/ 镜像**无任何共享层** |
| [web-node-backend.md](./web-node-backend.md)（P6） | **未提供 Dockerfile**；靠 pm2.config.js 部署；**未被 docker 编排** |
| [audio-microphone + api/microphone](./api-backend-core.md)（P7） | **未提供 Dockerfile**；本地开发 / PyInstaller 打包 |
| P8（本文件） | — |

---

## 12. 一句话总结

本仓库的 Docker 部署层由 **9 个 Dockerfile + 1 个 docker-compose.yml + 5 个构建脚本**组成，核心模式是 `fedx-metahuman-api-base`（系统+依赖+模型底座） → `fedx-meta-human-sdk-api`（应用层） → `fedx-meta-human-sdk-api`（增量覆盖）三层渐进构建，配合独立的 `fedx/funasr` ASR 镜像和 docker-compose 单实例编排。**仓库根 `docker/` 目录是空的**——所有镜像定义散落在各子项目目录；主 API、Streamlit、dispatcher、web Node、audio-microphone **未被统一编排**，需要分别启动。