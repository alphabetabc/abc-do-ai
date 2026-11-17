# Task · 2026-11-16-015-widget-shell-theme

> task-010 派生任务 T4（WidgetShell 主题覆盖入口）。承接 G13。

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-16-015-widget-shell-theme` |
| Status | 已完成 |
| 类型 | 编码（渲染器） |
| 影响范围 | `packages/screen-renderer/`（WidgetShell 样式出口）、相关文档 |
| Roadmap | 阶段 5 · 闭环验证与迭代优化 |
| 验收标准 | 见下方验收 checklist |
| 前置依赖 | task-2026-11-13-010（已批准） |

---

## 目标（Goal）

消除「宿主必须 `.sr-widget-shell.sr-widget-shell` 双类 hack 才能换肤」的问题：WidgetShell 主题（blur40/灰底等）改为 CSS 变量化或提供 schema 级 theme 覆盖入口。Schema 模式是主交付形态，此缺口每个宿主都会踩。

## 不做清单

- 不做完整主题系统（只解决覆盖入口）
- 完成后统一 `pnpm export:skill` 重导出

---

## 步骤（执行计划）

### 步骤 1：技术设计（等待用户确认方案）

- **动作**：二选一或组合——a) WidgetShell 样式全部抽为 CSS 变量 + 变量清单文档；b) schema 顶层 `theme` 字段映射变量。给出推荐写入本卡
- **等待用户**：是（方案确认）

### 步骤 2：实现 + 验证

- **动作**：实现 + show-case 宿主移除双类 hack 改用新入口实测
- **等待用户**：是（硬门槛②）

---

## 技术设计（2026-11-16 定稿）

- **方案**：样式注入时机修复（最小改动）。`--ws-*` CSS 变量化原本已完备（widget-shell/index.tsx 全部视觉项走变量），hack 根因是 `ensureWidgetShellStyle` 用 `appendChild` 把渲染器样式插到 head 末尾（宿主样式之后），同特异性后者胜
- **修复**：改为 `head.insertBefore(style, head.firstChild)`——渲染器样式永远在宿主样式之前，宿主单类选择器同特异性即胜；老宿主的双类写法（更高特异性）仍兼容
- **show-case 配套**：ops-monitor/screen.css 双类 hack 改回单类 + `--ws-blur: 20px` 变量覆盖（原先直接覆盖 backdrop-filter 属性，现走变量更规范）
- **文档**：schema-mode.md 换肤说明与调试注意点 #2 更新（单类即可、注明历史兼容）
- 未选 schema 顶层 theme 字段方案：会引入 schema 结构变更 + 变量字符串契约，收益低于一行注入时机修复

## 验收 checklist

- [x] A1 WidgetShell 视觉参数（背景/模糊/边框等）可经 CSS 变量覆盖，无需双类 hack（渲染器样式注入 head 最前，`insertBefore(firstChild)`）
- [x] A2 变量清单已写入文档（schema-mode.md「换肤」节列出 --ws-background/--ws-blur/--ws-radius/--ws-border/--ws-title-height/--ws-title-font-size/--ws-content-padding 等）
- [x] A3 show-case 换肤 hack 移除后视觉一致：双类 hack 改单类 + `--ws-blur: 20px` 变量；playground 实测注入单类覆盖（--ws-title-height: 80px / 红底）计算样式生效，渲染器 style 标签为 head 首子元素
- [x] A4 `pnpm build:renderer` + `pnpm check:renderer-isolation` 通过（playground build 亦通过）
- [x] `env/AGENTS.md` 声明的质量门槛命令已通过（build:renderer / check:renderer-isolation / playground build）

---

## 变更记录

| 日期 | 变更 | 原因 | 是否重新过硬门槛① |
| --- | --- | --- | --- |
| 2026-11-16 | 初稿 | task-010 步骤 2 批量建卡 | — |
| 2026-11-16 | 方案定为注入时机修复（insertBefore head 最前），不引入 schema theme 字段 | 变量化已完备，根因是注入时机 | 否（范围内方案选择） |

---

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-16 | 用户（批量建卡批准，执行「继续下一个task」） |
| ② 实现验收 | 已验收 | 2026-11-16 | 用户（current-sprint 归档记录「用户验收通过」回填） |

---

## 关联

> - 来源：`./task-2026-11-13-010-show-case-retro-spec-gaps.md`（T4 · G13，坑 #2）
