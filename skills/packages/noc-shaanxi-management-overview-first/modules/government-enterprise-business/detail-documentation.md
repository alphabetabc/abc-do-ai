# Detail 模块详细文档

> **所属技能**：[noc-shaanxi-first-government-enterprise-business](./SKILL.md)（政府企业业务子技能）
> **所属父技能**：[noc-shaanxi-management-overview-first](../../SKILL.md)
> **本文档位置**：`.trae/skills/noc-shaanxi-management-overview-first/modules/government-enterprise-business/detail-documentation.md`

## 文档元信息

| 字段     | 值       |
| -------- | -------- |
| 文档版本 | v1.0     |
| 最后更新 | 2026-06-24 |

## 核心设计理念：配置驱动渲染

**重要提示**：整个政府企业业务模块（包括 Detail）采用**配置驱动渲染**的设计模式，`presets.ts` 是整个模块的**唯一入口和配置中心**。任何拓展或修改都必须从 `presets.ts` 开始考虑，遵循"配置优先"的原则。

## 概述

Detail 模块是政府企业业务模块的详情展示页面，负责展示业务规模和业务质量的详细数据。该模块采用左右分栏布局，左侧展示业务规模数据，右侧展示业务质量数据。

**核心架构**：`presets.ts` 配置 → `detail/index.tsx` 解析 → 动态组件加载 → 数据转换 → 渲染展示

## 目录结构

```
detail/
├── Container.tsx          # 容器组件
├── index.tsx              # 入口组件，包含数据请求逻辑
├── ind-show/              # 指标展示组件目录
│   ├── Gauge1.tsx         # 仪表盘组件1
│   ├── Gauge2.tsx         # 仪表盘组件2
│   ├── IndShow1.tsx       # 指标展示组件1
│   ├── IndShow1-v2.tsx    # 指标展示组件1 版本2
│   ├── IndShow2.tsx       # 指标展示组件2
│   ├── IndShow2-v2.tsx    # 指标展示组件2 版本2
│   ├── IndShow3.tsx       # 指标展示组件3
│   ├── Pie.tsx            # 饼图组件
│   ├── Pie3d.tsx          # 3D饼图组件
│   ├── Top5.tsx           # Top5排名组件
│   └── Top5.less          # Top5样式
└── multi-part/            # 多部分布局组件目录
    ├── index.ts           # 导出文件
    ├── LeftPart1.tsx      # 左侧布局1
    ├── LeftPart2.tsx      # 左侧布局2
    ├── LeftPart3.tsx      # 左侧布局3
    ├── LeftPart4.tsx      # 左侧布局4
    ├── LeftPart5.tsx      # 左侧布局5
    ├── RightPart1.tsx     # 右侧布局1
    ├── RightPart2.tsx     # 右侧布局2（未导出）
    ├── RightPart3.tsx     # 右侧布局3
    ├── RightPart4.tsx     # 右侧布局4
    └── RightPart5.tsx     # 右侧布局5
```

---

## 核心组件

### 1. 入口组件 (index.tsx)

**功能说明**: Detail 组件是整个详情页面的入口，负责：

- 根据业务类型动态加载左右两侧的展示组件
- 管理数据请求和状态
- 提供左右分栏布局

**关键特性**:

- 使用 `useMemo` 根据 `props.type` 动态获取配置
- 支持自定义数据转换器 (`convertor`)
- 支持自定义请求配置 (`useLeftRequest`, `useRightRequest`)

**数据请求流程**:

```
props.type → settings.get(type) → 获取 LeftElement/RightElement
                    ↓
           LeftDetail / RightDetail
                    ↓
           useRequest + API调用
                    ↓
           数据渲染到组件
```

**API 调用**:

- 左侧数据: `getLeftPartDataApi()`
- 右侧数据: `getRightPartDataApi()`

**请求参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| zoneId | string | 区域ID |
| zoneLevel | number | 区域级别 |
| busiType | string | 业务类型 |
| convertor | function | 数据转换函数 |

---

### 2. 容器组件 (Container.tsx)

**功能说明**: 提供详情页面的基础布局容器

**样式特点**:

