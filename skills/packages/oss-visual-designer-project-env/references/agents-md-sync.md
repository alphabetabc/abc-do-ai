# AGENTS.md 同步维护参考

> 版本：1.0.0 | 日期：2026-07-31

> 维护项目根目录 `AGENTS.md`（AI Agent 协作指南）的快照、同步触发点与校验规则。本文件与 `_common.md` 并列，由 SKILL.md §7 引用。

---

## 1. 文件定位

| 项         | 值                                                                           |
| ---------- | ---------------------------------------------------------------------------- |
| 文件路径   | `AGENTS.md`（项目根目录）                                                    |
| 文件性质   | AI Agent 协作指南，承载**协作规则、速查入口、高层索引**                      |
| 事实优先级 | 低于代码与 `.trae/documents/` 权威文档（见 AGENTS.md §9.2）                  |
| 维护主体   | AI Agent（随项目演进同步更新，文件末尾注明"由 AI Agent 维护"）               |
| 编码约束   | UTF-8；**禁止**用 PowerShell `Set-Content` 修改（会破坏中文，见项目规则 §6） |

> AGENTS.md 不是业务/架构事实的权威源——那些在 `.trae/documents/`。AGENTS.md 只做**索引 + 规则**，事实变更时先改权威文档，再回写 AGENTS.md 的引用。

---

## 2. 章节结构与职责

AGENTS.md 共 13 个章节，每章的维护频率与同步源不同：

| §   | 章节                  | 维护频率 | 同步源 / 触发点                                                         |
| --- | --------------------- | -------- | ----------------------------------------------------------------------- |
| 1   | 项目入口              | 低       | 新增入口文件 / 入口职责变更                                             |
| 2   | 目录结构              | 低       | 顶层目录调整（指向 `design/项目架构说明书.md`）                         |
| 3   | 核心概念              | 中       | `designer-state/` 文档增减 / 组件树 Schema 字段变更                     |
| 4   | 开发约定              | 中       | 路径别名增删（§4.2）/ Redux 模式变化（§4.4）/ 性能红线调整（§4.5）      |
| 5   | Redux Store           | 中       | slice 增删 / 持久化 whitelist 变更 / action 模式切换                    |
| 6   | 常用命令              | 低       | `package.json` scripts 增删                                             |
| 7   | 测试                  | 中       | 测试框架切换 / 测试覆盖现状变更（task 落地后）/ 工厂函数增删            |
| 8   | 文档体系              | 中       | `.trae/` 目录结构变化 / 必读文档表增删 / 新建文档规则调整               |
| 9   | 第一性原理            | 低       | 元规则本身极少变动；仅在事实优先级表或禁区清单调整时同步                |
| 10  | AI Agent 任务注意事项 | 中       | 新增禁止项（§10.2）/ API 删除（指向 `05-deleted-api.md`）/ 自检清单调整 |
| 11  | 上下文快速跳转        | 低       | 顶层模块路径变化                                                        |
| 12  | 版本与依赖更新策略    | 低       | 依赖策略调整                                                            |
| 13  | 联系与维护            | 极低     | 维护者信息补全                                                          |

---

## 3. 同步触发点（何时需要更新 AGENTS.md）

以下事件发生时，**必须**检查 AGENTS.md 对应章节并同步：

| 触发事件                                      | 需检查的章节    | 说明                                                                           |
| --------------------------------------------- | --------------- | ------------------------------------------------------------------------------ |
| 完成 task（归档到 `plans/done/`）             | §7 测试 / §10.2 | 若 task 涉及测试落地、API 删除、slice 变更，需更新对应章节                     |
| 删除 API（如 `useDesigner` / `getFieldConf`） | §10.2 / §9.1    | 在 §10.2 禁止项追加 API 名；在 §9.1 幻觉场景示例补充                           |
| 新增 / 删除 slice                             | §5              | 更新 slice 清单表                                                              |
| slice 的 action 模式变化                      | §4.4 / §5       | 更新混合模式说明                                                               |
| 新增 / 删除路径别名                           | §4.2            | 更新别名表（注意 `@Configs/*` 死别名标记）                                     |
| 新增 / 删除 `.trae/documents/` 文档           | §8              | 更新必读 / 按需查阅文档表                                                      |
| `designer-state/` 文档增删                    | §3.1 / §8       | 更新 8 份文档清单与必读表                                                      |
| 测试框架切换 / 测试用例数变化                 | §7              | 更新测试框架说明与覆盖现状                                                     |
| `package.json` scripts 变化                   | §6              | 更新常用命令清单                                                               |
| 顶层目录 / 入口文件变化                       | §1 / §2 / §11   | 更新入口表与跳转表                                                             |
| `pnpm-workspace.yaml` / `.pnpmfile.cjs` 变化  | §12             | 依赖策略相关时更新；具体配置由 `_common.md` 与分支文档维护，不复制到 AGENTS.md |

