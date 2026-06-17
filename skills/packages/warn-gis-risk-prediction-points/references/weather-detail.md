# Weather Detail 天气详情 Hook

## 文件范围

- `apps/main/app/components/center/warn-gis/risk-prediction-points/weather/useDetail.tsx`
- `apps/main/app/components/center/warn-gis/risk-prediction-points/weather/StyledModal.tsx`（仅样式）

## 职责

`useWeatherDetail` 是一个 React Hook，封装了天气详情弹窗的**完整生命周期**：

1. 弹窗打开/关闭状态管理。
2. 点击天气卡片时设置请求参数。
3. 自动请求未来天气预报。
4. 渲染弹窗内容（当前天气概览 + 预报列表）。

被 `Weather` 组件调用，弹窗使用全局 `Modal` 渲染（**不走** `OverlayPointContext.createPortal`）。

## Hook 返回值

```typescript
const { detailContent, showDetail } = useWeatherDetail();
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `detailContent` | `JSX.Element` | 弹窗的完整 React 节点，直接 `<>{detailContent}</>` 渲染即可 |
| `showDetail` | `(info: any) => void` | 触发弹窗打开的回调，传入当前点位的天气数据 |

## 内部状态

```typescript
const [state, setState] = useSetState({
    open: false,
    detail: null as any,            // 当前点位的完整 weather 数据
    requestParams: null as any,     // 触发详情 API 的请求参数
});
```

## API 请求

### getMapWeatherWarningFeatureDetailApi

| 项目 | 说明 |
| --- | --- |
| 触发时机 | `requestParams` 被设置后自动触发 |
| 请求参数 | `{ zoneId: string, zoneLevel: string }` |
| 请求方式 | `ahooks useRequest`，`ready: isDefined(state.requestParams)` |
| 依赖追踪 | `refreshDeps: [state.requestParams]` |
| 调用位置 | `weather/useDetail.tsx` |

**后端接口**：

| 字段 | 值 |
| --- | --- |
| `viewPageId` | `guarantee-middle-page` |
| `viewItemId` | `weather-forecast` |
| `viewPageArgs` | `{ zoneId, zoneLevel }` |

**响应数据**（`data.viewItemData.rows`，每条记录字段）：

| 字段 | 类型 | 组件使用 |
| --- | --- | --- |
| `weatherDate` | `string` | 传给 `getDayDisplay` 转为"今天/明天/后天/周X"，并格式化为 `MM/DD` |
| `weatherTypeF` | `string` | 用 `weatherType` 列表匹配 `weatherIdF` 的图标渲染（**预留，当前未直接使用**） |
| `weatherTypeS` | `string` | 用 `weatherType` 列表匹配 `weatherIdS` 的图标渲染（**预留，当前未直接使用**） |
| `tempMin` | `string` | 显示最低温度 `{tempMin}℃` |
| `tempMax` | `string` | 显示最高温度 `{tempMax}℃` |
| `windDirF` / `windDirS` / `windPowerF` / `windPowerS` | `string` | **预留，当前组件未使用**（代码中有注释的备用实现） |
| `weatherIdF` | `string` | 用于查找天气图标（`weatherType` 列表中的 `id`） |
| `weatherIdS` | `string` | 用于查找天气图标（`weatherType` 列表中的 `id`） |
| `weatherTime` | `string` | 接口预报更新日期（**预留，当前未使用**） |
| `cityName` | `string` | 地市/区县名（**预留，当前未使用**） |

**错误处理**：无显式错误处理，API 返回空数组时详情弹窗不显示预报列表内容。

## showDetail 调用流程

```typescript
showDetail: (info: any) => {
    const weatherTypeItem = weatherType.find((d) => d.id === info.weatherId);

    setState({
        open: true,
        requestParams: {
            zoneId: info.zoneId,
            zoneLevel: info.zoneLevel,
        },
        detail: { ...info, weatherIcon: weatherTypeItem?.icon },
    });
}
```

**关键点**：

- `info` 是从 `Weather` 组件传入的当前点位的 weather 对象（`cityWeather` 数组中的一项）。
- `weatherIcon` 通过 `weatherType` 列表（`@/common/weather`）按 `info.weatherId` 匹配得到。

## 弹窗内容结构

弹窗分上下两部分：

### 上部分：当前天气概览

```text
┌──────────────────────────────────────┐
│   区域名            数据采集时间      │
│                                      │
│            26℃                       │
│                                      │
│   一小时降水          相对湿度         │
│     0mm              65%              │
└──────────────────────────────────────┘
```

字段来源：`state.detail`（即 `info` 加上 `weatherIcon` 字段）。

### 下部分：未来天气预报列表

```text
┌──────┬──────┬──────┬──────┬──────┐
│ 今天 │ 明天 │ 后天 │ 周四 │ 周五 │
│ 06/17│ 06/18│ 06/19│ 06/20│ 06/21│
│  ☁   │  ☀   │  🌧  │  ☁   │  ☀   │
│  ☁   │  🌧  │  🌧  │  ☀   │  ☁   │
│ 18/26│ 19/28│ 20/25│ 21/27│ 22/29│
└──────┴──────┴──────┴──────┴──────┘
```

字段来源：`featureDetail`（即 `getMapWeatherWarningFeatureDetailApi` 返回的 `rows`）。

**星期转换工具**（位于 `useDetail.tsx`）：

```typescript
const getDayDisplay = (date: string) => {
    const today = dayjs().startOf("day");
    const targetDate = dayjs(date).startOf("day");
    const diffDays = targetDate.diff(today, "day");
    if (diffDays === 0) return "今天";
    if (diffDays === 1) return "明天";
    if (diffDays === 2) return "后天";
    return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][targetDate.day()];
};
```

**图标匹配**（按 `weatherId` 查 `weatherType` 列表）：

```typescript
const iconTop = weatherType.find((item) => item.id === d.weatherIdF)?.icon;
const iconBottom = weatherType.find((item) => item.id === d.weatherIdS)?.icon;
```

> 注意：实际渲染使用 `IconFontWeather` 组件，通过 `type={iconTop}` 传入 icon 标识。

## 关闭流程

```typescript
onCancel={() => {
    setState({
        open: false,
        detail: null,
        requestParams: null,
    });
}}
```

点击弹窗关闭按钮（右上角 X）会重置所有状态，包括：

- `open = false` 隐藏弹窗
- `detail = null` 清空当前数据
- `requestParams = null` 触发 `useRequest` 的 `ready` 条件变为 `false`，自动停止后续请求

## 入参（Weather 组件调用）

```typescript
import { useWeatherDetail } from "./useDetail";

