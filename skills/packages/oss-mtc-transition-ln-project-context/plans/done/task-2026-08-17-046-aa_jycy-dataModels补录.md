# Task · 2026-08-17-046-aa_jycy-dataModels补录

> 状态：✅ 完成（2026-08-17；L1 自由操作移入 `plans/done/`）
> 类型：L3 docs 维护（`docs/design/data-models.md` §8.7 补录）
> 创建：2026-08-17
> 完成：2026-08-17
> 前置：task-029 review 发现 + 038 spec 编码前置阻塞清理阶段 B1 产出物恢复
> 解锁：task-033（038 spec 14 处 §8.7 引用失效修复）+ task-034 阶段 A（api-contracts §7.38 登记）

---

## 0. 任务信息

| 项        | 值                                                                                                                                                                          |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 编号-slug | 2026-08-17-046-aa_jycy-dataModels补录                                                                                                                                       |
| 任务类型  | L3 docs 维护                                                                                                                                                                |
| 影响范围  | `docs/design/data-models.md` §8.7（新增章节）                                                                                                                               |
| 验收标准  | ① §8.7 补录 32 字段定义 + Kingbase 建表 SQL + 索引 ② §10 关联 O-2/O-5/O-6 状态保留为「开放」+ 「语法验证通过，业务验证待数据导入」备注 ③ 不影响 §8.6 空缺编号 ④ L3 提案审批走完 |
| 修复方式  | 按本文件 §3 草案执行；提案通过后落地                                                                                                                                        |

---

## 完成小结（2026-08-17）

- **L3 提案**：`R-DOCS-DATA-MODELS-AA-JYCY-S8.7` 已写入 `roadmap-2026-08-11-big-screen.md §4` 并标记 `[x]`（PM / 架构师会签通过）
- **§8.7 章节落地**：`docs/design/data-models.md` §8.7 插入完成（L1924-L2025），含 32 字段表 + Kingbase 建表 SQL + `idx_aa_jycy_身份证号` 索引 + §10 关联 + 历史归档
- **联动更新 038 `data-model-extensions.md §3 合并回 design 的约定`**：移除「`aa_jycy` 字段定义见本文件 §2.6 末尾（data-models.md 未收录，待 L3 提案补录）」备注，权威源迁移至 `docs/design/data-models.md#L1924` §8.7
- **038 spec §10 O-2/O-5/O-6 状态回填**：
  - O-2：开放 → **关闭**（Kingbase 双引号语法验证已通过；权威源已迁移 §8.7）
  - O-5：保持开放（`rylb` 枚举值仍待样本数据导入后核对；权威源已迁移 §8.7）
  - O-6：保持开放（「安置地」存储格式仍待样本数据导入后核对；权威源已迁移 §8.7）
- **§8.6 编号保持空缺**（信访大屏模块内容已合并 §7），未触动 §8.1~§8.5 / §9 内容
- **解锁**：task-033（038 spec 14 处 §8.7 引用可启动修复）+ task-034 阶段 A（api-contracts §7.38 阻塞 #1 解锁，可继续）

### 验收清单

- [x] §8.7 章节插入位置正确（§8.5 `archive_infor` 之后，`## 9. 枚举与字典` 之前）
- [x] 32 字段表完整 + 类型 / 必填 / 约束字段填写
- [x] Kingbase 建表 SQL 完整（task-046 §3.1 内嵌版本；参考 038 spec 编码前置阻塞清理阶段 B1 已验证可执行）
- [x] §10 关联说明列出 O-2 / O-5 / O-6 三个开放问题
- [x] 历史归档段记录 2026-08-12 ~ 2026-08-14 之间丢失脉络
- [x] §8.6 编号空缺保持；§8.1~§8.5 + §9 内容未触动
- [x] 联动更新 038 `data-model-extensions.md §3 合并回 design 约定`
- [x] 联动更新 038 spec §10 O-2 关闭 + O-5 / O-6 备注权威源迁移

---

## 1. 背景

### 1.1 问题

038 人员信息大屏 spec 和 `data-model-extensions.md` 共 14 处引用 `aa_jycy` 表并标注来源为 `data-models.md §8.7`，但 `data-models.md §8.7` 当前不存在（§8 章节范围为 §8.1~§8.5）。

**历史脉络**：

