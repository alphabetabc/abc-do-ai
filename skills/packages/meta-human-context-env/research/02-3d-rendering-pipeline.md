# 02. 3D 渲染管线

## 三种渲染后端

| 模式 | 仓库目录 | 技术栈 | 模型来源 | 适用 |
| --- | --- | --- | --- | --- |
| **WebGL** | `metahuman/`、`metahuman-client/` | `@react-three/fiber` + `@react-three/drei` + three.js | `.glb` 文件 | 浏览器内 / Electron 内做 3D 渲染 |
| **UE5 像素流送** | `metahuman-client-ue5/` | `@epicgames-ps/lib-pixelstreamingfrontend-ue5.5` + HTTP REST | UE5 实时渲染流 | 高质量角色、需要复杂光影物理 |
| **2D GIF** | `metahuman-client-2d/` | `gifler` + `<canvas>` | GIF / 序列帧 | 极轻量部署 |

## WebGL 渲染：组件树

```
App.tsx
└── <MetahumanWebGL />           (metahuman-webgl-render/index.tsx)
    ├── <Canvas>                 (R3F 画布)
    │   ├── <ambientLight>       (环境光)
    │   ├── <directionalLight>   (方向光)
    │   ├── <Model> (Model.tsx)  (gltfjsx 自动生成的 React 组件)
    │   │   ├── useGLTF(.glb)
    │   │   ├── SkeletonUtils.clone(scene)  // 共享骨骼实例
    │   │   └── useAnimations(animations, group)
    │   │       └─ actions[A1/A3/...] // 动画命名映射
    │   └── <OrbitControls>      (调试用摄像机控制)
    └── Chat / Status / SubTitle (UI 叠加)
```

## 关键依赖（package.json）

```jsonc
"@react-three/fiber": "...",
"@react-three/drei": "...",
"three": "...",
"three-stdlib": "...",
```

- `useGLTF`：加载 .glb 文件（自动 `useGLTF.preload(url)` 提前下载）。
- `useGraph`：把 GLTF 节点挂回 React 树。
- `useAnimations`：拿到所有动画 `actions`，通过 `actions[name].play()/.stop()` 控制。
- `SkeletonUtils.clone(scene)`：当一个场景里要放同一模型多份时必须 clone，否则共享骨骼会互相干扰。

## UE5 像素流送（Virtual3D 模式）

`metahuman-client-ue5/src/components/pixel-streaming-wrapper/index.tsx`

```ts
const config = new Config({ initialSettings });
const streaming = new PixelStreaming(config, {
    videoElementParent: videoParent.current,
});
```

- 视频流直接渲染到 `<div>` 中。
- 配套 `green-screen-canvas/index.tsx`：实时去除 UE5 的绿幕背景，便于合成到大屏。

### UE5 控制指令走 HTTP REST（非 WebSocket）

```ts
// App.tsx
fetch(`${ue5ClientServerUrl}/remote/preset/MyPreset/function/Change%20Current%20Status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        Parameters: { status: animation },
        GenerateTransaction: true,
    }),
});
```

- `Change Current Status`：切换动画状态（idle/speak1/dance1…）
- `Change Skin`：切换肤色

## 状态 → 动画 映射表

`metahuman-client-ue5/src/App.tsx`：

```ts
const statusToAnimation = {
    [STATUS_TYPE.IDLE]: ["idle"],
    [STATUS_TYPE.SPEAK]: ["speak1"],
    [STATUS_TYPE.THINK]: ["think"],
    [STATUS_TYPE.LISTEN]: ["listen"],
    [STATUS_TYPE.SLEEP]: ["sleep1", "sleep2"],
    [STATUS_TYPE.ENTER]: ["enter"],
    [STATUS_TYPE.EXIT]: ["exit"],
    [STATUS_TYPE.DANCE]: ["dance1", "dance2", "dance3"],
    // ...
};
```

WebGL 模式（`metahuman/src/components/metahuman-webgl-render/index.tsx`）用的是 `A1 / A3 / A4 / A6` 这种 GLB 内嵌的动画名：

```ts
const animations = {
    [STATUS_TYPE.IDLE]: "A1",
    [STATUS_TYPE.SPEAK]: "A3",
    [STATUS_TYPE.LISTEN]: "A4",
    [STATUS_TYPE.THINK]: "A6",
};
```

> 命名差异来自不同建模工具导出动画时的命名约定，但语义一致。

## 组件暴露的 imperative 接口

为了绕过 React 渲染周期直接控制 3D 模型，每个 renderer 组件都用 `forwardRef + useImperativeHandle`：

```ts
// metahuman-client/src/components/renderer/index.tsx
useImperativeHandle(ref, () => ({
    play: (action) => modelRef.current?.play(action),
    stop: (action) => modelRef.current?.stop(action),
}));
```

```ts
// metahuman-webgl-render/models/wushi.tsx
useImperativeHandle(ref, () => ({
    play: (action) => actions[action]?.play(),
    stop: (action) => actions[action]?.stop(),
}));
```

调用方（`metahuman-webgl-render/index.tsx`）：

```ts
useEffect(() => {
    metahumanRef.current.setDefaultState(animations[STATUS_TYPE.IDLE]);
}, [skin, role.name]); // 切换模型/皮肤后重置为 idle 动画
```