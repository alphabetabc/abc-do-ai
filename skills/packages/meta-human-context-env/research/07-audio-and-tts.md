# 07. 音频采集、TTS 流式输出、字幕

## 三种音频流向

```
用户语音
   │
   ▼
┌─────────────┐        ┌──────────────────┐         ┌────────────────┐
│ 浏览器麦克风 │── VAD ──▶│ ASR (FunASR)     │── 文本 ──▶│ api/main.py    │
└─────────────┘        │  10197~10199    │         │ - LLM 推理     │
                       └──────────────────┘         │ - 决策播报/操控│
                                                    └────────┬───────┘
                                                             │ topic:chat/...
                                                             ▼
                       ┌──────────────────┐        ┌────────────────────┐
                       │ 数字人客户端     │◀── WS ─│  meta-human-sdk    │
                       │ - 字幕 UI        │        │  - 维护播放队列    │
                       │ - 音频播放       │        │ - 状态机切换       │
                       └──────────────────┘        └────────────────────┘
```

## 浏览器端麦克风

`sdk/src/sdk/components/microphone/index.js` + `common/useWebSocket.js`：

- 使用 `@ricky0123/vad-web`（包内 `riky0123-vad-web`）做**语音活动检测**，只在用户说话时上传音频。
- 通过 WebSocket 把音频帧发给 ASR 服务（端口 9001 等）。
- 收到 `voice-start / voice-end` 等事件后回调上层。

UE5 客户端使用 `audio-recorder` 组件包了同一套逻辑：

```tsx
useMicrophone(sdkConfig?.microphoneConfig, "./static", sdkConfig?.common?.userInfo?.userName, false, () => {});
```

## TTS 流式播放

`sdk/src/sdk/components/chat/` 周边有 TTS 处理（不在 Chat 组件本身，而在 `useMessage` hook 中）。

```ts
const { playInfo, entryLocation } = useMessage({
    ttsConfig: {
        ttsUrl: "http://127.0.0.1:8089/v1/tts",
        format: "wav",
        streaming: audioPlayOnNode, // 流式 vs 整段
        chunk_length: 200,
        reference_id: "xiaohai",
        seed: null,
        use_memory_cache: "on",
        normalize: true,
        max_new_tokens: 1024,
        top_p: 0.7,
        repetition_penalty: 1.2,
        temperature: 0.7,
    },
    // ...
});
```

两种播放模式：

| 模式                        | 说明                                      | 优劣                 |
| --------------------------- | ----------------------------------------- | -------------------- |
| **流式（streaming=true）**  | TTS 服务按 chunk_length（200 字）切分返回 | 首字延迟低，适合交互 |
| **整段（streaming=false）** | 整段合成后一次性返回                      | 音质更稳，适合离线   |

## Node 端音频播放（Electron）

`metahuman-client-ue5/electron/arraySpeaker.js` + `singleSpeaker.js`：

- 当 `audioPlayOnNode = true` 时，音频由 Electron 主进程直接调用系统声卡 / 阵列扬声器播放。
- 用 `speakerWorker.js` 在 worker 中跑，避免阻塞 UI。
- 由 IPC 通道 `audio-finished` 通知渲染进程播放结束。

## 浏览器端语音合成（Web Speech API）

UE5 客户端内置一个 fallback：

```ts
audioPlayBySpeechSynthesis: false,    // 是否使用浏览器 SpeechSynthesis
preferredVoiceName: "",               // 优先声音名
```

适用场景：TTS 服务不可用时让浏览器自带 TTS 顶上去。

## 字幕（SubTitle）

`sdk/src/sdk/components/sub-title/index.js`：

- 由 `core.js` 维护一个 `subtitleMsg` state。
- 触发时机：`ClientEventEnum.SUBTITLE_ON` / `SUBTITLE_OFF`。
- 切割长度由 `maxCharsPerSubtitle`（默认 20）控制，避免一屏放不下。
- 当 `isChatOpen === true` 时，字幕不显示（避免和聊天气泡冲突）。

