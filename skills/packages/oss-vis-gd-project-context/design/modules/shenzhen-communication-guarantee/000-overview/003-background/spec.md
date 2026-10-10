# 003-background · 全局背景（spec）

> 共享组件 `sub-pages/components/background/index.tsx`，两屏共用全屏背景。

## 实现

styled-components `Background`：absolute 全屏，背景图 `${staticAssets.imageRoot}/page-background.png`（`web/pages/shenzhen-communication-guarantee/images/page-background.png`），`background-size: 100% 100%`，`pointer-events: none`，`z-index: 1`。

## 边界

- 不拦截任何鼠标事件（pointer-events none）
- 背景图路径走 presets `staticAssets.imageRoot`，换图只改 images 目录同名文件
