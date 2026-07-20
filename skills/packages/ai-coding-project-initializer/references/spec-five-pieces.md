# 五件套使用指南

> 五件套模板在 [templates/docs/specs/_template/](./templates/docs/specs/_template/)，由 `new-spec.mjs` 复制生成。
> 本文件只放模板里没有的独家内容：反向提问提示词、研发审定关卡。

## 五件套职责一览

| 文件 | 职责 |
|------|------|
| `spec.md` | 特性规格：行为与边界的主叙述 |
| `acceptance-tests.md` | 可对照验收：Gherkin + checklist |
| `data-model-extensions.md` | 本特性数据增量草稿（合并回 `data-models.md`） |
| `plan.md` | 实现计划：里程碑切片、风险、评审检查点 |
| `tasks.md` | 可勾选任务：分组清单，与 plan 切片可追溯 |

**权威顺序（冲突时）：** 本特性 `spec.md` + `acceptance-tests.md` → `docs/design/*` + OpenAPI → 系统级约定 → 编码 skills。

## PM 输入写完后 — 反向提问提示词（先于五件套）★

```text
你是苛刻的产品+研发双审。请只基于我粘贴的《产品经理需求输入》全文（及所述 assets），
列出反向问题，按优先级排序。要求：
1) 覆盖：范围边界、角色权限、主旅程分支、空态/错态、数据口径、验收可测性、非功能、与外部系统边界；
2) 每个问题说明：若不问清楚，实现阶段最可能出现什么错误臆造；
3) 区分：必须本期拍板 / 可挂起为开放问题；
4) 禁止直接写 spec 五件套或代码；禁止编造业务事实——未知就提问。
输出：问题清单 + 建议回写到文档的哪一节。
```

**通过标准：**

- [ ] 至少完成一轮有记录的反向提问（问题与答复可追溯）
- [ ] 阻塞实现的未知已关闭，或写入"开放问题"并指定主责与截止点
- [ ] 产品确认：可以据本文档生成五件套

## 从已冻结的 PM 输入生成五件套 — 提示词

```text
请根据 docs/specs/<编号-短名>/pm-inputs/pm-requirements-input.md（及同目录 assets），
按仓库 docs/specs/_template 在 docs/specs/<编号-短名>/ 生成五件套：
spec.md、plan.md、tasks.md、data-model-extensions.md、acceptance-tests.md。
全局权威引用 docs/design/ 下既有文档与 OpenAPI；
不要编造已存在于 design 的字段定义；未知处写入「开放问题」与 plan 前置条件。
若需新增/变更 API 或表结构，列出必须同步修改的 design 文件清单，先说明再写入草稿。
```

生成后建议再跑**半轮反向提问**（针对五件套与 PM 输入不一致、验收不可测、契约缺口），再研发审定。

## 按五件套实现 — 提示词

```text
请严格依据 docs/specs/<编号-短名>/spec.md 与 acceptance-tests.md 实现。
设计契约以 docs/design（及 OpenAPI）为准。
不要引入文档中未出现的响应字段、菜单或权限码。
「非目标 / 本期不做」禁止实现。
若需变更契约，先说明变更点并更新文档，再改代码。
实现节奏：能测则先写失败用例（红）→ 最小实现（绿）→ 对照验收勾选。
完成后说明：改了哪些文件、如何对照 acceptance-tests 验证。
```

## 研发审定关卡

- [ ] 与冻结的 PM 输入一致，非目标未被加戏
- [ ] `acceptance-tests.md` 每条可观察、可失败
- [ ] 开放问题有主责或已关闭
- [ ] 需改的 design / OpenAPI / 路由已列入 plan 或已改
- [ ] 特性已在 `docs/specs/index.md` 登记
- [ ] research 若有采纳项，已回写 design，而非只躺在 research