- 宽度: 100%
- 高度: `calc(100% - 560px)`
- 左侧内边距: 35px
- 使用 flex 布局

---

### 3. 指标展示组件 (ind-show/)

#### 3.1 Gauge1.tsx - 仪表盘组件1

**功能**: 展示环形仪表盘指标

**特性**:

- 尺寸: 165px × 120px
- 包含装饰性边框元素
- 使用 `Gauge` 组件渲染环形进度

**Props**:
| 参数 | 类型 | 说明 |
|------|------|------|
| percent | number | 百分比值 |
| label | string | 标签文本 |

#### 3.2 Gauge2.tsx - 仪表盘组件2

**功能**: 展示小型环形仪表盘指标

**特性**:

- 尺寸: 170px × 120px
- 半径: 80px（小于 Gauge1）
- 更紧凑的布局

**Props**:
| 参数 | 类型 | 说明 |
|------|------|------|
| percent | number | 百分比值 |
| label | string | 标签文本 |

#### 3.3 IndShow1.tsx - 指标展示组件1

**功能**: 垂直列表形式展示多个指标

**特性**:

- 支持自定义颜色数组
- 使用数字翻牌器 `DigitalFlop` 展示数值
- 渐变文字效果

**Props**:
| 参数 | 类型 | 说明 |
|------|------|------|
| data | array | 指标数据数组 |
| colors | array | 颜色数组 |
| className | string | 样式类名 |
| style | object | 内联样式 |

**数据格式**:

```typescript
interface IndShowItem {
    id: string;
    name: string;
    value: number;
    percent: number;
    unit: string;
}
```

#### 3.4 Pie.tsx - 饼图组件

**功能**: 展示二维饼图

**特性**:

- 尺寸: 265px × 350px
- 背景图: `pie-bg.png`
- 默认颜色: `['#01b3f2', '#46d7da', '#fb6565', '#f8b551', '#2ed970']`

**Props**:
| 参数 | 类型 | 说明 |
|------|------|------|
| data | array | 饼图数据 |
| colors | array | 颜色数组（可选） |
| extraOpts | object | 额外配置（可选） |

#### 3.5 Pie3d.tsx - 3D饼图组件

**功能**: 展示三维饼图

**特性**:

- 使用 HighCharts 渲染3D效果
- 支持自定义尺寸和内半径

#### 3.6 Top5.tsx - Top5排名组件

**功能**: 展示行业分类Top5排名

**特性**:

- 基于 `IndTopN` 组件封装
- 矩形形状展示

**Props**:
| 参数 | 类型 | 说明 |
|------|------|------|
| title | string | 标题（默认: 行业分类top5） |
| width | number | 宽度 |
| data | array | 排名数据 |
| className | string | 样式类名 |

---

### 4. 多部分布局组件 (multi-part/)

#### 4.1 左侧布局组件 (LeftPart1-5)

**LeftPart1**:

- 布局: 左侧饼图 + 右侧Top5排名
- 包含: Pie3d + IndShow1 + Top5

**LeftPart2-5**:

- 各业务类型的专用布局
- 根据业务需求定制展示内容

#### 4.2 右侧布局组件 (RightPart1-5)

**RightPart1**:

- 布局: 2x2 仪表盘网格
- 包含: 4个 IndGauge2 组件

**RightPart3-5**:

- 各业务类型的专用质量指标展示

**RightPart2**:

- 当前未导出（注释状态）

---

## 数据流架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        Detail 组件                              │
├─────────────────────────────────────────────────────────────────┤
│  settings.get(type)                                            │
│       ↓                                                        │
│  ┌──────────────┐    ┌──────────────┐                          │
│  │ LeftElement  │    │ RightElement │                          │
│  │ LeftDetail   │    │ RightDetail  │                          │
│  └──────┬───────┘    └──────┬───────┘                          │
│         ↓                   ↓                                  │
│  ┌──────────────┐    ┌──────────────┐                          │
│  │ API: getLeft │    │ API: getRight│                          │
│  │ PartDataApi  │    │ PartDataApi  │                          │
│  └──────┬───────┘    └──────┬───────┘                          │
│         ↓                   ↓                                  │
│  ┌──────────────┐    ┌──────────────┐                          │
│  │ 业务规模数据  │    │ 业务质量数据  │                          │
│  └──────────────┘    └──────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 样式规范

