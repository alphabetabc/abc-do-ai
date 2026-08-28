# 002 · 大屏可视化分析决策日志

> 性质：动态维护文档，每次拍板后更新
> 日期：2026-08-11
> 维护规则：决策状态变化时即时更新；本文件不入 `docs/`、不入 Git

---

## 1. 决策总表

| 编号 | 决策项                                    | 状态        | 决策结论                                                                                                                            | 日期       | 阻塞方 | 影响范围                                                       |
| ---- | ----------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------ | -------------------------------------------------------------- |
| D1   | 图表选型                                  | ✅ 已关闭   | ECharts 6.1.0 + echarts-for-react 3.0.6                                                                                             | 2026-08-11 | -      | spec §0 / 前端                                                 |
| D2   | spec 拆分粒度（1 / 2 / 4）                | ✅ 已关闭   | 4 spec（038–041），编号从 038 起                                                                                                    | 2026-08-11 | -      | specs/index / system-overview / AGENTS §2.1                    |
| D3   | 后端 API 形状 + 鉴权粒度                  | ✅ 已关闭   | 4A 组合：端点层级 `/api/visual/big-screen/{screen}/{module}`；query param（无 mode，实际 cantCode/cantType）；4 独立 key；统一壳    | 2026-08-11 | -      | api-contracts §7.41+ / 后端                                    |
| D4   | 数据源可用性核验                          | ❌ 撤回     | 不单独做，并入 task-001 通读                                                                                                        | 2026-08-11 | -      | -                                                              |
| D5   | 前端目录现状核对                          | ❌ 撤销     | 已确认 `pages/visual/` 不存在                                                                                                       | 2026-08-11 | -      | -                                                              |
| D6   | PM 输入迁入 `pm-inputs/`                  | 🟡 部分解锁 | 038 PM 输入已迁入 `docs/specs/038-bigdata-personnel-display/pm-inputs/`（含 assets + pm-requirements-input.md）；039/040/041 待迁入 | 2026-08-12 | 用户   | `docs/specs/038-*/pm-inputs/`                                  |
| D7   | 鉴权菜单 key 设计                         | ✅ 已关闭   | 4 个独立 key（跟随 D3 方案 A）                                                                                                      | 2026-08-11 | -      | system-overview §2.4 / AGENTS §4                               |
| D8   | `api-contracts.md` §7.1 Git 合并冲突      | ✅ 已关闭   | 合并冲突标记已清理；`Grep` 验证 `<<<<<<<` 无匹配                                                                                    | 2026-08-12 | -      | api-contracts §7.1                                             |
| D9   | `letter_screen_4` 缺失确认                | ✅ 已关闭   | `_4` 存在且被 PM 使用（地图信访数据，模块 4）；`data-models.md` §7 需补录                                                           | 2026-08-11 | -      | data-models §7                                                 |
| D-R4 | 4 屏是「平级 4 菜单」还是「1 菜单 4 tab」 | ✅ 已关闭   | 4 平级菜单（跟随 D2 = 4 spec + D3 方案 A = 4 独立 key）                                                                             | 2026-08-11 | -      | system-overview §2.2.2 / 路由（权威表见 `project-meta.md` §1） |
| D10  | 大屏 API 数据结构强制数组化               | ✅ 已关闭   | data 字段必须为数组（`items` / `summary` / `channels` / `regions` / `rows`）；基础项 `{key, name, value, unit, label?, type?}`；041 三维扩展 `local` + `beijing`，不变量 `value === local + beijing`，向后兼容 | 2026-08-14 | -      | 038–041 §3.2/§3.3（已落地 25 端点） + `design/006`（skill 沉淀） + L3 晋升 `api-contracts.md` 待执行 |

> 图例：✅ 已关闭 / 🟡 部分解锁 / 🟡 待拍板 / ⚪ 阻塞 / ❌ 撤回

---

## 2. 待拍板决策详情

### 2.1 D6 · PM 输入迁入路径

**docs 线索**：

- `_template/pm-inputs/` 结构（assets + pm-requirements-input.md）
- 035 的 legacy-source-inventory 替代模式

**当前状态**：038 PM 输入已迁入 `docs/specs/038-bigdata-personnel-display/pm-inputs/`（含 assets + pm-requirements-input.md）；039/040/041 待迁入

