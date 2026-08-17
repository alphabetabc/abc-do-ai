# Review Notes · 2026-08-14-029 · 4 大屏 spec 与 data-models.md 一致性核对

> **关联 task**：`task-2026-08-14-029-4大屏spec-re-review.md`
> **基线**：当前 `docs/design/data-models.md`（恢复后版本）
> **状态**：进行中

---

## 基线参考（当前 data-models.md 关键信息）

- §1 边界表：可视化分析-信访 → `dw_basic_lc`
- §7 信访大屏：§7.1~§7.5（letter_screen_1/2/3/5/6，**无 letter_screen_4**）
- §8 报表/统计分析：§8.1~§8.5（**无 §8.6、无 §8.7**）
- 全文**无 `dw_dashboard`** schema 标注
- 全文**无 `aa_jycy`** 表定义

---

## 038 人员信息大屏

### 核对范围

- [x] spec.md 全文（数据源引用、正文注释、§10 开放问题）
- [x] data-model-extensions.md 全文

### 差异清单

| #   | 引用位置（文件 + 行号/章节）                        | 当前描述                                                   | data-models.md 实际          | 是否仍成立 | 修正建议                                                                                                                 |
| --- | --------------------------------------------------- | ---------------------------------------------------------- | ---------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | spec.md L17（头部「权威模型」）                     | `aa_jycy`（见 data-models.md §8.7）                        | §8.7 不存在                  | ❌ 不成立  | 删除 §8.7 引用；`aa_jycy` 表定义来源需另行确认（可能需在 data-model-extensions.md 中独立定义，或待 data-models.md 补录） |
| 2   | spec.md L40（S2 成功标准）                          | 与 `aa_jycy` 表一致                                        | §8.7 不存在                  | ❌ 不成立  | 同 #1，待 `aa_jycy` 来源确认后更新                                                                                       |
| 3   | spec.md L244（模块6 口径注释）                      | `aa_jycy` 表在 data-models.md §8.7 中字段名大量使用中文    | §8.7 不存在                  | ❌ 不成立  | 同 #1                                                                                                                    |
| 4   | spec.md L394（§5.1 数据源表）                       | `aa_jycy` → data-models §8.7                               | §8.7 不存在                  | ❌ 不成立  | 同 #1                                                                                                                    |
| 5   | spec.md L494（§10 O-2）                             | `aa_jycy` 表大量中文字段名，Kingbase SQL 需处理引号转义    | §8.7 不存在，无法核实字段名  | ❌ 不成立  | 待 `aa_jycy` 来源确认后重写                                                                                              |
| 6   | spec.md L497（§10 O-5）                             | `aa_jycy` 表的 `rylb` 字段枚举值未在 data-models.md 中定义 | §8.7 不存在                  | ❌ 不成立  | 同 #1                                                                                                                    |
| 7   | spec.md L498（§10 O-6）                             | `aa_jycy` 表「安置地」字段为中文字段名                     | §8.7 不存在                  | ❌ 不成立  | 同 #1                                                                                                                    |
| 8   | data-model-extensions.md L15（§1 实体表）           | `aa_jycy` → data-models §8.7                               | §8.7 不存在                  | ❌ 不成立  | 同 #1                                                                                                                    |
| 9   | data-model-extensions.md L189（§2.6）               | 源表：`dw_basic_lc.aa_jycy`（data-models §8.7）            | §8.7 不存在                  | ❌ 不成立  | 同 #1                                                                                                                    |
| 10  | data-model-extensions.md L222（§2.6 注释）          | `aa_jycy` 表使用中文字段名（data-models §8.7）             | §8.7 不存在                  | ❌ 不成立  | 同 #1                                                                                                                    |
| 11  | data-model-extensions.md L235（§3 合并回 design）   | `aa_jycy`（§8.7）已在 data-models.md 登记                  | §8.7 不存在                  | ❌ 不成立  | 同 #1                                                                                                                    |
| 12  | data-model-extensions.md L236（§3 合并回 design）   | §8.7 `aa_jycy` 表字段定义中…                               | §8.7 不存在                  | ❌ 不成立  | 同 #1                                                                                                                    |
| 13  | data-model-extensions.md L237（§3 合并回 design）   | 若联调发现 `aa_jycy` 表结构与 data-models §8.7 不一致      | §8.7 不存在                  | ❌ 不成立  | 同 #1                                                                                                                    |
| 14  | data-model-extensions.md L270（§4.4 全限定 schema） | `dw_basic_lc.aa_jycy`（三表同在 `dw_basic_lc` schema）     | §8.7 不存在，无法核实 schema | ❌ 不成立  | 同 #1                                                                                                                    |

