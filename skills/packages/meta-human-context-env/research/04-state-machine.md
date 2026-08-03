# 04. 状态机与动画映射

## 服务端定义的状态

`api/core/meta_human/meta_human.py` 维护一个数字人核心实例，对外只暴露"事件"。前端看到的状态枚举来自两处，略有不同：

### 前端 SDK 状态（sdk/src/sdk/enum/index.js）

```js
export const ServiceStatusEnum = {
    MICROPHONE_PICKUP: "microphonePickup",
    THINKING:          "thinking",
    LISTENING:         "listening",
    IDLE:              "idle",
};
```

### 客户端 UI 状态（metahuman/src/enums/index.ts）

```ts
export enum STATUS_TYPE {
    THINKING = "thinking",
    WAITING  = "waiting",
    LISTENING= "listening",
    SPEAKING = "speaking",
    IDLE     = "idle",
    DOZE     = "doze",
}
```

### UE5 客户端扩展状态（metahuman-client-ue5/src/App.tsx）

```ts
const statusToAnimation = {
    [STATUS_TYPE.IDLE]:   ["idle"],
    [STATUS_TYPE.SPEAK]:  ["speak1"],
    [STATUS_TYPE.THINK]:  ["think"],
    [STATUS_TYPE.LISTEN]: ["listen"],
    [STATUS_TYPE.SLEEP]:  ["sleep1", "sleep2"],
    [STATUS_TYPE.ENTER]:  ["enter"],
    [STATUS_TYPE.EXIT]:   ["exit"],
    [STATUS_TYPE.DANCE]:  ["dance1", "dance2", "dance3"],
    ["alarm"]:  ["alarm"],
    ["patrol"]: ["patrol"],
};
```

> 设计取舍：UE5 模型动画更丰富，所以多出 SLEEP / ENTER / EXIT / DANCE / alarm / patrol 等业务状态。

## 服务端 → 客户端 状态推送路径

```
api/core/meta_human_core.py
   ├─ 状态变化 (mhStatus)
   └─ broadcast(...)              (api/core/broadcast.py)
        │
        ▼  topic: status
WS 服务端 (digitalHumanService.ip:controlPort)
        │
        ▼
sdk useServiceClientWs.handleMsgDirectToClient
   topic === STATUS → setStatus({status: ServiceToClientStatusMap[serverStatus]})
        │
        ▼
clientRef.current.setStatus({status})     (plugin / WebSocket)
        │
        ▼
数字人客户端收到 → 调用本地渲染器切动画
```

## 动画驱动方式对比

| 模式 | 切动画的"命令" | 触发位置 |
| --- | --- | --- |
| WebGL 模式 | `actions["A1"]?.play()` | `metahumanRef.current.setDefaultState(...)` / 状态变化回调 |
| UE5 模式 | HTTP `PUT /remote/preset/MyPreset/function/Change%20Current%20Status` | `setUE5Status(animation)` |
| Virtual3D WebSocket | `{channel: "set-status", payload: {status}}` | `digitalHumanClient.send(...)` |
| 2D GIF 模式 | 切 `<img src={...}>` | React state 改变 |

## 空闲动画自动播放

UE5 客户端内置一个"idle 时随机播动画"的循环：

```ts
useEffect(() => {
    if (!quietMode && !playInfo?.isPlaying && !playInfo?.controlStatus) {
        timerRef.current = setInterval(() => {
            const randomAnimation = getRandomAnimation();
            setUE5Status(randomAnimation);
        }, controlStatusTime * 1000);
    }
}, [playInfo?.isPlaying, playInfo?.controlStatus, quietMode, controlStatusTime]);
```

- `quietMode`：是否启用空闲动画。
- `controlStatusTime`：多少秒触发一次。
- `animationPool`：从 `ueConfig.randomStatus`（如 `["sleep"]`）展开为动画池，逐次抽签避免重复。

这样即使没有用户交互，数字人也不会"一动不动站着"。

## 状态变化 = 主动 + 被动

| 类型 | 谁触发 | 示例 |
| --- | --- | --- |
| **被动** | 服务端广播 `status` | 用户说话 → `listening`；开始回答 → `thinking` → `speaking` |
| **主动** | 前端 SDK 或客户端主动调用 `setStatus` | 主动切到 idle 进入待机 |
| **联动** | 服务端发来的 `control` 消息中的 `METAHUMAN_CONTROL` | 强制切到某一状态（如开会模式强制 sleep） |

## 状态切换的"原子性"

WebGL 模式确保切换时不重入：

```ts
const onStatusChange = (status: string) => {
    if (animations[status] === latestAnimation.current) return; // 同一动作跳过
    if (latestAnimation.current) rendererRef.current?.stop(latestAnimation.current);
    if (animations[status]) {
        rendererRef.current?.play(animations[status]);
        latestAnimation.current = animations[status];
    } else {
        latestAnimation.current = null;
    }
};
```

UE5 模式则只做"随机选 + HTTP PUT"，不做 stop；由 UE5 端蓝图处理动画过渡。