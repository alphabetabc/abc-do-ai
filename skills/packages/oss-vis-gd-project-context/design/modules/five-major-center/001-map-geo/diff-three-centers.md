# map-geo · 三中心差异明细

> 三份拷贝同源演化，本文按维度对比差异。各中心完整说明见其 presets / data-model / interactions 三份文档（索引见 [README.md](./README.md)）。

## 总览

| 维度 | 综合展示中心 | 信息枢纽中心 | 指挥调度中心 |
| --- | --- | --- | --- |
| 接线状态 | 已接线 | 已接线 | **未接线**（map-view 用 map-gis） |
| presets 文件 | `presets.ts` | `presets.tsx`（含 JSX Icon） | `presets.ts` |
| 数据形态 | 数组（派生自 mapConfig，不发请求） | Map（regionId → 数据） | 数组（三接口） |
| 分类驱动数据 | 否（点位不随分类变，只变图标） | 是（viewItemUnitId 请求参数） | 是（分组切换渲染不同 Points 组件） |
| 点位渲染 | scatter series（图标随分类切换） | scatter series（图标随数据分级） | OverlayItem 子组件（图钉+计数） |
| 弹窗 | 独立 InfoCard.tsx + LineChart | index.tsx 内联模板驱动 | 无 |
| 轮询 | InfoCard 5 分钟 | 主数据 15 分钟 | 无 |

## 数据源差异

| 项 | 综合展示中心 | 信息枢纽中心 | 指挥调度中心 |
| --- | --- | --- | --- |
| services 文件 | `web/services/comprehensive-display-center/section-center.ts` | `web/services/information-hub-center/center.ts` | `web/services/cmd-dispatcher-center/center-geo.ts` |
| 主数据函数 | `getGuangdongProvincePointsApi`（mapConfig 派生） | `getCenterMapDataApi`（region-map） | `getGuaranteeTaskDataApi` / `getNetworkDeviceApi` / `getEmergencyResourceApi` |
| viewPageId | `comprehensive-exhibition-center-middle-page` | `information-hub-center-middle-page` | `command-dispatch-center-middle-page` |
| 分组 key | `zoneId` | `regionId` | `zoneId` |
| 明细字段 | `indicatorName` / `indicatorValue` / `indicatorUnit` | `traffType` / `kpiName` / `kpiValue` / `kpiUnit` | `emerEventTypeTop` / `objectClass` / `deployState` + `num` |
| 原始数据字段名 | `__rawData__`（尾下划线） | `__rawData`（无尾下划线） | 不挂 series |
| mock | 有（middle-page-{viewItemId}.json） | mock 已注释（走真实接口） | 仅 emergency-resource-point.json（打点接口，非本组件） |

## 分类（legendCategories）差异

- **comprehensive**：数组结构 `{ label, value, icon, children: [{ label, value, viewItemId, dataTypes }] }`；children 的 `viewItemId` 直接作为 InfoCard 趋势图请求参数；政企业务分类整块注释停用。
- **information-hub**：数组结构 `{ label, value, children: [{ label, value, Icon }] }`，经 `getCacheValue` 缓存；枚举值即 `viewItemUnitId` 请求参数；另有独立的 `infoCardTemplate` 配置（环境变量可覆盖）。
- **cmd-dispatcher**：`Record<分组, 颜色映射[]>`，只做图例颜色映射，不参与请求；分组定义在 `legendGroupTypes`。

## 交互差异

| 交互 | 综合展示中心 | 信息枢纽中心 | 指挥调度中心 |
| --- | --- | --- | --- |
| scatter 点击 | `__rawData__.zoneId` → mapConfig 反查 + geoSelect + 弹窗 | 直接 geoSelect + 弹窗（`__rawData`） | 无（点位为 OverlayItem，未绑点击） |
| geo 区域点击 | name/alias 反查 → dataItem（按 zoneId） | name/alias 反查 → `data.get(id)`，坐标取 `item.cp` | 上抛 `{ zoneId, zoneName, zoneLevel }` 给 `props.onRegionChange` |
| Legend 切换 | 单选 Checkbox，`EChartsMap key={legendGroup}` 整体重挂载，图标随分类切换 | 单选 Checkbox，refreshDeps 重拉数据并清弹窗 | tab 切换条件渲染 Points 子组件 |
| 弹窗位置翻转 | 全分类启用 | 事件/隐患/投诉三类跳过翻转 | 无弹窗 |
| 数据刷新重放 | 无 | 有（`useEffect([state.data])` 重放 onMapClick 刷新弹窗） | 无 |
| 弹窗内容 | 指标条 + LineChart（个人/家庭）/ 指标卡矩阵（网络规模） | infoCardTemplate 模板行（title/list） | — |

## geo 图层样式差异

三份 `geoBuilder` 均为四层 geo（描边层 / 底色层 / 粗边层 / 可交互层），前两层参数一致；差异集中在可交互层（第 4 层）的 top/bottom、选中色与 label 字号：

- comprehensive / information-hub：`selectedMode: true`，选中色 `rgba(21,135,196,1)`，comprehensive label 字号 16（info-hub 13.5）。
- cmd-dispatcher：无 `selectedMode` / select 态，底色 `rgba(68,75,84,1)`（另两份 `rgba(41,50,57,1)`），支持 `config.geoSilent` 外部静音。

## 维护提示

- 三份的 `syncState`（mapClick / missingTrigger）机制与 `onInfoCardPositionChange` 常量（`pos[1] + 576 - 80`，源自弹窗设计稿尺寸）为复制粘贴同源代码，修 bug 时建议三份同步评估（含未接线的 cmd-dispatcher 份是否需要）。
- comprehensive 的 `Points.tsx` 与 `useRefCache` 缓存为停用代码，属历史遗留；如需启用先确认与当前数据流（MapGeo 主数据不发请求）的兼容性。