### 038 核对结论

**核心问题**：038 spec 和 data-model-extensions.md 中大量引用 `aa_jycy` 表并标注来源为 data-models.md §8.7，但当前 data-models.md 中 §8.7 不存在。

**涉及 3 张表中的 2 张无问题**：

- `stats_jdlk_persion_infor_cant`（§6.4）→ ✅ 仍存在，引用正确
- `abi_zb_tyjrjqyfdx`（§8.2）→ ✅ 仍存在，引用正确
- `aa_jycy`（§8.7）→ ❌ 不存在

**影响范围**：038 spec.md 共 7 处引用 §8.7 / `aa_jycy`；data-model-extensions.md 共 7 处引用 §8.7 / `aa_jycy`。集中在模块6（就业状况）相关内容。

**§10 开放问题受影响的**：O-2、O-5、O-6 均依赖 `aa_jycy` 表定义，当前无法核实。

**其他开放问题不受影响**：O-1（lxgb 字段）、O-3（导航按钮）、O-4（端点复用）、O-7（api-contracts）、O-8（system-overview）均与 §8.7 无关。

**需要用户决策**：`aa_jycy` 表定义应如何处理？

- 选项 A：在 data-models.md 中补录 §8.7（需要 SQL 源文件）
- 选项 B：在 038 data-model-extensions.md 中独立定义 `aa_jycy` 字段
- 选项 C：暂不处理，O-2/O-5/O-6 标记为「待 data-models.md 补录后核实」

---

## 039 辽宁信访大屏

### 核对范围

- [x] spec.md 全文
- [x] data-model-extensions.md 全文

### 差异清单

