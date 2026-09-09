# AppHeader（[index.tsx](apps/main/app/components/header/index.tsx)）

顶部 Header 主组件，控制整体三段布局（左任务下拉 / 中标题 / 右公告）与背景色、`zIndex`，并挂载浮动的 `ResponseLevelV2`。

## 渲染结构

```tsx
<div className="w-full flex items-center px-5 justify-between relative" style={{ backgroundColor: "rgba(71, 78, 88, 0.74)", zIndex: 11 }}>
    {/* 左：任务下拉 */}
    <TaskSelect />
    {/* 浮动响应级别 */}
    <ResponseLevelV2 />
    {/* 中：标题（绝对居中） */}
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <h1 className="text-[48px] font-bold">广 东 移 动 应 急 保 障</h1>
    </div>
    {/* 右：公告 + 时间（注释） */}
    <div className="absolute right-[10px] top-1/2 -translate-y-1/2 flex">
        <div className="flex items-center gap-2 ">
            <Notice />
        </div>
        {/* <TimeDisplay /> */}
    </div>
</div>
```

## 关键点

- **背景色**：`rgba(71, 78, 88, 0.74)`（半透明深灰）
- **zIndex**：`11`（高于主要内容，确保 Header 永远置顶）
- **三段对齐**：`flex items-center justify-between` + 左右两侧子元素 `absolute` 居中
- **响应级别位置**：`<ResponseLevelV2 />` 通过自身 `position: absolute; top: -5; left: 850` 浮在 Header 上沿
- **已注释的组件**：`TaskNameView`（任务名只读展示）、`TimeDisplay`（时间显示），后续若需恢复展示，注释打开即可

## 常见修改

| 需求                | 改哪儿                                                                    |
| ------------------- | ------------------------------------------------------------------------- |
| 整体背景色 / zIndex | `index.tsx` L14–15 内联 style                                             |
| 标题文案 / 字号     | `<h1>` 标签文本与 `text-[48px]`                                           |
| 左右两栏位置        | `absolute right-[10px]`（右）、`flex` 中 `TaskSelect` 的 `minWidth`（左） |
| 整体左右内边距      | `px-5` 改为需要的间距                                                     |
| 启用 `TaskNameView` | 取消 `index.tsx` L7 import 注释、L17 注释，恢复 `<TaskNameView />`        |
| 启用 `TimeDisplay`  | 取消 `index.tsx` L3 import 注释、L27 注释，恢复 `<TimeDisplay />`         |

## 相关

- 子组件：
    - [TaskSelect.md](./TaskSelect.md)
    - [TaskNameView.md](./TaskNameView.md)（已注释）
    - [Notice.md](./Notice.md)
    - [ResponseLevel.md](./ResponseLevel.md)
- 样式辅助：`../style` 中的 `styles.header`

## 版本信息

记录本文档对应的源文件版本与变更历史。**修改源文件后请同步更新本节并追加一条记录。**

- 源文件：`apps/main/app/components/header/index.tsx`

| 版本   | 日期       | 变更说明 |
| ------ | ---------- | -------- |
| v1.0.0 | 2026-06-17 | 初始版本 |
