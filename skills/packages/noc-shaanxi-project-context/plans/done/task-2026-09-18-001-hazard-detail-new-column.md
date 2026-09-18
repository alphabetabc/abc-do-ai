# 任务：隐患模块契约变更（详情新增列 + 行内区域参数）

-   创建日期：2026-09-18
-   状态：已完成（2026-09-18，五项变更均已实现；lint 因 @FlyFeDX/lint-config 配置非法无法运行，属环境问题与本次改动无关）
-   关联 spec：docs/specs/003-noc-second-hazard（data-model-extensions.md）

## 背景

后端契约文档 `backend-api-docs/陕西-NOC-202609需求接口文档.md` 中，两个下钻详情接口的 `counterFieldList` 均新增了一列：

| fieldLabel | fieldName         | dataType | 出现接口                                                              |
| ---------- | ----------------- | -------- | --------------------------------------------------------------------- |
| 隐患数量   | hiddenDangerCount | String   | 接口1（隐患详情 risk-detail）、接口3（整改计划下钻 risk-plan-detail） |

## 变更一：下钻详情表格新增「隐患数量」列

前端两个下钻详情表格各追加一列「隐患数量」：

1. `web/pages/management-overview-second/modules/hazard-solve/detail-modal/index.tsx`
    - `HazardSolveDetailTable` 的 `columns`（对应接口1 risk-detail）末尾新增
    - `{ title: '隐患数量', dataIndex: 'hiddenDangerCount', key: 'hiddenDangerCount', ellipsis: true, width: 100 }`
2. `web/pages/management-overview-second/modules/hazard-rectify/detail-modal/index.tsx`
    - 对应接口3 risk-plan-detail，同样在 columns 末尾新增该列
3. mock 数据同步补字段（若保留 `_format` 双写风格则一并补）：
    - `public/static/mock/management-overview-second/risk-detail-solve.json`
    - `public/static/mock/management-overview-second/risk-detail-rectify.json`
4. 类型定义：如 `THazardDetailRawItem` / 详情行类型在 `web/services/management-overview-second/share/index.ts` 中有显式字段列表，需同步增加 `hiddenDangerCount?: string`
5. spec 文档 `docs/specs/003-noc-second-hazard/data-model-extensions.md` 中字段清单同步（属 docs/，需走 docs 审批流程，本 task 内仅提案）

## 变更二：接口1 入参新增 indicatorName

### 契约变更

接口1（risk-detail 隐患详情）**入参新增 `indicatorName`**：传入 risk-resolve 返回的 indicatorName（点击数据点的类目名）。返参无变化。

后端虽在 risk-resolve 返回行数据中增加了 zoneId / zoneLevel，但前端**不消费**，区域参数保持现状取值。

### 现状（已核实代码）

当前下钻弹窗发起详情请求时，`zoneId` / `zoneLevel` 取自**页面级** `props.zoneSelect`（`currentZone`），透传链路：

-   `hazard-solve/index.tsx`：`zoneId={currentZone?.zoneId}` → detail-modal → `getHazardSolveDetailDataApi({ zoneId, zoneLevel, ... })`
-   `hazard-rectify/index.tsx`：同上 → `getHazardRectifyDetailDataApi({ zoneId, zoneLevel, ... })`

### 改动方案（草案）

区域参数保持现有取值不动，仅增加 indicatorName 透传：

1. `hazard-solve/detail-modal/index.tsx` 的 `HazardSolveDetailTable`：请求参数增加 `indicatorName: rawItem?.indicatorName`
2. `getHazardSolveDetailDataApi`（`share/index.ts`）入参透传 `indicatorName` 到 `viewPageArgs`

### 范围界定

-   仅 hazard-solve → 接口1（risk-detail）链路增加 indicatorName
-   `hazard-rectify`（接口3 risk-plan-detail）不改
-   risk-resolve 返回的行内 zoneId / zoneLevel 前端不消费，`THazardDetailRawItem` 不加字段，mock 不补

## 变更三：隐患整改计划 y 轴不出现小数刻度

### 问题

hazard-rectify 的「本月安排 / 近三个月安排」双系列线图（`hazard-rectify/option.ts` 的 `chartOption`），数据量级较小时 y 轴会出现 `1 / 1.5 / 3 / 3.5` 这类小数刻度（隐患数量为计数值，不应有小数）。

### 改动方案

`option.ts` 的 `yAxis[0]` 增加 `minInterval: 1`，强制刻度间隔至少为 1：

```ts
yAxis: [
    {
        type: 'value',
        minInterval: 1, // 计数值不出现小数刻度
        ...
    },
],
```

说明：`minInterval: 1` 约束刻度间隔；若最大值本身带小数（如 max=3.5），顶部刻度会停在 3，属可接受表现。

