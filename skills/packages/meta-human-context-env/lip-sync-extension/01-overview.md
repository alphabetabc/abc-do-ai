# 01. 口型拓展 · 总览（现状 + 四步路线 + 分层架构）

> 2026-08-03 讨论结论。目标：从"整段 `speak1` 骨骼动画"升级为"音素级嘴型同步"，覆盖 WebGL / UE5 / 2D 三端，**TTS 原生返回 phoneme/viseme 时戳**。

---

## 1. 现状速查（仓库里"没有"什么）

| 检查项 | 结果 | 代码证据 |
| --- | --- | --- |
| GLB 模型含 morph target / blendshape | ❌ 仅 SkinnedMesh + Bone，未见 `morphTargetInfluences` 驱动 | `metahuman-client/src/components/renderer/models/scene.tsx#L28-L55`、`wushi.tsx#L18-L47` |
| 渲染层驱动 viseme / blendshape | ❌ 只 `actions[action].play()`，按 SPEAK/IDLE/THINK 切整段动画 | `metahuman/src/components/metahuman-webgl-render/models/*.tsx` |
| UE5 端调面部 | ❌ 仅 REST `PUT /remote/preset/MyPreset/function/Change Current Status` 切 status | `metahuman-client-ue5/src/App.tsx#L13-L33` |
| 2D 端做口型 | ❌ 只切 `speak` / `idle` 预渲染 GIF | `metahuman-client-2d/src/App.tsx#L14-L18` |
| TTS 后端返回 viseme | ❌ `api/llm/*` / `api/main.py` 中无 phoneme / viseme / mouthCue | 全仓 grep 仅命中协议文档说明性文字 |
| SDK 插件生成口型 | ❌ 5 个插件只做消息转发；`Anhui` 插件由远端第三方处理（非本仓） | `sdk/src/sdk/plugin/*.js` |
| 协议层 `text` 字段用途 | ⚠️ `send-audio-text.text` 协议文档标明"仅日志 / 未来扩展，不保证口型匹配" | `metahuman-client-ue5/docs/数字人接入文档-1.1.0.md#L14/L36/L103/L120/L257` |
| 死代码提醒 | `api/main.py#L4-L6` 残留 `test/ovr_lipsync/ffmpeg/bin` PATH，目录不存在，无任何 OVRLipSync 调用 | 遗留代码，与本次改造无关 |

---

## 2. 分层架构

```
┌────────────────────────────────────────────────────────────────────────┐
│ ① TTS 服务（api/llm/* 或独立 TTS 网关）                                  │
│   流式 chunk 返回 wav 的同时，原生返回 phoneme/viseme 累计时间戳：          │
│   { audioUrl, visemes: [{ t, p }] }                                      │
│   t = 相对音频起点的秒；p = viseme 标签（AA/EH/I/…）                     │
└───────────────────────────────────────────┬────────────────────────────┘
                                            │ send-audio-text 扩展
                                            ▼
┌────────────────────────────────────────────────────────────────────────┐
│ ② SDK 核心（sdk/src/sdk/components/core.js  onServerMessage）            │
│   - 原只透传 content / audioUrl                                          │
│   - 新增：data.visemes / data.phonemes 随 speak(cues) 注入到插件          │
│   - 协议向后兼容：两字段缺省时仍走 speak1 整段动画                          │
└───────────────────────────────────────────┬────────────────────────────┘
                                            │ channel: send-audio-text
                                            ▼
┌────────────────────────────────────────────────────────────────────────┐
│ ③ SDK 插件（sdk/src/sdk/plugin/） + LipSyncVisemeAdapter                  │
│   Web 插件     → applyVisemes(cues) 写 blendshape                        │
│   Virtual3D 插件 → REST PUT Set Face Curves 到 UE5                       │
│   Default 插件 → sprite 切帧（2D）                                         │
└───────────────────────────────────────────┬────────────────────────────┘
                                            ▼
┌────────────────────────────────────────────────────────────────────────┐
│ ④ 渲染端                                                                 │
│   WebGL：morphTargetInfluences + useFrame lerp                           │
│   UE5  ：MetaHuman Face Curves / Audio to Face                           │
│   2D   ：<img> sprite 按 currentTime 跳帧                                 │
└────────────────────────────────────────────────────────────────────────┘
```

关键约束：**viseme 的 `t` 必须是相对 `audioUrl` 起点的秒数**，与 `audio.currentTime` 同起点，渲染端无需换算。

---

## 3. 四步实施路线（建议顺序）