### 颜色主题

| 元素     | 颜色    | 用途         |
| -------- | ------- | ------------ |
| 主色调   | #01b3f2 | 主要数据展示 |
| 辅助色1  | #46d7da | 图表配色     |
| 辅助色2  | #fb6565 | 强调/警告    |
| 辅助色3  | #f8b551 | 高亮         |
| 辅助色4  | #2ed970 | 成功/正常    |
| 文字颜色 | #cdf9fe | 标签文字     |
| 边框颜色 | #99bff0 | 装饰线条     |

### 字体规范

| 元素     | 字体            | 大小    |
| -------- | --------------- | ------- |
| 标签文本 | MicrosoftYaHei  | 16-18px |
| 数值展示 | YouSheBiaoTiHei | 30px    |
| 标题     | -               | -       |

---

## 扩展指南

### 添加新的布局组件

1. 在 `multi-part/` 目录下创建新文件
2. 在 `multi-part/index.ts` 中导出
3. 在 `presets.ts` 中配置业务类型映射

### 添加新的指标展示组件

1. 在 `ind-show/` 目录下创建新文件
2. 遵循现有组件的样式规范
3. 在需要的布局组件中引入使用

### 自定义数据转换

通过 `convertor` prop 实现数据转换：

```typescript
const customConvertor = (rawData) => {
    return rawData.map((item) => ({
        id: item.id,
        name: item.name,
        value: item.value,
        percent: item.percent,
        unit: '%',
    }));
};
```

---

## presets.ts - 配置驱动的核心入口

### 一、核心定位

**`presets.ts` 是整个政府企业业务模块的**配置中枢**和**唯一入口**，所有业务逻辑和渲染流程都从这里开始。**

任何对模块的拓展、修改或维护，都必须首先审视 `presets.ts` 的配置，理解现有配置后再进行操作。

### 二、核心职责

`presets.ts` 负责管理三大核心配置：

| 配置类型         | 职责                            | 影响范围                 |
| ---------------- | ------------------------------- | ------------------------ |
| **业务类型枚举** | 定义支持的业务类型及其编码      | 整个模块的数据请求和展示 |
| **概览布局配置** | 控制首页6个区域的元素位置       | overview 页面            |
| **详情配置**     | 定义业务类型与组件/转换器的映射 | **Detail 模块**          |

### 三、配置驱动渲染的完整流程

```
┌─────────────────────────────────────────────────────────────────────┐
│                      presets.ts (配置中心)                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐    │
│  │ overviewTypes   │  │ indOverviewSettings│ │ detailSettings  │    │
│  │ (业务类型枚举)   │  │ (概览布局配置)     │ │ (详情配置-Map)   │    │
│  └────────┬────────┘  └────────┬────────┘  └─────────┬────────┘    │
└───────────┼────────────────────┼─────────────────────┼─────────────┘
            │                    │                     │
            ▼                    ▼                     ▼
┌────────────────────────┐ ┌─────────────────────┐ ┌─────────────────┐
│   overview/index.tsx   │ │   overview-v2/...   │ │ detail/index.tsx│
│   (首页概览页面)       │ │   (首页概览v2)       │ │ (详情页面入口)   │
└────────────────────────┘ └─────────────────────┘ └────────┬────────┘
                                                           │
                                                           ▼
                                               ┌─────────────────────┐
                                               │  props.settings.get │
                                               │      (type)         │
                                               └──────────┬──────────┘
                                                          │
                          ┌───────────────────────────────┼───────────────────────────────┐
                          ▼                               ▼                               ▼
                   ┌──────────────┐              ┌──────────────┐              ┌──────────────┐
                   │ LeftElement  │              │ RightElement │              │  Convertors  │
                   │ (左侧组件)    │              │ (右侧组件)    │              │ (数据转换)   │
                   └──────┬───────┘              └──────┬───────┘              └──────┬───────┘
                          │                             │                             │
                          ▼                             ▼                             ▼
                   ┌──────────────┐              ┌──────────────┐              ┌──────────────┐
                   │ LeftPart1-5  │              │ RightPart1-5 │              │ API数据转换  │
                   │ (布局实现)    │              │ (布局实现)    │              │              │
                   └──────────────┘              └──────────────┘              └──────────────┘
```