## 变更四：隐患整改计划 x 轴专业名称防重叠

### 问题

hazard-rectify 的「本月安排 / 近三个月安排」线图 x 轴类目为专业名称（如 传输网、动环 等），当前 `axisLabel` 配置 `interval: 0, rotate: 0` 强制全部显示且不旋转，类目较多时文本重叠。

### 改动方案

采用**配置映射**方式，配置放在 `shaanxiCustomSettings.screen2` 下（与第二屏既有模块级定制配置一致，如 `概况统计.highlightFontSize`）：

1. `public/environment.json` 的 `shaanxiCustomSettings.screen2` 新增节点：

```json
"隐患整改计划": {
    "xAxisLabelFormatter": {
        "传输网设备专业": "传输网设备\n专业"
    }
}
```

2. `hazard-rectify/index.tsx` 通过 `useEnvironment()` 读取，在组装 option1 / option3 时设置 x 轴 formatter：

```ts
const env = useEnvironment();
const labelFormatterMap = get(env, 'shaanxiCustomSettings.screen2.隐患整改计划.xAxisLabelFormatter') ?? {};
// 组装 option 时：
axisLabel.formatter = (v: string) => labelFormatterMap[v] ?? v; // 未命中映射时原样展示
```

-   命中映射：按配置文案折行展示
-   未命中（现场新增专业名未配映射）：原样展示（兜底，不报错）

### 部署说明

`useEnvironment` 拉取的是**服务器上部署的 environment.json**，项目内 `public/environment.json` 仅为本地默认值随代码提交；上线时需同步在现场服务器的 environment.json 增加该配置节点。开发验证阶段先在 `public/environment-local.json`（`start:local-env` 加载）实验。

## 变更五：下钻详情表格列支持配置驱动（仅预埋逻辑，不加配置）

### 需求

两个下钻详情表格（hazard-solve / hazard-rectify 的 detail-modal）的列定义支持 environment.json 配置驱动，现场可控制列的**顺序、表头文案（label）、宽度、显隐**。

### 配置契约（本 task 不写入 environment.json，仅预埋消费逻辑）

```json
"shaanxiCustomSettings": {
    "screen2": {
        "左屏-隐患解决": {
            "detailColumns": [
                { "dataIndex": "hiddenDangerSerialNo", "label": "隐患流水号", "width": 160 }
            ]
        },
        "左屏-隐患整改计划": {
            "detailColumns": [ ... ]
        }
    }
}
```

（key 命名「左屏-<模块实际标题>」，与 screen2 下既有「中屏-xxx」风格一致；两个表格各自独立配置。）

### 融合规则

-   **配置存在（非空数组）**：配置数组即最终展示的全量列集合
    -   顺序：按配置数组顺序
    -   `label` / `width`：配置优先，未给则用代码默认值
    -   render / ellipsis 等内置逻辑：按 `dataIndex` 从代码列定义匹配合入（如「解决排期」的时间戳格式化保持）
    -   不在配置里的代码列 → **隐藏**（显隐控制手段）
-   **配置缺失或空**：整体回退代码默认列（现状不变）
-   「序号」列（无 dataIndex，纯 render）：不受配置控制，始终展示在最前

### 改动范围

1. `web/pages/management-overview-second/modules/hazard-solve/detail-modal/index.tsx`：`HazardSolveDetailTable` columns 改为按上述规则组装
2. `web/pages/management-overview-second/modules/hazard-rectify/detail-modal/index.tsx`：同上
3. 两处逻辑一致，可抽公共工具函数（如 `mergeDetailColumns(defaultColumns, config)`）供两个 modal 复用

### 范围界定

-   本 task **只实现消费逻辑**，`public/environment.json` 不新增配置示例，暂不通知现场
-   开发验证阶段配置写在 `public/environment-local.json`（配合 `pnpm run start:local-env` 加载）的 `shaanxiCustomSettings.screen2` 下实验
-   实验通过后，配置最终落点：项目 `public/environment.json`（随代码提交）+ 现场服务器 environment.json（上线同步）；现场需要调整列时直接改服务器配置即可生效，无需发版

## 不改动

-   表格其余列、宽度按现有风格保持

## 验收标准

-   两个弹窗表格最后一列展示「隐患数量」，接口返回空串时显示为空
-   mock 数据含 `hiddenDangerCount` 字段，本地页面渲染正常
-   hazard-solve 下钻详情请求透传 indicatorName，zoneId / zoneLevel 保持页面级取值
-   隐患整改计划线图 y 轴刻度全部为整数

## 审批记录

| 日期       | 审批人 | 结论   | 备注                       |
| ---------- | ------ | ------ | -------------------------- |
| 2026-09-18 | 用户   | 已批准 | 口头批准，五项变更全部执行 |
