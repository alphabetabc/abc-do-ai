# 004-area-business · 网络规模（data-model）

> 接口源码：`web/services/shenzhen-communication-guarantee/home/section-right.ts`（`getNetworkScaleApi`）
> mock 数据：`public/static/mock/shenzhen-communication-guarantee/homepage-right-network.json`
> 接口契约（服务端文档）：`docs-api-backend/shenzhen-communication-guarantee/api-doc.md`「八、右侧-网络规模」
> 实现任务：task-2026-10-12-006（首次接数）、task-2026-11-10-001（契约变更，`key-guarantee-area-business` → `homepage-right-network`）

## 接口状态：已定稿并落码（2026-11-10 契约变更）

- viewItemId：`homepage-right-network`；请求参数：`viewPageArgs`（env 可覆盖，默认 `{}`）
- viewPageId：`open-close-ceremonies-view`（复用信管局视图页，2026-10-12 服务端确认）
- env key：`shenzhen-communication-guarantee.homeConfig.shenzhen-communication-guarantee-view-homepage-right-network`（可覆盖 `viewPageArgs` / `staticData` / `viewItemDataTemplate`；组件层另读 `pollingInterval`）
- 请求范式与模块既有约定一致：`baseUrlType: 'shenzhenMeetingViewService'` + `defaultConverter` + `viewItemDataFallbackApi` 兜底（key `open-close-ceremonies-view-homepage-right-network`）+ localMockUrl

## 接口响应（rows 平铺）

```ts
/** 接口 rows：areaName × indicatorName × indicatorType 组合，indicatorValue 为字符串 */
interface NetworkScaleRow {
    areaName: string;        // '深圳' | '重保区域'
    indicatorName: string;   // '基站' | '小区'
    indicatorType: string;   // '2G' | '4G' | '5G'（小写后匹配模板 key）
    indicatorValue: string | number;
    indicatorUnit: string;   // 单位（前端未消费）
}
```

## viewItemDataTemplate（树形模板，env 可覆盖）

出数范式（2026-11-10 起）：**三维匹配** —— rows 按 `indicatorType`（→ item.key 转小写）+ `indicatorName`（→ metric.label）+ `areaName`（→ metric.areaName）匹配，命中写 `metric.value = row.indicatorValue`；**未命中的 metric 保留模板默认 value**（模板默认值即兜底显示，5ga 低空站点靠此机制在后端补数前维持展示）。回填前深拷贝（`JSON.parse(JSON.stringify(...))`）不污染 env 模板。err / rows 空时返回模板本身。

```ts
/** 指标项：label/areaName 为匹配键（对应 rows 的 indicatorName/areaName），value 为模板默认值（兜底显示） */
interface AreaBusinessMetric {
    label: string;            // 基站 / 小区 / 5G-A低空站点
    areaName?: string;        // 深圳 / 重保区域（新契约起替代 valueField 的定位职责）
    value?: string | number;  // 接口回填后为 indicatorValue
}

/** 模板项：基站行（card1）或单值行（card2），key 对应 indicatorType 转小写 */
interface AreaBusinessItem {
    key: string;              // 2g / 4g / 5g / 5ga
    title: string;            // 2G / 4G / 5G / 5G-A低空站点
    viewType: string;         // card1 / card2
    children: AreaBusinessMetric[];
}
```

### 模板默认值结构（2026-11-10 起）

- card1 ×3：`2g` / `4g` / `5g`，children 恒 3 条（顺序即 Card1 呈现位）：
    - `[0]` 基站·深圳 → 左侧单值
    - `[1]` 基站·重保区域 + `[2]` 小区·重保区域 → 右侧 `A / B` 斜杠双值
- card2 ×1：`5ga`（5G-A低空站点，`areaName: '5GA'` 占位，接口无数据时显示默认 198）

默认值（PM 2026-10-20 需求原文沿用）：2G 3627/21/2468、4G 47200/293/2468、5G 49500/288/2468、5G-A 低空 198

## UI 消费结构（2026-11-10 接口化 + 轮询）

组件（`modules/area-business/index.tsx`）用 `useRequest` 拉取接口并轮询，直接渲染模板（无前端转换层）：

```tsx
const { pollingInterval } = useEnvironment('<env key>') ?? {};
const { data: items } = useRequest(() => getNetworkScaleApi(), {
    pollingInterval: pollingInterval || TIME_RANGE.MINUTE * 5, // 默认 5 分钟
});
```

- `const [leftMetric, ...rightMetrics] = item.children` 消费 card1 三条 children
- 指标数值 `Number(value ?? 0) || 0` 兜底显示 0

## 匹配键字典

| indicatorType（key） | indicatorName（label） | areaName | Card1 呈现位 |
| --- | --- | --- | --- |
| 2G/4G/5G | 基站 | 深圳 | 左单值 |
| 2G/4G/5G | 基站 | 重保区域 | 右斜杠前值 |
| 2G/4G/5G | 小区 | 重保区域 | 右斜杠后值 |
| （预留）5GA | 5G-A低空站点 | 5GA | card2 单值 |

注意：同一 `indicatorType+indicatorName` 若双 areaName 下发，三维匹配各自命中不覆盖；缺 `areaName` 匹配的旧二维逻辑已废弃。
