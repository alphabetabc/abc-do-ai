# 004-area-business · 重保区域业务汇总（data-model）

> 接口源码：`web/services/shenzhen-communication-guarantee/home/section-right.ts`（当前仅含文件头注释，**无已实现接口**）
> mock 数据：暂无（`public/static/mock/shenzhen-communication-guarantee/` 下无本模块对应 JSON）
> 公共请求层（未来落码时使用）：`web/services/request/getViewItemData.ts`（POST `view/getViewItemData`，converter 后取 `data.viewItemData.rows`）

## 接口状态：未定义（挂 004-00 二-2，不进代码）

- 重保区域业务汇总（2G/4G/5G 基站与小区、通感站、重保专线）：信管局无对应可复用接口，走新增接口，属 004-00 二-2（已服务端沟通，待开发）
- 接口形态（viewItemId / viewPageId / viewPageArgs / 返回形状）待服务端定义后再落码，当前 `web/services/shenzhen-communication-guarantee/home/section-right.ts` 只保留文件头注释占位
- 落码时建议沿用本模块既有范式：`baseUrlType: 'sceneViewService'` + `defaultConverter` + `viewItemDataFallbackApi` 兜底 + 本地 mock（`public/static/mock/shenzhen-communication-guarantee/` 下新增 JSON）

## 字段（需求设想，最终以新接口服务端定义为准）

```ts
/** 基站：[{ type, typeName, num, alarmNum }]，type ∈ total/2g/4g/5g */
interface BaseStationRow {
    /** string：类型编号（total/2g/4g/5g） */
    type: string;
    /** string：类型名称 */
    typeName: string;
    /** number：总数 */
    num: number;
    /** number：退服数 */
    alarmNum: number;
}

/** 小区：[{ type, typeName, num, alarmNum }]，type ∈ total/2g/4g/5g */
type CommunityRow = BaseStationRow;

/** 通感站：{ num, alarmNum } */
interface SensorStationRow {
    /** number：总数 */
    num: number;
    /** number：退服数 */
    alarmNum: number;
}

/** 重保专线：{ typeName, num, alarmNum }（num=专线数，alarmNum=中断数） */
interface SpecialLineRow {
    /** string：名称 */
    typeName: string;
    /** number：专线数 */
    num: number;
    /** number：中断数 */
    alarmNum: number;
}
```

## 待确认

- 新接口 viewItemId、参数与返回形状（服务端定稿后回填本文档）

## UI 消费结构（2026-10-10 已实现，静态常量）

组件（`modules/area-business/index.tsx`）当前以树形静态常量渲染，接口落地时补「平铺 → 树形」转换函数：

```ts
interface AreaBusinessItem {
    key: string;
    name: string;
    metrics: Array<{ value: number; label: string }>;
    children?: AreaBusinessItem[]; // 2G/4G/5G 的小区子行
}
```