> **反模式**：把 `.trae/documents/` 权威文档的内容**复制**到 AGENTS.md。AGENTS.md 只做索引 + 规则，不承载业务事实。

---

## 4. AGENTS.md 当前快照（关键章节）

> 以下为易变章节的当前快照，用于 §1.2 逐行对比。快照日期：2026-07-31。

### 4.1 §5 Redux Store — slice 清单

当前 `combineReducers` 注册 **5 个** slice：

| Slice | 文件 | Action 模式 | 关键职责 |
| --- | --- | --- | --- |
| `app` | `src/store/modules/app.ts` | 字符串 | 用户信息、路由、布局、token、右键菜单 |
| `component` | `src/store/modules/component.ts` | 字符串 | 选中组件、mode（dev/preview）、querys、数据集、联动 |
| `viewCanvas` | `src/store/modules/view-canvas.ts` | `createSlice` | 画布高频状态：scale / lines / 标尺 / 画布尺寸 |
| `viewUI` | `src/store/modules/view-ui.ts` | `createSlice` | UI 低频状态：tabsKey / \*Collapsed / visible / isShowReferLine |
| `designerCanvas` | `src/store/modules/designer-canvas.ts` | 字符串 | **components 唯一真相源** + 派生索引（byId / parentMap 由 `buildIndex` 重建） |

- 持久化：`whitelist = []`，不持久化任何 slice（仅保留 `PersistGate` 占位）
- Action creator 文件：`designer-canvas-actions.ts` / `view-actions.ts`

### 4.2 §4.2 路径别名表

| 别名                  | 指向                        | tsconfig | webpack | 说明                                        |
| --------------------- | --------------------------- | -------- | ------- | ------------------------------------------- |
| `@Src/*`              | `src/*`                     | ✅       | ✅      | 主源码目录                                  |
| `@Common/*`           | `src/common/*`              | ✅       | ✅      | 公共模块                                    |
| `@Components/*`       | `src/components/*`          | ✅       | ✅      | 通用 UI 组件                                |
| `@Pages/*`            | `src/pages/*`               | ✅       | ✅      | 页面                                        |
| `@Utils` / `@Utils/*` | `src/utils` / `src/utils/*` | ✅       | ✅      | 工具函数                                    |
| `@Packages`           | `src/packages/`             | ❌       | ✅      | 仅 webpack：本地物料包                      |
| `@Configs/*`          | `src/configs/*`             | ✅       | ❌      | **死别名**：`src/configs/` 不存在，不要使用 |

workspace 包名（非 webpack alias）：`@fedx-vis/share` / `@fedx-vis/hooks` / `@fedx-vis/utils` 等 → 根目录 `packages/*` 子包。

### 4.3 §7 测试覆盖现状

- 测试框架：vitest 4.1（`vitest.config.ts` + jsdom + globals）
- 运行命令：`pnpm test` / `pnpm test:watch`
- 测试工具：`src/__tests__/test-utils.ts`（`createTestState` / `dispatchSequence` / `makeNode` / `makeGroup`）
- 历史 Jest 配置：`package.json` 的 `jest` 字段保留不删（历史快照）
- 覆盖现状（task-2026-07-29-001 落地，共 **72 个**测试用例）：
    - P0 核心契约：`buildIndex` 引用复用 / `updateFieldConfig` 边界 / `setState` byId 防护
    - P1 bug 回归：Bug #1 / Bug #2 / Bug #3
    - P2 单源验证：`setComponents` 直接赋值 / `recalcGroupBounds` 简化

### 4.4 §10.2 已删除 API 禁止项

以下 API 已删除（task-002/003/007/012 单源重构），**禁止重新引入**：