UE5 客户端有独立的字幕窗口：

- 由 Electron 主进程 `subtitleWindow` 渲染。
- 通过 IPC `subtitle-visible / subtitle-on / subtitle-off` 切换可见性。

## 音频文件缓存

`api/cache_data/`：

- 上传的音频文件落地缓存，避免 ASR 重复推理。
- `input.wav` 始终保留，其它定期清理（`main.py::__clear_audio_cache`）。

## 声纹（Speaker Recognition）

`api/asr/funasr-server/spk/`：

- `record_with_text.py`：录音工具，按文本朗读录入样本。
- `spk_model.py`：声纹模型。
- `TRAINING_GUIDE.md`：训练流程。
- 训练产物（JSON）可由管理平台导出，运行时 ASR Manager 会动态加载。

## 流式文字接收

服务端可能分多帧推送同一段答复（流式 LLM 输出），SDK 用 `messageId` 做合并：

```js
// core.js / onServerMessage / topic: chat
if (data.messageId) {
    const answerMsg = newState.find((item) => item.messageId === data.messageId && item.type === "answer");
    if (answerMsg) {
        answerMsg.msg = data.msg || ""; // 追加
        answerMsg.markdown = data.markdown || "";
    }
    // ...
}
```

`subtitle` 也是流式追加，客户端每收到一段就更新 UI。

## 口型（lip-sync）相关音频信号：未生成

音频播放链路只输出**声音 + 字幕**，**不输出 viseme / phoneme / mouth-cue 时间戳**，因此下游渲染端无法做面部口型同步。

### 证据

| 检查项                               | 结果                                                                               | 出处                                                                                                                                                                                                     |
| ------------------------------------ | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 浏览器侧音频播放                     | ❌ 直接 `new Audio(url).play()`，只通过 `ontimeupdate` 切字幕                      | metahuman-client-ue5/src/hooks/useMessage.ts#L174-L194                                                                         |
| 浏览器 SpeechSynthesis               | ❌ `onboundary` 只用于切字幕（`charIndex / maxChars`），不输出 viseme              | metahuman-client-ue5/src/hooks/useSpeechSynthesis.ts#L177-L191                                                         |
| Node 侧音频播放                      | ❌ `speaker` 包直接写 PCM，无音频分析                                              | metahuman-client-ue5/electron/speakerWorker.js#L1-L34                                                                          |
| TTS 后端返回 viseme                  | ❌ `api/llm/*` 与 `api/main.py` 中无 phoneme / viseme / mouthCue / timestamps 字段 | 全仓搜索 `phoneme\|viseme\|mouth_cue\|mouthCue` 仅命中 `metahuman-client-ue5/docs/数字人接入文档-1.1.0.md`（说明性文字，无实际生成）                                                                     |
| `send-audio-text` 消息的 `text` 字段 | ⚠️ 已传输但仅用于日志，**当前不驱动面部**                                          | metahuman-client-ue5/docs/%E6%95%B0%E5%AD%97%E4%BA%BA%E6%8E%A5%E5%85%A5%E6%96%87%E6%A1%A3-1.1.0.md |
| 安徽 / XMOV 外部服务                 | ✅ 由第三方服务端负责生成口型（代码不在本仓）                                      | sdk/src/sdk/plugin/Anhui.js#L1-L24                                                                                                     |

### 协议已留接口但前端不消费

`send-audio-text` payload 结构（来自协议文档）：

```json
{
    "text": "...", // 当前仅作日志
    "audioUrl": "...",
    "speechId": "...",
    "segmentId": "..."
}
```

后续要做口型，需扩展为类似：

```json
{
    "text": "...",
    "audioUrl": "...",
    "visemes": [
        // 新增
        { "time": 0.12, "value": "AA" },
        { "time": 0.34, "value": "EH" }
    ]
}
```