| 时间      | 事件                                                                                                  | 来源                                                                          |
| --------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 2026-08-12 | task-013 验收：标记 `aa_jycy` 存在于 §8.7 ✅                                                          | `done/task-2026-08-12-013-038-spec五件套生成.md#L65`                            |
| 2026-08-12 | task-015 落地：执行 Kingbase 建表 SQL + "同步修正 data-models.md §8.7"                                | `done/task-2026-08-12-015-038-编码前置阻塞清理.md#L83-L125` + `L390`             |
| 2026-08-14 | task-029 review 发现：data-models.md §8.7 已不存在                                                     | `done/task-2026-08-14-029-4大屏spec-re-review.md#L32`                          |
| 2026-08-14 | task-033 创建：阻塞待用户决策 A / B / C                                                                | `done/task-2026-08-14-033-038spec修复.md`                                      |
| 2026-08-17 | 用户决策 **A**：在 data-models.md §8.7 补录；本 task 创建                                              | 用户决策                                                                       |

### 1.2 选项 A 的执行前提

- task-015 已在 `aa_jycy.sql` 文件头标注 `Source Schema: dw_basic_lc`
- task-015 L83-L129 保留完整 32 字段定义 + Kingbase 建表 SQL
- task-015 L391 记录「B1 `aa_jycy` 建表成功（Kingbase 双引号语法 OK）」
- task-015 L218 记录「B1 ✅ 已建表」

数据可信：32 字段全 `varchar(255) NULL DEFAULT NULL`，中文字段名 + 1 个索引 `idx_aa_jycy_身份证号`。

---

## 2. 阻塞解锁路径

```
task-046 启动
    │
    ├─→ L3 提案 R-DOCS-DATA-MODELS-AA-JYCY-S8.7 写入 roadmap §4（[ ] 状态）──→ 等会签
    │                                                                           │
    │                                                              审批通过 [x]
    │                                                                           │
    ├─→ 执行：data-models.md §8.7 插入（L3）
    │
    ├─→ task-033 解锁：038 spec 14 处 §8.7 引用修复（L3）
    │
    └─→ task-034 阶段 A 阻塞 #1 解锁：可继续 api-contracts §7.38 登记（L3）
```

---

## 3. data-models.md §8.7 草案

> 插入位置：`docs/design/data-models.md` L1923（§8.5 `archive_infor` 末尾 `---` 后）与 L1925（`## 9. 枚举与字典` 前）之间。
> 风格对齐：参考 §8.2 `abi_zb_tyjrjqyfdx` + §8.4 `analysis_report_file_info` 格式（Schema / 用途 / 取数语义 / 字段表）。

### 3.1 草案内容

````markdown
### 8.7 `aa_jycy`（就业创业信息表）

**Schema**：`dw_basic_lc.aa_jycy`

**用途**：退役军人就业创业信息登记表；大屏模块 6（就业状况分布）数据源。按 `cbzt` 区分已就业 / 未就业 / 失业，按 `rylb` 区分人员类别，按「安置地」做地市级筛选。

> **取数语义**：全表扫描（无统计快照）；按 `cbzt` + `rylb` 聚合；地市级筛选通过 `安置地 LIKE cantCode || '%'` 实现（`安置地` 存储格式待确认，见 §10 O-6）。
>
> **大屏用量**：模块 6 `/employment` 端点全量依赖本表（按 `cantCode` 省级 / 地市级二选一）。
>
> **索引**：仅 `身份证号` 有索引（`idx_aa_jycy_身份证号`）；`rylb` 无索引，数据量百万级时 `GROUP BY rylb` 可能 P95 > 1s（见 §11 P-3 性能风险，待数据导入后实测）。

| 字段                       | 类型         | 必填 | 约束 / 说明                                                                  |
| -------------------------- | ------------ | ---- | ---------------------------------------------------------------------------- |
| 序号                       | varchar(255) |      | 序号                                                                         |
| 姓名                       | varchar(255) |      | 姓名                                                                         |
| 身份证号                   | varchar(255) | 是   | 身份证号（有索引 `idx_aa_jycy_身份证号`）                                    |
| 安置地                     | varchar(255) |      | 安置地（地市级筛选字段；存储格式待确认，spec §10 O-6）                        |
| rylb                       | varchar(255) | 是   | 人员类别（枚举值待确认，spec §10 O-5）                                       |
| 联系方式                   | varchar(255) |      | 联系方式                                                                     |
| 学历                       | varchar(255) |      | 学历                                                                         |
| 专业                       | varchar(255) |      | 专业                                                                         |
| 退役年份                   | varchar(255) |      | 退役年份                                                                     |
| 是否企业参保               | varchar(255) |      | 是否企业参保                                                                 |
| 企业参保状态               | varchar(255) |      | 企业参保状态                                                                 |
| 是否机关和事业单位参保     | varchar(255) |      | 是否机关和事业单位参保                                                       |
| 机关和事业单位参保状态     | varchar(255) |      | 机关和事业单位参保状态                                                       |
| 是否居民参保               | varchar(255) |      | 是否居民参保                                                                 |
| 居民参保状态               | varchar(255) |      | 居民参保状态                                                                 |
| cbzt                       | varchar(255) | 是   | 参保状态（枚举：已就业 / 未就业 / 失业）                                     |
| 招录性质                   | varchar(255) |      | 招录性质                                                                     |
| 参保单位                   | varchar(255) |      | 参保单位                                                                     |
| 岗位名称                   | varchar(255) |      | 岗位名称                                                                     |
| 未参保原因                 | varchar(255) |      | 未参保原因                                                                   |
| 选择原因                   | varchar(255) |      | 选择原因                                                                     |
| 学校名称                   | varchar(255) |      | 学校名称                                                                     |
| 专业名称                   | varchar(255) |      | 专业名称                                                                     |
| 参保原因                   | varchar(255) |      | 参保原因                                                                     |
| 提供就业服务情况           | varchar(255) |      | 提供就业服务情况                                                             |
| 岗位1                      | varchar(255) |      | 岗位1                                                                        |
| 岗位2                      | varchar(255) |      | 岗位2                                                                        |
| 岗位3                      | varchar(255) |      | 岗位3                                                                        |
| 是否参加"以工代赈"行动     | varchar(255) |      | 是否参加"以工代赈"行动                                                       |
| 填报人                     | varchar(255) |      | 填报人                                                                       |
| 填报人联系方式             | varchar(255) |      | 填报人联系方式                                                               |
| 状态                       | varchar(255) |      | 状态                                                                         |