| #   | 引用位置（文件 + 行号/章节）                           | 当前描述                                                                        | data-models.md 实际                                                               | 是否仍成立    | 修正建议                                                                       |
| --- | ------------------------------------------------------ | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------ |
| 1   | spec.md L17（头部「权威模型」）                        | `letter_screen_1`–`6`（见 data-models.md §7 / §8.6）                            | §7 存在（§7.1~§7.5）；§8.6 不存在                                                 | ❌ 部分不成立 | 删除 §8.6 引用，仅保留 §7                                                      |
| 2   | spec.md L445~L450（§5.1 数据源表）                     | 6 张表均标注 design 章节「§7.x / §8.6」                                         | §8.6 不存在                                                                       | ❌ 不成立     | 删除所有 §8.6 引用，仅保留 §7.x                                                |
| 3   | spec.md L448（§5.1 letter_screen_4）                   | data-models §7.4（备注：§8.6 未列）                                             | §7.4 标题是 letter_screen_5（非 4）；§8.6 不存在                                  | ❌ 不成立     | §7.4 标题与内容错位问题仍在；但 §8.6 相关注释应删除                            |
| 4   | spec.md L452（§5.1 注释）                              | `letter_screen_4` 在 §7 和 §8.6 章节归属不一致                                  | §8.6 不存在                                                                       | ❌ 不成立     | 重写：§7.4 标题写 letter_screen_5 但内容是 letter_screen_4 字段；§8.6 已不存在 |
| 5   | spec.md L528（§9.1 依赖）                              | Kingbase `dw_basic_lc` / `dw_dashboard`，schema 待核实                          | 全文无 `dw_dashboard`                                                             | ❌ 不成立     | 删除 `dw_dashboard` 引用；schema 仅为 `dw_basic_lc`（§1 边界表）               |
| 6   | spec.md L541（§9.2 上游回填清单）                      | data-models.md §7.1 / §8.6 字段类型 varchar                                     | §8.6 不存在                                                                       | ❌ 不成立     | 删除 §8.6 引用，仅保留 §7.1                                                    |
| 7   | spec.md L555（§10 O-1）                                | §7 vs §8.6 schema 不一致（dw_basic_lc vs dw_dashboard）                         | §8.6 不存在，dw_dashboard 不存在                                                  | ❌ 不成立     | 重写或关闭：dw_dashboard 标注已不存在；schema 仅 dw_basic_lc（§1 边界表）      |
| 8   | spec.md L556（§10 O-2）                                | §7.4 章节名称为 letter_screen_5 但内容为 letter_screen_4 字段定义；与 §8.6 比对 | §7.4 标题 letter_screen_5 内容是 4 的字段——**问题仍在**；但 §8.6 不存在，无法比对 | ⚠️ 部分成立   | 保留问题本身（§7.4 错位），但删除与 §8.6 比对的描述                            |
| 9   | spec.md L557（§10 O-3）                                | §7 标注 varchar，§8.6 几乎一致                                                  | §8.6 不存在                                                                       | ⚠️ 部分成立   | 保留 §7 varchar 问题；删除「§8.6 几乎一致」描述                                |
| 10  | data-model-extensions.md L13（§1 注释）                | schema 与 §7 / §8.6 不一致问题详见 §5 O-N1                                      | §8.6 不存在                                                                       | ❌ 不成立     | 删除 §8.6 引用                                                                 |
| 11  | data-model-extensions.md L17~L22（§1 实体表）          | 6 张表均标注 design 章节「§7.x / §8.6」                                         | §8.6 不存在                                                                       | ❌ 不成立     | 删除所有 §8.6 引用，仅保留 §7.x                                                |
| 12  | data-model-extensions.md L20（§1 letter_screen_4）     | data-models §7.4（章节归属待核实）                                              | §7.4 标题是 letter_screen_5（非 4）                                               | ⚠️ 仍成立     | 保留：§7.4 章节归属问题仍在                                                    |
| 13  | data-model-extensions.md L24（§1 注释）                | schema 标注以 PM 输入 SQL 未指定的双 schema 现状                                | 全文无 dw_dashboard                                                               | ❌ 不成立     | 删除双 schema 描述                                                             |
| 14  | data-model-extensions.md L60（§2.1 注释）              | `NUM_*` 为 varchar(64)（§7 / §8.6）                                             | §8.6 不存在                                                                       | ❌ 不成立     | 删除 §8.6 引用，仅保留 §7                                                      |
| 15  | data-model-extensions.md L206（§2.6 注释）             | 按 data-models.md §8.6 字段注释实现                                             | §8.6 不存在                                                                       | ❌ 不成立     | 改为引用 §7.3                                                                  |
| 16  | data-model-extensions.md L223~L225（§3 合并回 design） | `letter_screen_1`~`6`（§7 / §8.6）已登记；§7 和 §8.6 不一致详见 §5 O-N1         | §8.6 不存在                                                                       | ❌ 不成立     | 删除 §8.6 引用                                                                 |
| 17  | data-model-extensions.md L269（§4.4 注释）             | §5 O-N1：data-models.md §8.6 标注为 `dw_dashboard`，需回填统一                  | §8.6 不存在，dw_dashboard 不存在                                                  | ❌ 不成立     | 删除此注释                                                                     |
| 18  | data-model-extensions.md L285（§4.6 天粒度）           | §7 / §8.6 标注 6 张表均含 `STATS_DATE`                                          | §8.6 不存在                                                                       | ❌ 不成立     | 删除 §8.6 引用，仅保留 §7                                                      |
| 19  | data-model-extensions.md L312~L320（§5 O-N1）          | schema 不一致：§7 dw_basic_lc vs §8.6 dw_dashboard                              | §8.6 不存在，dw_dashboard 不存在                                                  | ❌ 不成立     | 重写或关闭：dw_dashboard 已不存在；schema 仅 dw_basic_lc                       |
| 20  | data-model-extensions.md L322~L329（§5 O-N2）          | §7.4 章节归属错位，与 §8.6 比对                                                 | §7.4 错位问题仍在；但 §8.6 不存在无法比对                                         | ⚠️ 部分成立   | 保留 §7.4 错位问题本身；删除与 §8.6 比对的描述                                 |

### 039 核对结论

**核心问题**：039 大量引用 §8.6 和 `dw_dashboard`，但当前 data-models.md 中 §8.6 不存在、dw_dashboard 不存在。

**三类差异**：

1. **§8.6 / dw_dashboard 引用失效**（#1, 2, 4, 5, 6, 7, 10, 11, 13, 14, 15, 16, 17, 18, 19）——共 15 处，需删除或改写为仅引用 §7
2. **§7.4 章节错位问题仍存在**（#3, 8, 12, 20）——共 4 处，问题本身成立（§7.4 标题写 letter_screen_5 但内容是 letter_screen_4 字段），但与 §8.6 比对的描述需删除
3. **§7 字段类型 varchar 问题仍存在**（#9）——1 处，问题本身成立，但「§8.6 几乎一致」描述需删除

