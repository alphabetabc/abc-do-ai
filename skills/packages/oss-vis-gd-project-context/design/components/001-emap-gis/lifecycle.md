# emap-gis · 生命周期与调度

## 地图销毁

- `MapContext` 卸载时 `destroyMap(map)`（执行 `mapDestroyContext` 注册的销毁回调，含 TaskScheduler.destroy）+ `map.dispose()`
- 业务侧可经 `useEMapUtil('addDestroy')` 取销毁回调数组注册自定义清理

## TaskScheduler（emap-scheduler.ts）

- 每个 map 实例绑定一个 scheduler（`mapSchedulerContext` WeakMap）
- `addTask(queueName, task)` 入队，`requestIdleCallback`（剩余时间 >10ms）逐个执行；返回取消函数
- `clearQueue` / `flushHistoryQueue(queueName)`：队列暂存与恢复（切换时暂停，回来续跑）
- `destroy()`：清队列并标记销毁（在 map 销毁回调中自动执行）
- 取用：`useEMapUtil('getScheduler')`

## Widget 副作用模式

Widget 均为「render null + useEffect 副作用」模式：挂载时调用 EMapUtils 方法，拿到 `remove` 清理函数在卸载时执行；连续变化靠内部 count/abortFlag 防过期回调。