并在 TTS 后端（`api/`）或前端引入 Rhubarb / Oculus Lip Sync 前端版生成时间戳。

更完整的口型现状分析与客户端落地路线见 .trae/skills/meta-human-context-env/research/03-model-and-animation.md。

---

## 附录：拾音器双端实现（audio-microphone + api/microphone）

> 与上文的"浏览器内置 sdk microphone 组件"并列的另一套**独立拾音链路**。
> 由两个独立子项目组成：浏览器侧 React/Vite 调试页 `audio-microphone/` + Python 桌面客户端 `api/microphone/`，二者**可单独或组合使用**，与 `sdk/` 内嵌麦克风无代码共享。

### A1. `audio-microphone/`（浏览器侧 VAD 拾音页）

> 路径：audio-microphone/ （Vite + React 18）
> 角色：**独立的拾音器调试/演示页**，用 Web Audio + silero VAD 在浏览器侧做端侧 VAD，把完整 WAV 片段通过 WS 推到外部服务
> 与 sdk 的区别：sdk/microphone 走 ASR 服务（9001）；本项目通过 `App.tsx` 自定义 WS URL（默认 `ws://10.50.10.115:9001`）

#### A1.1 目录与依赖

audio-microphone/package.json：

| 关键依赖                       | 版本      | 作用                                                                          |
| ------------------------------ | --------- | ----------------------------------------------------------------------------- |
| `@ricky0123/vad-web`           | `0.0.22`  | Silero VAD 浏览器端实现（`silero_vad_v5.onnx` + `vad.worklet.bundle.min.js`） |
| `react-audio-visualize`        | `^1.1.3`  | 录音可视化                                                                    |
| `react` / `react-dom`          | `^18.1.0` | —                                                                             |
| `antd`                         | `^5.24.0` | Select 下拉框（设备选择）                                                     |
| `@ffmpeg/ffmpeg`               | `^0.11.6` | （声明但代码中未实际使用）                                                    |
| `@fedx-web-common/react-hooks` | `^0.0.4`  | 内部 hooks（`useLatest` / `useMemoizedFn`）                                   |

`vite.config.ts` 极简，仅 `react()` 插件；本地 `npm run dev` 直接 Vite dev server。

#### A1.2 核心组件链路

```
App.tsx
  └─ useWebSocket(url, callbacks)                     ← 自研 hook，支持 3 次重连
  └─ MicrophonePicker (onChange=blob => sendMessage)  ← 录音器 UI
       └─ AudioInputDevices                           ← antd Select 列出所有 audioinput
       └─ useAudioRecorder (audioTrackConstraints)    ← VAD + MediaRecorder 包装
            └─ vad.MicVAD.new({...onSpeechStart/onSpeechEnd})  ← silero_vad_v5
```

详见：

- audio-microphone/src/App.tsx
- audio-microphone/src/components/microphone-picker/index.tsx
- audio-microphone/src/components/microphone-picker/AudioInputDevices.tsx
- audio-microphone/src/components/react-audio-voice-recorder/hooks/useAudioRecorder.ts
- audio-microphone/src/common/useWebSocket.ts

#### A1.3 关键实现细节

1. **设备枚举 + 自动选择**：audio-microphone/src/components/microphone-picker/AudioInputDevices.tsx#L21-L56 通过 `getUserMedia({audio:true, video:false, preferCurrentTab:true})` 触发权限，再 `enumerateDevices()` 过滤 `kind==='audioinput'` 且**排除 `default` 与 `communications`**，默认选第一条；监听 `devicechange` 事件自动重列。

2. **VAD 参数**：audio-microphone/src/components/react-audio-voice-recorder/hooks/useAudioRecorder.ts#L111-L148：
    - `minSpeechFrames: 1`
    - `speechStartThreshold: 22`
    - `speechEndThreshold: 5`
    - `speechEndDuration: 700`（ms）
    - 资源路径：`/static/riky0123-vad-web/dist/` 与 `/static/riky0123-vad-web/onnxruntime-web/dist/`（这两个目录在仓库 `public/static/` 下完整提供）