**§10 开放问题**：

- O-1（schema 不一致）：❌ 前提失效，需重写或关闭
- O-2（§7.4 错位）：⚠️ 问题仍在，但需删除与 §8.6 比比的描述
- O-3（字段类型）：⚠️ 问题仍在，但需删除 §8.6 引用
- O-4~O-10：✅ 不受影响

**另外注意**：039 spec.md L448 写 `letter_screen_4 → data-models §7.4（备注：§8.6 未列）`，但当前 §7.4 的标题是 `letter_screen_5`（不是 4）。这说明 spec 已经意识到了 §7.4 的错位问题，但描述方式需要更新。

---

## 040 进京信访大屏

### 核对范围

- [x] spec.md 全文
- [x] data-model-extensions.md 全文

### 差异清单

| #   | 引用位置（文件 + 行号/章节）                           | 当前描述                                                               | data-models.md 实际                              | 是否仍成立    | 修正建议                                                                       |
| --- | ------------------------------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------ | ------------- | ------------------------------------------------------------------------------ |
| 1   | spec.md L17（头部「权威模型」）                        | `letter_screen_1`–`6`（见 data-models.md §7 / §8.6）                   | §7 存在；§8.6 不存在                             | ❌ 部分不成立 | 删除 §8.6 引用，仅保留 §7                                                      |
| 2   | spec.md L462~L467（§5.1 数据源表）                     | 6 张表均标注 design 章节「§7.x / §8.6」                                | §8.6 不存在                                      | ❌ 不成立     | 删除所有 §8.6 引用，仅保留 §7.x                                                |
| 3   | spec.md L465（§5.1 letter_screen_4）                   | data-models §7.4（备注：§8.6 未列）                                    | §7.4 标题是 letter_screen_5（非 4）；§8.6 不存在 | ❌ 不成立     | §7.4 错位问题仍在；删除 §8.6 相关注释                                          |
| 4   | spec.md L469（§5.1 注释）                              | `letter_screen_4` 在 §7 和 §8.6 章节归属不一致                         | §8.6 不存在                                      | ❌ 不成立     | 重写：§7.4 标题写 letter_screen_5 但内容是 letter_screen_4 字段；§8.6 已不存在 |
| 5   | spec.md L547（§9.1 依赖）                              | Kingbase `dw_basic_lc` / `dw_dashboard`，schema 待核实                 | 全文无 `dw_dashboard`                            | ❌ 不成立     | 删除 `dw_dashboard` 引用                                                       |
| 6   | spec.md L559（§9.2 上游回填清单）                      | data-models.md §7.1 / §8.6 字段类型 varchar                            | §8.6 不存在                                      | ❌ 不成立     | 删除 §8.6 引用，仅保留 §7.1                                                    |
| 7   | spec.md L573（§10 O-1）                                | §7 vs §8.6 schema 不一致（dw_basic_lc vs dw_dashboard）                | §8.6 不存在，dw_dashboard 不存在                 | ❌ 不成立     | 重写或关闭                                                                     |
| 8   | spec.md L574（§10 O-2）                                | §7.4 章节名称为 letter_screen_5 但内容为 letter_screen_4；与 §8.6 比对 | §7.4 错位问题仍在；§8.6 不存在                   | ⚠️ 部分成立   | 保留 §7.4 错位问题；删除与 §8.6 比对描述                                       |
| 9   | spec.md L575（§10 O-3）                                | §7 标注 varchar，§8.6 几乎一致                                         | §8.6 不存在                                      | ⚠️ 部分成立   | 保留 §7 varchar 问题；删除 §8.6 引用                                           |
| 10  | data-model-extensions.md L15（§1 注释）                | schema 与 §7 / §8.6 不一致问题详见 §5 O-N1                             | §8.6 不存在                                      | ❌ 不成立     | 删除 §8.6 引用                                                                 |
| 11  | data-model-extensions.md L19~L24（§1 实体表）          | 6 张表均标注 design 章节「§7.x / §8.6」                                | §8.6 不存在                                      | ❌ 不成立     | 删除所有 §8.6 引用                                                             |
| 12  | data-model-extensions.md L22（§1 letter_screen_4）     | data-models §7.4（章节归属待核实）                                     | §7.4 标题是 letter_screen_5                      | ⚠️ 仍成立     | 保留                                                                           |
| 13  | data-model-extensions.md L26（§1 注释）                | 双 schema 现状，§5 O-N1 提出 design 回填请求                           | 全文无 dw_dashboard                              | ❌ 不成立     | 删除双 schema 描述                                                             |
| 14  | data-model-extensions.md L62（§2.1 注释）              | `NUM_*` 为 varchar(64)（§7 / §8.6）                                    | §8.6 不存在                                      | ❌ 不成立     | 删除 §8.6 引用                                                                 |
| 15  | data-model-extensions.md L224（§2.6 注释）             | 按 data-models.md §8.6 字段注释实现                                    | §8.6 不存在                                      | ❌ 不成立     | 改为引用 §7.3                                                                  |
| 16  | data-model-extensions.md L241~L243（§3 合并回 design） | `letter_screen_1`~`6`（§7 / §8.6）已登记；不一致详见 §5 O-N1           | §8.6 不存在                                      | ❌ 不成立     | 删除 §8.6 引用                                                                 |
| 17  | data-model-extensions.md L288（§4.4 注释）             | §5 O-N1：data-models.md §8.6 标注为 `dw_dashboard`，需回填统一         | §8.6 不存在                                      | ❌ 不成立     | 删除此注释                                                                     |
| 18  | data-model-extensions.md L304（§4.6 天粒度）           | §7 / §8.6 标注 6 张表均含 `STATS_DATE`                                 | §8.6 不存在                                      | ❌ 不成立     | 删除 §8.6 引用                                                                 |
| 19  | data-model-extensions.md L333~L341（§5 O-N1）          | schema 不一致：§7 dw_basic_lc vs §8.6 dw_dashboard                     | §8.6 不存在                                      | ❌ 不成立     | 重写或关闭                                                                     |
| 20  | data-model-extensions.md L343~L350（§5 O-N2）          | §7.4 章节归属错位，与 §8.6 比对                                        | §7.4 错位仍在；§8.6 不存在                       | ⚠️ 部分成立   | 保留 §7.4 错位问题；删除与 §8.6 比对描述                                       |

