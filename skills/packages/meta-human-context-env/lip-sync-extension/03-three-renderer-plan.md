# 03. 三端落地计划：WebGL / UE5 / 2D 客户端各端改造细节

> 三路渲染端各自的改动、代码位置、注意事项。
> 先做 **WebGL（`metahuman/`）** 拿演示效果，再扩 UE5 和 2D。

---

## 总体原则

- **命令式接口统一**：三端都暴露 `applyVisemes(cues) / resetVisemes()`，供 SDK 插件调用。
- **时间源统一**：用 `<audio>` / Electron `speakerWorker` 的 `currentTime` 当钟摆，绝对避免用 `performance.now()` 估时（会漂移）。
- **过渡统一**：嘴形切换一律用 lerp/指数平滑，禁用硬切。

---

## 方案 A · WebGL 端（先拿 MVP，最推荐的起点）

涉及目录：
- `metahuman/src/components/metahuman-webgl-render/models/wushi.tsx`
- `metahuman-client/src/components/renderer/models/scene.tsx`
- `metahuman-client/src/components/renderer/models/wushi.tsx`
- 以及所有 `*.tsx` 的 gltfjsx 自动生成组件（woman/zoulu 等）

### A.1 资产前置（必须先做）
- Blender 打开 GLB，确认 **Shape Keys（blendshape）** 已命名为 ARKit 标准：
  - `jawOpen` / `jawForward` / `jawLeft` / `jawRight`
  - `mouthClose` / `mouthFunnel` / `mouthPucker`
  - `mouthLeft` / `mouthRight`
  - `mouthSmile_L` / `mouthSmile_R` / `mouthFrown_L` / `mouthFrown_R`
  - `mouthDimple_L` / `mouthDimple_R`
  - `mouthStretch_L` / `mouthStretch_R`
  - `mouthRollLower` / `mouthRollUpper`
  - `mouthShrugLower` / `mouthShrugUpper`
  - `mouthPress_L` / `mouthPress_R`
  - `mouthLowerDown_L` / `mouthLowerDown_R`
  - `mouthUpperUp_L` / `mouthUpperUp_R`
  - `browInnerUp` / `browDown_L` / `browDown_R`
  - （口型部分至少要有 `jawOpen / mouthClose / mouthFunnel / mouthPucker / mouthSmile_*` 这 6 个，其余表情后期再加）

### A.2 代码改动：模型组件扩命令式接口
现有代码（以 `wushi.tsx` 为例）：

```ts
useImperativeHandle(ref, () => ({
    play: (action) => actions[action]?.play(),
    stop: (action) => actions[action]?.stop(),
}));
```

改造：

