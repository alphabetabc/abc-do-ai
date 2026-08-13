# 001 · 大屏可视化分析开发指导总则

> 性质：长期维护文档（非一次性 research）
> 日期：2026-08-11
> 来源：task-001（docs 通读与待办盘点）产出物重构
> 维护规则：docs/ 变化时同步更新本文件；本文件不入 `docs/`、不入 Git

---

## 0. 文档修改门禁

> 详见 `AGENTS.md` §10 / §10.1（L1 自由 / L2 授权 / L3 严控 + task 生命周期）

---

## 1. docs/ 现状盘点

### 1.1 主入口与流程

| 文档                            | 作用                                                                  | 与大屏关联度                                   | 是否已写完                         |
| ------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------- |
| `docs/index.md`                 | 文档总站，列 6 大分区 + 建议阅读顺序                                  | 中（指向 design / specs / skills / workflows） | ✅ 稳定                            |
| `docs/specs/index.md`           | 35 个 spec 编号索引 + 状态表 + 每条业务说明                           | **高**（大屏待新建 spec 须在此登记编号）       | ✅ 稳定（035 末项，大屏从 038 起） |
| `docs/ai-prompts-guide.md`      | AI 协作提示词指南：§1.3 生成 pm-input、§2 生成五件套、§3 按 spec 开发 | **高**（大屏 spec 生成的提示词直接复用）       | ✅ 稳定                            |
| `docs/workflows/sdd-process.md` | SDD 流程；§2 新建特性 6 步                                            | **高**（大屏 spec 走 SDD 6 步）                | ✅ 稳定                            |
| `docs/workflows/tdd-process.md` | TDD 流程；分层 + 与 SDD 产物映射                                      | 中（大屏后端单测 / 合同测试）                  | ✅ 稳定                            |

### 1.2 design/ 四件套

#### system-overview.md

| 章节                  | 已有内容                                       | 占位 / 待建                                                 | 与大屏关系                                                       |
| --------------------- | ---------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------- |
| §2.2.2 菜单与路由表   | 035 的 7 行 `/visual/stats/*` + 038 人员大屏 `/bigdata/personnel`（PM 原文）已登记 spec 链接 | 039–041 待建（路由见 `env/project-meta.md` §1） | **高**：大屏 4 屏需在此表登记路由                                |
| §2.4 权限与可见性     | 菜单级 RBAC、按角色过滤、403 页                | —                                                           | **高**：大屏菜单 key 设计依据                                    |
| §2.4.1 数据可见性策略 | `none` / `org_tree` / `self`                   | —                                                           | **高**：大屏按 `REG_AUTHORITY` 过滤，属 `org_tree` 变体或 `none` |
| §2.5 与设计系统关系   | Ant Design + ProLayout mix                     | 主题令牌待定                                                | 中：大屏分辨率 / 图表样式                                        |

#### architecture.md

| 章节                           | 已有内容                                                           | 占位 / 缺失                 |
| ------------------------------ | ------------------------------------------------------------------ | --------------------------- |
| 第一部分 NFR                   | 模板表格（性能 / 可用性 / 安全等留白）                             | 大屏 NFR 未填               |
| 第二部分 §1 选型               | KingbaseES V8、`psycopg2`、SQLAlchemy 2.x、Alembic                 | ✅                          |
| §4.1 结构脚本与运行时 SQL 分工 | **DDL → migration；运行时 SELECT → `sql/` 或 `repositories/sql/`** | ✅ 关键约定                 |
| §5.3 例程登记表                | 空模板                                                             | 大屏若新建视图 / 函数须登记 |

#### api-contracts.md

| 章节                   | 已有内容                                           | 占位 / 缺失                                |
| ---------------------- | -------------------------------------------------- | ------------------------------------------ |
| §7.1 索引 - 业务模块   | 035 的 `/api/visual/stats/*`（§7.35–§7.40）+ 038 人员大屏 `/api/visual/big-screen/personnel/*`（§7.18）已登记 | ✅ 已登记                                  |
| §7.35–§7.40            | 035 月报 + 分析报告端点详述                        | ✅ 可作大屏端点写法模板                    |
| §7.18                 | 038 人员大屏 6 个端点详述                          | ✅ 已登记（task-014 执行）                |