3. **MediaRecorder 双层包装**：`onSpeechStart` 时新建 `MediaRecorder(stream)` 并 `start()`；`onSpeechEnd(audio: Float32Array)` 时通过 `vad.utils.encodeWAV(audio)` 编码，**追加 4 字节 `END!` 标记**（audio-microphone/src/components/react-audio-voice-recorder/hooks/useAudioRecorder.ts#L31-L39），封成 `Blob` 传给 `props.onChange`。

4. **空格键 PTT（Push-To-Talk）**：audio-microphone/src/components/microphone-picker/index.tsx#L53-L101 在 `keydown/keyup` 上监听 `Space`，按下开始/松开结束；同时监听 `document.visibilityState === 'hidden'` 自动停止。

5. **WS hook**：audio-microphone/src/common/useWebSocket.ts#L47-L190 默认 `reconnectLimit=3, reconnectInterval=3000ms`，`binaryType = 'blob'`，支持 `connect/disconnect` 手动控制，`onerror/onclose` 自动重连；3 次后停止。

6. **App 启动时握手**：3 秒后自动 `sendMessage(new Blob(['<mode>websocket</mode>']))`（audio-microphone/src/App.tsx#L29-L33），告诉服务端"走 websocket 模式"——这个握手协议被服务端 `api/core/recorder.py` 解析。

7. **Dev-only 回放**：audio-microphone/src/App.tsx#L39-L50 `process.env.NODE_ENV === 'development'` 时把每一段录音 blob 显示成 `<audio controls>` 用于人工回放核对。

#### A1.4 与 sdk 内置 microphone 的对比

| 维度        | sdk microphone                       | audio-microphone                      |
| ----------- | ------------------------------------ | ------------------------------------- |
| 形态        | npm 组件包，嵌入 sdk                 | 独立 Vite Demo 页                     |
| VAD         | 同源（silero_vad_v5）                | 同源（`@ricky0123/vad-web`）          |
| 音频格式    | 帧流式                               | 整段 WAV（带 `END!` 标记）            |
| 默认 WS URL | 来自 `sdkConfig.asrUrl` 等           | 硬编码 `ws://10.50.10.115:9001`       |
| 设备切换 UI | 由宿主应用配置                       | 内置 antd Select                      |
| PTT 快捷键  | 无                                   | Space 键                              |
| 文件位置    | `sdk/src/sdk/components/microphone/` | `audio-microphone/src/components/...` |

二者**实现思路一致但代码完全独立**，可以理解为两套维护中的等价实现。

---

### A2. `api/microphone/`（Python 桌面拾音客户端）

> 路径：api/microphone/
> 角色：把本地麦克风采集到的 PCM 音频（socket 模式）或完整 WAV（websocket 模式）通过原生 socket 发到 api/ 后端的 `deviceConnector`，由 `core/recorder.py` 接收并触发 ASR
> 关键依赖：pyaudio + pygame + (可选) psutil + pywin32

#### A2.1 启动与配置

api/microphone/main.py 共 1094 行；api/microphone/config.ini：

```ini
[network]
host = 127.0.0.1
port = 10001
device_id = 0
username = User

[instance]
lock_conflict_action = manual    # 1=退出, 2=关闭旧实例, manual=手动
```

命令行可覆盖（api/microphone/main.py#L73-L114）：

- `--config/-c`：自定义配置文件路径
- `--host` / `--port/-p`
- `--device-id/-d`
- `--username/-u`
- `--list-devices`：只列设备退出

启动流程（api/microphone/main.py#L1009-L1093）：

1. 解析参数 → 打印启动横幅
2. `check_single_instance()` 检查 `microphone_client.lock`
3. 注册 `atexit` + `signal.SIGINT/SIGTERM/SIGBREAK` + Windows `win32api.SetConsoleCtrlHandler` 多重清理
4. `start_client()` 进入主循环

