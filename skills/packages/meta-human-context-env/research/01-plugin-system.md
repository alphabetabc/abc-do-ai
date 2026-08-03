# 01. 数字人客户端插件体系

## 插件入口

`sdk/src/sdk/plugin/index.js`

```js
import Default from "./Default";
import Xmov from "./Xmov";
import Anhui from "./Anhui";
import Web from "./Web";
import Virtual3D from "./Virtual3D";

export const getHumanClient = (mode = "Default") => {
    const ClientNames = { Default, Xmov, Anhui, Web, Virtual3D };
    return ClientNames[mode];
};
```

> 模式选择由 `digitalHumanClient.mode` 决定（参见 `metahuman/environment.json` 或 `metahuman-client-ue5/electron/config.js`）。

## 统一接口（必须实现）

每个插件都是 `DigitalHumanSingleton` 类（同名但各自独立），对外暴露以下方法：

| 方法 | 用途 | 调用时机 |
| --- | --- | --- |
| `speak({content, speed, pitch, volume})` | 让数字人朗读一段文字 | 收到 `topic: unreal` 的服务端消息 |
| `prologue(msg)` / `epilogue(msg)` | 开场 / 退场 | 激活 / 反激活 |
| `setStatus({status})` | 切换状态（idle/speak/listen…） | 收到 `topic: status` 的服务端消息 |
| `interrupt()` | 打断当前播报 | 用户主动打断、或收到 `topic: chat type:question` |
| `switchRoles({appId, appSecret, roleId, animation})` | 切换角色 | 业务指令要求换数字人 |
| `chatMsg({type, msg})` | 把聊天消息推给客户端 UI | 显示问答气泡 |
| `show(duration)` / `hide(duration)` | 显示 / 隐藏数字人窗口 | 激活 / 退场 |
| `updateDigitalHumanStatus(type, payload)` | 通用更新接口（size / position / skin…） | 各种 UI 调整 |

## 五种插件的差异

| 插件 | 通信协议 | 适配场景 |
| --- | --- | --- |
| **Default** | 自研 YY 数字人协议 | 默认数字人实现 |
| **Xmov** | 有言数字人 API | 接入有言数字人服务 |
| **Anhui** | 安徽定制协议 | 安徽行业项目定制 |
| **Web** | 浏览器内 WebSocket（`window.MetaHuman.createDigitalHumanClientApi`） | 浏览器内集成数字人客户端 |
| **Virtual3D** | WebSocket 直连本地客户端（`ws://ip:5200`）+ Electron IPC | UE5/3D 桌面客户端（`metahuman-client-ue5`） |

## 单例 + 订阅广播

每个插件都包含：

1. **单例模式（`DigitalHumanSingleton.instance`）**：同一时刻只有一个客户端实例。
2. **订阅广播（`listeners: Set`）**：插件内部 `onmessage` 收到消息后 `listeners.forEach(fn => fn(data))`，SDK 组件通过 `subscribe(fn)` 拿到所有事件副本。

## Virtual3D 插件的特殊处理

```js
// sdk/src/sdk/plugin/Virtual3D.js
this.digitalHumanClient = new WebSocket(`ws://${ip}:${port}`);
this.digitalHumanClient.onopen = () => {
    defaultPosition && this.updateDigitalHumanStatus("position", defaultPosition);
    defaultSize && this.updateDigitalHumanStatus("size", defaultSize);
    this.updateLocation(); // 通知客户端当前 entryLocation
};
```

- **onopen 时**：自动同步初始位置、尺寸、入口位置。
- **每条消息发送前**：都先判 `readyState === WebSocket.OPEN`，避免断线时发送失败。

## 插件的"黑箱视图"

`Virtual3D.js` 顶部注释明确指出设计原则：

> 黑箱视图：不同数字人客户端的接口入参只存在于本插件的方法中，尽量对外暴露统一方法入参。数字人客户端消息回调同理。

这意味着上层（`core.js`、`useServiceClientWs.js`）永远只调用统一方法，无需关心底层是 WebGL、UE5、还是有言。