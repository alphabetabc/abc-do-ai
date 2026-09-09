# TaskNameView（[TaskNameView.tsx](apps/main/app/components/header/TaskNameView.tsx)）

任务名只读展示组件。**当前在 AppHeader 中已注释**（仅保留文件，未实际挂载）。

## 行为

- 订阅 `widgetFields.supportTask.name`
- 绝对定位显示在 Header 左侧：`left-[38px] top-1/2 -translate-y-1/2`
- 文本样式：24px、白色、`Source Han Sans CN`

## 代码骨架

```tsx
"use client";
import { useSubscribe } from "@/store";
import { widgetFields } from "../fields";

export const TaskNameView = () => {
    const { supportTask } = useSubscribe({
        supportTask: widgetFields.getField("supportTask"),
    });

    return (
        <div
            className="absolute left-[38px] top-1/2 -translate-y-1/2 flex text-[24px] font-normal"
            style={{ color: "rgba(255, 255, 255, 1)", fontFamily: "Source Han Sans CN" }}
        >
            {supportTask?.name}
        </div>
    );
};
```

## 启用步骤

1. `AppHeader` 取消 `import { TaskNameView } from "./TaskNameView"` 注释（L7）
2. `AppHeader` 内取消 `<TaskNameView />` 注释（L17）
3. 注意：与 `<TaskSelect />` 都在 Header 左侧，需要协调 `left-[38px]` 与 `TaskSelect` 的 `minWidth`，避免重叠

## 常见修改

| 需求                | 改哪儿                                                              |
| ------------------- | ------------------------------------------------------------------- |
| 字号 / 颜色 / 字体  | `className` 与 `style`                                              |
| 位置                | `left-[38px] top-1/2 -translate-y-1/2`                              |
| 切换为可点击        | 包一层 `<button>` 触发任务列表抽屉                                  |

## 版本信息

记录本文档对应的源文件版本与变更历史。**修改源文件后请同步更新本节并追加一条记录。**

- 源文件：`apps/main/app/components/header/TaskNameView.tsx`

| 版本    | 日期       | 变更说明 |
| ------- | ---------- | -------- |
| v1.0.0  | 2026-06-17 | 初始版本（当前组件在 AppHeader 中已注释） |
