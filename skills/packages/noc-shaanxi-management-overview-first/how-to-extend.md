# 如何扩展本技能（持续进化指南）

> **所属技能**：`noc-shaanxi-management-overview-first`
> **本文档位置**：`.trae/skills/noc-shaanxi-management-overview-first/how-to-extend.md`

## 文档元信息

| 字段     | 值       |
| -------- | -------- |
| 文档版本 | v1.0     |
| 最后更新 | 2026-06-24 |

本技能随 `web/pages/management-overview-first/` 模块一起**持续进化**。本文档规定新增 / 更新 / 删除子组件文档的统一流程，确保索引与源码同源。

---

## 一、`components/` vs `modules/`：何时放哪里

这是最容易混淆的地方，**先判断归属再决定目录**。

### 判定流程

```
新增/更新的是？
    │
    ├── 一个独立 React 组件（单文件为主，hooks 辅助）
    │     │
    │     └── 放进 components/，命名 <ComponentName>.md
    │
    ├── 一个完整业务模块（含 presets.ts、配置中心、子组件群）
    │     │
    │     └── 放进 modules/<module-name>/，命名 SKILL.md + 详细文档
    │
    └── 仅是公共工具 / 类型定义 / hooks
          │
          └── 不开新文件，附在最近父级（如所属组件 / 模块）的文档末尾
```

### `components/` —— 纯组件类

| 特征 | 说明 |
| ---- | ---- |
| 范围 | 单个 React 组件，1-3 个文件 |
| 配置 | 不含 `presets.ts`，最多 props |
| 子文件 | 通常没有；如有 hooks / 子组件，合并在同一份 `.md` 内描述 |
| 示例 | image-gis（中心区 GIS 组件） |
| 文件格式 | 单个 `components/<name>.md`，顶部指向源码，主体为组件说明 + 扩展指南 |

### `modules/` —— 业务模块类

| 特征 | 说明 |
| ---- | ---- |
| 范围 | 一个完整业务模块，含入口、配置中心、子组件群 |
| 配置 | **通常含** `presets.ts` 或同等配置中心 |
| 子文件 | 入口 + 配置 + 多个子组件，需要 `SKILL.md` 作模块级索引，再分子文档 |
| 示例 | government-enterprise-business |
| 文件格式 | `modules/<name>/` 子目录，必含 `SKILL.md`；复杂模块可拆 `detail.md` / `overview.md` 等 |

### 边界情况

| 场景 | 处理方式 |
| ---- | ---- |
| 一个组件含多个 hooks / 子组件 | 仍然算 `components/`，把 hooks 写进同一份 `.md` 的"核心 Hooks"小节 |
| 一个业务模块只有一个组件 | 仍然算 `modules/`，因为业务语义比组件数量更重要；后续如拆分再调整 |
| 不确定归哪边 | 默认放 `components/`；如发现跨子模块调用越来越多，再迁移到 `modules/` |

---

## 二、新增子组件文档

按以下步骤执行（**前两步必做，第三步按需**）：

### 步骤 1：建文件

```
# 纯组件
components/<ComponentName>.md

# 业务模块
modules/<module-name>/
├── SKILL.md                # 必填：模块级入口
└── <aspect>-documentation.md   # 可选：aspect 详细文档
```

模板见下文「文档模板」一节。

### 步骤 2：登记到 SKILL.md「子组件文档索引」

打开 `SKILL.md`，在对应的小节（`components/` 或 `modules/`）表格里追加一行：

```markdown
| <子组件显示名>     | [components/<name>.md](./components/<name>.md) 或 [modules/<name>/SKILL.md](./modules/<name>/SKILL.md) | `web/.../源码路径/` | <一句话能力说明> |
```

### 步骤 3：同步更新其他文档（按需）

- `principles.md`：若新增的设计原则与现有文档不一致。
- `how-to-extend.md`（本文档）：若发现新的判定场景或边界情况。
- `SKILL.md`「已知差异 / 注意事项」：若新增的源码有特殊注意事项。

---

## 三、更新现有子组件文档

### 触发场景

| 改动类型 | 必须同步 |
| -------- | -------- |
| 子组件源码文件增删 / 重命名 | 子组件文档 + SKILL.md「子组件文档索引」 |
| 子组件新增 prop / API | 子组件文档「属性参考」/「API 控制接口」 |
| 子组件调整核心算法 | 子组件文档对应章节 + `principles.md`（若涉及设计原则） |
| 业务模块新增业务类型 | 模块 SKILL.md + 业务模块子文档 + `presets.ts` 描述 |
| 公共组件（如 metaHumanPresets）变化 | 所有引用该能力的子组件文档 |