### 文件位置

```
web/pages/management-overview-first/modules/government-enterprise-business/presets.ts
```

### 核心数据结构

#### 1. 业务类型枚举 (overviewTypes)

定义了6种政企业务类型：

| 业务类型 | 值  | 说明         |
| -------- | --- | ------------ |
| ICT      | 1   | ICT业务      |
| 专线     | 2   | 专线业务     |
| 5G专网   | 3   | 5G专网业务   |
| 物联网   | 4   | 物联网业务   |
| 企业宽带 | 5   | 企业宽带业务 |
| IDC      | 6   | IDC业务      |

#### 2. 概览布局配置 (indOverviewSettings)

控制首页概览页面6个区域的元素位置：

- `left-part` - 左上区域
- `left-middle` - 左中区域
- `left-bottom` - 左下区域
- `right-top` - 右上区域
- `right-middle` - 右中区域
- `right-bottom` - 右下区域

每个区域包含：

- `line` - 连接线位置配置
- `ind` - 指标展示位置配置

#### 3. 详情配置 (detailSettings) - 核心配置

**Map结构**: `key = 业务类型值`, `value = 配置对象`

**配置对象结构**:

| 字段           | 类型            | 说明                 |
| -------------- | --------------- | -------------------- |
| LeftElement    | React.Component | 左侧业务规模展示组件 |
| RightElement   | React.Component | 右侧业务质量展示组件 |
| leftConvertor  | Function        | 左侧数据转换函数     |
| rightConvertor | Function        | 右侧数据转换函数     |

### presets.ts 与 Detail 模块的关系

#### 数据流向

```
presets.ts (detailSettings)
         ↓
    Detail/index.tsx
         ↓
    props.settings.get(type)
         ↓
    获取 LeftElement / RightElement / convertors
         ↓
    LeftDetail / RightDetail 组件
         ↓
    API 请求 + convertor 转换
         ↓
    渲染到对应的布局组件
```

#### 核心关联代码

在 `detail/index.tsx` 中的关键逻辑：

```typescript
const {
    LeftElement = Empty,
    RightElement = Empty,
    useRightRequest,
    useLeftRequest,
    leftConvertor,
    rightConvertor,
} = useMemo(() => {
    return props.settings.get(props.type) ?? {};
}, [props.settings, props.type]);
```

**说明**:

- `props.settings` 即 `detailSettings` Map
- `props.type` 即业务类型值（如 '1' 代表 ICT）
- 根据业务类型动态获取对应的组件和转换函数

### 业务类型与组件映射表

| 业务类型 | 值  | LeftElement | RightElement |
| -------- | --- | ----------- | ------------ |
| 物联网   | 4   | LeftPart3   | RightPart1   |
| 专线     | 2   | LeftPart2   | RightPart1   |
| 5G专网   | 3   | LeftPart1   | RightPart3   |
| 企业宽带 | 5   | LeftPart5   | RightPart3   |
| IDC      | 6   | LeftPart3   | RightPart4   |
| ICT      | 1   | LeftPart4   | RightPart5   |

### Convertor 数据转换机制

#### 转换流程

```
原始API响应
    ↓
convertor(rawData)
    ↓
标准化数据格式
    ↓
布局组件渲染
```

#### 左侧数据转换 (leftConvertor)

**通用输出格式**:

```typescript
interface LeftDataItem {
    id: string; // 唯一标识
    name: string; // 指标名称
    value: number; // 指标值
    percent: string | number; // 百分比
    unit: string; // 单位
    rank?: string; // 排名（TopN场景）
    sliced?: boolean; // 是否切片（饼图场景）
    color?: string; // 颜色（自定义配色）
}
```

**不同业务的特殊处理**:

