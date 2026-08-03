---
name: "meta-human-context-env"
description: "Provides project context for fedx-metahuman-sdk (数字人 SDK). Invoke when the user asks about the project's architecture, modules, ports, capabilities, directory responsibilities, or when starting work on this codebase and a high-level orientation is needed."
---

# MetaHuman SDK Project Context

## Project Name

**fedx-metahuman-sdk** —— 数字人 SDK（MetaHuman SDK）

## One-line Description

A full-stack SDK for "digital human" scenarios targeting big-screen / exhibition halls. Integrates ASR, LLM, TTS, 3D/UE5 rendering, and visualization big-screen control. Can be embedded via web pages or desktop clients.

## Use Cases

- 展厅大屏：数字人讲解员，与大屏可视化联动
- 营业厅/客服大厅：业务问答、引导办理
- 嵌入式数字人：网页中通过 SDK 嵌入一个可语音对话的数字人助手
- 控制中心：语音/指令驱动的大屏切换、热点定位、页面操控

## Top-level Architecture

```
                ┌───────────────────────────────────────────────┐
                │                接入与展示层                      │
                │  sdk  / metahuman  / metahuman-client(-2d/-ue5) │
                │         （前端 / Electron / UE5）                │
                └───────────────┬───────────────────────────────┘
                                │ WebSocket / HTTP
                ┌───────────────▼───────────────────────────────┐
                │              后端服务层（api/）                  │
                │  meta_human 核心 + ASR + LLM + TTS + 向量库    │
                │  Flask API（5000）+ WebSocket（wsa_server）     │
                └───────────────┬───────────────────────────────┘
                                │
                ┌───────────────▼───────────────────────────────┐
                │         调度分发层（metahuman-dispatcher）       │
                │      FastAPI WebSocket 中转 / 多大屏路由          │
                └───────────────────────────────────────────────┘
```

## Directory Structure & Responsibilities

| 目录 | 技术栈 | 职责 |
| --- | --- | --- |
| `api/` | Python 3.10+ | **数字人后端核心**。包含 meta_human 核心类、ASR（FunASR）、LLM（Dify/SiliconFlow/通用）、向量库（Chroma）、WebSocket 服务、Flask API、麦克风采集客户端、Streamlit 管理平台、向量库导入工具、Docker 镜像构建。 |
| `api/core/meta_human/` | Python | 数字人核心：用户管理、消息处理、异步处理、流式处理、WebSocket 入口。 |
| `api/asr/` | Python + FunASR | 语音识别服务，支持单实例与多实例 + ASR Manager 负载均衡。 |
| `api/llm/` | Python | LLM 适配层，支持 Dify、SiliconFlow、CSB、内部等多种来源。 |
| `api/metahuman-admin/` | Streamlit | 管理平台：系统监控、声纹训练、配置管理、服务启停、实时日志、数据统计。 |
| `sdk/` | React + CRACO | **嵌入式 SDK 包**，可被任意 Web 页面引入。包含聊天框、麦克风、字幕、状态、音频播放、拖拽按钮、控制 SDK 等组件，支持多种插件（Default / Web / Xmov / Virtual3D / Anhui）。 |
| `metahuman/` | Vite + React | 浏览器内 3D 数字人渲染 Demo（基于 .glb 模型）。 |
| `metahuman-client/` | Electron + Vite/React | 桌面端数字人客户端（3D 渲染 + 音频播放）。 |
| `metahuman-client-2d/` | Electron + Vite/React | 2D 风格的数字人桌面客户端。 |
| `metahuman-client-ue5/` | Electron + Vite/React + UE5 | **UE5 像素流送版数字人客户端**，支持 Pixel Streaming Wrapper、绿幕画布、聊天、字幕、SDK 复用。 |
| `metahuman-dispatcher/` | Python + FastAPI | 独立的 WebSocket 调度分发中台，路由控制端与多个大屏终端的指令/反馈。 |
| `audio-microphone/` | Vite + React | 浏览器侧麦克风组件（VAD）。 |
| `web/` | Node.js（Egg/Express 风格） | 后端管理/配置 Web，支持多种数据源（MySQL/Oracle/达梦）、SM4/AES 加密、SQL 注入防护等企业级能力。 |
| `docker/` | Docker | 容器化部署脚本与编排。 |

## Core Capabilities

1. **语音对话闭环**
   - ASR（FunASR，多实例负载均衡，含声纹识别支持）
   - LLM（多家可插拔）+ 向量知识库问答（Chroma + BGE 嵌入）
   - TTS 流式输出 + 字幕
2. **数字人渲染**
   - 浏览器内 WebGL/Three.js 渲染（3D）
   - Electron 客户端渲染
   - UE5 像素流送（高质量 3D）
