---
description: 仓库内文档引用链接目标必须用「仓库相对路径」（以 Git 仓库根为起点），禁止 file:/// / 系统绝对路径 / ../ 爬层级相对路径。
alwaysApply: true
---

# 01 · 链接格式规范（AI 助手级 · 跨项目默认启用）

> **策略**：`alwaysApply: true` —— 凡部署本 rule 的项目，引用格式**始终**按本节执行。不需要本约束时删除本文件即可（勿改为 false 后留空壳）。

---

## 推荐形式：仓库相对路径

以 Git 仓库根为起点的路径，可带 `#L<行号>` 锚点。允许两种写法：

```markdown
<!-- 写法一：markdown link（渲染可点击） -->

[文件名](path/to/file.md) [文件名](path/to/file.md#L42)

<!-- 写法二：纯文本（不需要可点击时） -->

<path/to/file.md> <path/to/file.md#L42>
```

**写作示例**：

- 例 1：见 [view/plugin.ts](packages-next/designer-plugins/src/view/plugin.ts)
- 例 2：参见 `<path/to/safety-rule>.md`（项目安全规则）

**特点**：

- 路径一律从仓库根写起（如 `packages-next/designer-plugins/src/index.ts`），跨机器一致、可 grep 检索
- 不依赖当前文件所在位置，文件移动到任意目录链接目标不变
- markdown link 与纯文本均可；选哪种取决于是否需要可点击

---

## 禁止的形式

| 形式 | 示例 | 原因 |
| --- | --- | --- |
| `file:///` 绝对路径 | `[x.md](file:///e:/repo-name/docs/x.md)` | 绑 IDE / 绑机器，跨环境失效 |
| 系统绝对路径 | `C:\Users\xxx\repo\docs\x.md` | 同上 |
| `../` 爬层级相对路径 | `[x.md](../../design/x.md)` `[x.md](./spec.md)` `[源码](../../../../packages-next/a.ts)` | 渲染依赖文件当前位置，文档/文件移动即失效；层级噪音大 |
| 不带仓库前缀的纯文本路径 | `./spec.md` / `../spec.md` / `x.md` | 不便检索、易混淆 |

> 注意：**不是禁止可点击链接**，是禁止链接目标用 `../` 爬层级的写法——统一改为从仓库根写起。

---

## 与其他约定的关系

- 本规则只管「**怎么写引用**」（格式），不管「**能引用什么**」（范围）
- 文件引用范围由 `env/AGENTS.md` 路径约定与 Do-Not 决定

---

## 校验提示

新建 / 修改文档时，可搜索：

- `file://`
- `C:\\` 或 `c%3A` 或 `/Users/`
- `](../` 或 `](./`（`../` 爬层级链接目标）

若命中：

- `file://` / 系统绝对路径 → 改为仓库相对路径
- `](../` / `](./` → 链接目标改为从仓库根写起的路径（保留 markdown link 形式即可）

---

## 项目方定制

- **关闭本规则**：删除本文件并重新确认 IDE rules 目录中无残留 symlink
- **更严**：把仓库相对路径升级为唯一允许形式，并接入 CI
- **更松**：仅禁止 `file:///` 与系统绝对路径（改正文后仍保持 `alwaysApply: true`，或整文件删除）