### 040 核对结论

**核心问题**：040 与 039 完全同构——大量引用 §8.6 和 `dw_dashboard`，但当前 data-models.md 中 §8.6 不存在、dw_dashboard 不存在。

**三类差异**（与 039 完全一致）：

1. **§8.6 / dw_dashboard 引用失效**（#1, 2, 4, 5, 6, 7, 10, 11, 13, 14, 15, 16, 17, 18, 19）——共 15 处
2. **§7.4 章节错位问题仍存在**（#3, 8, 12, 20）——共 4 处
3. **§7 字段类型 varchar 问题仍存在**（#9）——1 处

**§10 开放问题**：

- O-1（schema 不一致）：❌ 前提失效
- O-2（§7.4 错位）：⚠️ 问题仍在，需删除 §8.6

---

## 041 信访数据比对大屏

### 核对范围

- [x] spec.md 全文
- [x] data-model-extensions.md 全文

### 差异清单

| #   | 引用位置（文件 + 行号/章节）                           | 当前描述                                                               | data-models.md 实际                              | 是否仍成立    | 修正建议                                                                       |
| --- | ------------------------------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------ | ------------- | ------------------------------------------------------------------------------ |
| 1   | spec.md L17（头部「权威模型」）                        | `letter_screen_1`–`6`（见 data-models.md §7 / §8.6）                   | §7 存在；§8.6 不存在                             | ❌ 部分不成立 | 删除 §8.6 引用，仅保留 §7                                                      |
| 2   | spec.md L504~L509（§5.1 数据源表）                     | 6 张表均标注 design 章节「§7.x / §8.6」                                | §8.6 不存在                                      | ❌ 不成立     | 删除所有 §8.6 引用，仅保留 §7.x                                                |
| 3   | spec.md L507（§5.1 letter_screen_4）                   | data-models §7.4 / §8.6                                                | §7.4 标题是 letter_screen_5（非 4）；§8.6 不存在 | ❌ 不成立     | §7.4 错位问题仍在；删除 §8.6 引用                                              |
| 4   | spec.md L511（§5.1 注释）                              | `letter_screen_4` 在 §7 和 §8.6 章节归属不一致                         | §8.6 不存在                                      | ❌ 不成立     | 重写：§7.4 标题写 letter_screen_5 但内容是 letter_screen_4 字段；§8.6 已不存在 |
| 5   | spec.md L592（§9.1 依赖）                              | Kingbase `dw_basic_lc` / `dw_dashboard`，schema 待核实                 | 全文无 `dw_dashboard`                            | ❌ 不成立     | 删除 `dw_dashboard` 引用                                                       |
| 6   | spec.md L603（§9.2 上游回填清单）                      | data-models.md §7.1 / §8.6 字段类型 varchar                            | §8.6 不存在                                      | ❌ 不成立     | 删除 §8.6 引用，仅保留 §7.1                                                    |
| 7   | spec.md L618（§10 O-2）                                | §7 vs §8.6 schema 不一致（dw_basic_lc vs dw_dashboard）                | §8.6 不存在，dw_dashboard 不存在                 | ❌ 不成立     | 重写或关闭                                                                     |
| 8   | spec.md L619（§10 O-3）                                | §7.4 章节名称为 letter_screen_5 但内容为 letter_screen_4；与 §8.6 比对 | §7.4 错位问题仍在；§8.6 不存在                   | ⚠️ 部分成立   | 保留 §7.4 错位问题；删除与 §8.6 比对描述                                       |
| 9   | spec.md L620（§10 O-4）                                | §7 标注 varchar，§8.6 几乎一致                                         | §8.6 不存在                                      | ⚠️ 部分成立   | 保留 §7 varchar 问题；删除 §8.6 引用                                           |
| 10  | data-model-extensions.md L18（§1 注释）                | schema 与 §7 / §8.6 不一致问题详见 §5 O-N1                             | §8.6 不存在                                      | ❌ 不成立     | 删除 §8.6 引用                                                                 |
| 11  | data-model-extensions.md L22~L27（§1 实体表）          | 6 张表均标注 design 章节「§7.x / §8.6」                                | §8.6 不存在                                      | ❌ 不成立     | 删除所有 §8.6 引用                                                             |
| 12  | data-model-extensions.md L25（§1 letter_screen_4）     | data-models §7.4（章节归属待核实）                                     | §7.4 标题是 letter_screen_5                      | ⚠️ 仍成立     | 保留                                                                           |
| 13  | data-model-extensions.md L29（§1 注释）                | 双 schema 现状，§5 O-N1 提出 design 回填请求                           | 全文无 dw_dashboard                              | ❌ 不成立     | 删除双 schema 描述                                                             |
| 14  | data-model-extensions.md L71（§2.1 注释）              | `NUM_*` 为 varchar(64)（§7 / §8.6）                                    | §8.6 不存在                                      | ❌ 不成立     | 删除 §8.6 引用                                                                 |
| 15  | data-model-extensions.md L275（§2.6 注释）             | 按 data-models.md §8.6 字段注释实现                                    | §8.6 不存在                                      | ❌ 不成立     | 改为引用 §7.3                                                                  |
| 16  | data-model-extensions.md L292~L294（§3 合并回 design） | `letter_screen_1`~`6`（§7 / §8.6）已登记；不一致详见 §5 O-N1           | §8.6 不存在                                      | ❌ 不成立     | 删除 §8.6 引用                                                                 |
| 17  | data-model-extensions.md L357（§4.4 注释）             | §5 O-N1：data-models.md §8.6 标注为 `dw_dashboard`，需回填统一         | §8.6 不存在                                      | ❌ 不成立     | 删除此注释                                                                     |
| 18  | data-model-extensions.md L373（§4.6 天粒度）           | §7 / §8.6 标注 6 张表均含 `STATS_DATE`                                 | §8.6 不存在                                      | ❌ 不成立     | 删除 §8.6 引用                                                                 |
| 19  | data-model-extensions.md L414~L422（§5 O-N1）          | schema 不一致：§7 dw_basic_lc vs §8.6 dw_dashboard                     | §8.6 不存在                                      | ❌ 不成立     | 重写或关闭                                                                     |
| 20  | data-model-extensions.md L424~L431（§5 O-N2）          | §7.4 章节归属错位，与 §8.6 比对                                        | §7.4 错位仍在；§8.6 不存在                       | ⚠️ 部分成立   | 保留 §7.4 错位问题；删除与 §8.6 比对描述                                       |