3. **大屏协同**
   - 数字人 SDK 与大屏 Web 之间通过统一消息协议协作
   - 控制指令：选中 / 切换 / 覆盖 / 定位 / 打开 / 关闭 等 `SELECTED_OPERATE` 等操作
   - 独立 dispatcher 做多终端路由与状态反馈
4. **运营管理**
   - Streamlit 管理平台：系统监控、声纹训练、配置管理、实时日志
   - Node 管理后台：数据源管理、模板管理

## Key Ports

| 端口 | 服务 |
| --- | --- |
| 5000 | 主程序 Flask API |
| 10010 | Streamlit 管理平台 |
| 8766 | WebSocket 实时日志流 |
| 10197~10199 | ASR 多实例（默认 3 个） |
| 5200 | metahuman-client-ue5 与 Electron 的本地 WS |
| 8000 | metahuman-dispatcher（FastAPI） |

## Main Documentation Entry Points

- `api/README.md` —— 后端启动、Docker 部署、ASR 多实例
- `sdk/README.md` —— 嵌入式 SDK 输入协议设计
- `metahuman-client-ue5/docs/数字人接入文档.md` —— UE5 客户端 WebSocket 接入协议
- `metahuman-dispatcher/README.md` —— 调度分发服务 API 契约与部署

## Deep-Dive Research (本目录下 `research/`)

如果上下文需要更深入地分析某个子领域，查阅 `research/` 中的文档：

| 主题 | 文档 |
| --- | --- |
| 3D 数字人顶层架构 | `research/00-architecture-overview.md` |
| 客户端插件体系 | `research/01-plugin-system.md` |
| 3D 渲染管线（WebGL/UE5/2D） | `research/02-3d-rendering-pipeline.md` |
| GLB 模型与骨骼动画 | `research/03-model-and-animation.md` |
| 状态机与动画映射 | `research/04-state-machine.md` |
| WebSocket 协议 | `research/05-ws-protocol.md` |
| 配置与运营管理 | `research/06-config-and-management.md` |
| 音频 / TTS / 字幕（含 audio-microphone + api/microphone 双端拾音链路） | `research/07-audio-and-tts.md` |

## Subproject Deep-Dive (本目录下 `subprojects/`)

按子项目维度的事实型梳理（基于代码逐文件扫描，带行号引用）：

| 子项目 | 文档 |
| --- | --- |
| `api/` 后台核心（meta_human + Flask + WebSocket + recorder） | `subprojects/api-backend-core.md` |
| `api/asr/` 语音识别（FunASR 多实例 + 声纹 + 负载均衡） | `subprojects/api-asr.md` |
| `api/llm/` + 向量库（8 种 LLM 适配器 + Chroma + BGE） | `subprojects/api-llm-vector.md` |
| `metahuman-dispatcher/` WS 调度分发中台（FastAPI 单文件 352 行） | `subprojects/dispatcher.md` |
| `web/` Node Midway Koa BFF + 多数据源 Driver + gRPC TTS 网关 | `subprojects/web-node-backend.md` |
| 镜像与编排（9 个 Dockerfile + 唯一一份 docker-compose） | `subprojects/deployment.md` |

## 口型（lip-sync / viseme）能力拓展方案 (本目录下 `lip-sync-extension/`)

2026-08-03 讨论形成。把"整段 `speak1` 骨骼动画"升级为"逐帧视位对齐的嘴部驱动"，覆盖 WebGL / UE5 / 2D 三端，viseme 时戳由 TTS 原生返回。

| 主题 | 文档 |
| --- | --- |
| 总览 + 现状 + 四步实施路线 + 分层架构 | `lip-sync-extension/01-overview.md` |
| 端到端数据流 + `send-audio-text` 协议扩展 + SDK 透传位置 | `lip-sync-extension/02-data-flow-and-protocol.md` |
| WebGL / UE5 / 2D 三路渲染端改造细节 + 代码位置 | `lip-sync-extension/03-three-renderer-plan.md` |
| 硬件 / 软件 / 人员 / Quick Start 清单 | `lip-sync-extension/04-readiness-checklist.md` |
| 概念速查 (viseme / phoneme / blendshape / ARKit 52 / Rhubarb / lerp) | `lip-sync-extension/05-concepts.md` |

入口：`lip-sync-extension/README.md`

## How to Use This Skill

当用户在本项目中提出以下类型的问题时，引用本文档提供上下文：

- "这个模块在做什么？" / "这段代码属于哪个层？"
- "我想修改 / 排查 / 新增 XX 功能，应该看哪些目录？"
- "端口 X 是哪个服务？" / "启动顺序是怎样的？"
- 任何关于数字人、ASR/LLM/TTS、大屏控制、UE5 客户端的问题