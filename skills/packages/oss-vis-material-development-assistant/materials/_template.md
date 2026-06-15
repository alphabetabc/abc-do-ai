---
title: 物料文档模板（5+1 段式）
description: materials/{name}/ 目录下 6 个文档文件的模板与编写规范，包含跨文档引用规范
version: 1.0.0
last_updated: 2026-06-12
---

# 物料文档模板（5+1 段式）

> 用于 `materials/{material-name}/` 目录下文档创建。复制本目录的 5 个文件到目标目录，按物料实际情况填充。

## 目录结构

```
materials/{material-name}/
├── README.md             # 1. 概述 + 三类维护内容索引（必填）
├── schema.md             # 2. Schema 维护（必填）
├── component-logic.md    # 3. 组件逻辑维护（必填）
├── data-model.md         # 4. 数据格式（必填）
├── common-tasks.md       # 5. 跨三类的常见修改（必填）
└── gotchas.md            # 6. 踩坑记录（选填，建议保留）
```

## 三类维护内容

| 维度             | 文档               | 关注点                               |
| ---------------- | ------------------ | ------------------------------------ |
| **Schema 维护**  | schema.md          | 配置面板、分组、字段、x-component    |
| **组件逻辑维护** | component-logic.md | TSX 代码、props、hooks、子组件、样式 |
| **数据格式**     | data-model.md      | dataModel.json、数据流、匹配规则     |

---

## 1. README.md 模板

