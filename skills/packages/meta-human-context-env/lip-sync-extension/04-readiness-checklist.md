# 04. 开工前核对清单：硬件 + 软件 + 人员 + Quick Start

> 动代码之前把这份清单打勾，避免跑一半卡在"模型没有 blendshape"这种问题。

---

## 1. 硬件（一台开发 + 演示机器）

### 1.1 必选（开发 / 本地 Demo）
- [ ] **CPU**：i5-12400 / Ryzen 5 5600 及以上（Rhubarb / TTS viseme 后处理吃单核）
- [ ] **GPU**：
  - 独显：GTX 1650（4GB）及以上（WebGL 2.0 必需 + blendshape 计算）
  - 集显：Intel Iris Xe / Apple M1 核显（调试可用，展厅不推荐）
- [ ] **内存**：16 GB（Chrome + Electron + Python TTS 后台 + 代码编辑器同时跑）
- [ ] **硬盘**：20 GB 可用（TTS 模型 1~2GB + Rhubarb 100MB + GLB 模型每个 50~200MB）
- [ ] **显示器**：1920×1080 及以上（看清 blendshape 细节）
- [ ] **音频输出**：任何 3.5mm / HDMI 声卡（调试音画同步必须能听见声音）
- [ ] **操作系统**：Win10/11（22H2+）/ macOS 13+ / Ubuntu 22.04 LTS

### 1.2 推荐（展厅级流畅 + 长时间跑）
- [ ] **GPU**：RTX 3060 12GB（52 组 ARKit blendshape + 光影 60 FPS）
- [ ] **CPU**：i7-12700 / Ryzen 7 7700
- [ ] **内存**：32 GB
- [ ] **SSD**：512GB 以上（大 TTS 模型加载快）

### 1.3 可选（离线 TTS / 神经口型）
- [ ] RTX 4070 Ti 12GB 及以上（跑 Wav2Lip / SadTalker / CosyVoice 离线 TTS）

---

## 2. 软件工具链（按安装顺序）

安装顺序建议：`Node.js → Python → FFmpeg → Blender → Rhubarb`

### 2.1 必装
- [ ] **Node.js 18 LTS**（项目里 `sdk`、`metahuman`、`metahuman-client*`、`audio-microphone` 全跑它）
  ```bash
  node -v  # ≥ v18.17
  npm -v   # ≥ 9
  ```
- [ ] **包管理：pnpm 或 yarn**（按项目已有 lockfile，别混）
  ```bash
  corepack enable
  pnpm -v
  ```
- [ ] **Python 3.10+**（`api/`、`api/asr/`、`metahuman-dispatcher` 都用）
  ```bash
  python --version    # ≥ 3.10, < 3.13
  pip --version
  ```
- [ ] **FFmpeg 5.0+**（TTS wav 格式转换、Rhubarb 前处理、音视频切片）
  ```bash
  ffmpeg -version   # 确认 libopus / libmp3lame 支持
  ```
  安装：Win 用 `winget install Gyan.FFmpeg`；mac 用 `brew install ffmpeg`。
- [ ] **Blender 3.6 LTS / 4.0 LTS**（检查 / 补 GLB 的 Shape Keys）
  ```bash
  blender --version   # ≥ 3.6
  ```
- [ ] **Rhubarb Lip Sync CLI 1.13+**（从 wav 分析出 viseme 时间戳，TTS 原生不支持时用它）
  ```bash
  rhubarb --version    # ≥ 1.13
  # 用法：rhubarb -f json -o output.json input.wav
  ```
  Windows 版：https://github.com/DanielSWolf/rhubarb-lip-sync/releases
