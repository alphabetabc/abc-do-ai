---
name: 'noc-shaanxi-second-cutover-manager-data-format'
version: '1.0'
updated: '2026-10-23'
description: 'net-work-cutovers / net-work-cutovers-detail（割接管理两视图）+ 辅助视图 risk-dict 服务端数据格式：请求参数、响应结构、rows 字段与数据形态要点。'
---

# net-work-cutovers / net-work-cutovers-detail 服务端数据格式（割接管理）

## 文档元信息

| 字段     | 值         |
| -------- | ---------- |
| 文档版本 | v1.0      |
| 最后更新 | 2026-10-23 |

割接管理模块消费 **2 个业务视图** + **1 个辅助字典视图**，均走 `getViewItemDataApi`（`web/services/request/getViewItemData.ts`）POST 视图服务 `view/getViewItemData`（`baseUrlType: 'sceneViewService'`），取 `data.viewItemData.rows`：

| 视图 | viewItemId / viewPageId | requestId | 消费区域 | mock |
| --- | --- | --- | --- | --- |
| 割接总数 | net-work-cutovers / noc-module-oriented-right-page | 8875 | 左半区（tab + 饼图） | **无本地 mock，走真实接口** |
| 割接详情 | net-work-cutovers-detail / noc-module-oriented-right-page | 8881 | 右半区（两页柱线图） | localMockUrl → `public/static/mock/management-overview-second/noc-module-oriented-right-page-net-work-cutovers-detail.json` |
| 割接字典（辅助） | risk-dict / noc-module-oriented-left-page | 8869 | 详情请求的 indicatorGroup 参数来源 | 无（左屏隐患字典视图复用） |

---

## 一、net-work-cutovers（割接总数，8875）

### 1.1 请求

- viewPageArgs：仅 `{ zoneId, zoneLevel }`（区域联动）。
- converter：直接返回 `data.viewItemData.rows`。

### 1.2 rows 字段（组件消费推断 + mock 未覆盖声明）

**注意**：本视图当前走真实接口、无本地 mock 文件，字段表以下述组件消费为准（Left.tsx / Tabs.tsx 实际读取项）；未读取项（header 元信息等）**未验证**，待真实响应补充。

| 字段 | 组件消费位置 | 说明 |
| --- | --- | --- |
| indicatorId | 左半区所有消费的定位键 | '100001' 割接总数 / '100006' 影响业务割接总数（tab）；100002~100005 / 100007~100010（饼图四分类） |
| indicatorName | 饼图 name / tab 匹配 | 分类名（数字人 label 命中也依赖该字典名） |
| indicatorValue | tab dictValue / 饼图 display 兜底 | 总数值（tab 直接展示） |
| displayValue | 饼图 value 首选 | `Number(displayValue || indicatorValue)` |
| percent / rate | 饼图 percent | 百分比（兜底链 `percent || rate`） |
| indicatorUnit | 饼图 unit | 单位（如 '个'） |

### 1.3 数据形态（组件消费约定）

- rows 为**有序扁平数组**，左半区按**数组下标切片**消费：
    - `slice(1, 5)`：indicatorId 100002~100005 → 割接总数 tab 下的饼图四分类。
    - `slice(6, 10)`：indicatorId 100007~100010 → 影响业务割接 tab 下的饼图四分类。
    - **隐含契约**：rows[0] 必须是割接总数（100001），rows[5] 必须是影响业务割接总数（100006），行序由服务端保证——若服务端调整行序，切片会静默取错数据（无 indicatorId 二次校验）。
- 饼图颜色按 indicatorId 硬编码：100002/100007 → #0193DE，100003/100008 → #46D7DA，100004/100009 → #F8B551，100005/100010 → #13D17D，default → #0193DE。

---

## 二、net-work-cutovers-detail（割接详情，8881）

### 2.1 请求

- `getCutOverManagerApi` 串行两步：先请求 risk-dict（见 §三），再请求本视图。
- viewPageArgs：

