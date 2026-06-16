# API 参考文档

公共 `viewPageId: "guarantee-right-page"`，接口位于 `apps/main/request/right.ts`。

---

## 1. 左栏旗帜统计

### getTownDamageStatisticsApi

**用途**：左栏蓝/黄/红三色旗帜数值

**viewItemId**：`emergency-support-statistics-of-damage-red-yellow-blue`

**请求参数**：

```typescript
{
  zoneName?: string;    // 区域名称
  zoneLevel?: string;   // 区域级别
  parentName?: string;  // 父区域名称，默认 "-1"
  regionName?: string;  // 地市名称，默认 "-1"
  dataTime?: string;    // 时间戳 "YYYY-MM-DD HH:mm:ss"
}
```

**响应结构**：

```typescript
{
    blue: number; // 蓝色旗子数量
    red: number; // 红色旗子数量
    yellow: number; // 黄色旗子数量
}
```

**Mock 路径**：`/static/mock/emergency/guarantee-right-page-emergency-support-statistics-of-damage-red-yellow-blue.json`

---

## 2. 左栏区域汇总表

### getTownDamageStatisticsZoneApi

**用途**：左栏区域汇总表格数据

**viewItemId**：`emergency-support-statistics-of-damage`

**请求参数**：

```typescript
{
  zoneName?: string;
  zoneLevel?: string;
  parentName?: string;  // 默认 "-1"
  regionName?: string;  // 默认 "-1"
  dataTime?: string;
}
```

**响应结构**：`Array<{ zoneName: string; isRedNbr: number; isYellowNbr: number; isBlueNbr: number; renderKey: string }>`

**Mock 路径**：`/static/mock/emergency/guarantee-right-page-emergency-support-statistics-of-damage.json`

---

## 3. 中栏物理站表格

### getTownshipOutOfServicePhysicsApi

**用途**：中栏乡镇退服-物理站表格数据

**viewItemId**：`township-out-of-service-physics`

**请求参数**：

```typescript
{
  zoneName?: string;
  zoneLevel?: string;
  parentName?: string;
  regionName?: string;
  dataTime?: string;
}
```

**响应结构**：`Array<{ severity: string; town: string; hxcDis: number; hxcNum: number; zycDis: number; zycNum: number; zccDis: number; zccNum: number; buildDis: number; buildNum: number; blockingRate: number; renderKey: string }>`

**Mock 路径**：`/static/mock/emergency/guarantee-right-page-township-out-of-service-physics.json`

---

## 4. 右栏出局路由表

### getTransmissionInterruptApi

**用途**：右栏乡镇出局路由表格数据

**viewItemId**：`transmission-interruption`

**请求参数**：

```typescript
{
  zoneName?: string;
  zoneLevel?: string;
  parentName?: string;
  regionName?: string;
  dataTime?: string;
}
```

> 内部有二次映射：`zoneLevel === "2" ? "2" : "3"`；`zoneLevel === "4"` 时 zoneName 取 `parentName`，`zoneLevel === "5"` 时取 `regionName`。

**响应结构**：`Array<{ alarmType: string; regionName: string; parentRegion: string; renderKey: string }>`

**Mock 路径**：`/static/mock/emergency/guarantee-right-page-transmission-interruption.json`

---

## 5. 弹窗物理退服

### getTownshipOutOfServiceCountPhysicsApi

**用途**：退服统计弹窗-物理退服数据

**viewItemId**：`township-out-of-service-count-physics`

**请求参数**：

```typescript
{
  zoneName?: string;    // 区域名称
  zoneLevel?: string;   // 区域级别
  parentName?: string;  // 父区域名称，默认 "-1"
  regionName?: string;  // 地市名称，默认 "-1"
  dataTime?: string;    // 时间戳 "YYYY-MM-DD HH:mm:ss"
}
```

**响应结构**：

```typescript
{
    type: "physical";
    zoneLevel: string;
    rows: Array<{
        region?: string; // 地市名（省级）
        city?: string; // 区县名（地市级）
        town?: string; // 乡镇名（区县级）
        phyBlock: number; // 物理退服数
        phyTotal: number; // 物理退服总数
        hxcBlock: number; // 核心层阻断
        hxcTotal: number; // 核心层总数
        zycBlock: number; // 重要层阻断
        zycTotal: number; // 重要层总数
        zccBlock: number; // 支撑层阻断
        zccTotal: number; // 支撑层总数
        scanTime?: string; // 数据采集时间
        zoneLevel?: string; // 当前行层级
    }>;
    columns: Array<{ fieldName: string; label: string }>;
    dataTime: string; // 取自 rows[0]?.scanTime
}
```

**错误降级**：

```typescript
{ type: "physical", rows: [], columns: [], dataTime: "", zoneLevel: opts.zoneLevel }
```

**Mock 路径**：`/static/mock/emergency/township-out-of-service-count-physics-{zoneLevel}.json`

---