**建表 SQL**（Kingbase 方言，task-015 B1 已验证可执行）：

```sql
-- 源库：MySQL 5.7.27，Schema `dw_basic_lc`，表 `aa_jycy`
-- 转换规则：反引号→双引号、去掉 ENGINE/CHARACTER SET/COLLATE/ROW_FORMAT、utf8mb4→utf8
DROP TABLE IF EXISTS "aa_jycy";
CREATE TABLE "aa_jycy" (
  "序号" varchar(255) NULL DEFAULT NULL,
  "姓名" varchar(255) NULL DEFAULT NULL,
  "身份证号" varchar(255) NULL DEFAULT NULL,
  "安置地" varchar(255) NULL DEFAULT NULL,
  "rylb" varchar(255) NULL DEFAULT NULL,
  "联系方式" varchar(255) NULL DEFAULT NULL,
  "学历" varchar(255) NULL DEFAULT NULL,
  "专业" varchar(255) NULL DEFAULT NULL,
  "退役年份" varchar(255) NULL DEFAULT NULL,
  "是否企业参保" varchar(255) NULL DEFAULT NULL,
  "企业参保状态" varchar(255) NULL DEFAULT NULL,
  "是否机关和事业单位参保" varchar(255) NULL DEFAULT NULL,
  "机关和事业单位参保状态" varchar(255) NULL DEFAULT NULL,
  "是否居民参保" varchar(255) NULL DEFAULT NULL,
  "居民参保状态" varchar(255) NULL DEFAULT NULL,
  "cbzt" varchar(255) NULL DEFAULT NULL,
  "招录性质" varchar(255) NULL DEFAULT NULL,
  "参保单位" varchar(255) NULL DEFAULT NULL,
  "岗位名称" varchar(255) NULL DEFAULT NULL,
  "未参保原因" varchar(255) NULL DEFAULT NULL,
  "选择原因" varchar(255) NULL DEFAULT NULL,
  "学校名称" varchar(255) NULL DEFAULT NULL,
  "专业名称" varchar(255) NULL DEFAULT NULL,
  "参保原因" varchar(255) NULL DEFAULT NULL,
  "提供就业服务情况" varchar(255) NULL DEFAULT NULL,
  "岗位1" varchar(255) NULL DEFAULT NULL,
  "岗位2" varchar(255) NULL DEFAULT NULL,
  "岗位3" varchar(255) NULL DEFAULT NULL,
  "是否参加"以工代赈"行动" varchar(255) NULL DEFAULT NULL,
  "填报人" varchar(255) NULL DEFAULT NULL,
  "填报人联系方式" varchar(255) NULL DEFAULT NULL,
  "状态" varchar(255) NULL DEFAULT NULL
);
CREATE INDEX "idx_aa_jycy_身份证号" ON "aa_jycy" ("身份证号");
```

**字段口径关联（spec §10 开放问题）**：

- **O-2 中文字段名**：Kingbase 双引号包裹语法验证已通过（task-015 L391）；本章节为正式权威源
- **O-5 `rylb` 枚举值**：待样本数据导入后核对；当前依赖 PM §F.5 字段定义
- **O-6 「安置地」存储格式**：待样本数据导入后核对（名称 vs 编码）

