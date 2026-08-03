# 05. WebSocket 协议

## 三条 WS 连接

| 连接名 | 端口/URL | 角色 | 文档 |
| --- | --- | --- | --- |
| **数字人服务端** | `ws://{digitalHumanService.ip}:{controlPort}` | 后端 → SDK | `sdk/src/sdk/service/basicWs.js` |
| **数字人客户端（Virtual3D）** | `ws://{digitalHumanClient.ip}:5200` | SDK → 桌面端 | `sdk/src/sdk/plugin/Virtual3D.js` |
| **数字人客户端（Web）** | `window.MetaHuman.createDigitalHumanClientApi(...)` | SDK → 浏览器内子客户端 | `sdk/src/sdk/plugin/Web.js` |

> 还有 metahuman-dispatcher 那条独立 WS（8000），专管大屏控制，参见其专属 README。

## 服务端推给 SDK 的消息 topic

来源：`sdk/src/sdk/enum/index.js`

```js
export const ServiceMessageTopicEnum = {
    UNREAL:    "unreal",      // 数字人播报（含开/退场）
    STATUS:    "status",      // 状态变化（idle/speak/listen…）
    LOG:       "log",         // 业务日志
    ACTIVATION:"activation",  // 激活 / 反激活
    CHAT:      "chat",        // 聊天消息（含 controls）
    CONTROL:   "control",     // 操控指令（已少见，统一进 chat）
    REPORT:    "report",      // 复合播报任务（含多条 speak）
    DEEPTHINK: "deep-think",  // 思考链增量
};
```

## SDK 收到后做的事

### `topic: unreal`

`sdk/src/sdk/hooks/useServiceClientWs.js`：

```js
case ServiceMessageTopicEnum.UNREAL:
    if (source === ClientChannelEnum.PROLOGUE) clientRef?.current?.prologue?.(msg);
    else if (source === ClientChannelEnum.EPILOGUE) clientRef?.current?.epilogue?.(msg);
    else clientRef?.current?.speak?.({ content: msg, speed, volume, pitch, topic });
    break;
```

### `topic: status`

```js
case ServiceMessageTopicEnum.STATUS:
    const status = ServiceToClientStatusMap[serverStatus];
    if (status && !digitalHumanClientConfig?.statusHide?.includes?.(status)) {
        clientRef?.current?.setStatus?.({ status });
    }
    break;
```

> `statusHide`：可在 `digitalHumanClient` 配置中屏蔽某些状态不切换（如 `["idle", "listen"]`）。

### `topic: chat`

`sdk/src/sdk/components/core.js` → `onServerMessage`：

- 把问答 push 到 `mhChatMessage`（驱动 `<Chat>` 组件）。
- 如果 `data.controls` 数组里有动作，调用 `handleControls(controls)`。

### `topic: report`

`data` 是数组，每个元素形如 `{system_control: {...}, page_control: [...]}`。SDK 把它作为**待播放队列**：

```js
speakTasksRef.current.data = [].concat(data);
```

每次 `voice-end` 时从队头取下一个，再触发对应 controls。

## 服务端消息里夹带的操控指令

```js
export const ServiceControlActionEnum = {
    SELECTED_OPERATE:          "SELECTED_OPERATE",
    SELECTED_OPERATE_DOWNPLAY: "SELECTED_OPERATE_DOWNPLAY",
    SPEAK_PAUSE:               "SPEAK_PAUSE",
    ACTIVATION:                "ACTIVATION",
    CHAT_SHOW:                 "CHAT_SHOW",
    SWITCH_ROLES:              "SWITCH_ROLES",
    METAHUMAN_CONTROL:         "METAHUMAN_CONTROL",   // 数字人状态
    METAHUMAN_SET:             "METAHUMAN_SET",       // 数字人 size/position
};
```

每条指令由 `handleControls(event)` 统一分发：

```js
const handleControls = (event) => {
    [].concat(event).forEach((item) => {
        const { action, data } = item;
        switch (action) {
            case ServiceControlActionEnum.METAHUMAN_CONTROL:
                digitalHumanRef?.current?.setStatus?.({ status: data?.topic });
                break;
            case ServiceControlActionEnum.SWITCH_ROLES:
                digitalHumanRef?.current?.switchRoles?.(data);
                break;
            case ServiceControlActionEnum.SELECTED_OPERATE:
                data?.target && SelectedOperate(data);   // 操作大屏 DOM
                break;
            // ...
        }
    });
};
```

## SDK → 数字人客户端 的 Channel

来源：`sdk/src/sdk/enum/index.js`

```js
export const ClientChannelEnum = {
    ENTRY_LOCATION:    "entry-location",
    SEND_STREAM_TEXT:  "send-stream-text",
    INTERRUPT_STREAM:  "interrupt-stream",
    SWITCH_ROLES:      "switch-roles",
    SHOW:              "show",
    HIDE:              "hide",
    SET_SIZE:          "set-size",
    SET_POSITION:      "set-position",
    SET_STATUS:        "set-status",
    SET_SKIN:          "set-skin",
    PROLOGUE:          "prologue",
    EPILOGUE:          "epilogue",
    CHAT:              "chat",
    // ...
};
```

## 数字人客户端 → SDK 的 Event

```js
export const ClientEventEnum = {
    VOICE_START:           "voice-start",
    VOICE_END:             "voice-end",
    SUBTITLE_ON:           "subtitle-on",
    SUBTITLE_OFF:          "subtitle-off",
    RECEIVE_STREAM_TEXT:   "receive-stream-text",
    SELECTED_OPERATE:      "selected-operate",
    SELECTED_OPERATE_CANCEL:"selected-operate-cancel",
    CONTROL_COMMAND:       "control-command",
    ACTIVATION:            "activation",
    CHAT_MESSAGE:          "chat-message",
    CHAT_SHOW:             "chat-show",
    ENTRY_LOCATION:        "entry-location",
};
```

`RECEIVE_STREAM_TEXT` 特别重要：客户端把识别到的文字反向发回给服务端，进入问答循环（`sendQuestionApi(webServiceUrl, {data:{username, msg}})`）。

## entryLocation：上下文路由

```ts
const entryRef = useRef(common.entryLocation || window.location.pathname);
```

- 客户端 onopen 时上报 `entryLocation`，服务端据此决定激活哪条"业务流水线"（大屏路由 / 展厅页 / 子页面）。
- 上行 `topic: location` 也持续推送，路径变化时同步。

## 消息结构示例（来自 sdk/README.md）

```json
// 上行（SDK → 服务端）
{ "topic": "activation", "data": { "value": true }, "username": "User" }

// 上行（数字人客户端 → SDK）
{ "channel": "send-stream-text", "payload": {"text": "你好", "originData": {"interrupt": true}} }

// 下行（服务端 → SDK）
{ "topic": "report", "data": [{ "system_control": {...}, "page_control": [...] }] }
```

完整协议示例参见 `sdk/README.md` 和 `metahuman-client-ue5/docs/数字人接入文档.md`。