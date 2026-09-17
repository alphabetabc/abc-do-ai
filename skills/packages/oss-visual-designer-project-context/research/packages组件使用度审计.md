# src/packages 组件使用度审计报告

> 审计日期：2026-07-20
> 任务编号：`task-2026-07-20-002`（附加调研）
> 审计范围：`src/packages/` 全量子目录
> 目的：找出历史遗留的死代码组件，避免每次扫描浪费 token

---

## 1. 审计方法

对 `src/packages/` 下每个组件目录，搜索以下引用模式：

1. **ES import 引用**：`from '@Src/packages/xxx'`、`from '../packages/xxx'`、`from './xxx'`（相对路径）
2. **物料注册**：`registerLocalMaterials({ type: 'xxx' })` 中是否注册
3. **字符串字面量**：组件名出现在其他文件中（区分同名不同路径的情况）

**入口分析**：`src/packages/local-material-init.tsx` 只注册了 `stadiums-3d` 和 `scene-3d-fbx` 两个本地物料。其他组件需要通过外部 import 才能被使用。

---

## 2. 审计结果总览

| 组件目录 | 状态 | 外部引用数 | 是否注册为本地物料 |
| --- | --- | --- | --- |
| `packages/model-3d/stadiums-3d` | ✅ 使用 | 在 `local-material-init.tsx` 注册 | 是 |
| `packages/model-3d/scene-3d-fbx` | ✅ 使用 | 在 `local-material-init.tsx` 注册 | 是 |
| `packages/model-3d/common` | ✅ 使用 | 被 `stadiums-3d` 和 `scene-3d-fbx` 内部引用 | — |
| `packages/utils` | ✅ 使用 | 被其他 packages 子目录内部引用 | — |
| `packages/base/iframe` | ❌ 死代码 | 0 | 否 |
| `packages/base/countdown` | ❌ 死代码 | 0 | 否 |
| `packages/container/tabs` | ❌ 死代码 | 0 | 否 |
| `packages/container/rank-panel` | ❌ 死代码 | 0 | 否 |
| `packages/container/scroll-panel` | ❌ 死代码 | 0 | 否 |
| `packages/base/index.ts` | ❌ 死代码 | 0（`baseSchema`/`baseDefaultValue`/`baseInformation` 零引用） | — |
| `packages/constants.js` | ⚠️ 待确认 | 未在本审计深入搜索 | — |
| `packages/index.tsx` | ✅ 使用 | 被 `local-material-init.tsx` 引用 `registerLocalMaterials` | — |
| `packages/local-material-init.tsx` | ✅ 使用 | 被 `src/initialize/index.js` 调用 | — |

**死代码组件：5 个**（`base/iframe`、`base/countdown`、`container/tabs`、`container/rank-panel`、`container/scroll-panel`）

**死代码聚合文件：1 个**（`base/index.ts`，导出 `baseSchema`/`baseDefaultValue`/`baseInformation` 三个无人引用的常量）

---

## 3. 详细审计表

### 3.1 ✅ 使用中