#### A2.2 单实例锁机制

api/microphone/main.py#L150-L352 实现完整：

- 锁文件 `microphone_client.lock` 写本进程 PID
- 启动时检测：
    - 锁文件不存在 → 直接创建
    - 锁文件存在但 PID 不可用 → 提示过期清理
    - 锁文件存在且 PID 是另一个 python/microphone 进程 → 按 `lock_conflict_action` 处理：
        - `1`（退出）→ 退出
        - `2`（强制关闭旧实例）→ 用 `psutil.Process(old_pid).terminate()`；5s 超时后 `kill()`；清理后再建
        - `manual` → 交互式询问 `1/2`
- 退出时 `atexit` + 信号处理器 + Windows 控制台事件三重清理

#### A2.3 设备热切换 + 配置文件监控

api/microphone/main.py#L478-L503 `monitor_config()` 每秒检查 `config.ini` 的 mtime，若 `device_id` 变化就触发重连。交互式命令 `switch <ID>` 同样修改 `config.ini` 再触发 `reconnect_event.set()`（api/microphone/main.py#L536-L565）。

#### A2.4 交互式命令（仅 `manual` 模式生效）

api/microphone/main.py#L506-L600：

- `list / l`：列出所有输入设备
- `switch <ID> / s <ID>`：切换设备
- `current / c`：显示当前设备
- `pause / p` / `resume / r`：日志缓冲暂停/恢复（**500 条环形缓冲**，`pause_logging()` 后 print 不输出进缓冲；`resume_logging()` 回放）
- `status`：查看日志状态
- `help / h`

#### A2.5 发送音频线程 `send_audio`

api/microphone/main.py#L654-L748：

- 用 `pyaudio.open(rate=16000, format=paInt16, channels=1)` 开流
- 每 `stream.read(1024, exception_on_overflow=False)` → `client.send(data)` → `time.sleep(0.005)`
- **不说话的期间由 `is_speaking` 全局标志控制**——服务端 `recorder.py` 在播报期间会把 `is_speaking=True`，客户端 `continue` 不发音频
- 设备读取失败重试 3 次，之后进入"等待切换设备"无限阻塞
- 异常 → `reconnect_event.set()` 触发外层重连
- 每次退出都释放 stream + paudio

#### A2.6 接收音频线程 `receive_audio`

api/microphone/main.py#L751-L851：

- 协议魔数：
    - `b"PING"`（4 字节）→ 静默忽略（服务端期待客户端发 PING 而不是 PONG，见下）
    - `b"\x00\x01\x02\x03\x04\x05\x06\x07\x08"`（9 字节）→ 文件开始
    - 数据中夹杂的 `b"\xf0\xf1\xf2\xf3\xf4\xf5\xf6\xf7\xf8"`（心跳信息）→ 剥离
    - `b"\x08\x07\x06\x05\x04\x03\x02\x01\x00"`（9 字节）→ 文件结束
- 收到完整文件 → 存为 `samples/recv_<timestamp>.wav` → `pygame.mixer.music.load/play` → 播完后删除
- 播放期间设置 `is_speaking = True`，让 `send_audio` 暂停发送

#### A2.7 协议握手

api/microphone/main.py#L933-L938：

```python
client.send(f"<username>{username}</username>".encode())
client.send(f"<mode>socket</mode>".encode())
```

- `username` 协议：`recorder.py:541-567` 用正则提取作为后续身份标识
- `mode` 协议：`recorder.py:568-583` 切换 `socket` / `websocket` 两种录音主循环
- audio-microphone 的 `App.tsx` 通过 `Blob(['<mode>websocket</mode>'])` 也走这一握手

#### A2.8 打包

api/microphone/main.py 与 api/microphone/BUILD_GUIDE.md：