## 6. 弹窗逻辑退服

### getTownshipOutOfServiceCountLogicApi

**用途**：退服统计弹窗-逻辑退服数据

**viewItemId**：`township-out-of-service-count-logic`

**请求参数**：

```typescript
{
  zoneName?: string;
  zoneLevel?: string;
  parentName?: string;
  regionName?: string;
  dataTime?: string;
}
```

**响应结构**：

```typescript
{
    type: "logic";
    zoneLevel: string;
    rows: Array<{
        region?: string; // 地市名
        city?: string; // 区县名
        town?: string; // 乡镇名
        gsmBlock: number; // 2G退服数
        gsmRate: number; // 2G退服率
        gsmTotal: number; // 2G总数
        enodeBlock: number; // 4G退服数
        enodeRate: number; // 4G退服率
        enodeTotal: number; // 4G总数
        gnodeBlock: number; // 5G退服数
        gnodeRate: number; // 5G退服率
        gnodeTotal: number; // 5G总数
        scanTime?: string;
        zoneLevel?: string;
    }>;
    columns: Array<{ fieldName: string; label: string }>;
    dataTime: string;
}
```

**错误降级**：

```typescript
{ type: "logic", rows: [], columns: [], dataTime: "", zoneLevel: opts.zoneLevel }
```

**Mock 路径**：`/static/mock/emergency/township-out-of-service-count-logic-{zoneLevel}.json`

---

## ExitServiceDetail 弹窗下钻参数构建

### buildRequestParams() 各层级映射

| 场景             | 请求目标层级 | zoneName      | zoneLevel              | parentName    | regionName    |
| ---------------- | ------------ | ------------- | ---------------------- | ------------- | ------------- |
| 初始（无下钻）   | province     | "广东省"      | ZoneLevelEnum.province | "-1"          | "-1"          |
| 点击 province 行 | region       | 该行 `region` | ZoneLevelEnum.region   | "-1"          | "-1"          |
| 点击 region 行   | city         | 该行 `city`   | ZoneLevelEnum.city     | 该行 `region` | "-1"          |
| 点击 city 行     | town         | 该行 `town`   | ZoneLevelEnum.town     | 该行 `city`   | 该行 `region` |

### dataTime 处理

- 下钻路径最后一条有 `dataTime` → 复用
- 否则使用 `dayjs().format("YYYY-MM-DD HH:mm:ss")`

### 弹窗 API 选择

```typescript
const api = state.exitServiceType === ServiceType.Logical
  ? getTownshipOutOfServiceCountLogicApi
  : getTownshipOutOfServiceCountPhysicsApi;
```

### converter 转换器

- 提取 `data.viewItemData.rows` 为数据源
- 合并 `dimFieldList` + `counterFieldList` 为列定义
- 附加 `type`、`zoneLevel`、`dataTime`（`rows[0]?.scanTime`）

### dataZoneLevel 自动计算

弹窗 API 调用时传入第二个参数 `extra: { dataZoneLevel }`，自动计算公式：

| 当前 zoneLevel | dataZoneLevel 值 |
| --- | --- |
| province | ZoneLevelEnum.region |
| region | ZoneLevelEnum.city |
| 其他 | ZoneLevelEnum.town |

---

## Mock 数据结构示例

本节列出 6 个 Mock 文件的最小化可用结构（按 `viewItemId` 索引）。开发新接口或调整响应字段时，可作为参考。

### 1. `emergency-support-statistics-of-damage-red-yellow-blue.json`（左栏旗帜）

```json
[
    {
        "totalBlue": 12,
        "totalRed": 3,
        "totalYellow": 7
    }
]
```

> **注意**：`right.ts:721-725` 取 `rows[0]`，如果返回空数组会全部回退为 0。

### 2. `emergency-support-statistics-of-damage.json`（左栏区域汇总表）

```json
[
    {
        "zoneName": "广州市",
        "isRedNbr": 2,
        "isYellowNbr": 5,
        "isBlueNbr": 8,
        "dataTime": "2026-06-16 10:00:00"
    },
    {
        "zoneName": "深圳市",
        "isRedNbr": 1,
        "isYellowNbr": 3,
        "isBlueNbr": 6,
        "dataTime": "2026-06-16 10:00:00"
    }
]
```

> **关键**：`dataTime` 是 `dataTime` 同步链路的源头（`Context.tsx:144`）。

### 3. `township-out-of-service-physics.json`（中栏物理站）

```json
[
    {
        "severity": "red",
        "town": "从化区-良口镇",
        "hxcDis": 1,
        "hxcNum": 2,
        "zycDis": 0,
        "zycNum": 1,
        "zccDis": 0,
        "zccNum": 3,
        "buildDis": 2,
        "buildNum": 5,
        "blockingRate": 40.0
    }
]
```

> **注意**：`severity` 字段值必须是 `red/yellow/blue` 之一（与 `ColorLevelString` 对齐）。

