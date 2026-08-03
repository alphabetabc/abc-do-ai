# 05. 概念速查：viseme / phoneme / blendshape / ARKit / Rhubarb

> 不熟悉这些概念时翻一翻，避免开会鸡同鸭讲。

---

## 1. phoneme（音素）

耳朵能分辨的**最小语音单位**。

例（英文）：`/p/ /b/ /m/ /a/ /i/ /u/ /f/ /v/ /t/ /d/ /k/ /g/ /s/ /z/ /ʃ/ /ʒ/ …`

例（中文 IPA）：
- "你好" → `/n i x aʊ/`
- "我是" → `/w o ʂ ɻ/`

特点：
- 每个音素听感独立（/p/ 和 /b/ 能听出来不同）；
- 中文普通话约 40 个音素，英文约 44 个；
- TTS 后端（CosyVoice / GPT-SoVITS）原生返的就是 phoneme 时间戳。

---

## 2. viseme（视位 / 嘴型单元）

眼睛能分辨的**最小嘴型单位**。是 **phoneme 的视觉版**。

为什么不直接用 phoneme？
- 很多 phoneme 听感不同，但**嘴上动作一模一样**（/p/、/b/、/m/ 都是"双唇紧闭"）；
- 合并后数量从 40+ 降到 8~15 种，前端驱动简单得多。

常见三组标准：

### 2.1 Rhubarb（8 类，最常用、开源免费）
| 标签 | 含义 | 典型音素 | 看起来 |
| --- | --- | --- | --- |
| A | 大张嘴 | /a/ /æ/ /ɑ/ | 啊 |
| B | 半张嘴 + 圆唇 | /o/ /ɔ/ | 哦 |
| C | 半张嘴 + 咧嘴 | /e/ /ɛ/ | 欸 |
| D | 小圆唇 | /u/ /w/ /ʊ/ | 乌 |
| E | 微张嘴 | /ɪ/ /ə/ | 衣（轻） |
| F | 咬唇 | /f/ /v/ | 弗 |
| G | 闭嘴 | /p/ /b/ /m/ | 嗯 |
| H | 舌头贴牙 | /th/ /ð/ | 丝 |
| X/Rest | 放松（默认） | silence | 闭嘴休息 |

### 2.2 Oculus LipSync（15 类，Meta 官方，有 WebAssembly 版）
`sil, PP, FF, TH, DD, kk, CH, SS, nn, RR, aa, E, I, O, U`

### 2.3 Microsoft SAPI（21 类，Windows 内置）
`SP_VISEME_0` ~ `SP_VISEME_20`

### 2.4 我们项目用哪个？
建议**后端用 phoneme 做统一表示**（因为 TTS 原生出这个），渲染端各取所需：
- WebGL / 2D → 转 Rhubarb 8 类，简单；
- UE5 → 原封 phoneme 给 Audio to Face 插件，质量更高。

---

## 3. blendshape（变形目标 / morph target）

**一个 3D 模型在基础顶点之上定义的一组"位移目标"**。比如"张嘴"这个目标就是把下巴的每个顶点向下移动指定距离。

在不同工具中的叫法：
| 工具 | 叫法 |
| --- | --- |
| Blender | Shape Keys |
| Maya | Blend Shapes |
| 3ds Max | Morpher Modifier |
| Unity | Blend Shapes |
| Unreal Engine | Morph Targets |
| Three.js / glTF | morphTargetInfluences / morphTargetDictionary |

代码里（WebGL）怎么驱动：
```ts
// mesh 里必须同时有这两个属性
const mesh = nodes.Wolf3D_Head;
console.log(mesh.morphTargetDictionary);  // { jawOpen: 0, mouthClose: 1, ... }
console.log(mesh.morphTargetInfluences);  // Float32Array [0, 0, ...]  每项 0~1

// 张嘴 90%
mesh.morphTargetInfluences[mesh.morphTargetDictionary['jawOpen']] = 0.9;
```

驱动**多个** blendshape 组合就能做出任意表情：
- `jawOpen: 0.9 + mouthSmile_L: 0.8 + mouthSmile_R: 0.8` → 大笑
- `jawOpen: 0.2 + mouthPucker: 1` → 嘬嘴说话

---

## 4. ARKit 52 blendshape（苹果标准，行业默认）

苹果在 2017 年 iPhone X 上定义的 **52 个面部 blendshape 标准集**，现在几乎所有"面部驱动"工具（Face Cap、Live Link Face、MetaHuman、ARKit）都遵循它——**强烈建议项目建模按这个命名**，能无缝对接三大生态。

### 4.1 口型相关（至少补这 14 个，本次口型 MVP 用）
- `jawOpen`：下巴向下（张嘴）
- `jawForward`：下巴向前（地包天）
- `jawLeft` / `jawRight`：下巴左右歪
- `mouthClose`：上唇贴下唇（闭嘴）
- `mouthFunnel`：双唇向外噘（漏斗状，说"乌"）
- `mouthPucker`：双唇向里吸嘬（亲嘴状，更紧）
- `mouthLeft` / `mouthRight`：嘴整体左/右移
- `mouthSmile_L` / `mouthSmile_R`：左/右嘴角向上（笑）
- `mouthFrown_L` / `mouthFrown_R`：左/右嘴角向下（哭）

