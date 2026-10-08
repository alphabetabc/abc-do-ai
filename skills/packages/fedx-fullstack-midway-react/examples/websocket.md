# 示例：WebSocket 实时推送

服务端 `@midwayjs/socketio` 推送 + 前端 `socket.io-client` 订阅。

## 1. 服务端 —— `src/socket/Socket.ts`

```ts
import { WSController, OnWSConnection, OnWSMessage, WSEmit, Inject } from '@midwayjs/decorator';
import { Context } from '@midwayjs/socketio';

@WSController('/ws')
export class SocketController {
    @Inject()
    ctx: Context;

    @OnWSConnection()
    async onConnectionMethod() {
        this.ctx.emit('message', 'connected!');
    }

    @OnWSDisConnection()
    async onDisconnect() {
        // 清理逻辑
    }

    /** 客户端 send('myEvent', data) 时触发，@WSEmit 自动把返回值 emit 到 'dispatch' */
    @OnWSMessage('myEvent')
    @WSEmit('dispatch')
    async gotMessage(data) {
        // 广播给命名空间内所有连接
        this.ctx.broadcast.emit('dispatch', data);
        return data;
    }
}
```

确保 `configuration.ts` 的 imports 中有 `socketio`，config 中：

```ts
socketIO: { cors: { origin: '*', methods: ['GET', 'POST'] } },
```

## 2. 前端订阅

优先使用项目内 hooks（`web/hooks/useSocketIOClient` 文件，导出名 `useWebSocketClient`），其底层即 socket.io-client：

```tsx
import { useWebSocketClient } from '~/web/hooks/useSocketIOClient';

function RealtimeWidget() {
    const socket = useWebSocketClient();
    useEffect(() => {
        if (!socket) return;
        const handler = (data) => setList(data);
        socket.on('dispatch', handler);
        socket.emit('myEvent', { type: 'subscribe', topic: 'alarm' });
        return () => socket.off('dispatch', handler);
    }, [socket]);
    // ...
}
```

## 3. 注意事项

- 服务端主动推送（非请求-响应）：在任意 service / task 中 `@Inject() io` 后 `io.of('/ws').emit('dispatch', data)`。
- 前后端 socket.io-client 与 @midwayjs/socketio 版本需匹配（项目常锁版本，勿随意升级）。
- 事件名（`myEvent` / `dispatch`）前后端约定一致，改动需两边同步。
