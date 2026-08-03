# 00. 顶层架构总览

## 目标

回答："3D 数字人"在这个项目里到底是什么东西？由谁管理？整套链路是怎样跑起来的？

## 三个核心实体

| 实体 | 角色 | 物理形态 | 关键能力 |
| --- | --- | --- | --- |
| **数字人服务端** | 后端大脑 | `api/` 进程（Python） | ASR + LLM + TTS + 状态广播 + 大屏操控下发 |
| **数字人客户端** | 表现层 | `metahuman-client*` 目录（Electron / Vite+React） | 渲染 3D 模型 / 播放音频 / 字幕 / 接收操控指令 |
| **嵌入式 SDK** | 桥梁 / 控件库 | `sdk/dist/meta-human-sdk.js` | 把上述两端粘合到一个普通网页里 |

## 数据流

```
                  ┌─────────────────────────────────────────┐
   Web 页面        │   meta-human-sdk.js（SDK）              │
   ┌─────────┐    │  - useServiceClientWs（连服务端）       │
   │ <iframe │◄──►│  - useHumanClient（连客户端 plugin）    │
   │  / SDK  │    │  - 组件：Chat / Status / SubTitle       │
   └─────────┘    └────┬─────────────────────┬──────────────┘
                       │                     │
                  WS (5200/5201)         WS (digitalHumanService.ip:controlPort)
                       │                     │
                       ▼                     ▼
            ┌────────────────────┐  ┌────────────────────────┐
            │ metahuman-client   │  │ api/main.py            │
            │ (Electron)         │  │ - meta_human_core      │
            │ - renderer（GLB）  │  │ - ASR/LLM/TTS pipeline │
            │ - TTS 播放器       │  │ - broadcast(WS 推送)   │
            │ - 字幕窗口         │  │ - 操控指令生成         │
            └────────────────────┘  └──────────┬─────────────┘
                                                │
                                                ▼
                                       ┌────────────────────┐
                                       │ metahuman-dispatcher│
                                       │  WS 路由 / 多大屏   │
                                       └────────────────────┘
```

## 关键设计思想

1. **后端只负责"说什么"，不负责"长什么样"**
   `api/` 端只发出 `topic: chat / control / report / activation / status / log / unreal` 等高层语义消息，具体的"嘴唇同步、表情动作、姿态切换"完全交给客户端插件。

2. **客户端插件化**
   `sdk/src/sdk/plugin/` 目录下提供 5 种"数字人客户端实现"：`Default`、`Xmov`、`Anhui`、`Web`、`Virtual3D`。它们都实现同一套接口（`speak / interrupt / setStatus / show / hide / switchRoles …`），由 `digitalHumanClient.mode` 配置项决定使用哪个。

3. **渲染后端可替换**
   - WebGL（Three.js + @react-three/fiber）：`metahuman/`、`metahuman-client/`
   - UE5 像素流送：`metahuman-client-ue5/`（直接拉 UE5 的视频流）
   - 2D GIF / 序列帧：`metahuman-client-2d/`

4. **状态机驱动而非"命令驱动"**
   服务端持续推送 `status` 消息，客户端按状态映射到具体动画名（如 `idle → A1`，`speak → A3`）。这是整个 3D 数字人管理的"心脏"。

## 相关源码定位

- 服务端：api/core/meta_human/
- 服务端 WebSocket：api/core/wsa_server.py
- 客户端插件：sdk/src/sdk/plugin/{Default,Xmov,Anhui,Web,Virtual3D}.js
- 客户端渲染：metahuman-client/src/components/renderer/、metahuman-client-ue5/src/components/pixel-streaming-wrapper/
- SDK 桥接：sdk/src/sdk/components/core.js + sdk/src/sdk/hooks/useServiceClientWs.js