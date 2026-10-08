# 003-open-and-close · 开/闭幕式视图

> 源码：`web/pages/info-management-bureau/sub-pages/open-and-close/`。信管局开/闭幕式视图（ViewDimensionsTypes.Open / Close 共用）：开闭幕式当天展示，以仪式场馆为中心的通信保障态势。

## 快速上手

- `index.tsx`：`OpenAndClose` 组件（接收 viewType / visible / stadiumImage / stadiumName / isStaticView props）+ `OpenAndCloseCenter`（静态背景导出，由 `sub-pages/index.tsx` 渲染）
- `modules/screen.ts`：`createLargeScreen('info-management-bureau-open-and-close')`
- `modules/fields.ts`：无交互字段声明
- 接口层：`web/services/info-management-bureau/open-and-close/`（section-left / section-center / section-right），viewPageId `open-close-ceremonies-view`，区域参数取环境配置 `info-management-bureau.openAndCloseConfig.area`，fallback url 以 `_<area>` 后缀区分

## widget 文档索引（按注册顺序）

| 子目录 | widget（注册名） | 布局 |
| --- | --- | --- |
| [001-wireless-scale/](./001-wireless-scale/spec.md) | 无线规模 | 60, 105 |
| [002-wireless-quality/](./002-wireless-quality/spec.md) | 网络质量-left | 60, 547 |
| [003-line-scale/](./003-line-scale/spec.md) | 专线规模 | 1395, 105 |
| [004-trunk-communication/](./004-trunk-communication/spec.md) | 集群通信 | 1395, 243 |
| [005-transmission-scale/](./005-transmission-scale/spec.md) | 网络资源 | 1395, 340 |
| [006-line-quality/](./006-line-quality/spec.md) | 网络质量 | 1395, 547 |
| [007-support-resource/](./007-support-resource/spec.md) | 保障资源 | 543, 830 |

每个子目录含 `spec.md`（组件构成与交互）+ `data-model.md`（接口与字段结构）。

另有模块目录 `center/`：`OpenAndCloseCenter` 静态背景（场馆图 + 场馆名，按 viewDimState 传入的 stadiumImage/stadiumName/stadiumId 渲染），不在 widget 注册表内。

## 交互

- open / close 由 `viewType` prop 区分，场馆图/标题来自 view-state 按日期匹配 settings 节点（见 [../000-overview/README.md](../000-overview/README.md#2-视图结构与切换机制核心)）
- 与 home 自动交替轮换（开闭幕式当天/前后），倒计时卡显示「XX倒计时 / 进行中」

## 维护准则

- fault 类卡片（`scale-fault-card.tsx`）用于带故障/告警数的资源项
- 区域参数只改 `openAndCloseConfig.area` 环境配置
