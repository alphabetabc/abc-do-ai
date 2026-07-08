# 故障排查速查

> 📌 本文是"症状 → 跳转"速查手册，不展开原理。点击症状查看详细排查步骤。

---

## 目录

- [§1 症状速查表](#1-症状速查表)
- [§2 关键 API 列表](#2-关键-api-列表)
- [§3 性能优化清单](#3-性能优化清单)

---

## 1. 症状速查表

| 症状 | 看哪里 | 排查步骤 |
| --- | --- | --- |
| **数据不更新** | [presets-config.md §2.3 轮询间隔](./presets-config.md#23-轮询间隔) | ① 检查 `environment.json` → `modules.network-conditions.request.interval` ② 验证 `currentZone` 切换 ③ 浏览器 Network 面板看请求 |
| **卡片不显示 / 数字恒为 0** | [presets-config.md §1.2 数据结构](./presets-config.md#12-viewitemdatatemplate-数据结构) | ① 检查 `item.items.length` ② 验证 `presets.ts` 与 API 返回的 `id` 一致 ③ 检查 `DataStatus` 的 `data` 属性 |
| **组合卡片不显示** | [presets-config.md §1.4 添加组合指标](./presets-config.md#14-添加组合指标推荐方式) | ① 确认 `groupViews.children` 已配置 ② 旧 `groupId` / `groupLabel` 已废弃，不要用 |
| **轮播不切换** | [carousel-components.md §3 carouselNormal](./carousel-components.md#3-carouselnormal默认) | ① 检查 `groupViews` 长度是否 > 1 ② 验证 `Carousel` 的 `dots` 属性 ③ 轮播容器尺寸 |
| **carouselSection 不生效** | [carousel-components.md §4 carouselSection](./carousel-components.md#4-carouselsection分段轮播) | ① `groupViewType: "carouselSection"` 已设置 ② `groupViews` 每 section 含 `id` / `label` / `children` ③ `CarouselSection` 已导入 |
| **图表不显示** | [presets-config.md §2.1 图表系列](./presets-config.md#21-图表系列配置unitidsettings) + [detail-component.md §3 remount](./detail-component.md#3-强制-remount-机制) | ① `indItem` 不为 null ② `dataTime` 有效 ③ `unitIdSettings` 配齐 ④ 控制台无错误 |
| **选中状态丢失** | [main-render-flow.md §5 选中态与激活联动](./main-render-flow.md#5-选中态与激活联动) | ① 验证 `activeIndItem` 更新 ② 区域切换时 `currentActiveIndItem` 重置 ③ Detail 的 `key={detail-${zoneId}}` |
| **不要扩展 idMap** | [principles.md §2 反面案例](./principles.md#2-反面案例idmap-硬编码) | ⚠️ `index.tsx` 中的 `idMap` 已确认**冗余**，新功能请走 `groupViews.children` 配置驱动 |
| **API 返回空** | [presets-config.md §1.2](./presets-config.md#12-viewitemdatatemplate-数据结构) | ① 模板为空 → `[]` ② 请求失败 → `defaultData` ③ 后端空 → 完整结构 + `data: {}` |
| **故障清单打不开** | [fault-list-table.md §8 常见维护任务](./fault-list-table.md#8-常见维护任务) | ① `onShowDetailList` 回调路径 ② `currentIndItem.id` 有值 ③ `environment.json` 列配置 |
| **故障清单列错乱** | [fault-list-table.md §6 列配置](./fault-list-table.md#6-列配置environmentjson) | ① `rightNetworkCompactFaultListTable.columns` 的 `unitId` 匹配 ② `fieldName` 与后端 schema 一致 ③ `renderType` 在 `cellRenderMap` 中已注册 |
| **区域参数错误** | [fault-list-table.md §4 请求参数拼接](./fault-list-table.md#4-请求参数拼接规则核心配置逻辑) | ① 检查 `ZoneLevelEnum` ② 确认 `parentName` / `regionName` ③ `type === "all"` vs `"part"` 区别 |

---

## 2. 关键 API 列表

| API | 用途 | 请求文档 |
| --- | --- | --- |
| `getNetworkSituationApi` | 主数据（无线 / 动环 / 传输 / 集客 / 家客） | http://10.10.2.8:9091/project/1179/ |
| `getRightNetworkScaleDetailLineChartDataApi` | 趋势图（折线图）数据 | 同上 |
| `getRightNetworkScaleDetailBarChartDataApi` | 区域统计（柱状图）数据 | 同上 |
| `getModalFaultListTableDataApi` | 故障清单弹窗数据 | 同上 |

> 💡 调试时在浏览器 Network 面板过滤这些接口名。

---

## 3. 性能优化清单

| 优化点 | 实现方式 | 详见 |
| --- | --- | --- |
| **避免重复计算** | `useMemo`（如 `viewItemData` 拆分、激活项计算） | [main-render-flow.md §2](./main-render-flow.md#2-数据拆分usememo-计算-left--right) |
| **稳定函数引用** | `useMemoizedFn` 包装事件处理 | [main-render-flow.md §6](./main-render-flow.md#6-顶部与底部容器) |
| **懒加载图表** | 图表挂载在 `DataStatus` 内，未入视口不渲染 | [presets-config.md §2.3](./presets-config.md#23-轮询间隔) |
| **合理轮询间隔** | `environment.json` → `interval`，建议 300 秒 | [presets-config.md §2.3](./presets-config.md#23-轮询间隔) |
| **避免 useEffect 重算** | 派生数据放 `useMemo` | [main-render-flow.md §2](./main-render-flow.md#2-数据拆分usememo-计算-left--right) |
| **合理分片渲染** | `chunk(items, 2)` 按 2 项/页 | [carousel-components.md §3](./carousel-components.md#3-carouselnormal默认) |
| **`useRequest` ready 守卫** | 参数不就绪时跳过请求 | [presets-config.md §1.2](./presets-config.md#12-viewitemdatatemplate-数据结构) |

---

## 4. 区域级别参数

> 📌 各级别（省 / 市 / 区县 / 乡镇）的 `parentName` / `regionName` 参数调整规则以 [fault-list-table.md §4](./fault-list-table.md#4-请求参数拼接规则核心配置逻辑) 为准（含 `type === "all"` 和 `type === "part"` 两种请求的参数差异）。
>
> 修改时请保持与 `apps/main/app/components/enum.ts` 的 `ZoneLevelEnum` 枚举值一致。

---

## 相关文档

- [presets-config.md](./presets-config.md) — 配置文件（所有配置项速查）
- [main-render-flow.md](./main-render-flow.md) — 主组件渲染流程
- [principles.md](./principles.md) — 配置驱动原则、idMap 反例
- [sub-components.md](./sub-components.md) — 子组件 Props
- [carousel-components.md](./carousel-components.md) — 轮播组件
- [detail-component.md](./detail-component.md) — 详情弹窗
- [fault-list-table.md](./fault-list-table.md) — 故障清单弹窗
- [overview.md](./overview.md) — 历史演进 / 旧方案