```ts
// ====================================
// 新增：口型驱动状态
// ====================================
const visemeQueueRef = useRef<{ t: number; p: string; w?: number }[]>([]);
const audioElRef = useRef<HTMLAudioElement | null>(null);
const targetInfluencesRef = useRef<Record<string, number>>({});     // 目标值
const currInfluencesRef = useRef<Record<string, number>>({});       // 当前值

// viseme → ArkIt blendshape 权重表（可做成 prop，方便不同角色调）
const visemeMap: Record<string, Record<string, number>> = {
    Rest: { jawOpen: 0 },
    A:    { jawOpen: 0.9, mouthClose: 0 },
    B:    { jawOpen: 0.3, mouthFunnel: 0.9 },
    C:    { jawOpen: 0.25, mouthSmile_L: 0.8, mouthSmile_R: 0.8 },
    D:    { jawOpen: 0.2, mouthPucker: 0.7 },
    E:    { jawOpen: 0.1 },
    F:    { jawOpen: 0.05 },
    G:    { jawOpen: 0, mouthClose: 1 },
    H:    { jawOpen: 0.15, tongueOut: 0.3 }
};

useImperativeHandle(ref, () => ({
    play:  (action) => actions[action]?.play(),
    stop:  (action) => actions[action]?.stop(),

    // ─ 新增 ──────────────────────────────────
    applyVisemes(cues: { t: number; p: string; w?: number }[], audioEl?: HTMLAudioElement) {
        visemeQueueRef.current = cues;
        if (audioEl) audioElRef.current = audioEl;
    },
    resetVisemes() {
        visemeQueueRef.current = [];
        targetInfluencesRef.current = {};
        currInfluencesRef.current = {};
        // 把所有 blendshape 归零
        Object.values(nodes).forEach((n) => {
            if (n?.morphTargetInfluences) n.morphTargetInfluences.fill(0);
        });
    }
}));

// ====================================
// 帧循环：查当前 viseme → 写 blendshape
// ====================================
useFrame((_, delta) => {
    const audioEl = audioElRef.current;
    const cues = visemeQueueRef.current;
    if (!audioEl || cues.length === 0) return;

    const t = audioEl.currentTime;  // ← 唯一可信的时间源
    // 1. 二分找 t 对应的 cue
    const cue = findCueAt(cues, t);  // O(log n)，手写或用 lower_bound
    const target = visemeMap[cue.p] ?? visemeMap.Rest;

    // 2. 多 cue 混合（当 cue.w 存在时线性混合 target）
    // （本段简化成单 target，留接口扩展）
    Object.assign(targetInfluencesRef.current, allKeysZero());
    for (const [k, v] of Object.entries(target)) {
        targetInfluencesRef.current[k] = v * (cue.w ?? 1);
    }

    // 3. 用指数平滑（帧率无关）把当前值拉向目标值
    const alpha = 1 - Math.exp(-delta * 25);  // 25 = 时间常数，越大越快
    for (const key of Object.keys(currInfluencesRef.current)) {
        currInfluencesRef.current[key] = lerp(
            currInfluencesRef.current[key],
            targetInfluencesRef.current[key] ?? 0,
            alpha
        );
    }

    // 4. 把 currInfluencesRef 的值写进 mesh.morphTargetInfluences
    const faceMesh = nodes.Face ?? nodes.Wolf3D_Head ?? findFaceMesh(nodes);
    if (!faceMesh || !faceMesh.morphTargetInfluences || !faceMesh.morphTargetDictionary) return;
    const dict = faceMesh.morphTargetDictionary as Record<string, number>;
    for (const [k, v] of Object.entries(currInfluencesRef.current)) {
        const idx = dict[k];
        if (idx != null) faceMesh.morphTargetInfluences[idx] = clamp(v, 0, 1);
    }
});
```

### A.3 外部注入音频元素（钟摆）
在 `metahuman/src/components/metahuman-webgl-render/index.tsx` 的 TTS 播放钩子（`useMessage` / `chat` 组件返回的 `playInfo`）里：

```ts
const onSpeakAudioReady = (audioEl: HTMLAudioElement, visemes) => {
    // 把 <audio> 元素和 visemes 一起塞给模型组件
    metahumanRef.current?.applyVisemes(visemes, audioEl);
    audioEl.addEventListener('ended', () => metahumanRef.current?.resetVisemes());
};
```

### A.4 验收标准
- [ ] 用 Blender 导出的 `woman.glb` 打开页面后说话，嘴动明显跟得上音节；
- [ ] 每 5 秒说话，口型不漂移、不累积偏差；
- [ ] 打断 / 切话题（`SPEAK_PAUSE` 指令）时嘴形快速回到 Rest（≤ 200ms）；
- [ ] 在 Chrome 的 Three.js Inspector 里能看到 morphTargetInfluences 的值在 0~1 之间平滑变化。

---

## 方案 B · UE5 像素流送端（质量最高）

涉及目录：
- `metahuman-client-ue5/src/App.tsx`
- `metahuman-client-ue5/docs/数字人接入文档-1.1.0.md`
- `sdk/src/sdk/plugin/Virtual3D.js`

### B.1 两条路线（UE5 工程内部决定，本仓只做适配）

| 路线 | 说明 | 本仓工作量 |
| --- | --- | --- |
| **B-1 MetaHuman Audio to Face 插件**（推荐） | UE5 端给 MetaHuman 挂 Audio to Face 蓝图，喂一段音频就自动出 800+ 面部曲线 | 极少，只要确保 `audioUrl` 推到 UE5 被 Audio to Face 拿到即可 |
| **B-2 外部 blendshape 数值推送** | 本仓把 phoneme→curve 映射表算好，每 33ms 打一组数值给 UE5 | 本仓需做时间轴驱动 + REST PUT 频控 |