### 041 核对结论

**核心问题**：041 与 039/040 完全同构——大量引用 §8.6 和 `dw_dashboard`，但当前 data-models.md 中 §8.6 不存在、dw_dashboard 不存在。

**三类差异**（与 039/040 完全一致）：

1. **§8.6 / dw_dashboard 引用失效**（#1, 2, 3, 4, 5, 6, 7, 10, 11, 13, 14, 15, 16, 17, 18, 19）——共 16 处
2. **§7.4 章节错位问题仍存在**（#8, 12, 20）——共 3 处
3. **§7 字段类型 varchar 问题仍存在**（#9）——1 处

**§10 开放问题**：

- O-2（schema 不一致）：❌ 前提失效（注意 041 的编号是 O-2，不是 O-1）
- O-3（§7.4 错位）：⚠️ 问题仍在，需删除 §8.6 比对
- O-4（字段类型）：⚠️ 问题仍在，需删除 §8.6 引用
- O-1, O-5~O-12：✅ 不受影响

**与 039/040 差异**：041 的 `REG_AUTHORITY IN (1,2)` 双值聚合和对比渲染是业务/前端差异，不影响数据模型引用一致性。041 的开放问题编号与 039/040 不同（

---

## 汇总

### 四份 spec 差异统计

| spec     | 差异总数 | §8.6/dw_dashboard 引用失效  | §7.4 错位问题仍存在 | §7 varchar 问题仍存在 | 不受影响            |
| -------- | -------- | --------------------------- | ------------------- | --------------------- | ------------------- |
| 038      | 14       | 14（全部 `aa_jycy` / §8.7） | 0                   | 0                     | O-1/O-3/O-4/O-7/O-8 |
| 039      | 20       | 15                          | 4                   | 1                     | O-4~O-10            |
| 040      | 20       | 15                          | 4                   | 1                     | O-4~O-10            |
| 041      | 20       | 16                          | 3                   | 1                     | O-1/O-5~O-12        |
| **合计** | **74**   | **60**                      | **11**              | **3**                 | —                   |