### 4. `transmission-interruption.json`（右栏出局路由）

```json
[
    {
        "alarmType": "乡镇全阻",
        "regionName": "良口镇",
        "parentRegion": "从化区"
    }
]
```

> **关键**：`alarmType` 是右栏过滤字段（与 `AlarmLevelString` 映射对应）。

### 5. `township-out-of-service-count-physics-{zoneLevel}.json`（弹窗物理退服）

```json
{
    "data": {
        "viewItemData": {
            "header": {
                "dimFieldList": [
                    { "fieldName": "region", "label": "地市" }
                ],
                "counterFieldList": [
                    { "fieldName": "phyBlock", "label": "物理退服数" }
                ]
            },
            "rows": [
                {
                    "region": "广州市",
                    "phyBlock": 5,
                    "phyTotal": 120,
                    "hxcBlock": 1,
                    "hxcTotal": 10,
                    "zycBlock": 2,
                    "zycTotal": 20,
                    "zccBlock": 2,
                    "zccTotal": 90,
                    "scanTime": "2026-06-16 09:55:00",
                    "zoneLevel": "3"
                }
            ]
        }
    }
}
```

> **注意**：Mock 文件命名带 `-{zoneLevel}` 后缀（如 `-2`, `-3`, `-4`），由 `right.ts:774` 动态拼接。

### 6. `township-out-of-service-count-logic-{zoneLevel}.json`（弹窗逻辑退服）

```json
{
    "data": {
        "viewItemData": {
            "header": {
                "dimFieldList": [
                    { "fieldName": "region", "label": "地市" }
                ],
                "counterFieldList": [
                    { "fieldName": "gsmBlock", "label": "2G退服数" }
                ]
            },
            "rows": [
                {
                    "region": "广州市",
                    "gsmBlock": 3,
                    "gsmRate": 2.5,
                    "gsmTotal": 120,
                    "enodeBlock": 5,
                    "enodeRate": 4.2,
                    "enodeTotal": 119,
                    "gnodeBlock": 2,
                    "gnodeRate": 3.3,
                    "gnodeTotal": 60,
                    "scanTime": "2026-06-16 09:55:00",
                    "zoneLevel": "3"
                }
            ]
        }
    }
}
```

### Mock 文件命名规范速查

| viewItemId | Mock 文件名模式 | 行数要求 |
| --- | --- | --- |
| `emergency-support-statistics-of-damage-red-yellow-blue` | `...damage-red-yellow-blue.json` | 1 行 |
| `emergency-support-statistics-of-damage` | `...statistics-of-damage.json` | ≥1 行 |
| `township-out-of-service-physics` | `...out-of-service-physics.json` | ≥1 行 |
| `transmission-interruption` | `...transmission-interruption.json` | ≥1 行 |
| `township-out-of-service-count-physics` | `...count-physics-{zoneLevel}.json` | 按 `zoneLevel` 多个文件 |
| `township-out-of-service-count-logic` | `...count-logic-{zoneLevel}.json` | 按 `zoneLevel` 多个文件 |

---

## 版本信息

| 字段 | 值 |
| --- | --- |
| **Skill ID** | `gd-es-next-right-damage-to-towns` |
| **当前版本** | `1.1.0` |
| **最后更新** | `2026-06-16` |
| **维护者** | Emergency Support Team |
| **所属 Skill** | `gd-es-next-right-damage-to-towns`（[SKILL.md](./SKILL.md)） |
| **接口文件** | `apps/main/request/right.ts`（6 个 viewItemId） |
| **公共 viewPageId** | `guarantee-right-page` |
| **Mock 根目录** | `/static/mock/emergency/` |

## 版本历史

| 版本 | 日期 | 变更摘要 |
| --- | --- | --- |
| `1.1.0` | `2026-06-16` | 补充 frontmatter 关联元数据；明确"6 个接口 → 6 个 viewItemId"清单与公共 `viewPageId`；完善弹窗 API 错误降级说明；新增「Mock 数据结构示例」章节（6 个 JSON 模板 + 命名规范速查表） |
| `1.0.0` | `2026-06-02` | 初版发布：覆盖左栏 2 接口、中栏 1 接口、右栏 1 接口、弹窗 2 接口的请求参数/响应结构/Mock 路径 |

## 适用范围

- ✅ **适用**：查询 6 个接口的请求参数/响应字段、viewItemId、Mock 路径、错误降级形态
- ✅ **适用**：排查数据缺失/字段映射/类型错误问题
- ✅ **适用**：弹窗下钻参数构建的各层级映射（province → region → city → town）
- ✅ **适用**：Mock 数据结构开发与字段对齐（详见「Mock 数据结构示例」6 个 JSON 模板）
- ⚠️ **谨慎**：替换 Mock 路径时同步更新 `getViewItemDataApi` 的 `localMockUrl`
- ❌ **不适用**：本模块外的接口（如网络规模、左屏应急资源）
