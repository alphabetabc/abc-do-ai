---
title: 踩坑记录
description: table-detail 实际开发/维护中遇到的坑、最佳实践和性能注意点
version: 1.0.0
last_updated: 2026-07-30
---

# 踩坑记录

本文档记录 `table-detail` 实际开发/维护中遇到的坑、最佳实践和性能注意点。

## 1. 分页器绝对定位 + `paginationSetting.left` 含义模糊 ⚠️

**症状**：

-   `paginationSetting.left` 字段名是"位置"，实际含义是 `paddingLeft`
-   `src/packages/table-detail/index.tsx`：
    ```typescript
    style={{ display: 'flex', paddingTop: 10, left: _.get(config, 'paginationSetting.left', 0) }}
    ```
-   但是 `src/packages/table-detail/index.less`：
    ```less
    .table-detail-pagination {
        position: absolute;
        bottom: 0;
    }
    ```
-   `position: absolute` + `bottom: 0` + inline `left` —— 实际上是控制**分页器左边距**

**问题**：

-   `left` 默认值是 `0`（数字），但 schema 里 type 是 `string`（`src/packages/table-detail/schema.ts`）
-   输入 `100` 字符串会被解析为 CSS `left: "100"`，**浏览器视为无效值**

**修复**（未在本次 PR 范围）：

-   将 schema `left.type` 改为 `'number'`，并在 index.tsx 包一层 `\`${value}px\``
-   或在 index.tsx 中 `Number(_.get(...))` 后转字符串

---

## 2. `onCheckChange` 空实现 ⚠️

**症状**：

-   `src/packages/table-detail/index.tsx`：
    ```typescript
    const onCheckChange = usePersistFn((...args) => {
        // 暂时没有实现check这个功能
    });
    ```
-   单元格 `contentShowType: 'checkbox'` 时勾选**没有任何反应**

**影响**：

-   用户配置复选框列无效果
-   与 schema 提供的 `INTERACTION_TYPE_CheckBoxCELL`（`src/packages/table-detail/schema/interactions.ts`）不匹配