| 参数 | 取值 | 说明 |
| --- | --- | --- |
| zoneId / zoneLevel | 区域联动 | |
| module | '1' 割接总数 / '2' 影响业务割接 | tab 状态（ModuleType） |
| indicatorGroup | risk-dict rows 的 dictKey 逗号拼接 | **与响应中的 indicatorGroup 分组值（'1'~'6'）非同一语义**，仅作过滤参数 |

### 2.2 响应外层结构

```
{
  code: 200,
  data: {
    viewPageId: 'noc-module-oriented-right-page',
    viewItemId: 'net-work-cutovers-detail',
    viewItemGroupId: 'net-work-cutovers-detailGroup',
    viewItemData: {
      title: '割接管理-详情',
      header: { counterFieldList: [...] },  // 9 个 counter 字段（含 average）
      rows: [ ... ]
    }
  }
}
```

### 2.3 rows 字段（均为 String 类型，每字段附带 `xxx_format` 镜像字段，mock 实测）

| 字段 | 说明 | 取值 |
| --- | --- | --- |
| indicatorId | 指标 id | '100001'（总数）/ '100011'（取消）/ '100022'（失败）/ '100033'（成功）/ '100044'（成功率）/ '100055'（合规率），mock 中每组相同 |
| indicatorName | x 轴类目 | 饼图四分类（A~D，indicatorGroup '1'）/ 地市名（咸阳、商洛、安康、宝鸡、延安、榆林、汉中、渭南、网管中心、西安、铜川，共 11 个，indicatorGroup '2'~'6'） |
| moduleId | 模块 id | mock 中恒为 '1'（总割接） |
| moduleName | 模块名 | '总割接' |
| indicatorGroup | 指标组（converter 拆分依据） | '1' 总数（→ result.left，未消费）/ '2' 取消数 / '3' 失败数 / '4' 成功数 / '5' 成功率 / '6' 合规率 |
| indicatorGroupName | 指标组名 | 割接总数 / 取消数 / 失败数 / 成功数 / 成功率 / 合规率 |
| indicatorValue | 数值（Bar3dLineChart 消费） | 计数（'2'~'4'）或百分比（'5'/'6'，'100' / '87'） |
| indicatorUnit | 单位 | '个' / '%' |
| average | 平均值 | 前端合成均值行数据源（如 '99.381' / '2.9048' / '13.2'），同组各行值相同 |

### 2.4 数据形态要点

- mock 数据结构（module='1'）：indicatorGroup '1' 5 行（1 总数 + 4 分类）+ 每组 '2'~'6' 各 11 行地市 = 共 60 行。
- **均值行为前端合成**：converter 对 indicatorGroup '5' / '6' 的行追加合成行（indicatorGroup 加 `-1` 后缀如 '5-1'、indicatorGroupName 加「均值」、indicatorValue 取同组行携带的 average），服务端不单独下发均值序列。
- series id 匹配：Bar3dLineChart 的 seriesSettings 按 indicatorGroup（'-1' 后缀前的原值）匹配系列（presets.ts 中 id '2'~'6'、均值行 id '5-1'/'6-1'）。
- mock 中 `module='2'`（影响业务割接）分支的数据形态未在 mock 中体现（mock 不随 tab 切换变化，localMockUrl 静态文件局限）。

---

## 三、risk-dict（割接字典，8869，辅助视图）

- viewItemId `risk-dict` / viewPageId `noc-module-oriented-left-page`（**左屏页面 id，跨页复用**）。
- viewPageArgs：`{ dictType: 'netWorkCutovers' }`（割接管理字典）。
- 组件消费：`rows[].dictKey` 全量逗号拼接，作为 8881 请求的 `indicatorGroup` 过滤参数。
- rows 其余字段（dictName 等）在割接管理场景**未消费**；dictKey 的具体取值集合未读取（服务端真实数据，未验证），是否即 '1'~'6' 分组值待联调确认。

---

## 四、版本演进说明

| 版本 | 关键变更 |
| -------- | -------- |
| v1.0 | 初始版本：基于源码 + 8881 mock（risk-dict / 8875 无 mock，标注未验证项）建立两视图数据格式文档 |