**待定**：88 张设计稿是否全迁入还是精选（039/040/041 迁入时需决定）

---

## 3. 已关闭决策归档

### D1 · 图表选型

- **结论**：ECharts 6.1.0 + echarts-for-react 3.0.6
- **日期**：2026-08-11
- **落点**：spec §0「技术决策」+ `docs/skills/frontend/react/coding.md`（L3 提案待执行）

### D2 · spec 拆分粒度

- **结论**：4 spec（每屏一 spec），编号从 038 起
- **日期**：2026-08-11
- **spec 目录**：

| 编号 | 目录名                                    | 大屏         | 数据源（schema · 表）                               |
| ---- | ----------------------------------------- | ------------ | --------------------------------------------------- |
| 038  | `038-bigdata-personnel-display`           | 人员信息大屏 | `dw_basic_lc` · `stats_jdlk_persion_*`（4 张表）    |
| 039  | `039-bigdata-petition-display`            | 辽宁信访大屏 | `dw_basic_lc` · `letter_screen_1/2/3`               |
| 040  | `040-bigdata-beijing-petition-display`    | 进京信访大屏 | `dw_basic_lc` · `letter_screen_5/6` + 部分 `_1/2/3` |
| 041  | `041-bigdata-petition-comparison-display` | 信访比对大屏 | `dw_basic_lc` · 跨 `letter_screen_*`                |

- **落点**：`docs/specs/index.md` + `docs/design/system-overview.md` §2.2.2（✅ task-014 已执行）

### D3 · 后端 API 形状 + 鉴权粒度

- **结论**：4A 组合
    - 端点路径：`/api/visual/big-screen/{screen}/{module}`（层级式，screen = spec 目录名）
    - 参数传递：query param（cantCode / cantType 等；**无 mode**——经查证 PM 需求大屏不存在 mode=latest/year 切换场景）
    - 鉴权粒度：4 个独立菜单 key（`visual-big-screen-personnel` / `visual-big-screen-petition-liaoning` / `visual-big-screen-petition-beijing` / `visual-big-screen-petition-compare`）
    - 响应结构：统一壳 `{ code, message, data }`（ApiResponse）
- **日期**：2026-08-11
- **落点**：`docs/design/api-contracts.md` §7.18（✅ task-014 已执行）

### D7 · 鉴权菜单 key 设计

- **结论**：4 个独立 key（跟随 D3 方案 A）
- **日期**：2026-08-11
- **落点**：`docs/design/system-overview.md` §2.4 / `AGENTS.md` §4（✅ task-014 已执行）

### D-R4 · 4 屏菜单结构

- **结论**：4 平级菜单（跟随 D2 = 4 spec + D3 方案 A = 4 独立 key）
- **日期**：2026-08-11
- **落点**：`docs/design/system-overview.md` §2.2.2 / 路由（✅ task-014 已执行；memo R7 路由决策已落地；前端路由权威表见 `env/project-meta.md` §1）

### D9 · letter_screen_4 缺失确认

- **结论**：`letter_screen_4` 存在且被 PM 需求使用（地图信访数据，模块 4）；`data-models.md` §7 需补录
- **日期**：2026-08-11
- **落点**：`docs/design/data-models.md` §7（⚠️ `letter_screen_4` 仍未补录，L3 提案待执行）

### D10 · 大屏 API 数据结构强制数组化

- **结论**：见 §1 总表 D10 行。要点：
    - 总原则：API `data` 字段必须为数组形式，禁止扁平对象 / 嵌套对象 / ECharts `series` 数组原样返回 / 双组对象 / 三维对象等任何非数组形态
    - 基础项（4 大屏通用）：`{ key: string, name: string, value: number, unit: string, label?: string, type?: string }`，前 4 项必填（`unit` 必带）
    - data 顶层字段名（数组化别名）：`items` / `summary` / `channels` / `regions` / `rows`；内部形状一致
    - 三维扩展（仅 041 `/summary` + `/channels`，2026-08-27+）：在 `value` 上同步输出 `local`（RA=2）+ `beijing`（RA=1）
    - 不变量：`value === local + beijing`（已加单测）
    - 向后兼容：旧调用方可只读 `value`，新字段不破坏既有前端
    - 空数据返回 `[]`（不是 `null` / `{}`）
    - 数组项顺序：服务端保持稳定（按数据插入顺序）
