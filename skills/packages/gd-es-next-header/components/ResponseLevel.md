# ResponseLevel（[response-level/index.tsx](apps/main/app/components/header/response-level/index.tsx)）

响应级别容器的外壳组件。负责：

- 订阅 `widgetFields.supportTask`
- 将 `supportTask.id` 透传为 `eventId` 给 `MissionItem`
- 通过绝对定位 + 全局 CSS 限定 `MissionItem` 样式

## 渲染结构

```tsx
<div
    style={{ position: "absolute", top: -5, left: 850 }}
    className="ResponseLevelV2----root"
>
    <MissionItem eventId={supportTask?.id} />
</div>
```

## 关键点

- **定位**：`position: absolute; top: -5; left: 850;` —— 浮在 Header 上沿偏右
- **class 命名**：`ResponseLevelV2----root`（4 个 `-`）是约定的 BEM 风格根类，避免与其它模块冲突
- **样式覆盖**：本目录下 `index.css` 中的所有 `.ResponseLevelV2----root .mission-item ...` 选择器都用于在此范围内**覆写** MissionItem 默认样式（如 `level-info` 横排）

## 样式表（[response-level/index.css](apps/main/app/components/header/response-level/index.css)）

主要覆写：

| 选择器                                                          | 作用                                                       |
| --------------------------------------------------------------- | ---------------------------------------------------------- |
| `.ResponseLevelV2----root .mission-item .mission-item-header`  | 横排容器                                                  |
| `.ResponseLevelV2----root .mission-item .level-info`            | flex-direction: row，垂直居中                            |
| `.level-info-title`                                             | 20px 粗体，宽 48px 自动换行                              |
| `[data-id="province-response-level"]`                          | 加左右分隔线（`::before` / `::after`，1×26 灰色竖线）    |
| `.city-levels`                                                  | flex 横向                                                  |
| `.city-levels-header`                                           | 16px 白色，左右各 10px 间距                                |
| `.city-levels-section`                                          | 强制 `margin-top: 0 !important`                          |

## 常见修改

| 需求                            | 改哪儿                                                              |
| ------------------------------- | ------------------------------------------------------------------- |
| 调整浮层位置                    | `top` / `left` 数值                                                 |
| 重写 MissionItem 在此处的样式   | 在 `index.css` 内增加 `.ResponseLevelV2----root .xxx {...}` 选择器 |
| 改名（保持挂载点不破坏）         | 仅修改 `index.tsx` 内 `className`                                   |
| 替换为其它响应级别组件          | 改 `MissionItem` 引用为新组件并相应调整 `index.css`                |

## 依赖

- `@/store`：`useSubscribe`
- `../../fields`：`widgetFields`
- `./mission-item`：`MissionItem`
- `./index.css`：样式覆写

## 版本信息

记录本文档对应的源文件版本与变更历史。**修改源文件后请同步更新本节并追加一条记录。**

- 源文件：`apps/main/app/components/header/response-level/index.tsx`
- 配套样式：`apps/main/app/components/header/response-level/index.css`

| 版本    | 日期       | 变更说明 |
| ------- | ---------- | -------- |
| v1.0.0  | 2026-06-17 | 初始版本 |