- Windows：api/microphone/build.bat → PyInstaller `--onefile --add-data "config.ini;."`
- 打包产物：`dist/microphone_client.exe` + `config.ini` + `samples/`
- api/microphone/microphone_client.spec 提供精细 spec 配置

---

### A3. 服务端对应：`api/core/recorder.py`

> 路径：api/core/recorder.py
> 角色：服务端接收拾音端音频数据 → 端侧 VAD（socket 模式）→ ASR（FunASR）→ 文本 → `meta_human.on_interact(Interact("content", 1, {...}))`
> 体量：约 2100+ 行（最大单文件之一）

#### A3.1 双模式录音主循环

api/core/recorder.py#L1385-L1402 的 `__record()` 根据 `self.mode` 分流：

| 模式        | 来源                    | 函数                                                                                                              | 数据形态                                                    |
| ----------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `websocket` | 浏览器 audio-microphone | api/core/recorder.py#L1426-L1467 | 完整 WAV + `END!` 标记；从 `StreamCache.read_wav_file()` 读 |
| `socket`    | Python api/microphone   | api/core/recorder.py#L1469-L1648    | 1024 字节 PCM 块；服务端自带 VAD                            |

#### A3.2 socket 模式服务端端侧 VAD

api/core/recorder.py#L1505-L1648：

- `audioop.rms(data, 2)` 算音量
- 历史 `__history_level` (deque maxlen=1000) + `__history_data` (deque maxlen=100) + 锁保护
- `__dynamic_threshold` 动态自适应：
    - 升：`history_percentage > threshold` → `threshold += (history - threshold) * 0.0025`
    - 降：`history_percentage < threshold` → `threshold += (history - threshold) * 1`
- `_should_listen()`（api/core/recorder.py#L1404-L1424）检查：
    - `pickup_enabled:<username>` 全局开关（通过 `global_vars.get`）
    - 当前用户 `user_state.speaking` 是否在播报中
- "激活"条件：`percentage > threshold && time - last_mute > pickup_start_time`
- "结束"条件：`time - last_speaking > pickup_release_time`（默认 0.7s）或录音时长 > `__max_audio_length` (30s) 或缓冲区 > 10MB

#### A3.3 ASR 异步队列（带过期跳过）

api/core/recorder.py#L233-L235：

```python
self.__asr_queue_maxsize = int(cfg.config["asr"].get("task_queue_maxsize", "5"))
self.__asr_task_queue = Queue(maxsize=self.__asr_queue_maxsize)
self.__asr_task_timeout = int(cfg.config["asr"].get("task_timeout", "10"))
```

- 队列满时（api/core/recorder.py#L776-L817）→ 清空所有旧任务，只保留最新
- `_process_asr_queue` worker（api/core/recorder.py#L841-L1100）：
    - 阻塞式 `task_queue.get(timeout=1)`
    - **批量跳过过期任务**（>10s）→ 取最新未过期任务
    - 调用 `self.__asr.send_url(file_url, request_id=task_id)` 或 `self.__asr.send(base64_data)`
    - **超时 30s 强制跳过**（不影响下一次）

#### A3.4 唤醒词 + 反馈 + 快速响应三件套

api/core/recorder.py#L1102-L1372 的 `_handle_asr_result`：

- 配置项（`[attributes]` 段）：
    - `wake_word_enabled`（bool）
    - `wake_word_type`：`common` / `front`
    - `wake_words`：按长度降序优先匹配长唤醒词
    - `sleep_word_enabled` / `sleep_words`
    - `call_feedback_enabled` / `call_feedback_wake_words` / `call_feedback_text`
    - `quick_response_enabled` / `quick_response_duration`（默认 5s）
- 流程：
    - `common` 模式：唤醒后任意输入都处理；超时后回到"待唤醒"
    - `front` 模式：必须以唤醒词开头，剥掉唤醒词后再处理
    - `_should_respond_with_feedback` 命中"你在吗"型反馈词时仅回复 "我在" 等而不进入指令模式
    - `_activate_quick_response_mode` 反馈后 5s 内直接处理而不需要重新唤醒
    - 唤醒成功时通过 `msg_utils.send_web_msg("activation", username, {"value": True})` 通知前端 SDK