推荐先拿 **B-1** 过效果，效果不满意再上 B-2。

### B.2 本仓改动（两条路线都要做的基础）

1. **Virtual3D.js 插件**（`sdk/src/sdk/plugin/Virtual3D.js`）：
   ```js
   // 原只切 status：
   fetch(`${ue5ClientServerUrl}/remote/preset/MyPreset/function/Change%20Current%20Status`, {
       method: "PUT", body: JSON.stringify({ Parameters: { status: "speak1" } })
   });
   // 新增：把 visemes/phonemes 和 audioUrl 一起发给 UE5
   fetch(`${ue5ClientServerUrl}/remote/preset/MyPreset/function/Set%20LipSync%20Cues`, {
       method: "PUT",
       body: JSON.stringify({
           Parameters: { audioUrl, visemes, phonemes, speechId, segmentId }
       })
   });
   ```
2. **UE5 工程侧约定**（不在本仓，但需约定接口）：
   - `Set LipSync Cues` 函数入参：`audioUrl (String)`, `visemes (String/JSON)`, `phonemes (String/JSON)`
   - UE5 内部起一个 Timeline，按 `visemes[i].t` 写 MetaHuman 面部曲线

### B.3 退化方案（"伪同步"过渡版）
如果 UE5 工程暂时没排期，可以先靠现有 `Change Current Status → speak1` 的整段动画 + **把 status 切换时机对齐到 `<audio>` 的 `play` 事件**，用户主观上就会觉得"嘴在动"。虽不是精确口型，但作为过渡方案零改造成本。

---

## 方案 C · 2D 客户端（最轻量，展厅大屏够用）

涉及目录：
- `metahuman-client-2d/src/App.tsx`
- `metahuman-client-2d/public/models/`

### C.1 资产准备
美术出 5~8 张口型 sprite（PNG）：
```
mouth_rest.png    # 闭唇
mouth_A.png       # 张嘴 啊
mouth_E.png       # 咧嘴 一
mouth_I.png       # 露齿 咿
mouth_O.png       # 圆唇 哦
mouth_U.png       # 嘬唇 呜
mouth_FV.png      # 咬唇 弗
mouth_MBP.png     # 闭嘴 嗯
```
放到 `metahuman-client-2d/public/sprites/` 下。

### C.2 代码改动
1. 预加载 8 张 sprite；
2. 暴露命令式接口：
   ```ts
   applyVisemes(cues: { t: number; p: string }[], audioEl: HTMLAudioElement) {
       this.visemeCues = cues;
       this.audioEl = audioEl;
       this.ticking = true;
       requestAnimationFrame(this.tick);
   }
   tick() {
       if (!this.ticking) return;
       const t = this.audioEl.currentTime;
       const p = findCueAt(this.visemeCues, t).p;
       this.mouthImg.src = `/sprites/mouth_${p}.png`;   // 或 A..H
       requestAnimationFrame(this.tick);
   }
   ```
3. 因为 2D 不存在"插值"概念，**切换时做 30ms 交叉淡入淡出**（透明度 alpha 从 0 拉到 1），避免闪烁。

### C.3 验收
- [ ] 8 张口型 PNG 都能命中；
- [ ] 切换没有肉眼可见的"闪白"；
- [ ] 播放完回 rest。

---

## 三端对比总结

| 维度 | WebGL（GLB） | UE5 像素流送 | 2D 客户端 |
| --- | --- | --- | --- |
| 效果 | 中（14~52 组 blendshape） | 高（MetaHuman 800+ 曲线） | 低（8 张 sprite） |
| 人员成本 | 前端 + 建模师补 blendshape | UE5 蓝图工程师 + 前端适配 | 前端 + 美术 8 张图 |
| 开发周期 | 2~3 周 | 2~4 周（UE5 侧为主） | 1 周 |
| 部署成本 | 浏览器即可，最低 | 需 GPU 机器跑 UE5 像素流 | 浏览器即可，最低 |
| 接入优先级 | 🔴 第一（拿 MVP 演示） | 🟡 第二（质量达标） | 🟢 第三（轻量场景备份） |

---

## 下一份文档

请阅读 [04-readiness-checklist.md](./04-readiness-checklist.md)，在动代码之前把硬件、软件、人员、依赖逐项核对完。
