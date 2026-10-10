# 007-support-resource · 保障资源（data-model）

> 接口源码：`web/services/info-management-bureau/open-and-close/section-center.ts`（函数 `getSupportResourceApi`）
> mock/fallback 数据：`public/static/fallback/info-management-bureau/open-close-ceremonies-view-ceremonies-guarantee-resources.json`（无独立本地 mock，fallback url 无 `_${area}` 后缀）
> 公共请求层：`web/services/request/getViewItemData.ts`（POST `view/getViewItemData`，converter 取 `data.viewItemData.rows`）；fallback：`web/services/info-management-bureau/loadFallbackData.ts`（rows 为空时请求 fallback JSON）
> 页面调用：`web/pages/info-management-bureau/sub-pages/open-and-close/modules/support-resource/index.tsx`（无轮询，仅首载请求）

## getSupportResourceApi（保障资源）

- 源码：`web/services/info-management-bureau/open-and-close/section-center.ts`（YApi 文档 id 31198）
- 入参：
  - `viewItemId`: `'ceremonies-guarantee-resources'`
  - `viewPageId`: `'open-close-ceremonies-view'`
  - `viewPageArgs`: 缺省 `{}`；可被环境配置 `info-management-bureau.openAndCloseConfig.open-close-ceremonies-view-ceremonies-guarantee-resources` 的 `viewPageArgs` 覆盖（同一配置 key 还可覆盖 `viewItemDataTemplate`）
  - `baseUrlType`: `'sceneViewService'`
  - 本地 mock：无
  - fallback url：`/common/static-file/fallback/info-management-bureau/open-close-ceremonies-view-ceremonies-guarantee-resources`（无 `_${area}` 后缀）
  - 是否轮询：否（页面 `useRequest` 未配置 `pollingInterval`）

### 原始响应结构（fallback JSON 对齐）

```ts
interface GuaranteeResourcesResponse {
    code: number;            // number，响应码，mock 为 200
    message: string | null;  // string | null，提示信息
    data: {
        viewPageId: string;  // 'open-close-ceremonies-view'
        viewItemId: string;  // 'ceremonies-guarantee-resources'
        viewItemData: {
            title: string;   // '中下-保障资源'
            header: {
                counterFieldList: { /* num(数量) / type(类型) / state(状态) */ }[];
            };
            rows: Array<{
                num: string;   // 数量，如 '100'
                type: string;  // 资源类型：'1'=保障通信车，'2'=保障人员，'3'=保障卫星车（'4'=保障发电车已在注释中预留）
                state: string; // 状态：'1'=任务中，'0'=总数
            }>;
        };
    };
}
```

### converter 转换后返回值

按模板 `viewItemDataTemplate` 的 `typeFieldValue` 分组（Map 保序，key 为 type），返回分组数组：

```ts
type GuaranteeResourcesResult = Array<{
    label: string;  // 组名，取组内第一个 item 的 typeFieldLabel，如 '保障通信车'
    type: string;   // 组 id，即 typeFieldValue：'1' | '2' | '3'
    children: Array<{
        typeFieldValue: string;   // 资源类型 id，如 '1'
        stateFieldValue: string;  // 状态 id：'1'=任务中，'0'=总数
        typeFieldLabel: string;   // 资源类型名，如 '保障通信车'
        stateFieldLabel: string;  // 状态名：'任务中' | '总数'
        stateUnit: string;        // 单位，固定 '个'
        num?: string;             // 命中 rows 中 type+state 匹配行的 num（string）；未命中/请求失败时无此字段
        type?: string;            // 命中行透传的 type
        state?: string;           // 命中行透传的 state
    }>;
}>;
```

匹配规则：`rows.find((row) => row.type === group.type && row.state === item.stateFieldValue)`；`children` 顺序为模板顺序（任务中在前、总数在后），分组顺序为模板首次出现顺序：保障通信车 → 保障卫星车 → 保障人员。

> ⚠️ 差异：源码缺省模板未包含注释中预留的「4-保障发电车」；若接口 rows 返回 type `'4'` 而模板未配置对应项，则该行被忽略。页面渲染时 `item.num ?? '0'` 兜底。

### fallback / 空数据兜底

`err || isEmpty(rows)` 时：不返回默认值结构，而是按模板分组、每个 child 仅含模板字段（无 `num`），页面显示 `num ?? '0'` 即 0。接口响应 rows 为空时由 `viewItemDataFallbackApi` 拉取 fallback JSON。

## mock 数据来源路径

- fallback：`public/static/fallback/info-management-bureau/open-close-ceremonies-view-ceremonies-guarantee-resources.json`
- 本地 mock：无（源码未配置 `localMockUrl`）