- `useDesigner` / `getFieldConf`（task-007/012 删除）
- `mergeByIdIntoTree` / `getSaveableComponents` / `patchFieldConf` / `fieldPreserve` / `dirtyConfigKeys`（task-002/003 删除）
- `beginSkipGroupRecalc` / `endSkipGroupRecalc` / `shouldSkipGroupRecalc`（task-002/003 删除）
- `undo` / `redo`

> 保存序列化直接读 `designerState.components`，不要再调 `getSaveableComponents`。详见 `05-deleted-api.md`。

### 4.5 §3.1 designer-state 文档清单（8 份）

| 文档                   | 内容                                                         |
| ---------------------- | ------------------------------------------------------------ |
| `00-README.md`         | 索引 + 导航                                                  |
| `01-data-model.md`     | 数据模型（类型定义 + state 形状 + 派生索引 + 单源契约）      |
| `02-write-path.md`     | 写路径（action 全表 + reducer + 工具函数 + 写边界场景）      |
| `03-read-path.md`      | 读路径（hooks + getFieldNodeById + 保存序列化 + 读边界场景） |
| `04-principles.md`     | 架构原则（4 大原则 + 5 大禁区 + 提交前自检）                 |
| `05-deleted-api.md`    | 已删除 API 速查                                              |
| `06-bugs-and-tests.md` | Bug 归档 + 测试矩阵                                          |
| `07-view-slices.md`    | view slices（viewCanvas / viewUI 合并到主 store）            |

### 4.6 §4.5 性能红线关键事实

- `useFieldConf(uniqueId)` 是字段级订阅 byId 索引
- 2026-07-21 task-007 起取代 `useDesignerSettingChange`
- 2026-07-28 task-002 单源后 byId 由 `buildIndex` 引用复用保持订阅粒度
- 画布组件必须 `React.memo`
- 不要在 render 里直接修改 state，用 `useMemo` / `useCallback` 包裹大对象

---

## 5. 维护工作流

### 5.1 标准同步流程

1. **识别触发点**：根据 §3 触发点表，判断哪些章节需要检查
2. **读取实际 AGENTS.md**：读取项目根目录 `AGENTS.md` 对应章节
3. **读取权威源**：读取对应的代码 / `.trae/documents/` 文档，确认最新事实
4. **逐行对比**：将实际 AGENTS.md 与 §4 快照 + 权威源逐行对比（禁止扫读，见 SKILL.md §1.2）
5. **报告差异**：列出具体差异行（实际文件第 X 行 vs 快照第 Y 行 / 权威源）
6. **用户确认**：向用户报告差异，询问是否更新
7. **修改 + 同步**：用户确认后修改 AGENTS.md，并同步更新本文件 §4 快照

### 5.2 修改约束

- **编码**：必须用 UTF-8。**禁止** PowerShell `Set-Content` / `Get-Content` 修改（见项目规则 §6），用 Edit / Write 工具
- **链接**：文档内文件链接用**相对路径**，禁止 `file:///` 绝对路径（AGENTS.md §8 已明确规定）
- **不承载事实**：AGENTS.md 只做索引 + 规则，业务事实写在 `.trae/documents/`，AGENTS.md 只引用
- **中文文件名**：引用 `.trae/documents/` 文档时，文件名是中文（如 `项目架构说明书.md`），不要改写为英文

### 5.3 与分支环境的关系

AGENTS.md 是**项目级**文档，不按分支区分。但涉及依赖 / workspace 配置时（§12 版本与依赖更新策略），具体配置由 `_common.md` 与分支文档维护，AGENTS.md 只保留策略层描述。

---

## 6. 校验清单（修改 AGENTS.md 后自检）

- [ ] 修改的章节是否对应 §3 触发点？
- [ ] 是否用 Edit / Write 工具修改（非 PowerShell `Set-Content`）？
- [ ] 文件内链接是否为相对路径（无 `file:///`）？
- [ ] 引用的 `.trae/documents/` 文档是否真实存在（用 Glob 验证）？
- [ ] 引用的源码路径是否真实存在（如 `src/store/modules/index.ts`）？
- [ ] 是否避免复制权威文档内容（只做索引 + 规则）？
- [ ] §4 快照是否同步更新？
- [ ] 若涉及 §10.2 禁止项，是否与 `05-deleted-api.md` 一致？
