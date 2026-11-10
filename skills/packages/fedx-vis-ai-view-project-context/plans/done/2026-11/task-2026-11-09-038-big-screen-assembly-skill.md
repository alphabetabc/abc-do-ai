# Task · 2026-11-09-038-big-screen-assembly-skill

> Epic task-035 的收口前置：基建物料（interaction-store / scaler-container）已就绪，但 skill（`dist-skill/large-screen-builder/`）的「构建流程」仍停留在五步检索级（检索 → spec → data-model → 复用 code/examples → 组装页面），缺「驱动搭出一块完整大屏」的编排方法论。本卡补齐该能力。

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-09-038-big-screen-assembly-skill` |
| Status | 已完成 |
| 类型 | feature |
| 影响范围 | skill 产物（SKILL.md 构建流程 + 可能新增 references/）、其源文件落位、`scripts/export-skill.mjs`（仅当需要新增拷贝逻辑时）、`docs/<工作流目录>/`（新增，说明大屏组装工作流）、本文件、current-sprint.md |
| 验收标准 | ① 方法论内容以**文档源文件**形式存在（非脚本内硬编码）；② `pnpm export:skill` 后产物含完整构建流程，输出目录 `dist-skill/large-screen-builder/` 不变；③ 工作流可独立走查（步骤、产物、验收点可勾选）；④ 脚本改动不超出「拷贝既有文件 + 索引」职责；⑤ `docs/` 下新增工作流说明目录，内容完整且链接合规（遵循仓内链接规范） |

## 目标

把「驱动 AI 搭出一块完整大屏」的标准工作流固化进 `large-screen-builder` skill 产物，使任何项目装上该 skill 后，AI 能照工作流独立完成：**环境与依赖（步骤 0）** → 屏清单 → 骨架（scaler-container 坐标系/全屏）→ 物料实例化（复制式、不改物料源码）→ 数据契约（mock 先行）→ 联动编排（interaction-store defineFields/派发/订阅）→ 验收。

> 步骤 0 依据（2026-11-09 扫描物料 code/ 外部 import 得出）：物料三方依赖 = zustand / echarts + echarts-for-react / antd / lodash-es / ahooks / swiper / dayjs；react / react-dom 由宿主提供（物料基于 React 18，需核对宿主版本）。工作流要求按屏清单选定的物料汇总最小依赖集，不整包安装全部。

### 待审批的设计决策（阶段一核心）

1. **方法论源文件落位**（已拍板，2026-11-09 用户指令）：`docs/workflows/` 新增目录，专述大屏组装工作流——即工作流文档住在仓内 `docs/`，export 脚本从中拷贝进 skill 产物（原方案 A/B 之争终结，走 A 的 docs/ 变体）
2. **内容范围**：`docs/workflows/` 工作流说明（编排五步 + 产物定义 + 验收点）；SKILL.md 构建流程章节引用/汇入该工作流；可选 references（屏清单模板等）。具体清单过门槛①时逐项确认
3. **不做**：不动物料站站点（`src/`）、不在本仓内搭 demo 屏验证（验证由用户在独立空间做，反馈迭代走后续卡）

## 不做清单

- 不改物料内容（`docs/materials/` 四件套零改动）
- 不改 export 脚本的既有导出行为（默认目录、模块拷贝规则、索引生成）
- 不在脚本内硬编码任何文档内容（2026-11-09 幻觉教训：脚本只搬运不创作）
- 不做独立空间验证（用户负责，反馈后另立迭代卡）

## 步骤

1. 设计定稿（`docs/` 工作流目录名 + 内容清单）→ 硬门槛①审批
2. 新建 `docs/<工作流目录>/` 并编写工作流说明文档
3. export 脚本最小改动：拷贝工作流文档进 skill 产物（SKILL.md 构建流程引用之）
4. `pnpm export:skill` 验证产物（目录结构对照 design/skill-structure.md，有变化则同步更新该设计文档）
5. 验收 + 归档

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批（含源文件落位拍板） | 已批准 | 2026-11-09 | 用户（落位 `docs/workflows/`；内容范围：步骤 0~5 工作流 + 屏清单模板；「执行这个task」指令） |
| ② 实现验收 | 已验收 | 2026-11-09 | 用户（核验通过：产物/脚本/构建均复核重跑通过） |

## 实现记录（2026-11-09）

- `docs/workflows/big-screen-assembly.md`：主工作流（步骤 0 环境与依赖含物料依赖清单表 / 1 屏清单 / 2 骨架 / 3 物料实例化 / 4 数据契约 / 5 联动编排 / 6 整屏验收），附三条硬纪律（物料只复制不改写、mock 先行、设计稿坐标系）。两基建件 API 已对照各自 spec.md 核实（ScalerContainer Props + useScaler/useOverlayRoot；createInteractionStore → useSubscribe/useDispatch + defineFields）
- `docs/workflows/screen-inventory-template.md`：屏清单标准模板（屏元信息 / 分区表 / 联动字段表 / 物料缺口表 / 完成自检）
- `scripts/export-skill.mjs` 最小增量：新增 `docs/workflows/` → 产物 `workflows/` 原样拷贝（目录不存在时跳过）；SKILL.md 构建流程段改为指向 `workflows/big-screen-assembly.md`（仅路径引用，无内容硬编码）
- 产物验证：`node scripts/export-skill.mjs` → 37 模块 + workflows/ 两文档；SKILL.md 含 2 处 workflows/ 引用
- `design/skill-structure.md` 同步更新：顶层结构补 workflows/，构建流程描述更新，新增「工作流文档维护」节
- 质量门槛：`pnpm build`（tsc -b + vite）通过
