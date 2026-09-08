# env/rules/ · AI 助手级规则

本目录存放 **skill 可携带的跨项目纪律**（与 `env/AGENTS.md` 项目治理资产区分）。

## 约定

- 命名：`NN-kebab-case.md`（两位数字前缀 + kebab）
- 有可执行正文才建文件；禁止空壳 /「待填写」占位
- **删除任一 rule 后**：必须重排剩余文件为连续序号，并 grep 全 skill 更新引用
- 预置即用 rule 默认启用（`alwaysApply: true`）；不需要时直接删除文件，勿改成 false 留空壳

## 当前文件

| 文件 | 用途 |
| --- | --- |
| `01-link-format.md` | 仓库相对路径纯文本引用 |
| `02-no-hallucination.md` | 反幻觉守则 |
