# 001-home · 首屏视图

> 源码：`web/pages/shenzhen-communication-guarantee/sub-pages/home/`。screen-name：`shenzhen-communication-guarantee-home`。布局：顶部 5 类型统计 / 左 通信服务 / 中 地图 / 右 重保区域业务 / 底中 应急资源 + 区域轮巡。

## widget 索引

> 2026-10-10：004-03 迁移完成，首屏 6 块组件已实现并验收（联动交互待 005）。

| 子目录 | 内容 |
| --- | --- |
| [001-top-type-filter/](./001-top-type-filter/spec.md) | 5 类型统计 + 选中/取消三联动（005 已实施）；图标已就位 |
| [002-communication-service/](./002-communication-service/spec.md) | 通信服务：个人/家庭/政企 + 漫入TOP5（widget 源码目录 `modules/communication-service/`；接口 viewItemId 沿用信管局 `chbn-business-*`） |
| [003-center-map/](./003-center-map/spec.md) | 深圳地图 + 类型打点 + TOOLTIP 联动 + 类型图层过滤（005 已实施） |
| [004-area-business/](./004-area-business/spec.md) | 重保区域业务汇总（自写静态 UI；接口属 004-00 二-2 待开发） |
| [005-emergency-resource/](./005-emergency-resource/spec.md) | 4 类应急资源统计（无面板标题，NoStylePanel） |
| [006-safety-monitor/](./006-safety-monitor/spec.md) | 安全监测：2 指标纯静态（2026-10-21 新增，环境配置 staticData 直读，无 service） |
| [007-area-carousel/](./007-area-carousel/spec.md) | 区域轮巡（图片+名称，受类型联动；待 005） |

另有 `modules/home-background/`（首屏专属装饰背景层，单图 + visible 控制，z-index -2）不单独建子目录。

## 交互联动（本视图核心，属 005 待实施）

顶部类型选中 → `fields.ts` 广播 `areaTypeFilter` → center-map 图层过滤 + area-carousel 轮巡过滤；取消选中 → 恢复全部。地图打点点击 → `activeArea` → 切区域屏。

## 数据源

`web/services/shenzhen-communication-guarantee/home/`（见各 widget data-model.md；接口清单见 [../000-overview/README.md](../000-overview/README.md) §6）
