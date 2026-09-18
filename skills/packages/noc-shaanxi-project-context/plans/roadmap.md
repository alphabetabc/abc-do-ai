# 任务计划（plans）

后续任务通过在此目录建立 `task-yyyy-mm-dd-001-xxxx.md` 文件来记录任务内容。

## 命名规则

```
task-<yyyy-mm-dd>-<序号>-<任务名>.md
```

-   `<yyyy-mm-dd>`：任务创建日期
-   `<序号>`：当天内的三位递增序号（001、002、003 …）
-   `<任务名>`：简短任务标识（英文小写，连字符分隔）

示例：`task-2026-09-08-001-merge-skills.md`

## 生命周期

1. 新任务创建在 `plans/` 根目录下，并在下方「任务台账」登记一行（状态置为进行中/待审批）
2. 任务完成后移动到 done/ 归档，台账状态更新为已完成

## 任务台账

> 记录所有已创建任务的状态。任务创建、归档时同步更新本表。

| 日期       | 任务文件                                                     | 主题                                             | 状态   |
| ---------- | ------------------------------------------------------------ | ------------------------------------------------ | ------ |
| 2026-09-08 | plans/done/task-2026-09-08-001-docs-adaptation.md            | 文档体系调整（docs/ 审批机制相关）               | 已完成 |
| 2026-09-08 | plans/done/task-2026-09-08-002-great-tang-spec.md            | 大唐不夜城大屏 spec 五件套（docs/specs/002）     | 已完成 |
| 2026-09-09 | plans/done/task-2026-09-09-001-spec-003-noc-second-hazard.md | NOC 第二屏隐患模块 spec 初始化（docs/specs/003） | 已完成 |
| 2026-09-09 | plans/done/task-2026-09-09-002-spec-003-hazard-drilldown-five-docs.md | spec 003 隐患下钻五件套生成 | 已完成 |
| 2026-09-11 | plans/task-2026-09-11-001-spec-003-hazard-drilldown-modal.md | spec 003 下钻弹窗（M1，mock 先行）；遗留已移交 2026-09-15-001 | 已移交 |
| 2026-09-11 | plans/task-2026-09-11-002-spec-003-hazard-rectify-overall-plan.md | spec 003 整体计划安排分类（M2，mock 先行）；遗留已移交 2026-09-15-001 | 已移交 |
| 2026-09-15 | plans/task-2026-09-15-001-spec-003-hazard-api-integration.md | spec 003 真实接口契约回填与联调（M0 落地，承接 09-11 两 task 全部遗留） | 待审批 |
| 2026-09-17 | plans/done/task-2026-09-17-001-spec-003-hazard-real-sample-replace.md | spec 003 现场真实样例回填（mock 替换 + 请求逻辑反查） | 已完成 |
| 2026-09-18 | plans/done/task-2026-09-18-001-hazard-detail-new-column.md | 隐患模块契约变更（新增列 + indicatorName 透传 + y轴整数刻度 + x轴防重叠 + 详情列配置驱动预埋） | 已完成 |
