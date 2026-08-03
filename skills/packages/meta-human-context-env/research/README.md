# 3D 数字人管理 — 参考资料索引

本目录用于系统化分析 `fedx-metahuman-sdk` 项目是如何完成 **3D 数字人** 的"建模→渲染→驱动→管控→通信"全链路管理的。建议按编号顺序阅读：

| # | 文档 | 主题 |
| - | - | - |
| 00 | `00-architecture-overview.md` | 顶层架构总览：从 SDK → 客户端 → 服务端 → 大屏操控 |
| 01 | `01-plugin-system.md` | 数字人客户端插件体系（Default/Xmov/Anhui/Web/Virtual3D） |
| 02 | `02-3d-rendering-pipeline.md` | 3D 渲染管线（WebGL/UE5 PixelStreaming/2D GIF 三种模式） |
| 03 | `03-model-and-animation.md` | 模型加载与骨骼动画（GLTF/AnimationClip），含口型（lip-sync）现状 |
| 04 | `04-state-machine.md` | 状态机与动画映射（idle/speak/listen/think/sleep…） |
| 05 | `05-ws-protocol.md` | WebSocket 协议（服务端 ↔ 客户端 ↔ 大屏） |
| 06 | `06-config-and-management.md` | 配置与运营管理（数字人列表/指令模板/管理后台；含 Streamlit 平台） |
| 07 | `07-audio-and-tts.md` | 音频采集、TTS 流式输出、字幕、Node 端播放；附录 audio-microphone + api/microphone 双端拾音链路 |

## 配套子项目深入文档（同级 `subprojects/`）

如需按子项目维度（而非主题维度）了解代码事实与已知问题，查阅同级 `subprojects/`：

| 文档 | 子项目 |
| --- | --- |
| `../subprojects/api-backend-core.md` | `api/` 后台核心 |
| `../subprojects/api-asr.md` | `api/asr/` 语音识别 |
| `../subprojects/api-llm-vector.md` | `api/llm/` + 向量库 |
| `../subprojects/dispatcher.md` | `metahuman-dispatcher/` WS 调度分发 |
| `../subprojects/web-node-backend.md` | `web/` Node 后台 |
| `../subprojects/deployment.md` | 镜像与编排 |

## 口型（lip-sync / viseme）能力拓展专题（同级 `lip-sync-extension/`）

2026-08-03 讨论形成。目标：把"整段 speak1 骨骼动画"升级为"逐帧视位对齐的嘴部驱动"，覆盖 WebGL / UE5 / 2D 三端，viseme 时戳由 TTS 原生返回。

| 文档 | 主题 |
| --- | --- |
| `../lip-sync-extension/README.md` | 目录导航 + 核心路线一句话 |
| `../lip-sync-extension/01-overview.md` | 现状盘点 + 四步实施路线 + 分层架构图 |
| `../lip-sync-extension/02-data-flow-and-protocol.md` | 端到端数据流 + `send-audio-text` 协议扩展 + SDK 透传位置 |
| `../lip-sync-extension/03-three-renderer-plan.md` | WebGL / UE5 / 2D 三路渲染端改造细节 + 代码索引 |
| `../lip-sync-extension/04-readiness-checklist.md` | 硬件 / 软件 / 人员 / Quick Start 核对清单 |
| `../lip-sync-extension/05-concepts.md` | 概念速查 (viseme / phoneme / blendshape / ARKit 52 / Rhubarb / lerp) |

`research/` 是**代码事实盘点**，`subprojects/` 是**按进程的代码级梳理**，`lip-sync-extension/` 是**针对"口型能力拓展"的方案设计与落地跟踪**。

## 一句话总结

项目通过 **"插件模式 + 多渲染后端 + 统一消息协议 + 状态机驱动"** 四件套，把"3D 数字人"做成了一个 **可替换、可嵌入、可观测** 的标准化能力组件；`subprojects/` 提供每个子项目的事实型代码梳理，与 `research/` 的主题型文档形成互补；`lip-sync-extension/` 则承接"视位/嘴型同步"这个尚未实现的能力点，给出端到端的实施文档。