**修复**（已记录到 [common-tasks.md § 7](./common-tasks.md#任务-7修复-oncheckchange-空实现)）：实现 `onCheckChange`，派发 `rowCheckChange` 事件。

---

## 3. `rowSetting.fieldNameForKey` 未配置时使用 index 作 key ⚠️

**症状**：

-   `src/packages/table-detail/index.tsx`：
    ```typescript
    setActiveRowKey(rowSetting.fieldNameForKey ? record[rowSetting.fieldNameForKey] : rowIndex);
    ```
-   如果用户没配 `fieldNameForKey`，行 active 效果用 `rowIndex` 作 key
-   数据刷新后行顺序变化 → 激活态错乱

**影响**：

-   用户预期"点击后该行高亮"，但翻页后激活态错位
-   性能上，使用 `index` 作 React `key` 也会引起重渲

**修复**（未在本次 PR 范围）：

-   在 `oss-material.json` 的 defaultValue 已设 `fieldNameForKey: 'policyPlatformId'`
-   文档明确要求用户必须配 `fieldNameForKey`
-   或在运行时若 `fieldNameForKey` 未配，**禁用 clickEffect**

---

## 4. `groupSet.compactSeperator` 的 `x-reactions.when` 引用方式不一致 ⚠️

**症状**：

-   `src/packages/table-detail/schema.ts`：
    ```typescript
    when: '{{ $deps[0] === true }}',
    ```
-   期望 `compactSeperator` 在 `compact=true` 时显示，但**实际效果是反过来**

**原因**：

-   Formily 的 `x-reactions` 默认行为：fulfill = 满足条件时的状态
-   schema 写的是：当 `compact === true` 时**显示**（但当前 defaultValue `compact: false`，所以默认隐藏）

**实际行为**：

-   `compact: false` → compactSeperator 隐藏（符合"非聚合模式不需要分隔符"语义）
-   `compact: true` → compactSeperator 显示 ✅
-   **当前默认 false，所以默认隐藏**，符合预期

> 看起来没问题，但**与 § 2.6 `customPageSize` 的 reactions 写法不一致**：
>
> -   `compactSeperator`: `fulfill: visible: true, otherwise: visible: false`（标准写法）
> -   `customPageSize`: `fulfill: visible: false, otherwise: visible: true`（反着写，因为该字段在 `enablePageSizer=false` 时显示）
>
> 写反的字段依赖具体业务语义，**维护时要对照看**，不要随意改 reactions 方向。

---

## 5. table-detail 本身不触发 API 请求 ⚠️

**症状**：

-   与 `pagination-table`（`src/packages/pagination-table/index.tsx`）不同，table-detail 的 `index.tsx` **没有任何 `api.customDataSourceApi(...)` 调用**
-   用户翻页只更新 `paginationState`，**不会发请求**

**影响**：

-   本地分页：✅ 无影响
-   服务端分页 + **数据源 hook 监听 state 变化**：✅ 能拿到新数据
-   服务端分页 + **数据源 hook 不监听**：❌ 翻页后内容不变，total 来自服务端所以显示正确，但**永远显示第 1 页数据**

**修复**（不在组件范围）：

-   这是设计上的"被动消费"模式，**不属于组件 bug**
-   文档需明确告知：服务端分页时数据源 hook 必须监听 `paginationState.current / pageSize`

---

## 6. 搜索栏筛选基于"本地 includes" ⚠️

**症状**：

-   `src/packages/table-detail/index.tsx`：
    ```typescript
    return dataItem[key] && `${dataItem[key]}`.includes(value);
    ```
-   本地搜索用 `String.prototype.includes`，**大小写敏感、不支持正则**

**影响**：

-   搜索 "财政厅" 能匹配 "财政厅 1"
-   搜索 "POLICY" 匹配不到 "policyPlatform"（大小写敏感）
-   数字 / 日期等类型字段会被强转为字符串再 includes

**修复**（未在本次 PR 范围）：

-   接入 `lodash _.includes` 或自定义 ignoreCase
-   或在 schema 加 `searchMatchMode: 'fuzzy' / 'exact' / 'regex'`

---

## 7. `useScroll` 的 selector 与 oss-ui 版本强耦合 ⚠️

**症状**：

-   `src/packages/table-detail/hooks/useScroll.tsx` 用 oss-ui 的 class selector（`.oss-ui-pro-table-search-query-filter` 等）
-   如果 oss-ui 升级，class 名变化会导致**滚动计算失败**

**修复**（不在组件范围）：

-   升级 oss-ui 时必须跑回归测试
-   建议在 `package.json` 加 `oss-ui` 版本锁定

---

## 8. 单元格 `<Icon>` 类型的 `image:` 前缀解析隐式 ⚠️

**症状**：

-   `src/packages/table-detail/components/cell/index.tsx`：
    ```typescript
    const picName = belongRegion?.trend?.replace('image:', '');
    trendIcon = <RenderIcon icon={belongRegion?.trend?.replace('icon:', '')} image={`${STATIC_PATH}/templet/${picName}`} ... />
    ```
-   `image:` 前缀是字符串约定，**没有 schema 字段定义**，靠字符串判断
-   同样 `customIconComp` 取决于 `trend.startsWith('image:')`（字符串前缀）

**影响**：

-   修改前缀字符串（如改 `pic:`）需要全文搜索所有 Icon 类型用法
-   用户写错前缀会导致图标加载失败，无友好提示

**修复**（未在本次 PR 范围）：

-   改为 schema 显式声明 `iconType: 'antdIcon' | 'customImage' | 'presetImage'`

---

## 9. dataModel 字段名是 `columns_0X` 占位符 ⚠️

**症状**：

-   `src/packages/table-detail/dataModel.json` 字段名是 `columns_01~07`
-   但 `defaultValue.dataConfig.json` 用的是 `policyPlatform / serverCount / ...`
-   用户在数据面板**看到的是占位名**，需手动映射

**影响**：

-   用户认知负担：明明数据有 `policyPlatform`，dataModel 却显示 `columns_01`
-   新人维护容易混淆

**修复**（已记录到 [data-model.md § 7.4](./data-model.md#74-修复建议仅记录不在当前-pr-范围)）：

-   改用语义化命名
-   或在 doc/README.md 明确说明映射关系

---

## 10. `extraResponse.data.viewItemData.pagination` 字段路径与项目其他物料不一致 ⚠️

**症状**：

-   table-detail 用 `viewItemData.pagination.{current, pageSize, total}`（`src/hooks/useDataSourcePagination.ts`）
-   pagination-display 用 `viewItemData.page.total`（`src/packages/pagination-display/index.jsx`）

**影响**：

-   数据源返回结构不统一，需要分别兼容
-   新人容易踩坑

**修复**（不在组件范围）：

-   全局统一为 `viewItemData.pagination`
-   在 pagination-display 同步修改

---

## 11. `dynamicEvents[0]` 是 `RowDispatch` 时无法添加新事件 ⚠️

**症状**：

-   `src/packages/table-detail/schema/interactions.ts`：
    ```typescript
    'x-reactions': {
        fulfill: {
            run: `
                const enableAdd = $values.interactions?.dynamicEvents?.[0]?.effect !== "${INTERACTION_TYPE_ROW}";
                $self.setState(state => state.visible = enableAdd);
                if(!enableAdd && $values.interactions?.dynamicEvents?.length > 0){
                    $form.setValuesIn("interactions.dynamicEvents", [$values.interactions?.dynamicEvents?.[0]]);
                }
            `,
        },
    },
    ```
-   如果第 0 项是 `RowDispatch`，"添加事件"按钮**隐藏 + 已有多个事件会被截断为只剩第 0 项**

**原因**：

-   `RowDispatch` 是"行点击派发"，与单元格级事件互斥

**影响**：

-   用户先添加了 `CellDispatch` 后改为 `RowDispatch`，之前的事件会被悄悄清掉

**修复**（未在本次 PR 范围）：

-   在 schema 顶部加 `description` 提示"行点击与单元格点击互斥"
-   或在清空前给出 confirm 对话框

---

## 12. 单元格 `plainText` 类型不支持换行

**症状**：

-   `CellRenderer` 的 `plainText` 分支用 `<span>`，无 `white-space: pre-wrap`
-   数据中包含 `\n` 时**会被压缩成空格**

**影响**：

-   含有换行的描述字段（如多行备注）显示异常

**修复**（未在本次 PR 范围）：

-   schema `contentProps` 加 `whiteSpace: 'pre' | 'pre-wrap' | 'normal'` 配置
-   CellRenderer 中根据配置添加样式

---

## 13. 自动轮播在 hover 容器外区域不会暂停 ⚠️

**症状**：

-   `hooks/useCarousel.tsx` 用 `containerRef.current` 的 `mouseenter / mouseleave` 控制暂停
-   但 `containerRef = rootElementRef`，挂载在 `StyledContainer` 根 div 上
-   鼠标进入容器内**子元素**（表格、分页器、工具栏）会触发 **冒泡**到根 div，所以正确
-   但鼠标进入 `ConfigProvider` 之外的区域（比如父卡片右上角的"配置"按钮），**不会**触发根 div 的 mouseenter，轮播继续

**影响**：

-   用户在大屏编辑态，可能一边盯着其他区域一边让轮播跑，符合预期
-   但在某些"hover 整张图都暂停"的预期下会觉得"轮播没暂停"

**修复**（已记录到 [common-tasks.md § 11](./common-tasks.md#任务-11调整自动轮播范围)）：

-   如需"hover 整张大屏卡片都暂停"，可将 `containerRef` 改为外部传入的更大容器 ref
-   或监听 `document` 的 `mousemove` 判断鼠标坐标范围（不推荐，性能差）

---

## 14. 自动轮播跨页面持久化问题 ⚠️

**症状**：

-   自动轮播状态只存在当前组件实例的 `useEffect` 内部
-   路由切换 / 页面刷新 / 设计器"隐藏→显示"后，轮播**会重置回第 1 页**
-   `paginationState.current` 由组件内部 state 持有，**不持久化**

**影响**：

-   切到其他页面再回来，轮播从第 1 页重新开始
-   大屏轮播场景下用户期望"持续展示"，但会被打断

**修复**（不在本次 PR 范围）：

-   若需"跨页面保持进度"，可通过派发 `actionPaginationCurrent` + 外部 store（redux / zustand）持久化 `current`
-   或在 `interactionProps.subscribePaginationCurrent` 注入外部维护的 current 值
-   当前 MVP **不**持久化，符合"组件内自治"原则

---

## 15. `enableTableHeader = false` 时多项配置静默失效 ⚠️

**症状**：

-   关闭表头显示（`headerStyle.enableTableHeader = false`）后，**不会报错**，但以下配置全部失效：
    -   `headerStyle` 同分组其他字段（背景颜色 / 字色 / 字号 / 字重 / 字体 / 单元格高度）
    -   `groupSet` 表头分组（`formattedColumns` 中的 children / 聚合）
    -   列排序 / 列筛选菜单 / 列宽拖拽（这些交互完全依赖 `<thead>`）
    -   列固定（fixed）时的表头吸顶效果
-   用户在设计器配置后看不到任何效果，但**没有错误提示**

**原因**：

-   `showHeader={false}` 是 antd `Table` 内置 prop，传到 rc-table 后**直接不渲染 `<thead>` 元素**
-   所有表头相关的 DOM / 事件监听 / 样式应用都没有挂载点
-   字段定义（`columns[].title` 等）仍然存在，只是没有 DOM 可应用

**影响**：

-   用户疑惑"我配了 `headerStyle.backgroundColor` 为啥没生效"
-   用户疑惑"我配了 `groupSet` 表头为啥没分组"

**修复**（已落地）：

-   schema `description` 字段已写清警告文案
-   doc/readme.md "表头设置"段落加 ⚠️ 说明
-   但**不主动禁用相关配置项**（避免破坏已配置物料；且与 "enable" 系列语义保持一致）

**替代方案**（不在本次 PR 范围）：

-   若 `enableTableHeader = false`，让 `headerStyle.backgroundColor` 等字段联动隐藏（用 `x-reactions`）
-   但这会引入"关闭表头时配置不可见"的 UX，需要权衡

---

## 16. `enable` 和 `hidePagination` 容易混淆 ⚠️

**症状**：

-   `paginationSetting` 下有两个 boolean 字段：`enable` 和 `hidePagination`
-   用户经常混淆："我想让分页器不显示但表格自动轮播" → 错把 `enable` 设为 `false`
-   后果：表格全量展示所有数据（不分页），`tableInfo.total` 变为 undefined，**自动轮播也不工作**

**原因**：

-   `enable = false` 是**功能关闭**（数据不分页、`total=Infinity`、carousel 拒绝启动）
-   `hidePagination = true` 是**视觉隐藏**（数据仍分页、`total=chunk.length`、carousel 正常工作）

**正确做法**：

| 需求 | 配置 |
| --- | --- |
| 不分页，全量展示 | `enable=false` |
| 分页但 UI 隐藏（自动轮播场景） | `enable=true` + `hidePagination=true` |
| 分页且 UI 显示 | `enable=true`（默认） |

**修复**（已落地）：

-   schema `hidePagination.description` 字段已写"不影响自动轮播"
-   doc/readme.md "隐藏分页器"段落加对比说明
-   component-logic.md § 2.2.6 详细列出 `enable` / `hidePagination` / `total <= 1` 三种隐藏条件的区别

---

## 17. `columnsRenderTemplate` 仅对 plainText 类型列生效 ⚠️

**症状**：

-   给 `contentShowType: 'Capsule' | 'Icon' | 'DigitalFlop' | 'Checkbox'` 的列配了 `columnsRenderTemplate` 模板，**不生效**
-   预期：拼好的字符串塞进胶囊 / 图标 / 数字翻牌器
-   实际：胶囊/图标/数字翻牌器**只识别各自的数据结构**，模板渲染只发生在 plainText 分支

**原因**：

`CellRenderer` 是分类型分发的：

```typescript
if (columSetting.contentShowType === CellType.Capsule) {        // 走 enums 着色 + 状态文本
} else if (columSetting.contentShowType === CellType.Icon) {    // 走 icon 渲染
} else if (columSetting.contentShowType === CellType.DigitalFlop) { // 走数字翻牌器（必须是数字）
} else if (columSetting.contentShowType === CellType.Checkbox) {    // 走复选框
} else {                                                            // ← plainText 才有模板逻辑
    let text = record[columSetting.dataIndex];
    ...
    if (hasTemplate) text = template(tmplItem.template, record);
}
```

模板逻辑只放在 `else`（plainText）分支，其他分支直接 `return`，**早于模板计算**。

**正确做法**：

| contentShowType | 模板生效 | 替代方案 |
| --- | --- | --- |
| `plainText` | ✅ | — |
| `Capsule` | ❌ | 用 `enums[].text` 配置状态文本 |
| `Icon` | ❌ | 配 `icon` / `image` 字段 |
| `DigitalFlop` | ❌ | 配 `levels[].text` 配置级别文字 |
| `Checkbox` | ❌ | 不适用（控件） |

**为什么不扩展到其他类型**：

- Capsule / DigitalFlop 渲染时 **enum.key 必须是数据原值**，模板拼接会破坏 number / enum 识别
- Icon / Checkbox 本质是控件，不是文本展示
- 强行扩展会破坏现有渲染逻辑，**得不偿失**

**修复**（已落地）：

- schema `template` 字段 `x-decorator-props.tooltip` 已写明"仅对 plainText 类型列生效"
- doc/readme.md "列字段模板"段落明确"作用范围"
- component-logic.md § 2.2.9 列出优先级表

---

## 18. `columnsRenderTemplate` 优先级：`belongGroup` > 模板 > `enumRender` ⚠️

**症状**：

-   用户配置模板后没生效
-   排查发现：该列同时被 `groupSet.includesFields` 包含，**belongGroup 覆盖了模板**

**优先级表**（从低到高）：

```text
默认值 record[dataIndex]
    ↑
    │ 模板（仅 belongGroup 未命中时）
    ↑ ────────────
    │
    ↑ 聚合展示 belongGroup（互斥 if/else if）
    ↑ ────────────
    │
    ↑ enumRender（独立 if，可覆盖模板）
    ↑
最终 text
```

**常见误用**：

| 误用 | 结果 |
| --- | --- |
| 想用模板展示多字段拼接，但该列同时配了 `groupSet` | belongGroup 胜出，模板不生效 |
| 想用模板配合 `enumRender` 切换文案 | enumRender 胜出，模板文本被覆盖 |
| 想用模板做"轻量换色" | `levelRender` 只改色不换文本，可与模板共存 ✅ |

**正确做法**：

- 想用模板 → **不要**给该列加 `group`
- 想用 enumRender → 模板会被覆盖，建议直接用 `enums[].text` 而不是模板
- 想用 levelRender（只改色）+ 模板 → **可共存** ✅

---

## N. 调试小技巧

### N.1 查看当前 props.dataSource 结构

```typescript
// 在 index.tsx 顶部
console.log('[table-detail]', { dataSource, extraResponse, interactionProps });
```

### N.2 查看分页状态

```typescript
console.log('[pagination]', { paginationState, servicePagination, tableInfo });
```

### N.3 临时禁用滚动联动

```typescript
// 在 ProTable 上
scroll = { undefined };
```

### N.4 查看 useScroll 计算结果

```typescript
// 在 useScroll.tsx 中
console.log('[useScroll]', { fullHeight, searchBarHeight, toolbarListHeight, tableHeaderHeight, paginationHeight, scrollY });
```

### N.5 临时把分页器强制显示（即便 total=1）

```typescript
// 在 index.tsx 中
const showPagination = enablePagination; // 移除 total! > 1 判断
```

---

## 维护历史

| 日期       | 问题     | 修复                                                 |
| ---------- | -------- | ---------------------------------------------------- |
| 2026-07-30 | 文档化   | 首次编写 gotchas；列出 12 条踩坑点                   |
| 2026-07-30 | 新增踩坑 | § 17 / § 18：列字段模板生效范围 + 优先级             |
| 2026-07-30 | 新增踩坑 | § 16：enable vs hidePagination 容易混淆              |
| 2026-07-30 | 新增踩坑 | § 15：enableTableHeader=false 多项配置静默失效       |
| 2026-07-30 | 新增踩坑 | § 13 / § 14：自动轮播 hover 暂停范围 / 跨页面持久化 |
| 2023-07-24 | 创建物料 | 0.0.1 (`src/packages/table-detail/doc/CHANGELOG.md`) |