### 4.2 其他 38 个（表情，可后续补）
`mouthDimple_*`、`mouthStretch_*`、`mouthRoll*`、`mouthShrug*`、`mouthPress_*`、`mouthLowerDown_*`、`mouthUpperUp_*`、`browInnerUp`、`browDown_*`、`eyeBlink_*`、`eyeWide_*`、`eyeSquint_*`、`eyeLook*`、`noseSneer_*`、`cheekPuff`、`cheekSquint_*`、`tongueOut`…

完整列表（官方）：https://developer.apple.com/documentation/arkit/arfaceanchor/blendshapelocation

---

## 5. Rhubarb Lip Sync（一个命令行工具）

**开源免费的口型分析工具**：输入一段 wav（可选给文本做参考），输出 `[start, end, value]` 格式的嘴形时间戳。

### 5.1 能干嘛（我们的用途）
```bash
# 分析中文 "你好.wav" 并输出 Rhubarb 8 类嘴型的 JSON 时间戳
rhubarb -f json -o nihao.json nihao.wav

# 输出 nihao.json:
# {
#   "metadata": { ... },
#   "mouthCues": [
#     { "start": 0.00, "end": 0.12, "value": "X" },   # X = Rest
#     { "start": 0.12, "end": 0.20, "value": "C" },
#     { "start": 0.20, "end": 0.34, "value": "B" },
#     { "start": 0.34, "end": 0.48, "value": "G" },
#     ...
#   ]
# }
```
这个 JSON 就是我们协议里 `visemes` 的直接输入：转成 `[{ t: start, p: value }]` 即可。

### 5.2 什么时候用
- **首选**：TTS 服务原生不支持 phoneme timestamps 时（比如只给 wav，不给时戳），调用它补一下；
- **备选**：当 TTS 支持 phoneme 时，可以不用它，但它对中文/英文多语种鲁棒性还不错。

### 5.3 局限
- 不擅长极短音频（< 0.3s）；
- 对非英语以外语种的准确率略降，但**嘴型"看个大概"够用**；
- 首字前静默段识别不准，建议后端给前端时统一 `t=0` 对齐到音频真实起点。

官方：https://github.com/DanielSWolf/rhubarb-lip-sync

---

## 6. Oculus LipSync（Meta 官方，15 类，高精度）

Facebook / Meta 官方的 15 viseme 分类器，**精度比 Rhubarb 高**，对中文也比 Rhubarb 好（有专门中文模型）。

### 6.1 为什么在我们这里是可选项
- 分 Unity 版本和 C++ SDK；
- **Web 版**有第三方 WebAssembly 移植（`@drincs/ovrlipsync` 等，成熟度一般）；
- 如果后端跑 Python，建议 **Rhubarb 先上**，后期对精度不满意再换 Oculus。

15 类标签：`sil, PP, FF, TH, DD, kk, CH, SS, nn, RR, aa, E, I, O, U`（可直接对上 ARKit `jawOpen/mouthFunnel/mouthSmile/...`）。

---

## 7. lerp（线性插值）/ 指数平滑（防止嘴突跳）

blendshape 值不能"硬切"，否则嘴会像机器人一样一抽一抽。必须做平滑过渡。

### 7.1 lerp（线性插值）
```ts
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
// 每帧把 current 拉向 target 的 15%
current = lerp(current, target, 0.15);
```

**问题**：`0.15` 这个系数依赖 FPS。**60 FPS 每秒前进 60 × 0.15 ≈ 9 次"拉满"；30 FPS 每秒只拉 4.5 次**——同样代码在弱机上嘴动慢一倍。

### 7.2 帧率无关的指数平滑（本项目推荐）
```ts
// delta 是两帧之间的秒数（useFrame 的第二个参数）
const tau = 25;  // 时间常数，越大"拉得越快"
const alpha = 1 - Math.exp(-delta * tau);
current = lerp(current, target, alpha);
```
这样 60 FPS 机器和 30 FPS 机器的收敛速度一致。

推荐 tau 取值范围：
- 嘴型：**tau = 20~30**（又快又不抖）
- 眉毛：tau = 10~15
- 眼部眨眼：tau = 50~100

---

## 8. audio.currentTime（钟摆 / 时间轴唯一可信源）

HTML `<audio>` 元素的只读属性，返回"当前已经播放到第几秒"（float，默认分辨率约 250ms，**建议用 `requestAnimationFrame` 主动轮询**拉到 16ms 精度）。

为什么不能用 `performance.now()` + 偏移自己估？
- `audio.play()` 会被用户手势 / DRM / 解码器排队 延迟；
- Chrome 后台标签页会把 `setTimeout` 节流到 1s；
- 用户可能手动 seek 音频进度条。

唯一正确做法：**每帧 `audio.currentTime` 做二分查 cue**，每 0.5s 再绝对校准一次。

---

## 9. 概念关系总览

```
  (耳朵)          (经过映射)         (眼睛)            (驱动)            (最终效果)
 phonemes     ──────────────▶      visemes      ──────────────▶   blendshape    ──────▶   角色在说话
 /n i x aʊ/        40→8              A B C G          visemeMap       jawOpen=0.9
                                                  mouthSmile_*=...
                                                    ↑
                                              visemeToArkIt
                                              (本项目定义在
                                              _lipSyncVisemeAdapter.js)
```

一句话记忆：
- **phoneme = 听什么**
- **viseme = 看什么**
- **blendshape = 3D 顶点怎么动**
- **ARKit = 52 个 blendshape 的官方命名表**
- **Rhubarb / Oculus = wav → viseme 数组的分析器**
- **lerp / exponential smoothing = 防止嘴突跳的数学平滑**
- **audio.currentTime = 唯一可信的时间钟摆**