> ✅ `api-contracts.md` §7.1 索引表 Git 合并冲突标记已解决（D8 已关闭）。

#### data-models.md

| 章节               | 已有内容                                                                                         | 字段是否齐全                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| §6 人员信息大屏    | 4 张表：`stats_jdlk_persion_age_group`、`_employment`、`_hjlb`、`_infor_cant`                    | ✅ 字段齐全（年龄段 / 就业 / 户籍 / 人员信息分类）                                    |
| §7 信访信息大屏    | 5 张表：`letter_screen_1`–`3`、`_5`、`_6`（**缺 `_4`**）                                         | ✅ 已确认：`letter_screen_4` 存在且被 PM 使用（地图模块），`data-models.md` §7 需补录 |
| §8 报表 / 统计分析 | `abi_zb_tyjrjqyfdx`（人员群体优抚对象）、`abi_wjj`、`analysis_report_file_info`、`archive_infor` | ✅（035 已用）                                                                        |
| §11.1 遗留表索引   | VPortal 外围表                                                                                   | 低                                                                                    |

---

## 2. 五件套 + pm-input 章节映射

| pm-input 章节    | spec.md 章节                              | 其他五件套落点                |
| ---------------- | ----------------------------------------- | ----------------------------- |
| A 功能名片       | 顶部元信息（路由 / 菜单 / 优先级 / 状态） | —                             |
| B 背景与范围     | §1 背景与目标（§1.1 问题、§1.4 范围外）   | plan §1 目标与范围            |
| C 用户与权限     | §2 角色与权限                             | —                             |
| D 核心用户旅程   | §4 界面与交互                             | acceptance-tests Gherkin 场景 |
| E 界面清单       | §4 界面与交互（§4.1 框架、§4.2 详述）     | —                             |
| F 数据与业务规则 | §5 数据与领域                             | data-model-extensions §1–§4   |
| G 验收标准       | §1.3 成功标准                             | acceptance-tests              |
| H 非功能         | §7 非功能                                 | plan §4 风险                  |
| I 开放问题       | §9 开放问题                               | plan §2 前置条件              |
| J 参考资料       | 附录                                      | —                             |
| K 静态资源       | 附录（assets 相对路径）                   | —                             |
| 建议分几期       | —                                         | plan §3 里程碑 + tasks 勾选   |

### 035 实现切片参考

| 里程碑 | 内容                        | 产出                                                                                        |
| ------ | --------------------------- | ------------------------------------------------------------------------------------------- |
| **M0** | 五件套 + design 索引        | spec / extensions / plan / tasks / acceptance；system-overview / api-contracts / index 更新 |
| **M1** | 公共 Service + 首个端点竖切 | SQL（`latest_by_cant.sql` + 报表 SQL）、Service、router、合同测试                           |
| **M2** | 其余端点批量复制            | N 组 SQL + schema + router 端点 + xlsx 模板                                                 |
| **M3** | 前端页                      | 路由替换 placeholder + 公共壳 + API 封装 + 加载/空态                                        |
| **M4** | 扩展功能（分析报告）        | 独立子功能端点 + 前端页                                                                     |
| **M5** | 联调与验收                  | golden fixture 对数 + 401/403 + acceptance 补全                                             |

> **大屏可复用 035 模式**：M0 spec 五件套 → M1 后端竖切（1 屏 1 模块验证公共壳）→ M2 批量 → M3 前端 → M5 联调。差异：大屏有 **4 屏 24+ 模块**，且前端是**图表**非表格，需 M3.5 视觉定稿。

### 035 的 legacy-source-inventory.md 替代模式

035 没有标准 `pm-requirements-input.md`，而是用 `legacy-source-inventory.md` 替代（迁移场景，无 PM 原始 assets）。spec.md 顶部注明「迁移输入：legacy-source-inventory.md」。

