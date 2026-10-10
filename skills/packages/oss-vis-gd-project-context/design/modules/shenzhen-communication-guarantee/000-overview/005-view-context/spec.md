# 005-view-context · 跨屏视图上下文（spec）

> 共享组件 `sub-pages/components/view-context/index.tsx`（目录形式，入口 index.tsx）。

## API

- `ViewContext`：React Context，值类型 `TViewContext`
- `useViewContext()`：消费 hook

```ts
type TViewContext = {
    activeArea: TAreaViewItem | null;       // 当前激活区域
    setActiveArea: (area) => void;          // 仅更新区域上下文（不切屏）
    switchViewByArea: (area) => void;       // 携带区域上下文切到重保区域屏
    switchView: (viewType) => void;         // 纯切屏
};
```

`TAreaViewItem`：`{ id, name, [key: string]: any }`（即打点/轮巡的区域行数据）。

## Provider 挂载

- Provider 由 `SubPageView`（`sub-pages/index.tsx`）持有：内部维护 `activeArea` state，注入 context；`switchViewByArea` = `setActiveArea(area)` + 切区域屏
- 两屏的 widget 壳（首屏轮巡、区域屏轮巡、首屏地图 TOOLTIP）经 `useViewContext` 消费

## 使用方

| 使用方 | 用途 |
| --- | --- |
| home/area-carousel | 自动轮巡 `dispatch(activeArea)` 广播地图 TOOLTIP；点击卡片 `switchViewByArea` |
| area/area-carousel | 点击卡片 `setActiveArea`；`activeArea?.id` 作 defaultActiveItemId |
| home/center-map | TOOLTIP 浮层点击 `switchViewByArea` |

## 边界

- default value 全为空函数 / null——Provider 之外的消费不抛错但无效果
- activeArea 与 widget 交互字段是两条通道：view-context 管 React 树内共享，fields.subscribe/dispatch 管同屏 widget 间广播