- **日期演进**：2026-08-14（第 1 次拍板）→ 2026-08-17（前端落地 groupBy/orderChannels）→ 2026-08-27（三维扩展拍板）→ 2026-08-28（沉淀到 skill）
- **演进链**：

    | 日期 | 节点 | 来源 task |
    | --- | --- | --- |
    | 2026-08-14 | 6 种混乱形态统一为 `items` 数组（`{key, name, value, unit, label?, type?}`） | `task-2026-08-14-038-大屏API数据结构统一` |
    | 2026-08-17 | 前端落地：`.map(items, render)` + `groupByPeriod` / `orderChannels` 自动适配 | `task-2026-08-17-041-4大屏页面入口初始化` |
    | 2026-08-27 | 「彻底数据点化」+ 三维扩展（`local` / `beijing` + 不变量） | `task-2026-08-27-057-041模块4地图全栈开发` |
    | 2026-08-27 | 删除 `summaryToCards` / `channelsToCards` 等中间转换函数 | `task-2026-08-27-058-041模块4子任务概要情况卡片与各渠道卡片实现` |
    | 2026-08-28 | 沉淀到 skill `design/006` + `design/006-001` | 本决策登记 |

- **落点**：
    - ✅ **已落地**（25 端点）：038 全部 7 + 039 全部 6 + 040 全部 6 + 041 全部 6（含三维扩展） → `docs/specs/038-041/spec.md §3.2/§3.3`
    - ✅ **skill 沉淀**（私人，非团队可见）：
        - `design/006-big-screen-data-arrayification.md`（SSOT 字段模型 + 适配矩阵 + 反模式 + 自检清单）
        - `design/006-001-data-arrayification-prompt.md`（团队可粘贴 AI prompt 副本）
    - ⏳ **待落地**（L2/L3 提案审批）：
        - **L3**：在 `docs/design/api-contracts.md §7` 之前新增「大屏通用约定」章节，晋升本原则为团队正式设计文档
        - **L2**：在 `AGENTS.md §5` 新增「6. 大屏 API 数据结构强制数组化」1 条，引用 `design/006`
        - **L3**：审计 035 月报历史 6 端点（`api-contracts.md §7.35–§7.40`），对齐本原则（按需迁移）

---

## 4. 变更记录

| 日期       | 决策 | 变更                                                                                | 备注              |
| ---------- | ---- | ----------------------------------------------------------------------------------- | ----------------- |
| 2026-08-11 | D1   | ✅ 关闭：ECharts 6.1.0                                                              | 用户拍板          |
| 2026-08-11 | D2   | ✅ 关闭：4 spec（038–041）                                                          | 用户拍板          |
| 2026-08-11 | D4   | ❌ 撤回：并入 task-001                                                              | -                 |
| 2026-08-11 | D5   | ❌ 撤销：目录不存在已确认                                                           | -                 |
| 2026-08-11 | D9   | ✅ 关闭：`_4` 存在，需补录                                                          | task-001 产出     |
| 2026-08-11 | D3   | ✅ 关闭：4A 组合（端点层级 / query param / 4 独立 key / 统一壳）；mode 修正为不存在 | 用户拍板          |
| 2026-08-11 | D7   | ✅ 关闭：4 独立 key（跟随 D3）                                                      | 跟随 D3           |
| 2026-08-11 | D-R4 | ✅ 关闭：4 平级菜单（跟随 D2+D3）                                                   | 跟随 D3           |
| 2026-08-13 | D6   | 🟡 部分解锁：038 PM 输入已迁入；039/040/041 待迁入                                  | task-017 偏移修复 |
| 2026-08-13 | D8   | ✅ 关闭：合并冲突标记已清理                                                         | task-017 偏移修复 |
| 2026-08-28 | D10  | ✅ 关闭：大屏 API 数据结构强制数组化（25 端点已落地）                              | 沉淀到 skill `design/006` + `design/006-001`；后续走 L3 晋升 `api-contracts.md` |
