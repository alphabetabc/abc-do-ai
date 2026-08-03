# 02. 数据流与协议：viseme 怎么从 TTS 走到 3D 模型脸上

> 回答"客户端怎么接收口型"这个问题的技术细节版。

---

## 1. 端到端数据流（一次对话"你好"为例）

```
[TTS 服务 (CosyVoice/GPT-SoVITS)]
        │ wav bytes + phoneme_timestamps
        ▼
[api/main.py TTS 分支] ─────→ 把 phoneme 转成 viseme（可选），
        │                   累加 segment offset，构 visemes: [{t, p}]
        │ topic: unreal / channel: send-audio-text
        ▼
[Flask / WS Server] ──────────────▶ [SDK core.js onServerMessage]
                                            │ 把 msg.audioUrl / msg.visemes
                                            │ 透传给 plugin.speak()
                                            ▼
                                   [SDK plugin (Web/Virtual3D/Default)]
                                            │ Web:  player.applyVisemes(cues) + <audio>.play()
                                            │ UE5:  WS/REST send visemes
                                            │ 2D :  spriteMorph.setCues(cues)
                                            ▼
                                     [渲染端 时间轴驱动]
                                        <audio>.on('timeupdate')
                                        └→ findCueAt(t).p
                                           → set morphTarget / sprite
```

每段消息有唯一 `speechId + segmentId`，流式 LLM 会把一段长回答切成多个 chunk 发送，`segmentId` 是 chunk 的顺序号，用于 viseme 时间偏移叠加。

---

## 2. 协议扩展：`send-audio-text` 新增字段

文件位置：
- `sdk/README.md`（SDK 输入协议）
- `metahuman-client-ue5/docs/数字人接入文档-1.1.0.md`（UE5 接入协议）

### 2.1 现有 payload（仅作日志/状态切换用）

```json
{
    "text": "你好",
    "audioUrl": "https://tts.local/x_20260803_001.wav",
    "speechId": "sp_20260803_abc",
    "segmentId": "seg_001"
}
```

### 2.2 扩展后的 payload（向后兼容，新增字段全为可选）

```ts
type VisemeCue = {
    t: number;   // 秒，相对于 audioUrl 的起点，0 为音频起点
    p: string;   // viseme 标签：建议用 Rhubarb 8 类 (A..H) 或 Oculus 15 类
                 //            若 TTS 原生返回 phoneme，则 phonemes 字段填 IPA 或 SAMPA
    w?: number;  // (可选) 0~1 权重，便于多 viseme 混合
};

type SendAudioTextPayload = {
    text: string;
    audioUrl: string;
    speechId: string;
    segmentId: string;

    // ↓↓ 新增，全为可选；至少填一个，渲染端优先 visemes，没有再退 phonemes
    visemes?: VisemeCue[];          // 推荐，渲染端直接用
    phonemes?: VisemeCue[];         // UE5 Audio to Face / 高质量场景
};
```

### 2.3 两种时间戳对比

| 来源 | 字段 | 标签示例 | 优点 | 缺点 |
| --- | --- | --- | --- | --- |
| Rhubarb 等 viseme 工具 | `visemes` | `A/B/C/D/E/F/G/H/Rest` | 嘴型少（8），前端映射简单 | 需要后处理 |
| TTS 原生 phoneme | `phonemes` | `/p/ /b/ /m/ /a/ /i/ /u/ /f/` | 精准，可多语言复用 | 前端需要一张 phoneme→blendshape 映射表 |

推荐策略：**后端把 phoneme 转成 viseme 后一起下发**（`visemes` 和 `phonemes` 两个字段都填），UE5 端用 phoneme，WebGL/2D 用 viseme。

---

## 3. SDK 核心（core.js）透传位置

文件：`sdk/src/sdk/components/core.js`，`onServerMessage` 函数。

现有代码（节选）：

```js
case ServiceMessageTopicEnum.UNREAL:
    clientRef?.current?.speak?.({ content: msg, speed, volume, pitch, topic });
    break;
```

改造（只加参数，不改调用链）：

```js
case ServiceMessageTopicEnum.UNREAL:
    clientRef?.current?.speak?.({
        content: msg,
        audioUrl:  serverMsg.data?.audioUrl,
        visemes:   serverMsg.data?.visemes,    // ← 新增
        phonemes:  serverMsg.data?.phonemes,   // ← 新增
        speechId:  serverMsg.data?.speechId,
        segmentId: serverMsg.data?.segmentId,
        speed, volume, pitch, topic
    });
    break;
```

---

## 4. 插件层（Web / Virtual3D / Default / Xmov / Anhui）分发

文件：`sdk/src/sdk/plugin/`

### 4.1 建议：抽一个通用 LipSyncVisemeAdapter

`sdk/src/sdk/plugin/_lipSyncVisemeAdapter.js`（新增）：

```js
export const visemeToArkIt = {
    A:  { jawOpen: 1, mouthClose: 0 },            // 张嘴 "啊"
    B:  { jawOpen: 0.3, mouthFunnel: 1 },         // 噘嘴
    C:  { jawOpen: 0.2, mouthSmile_L: 1, mouthSmile_R: 1 }, // 咧嘴
    D:  { jawOpen: 0.2, mouthPucker: 0.6 },       // 嘬嘴
    E:  { jawOpen: 0.1 },
    F:  { jawOpen: 0.05 },
    G:  { jawOpen: 0,  mouthClose: 1 },           // 闭唇
    H:  { jawOpen: 0.1, tongueOut: 0.2 },
    Rest: { jawOpen: 0, mouthClose: 0.1 }
};
```

### 4.2 Web 插件（WebGL / 浏览器 3D）
`sdk/src/sdk/plugin/Web.js`：

