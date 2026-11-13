# Task · 2026-11-11-002-skeleton-p1-hardening

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-11-002-skeleton-p1-hardening` |
| Status | 已完成 |
| 类型 | skill / 编码 |
| 影响范围 | `docs/skeleton/`、`docs/workflows/big-screen-assembly.md`、`docs/workflows/screen-inventory-template.md`、`scripts/export-skill.mjs`（SKILL.md 模板） |
| Roadmap | skeleton 随 skill 导出 · P1 结构性缺口（外部评审遗留） |
| 验收标准 | 评审 P1 各项缺陷修复后，骨架对「B1→B5 全流程 + 静态部署」均有明确支撑且文档一致 |
| 前置依赖 | task-2026-11-11-001-skeleton（P0 已修，本任务接 P1） |

---

## 目标（Goal）

修复外部评审的 P1 结构性缺口，使骨架在「需求结构化 → 整屏验收」全流程中的支撑能力补齐：B1 推导规则可判定、预置边界一致、部署约束明确。

## 步骤（执行计划）

### 步骤 1：B1 推导规则补强（最薄弱环节）

- **动作**：screen-inventory-template.md 补 7 类字段（数据源表 / 资源依赖表 / 非联动交互清单 / 跨屏 query 参数表 / 层级表 / 状态降级规范 / 验收锚点）；workflow B1 补无设计稿时的推导规则（栅格 / 边距 / z-index 约束），使 B1 产出可判定
- **输出**：更新后的模板与 workflow
- **等待用户**：否

### 步骤 2：预置边界补齐（骨架侧）

- **动作**：评估并按结论实施——SectionFrame 布局壳（section 外层容器，统一坐标 + 加载/失败态）、ErrorBoundary、types 目录约定（`src/types/` 或屏内）、mock 最小闭环（public/mock 结构约定 + workflow B3 引用）
- **输出**：骨架新文件 + workflow / SKILL.md 同步
- **等待用户**：是（SectionFrame 预置程度与 types 归属需用户拍板）

### 步骤 3：依赖矛盾与部署约束

- **动作**：解决 package.json 全量依赖 vs L3「按需安装」的矛盾（二选一：骨架保留全量并说明理由，或改按清单注释说明）；workflow L1 补 BrowserRouter 静态部署 404 约束（服务器 rewrite 或改 HashRouter 的取舍说明）
- **输出**：更新后的骨架与 workflow
- **等待用户**：是（router 方案取舍）

### 步骤 4：验证 + 文档回填

- **动作**：tsc（除未装依赖）/ export:skill / pnpm build；回填 design/skeleton.md 已知缺口节（P1 清空）
- **输出**：验证通过 + 文档回填
- **等待用户**：是（硬门槛②）

---

## 不做清单

- 不做 P2 纪律机器化（ESLint / 哈希比对 / 脚本断言，归 task-003）
- 不新增具体业务物料、不预设布局模板
- 不改 `docs/materials/` 现有物料内容

## 验收 checklist

- [x] A1：屏清单模板含 7 类字段，B1 无设计稿时产出可判定（验收锚点明确）
- [x] A2：SectionFrame / ErrorBoundary / mock 闭环 / types 约定落地（或明确记录不做的决策及理由）
- [x] A3：依赖策略与部署约束在骨架与 workflow 中一致且无矛盾表述
- [x] A4：tsc / export:skill / pnpm build 通过
- [x] design/skeleton.md P1 项清空或标注决策

## 技术设计（实现要点）

| 改动 | 文件 | 说明 |
| --- | --- | --- |
| 模板补 7 类字段 | docs/workflows/screen-inventory-template.md | 层级表 / 数据源表 / 资源依赖表 / 非联动交互清单 / 跨屏 query 参数表 / 状态降级规范 / 验收锚点 + 自检扩充 |
| B1 推导规则 | docs/workflows/big-screen-assembly.md | 无设计稿时：栅格（左右 20~24% 栏 + 间距单值）/ 边距（16~24px 单值）/ z-index 四档命名层（0/1/100/1000），浮层一律走 useOverlayRoot |
| SectionFrame | docs/skeleton/src/components/section-frame/index.tsx | 薄编排壳：x/y/w/h 绝对定位 + loading/error 兜底 + 内置 ErrorBoundary；与 ui-widget-shell 分工（编排 vs 视觉），用户拍板 |
| ErrorBoundary | docs/skeleton/src/components/error-boundary/index.tsx | class 组件错误隔离，sectionId 定位 + onError 回调 |
| types 约定 | workflow B3 | 不建统一 types/：类型定义在使用处（services 文件内），随屏自包含（用户拍板「不用建」） |
| HashRouter | docs/skeleton/src/App.tsx + workflow L1 | 静态部署 404 免疫；SKILL.md 模板同步 |
| 依赖策略 | workflow L3 | 骨架保留全量（开箱即跑），依赖表降级为「裁剪/排查」参考（用户拍板） |
| export 过滤 | scripts/export-skill.mjs | 骨架 node_modules/dist/.vite 不再拷入产物（本地验证后 export 报 ENOTEMPTY 的根因修复） |

用户决策记录（2026-11-11）：SectionFrame=薄编排壳（非仅文档、非不做）；ErrorBoundary=预置；types=不用建；依赖+router=全量依赖+HashRouter。

## 变更记录

- 2026-11-11：骨架侧各文件完成后，用户叫停 export:skill/仓库 build/文档回填，先验骨架逻辑；骨架 pnpm build 通过。随后用户自行完成步骤 4 全部验证（tsc / export:skill / pnpm build），AI 完成文档回填与归档。

---

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-11 | 用户（「执行task」+ 四项决策拍板） |
| ② 实现验收 | 已验收 | 2026-11-11 | 用户（自行验证 tsc / export:skill / pnpm build） |

---

## 关联

> - 前置：`done/2026-11/task-2026-11-11-001-skeleton.md`（P0 修复 + 评审结论入档）
> - 后续：task-2026-11-11-003（P2 纪律机器化）
> - 设计文档：`design/skeleton.md` 第 4 节