### 两类不同性质的问题

**A. 038 独有——`aa_jycy` / §8.7 引用失效**（14 处）

- data-models.md §8.7 不存在，`aa_jycy` 表定义无法核实
- 影响 038 模块6（就业状况）相关内容和 §10 O-2/O-5/O-6
- 需用户决策：补录 §8.7 / 在 spec 内独立定义 / 暂不处理

**B. 039/040/041 共有——§8.6 / `dw_dashboard` 引用失效**（46 处）

- data-models.md §8.6 不存在，`dw_dashboard` schema 不存在
- 影响：spec 和 data-model-extensions.md 中所有「§7 / §8.6」双引用、O-N1 schema 不一致问题
- 修正方向明确：删除所有 §8.6 / dw_dashboard 引用，仅保留 §7；关闭或重写 O-1/O-2（schema 不一致）

**C. 039/040/041 共有——§7.4 错位问题仍存在**（11 处）

- §7.4 标题写 `letter_screen_5` 但内容是 `letter_screen_4` 的字段
- 问题本身成立，但与 §8.6 比对的描述需删除
- 修正方向：保留问题本身，删除 §8.6 比对描述；这是 data-models.md 自身需修复的问题

**D. 039/040/041 共有——§7 字段类型 varchar 问题**（3 处）

- §7 标注 varchar，问题本身成立
- 修正方向：保留问题，删除「§8.6 几乎一致」描述

### 统一修正方案（建议）

**第一步：039/040/041 批量修正（机械性，可并行）**

1. 所有「§7 / §8.6」双引用 → 改为仅「§7」
2. 所有 `dw_dashboard` 引用 → 删除
3. O-N1（schema 不一致）→ 重写为「已关闭：§8.6 已不存在，schema 统一为 `dw_basic_lc`（§1 边界表）」
4. O-N2（§7.4 错位）→ 保留问题本身，删除与 §8.6 比对描述
5. §10 O-1/O-2（schema 不一致）→ 关闭
6. §10 O-2/O-3（§7.4 错位 / varchar）→ 保留，删除 §8.6 引用

**第二步：038 单独处理（需用户决策）**

1. `aa_jycy` / §8.7 引用 → 待用户决策后处理
2. 其余不受影响的开放问题保持不变

**第三步：data-models.md §7.4 错位修复**（L3 提案）

1. §7.4 标题修订为 `letter_screen_4`
2. 原 `letter_screen_5` 内容迁移至正确位置

**注意**：以上修正涉及 L3 文档（docs/specs/ 下），需走 AGENTS.md §10 提案审批流程。
