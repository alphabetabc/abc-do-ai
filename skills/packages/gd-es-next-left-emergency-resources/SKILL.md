---
name: gd-es-next-left-emergency-resources
description: Maintains left emergency resources module. Invoke when modifying emergency resource charts, detail modals, resource tabs, APIs, or styles.
---

# left-emergency-resources

**Description:** Maintains left emergency resources module. Invoke when modifying emergency resource charts, detail modals, resource tabs, APIs, or styles.

## 适用场景

- 修改左屏"应急资源"组件展示、交互或样式
- 调整"实时出动 / 跨市调度 / 本地预置 / 全量资源"四个页签
- 修改 ECharts 柱图、tooltip、legend、x 轴排序或单位展示
- 修改资源清单弹窗、拖拽弹窗、详情表格列或数据转换
- 新增或调整应急资源相关 API、viewItemId、mock 地址、请求参数
- 调整 `gd-emergency-support.modules.emergency-resources` 环境配置

## 文档索引

按需求快速跳转：

| 需求                                  | 文档                                                     |
| ------------------------------------- | -------------------------------------------------------- |
| 找文件、改主组件状态、查派发逻辑      | [references/main.md](references/main.md)                 |
| 改 ECharts 柱图、x 轴排序、单位换算   | [references/chart.md](references/chart.md)               |
| 改 5 个详情组件字段、表格结构         | [references/detail.md](references/detail.md)             |
| 改 / 新增 API、viewItemId、入参响应   | [references/api.md](references/api.md)                   |
| 列宽配置、模态框宽度、`barModalWidth` | [references/modal-config.md](references/modal-config.md) |
| 改样式、关键 class                    | [references/style.md](references/style.md)               |

## 文件位置

```text
apps/main/app/components/left/emergency-resources/
├── index.tsx                                  # 主组件：图表、页签、弹窗分发
├── EmergencyResourcesDetail.tsx               # 实时出动清单详情
├── EmergencyResourcesCrossCityDetail.tsx      # 跨市调度清单详情
├── EmergencyResourcesFullDetail.tsx           # 全量资源清单详情
├── EmergencyResourcesPresetDetail.tsx         #本地预置普通资源清单详情
├── EmergencyResourcesPresetTeamDetail.tsx     # 本地预置队伍详情
└── index.css                                  # 图表、页签、弹窗、表格样式
```

## 关键速记

### 4 个页签

```text
实时出动  →  Detail          跨市调度  →  CrossCityDetail
全量资源  →  FullDetail      本地预置  →  PresetDetail (普通) / PresetTeamDetail (队伍)
```

### 3 处派发一致性

主组件中 3 处对弹窗的判断必须保持完全一致（标题 / 组件分发 / 配置 key）：

```text
"跨市调度"  →  CrossCityDetail  /  key: "跨市调度"
"全量资源"  →  FullDetail       /  key: "全量资源"
"实时出动"  →  Detail           /  key: "实时出动"
resourceType === "队伍"  →  PresetTeamDetail  /  key: "本地预置-队伍"
其他  →  PresetDetail  /  key: "本地预置"
```

详见 [main.md](references/main.md)。

### 弹窗宽度区分

| 触发     | 字段            | 配置缺省时的兜底 |
| -------- | --------------- | --- |
| 柱状图   | `barModalWidth` | 由 `Modal` 的 `width={modalWidth ?? 1900}` 兜底为 1900（已移除 `?? 900` 兜底） |
| 资源清单 | `width`         | 1900（代码内 `?? 1900`） |

详见 [modal-config.md](references/modal-config.md)。

## 相关入口

- `apps/main/app/components/left/index.tsx`：左屏入口
- `apps/main/request/custom/left.ts`：应急资源相关接口函数
- `apps/main/public/config/environment.json`：刷新间隔、x 轴换行和排序配置
- `apps/main/public/config/environment-local.json`：列宽配置（应急资源详情弹窗）

## 新增页签 / 资源类型流程

详见 [main.md](references/main.md) 末尾"常见修改流程"。

## 版本信息

- 项目：oss-visual-gd-emergency-support-next
- v1.0.0 (2024-06-20)：初始版本
- v1.0.1 (2026-06-10)：移除 `barModalWidth` 的 `?? 900` 兜底，配置缺省时统一回退到 1900（`Modal` 组件 `width={modalWidth ?? 1900}`）