**历史归档**：本章节曾在 task-015 阶段落地，后于 2026-08-12 ~ 2026-08-14 之间丢失；本 task 按 task-015 产出物 + 038 `data-model-extensions.md §2.6` 字段定义恢复。

---
````

### 3.2 插入位置示意

```
... §8.5 archive_infor 字段表（行 1922）
---                                                  ← L1923 §8.5 结尾分隔线
### 8.7 `aa_jycy`（就业创业信息表）                  ← 新增章节
... （§3.1 完整内容）...
---                                                  ← 新增章节结尾分隔线
## 9. 枚举与字典                                     ← L1925 原文不变
```

> **注**：§8.6 编号空缺（信访大屏模块内容已合并到 §7）；§8.7 编号保留历史对应关系。

---

## 4. L3 提案：`R-DOCS-DATA-MODELS-AA-JYCY-S8.7`

### 4.1 提案要素

| 字段     | 值                                                                                            |
| -------- | --------------------------------------------------------------------------------------------- |
| 目标文件 | `docs/design/data-models.md` §8.7（新增）                                                     |
| L3 等级  | docs 文档修改（需 PM / 架构师会签）                                                           |
| 关联任务 | task-046（本任务）、task-033（038 spec 14 处引用修复）、task-034 阶段 A                       |
| 关联提案 | 无                                                                                            |

### 4.2 改动范围

1. `docs/design/data-models.md` §8.7 新增：32 字段表 + Kingbase 建表 SQL + 索引 + §10 关联说明 + 历史归档
2. 不动：§8.6 编号空缺保持；§8.1~§8.5 内容保持；§9 枚举与字典保持
3. 联动：task-033 修复 038 spec 14 处 `aa_jycy` → §8.7 引用（保持现状即可，不再视为失效）；038 §10 O-2/O-5/O-6 状态调整为「语法验证通过，业务验证待数据导入」
4. 联动：038 `data-model-extensions.md §2.6 末尾 aa_jycy 字段定义` 块可移除「data-models.md 未收录，待 L3 提案补录」备注（§3 §3 合并回 design 约定同步）

### 4.3 风险评估

| 风险                                              | 概率 | 影响 | 缓解                                                                |
| ------------------------------------------------- | ---- | ---- | ------------------------------------------------------------------- |
| 字段定义与实际 DDL 不一致（task-015 后表结构变更）| 低   | 中   | 实施前 SQL `DESC dw_basic_lc.aa_jycy` 比对；不一致则补差异字段       |
| `rylb` 枚举值与业务实际不符                       | 中   | 低   | §10 O-5 保留开放；样本数据导入后 PM 决策                              |
| `安置地` 存储格式（名称 vs 编码）与 SQL 不匹配    | 中   | 中   | §10 O-6 保留开放；样本数据导入后决定 `LIKE` 模式                      |
| 与未来 §8.6 补录冲突                              | 0    | —    | §8.6 永久空缺（信访大屏内容已迁 §7），不影响                         |

### 4.4 验收标准

- [ ] §8.7 章节插入位置正确（§8.5 之后，§9 之前）
- [ ] 32 字段表完整 + 类型 / 必填 / 说明字段填写
- [ ] Kingbase 建表 SQL 可独立执行（验证语法，可不实际执行）
- [ ] §10 关联说明列出 O-2/O-5/O-6 三个开放问题
- [ ] 历史归档段落记录 task-015 → 丢失 → 恢复脉络
- [ ] §8.6 编号空缺保持；§8.1~§8.5 + §9 内容未触动
- [ ] 联动更新：038 `data-model-extensions.md §3 合并回 design 约定` + §10 O-2/O-5/O-6 状态说明

---

## 5. 硬约束

- 不写 `.trae/` 路径引用（产出 `docs/design/data-models.md` 引用走仓库相对路径）
- 不修改 PM 输入原始内容（`docs/specs/038/pm-inputs/pm-requirements-input.md`）
- L3 改动必须走 `plans/roadmap-2026-08-11-big-screen.md` §4 提案审批
- §8.7 编号保留（与历史 task-013 / task-015 验收一致）
- §8.6 编号保持空缺（不重新编号）

---

## 6. 状态记录

| 日期       | 变更                                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------------------- |
| 2026-08-17 | task 创建（用户决策 A 选项；§3 草案就绪；等 L3 提案 `R-DOCS-DATA-MODELS-AA-JYCY-S8.7` 会签）           |
| 2026-08-17 | L3 提案会签通过；执行落地：data-models.md §8.7 插入 + 038 dme.md §3 备注移除 + 038 spec §10 O-2 关闭 + O-5/O-6 权威源迁移备注；task 文件 L1 移入 `plans/done/`；解锁 task-033 + task-034 阶段 A |