#### A3.5 说话人（声纹）管理

api/core/recorder.py#L58-L168 `SpeakerConversationManager`：

- 通过 `cfg.config["asr"]["spk_model_enabled"]` 开关
- `conversation_timeout`（默认 60s）：超过则视为新对话，呼叫"xxx，你好"
- 同一对话内换说话人：仅呼叫名字"xxx，"
- 说话人列表由 `__asr.get_sentence_info_and_reset()` 提供（来自 ASR 的 spk 字段）

#### A3.6 临时文件池

api/core/recorder.py#L366-L401：

- 启动时预创建 5 个 `.wav` 在 `cache_data/`
- `_get_temp_file` 从池取；池空则新建
- `_return_temp_file` 归还；池满丢弃
- 配合 `asr_save_audio` 配置：True 时保留，False 时 `__waitingResult` 后异步删除

#### A3.7 与 meta_human 的连接

api/core/recorder.py#L1880-L1912 `on_thinking(text)`：

```python
sentence_info = self.__asr.get_sentence_info_and_reset()
speaker_greeting = self.speaker_manager.process_speaker_info(sentence_info)
interact = Interact("content", 1, {
    "username": self.username,
    "msg": text,
    "speaker_greeting": speaker_greeting,
})
self.__meta_human.on_interact(interact)
```

由此触发 LLM → TTS → 数字人播报完整链路。

---

### A4. 三套拾音方案总览与互斥关系

| 方案                 | 入口                                 | 传输                              | 服务端处理                                                                              | 适用            |
| -------------------- | ------------------------------------ | --------------------------------- | --------------------------------------------------------------------------------------- | --------------- |
| **sdk 内置**         | `sdk/src/sdk/components/microphone/` | 流式音频帧（ASR 服务 9001）       | 走 api/asr/ FunASR Manager | 嵌入 SDK 的网页 |
| **audio-microphone** | `audio-microphone/` Vite Demo        | 完整 WAV + `END!` 标记（WS 9001） | `core/recorder.py` `__record_websocket_running`                                         | 独立调试/演示页 |
| **api/microphone**   | `api/microphone/main.py`             | 1024 字节 PCM 块（socket 10001）  | `core/recorder.py` `__record_socket_running`（含服务端 VAD）                            | 桌面端独立部署  |

**互斥性**：

- sdk 与 audio-microphone 都可以连到同一个 ASR 服务（9001）但走不同路径
- api/microphone 走 10001 端口的 socket 协议，由 api/ 的 `meta_human_launcher.py` 起 socket server
- 三者**不共享代码**，但**协议上 socket/websocket 模式已被 audio-microphone（WS 模式）和 api/microphone（socket 模式）协商出来**

### A5. 已知问题与观察（事实记录）