### Step 1 · 资产与协议先落地（0.5~1 周）
1. 建模师：用 Blender 给 `woman.glb` / `wushi.glb` 加 **ARKit 兼容 blendshape**（Shape Keys，命名按 `jawOpen`/`mouthClose`/`mouthPucker`/`mouthSmile_L`/`mouthSmile_R`/`mouthFunnel`/`mouthPucker`/`tongueOut`/`browInnerUp`… 至少口型 8 类起步）。
2. 协议 PR：`send-audio-text` 新增可选 `visemes` / `phonemes` 两字段；先文档化，`visemes?` 缺省时老客户端无感。
3. 确认 TTS 服务是否支持 phoneme timestamps：CosyVoice / GPT-SoVITS / 阿里 Sambert / 字节火山 高音质档一般都有对应参数（`sub_format=phoneme` 等）。

### Step 2 · TTS → viseme 时间戳接入（1 周）
文件：`api/main.py` 中 TTS 流式返回分支（配合 `sdk` 端 `ttsConfig.chunk_length=200`）。

要点：
- 每段 chunk 独立求 phoneme 时戳；
- **累计偏移修正**：把本 chunk 的 viseme `t` 加上前面所有 chunk 的**实际音频时长**（注意 chunk 边界对齐，避免段间漂移）；
- 塞进下行消息：`{ topic: 'unreal', data: '你好', audioUrl, visemes: [...] }`。

### Step 3 · WebGL 端打样（1~2 周，作为演示 MVP）
1. 模型组件扩 `applyVisemes(cues: VisemeCue[])` / `resetVisemes()`；
2. `useFrame` 里按 `audio.currentTime` 查当前 viseme，lerp 到对应 `morphTargetInfluences[idx] = 1`（其余 blendshape 回 0）；
3. SDK `Web.js` 插件透传；
4. Demo：`metahuman/` 跑起来后嘴随音频动。

### Step 4 · 三端收敛 + 插件抽象（1~2 周）
1. UE5：MetaHuman Audio to Face 插件或自建 `SetFace({ curve: value })` REST 端点；
2. 2D：按 viseme 切 sprite；
3. 插件层抽出 `LipSyncVisemeAdapter`（或在各插件 speak() 钩子内加 10~20 行）统一把 viseme 映射到对应端。

---

## 4. 关键风险与对策

| 风险 | 表现 | 对策 |
| --- | --- | --- |
| 流式 TTS chunk 边界 viseme 偏移漂移 | 段接缝处嘴型卡/跳 | 每段开始时重新对齐 `audio.currentTime` 与该段首个 viseme.t=0，或用 "segment cumulative offset" 表精确叠加 |
| `Audio.currentTime` 精度低（默认 250ms） | 肉眼可见嘴慢半拍 | 改用 `requestAnimationFrame` 主动轮询（16ms 粒度），每 0.5s 用 `audio.currentTime` 做一次绝对校准 |
| GLB 无 blendshape 资产 | 前端再怎么写代码也看不到嘴动 | 先让建模师跑 Blender 确认 Shape Keys；没有的话用 ArkIt 标准先补 8~14 个口型，其余面部表情延后 |
| UE5 端面部改造跨仓 | UE5 工程不属于本仓 | 前端只发 `{ visemes }` WS 消息，UE5 工程内部消费；接口先行，约定好"10 条标准化曲线曲线名"即可 |
| 协议升级影响存量插件 | 老客户端不认识 visemes 字段 | 字段必须**可选**，SDK 层在各插件 speak 入参解构时提供 `= undefined` 默认值；CI 加 schema 校验 |
| lerp 系数太大会卡 / 太小会糊 | 嘴形"跟不上"或"有果冻感" | 先取 `1 - Math.exp(-delta * 20)`（帧率无关指数平滑），可在面板里加 sliders 调参 |

---

## 5. 建议立即可做的三件事（一天内）

1. **模型资产检查**：Blender 打开 `metahuman/public/models/woman.glb` → Properties → Data → Shape Keys 面板，看是否已有数据；有则直接进入 Step 3 做 MVP。
2. **TTS 接口确认**：确认 `api/llm/` 下在用 TTS 适配器（`SiliconFlowAdapter` / `CSBAdapter` / 企业内部适配器等）对应的 TTS 服务能否加 `return_phoneme_timestamps: true`，能则无需 Rhubarb 后处理。
3. **协议草案 PR**：在 `sdk/README.md`、`metahuman-client-ue5/docs/数字人接入文档-1.1.0.md` 里先把 `visemes` / `phonemes` 字段加进 `send-audio-text` 章节（标注"预留，本期启用"）。

---

## 6. 阅读顺序建议

```
本文件（01-overview）
  ├→ 02-data-flow-and-protocol.md   （数据流 + 协议 schema）
  ├→ 03-three-renderer-plan.md      （WebGL/UE5/2D 端改动计划）
  ├→ 04-readiness-checklist.md      （开工前硬件/软件/人员核对）
  └→ 05-concepts.md                 （概念速查）
```