#### `packages/model-3d/stadiums-3d`
- **注册位置**：[local-material-init.tsx#L7](src/packages/local-material-init.tsx#L7)
- **类型**：`'stadiums-3d'`
- **状态**：通过 `localMaterialInitializer()` 在 [initialize/index.js#L16](src/initialize/index.js#L16) 注册

#### `packages/model-3d/scene-3d-fbx`
- **注册位置**：[local-material-init.tsx#L17](src/packages/local-material-init.tsx#L17)
- **类型**：`'scene-3d-fbx'`
- **状态**：同上

#### `packages/model-3d/common`
- **状态**：被 `stadiums-3d` 和 `scene-3d-fbx` 内部引用（hooks、utils）

#### `packages/utils`
- **状态**：被其他 packages 子目录内部引用（`common.ts`、`tween.ts`）

#### `packages/index.tsx`
- **状态**：导出 `registerLocalMaterials` / `findLocalMaterial` / `findLocalSchema`，被 `local-material-init.tsx` 和其他地方使用

#### `packages/local-material-init.tsx`
- **状态**：被 [initialize/index.js#L3](src/initialize/index.js#L3) 引用

---

### 3.2 ❌ 死代码

#### `packages/base/iframe`（[src/packages/base/iframe/](src/packages/base/iframe)）
- **文件**：`index.js`、`custom.js`、`schema.ts`、`oss-material.json`、`style.less`
- **外部引用数**：0
- **物料注册**：未注册
- **备注**：
  - `index.js` 导出 `IframeTpl` 组件，无人引用
  - `custom.js` 原本 dispatch `component/dependencies`（在 task-002 中已清理调用方，但 `custom.js` 本身仍在原地）
  - 与 `src/components/iframe/`、`src/formily/widgets/dynamic-data/iframe/`、`packages/material-helper/src/iframe-app/` 是**不同代码**，不要混淆

#### `packages/base/countdown`（[src/packages/base/countdown/](src/packages/base/countdown)）
- **文件**：`index.js`
- **外部引用数**：0
- **物料注册**：未注册
- **状态**：整个目录死代码

#### `packages/base/index.ts`（[src/packages/base/index.ts](src/packages/base/index.ts)）
- **导出**：`baseSchema`、`baseDefaultValue`、`baseInformation`
- **外部引用数**：0
- **备注**：聚合 `base/iframe` 的 schema/defaultValue/materialInfo，但本身无人引用

#### `packages/container/tabs`（[src/packages/container/tabs/](src/packages/container/tabs)）
- **文件**：`index.js`、`table.js`、`VTabToSelect.js`
- **外部引用数**：0
- **物料注册**：未注册
- **备注**：
  - 用户已确认废弃（"这个组件没啥用，已经废弃了，属于历史代码"）
  - `index.js` 原本有 `tab/bind` 死代码 dispatch（在 task-002 中已清理）
  - `VTabToSelect.js` 是一个 setter 控件，无人引用

#### `packages/container/rank-panel`（[src/packages/container/rank-panel/](src/packages/container/rank-panel)）
- **文件**：`index.js`
- **外部引用数**：0
- **物料注册**：未注册
- **状态**：整个目录死代码

#### `packages/container/scroll-panel`（[src/packages/container/scroll-panel/](src/packages/container/scroll-panel)）
- **文件**：`index.js`
- **外部引用数**：0
- **物料注册**：未注册
- **状态**：整个目录死代码

---

### 3.3 ⚠️ 待确认

#### `packages/constants.js`（[src/packages/constants.js](src/packages/constants.js)）
- **导出**：`DEFAULT_COLORS`、`CONTRAST_COLOR`、`FONT_WEIGHT`、`FLEX_DIRECTION`、`JUSTIFYCONTENT`、`ALIGNITEMS`、`widthTypeMap`、`PROVONCESCITYNAME`、`PROVONCESCITY`、`GEOCOORDMAP`、`BASE_CONF`、`BASE_DATA_CONF`、`START_POSITION`、`DATE_FORMATTER`、`NUMBER_FORMATTER`
- **状态**：本次审计未深入搜索每个常量的引用情况
- **建议**：单独开任务审计

---

## 4. 清理建议

### 4.1 可安全删除（用户已确认）

| 目录 | 文件数 | 备注 |
| --- | --- | --- |
| `packages/container/tabs` | 3 | 用户已确认废弃 |

### 4.2 建议删除（待用户确认）

| 目录/文件 | 文件数 | 备注 |
| --- | --- | --- |
| `packages/base/iframe` | 5 | 零引用，未注册为物料 |
| `packages/base/countdown` | 1 | 零引用，未注册为物料 |
| `packages/base/index.ts` | 1 | 导出的 3 个常量零引用 |
| `packages/container/rank-panel` | 1 | 零引用，未注册为物料 |
| `packages/container/scroll-panel` | 1 | 零引用，未注册为物料 |

### 4.3 不建议删除

| 目录/文件 | 原因 |
| --- | --- |
| `packages/model-3d/*` | 使用中 |
| `packages/utils/*` | 使用中 |
| `packages/index.tsx` | 使用中 |
| `packages/local-material-init.tsx` | 使用中 |
| `packages/constants.js` | 需要单独审计每个常量 |

---

## 5. 后续维护建议

为避免每次扫描浪费 token，建议：

1. **本次报告作为基准**：后续判断 `src/packages/` 下组件是否死代码，先看本报告
2. **新增组件时**：在 `local-material-init.tsx` 注册，或通过 `import` 显式引用
3. **删除组件时**：同步更新本报告
4. **定期复审**：每季度或大版本发布前重新审计一次

---

## 6. 关联文档

- [Redux Action使用度审计](./Redux%20Action使用度审计.md) — task-002 的 Redux 死代码审计
- [task-2026-07-20-002-cleanup-unused-actions](../plans/task-2026-07-20-002-cleanup-unused-actions.md) — 清理任务计划