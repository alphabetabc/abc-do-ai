# design/ · 设计目录元约定

> **定位**（§3.5 L2）：本 README 是 design/ 的**元文档**，向首次接触 design/ 的读者说明目录约定。
>
> 项目设计正文由 vision / architecture / user-story-map / roadmap 四个全局文件承载。

---

## 总体目的

`design/` 是项目的**意图层** —— 战略愿景、技术架构、用户旅程、季度切片。

## 文件职责

| 文件                | 角色                  | 加载时机            | 行数约束 |
| ------------------- | --------------------- | ------------------- | -------- |
| `vision.md`         | 北极星 + 禁止清单     | 涉及方向决策时      | 不限     |
| `architecture.md`   | 技术栈 + 模块边界     | 涉及技术选型时      | 不限     |
| `user-story-map.md` | 用户旅程（挂载点）    | 涉及需求/UX 决策时  | 不限     |

> 季度目标（roadmap）已移至 `plans/roadmap.md`（计划层）。

## 优先级

`vision > architecture > user-story-map`（roadmap 移至 plans/，不再参与 design/ 优先级链）

## 何时新增全局文件

- 现有四个全局文件无法承载某类长期意图时
- 需走显式 review 决议

## 何时新增业务能力子目录

- 项目模块数 > 5
- 组件/模块设计资料需要隔离
- 模块间存在节奏隔离需求

可选路径（详见 §3.6.2）：

- `components/<component-name>/` —— 按 UI / 前端组件拆分
- `modules/<module-name>/` —— 按业务模块 / 后端服务拆分

两种目录**互斥或共存**均可（项目自行决定）；**不替代**四个全局文件。

## 季度 ROADMAP 与执行切片

- 战略切片：`plans/roadmap.md`（季度目标，≤ 50 行，季度滚动重写）
- 执行切片：`plans/roadmap-<YYYY>-<QN>-<slug>.md`（按需，跨 sprint 的并行计划，必须在 `plans/roadmap.md` 登记）

---

## 当前文件清单

- [x] `vision.md` · 北极星（2026-09-04 init）
- [x] `architecture.md` · 技术架构（2026-09-04 init）
- [x] `user-story-map.md` · 用户旅程（2026-09-04 init）
- [ ] `components/` · （按需）
- [ ] `modules/` · （按需）