1. **audio-microphone WS URL 硬编码**：audio-microphone/src/App.tsx#L14 写死 `ws://10.50.10.115:9001`——这是开发环境的内部 IP，正式部署时需改为环境变量。
2. **audio-microphone 默认 3 秒发送握手**：audio-microphone/src/App.tsx#L30-L32 不等服务端 `onOpen` 就发 `<mode>websocket</mode>` blob，若 WS 还未建立会进 `sendMessage` 的 `readyState !== Open` 分支被丢弃。
3. **api/microphone 的"说话中"控制权反转**：服务端通过 `is_speaking` 全局变量让客户端 `send_audio` `continue`（不发音频），但**没有 PONG 心跳**：客户端看到 `b"PING"` 就静默忽略（api/microphone/main.py#L766-L768）而非回复 `PONG`，**与服务端期望行为不匹配**——服务端 `recorder.py:528-539` 用 `if data == b"PING"` 进入 PONG 响应分支。
4. **服务端动态阈值公式不对称**：升档用 0.0025 慢升、降档用 1.0 急降——是合理的（非静音快速降低阈值以拾取轻声），但意味着**初始静音后阈值会迅速跌到接近 0**，可能误触发。
5. **recorder.py 单文件 2000+ 行**：包含 ASR 调用、唤醒词、说话人、VAD、动态阈值、文件池、状态监控 6 大职责，缺乏拆分。
6. **cache_data 池在重启时遗留**：临时文件池的 wav 在 `os.remove` 失败时不重试，长期运行可能 `cache_data/` 堆积（虽然池大小固定为 5）。
7. **mic/microphone_client.spec 与 build.bat 分离**：spec 改后 build.bat 不会自动用，需手工 `pyinstaller microphone_client.spec`。
8. **audio-microphone 中 `END!` 标记在 VAD 边缘可能被截**：VAD 检测到 `speechEnd` 后才写入；如果用户说话时被切静音，silero 提前触发 `speechEnd`，`END!` 标记后的 wav 文件可能被服务端截短识别。
9. **api/microphone 的 `is_speaking` 是全局而非用户级**：在同一台机器跑多个用户会互相干扰——`receive_audio` 设置 True 后其他 user 也会被阻塞。
10. **recorder.py 在 mode == "websocket" 时直接读 wav，不做 VAD 二次校验**：完全依赖浏览器侧 VAD；若音频包含非语音片段（如咳嗽）会被直接送入 ASR。
11. **`pickup_enabled` 全局开关按用户存于 `global_vars`**：api/core/recorder.py#L1414-L1418 但 `global_vars` 容量/清理策略未在代码中明确——长跑可能内存增长。
12. **audio-microphone 的 Space 键 PTT 与 IME 输入冲突**：中文输入法下空格常被 IME 消费，按 Space 不会触发 PTT，但代码未做 IME 状态检查。

---

### A6. 与其他子项目的关系

| 子项目                                             | 关系                                                                                                                                              |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [api-backend-core.md](./api-backend-core.md)（P1） | `core/recorder.py` 是 P1 `core/meta_human/recorder.py` 的超集（包含更复杂的 VAD/唤醒词/说话人）；后者文件更小、专注 metadata 上报。               |
| [api-asr.md](./api-asr.md)（P2）                   | 三套拾音方案都最终调用 `api/asr/funasr-server/ASR_server.py` 或 `api/asr/funasr.py`（internal 模式）；声纹识别来自 `api/asr/funasr-server/spk/`。 |
| [api-llm-vector.md](./api-llm-vector.md)（P3）     | `recorder.py` 通过 `Interact("content", ...)` 把文本送入 `meta_human.on_interact`，最终由 P3 的 LLM 适配层生成回复。                              |
| `api/metahuman-admin/`（P4）                       | 训练声纹数据由 P4 Streamlit 平台导出，供 `SpeakerConversationManager` 加载。                                                                      |
| [dispatcher.md](./dispatcher.md)（P5）             | 三套拾音方案都**不直接调用** dispatcher；dispatcher 只服务"大屏+控制端"协议。                                                                     |
| [web-node-backend.md](./web-node-backend.md)（P6） | 无直接调用；web/ 也不接收任何拾音数据。                                                                                                           |
| P7（本附录）                                       | —                                                                                                                                                 |
| P8（docker）                                       | api/microphone 与 audio-microphone 是否会被打包进 docker 待扫描。                                                                                 |

### A7. 一句话总结

拾音链路有三套等价但实现完全独立的方案：`sdk` 内置（流式）、`audio-microphone` Vite Demo（WS + 端侧 VAD）、`api/microphone` Python 桌面客户端（socket + 服务端 VAD）——三套在 `api/core/recorder.py` 汇合，由 mode 协议字段切换双录音主循环，最终经 ASR → LLM → 数字人播报完成对话闭环。
