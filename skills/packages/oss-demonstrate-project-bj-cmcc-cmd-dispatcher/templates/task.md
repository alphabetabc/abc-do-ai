# Task NNN — <一句话标题>

> **前置**：<前置 task 路径，无则写「无」>
> **关联文档**：
> - 路线图：[../plans/roadmap.md](../plans/roadmap.md)
> - 设计稿：[../design/001-pm-output.md](../design/001-pm-output.md)
> - 需求输入：[../design/000-pm-input-spec.md](../design/000-pm-input-spec.md) / [../design/000-pm-input-meeting.md](../design/000-pm-input-meeting.md)（按需引用）
> - 前端规范：[../design/003-frontend.md](../design/003-frontend.md)
> - 当前状态：[../status/current.md](../status/current.md)
> - 自检清单：[../status/checklist.md](../status/checklist.md)
>
> **日期**：YYYY-MM-DD
> **状态**：待 review / 进行中 / 已完成 / 已废弃

---

## 一、目标 【必选】

1-3 句话说清要解决什么问题、达成什么结果。引用 `roadmap.md` 中对应的 T 编号。

## 二、背景 / 现状盘点 【必选】

引用 `status/current.md` 的关键现状（已落地 / 缺口），说明本 task 处于什么阶段、为什么需要做。

## 三、落地方案 【必选】

分小节描述，包含但不限于：
- 目录结构（如新增 / 修改哪些目录与文件）
- 关键代码 / 类型 / 接口（含 TS 片段或简明伪码）
- 设计稿坐标（如有 UI 模块）
- 数据 / Mock 来源
- 性能 / 兼容性考量

## 四、不在本次范围 【必选】

明确推到后续 task 的事项，用 ❌ 列出，避免 scope 蔓延。

## 五、验收标准 【必选】

编号 1-N 条，每条可被机器或人工逐项核对。例如：

1. 页面 `/bj-cmcc-cmd-dispatcher` 可正常打开，无运行时报错
2. `modules/<name>/` 下新增 N 个文件：...
3. `currentLevel` 枚举调整为 N 个值，TS 编译通过

## 六、文档同步要求 【必选】

| 触发动作 | 必须更新 |
|---|---|
| ... | `status/current.md` + `design/003-frontend.md` |
| ... | `status/checklist.md` |
| ... | `roadmap.md`（看板勾选） |

## 七、看板 【必选】

- [ ] 子任务 1
- [ ] 子任务 2
- [ ] ...
- [ ] 同步 `status/current.md`
- [ ] 同步 `design/003-frontend.md`（如有）
- [ ] 按 `status/checklist.md` 自检

## 八、收口：反哺 design 【可选】

仅当本 task 产出了本该由 PM / 设计输出但未交付的内容时填写。说明：
- 回填目标文档（`design/001-pm-output.md` / `003-frontend.md` / ...）
- 回填内容来源（本 task §X）
- 触发条件（必须 §五 验收全部通过）
- 回填 checklist

## 九、PM 待澄清 【可选】

列出阻塞 / 不阻塞当前 task 的 PM 澄清项。已回复的注明「已回复，详见 `001-pm-output.md` §Y」；未回复的注明分流到哪个 task。

## 十、实施记录 【可选】

本 task 完成后回填，含：
- 实际落点清单（最终目录 / 文件）
- 关键决策偏差（原计划 vs 实际）
- TS / 构建验证结果
- 已知未达成的验收项（如有）
- 项目其余 scope 外的已知问题

---

## 文档元信息

> **日期**：YYYY-MM-DD
> **状态**：待 review / 进行中 / 已完成 / 已废弃