```js
client.speak = ({ content, audioUrl, visemes, phonemes, ... }) => {
    const api = window.MetaHuman.createDigitalHumanClientApi(...);
    api.playAudio({ url: audioUrl });
    if (api.applyVisemes && visemes) api.applyVisemes(visemes);   // ← 新增
};
```

### 4.3 Virtual3D 插件（UE5 像素流送桌面端）
`sdk/src/sdk/plugin/Virtual3D.js`：

```js
client.speak = ({ content, audioUrl, visemes, phonemes, ... }) => {
    ws.send({ channel: 'play-audio', payload: { audioUrl } });
    if (visemes) ws.send({ channel: 'apply-visemes', payload: { visemes } }); // ← 新增
    if (phonemes) ws.send({ channel: 'apply-phonemes', payload: { phonemes } }); // ← 新增
};
```

UE5 端收到后，在 Electron 渲染进程里走现有的 HTTP REST（PUT /remote/preset/...）或直接用 Pixel Streaming 的 `emitUIInteraction`。

### 4.4 Default 插件（2D GIF / 轻量）
`sdk/src/sdk/plugin/Default.js`：

```js
client.speak = ({ content, audioUrl, visemes }) => {
    playAudio(audioUrl);
    if (visemes) spriteCuePlayer.setCues(visemes);  // ← 新增
};
```

---

## 5. 为什么 viseme 数组要和 audioUrl 一起下发？

常见误解："服务端一次性把 viseme 全告诉我不就行了？"

不行 —— 因为 viseme 描述的是**第几秒嘴长什么样**，必须跟**实际音频播放**对齐：
1. 客户端**启动音频播放**（`<audio>.play()`）才能获得 `audio.currentTime`（从 0 开始的秒数）；
2. 然后**按 `audio.currentTime` 逐个消费 viseme**。

如果 viseme 的 `t` 是 unix 绝对时间戳，会有网络 RTT / 缓存 / 丢包 引入的漂移 —— 所以约定 `t` 必须是相对 `audioUrl` 的**相对秒数**。

---

## 6. 一个"最小"消息示例

`topic: unreal` 的真实包：

```json
{
  "topic": "unreal",
  "source": "chat",
  "data": {
    "text": "你好，我是数字人讲解员。",
    "audioUrl": "https://tts.local/sp_20260803_001.wav",
    "speechId":  "sp_20260803_001",
    "segmentId": "seg_001",
    "visemes": [
      { "t": 0.00, "p": "Rest" },
      { "t": 0.12, "p": "n"    },
      { "t": 0.20, "p": "i"    },
      { "t": 0.34, "p": "h"    },
      { "t": 0.45, "p": "ao"   },
      { "t": 0.60, "p": "Rest" }
    ],
    "phonemes": [
      { "t": 0.00, "p": "sil" },
      { "t": 0.12, "p": "n"   },
      { "t": 0.20, "p": "i:"  },
      { "t": 0.34, "p": "x"   },
      { "t": 0.45, "p": "au"  },
      { "t": 0.60, "p": "sil" }
    ]
  },
  "username": "User-001"
}
```

---

## 7. SDK → 渲染端的命令式接口（各端都需实现）

建议**全部客户端**（WebGL 渲染组件、UE5 客户端、2D 客户端）都暴露下面两个 imperative 接口，与现有 `play()/stop()` 保持风格一致：

```ts
interface DigitalHumanClient {
    // ─ 原有 ──────────────────────────────────
    play(action: string): void;
    stop(action: string): void;

    // ─ 新增，口型能力 ───────────────────────
    applyVisemes(cues: { t: number; p: string; w?: number }[]): void;
    resetVisemes(): void;   // 切回默认表情 / Rest
}
```

WebGL 端已经是 `forwardRef + useImperativeHandle` 模式（参考 `metahuman-webgl-render/models/wushi.tsx` 里 `play/stop`），照葫芦画瓢加两个方法即可。

---

## 8. 流式 LLM 下的 segment 时间偏移修正

LLM 回答通常是流式按 chunk 切，每个 chunk 一段音频（`ttsConfig.chunk_length=200`）。每个 chunk 的 `visemes.t` 是从 **该 chunk 音频起点**算 0，当多段串起来时会错误叠加。

**后端必须在打包每条消息时**做：

```python
cumulative_offset = 0.0
for i, chunk in enumerate(tts_chunks):
    visemes = chunk.phonemes_to_visemes()
    # 关键点：把本 chunk 相对 t 加上前面所有 chunk 的实际时长
    for cue in visemes:
        cue["t"] += cumulative_offset
    send_ws_message({
        "speechId": speech_id,
        "segmentId": f"seg_{i:03d}",
        "audioUrl": chunk.url,
        "visemes": visemes
    })
    cumulative_offset += chunk.audio_duration_sec
```

不做这一步的话，渲染端会在段边界嘴型跳变。

---

## 9. 协议验收 Checklist

- [ ] `visemes` / `phonemes` 字段为**可选**，不传时所有行为与老版本完全一致；
- [ ] `visemes[i].t` 严格递增，最小分辨率 ≤ 50ms（Rhubarb 默认约 30~60ms，够用）；
- [ ] 每条消息都带 `speechId + segmentId`，便于客户端缓存、断点续播、过期丢弃；
- [ ] chunk 边界的 viseme `t` 已用 `cumulative_offset` 修正；
- [ ] `sdk/README.md` 与 UE5 接入文档中 `send-audio-text` 章节同步更新；
- [ ] CI/CD 对下行消息做 JSON schema 校验（缺 visemes/phonemes 不报警，类型错了报警）。