> **大屏场景不同**：大屏有 PM 原始输入（4 份分屏 md + HTML 原型 + 88 张设计稿），应走标准 `pm-requirements-input.md` 路径，将 assets 迁入 `pm-inputs/assets/`。

---

## 3. 实现期硬规则清单

| #   | 规则                                                                                                                                        | 出处                                        | 适用层      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ----------- |
| R1  | **运行时查询 SQL 不入 migration**，放 `backend/app/repositories/sql/visual/` 或 `backend/app/services/visual/sql/`                          | architecture §4.1 + kingbase/coding.md §5.5 | 后端        |
| R2  | **Kingbase Oracle 兼容模式**：DDL 目录 `kingbase_oracle/`，用 `VARCHAR2` / `NUMBER` / `COMMENT ON`；勿粘 MySQL `int(11)` / `AUTO_INCREMENT` | kingbase/coding.md §3.1                     | 后端 / DB   |
| R3  | **新入口须 patch Kingbase 版本探测**：`patch_psycopg2_server_version_detection()`                                                           | kingbase/coding.md §2.2                     | 后端        |
| R4  | **全限定 schema.table**：手写 SQL 用 `dw_basic_lc.letter_screen_1` 等，不依赖 `search_path`                                                 | kingbase/coding.md §2.3                     | 后端        |
| R5  | **端点前缀无 `/v1`**：大屏用 `/api/visual/big-screen/*`（与 comparison / visual-stats 一致）                                                | AGENTS §4 + 035 spec §3.2                   | 后端        |
| R6  | **菜单级鉴权**：`require_menu_key("visual-big-screen-*")`；无权限 → 403                                                                     | system-overview §2.4 + 001 spec             | 后端 + 前端 |
| R7  | **大屏只读**：仅消费统计表快照，不写明细库                                                                                                  | AGENTS §5.2                                 | 后端        |
| R8  | **组件名 PascalCase**，目录与文件名一致；页面入口 `index.tsx`                                                                               | AGENTS §6 + react/coding.md                 | 前端        |
| R9  | **包管理唯一 pnpm**，禁用 npm/yarn；React 19 + AntD 6 + Vite 8                                                                              | react/coding.md §1                          | 前端        |
| R10 | **HTTP 客户端 axios 单例**，统一 Bearer + 401/续约/登出拦截器                                                                               | react/coding.md §5                          | 前端        |
| R11 | **加载/空态/错误态必须实现**：401→`/login`，403→`/403`，5xx 走契约统一错误体                                                                | AGENTS §5.4 + system-overview §2.3          | 前端        |
| R12 | **参数化查询 mandatory**，禁止拼接用户输入；日志不输出密码 / 连接串                                                                         | kingbase/coding.md §6                       | 后端        |
| R13 | **docs 禁止引用 `.trae/` / `AGENTS.md` / `.local-*`**                                                                                       | docs-no-private-refs 规则                   | 文档        |
| R14 | **L3 文档改动须走 roadmap §6 提案审批**（docs/**.md、\_template/**）                                                                        | AGENTS §10                                  | 文档        |

---

## 4. 在 docs 中开展大屏任务的步骤

> 以 SDD §2 的 6 步为骨架，按 `ai-prompts-guide.md` §2 / §3 和大屏特化需求细化。每步标「前置依赖 / 阻塞决策 / 输出文件 / L 等级」。

| #   | 步骤                                                                                                                                  | 前置依赖    | 阻塞决策             | 输出文件                                                                       | L 等级                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------------------- | ------------------------------------------------------------------------------ | ------------------------ |
| 1   | 在 `docs/specs/index.md` 分配编号与目录名（`038-bigdata-*`）                                                                         | D2 拍板     | **D2** ✅ 已关闭     | `docs/specs/index.md`                                                          | L3                       |
| 2   | 复制 `docs/specs/_template/` 五件套到新目录                                                                                           | 步骤 1      | —                    | `docs/specs/038-*/{spec,plan,tasks,data-model-extensions,acceptance-tests}.md` | L3                       |
| 3   | 把 PM 输入迁移到 `docs/specs/038-*/pm-inputs/`：assets（4 份分屏 md + HTML 原型 + 设计稿截图）+ 生成 `pm-requirements-input.md`       | 步骤 2 + D6 | **D6** ✅ 038 已解锁 | `docs/specs/038-*/pm-inputs/assets/*` + `pm-requirements-input.md`             | L3                       |
| 4   | 在 `docs/design/data-models.md` §6 / §7 确认/扩展统计表模型（核对 `letter_screen_4` 缺失、确认 `REG_AUTHORITY` 过滤口径）             | 步骤 3      | **D9** ✅ 已关闭     | `docs/design/data-models.md` §6/§7                                             | L3                       |
| 5   | 在 `docs/design/api-contracts.md` §7.18 登记 `/api/visual/big-screen/personnel/*` 端点 + OpenAPI                                      | 步骤 4 + D3 | **D3** ✅ 已关闭     | `docs/design/api-contracts.md` §7.18                                           | L3                       |
| 6   | 在 `docs/design/architecture.md` 数据库章节登记（如有新表/视图/函数）                                                                 | 步骤 4      | —                    | `docs/design/architecture.md` §5.3                                             | L3                       |
| 7   | 在 `docs/design/system-overview.md` §2.2.2 对齐大屏菜单/路由                                                                          | 步骤 1 + D7 | **D7** ✅ 已关闭     | `docs/design/system-overview.md` §2.2.2                                        | L3                       |
| 8   | 在 `docs/specs/038-*/spec.md` §0 / §9 写技术决策（图表选型 D1 ✅、4 屏平级 vs 1 菜单 4 tab D-R4 ✅、地图下钻策略 R2）                  | 步骤 3–7    | **D1** ✅ / **D-R4** ✅ | `docs/specs/038-*/spec.md` §0/§9                                               | L3                       |
| 9   | 按 `ai-prompts-guide.md` §2.2 分轮生成五件套：第 1 轮 spec + extensions → 第 1.5 轮人工澄清 → 第 2 轮 acceptance → 第 3 轮 plan/tasks | 步骤 3–8    | —                    | `docs/specs/038-*/{spec,data-model-extensions,acceptance-tests,plan,tasks}.md` | L3                       |
| 10  | 按 `tdd-process.md` 写 acceptance-tests Gherkin + 后端单测/合同测试                                                                   | 步骤 9      | —                    | `acceptance-tests.md` + `backend/tests/`                                       | L3（docs）/ 代码         |
| 11  | 联调后更新 `AGENTS.md` §2.1 模块表 + `docs/specs/index.md` 状态列 + `system-overview.md` §2.2.2 spec 链接                             | M5 联调通过 | —                    | `AGENTS.md` §2.1 / `specs/index.md` / `system-overview.md`                     | L2（AGENTS）/ L3（docs） |
| 12  | ~~清理 `api-contracts.md` §7.1 索引的 Git 合并冲突标记（D8）~~ ✅ 已解决                                                              | 独立        | **D8** ✅ 已关闭     | `docs/design/api-contracts.md` §7.1                                            | L3                       |

---

## 5. docs 内部矛盾跟踪

| #   | 矛盾                                                                                                                                                                                           | 位置                        | 处理                                                                                      |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | ~~`api-contracts.md` §7.1 索引表 Git 合并冲突标记未清理~~ ✅ 已解决                                                                                                                              | L155–L194                   | D8 已关闭；合并冲突标记已清理                                                            |
| 2   | `data-models.md` §7 信访大屏表号跳过 `letter_screen_4`                                                                                                                                         | §7.1–§7.5                   | ✅ 已确认：PM 需求明确使用 `_4`（地图模块），`data-models.md` §7 需补录（已立案 L3 提案） |
| 4   | `system-overview.md` §2.2.2 中部分比对模块路由与 `specs/index.md` 说明不一致（如 012 `/account/dict` vs `/account/dictionaries`；034 `/comparison/petition-appeal` vs `/comparison/petition`） | system-overview §2.2.2 备注 | specs/index.md 已标注「待对齐」；非大屏范围，不处理                                       |
