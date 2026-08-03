# 口型（lip-sync / viseme）能力拓展：讨论纪要 & 落地计划

> 本目录记录 2026-08-03 对口型能力拓展方案的讨论，目标：把"整段 speak1 骨骼动画"升级为"逐帧音素/视位对齐的嘴部驱动"。
> 适用于三条渲染链路：**WebGL/GLB**、**UE5 像素流送**、**2D GIF 客户端**。
> 视位（viseme）时间戳由 **TTS 服务原生返回**（优先 CosyVoice / GPT-SoVITS / 等已支持 phoneme-timestamps 的 TTS）。

## 文档导航

| # | 文档 | 主题 |
| - | - | - |
| 01 | `01-overview.md` | 现状盘点 + 四步实施总路线 + 分层架构图 |
| 02 | `02-data-flow-and-protocol.md` | 端到端数据流、`send-audio-text` 协议扩展（`visemes`/`phonemes` 字段）、SDK 透传位置 |
| 03 | `03-three-renderer-plan.md` | WebGL / UE5 / 2D 三路渲染端的具体落地步骤、改动文件索引 |
| 04 | `04-readiness-checklist.md` | 硬件（GPU/CPU）、软件（Node/Python/Blender/Rhubarb/FFmpeg）、人员、Quick Start 检查清单 |
| 05 | `05-concepts.md` | 概念速查：viseme / phoneme / blendshape / ARKit 52 / Rhubarb / Oculus LipSync |

## 一句话核心路线

1. **TTS 后端**：每段 wav 返回时附带 `[{t, p}]` viseme 时间戳数组；
2. **协议层**：把 `visemes` 扩展进 `send-audio-text`（向后兼容，老客户端忽略）；
3. **SDK 核心 & 插件**：透传 `visemes` 到渲染端；
4. **WebGL / UE5 / 2D**：以 `audio.currentTime` 为钟摆，按时间戳驱动 blendshape（或 2D sprite / UE5 Face Curves），加 lerp 防突跳。

## 与现有文档的关系

- `../research/03-model-and-animation.md`：项目口型现状的代码级证据（无 blendshape、UE5 仅切 status）。
- `../research/07-audio-and-tts.md`：TTS / 音频播放链路现状（仅出 wav + 字幕，无 viseme 时戳）。
- `../research/05-ws-protocol.md`：三条 WS 连接、topic/channel/event 枚举。
- 本目录为**方案设计 + 落地跟踪**文档，`research/` 是**代码事实盘点**文档。
