# 004-screen-switch · 两屏切换器（spec）

> 共享组件 `sub-pages/components/screen-switch/index.tsx`，左下角两屏手动切换按钮。

## props

| prop | 说明 |
| --- | --- |
| currentViewType | 当前视图（`ViewDimensionsTypes.Home` / `.Area`） |
| onMenuClick | 菜单点击回调，参数为目标视图类型 |

## 行为

- 互斥菜单：首页屏仅显示「重保区域」入口，区域屏仅显示「首页」入口
- hover 展开面板（CSS），点击菜单项触发 `onMenuClick`
- 素材：`images/switch-icon.png`、`switch-panel.png`、`menu-item-bg.png`、`icon-play.png`、`icon-stop.png`、`line.svg`

## 边界

- 组件本身不持有视图状态；实际切屏动作由 SubPageView（`sub-pages/index.tsx`）的回调完成
- 无自动轮巡、无倒计时（模块定案）
