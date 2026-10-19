# 004-area-business · 重保区域业务汇总（data-model）

> 接口源码：`web/services/shenzhen-communication-guarantee/home/section-right.ts`（`getKeyGuaranteeAreaBusinessApi`）
> mock 数据：`public/static/mock/shenzhen-communication-guarantee/key-guarantee-area-business.json`
> 接口契约（服务端文档）：`docs-api-backend/shenzhen-communication-guarantee/api-doc.md`「一、重保区域业务」
> 实现任务：`plans/task-2026-10-12-006-00-scguarantee-area-business-api.md`（2026-10-12 验收通过）

## 接口状态：已定稿并落码（2026-10-12）

- viewItemId：`key-guarantee-area-business`；请求参数：无（`viewPageArgs: {}`）
- viewPageId：`open-close-ceremonies-view`（复用信管局视图页，2026-10-12 服务端确认）
- env key：`shenzhen-communication-guarantee.homeConfig.shenzhen-communication-guarantee-view-key-guarantee-area-business`（可覆盖 `viewPageArgs` + `viewItemDataTemplate`）
- 请求范式与模块既有约定一致：`baseUrlType: 'sceneViewService'` + `defaultConverter` + `viewItemDataFallbackApi` 兜底（key `open-close-ceremonies-view-key-guarantee-area-business`）+ localMockUrl

## 接口响应（rows 平铺）

```ts
/** 接口 rows：8 类，type 字典 2G基站/2G小区/4G基站/4G小区/5G基站/5G小区/通感站/重保专线 */
interface KeyGuaranteeAreaBusinessRow {
    /** string：类型名（上述字典） */
    type: string;
    /** string：总数 */
    num: string | number;
    /** string：退服数（重保专线语义为中断数） */
    retireNum: string | number;
}
```

## viewItemDataTemplate（树形模板，env 可覆盖）

出数范式：rows 按 `type` 匹配模板，命中后按各指标 `valueField` 从 row 取值写入 `metric.value`；回填前深拷贝（`JSON.parse(JSON.stringify(...))`）不污染 env 模板。err / rows 空时返回模板本身（value 缺失 → 渲染层显示 0）。

```ts
/** 指标项，valueField 指向 rows 的字段名（num / retireNum） */
interface AreaBusinessMetric {
    label: string; // 基站数/退服数/总数/专线数/中断数
    valueField: string;
    value?: string | number; // 接口回填后存在
}

/** 标题行（分组项内），title 对应接口 rows 的 type 字典 */
interface AreaBusinessRow {
    title: string; // 2G基站/2G小区/4G基站/...
    children: AreaBusinessMetric[];
}

/** 模板项：分组（2g/4g/5g，'group' in item 判别）或平铺项（通感站/重保专线） */
interface AreaBusinessItem {
    key: string; // 渲染 key
    group?: string; // 分组标记（存在即分组项）
    title?: string; // 平铺项显示名 + type 匹配
    children: (AreaBusinessRow | AreaBusinessMetric)[]; // 分组项为标题行，平铺项为指标项
}
```

### 模板默认值结构（默认 8 类型）

- 分组项 ×3：`2g` / `4g` / `5g`，children 为 [xG基站, xG小区] 两个标题行
- 平铺项 ×2：`通感站`（key `tonggan`，基站数/退服数）、`重保专线`（key `zhongbao`，专线数/中断数）——key 2026-10-13 由中文改为英文，用于 CSS 背景类名匹配

## UI 消费结构（2026-10-12 接数完成）

组件（`modules/area-business/index.tsx`）用 `useRequest` 拉取接口，直接渲染模板（无前端转换层）：

- `'group' in item` 判别分组/平铺
- 分组项内首行为父行（基站，基础样式）、次行为子行（小区，缩进小字号，`child` 标记）
- 平铺项容器类名 `business-group--{item.key}`（tonggan / zhongbao），对应各自单行背景图（见 spec.md 布局说明）
- 指标数值 `Number(value ?? 0) || 0` 兜底显示 0

```tsx
const { data: items } = useRequest(() => getKeyGuaranteeAreaBusinessApi());
```

## 指标 label 字典

| 类型 | 指标（num / retireNum） |
| --- | --- |
| xG基站 | 基站数 / 退服数 |
| xG小区 | 总数 / 退服数 |
| 通感站 | 基站数 / 退服数 |
| 重保专线 | 专线数 / 中断数 |
