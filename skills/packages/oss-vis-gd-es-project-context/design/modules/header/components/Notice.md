# Notice（[Notice.tsx](apps/main/app/components/header/Notice.tsx)）

Header 右上角实时公告滚动条。包含一个图标方块 + 单行横向滚动文本，每 30s 轮询拉取新数据。

## 行为概述

1. **轮询**：`useRequest(getNoticeApi, { pollingInterval: 30s })`，数据为空时显示 `--`
2. **滚动判断**：`ResizeObserver` 监听 `realNoticeRef`，**比较 `realNoticeRef.scrollWidth` 与外层 `rootRef.clientWidth`（可视框宽）**
    - `scrollWidth > rootRef.clientWidth` → 启用滚动 + 拼接重复片段（无缝循环）
    - 否则取消滚动并隐藏重复片段
    - **注意**：不能直接用 `realNoticeRef.clientWidth` 判断。`real` 在 flex 布局下没有显式 `width` 约束，自身 `clientWidth` 会被子项累计宽度"撑"成 `≈ scrollWidth`，导致 `scrollWidth > clientWidth` 永远为 false、滚动永不触发
3. **滚动实现**：`requestAnimationFrame` 每帧 `translateX(-offset)`，累计 `deltaOffset=0.3px`，**到 `realNoticeRef.scrollWidth`（内容总长）归零**——第一份末尾时 duplicate 段正好在窗口左侧接续，实现真正的无缝循环
4. **可访问性**：`title={item.detail}` 鼠标悬停可看完整文本

## DOM 结构

```text
Root  (1580×52 flex)
├── 左侧图标方块 (52×52, 圆角 4,0,0,4, 渐变 #4C4C4C→#303030)
└── 滚动容器 (1519×52, 圆角 0,4,4,0, 半透明黑)
    └── track (flex 横向)
        ├── real   (实际公告列表，inline-block 20px 间隔)
        └── duplicate  (条件渲染：超出时才显示，重复内容实现无缝循环)
```

## 滚动参数

```ts
const runState = {
    deltaOffset: 0.3, // 每帧位移（像素）→ 调速改这里
    timer: null, // requestAnimationFrame id
    offset: 0, // 当前位移
    offsetMax: 0, // 边界（= realNoticeRef.scrollWidth，内容总长）
    cancelFlag: false, // 卸载哨兵
};
```

- **加速 / 减速**：改 `deltaOffset`（值越大越快）
- **改轮询周期**：改 `pollingInterval: TIME_RANGE.SECOND * 30` 的 `30`
- **回到原位**：`offset >= offsetMax` 时归零（此时 duplicate 段在窗口左侧无缝接续）

## 滚动判断参考

| 节点                        | 用途        | 说明                                                                  |
| --------------------------- | ----------- | --------------------------------------------------------------------- |
| `realNoticeRef`             | 被观察节点  | 监听其 `scrollWidth` 变化                                             |
| `rootRef`                   | 可视框基准  | `clientWidth` ≈ 1489（= 1519 - 30 padding），作为"是否溢出"的判断基准 |
| `realNoticeRef.scrollWidth` | `offsetMax` | 内容总长，决定一帧归零的时机                                          |

> 历史 BUG：曾用 `entry.contentRect.width`（≈ `real.clientWidth` ≈ scrollWidth）作判断，导致 `scrollWidth > contentRect.width` 永远为 false、滚动永不触发；后改用 `rootRef.clientWidth` 修复。

## 滚动判断的判断式

```ts
// Notice.tsx ResizeObserver 回调
if (entry.target === realNoticeRef.current) {
    // 正确：用可视框 rootRef.clientWidth 作基准
    const enableScroll = entry.target.scrollWidth > rootRef.current!.clientWidth;
    setState({ showDuplicate: enableScroll });
    runScroll(enableScroll);
}
```

## 数据结构

`getNoticeApi` 返回形如：

```ts
[
    { detail: string, renderKey: string, ...其它字段 },
    ...
]
```

- 每条 `item` 渲染为一个 inline-block `<div>`，间隔 500px（≈ 公告栏可视区 1489px 的 1/3）
- 重复片段使用 `key={`duplicate-${item.renderKey}`}` 区分

## 清理逻辑

`useEffect` 返回的清理函数会：

- `observer.disconnect()`：解绑 ResizeObserver
- `cancelAnimationFrame(runState.timer)`：停掉滚动
- `runState.cancelFlag = true`：阻止 `tick` 递归

## 常见修改

| 需求              | 改哪儿                                                                   |
| ----------------- | ------------------------------------------------------------------------ |
| 调速              | `runState.deltaOffset`                                                   |
| 改轮询周期        | `pollingInterval: TIME_RANGE.SECOND * 30`                                |
| 改图标 / 文案样式 | Root 容器下的图标方块与滚动容器 `style`                                  |
| 改色 / 改字体     | `fontFamily / color / fontSize / lineHeight`（real 与 duplicate 都要改） |
| 关闭循环滚动      | 注释 `showDuplicate` 与 `runScroll(enableScroll)` 调用                   |
| 改数据源 / 字段   | `getNoticeApi` 返回结构（[Apis.md](./Apis.md)）+ 渲染处 `item.detail`    |
| 点击公告跳转      | 给 real 节点加 `onClick` + 维护 selectedKey 状态                         |

## 依赖

- `ahooks`：`useRequest`、`useSetState`
- `lodash-es`：`isEmpty`
- `next/image`
- `styled-components`
- `@/request/header`：`getNoticeApi`
- `@/hooks/useIntervalTimer`：`TIME_RANGE`
- `@/images/icon-notice.png`

## 版本信息

记录本文档对应的源文件版本与变更历史。**修改源文件后请同步更新本节并追加一条记录。**

- 源文件：`apps/main/app/components/header/Notice.tsx`

| 版本   | 日期       | 变更说明                                       |
| ------ | ---------- | ---------------------------------------------- |
| v1.0.2 | 2026-06-22 | 公告条目间隔由 20px 调整为 500px（≈ 视口 1/3） |
| v1.0.1 | 2026-06-22 | 公告条目间隔由 5px 调整为 20px                 |
| v1.0.0 | 2026-06-17 | 初始版本                                       |
