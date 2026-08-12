# 002 · 大屏可视化分析决策日志

> 性质：动态维护文档，每次拍板后更新
> 日期：2026-08-11
> 维护规则：决策状态变化时即时更新；本文件不入 `docs/`、不入 Git

---

## 1. 决策总表

| 编号   | 决策项                                   | 状态         | 决策结论                                                                                              | 日期       | 阻塞方               | 影响范围                                              |
| ------ | ---------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------- | ---------- | -------------------- | ----------------------------------------------------- |
| D1     | 图表选型                                 | ✅ 已关闭    | ECharts 6.1.0 + echarts-for-react 3.0.6                                                              | 2026-08-11 | -                    | spec §0 / 前端                                        |
| D2     | spec 拆分粒度（1 / 2 / 4）               | ✅ 已关闭    | 4 spec（038–041），编号从 038 起                                                                     | 2026-08-11 | -                    | specs/index / system-overview / AGENTS §2.1           |
| D3     | 后端 API 形状 + 鉴权粒度                 | ✅ 已关闭    | 4A 组合：端点层级 `/api/visual/big-screen/{screen}/{module}`；query param（无 mode，实际 cantCode/cantType）；4 独立 key；统一壳 | 2026-08-11 | -                    | api-contracts §7.41+ / 后端                            |
| D4     | 数据源可用性核验                         | ❌ 撤回      | 不单独做，并入 task-001 通读                                                                          | 2026-08-11 | -                    | -                                                     |
| D5     | 前端目录现状核对                         | ❌ 撤销      | 已确认 `pages/visual/` 不存在                                                                        | 2026-08-11 | -                    | -                                                     |
| D6     | PM 输入迁入 `pm-inputs/`                 | ⚪ 阻塞      | 待 D2（✅ 已解锁）；88 张设计稿是否全迁入待定                                                         | -          | 用户                 | `docs/specs/038-*/pm-inputs/`                         |
| D7     | 鉴权菜单 key 设计                        | ✅ 已关闭    | 4 个独立 key（跟随 D3 方案 A）                                                                       | 2026-08-11 | -                    | system-overview §2.4 / AGENTS §4                      |
| D8     | `api-contracts.md` §7.1 Git 合并冲突     | 🔽 低优      | 非本项目引入，择机处理；`<<<<<<< HEAD` 标记在 L155–L194                                              | -          | L3 审批              | api-contracts §7.1                                    |
| D9     | `letter_screen_4` 缺失确认               | ✅ 已关闭    | `_4` 存在且被 PM 使用（地图信访数据，模块 4）；`data-models.md` §7 需补录                            | 2026-08-11 | -                    | data-models §7                                        |
| D-R4   | 4 屏是「平级 4 菜单」还是「1 菜单 4 tab」 | ✅ 已关闭    | 4 平级菜单（跟随 D2 = 4 spec + D3 方案 A = 4 独立 key）                                              | 2026-08-11 | -                    | system-overview §2.2.2 / 路由                          |

> 图例：✅ 已关闭 / 🟡 待拍板 / ⚪ 阻塞 / ❌ 撤回 / 🔽 低优

---

## 2. 待拍板决策详情

### 2.1 D6 · PM 输入迁入路径

**docs 线索**：
- `_template/pm-inputs/` 结构（assets + pm-requirements-input.md）
- 035 的 legacy-source-inventory 替代模式

**待定**：88 张设计稿是否全迁入还是精选

---

## 3. 已关闭决策归档

### D1 · 图表选型

- **结论**：ECharts 6.1.0 + echarts-for-react 3.0.6
- **日期**：2026-08-11
- **落点**：spec §0「技术决策」+ `docs/skills/frontend/react/coding.md`（L3 提案待审批）

### D2 · spec 拆分粒度

- **结论**：4 spec（每屏一 spec），编号从 038 起
- **日期**：2026-08-11
- **spec 目录**：

| 编号 | 目录名                                   | 大屏             | 数据源（schema · 表）                              |
| ---- | ---------------------------------------- | ---------------- | -------------------------------------------------- |
| 038  | `038-visual-big-screen-personnel`        | 人员信息大屏     | `dw_basic_lc` · `stats_jdlk_persion_*`（4 张表）   |
| 039  | `039-visual-big-screen-petition-liaoning` | 辽宁信访大屏     | `dw_basic_lc` · `letter_screen_1/2/3`             |
| 040  | `040-visual-big-screen-petition-beijing`  | 进京信访大屏     | `dw_basic_lc` · `letter_screen_5/6` + 部分 `_1/2/3` |
| 041  | `041-visual-big-screen-petition-compare`  | 信访比对大屏     | `dw_basic_lc` · 跨 `letter_screen_*`              |

- **落点**：`docs/specs/index.md` + `docs/design/system-overview.md` §2.2.2（L3 提案待审批）

### D3 · 后端 API 形状 + 鉴权粒度

- **结论**：4A 组合
  - 端点路径：`/api/visual/big-screen/{screen}/{module}`（层级式，screen = spec 目录名）
  - 参数传递：query param（cantCode / cantType 等；**无 mode**——经查证 PM 需求大屏不存在 mode=latest/year 切换场景）
  - 鉴权粒度：4 个独立菜单 key（`visual-big-screen-personnel` / `visual-big-screen-petition-liaoning` / `visual-big-screen-petition-beijing` / `visual-big-screen-petition-compare`）
  - 响应结构：统一壳 `{ code, message, data }`（ApiResponse）
- **日期**：2026-08-11
- **落点**：`docs/design/api-contracts.md` §7.41+（L3 提案待审批）

### D7 · 鉴权菜单 key 设计

- **结论**：4 个独立 key（跟随 D3 方案 A）
- **日期**：2026-08-11
- **落点**：`docs/design/system-overview.md` §2.4 / `AGENTS.md` §4（L2/L3 提案待审批）

### D-R4 · 4 屏菜单结构

- **结论**：4 平级菜单（跟随 D2 = 4 spec + D3 方案 A = 4 独立 key）
- **日期**：2026-08-11
- **落点**：`docs/design/system-overview.md` §2.2.2 / 路由（L3 提案待审批）

### D9 · letter_screen_4 缺失确认

- **结论**：`letter_screen_4` 存在且被 PM 需求使用（地图信访数据，模块 4）；`data-models.md` §7 需补录
- **日期**：2026-08-11
- **落点**：`docs/design/data-models.md` §7（L3 提案待审批）

---

## 4. 变更记录

| 日期       | 决策   | 变更                           | 备注         |
| ---------- | ------ | ------------------------------ | ------------ |
| 2026-08-11 | D1     | ✅ 关闭：ECharts 6.1.0         | 用户拍板     |
| 2026-08-11 | D2     | ✅ 关闭：4 spec（038–041）     | 用户拍板     |
| 2026-08-11 | D4     | ❌ 撤回：并入 task-001         | -            |
| 2026-08-11 | D5     | ❌ 撤销：目录不存在已确认      | -            |
| 2026-08-11 | D9     | ✅ 关闭：`_4` 存在，需补录     | task-001 产出 |
| 2026-08-11 | D3     | ✅ 关闭：4A 组合（端点层级 / query param / 4 独立 key / 统一壳）；mode 修正为不存在 | 用户拍板 |
| 2026-08-11 | D7     | ✅ 关闭：4 独立 key（跟随 D3） | 跟随 D3      |
| 2026-08-11 | D-R4   | ✅ 关闭：4 平级菜单（跟随 D2+D3） | 跟随 D3   |
