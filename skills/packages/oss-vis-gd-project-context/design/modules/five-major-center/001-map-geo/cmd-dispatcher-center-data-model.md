# cmd-dispatcher-center · map-geo 数据模型

> 源码：`web/pages/five-major-center/cmd-dispatcher-center/modules/center/map-view/map-geo/` 下 `Points*.tsx`；接口层 `web/services/cmd-dispatcher-center/center-geo.ts`。
> **此份未接线**：该中心 map-view 实际使用 `map-gis/`，不引用 map-geo。以下仅描述代码现状。

## 三个统计接口

均 `viewPageId: 'command-dispatch-center-middle-page'`：

| API | viewItemId | children 分类字段 |
| --- | --- | --- |
| `getGuaranteeTaskDataApi` | `support-mission-statistics` | `emerEventTypeTop`（1/2/3 → 突发事件/重大活动/重要节假日） |
| `getNetworkDeviceApi` | `network-equipment-statistics` | `objectClass`（201 → 无线退服，10005 → 机房停电，olt → 传输中断） |
| `getEmergencyResourceApi` | `emergency-resource-statistics` | `deployState`（1 → 在用，2 → 空闲） |

## 返回结构

三者一致：`[{ name, zoneId, children: [原始行], longitude, latitude }]`。

- 接口未返回坐标时回退 mapConfig 的 `cp`，仍找不到则整点丢弃并 console.error。
- mock 仅 `public/static/mock/cmd-dispatcher-center/emergency-resource-point.json`（打点接口，非本组件）。
