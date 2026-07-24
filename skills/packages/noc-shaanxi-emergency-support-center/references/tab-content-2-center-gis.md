# TabContent2 · CenterSuddenGis（突发保障 GIS 壳）

突发保障 GIS 视图的壳组件。仅做包壳，**没有返回按钮**（与 TabContent1 的 `CenterGis` 关键差异）；返回按钮直接写在子组件 `Gis` 里，且只在 `leftRepairNoticeParams` 存在时出现。

- 源文件：[center-gis/index.tsx](web/pages/emergency-support/modules/center/components/tab-content-2/components/center-gis/index.tsx)
- 子组件：[Gis](web/pages/emergency-support/modules/center/components/tab-content-2/components/center-gis/components/gis/index.tsx)

## 职责

1. 把 `{...props}` 透传给 `Gis`
2. **不做状态管理**：地图、图例、打点、返回按钮、区域配置、抢修回流全在 `Gis` 内部

## 渲染

```tsx
import { useEnvironment } from '~/web/hooks/useEnvironment';
import { constants } from '~/web/common/constants';

export const CenterSuddenGis = (props) => {
    const { emergencySupportGisConfig } = useEnvironment();
    const { showSatelliteBackgroundMap } = emergencySupportGisConfig;

    return (
        <div
            className="emergency-support-center-sudden-gis-root"
            style={{
                backgroundImage: showSatelliteBackgroundMap
                    ? `url(${constants.IMAGE_PATH}/emergency-support/卫星地图.png)`
                    : '',
            }}
        >
            <Gis {...props} />
        </div>
    );
};
```

> 卫星地图背景（commit `2bd9eee` 引入）与 tab1 的 `CenterGis` 共用同一份实现，差异只在 className。`.less` 中原本写死的 `background: url(...)` 已被注释，避免和 inline style 冲突。

## className

- 根：`emergency-support-center-sudden-gis-root`

## 与 TabContent1 · CenterGis 的关键差异

| 项 | tab1 CenterGis | tab2 CenterSuddenGis |
|---|---|---|
| 返回按钮 | **始终显示**（`.back`） | 只在 `leftRepairNoticeParams` 存在时显示，写在 `Gis` 内 |
| 乡镇名称图层 | 存在 | **不存在**（tab2 无乡镇维度） |
| 抢修回流判断 | `props.zoneTownSelect` 存在 → 乡镇→区县 | `leftRepairNoticeParams` 存在 → 直接聚焦到告警网元 |
| 区域配置 | 无 | **有**（4 个区域切换、`Modal` 配置） |
| dispatchZone | 间接通过父组件 | 局部 `currentArea` |
| 容器 id | `emergency-gis-map1` | `emergency-gis-map2` |

## 关键 props（透传）

- `currentTabType === TabChangeEnum.tab2`：作为子组件 7 类 `useRequest` 的 `ready` 守卫（含 `dataAreaSetting` 区域列表请求）
- `dateTimeSelect / dateTimeRefreshFixed`
- `leftRepairNoticeParams`
- `dispatch`

## 易踩坑

- 不要在这个壳里加任何 state——会和子组件 `Gis` 内部 state 冲突
- 新增 props 必须同步透传给 `Gis`，否则断链
- 子组件的路径、组件名（例如 `Gis`）要保持一致，否则 props 不通
- 卫星地图背景在 commit `2bd9eee` 之后改用 inline `style.backgroundImage`（与 tab1 的 `CenterGis` 同款）；**不要**在 `.less` 写 `background: url(...)`

> 版本：v1.1 · 更新日期：2026-07-23（同步 `2bd9eee` 卫星背景改为 inline style）
