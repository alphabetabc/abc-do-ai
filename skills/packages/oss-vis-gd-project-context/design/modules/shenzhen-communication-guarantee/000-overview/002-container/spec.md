# 002-container · 面板容器（spec）

> 共享组件 `sub-pages/components/container/`，两屏所有 widget 壳的容器层。

## 组件构成

- `panel.tsx`：`Panel` / `PanelLeft` / `PanelRight` / `NoStylePanel`
- `context.tsx`：`ContainerContext`（`visible`）+ `Provider` + `useContainerContext`
- `panel-bg-svg.tsx`：面板 SVG 背景
- `panel.less`：面板样式
- 出口 `index.tsx`：导出 `ContainerProvider`、`PanelLeft`、`PanelRight`、`Panel`、`NoStylePanel`

## props（Panel / NoStylePanel 通用）

| prop | 说明 |
| --- | --- |
| title | 面板标题（渲染到 `.panel-title` / `data-panel-title`） |
| width / height | 面板尺寸（inline style） |
| className | 附加类名 |
| animateCss | 入场动画（animate.css 类白名单：fadeInLeft / fadeInRight / zoomIn / fadeInUp / animate_patch__opacityIn） |
| hideDestroy | true 时不可见即卸载（默认 false 保挂载） |
| children | 内容 |

- `PanelLeft` / `PanelRight`：固定 animateCss 的 Panel 封装（左入 / 右入）
- `NoStylePanel`：无 SVG 背景、无标题栏的裸容器（地图、轮巡等自绘面板用）

## 行为

- 动画开关：environment `shenzhen-communication-guarantee.viewManager.enableViewAnimation`；关闭时入场动画不生效
- `visible` 由 ContainerContext 注入（SubPageView 按 currentViewType 提供），控制切屏时的入场动画触发

## 边界

- `hideDestroy=false`（默认）时切换屏幕不卸载面板，仅动画层变化