```markdown
# {material-name}

## 1. 概述

**名称**：（中文名，从 oss-material.json 的 title 字段）

**用途**：一段话描述物料的核心功能、典型场景。

**所属分类**：{容器/布局、文本/标签、图表、地图、装饰……}

**复杂度**：{简单 | 中 | 高}

### 1.1 文件入口

| 文件                         | 作用                   |
| ---------------------------- | ---------------------- |
| `index.tsx`                  | 主组件入口             |
| `schema.ts`                  | 配置面板定义           |
| `dataModel.json`             | 数据契约（若无则省略） |
| `oss-material.json`          | 物料元信息             |
| `index.less`                 | 样式                   |
| `components/*.tsx`           | 子组件（如有）         |
| `doc/images/*.png`           | 文档截图（如有）       |
| `static/images/{name}/*.png` | 静态资源（如有）       |

### 1.2 核心能力

-   能力 1：一句话
-   能力 2：一句话
-   能力 3：一句话

### 1.3 适用场景

-   场景 1
-   场景 2

## 2. 三类维护内容索引

| 维度             | 文档                                       | 覆盖内容                   |
| ---------------- | ------------------------------------------ | -------------------------- |
| **Schema 维护**  | [schema.md](./schema.md)                   | （本物料的 schema 关注点） |
| **组件逻辑维护** | [component-logic.md](./component-logic.md) | （本物料的组件逻辑关注点） |
| **数据格式**     | [data-model.md](./data-model.md)           | （本物料的数据关注点）     |

## 3. Schema 结构（摘要）

> 1-3 句话概括

## 4. 组件逻辑（摘要）

> 1-3 句话概括

## 5. 数据格式（摘要）

> 1-3 句话概括

## 6. 常见修改

详见 [common-tasks.md](./common-tasks.md)。

跨三类维护的典型任务：

-   任务 1：xxx
-   任务 2：xxx

## 7. 注意事项

详见 [gotchas.md](./gotchas.md)。
```

---

## 2. schema.md 模板

````markdown
---
title: Schema 结构
description: {物料名} schema 分组结构、字段定义、x-component 选择
version: 1.0.0
last_updated: {YYYY-MM-DD}
---

# Schema 结构

源文件：`packages/{name}/schema.ts`

## 1. 顶层结构

```typescript
{
    materials: '{name}',
    fields: [
        defineConfigSchema({...}),       // 配置面板
        defineDataConfigSchema({...}),   // 数据面板
        defineInteractionSchema({...}),  // 交互面板（如有）
    ]
}
```
````

## 2. FormCollapse 分组详情

### 2.1 {分组 1} `$xxx`

| 字段 | 类型 | 标题 | x-component | 说明 |
| ---- | ---- | ---- | ----------- | ---- |
| ...  | ...  | ...  | ...         | ...  |

### 2.2 {分组 2} `$xxx`

...

## 3. 使用的特殊 x-component 清单

| 组件 | 用途 | 备注 |
| ---- | ---- | ---- |
| ...  | ...  | ...  |

## 4. 默认值参考

`schema.ts` 末尾 `defaultValue.config` 的关键项：

-   `width: xxx, height: xxx, left: xxx, top: xxx`
-   ...

## 5. 数据面板与交互面板

-   **数据面板**：`defineDataConfigSchema({...})`
-   **交互面板**：（如未启用，注明"当前未启用"）

````

---

## 3. component-logic.md 模板

```markdown
---
title: 组件逻辑维护
description: {物料名} 组件代码（index.tsx + 子组件）的维护要点
version: 1.0.0
last_updated: {YYYY-MM-DD}
---

# 组件逻辑维护

本文档说明 `{material-name}` 组件代码（`index.tsx` + 子组件）的维护要点。

> 与 [schema.md](./schema.md)（配置面板）和 [data-model.md](./data-model.md)（数据契约）并列。

## 1. 文件结构

````

{material-name}/ ├── index.tsx # 主组件 ├── index.less # 样式 ├── schema.ts # 配置面板（→ schema.md） ├── dataModel.json # 数据契约（→ data-model.md） ├── oss-material.json # 物料元信息 └── components/ # 子组件（如有） ├── ...

````

## 2. 主组件 `index.tsx`

### 2.1 入口签名

```typescript
const {ComponentName}: React.FC<DesignerField> = (props) => {
    const { config, dataSource, designer } = props;
    // ...
};
````

| props         | 类型      | 来源       | 用途                       |
| ------------- | --------- | ---------- | -------------------------- |
| `config`      | object    | schema     | 用户配置                   |
| `dataSource`  | array     | dataConfig | 数据数组                   |
| `designer`    | object    | 框架       | 设计器上下文               |
| `interaction` | object    | 框架       | 交互配置（如未启用，注明） |
| `children`    | ReactNode | 框架       | 子节点                     |

### 2.2 关键逻辑

#### 2.2.1 {关键逻辑 1 名称}

```typescript
// 关键代码
```

**注意**：{说明}

#### 2.2.2 {关键逻辑 2 名称}

...

### 2.3 维护检查清单

-   [ ] xxx
-   [ ] xxx

## 3. 子组件 `{SubComponent}.tsx`

### 3.1 职责

{一段话说明}

### 3.2 关键 props

| prop | 类型 | 来源 | 说明 |
| ---- | ---- | ---- | ---- |
| ...  | ...  | ...  | ...  |

### 3.3 渲染层级

```
{树状结构}
```

### 3.4 维护检查清单

-   [ ] xxx

## 4. 样式 `index.less`

### 4.1 命名规范

```less
.{material-name} {  // 根 class
    .{sub-element} { ... }
}
```

### 4.2 关键样式

```less
// 关键样式
```

### 4.3 维护检查清单

-   [ ] 根 class 与 oss-material.json.name 一致
-   [ ] 容器 `position: relative`
-   [ ] 事件层 `z-index` 高于其他

## 5. 常用工具函数

| 函数 | 来源 | 用途 |
| ---- | ---- | ---- |
| ...  | ...  | ...  |

## 6. 性能要点

| 场景 | 注意事项 |
| ---- | -------- |
| ...  | ...      |

## 7. 调试小技巧

### 7.1 {技巧名}

```typescript
// 临时调试代码
```

## 8. 维护历史

| 日期   | 变更   | 原因   |
| ------ | ------ | ------ |
| {date} | {变更} | {原因} |

````

---

## 4. data-model.md 模板

```markdown
---
title: 数据契约
description: {物料名} dataModel.json 字段定义、数据契约、dataSource 匹配规则
version: 1.0.0
last_updated: {YYYY-MM-DD}
---

# 数据契约

源文件：`packages/{name}/dataModel.json`

## 1. 顶层结构

```json
{
    "dataModelDefinition": {
        "name": "{name}",
        ...
        "header": {
            "dimensions": [...],
            "indicators": [...]
        },
        "rowConfig": {...}
    }
}
````

## 2. 字段说明

### 2.1 dimensions（维度）

| fieldName | fieldLabel | dataType | 说明 |
| --------- | ---------- | -------- | ---- |
| ...       | ...        | ...      | ...  |

### 2.2 indicators（指标）

| fieldName | fieldLabel | dataType | list | rowProperties | 说明 |
| --------- | ---------- | -------- | ---- | ------------- | ---- |
| ...       | ...        | ...      | ...  | ...           | ...  |

## 3. 数据流向

```
外部数据源
    ↓
dataConfig.json
    ↓
dataSource[]
    ↓
index.tsx (props.dataSource)
    ↓
{简述组件如何使用 dataSource}
```

## 4. 默认数据示例

`schema.ts` 中 `defaultValue.dataConfig.json`：

```json
[
    { ... }
]
```

## 5. 扩展建议

### 5.1 新增字段

1. 在 `dataModel.json` 的 `indicators` / `dimensions` 数组添加
2. 在组件中通过 `dataItem.xxx` 读取
3. （如需 schema 面板）通过 `...header.indicators` 展开

### 5.2 限制

-   列出当前不支持的能力（如多维度、维度参数等）

````

---

## 5. common-tasks.md 模板

```markdown
---
title: 常见修改任务
description: {物料名} 最常见的修改需求及对应的代码定位
version: 1.0.0
last_updated: {YYYY-MM-DD}
---

# 常见修改任务

本文档列出针对 `{material-name}` 最常见的修改需求及对应的代码定位。

## 任务 1：{任务名}

**场景描述**：{实际业务需求}

**涉及文件**：
- `schema.ts`：{改什么}
- `index.tsx`：{改什么}

**步骤**：

1. 在 `schema.ts` 的 xxx 处添加：

```typescript
xxx: {
    type: 'xxx',
    title: 'xxx',
    ...
},
````

2. 在 `index.tsx` 中读取：

```typescript
const xxx = config.xxx ?? defaultValue;
```

3. （可选）修改样式 / 默认值 / 静态资源

## 任务 2：{任务名}

...

## 任务 N：调整默认值

**涉及文件**：`schema.ts` 末尾 `defaultValue.config.xxx`

修改后**首次拖入**物料会使用新默认值。已配置的物料不受影响。

````

---

## 6. gotchas.md 模板

```markdown
---
title: 踩坑记录
description: {物料名} 实际开发/维护中遇到的坑、最佳实践和性能注意点
version: 1.0.0
last_updated: {YYYY-MM-DD}
---

# 踩坑记录

本文档记录 `{material-name}` 实际开发/维护中遇到的坑、最佳实践和性能注意点。

## 1. {分类1}：{问题标题}

**症状**：{表现}

**原因**：{为什么}

**修复**：{怎么解决}

## 2. {分类2}：{问题标题}

...

## N. 调试小技巧

### N.1 {技巧名}

```typescript
// 临时调试代码
````

## 维护历史

| 日期   | 问题   | 修复   |
| ------ | ------ | ------ |
| {date} | {问题} | {修复} |

````

---

## 编写建议

1. **三类分开**：Schema / 组件逻辑 / 数据格式 各自独立成文件，**不要混写**
2. **面向问题**：每个章节回答"我修改 X 时该看哪？"
3. **代码片段优先**：用代码片段替代大段说明
4. **保持简洁**：每个文件 100-300 行最佳，超过则拆分
5. **链接源码**：用 `packages/{name}/xxx.ts` 项目根相对路径引用具体文件（不带 `src/` 前缀、不带 `file:///`）
6. **标注风险**：性能、兼容性等风险点用 ⚠️ 标注
7. **更新 materials/README.md 状态**：每次新增/完成文档，同步更新清单

---

## 跨文档引用规范

### 从 `schema.md` → `component-logic.md` / `data-model.md`

- 在 `schema.md` 描述字段时，注明"组件读取方式"
- 示例：

```markdown
| 字段 | 类型 | 标题 | x-component | 组件读取方式 |
|------|------|------|-------------|--------------|
| `points` | array | 布局点 | `MonacoEditor` | `config.layout.points`（→ component-logic.md § 2.2.2） |
````

### 从 `component-logic.md` → `schema.md` / `data-model.md`

-   在 `component-logic.md` 描述 props 时，注明"配置来源"
-   示例：

```typescript
interface IndItemProps {
    dataItem: {
        indicatorId: string;        // ← data-model.md § 2.2
        indicatorValue: number;     // ← data-model.md § 2.2
    };
    indicatorValueSetting: {        // ← schema.md § 2.2
        offsetY: number;
        fontSetting: { ... };
    };
}
```

### 从 `common-tasks.md` → 三类文档

-   每个任务标注涉及的三类，示例：

```markdown
## 任务 1：新增一个全局配置项

涉及：

-   🟦 Schema：[schema.md § 2.1](./schema.md#21-布局配置-layout)
-   🟨 组件逻辑：[component-logic.md § 2.2.4](./component-logic.md#224-渲染结构)
-   ⬜ 数据：（无）
```