### 检查清单

- [ ] 子组件文档版本号 + `updated` 同步刷新
- [ ] SKILL.md 表格行内容与子组件文档实际能力一致
- [ ] 跨文档链接（特别是"详见 X"）目标文件未失效
- [ ] `principles.md` 中"已知差异"如有调整同步更新

---

## 四、删除 / 归档子组件文档

### 软删除（推荐）

1. 在 SKILL.md「子组件文档索引」表格行末加 ⚠️ 标记，注明归档原因。
2. 在子组件文档顶部加 `> 归档（自 vX.Y 起）：<归档原因>` 提示。
3. 文件保留 1-2 个版本周期，确认无引用后再物理删除。

### 硬删除

仅当源码已被删除且无任何引用时执行：

1. 物理删除 `components/<name>.md` 或 `modules/<name>/`。
2. SKILL.md「子组件文档索引」移除对应行。
3. `principles.md`「已知差异」移除相关条目。

---

## 五、文档模板

### `components/<name>.md` 模板

```markdown
# <组件显示名>

> **所属技能**：`noc-shaanxi-management-overview-first`
> **本文档位置**：`.trae/skills/noc-shaanxi-management-overview-first/components/<name>.md`

## 文档元信息

| 字段     | 值       |
| -------- | -------- |
| 文档版本 | v1.0     |
| 最后更新 | YYYY-MM-DD |

## 组件概述

[<ComponentName>.tsx](web/.../源码路径/<ComponentName>.tsx) 是一句话功能描述。

## 核心功能

### 1. <功能点 1>

...

### 2. <功能点 2>

...

## 核心 Hooks（如有）

...

## 属性参考 / API 接口

...

## 扩展指南

...

## 使用场景

...

## 相关文件

...

## 版本演进说明

| 版本 | 关键变更 |
| ---- | -------- |
| v1.0 | 初始版本 |
```

### `modules/<name>/SKILL.md` 模板

```markdown
---
name: '<module-name>'
version: '1.0'
updated: 'YYYY-MM-DD'
description: '...'
---

# <模块显示名>

> **所属技能**：`noc-shaanxi-management-overview-first`
> **本文档位置**：`.trae/skills/noc-shaanxi-management-overview-first/modules/<name>/SKILL.md`

## 文档元信息

| 字段     | 值       |
| -------- | -------- |
| 文档版本 | v1.0     |
| 最后更新 | YYYY-MM-DD |

## 核心原则 / 定位

...

## 模块位置

`web/.../路径/`

## 核心功能区域

| 区域 | 路径 | 说明 |
| ---- | ---- | ---- |

## 详细文档

- [<aspect>.md](./<aspect>.md) - 描述
- ...

## 关键文件速查

...

## 版本演进说明

...
```

---

## 六、版本号约定

本技能采用 `MAJOR.MINOR` 两段式版本号。

| 变更类型 | 版本号动作 |
| -------- | ---------- |
| 新增子组件文档 / 新增目录结构 | MINOR +1 |
| 删除子组件 / 调整目录结构 | MAJOR +1, MINOR 归零 |
| 文字 / 表格微调，不影响结构 | MINOR +1 |
| 同步源码版本号 | 仅刷新 `updated` 字段，文档版本不变 |

每次版本号变更需在对应文档的「版本演进说明」表格中追加一行。

---

## 七、跨技能引用约定

**引用其他技能时只写 skill id，不写文件路径**，便于技能迁移和重构：

| 场景 | 写法 |
| ---- | ---- |
| 引用其他技能 | `@<skill-id>`（如 `@noc-shaanxi-ui-streamer-path`） |
| 引用本文档内部文件 | 相对路径 Markdown 链接（`./principles.md`） |
| 引用源码 | 相对路径 Markdown 链接（`web/...`） |

---

## 八、版本演进说明

| 版本  | 关键变更                                                                                          |
| ----- | ------------------------------------------------------------------------------------------------- |
| v1.0  | 初始版本：把"如何扩展"的规则从 SKILL.md 拆出为独立文档，明确 `components/` vs `modules/` 判定流程 |