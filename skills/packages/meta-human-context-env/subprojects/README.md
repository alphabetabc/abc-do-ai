# 子项目深入文档索引

本目录按"子项目"维度梳理 `fedx-metahuman-sdk` 的每个**独立进程 / 服务**的代码事实、模块拆分、关键接口、已知问题。每个文档均基于代码逐行扫描，带行号引用。

## 阅读顺序（建议）

```
api-backend-core  →  api-asr  →  api-llm-vector
        ↘                ↓                ↙
                  dispatcher
                    ↑      ↓
              web-node-backend
                    ↑      ↓
                 deployment
```

`api-backend-core.md` 是入口；`api-asr.md` 和 `api-llm-vector.md` 深入其子系统；`dispatcher.md` 是与 api/ 完全解耦的独立 WS 服务；`web-node-backend.md` 描述另一条 Node 后台；`deployment.md` 收口于镜像与编排。

## 子项目文档清单

| 文档 | 子项目 | 关键职责 |
| --- | --- | --- |
| [`api-backend-core.md`](./api-backend-core.md) | `api/` | 数字人对话核心（meta_human）+ Flask API + WebSocket + recorder + 向量基础 + socket_bridge |
| [`api-asr.md`](./api-asr.md) | `api/asr/` | FunASR 客户端 + 多实例负载均衡 + 声纹识别 |
| [`api-llm-vector.md`](./api-llm-vector.md) | `api/llm/` + 向量库 | 8 种 LLM 适配器（dify/hfd/csb_ah/csb_stream/dxh/siliconflow/internal/old）+ Chroma + BGE-small-zh |
| [`dispatcher.md`](./dispatcher.md) | `metahuman-dispatcher/` | FastAPI 单文件 352 行的 WS 中转，控制端↔大屏端指令路由 |
| [`web-node-backend.md`](./web-node-backend.md) | `web/` | Midway Koa BFF + React SSR + 多数据源 Driver + SM4 加密 + gRPC/HTTP TTS 网关 |
| [`deployment.md`](./deployment.md) | 仓库级 | 9 个 Dockerfile + 唯一一份 docker-compose + 镜像分层缓存策略 |

## 与 `research/` 的关系

| | `research/` | `subprojects/` |
| --- | --- | --- |
| 切分维度 | 主题（架构/插件/渲染/动画/状态机/协议/配置/音频） | 子项目（每个独立进程一文） |
| 索引结构 | 编号 00-07 | 描述性子项目名 |
| 适合 | 跨模块的概念性问题（"动画怎么驱动"） | 跨模块的实现性问题（"api/main.py 在哪、端口多少"） |
| 内容 | 概念解释 + 关键代码引用 | 代码事实清单 + 接口表 + 已知问题清单 |

二者**互为正交索引**——遇到"X 是什么"查 `research/`；遇到"X 在哪、怎么实现、有哪些坑"查 `subprojects/`。

## 一句话总结

本目录是 fedx-metahuman-sdk 的 **6 个独立子项目** 的事实型代码地图：api/ 后台三件套（核心+ASR+LLM）+ 一个完全解耦的 WS 调度中台（dispatcher）+ 一个企业级 Node BFF（web/）+ 仓库级部署拓扑（deployment）。每个文档都标了**真实行号**与**已知问题**，可直接作为排查入口。