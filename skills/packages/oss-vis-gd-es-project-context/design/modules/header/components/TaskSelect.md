# TaskSelect（[TaskSelect.tsx](apps/main/app/components/header/TaskSelect.tsx)）

任务下拉选择器。负责：

1. 调用 `getGuaranteeTaskListApi` 拉取任务列表
2. 同步 URL `?taskId=&taskName=` 参数与列表首项
3. 将选中任务派发到 `widgetFields.supportTask` 全局字段
4. 监听用户切换任务，实时更新 `supportTask`

## Props

无外部 Props。内部状态全部由 `useSetState` 管理。

## 状态

```ts
{
    taskName: string | null,        // 选中任务名称
    taskId:   string | null,        // 选中任务 ID
    taskOptions: any[],             // antd Select options：[{ value: emerEventId, label: emerEventName, wdId, eventStartTime, eventEndTime }]
}
```

## 关键流程

### 初始化（`useRequest` 拉取列表）

```text
getGuaranteeTaskListApi()
  ↓ onSuccess(taskOptions)
const taskId   = searchParams.get("taskId") ?? first?.value ?? null
const taskName = searchParams.get("taskName") ?? first?.label ?? null
setState({ taskOptions, taskId, taskName })
  ↓
dispatch(widgetFields.getField("supportTask"), {
    id, name,
    wdId: first?.wdId || taskId,
    eventStartTime: first?.eventStartTime,
    eventEndTime:   first?.eventEndTime,
})
```

### 用户切换（`onTaskChange`）

```text
value (taskId)
  ↓
const option = taskOptions.find(item => item.value === value)
const taskName = option?.label
const wdId = option?.wdId || taskId
  ↓
setState({ taskId, taskName })
  ↓
dispatch(widgetFields.supportTask, {
    id, name, wdId,
    eventStartTime: option?.eventStartTime,
    eventEndTime:   option?.eventEndTime,
})
```

> 注意：原 `Modal.confirm` 二次确认逻辑已被注释，**切换即时生效**，无确认弹窗。

### 空列表兜底

```ts
if (isEmpty(state.taskOptions)) {
    return null;
}
```

## 样式要点（`StyledSelect`）

- selector 透明背景、去除 border
- 选中文字 36px、`Source Han Sans CN`、白色
- placeholder 同样 36px
- 下拉箭头 18px，色 `#fff`，整体 `scaleY(0.8)` 压缩
- 禁用时不显示箭头
- dropdown 选项 20px、白色

外层容器：`style={{ minWidth: 200, height: 50, fontSize: 16 }}`，`getPopupContainer={(trigger) => trigger}` 让下拉挂到当前容器内。

## 常见修改

| 需求                              | 改哪儿                                                          |
| --------------------------------- | --------------------------------------------------------------- |
| 任务列表接口/数据转换             | `apps/main/request/header.ts` 的 `getGuaranteeTaskListApi`      |
| 调整下拉字号 / 高度               | `StyledSelect` 内 `font-size` / `line-height`                   |
| 恢复切换确认弹窗                  | 打开 `onTaskChange` 内的 `Modal.confirm({...})` 代码            |
| 切换时附带额外字段（如创建时间）  | `setState` 与 `dispatch` 中追加字段                             |
| 不再依赖 URL 参数                 | 删除 `searchParams.get(...)` 兜底分支                            |

## 依赖

- `ahooks`：`useRequest`、`useSetState`、`useMemoizedFn`
- `antd`：`Select`
- `next/navigation`：`useSearchParams`
- `lodash-es`：`isEmpty`
- `styled-components`
- `@/store`：`useDispatch`
- `@/request/header`：`getGuaranteeTaskListApi`
- `../fields`：`widgetFields`

## 版本信息

记录本文档对应的源文件版本与变更历史。**修改源文件后请同步更新本节并追加一条记录。**

- 源文件：`apps/main/app/components/header/TaskSelect.tsx`

| 版本    | 日期       | 变更说明 |
| ------- | ---------- | -------- |
| v1.0.0  | 2026-06-17 | 初始版本 |