- [ ] **Chrome / Edge 最新版**（调试 WebGL，带 Three.js Inspector 扩展）
  - 必装扩展：[Three.js Inspector](https://chromewebstore.google.com/detail/threejs-inspector/nolbudmdaedmfpddkgcdbipgpfpdoinb)
- [ ] **VS Code + 扩展**：
  - ESLint / Prettier / TypeScript
  - [WebGL GLSL Editor](https://marketplace.visualstudio.com/items?itemName=raczzalan.webgl-glsl-editor)（可选，写 shader）
  - Python / Pylance

### 2.2 强烈推荐
- [ ] **glTF Viewer（Web 版）**：https://github.khronos.org/glTF-Sample-Viewer-Release/ — 打开 GLB 直接看 morph target 是否存在、曲线对不对，省得本地装一堆。
- [ ] **[gltfjsx](https://github.com/pmndrs/gltfjsx)**（项目已装，全局也装一个方便命令行用）：
  ```bash
  npx gltfjsx woman.glb -o woman.tsx --shapes    # --shapes 保留 morph target
  ```
- [ ] **[Oculus LipSync for Web](https://developer.oculus.com/documentation/unity/audio-toolkit-lipsync/)**（当你想要 15 类 viseme + 中文模型时）。
- [ ] **Audacity**（免费音频编辑器，对比 "viseme 分析出来的嘴形" 和 "真实声波" 有没有明显错段）。

### 2.3 可选（神经网络 / 离线高质量）
- [ ] **CUDA 12.x** + cuDNN 8.9（跑 Wav2Lip / SadTalker / CosyVoice 离线 TTS）
- [ ] **PyTorch 2.x + diffusers + transformers**（跑 UNet/VAE 那套，参考 ExperienceRecall 1470483 的失败教训——先确认 TTS 模型 API 对得上再启用 OOM 优化）
- [ ] **Docker**：见本项目 `docker/` 目录，若做 TTS 容器化可直接改镜像。

---

## 3. 人员分工与能力要求

三端并行做建议 3 人；如果只有一个全栈 + 一个建模师，按优先级串行（第 1 周 WebGL MVP，第 2~3 周 UE5 + 2D）。

| 角色 | 人数 | 需要的能力 | 对应工作量 |
| --- | --- | --- | --- |
| **3D 建模 / 资产** | 0.5 | 会 Blender Shape Keys + 会看 ARKit 52 blendshape 标准；能把现有 GLB 补口型 blendshape 并导出 | 0.5 人·周 / 模型 |
| **后端 Python** | 1 | `api/main.py` 流处理；TTS 适配器改动；segment offset 累计；Rhubarb CLI 子进程调用（可选） | 1 人·周 |
| **前端 WebGL** | 1 | Three.js / R3F + `useFrame` 帧循环；`lerp` 平滑；`morphTargetInfluences`；Imperative ref | 1~2 人·周 |
| **SDK 协议 & 插件** | 0.5 | 熟 `sdk/src/sdk/components/core.js` + 5 个插件 speak 钩子 | 0.5 人·周 |
| **UE5 前端（可选）** | 0.5~1 | Electron + 会写 Pixel Streaming REST PUT；会跟 UE5 蓝图工程师沟通接口 | 0.5 人·周（前端）+ UE5 侧 1 人·周 |
| **2D 前端（可选）** | 0.5 | 会 Canvas / `<img>` 切换 + 交叉淡入淡出 | 0.5 人·周 |
| **2D 美术（可选）** | 0.1 | 出 8 张口型 sprite PNG | 0.1 人·周 |

最低可行组合：**前端 1 + 后端 1 + Blender 建模师 0.5**，合计 2.5 人能在 3 周内出 WebGL + 2D 两版 MVP。

---

## 4. Quick Start（5 步，一天内看到第一版嘴动）

### 第 ① 步：确认 GLB 有 blendshape（30 分钟）
```bash
# 打开 Blender → File → Import → glTF 2.0 (.glb) → 选 metahuman/public/models/woman.glb
# 选中 Head 相关 mesh → Properties → Data（绿三角）→ Shape Keys 面板
# 面板里必须能看到 jawOpen / mouthClose 之类的条目；看不到 → 找建模师补
```
看不到的话先补资产，**没 blendshape 前端改多少代码都看不到嘴动**。

### 第 ② 步：拿一段 wav 用 Rhubarb 跑一遍（10 分钟）
```bash
cd <项目根>
# 随便找一段短 wav，没有的话用 TTS 合成一句：
ffmpeg -i test.wav -ar 16000 -ac 1 -c:a pcm_s16le test_16k.wav
rhubarb -f json -o test_visemes.json test_16k.wav
cat test_visemes.json
# 应输出：{"mouthCues":[{"start":0.00,"end":0.12,"value":"X"}, ...]}
```

### 第 ③ 步：在 Web 页面里手动塞 `applyVisemes()` 验证（2 小时）
- 在 `metahuman/src/App.tsx` 里临时加一个 `<button onClick=...>`，点一下就：
  ```ts
  const vis = JSON.parse(fs.readFileSync('./test_visemes.json', 'utf8')).mouthCues
      .map(c => ({ t: c.start, p: c.value }));
  const audio = new Audio('/static/test_16k.wav');
  metahumanRef.current.applyVisemes(vis, audio);
  audio.play();
  ```
- 跑 `cd metahuman && npm run dev`，点按钮 **看到嘴动** 就说明资产 + 渲染端能闭环，后面都是工程化。

### 第 ④ 步：后端 api/main.py 调 TTS + Rhubarb 串出 payload（2 小时）
- 随便写个 Flask 路由：请求 TTS 一段文字 → 跑 Rhubarb 出 JSON → 组装成 `send-audio-text` 包打日志。
- 把 `test_visemes.json` 里的数组放进去，前端 `onServerMessage` 收到就调 `applyVisemes`。

### 第 ⑤ 步：SDK 透传 + 插件 speak() 钩子（1 小时）
- `sdk/src/sdk/components/core.js` 按 [02-data-flow-and-protocol.md](./02-data-flow-and-protocol.md) 加两行 `visemes` / `phonemes` 透传；
- `sdk/src/sdk/plugin/Web.js` 把 `visemes` 喂给 `api.applyVisemes(visemes)`。

**5 步跑通就算 MVP 落地，可以拉团队看效果再扩 UE5 / 2D。**

---

## 5. 自检 Checklist（提交 PR 前逐项核对）

### 5.1 资产层
- [ ] 所有在用 GLB（woman / wushi / zoulu / …）都已补 ARKit blendshape；
- [ ] Shape Key 命名与 `_lipSyncVisemeAdapter.js` 里的键完全一致（大小写敏感）；
- [ ] `--shapes` 参数重跑了 gltfjsx，确保导出组件保留 morph target。

### 5.2 后端层
- [ ] TTS 适配器新增 `return_phoneme_timestamps: true` 参数并确认返回；
- [ ] 流式 chunk 已用 `cumulative_offset` 修正 segment 边界；
- [ ] 当 TTS 不支持 phoneme 时自动 fallback 到 Rhubarb CLI（需能处理失败，返回空 visemes 不中断）。

### 5.3 协议层
- [ ] `visemes` / `phonemes` 两字段为可选；
- [ ] JSON schema 已加进 CI 校验；
- [ ] `sdk/README.md` + UE5 接入文档已同步更新。

### 5.4 WebGL 层
- [ ] `useImperativeHandle` 同时暴露 `applyVisemes / resetVisemes`；
- [ ] `useFrame` 用指数平滑（帧率无关），不是硬切；
- [ ] `audio.currentTime` 每 500ms 跟 viseme 时间轴做一次绝对校准，防漂移；
- [ ] 打断事件（SPEAK_PAUSE / interrupt-stream）会调 `resetVisemes` 回 Rest。

### 5.5 UE5 层
- [ ] `Set LipSync Cues` REST 端点已在 UE5 蓝图中创建；
- [ ] 无 visemes / 无 phonemes 时仍走原 `Change Current Status → speak1` 退化分支。

### 5.6 2D 层
- [ ] 8 张口型 sprite 全部能在 UI 里命中；
- [ ] 切换时用交叉淡入淡出，不是瞬间切换（闪）。

---

## 6. 常见踩坑提示

1. **morphTargetInfluences 写了没反应** → 99% 是模型没导出 Shape Keys，先回 Blender 看；再查 `morphTargetDictionary` 有没有对应键名（大小写/中英文）。
2. **音画漂移 500ms 以上** → 大概率是 segment offset 没算对，打印 `[cumulative_offset + cue.t]` vs `audio.currentTime` 对比。
3. **嘴形抖动厉害** → lerp 系数太小，调 `alpha = 1 - exp(-delta * 20)` 里的 20 → 到 30~40；再大就硬。
4. **Chrome Three.js Inspector 看不到 morph target 值** → 新版 Inspector 用"Attributes → morphTargetInfluences"而不是面板直接列。
5. **TTS 服务报错"不支持 phoneme"** → 先按 ExperienceRecall 1470483 经验：先跑最小函数级调用 + 关键阶段日志，确认是"接口本身不支持"而不是"参数名错了"再 fallback 到 Rhubarb。
6. **Electron Node 端 speakerWorker 播放时 currentTime 不可用** → 走 `metahuman-client-ue5/electron/speakerWorker.js` 已有的 "pcm bytes written / sampleRate" 反推时间，发到渲染进程当钟摆用。