export const Weather = (props: any) => {
    const { detailContent, showDetail } = useWeatherDetail();
    // ...
    {(props.data ?? []).map((d: any) => {
        if (!("temp" in d) || d.temp === "") return null;
        return (
            <div onClick={() => showDetail(d)} key={...}>
                {/* 天气卡片 */}
            </div>
        );
    })}
    return (
        <>
            {detailContent}  {/* 弹窗：渲染到全局 Modal，不会被点位 portal 拦截 */}
            {/* ... 卡片列表 */}
        </>
    );
};
```

## 维护要点

- **不要**将弹窗改为 `OverlayPoint` portal 挂载，否则会被 `MutationObserver` 影响 zIndex，且弹窗是全屏居中显示，不属于点位附属。
- `weatherType` 列表是天气图标的元数据，新增/修改图标需同步 `@/common/weather`。
- 弹窗样式集中在 `StyledModal.tsx`，宽度由内容自适应（`width: "auto"`）。
- 预留字段（`windDir*` / `weatherTime` / `cityName`）如需启用，可取消代码中注释。
- 关闭时同步重置 `requestParams` 是关键，否则 `useRequest` 会持续触发。

## 已知问题与待办

### 字段未使用

`windDirF` / `windDirS` / `windPowerF` / `windPowerS` / `weatherTypeF` / `weatherTypeS` / `weatherTime` / `cityName` 字段在响应中可能存在但当前组件未使用，**如有业务需求可启用代码中注释的备用渲染**。

### 缺少错误处理

API 请求失败时（如网络异常）当前无任何提示，用户感知不到错误状态，建议后续补充 `onError` 处理。

## 依赖

| 依赖项 | 用途 |
| --- | --- |
| `getMapWeatherWarningFeatureDetailApi` | 预报数据请求（`@/request/center`） |
| `weatherType` | 天气图标元数据（`@/common/weather`） |
| `dayjs` | 日期处理（星期转换、MM/DD 格式化） |
| `IconFontWeather` | 天气图标字体组件（`@/app/components/ui/IconFont`） |
| `StyledModal` | 弹窗样式（`./StyledModal.tsx`） |

## 更新日志

| 版本  | 日期       | 变更说明                                                |
| ----- | ---------- | ------------------------------------------------------- |
| 1.0.0 | 2026-06-17 | 从 `weather.md` 拆分独立文档，补全 Hook 状态、API 字段、弹窗内容结构 |