| 业务     | 输出结构       | 特殊处理                         |
| -------- | -------------- | -------------------------------- |
| 物联网   | 数组           | 简单映射                         |
| 专线     | `{pie1, pie2}` | 按 indicatorGroup 分组           |
| 5G专网   | `{pie, top5}`  | 按 indicatorGroup 分组，添加排名 |
| 企业宽带 | 数组           | 简单映射，添加排名               |
| IDC      | 数组           | 简单映射，添加排名               |
| ICT      | 数组           | 支持自定义颜色和切片             |

#### 右侧数据转换 (rightConvertor)

**通用输出格式**:

```typescript
interface RightDataItem {
    id: string; // 唯一标识
    label: string; // 显示标签
    name: string; // 指标名称
    value: string | number; // 指标值
    percent: number; // 百分比（归一化到 0-1）
    unit?: string; // 单位
}
```

### 环境配置支持

部分业务类型支持通过环境配置自定义行为：

```typescript
const {
    pie3dSliced, // 饼图切片名称
    colors, // 自定义颜色数组
} = getEnvironment('shaanxiCustomSettings.screen1.政企业务.detail.业务类型') ?? {};
```

**支持环境配置的业务**: 专线、5G专网、ICT

### 配置优先：拓展的核心原则

**任何拓展工作都必须从 `presets.ts` 开始！**

这是模块设计的核心原则，确保配置是唯一的真相来源。拓展前请先问自己：

| 问题                     | 说明                                  |
| ------------------------ | ------------------------------------- |
| 现有的配置能否满足需求？ | 优先考虑复用现有组件和转换器          |
| 是否需要新增业务类型？   | 修改 `overviewTypes`                  |
| 是否需要新增布局组件？   | 先考虑是否可以复用 LeftPart/RightPart |
| 是否需要自定义数据转换？ | 在 `convertor` 中实现                 |
| 是否需要环境配置支持？   | 添加对应的环境变量路径                |

**思考流程图**：

```
需求分析
    ↓
审视 presets.ts
    ↓
┌───────────────────────────────────┐
│ 现有配置能否满足？                 │
└───────────────┬───────────────────┘
                │
        ┌──────┴──────┐
        ↓             ↓
      是              否
        │             │
        ↓             ↓
   调整配置      添加新配置/组件
        │             │
        └──────┬──────┘
                ↓
           验证配置
                ↓
           测试渲染
```

### 扩展新业务类型的步骤

**步骤 0：审视现有配置**（最重要！）

在开始编码前，务必查看 `presets.ts` 中现有的业务配置，确认：

- 是否有相似的业务类型可以复用其配置
- 是否可以通过调整 convertor 满足需求
- 是否真的需要新增组件

**步骤 1：添加业务类型枚举**（如需）：

    ```typescript
    {
        name: '新业务',
        value: '7',
    }
    ```

2. **创建布局组件**（如需）：
    - 在 `multi-part/` 下创建 `LeftPartX.tsx` 和 `RightPartX.tsx`
    - 在 `multi-part/index.ts` 中导出

3. **配置 detailSettings**：

    ```typescript
    detailSettings.set('7', {
        LeftElement: Detail.LeftPartX,
        RightElement: Detail.RightPartX,
        leftConvertor: (res) => {
            /* 转换逻辑 */
        },
        rightConvertor: (res) => {
            /* 转换逻辑 */
        },
    });
    ```

4. **（可选）添加环境配置**：
    - 在环境配置中添加 `shaanxiCustomSettings.screen1.政企业务.detail.新业务`

### 关键设计要点

1. **松耦合设计**：业务配置与组件实现分离，通过配置驱动渲染
2. **可扩展性**：新增业务类型只需添加配置，无需修改核心逻辑
3. **数据标准化**：convertor 将异构的 API 响应转换为统一格式
4. **环境适配**：支持通过环境变量动态调整行为和样式

---

## 注意事项

1. **RightPart2** 当前处于注释状态，使用时需确认是否启用
2. 数据请求依赖 `currentZone` 和 `type`，需确保这两个参数已正确传递
3. 布局尺寸基于固定像素值，响应式调整需谨慎
4. 样式文件使用 `.less` 格式，注意变量和混合的使用
5. **detailSettings 必须与业务类型值一一对应**，否则会导致组件加载失败
6. **convertor 必须返回正确的数据格式**，否则布局组件可能无法正确渲染