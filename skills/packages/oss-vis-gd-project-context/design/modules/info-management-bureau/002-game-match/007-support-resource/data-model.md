# 007-support-resource · 保障资源（data-model）

> 接口源码：`web/services/info-management-bureau/game-match/section-center.ts`（公共请求层 `web/services/request/getViewItemData.ts`，POST `view/getViewItemData`，`converter: defaultConverter` 取 `data.viewItemData.rows`）。
> mock 路径：`public/static/mock/info-management-bureau/` 下**无对应 mock 文件**（源码未配置 `localMockUrl`）。

## getSupportResourceApi

- 源码：`web/services/info-management-bureau/game-match/section-center.ts`
- 入参：
  - 函数入参 `areaName`（场馆名称，来自 `currentArea.name`）
  - `viewItemId: 'ceremonies-guarantee-resources'`
  - `viewPageId: 'open-close-ceremonies-view'`
  - `viewPageArgs: { areaName }`
  - 环境配置项：`getEnvironment('info-management-bureau.gameMatchConfig.open-close-ceremonies-view-ceremonies-guarantee-resources')`，解构取 `viewItemDataTemplate`（展示分组模板，可覆盖下方默认模板）
  - `baseUrlType: 'sceneViewService'`
  - 轮询：否（页面侧 `useRequest` 仅设 `refreshDeps: [currentArea.name]`、`ready: isDefined(name)`，无 `pollingInterval`）
  - 无 `localMockUrl`

### 原始响应结构（rows 元素）

```ts
/** rows 行结构（源码 converter 消费的字段；本项目无 mock 文件，以下为源码实际读取项） */
interface GuaranteeResourcesRow {
    type: string;  // 资源类型，与模板 typeFieldValue 匹配，如 '1' 通信车 / '2' 人员 / '3' 卫星车 / '4' 发电车
    state: string; // 状态，与模板 stateFieldValue 匹配：'1' 任务中 / '0' 总数
    num: number;   // 数量（源码未显式读取，经 {...dataItem} 展开合并进结果，页面渲染取 item.num）
}
```

> ⚠️ 说明：本接口无本地 mock，行结构字段以上述源码实际消费项为准；`data.viewItemData.rows` 外层结构与其它视图服务接口一致（POST `view/getViewItemData` 标准响应）。

### 展示分组模板（viewItemDataTemplate 默认值）

```ts
interface ViewItemDataTemplateItem {
    typeFieldValue: '1' | '2' | '3' | '4'; // 资源类型：1 保障通信车 / 2 保障人员 / 3 保障卫星车 / 4 保障发电车
    stateFieldValue: '1' | '0';            // 状态：1 任务中 / 0 总数
    typeFieldLabel: string;                // 分组标题，如 '保障通信车'
    stateFieldLabel: '任务中' | '总数';     // 指标项名称
    stateUnit: '个';                       // 数量单位
}
```

默认模板共 6 条：保障通信车（任务中/总数）、保障发电车（任务中/总数）、保障人员（任务中/总数）。

### converter / 转换逻辑

以模板为骨架按 `typeFieldValue` 分组（Map，保持模板首次出现顺序），每行去 `rows` 中找 `row.type === typeFieldValue && row.state === stateFieldValue` 的行，展开合并到模板项上：

```ts
interface SupportResourceGroup {
    label: string;  // = 模板 typeFieldLabel，分组标题，如 '保障通信车'
    type: string;   // = 模板 typeFieldValue，分组类型
    children: Array<ViewItemDataTemplateItem & Partial<GuaranteeResourcesRow>>;
    // 每项含模板字段（typeFieldValue/stateFieldValue/typeFieldLabel/stateFieldLabel/stateUnit）
    // 加匹配到的行字段（type/state/num 等）；未匹配到时仅模板字段，num 缺省由页面渲染为 '0'
}
```

返回 `SupportResourceGroup[]`。

### fallback / 空数据兜底

无独立 fallback 函数、无本地 mock。请求失败或 `rows` 为空时，每个模板项的 `dataItem` 为 `{}`，仍返回完整分组骨架（仅模板字段，页面渲染 `item.num ?? '0'` 显示 0）。
