# task-2026-09-16-001 · src 能力域总览文档

## 元信息

- **Status**：已完成
- **类型**：docs
- **创建日期**：2026-09-16
- **目标产物**：`design/src/能力域总览.md`

## 目标

为 `src/` 主线建一份按「能力域」组织的综合总览：每域一句话职责 + 入口路径 + 状态归属（Redux slice / hox model / 无状态）+ 权威文档指针。只做索引与串联，不复制已有契约文档内容。

## 不做清单

- 不写 packages-next 的能力（src 与 packages-next 相互独立，仅一行带过演进参照）
- 不复写 designer-state / topics 各契约文档的具体内容
- 不补主线 data-fetcher 详细契约（仅在总览标注「无文档」，待独立立项）
- 不改任何源码

## 验收标准

1. 总览覆盖六大能力域（状态 / 渲染 / 物料 / 交互 / 数据 / 壳层），每域含入口路径、状态归属、文档指针
2. hox vs Redux 职责边界有显式说明（本次验证的 5 model 存活事实已沉淀）
3. 文档内链接全部为仓库相对路径（skill 内引用 `oss-visual-designer-project-context/...`）
4. roadmap.md 已追加索引行

## 实施记录

- 2026-09-16：验证 src/hox 5 个 model 全部存活（写入点 + 消费方 grep 确认）；盘点 design/src 既有文档树，确认缺口为「能力域视角总览」；用户批准方案。
