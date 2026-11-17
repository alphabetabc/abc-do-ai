# Task · 2026-11-16-014-renderer-data-url

> task-010 派生任务 T3（渲染器 `data.url` 实现 · 主路径优先）。承接 G12。

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-16-014-renderer-data-url` |
| Status | 已完成 |
| 类型 | 编码（渲染器） |
| 影响范围 | `packages/screen-renderer/`（数据装配逻辑）、`docs/workflows/schema-mode.md`（文档修正）、skeleton/playground vendors（build:renderer 自动同步） |
| Roadmap | 阶段 5 · 闭环验证与迭代优化 |
| 验收标准 | 见下方验收 checklist |
| 前置依赖 | task-2026-11-13-010（已批准，G12 决策：实现而非删文档） |

---

## 目标（Goal）

让渲染器支持 schema `data.url` 远端拉数（Schema 模式主交付形态下真实数据接入的唯一通道），并同步修正 schema-mode.md，消除「文档写 url、实现不支持」的文档级幻觉源。

## 不做清单

- 不实现轮询 / WebSocket 等高级数据策略（只做一次性 fetch 注入 props）
- 不处理鉴权 / 跨域代理等宿主环境问题（文档写明约定即可）
- 完成后统一 `pnpm export:skill` 重导出（task-010 收尾统一执行）

---

## 步骤（执行计划）

### 步骤 1：技术设计（等待用户确认方案）

- **动作**：在 packages/screen-renderer 设计 data.url 装配点（fetch 时序、失败态表现、与内嵌 props 的合并优先级）；写入本卡技术设计块
- **等待用户**：是（方案确认）

### 步骤 2：实现 + 文档修正

- **动作**：实现 url 拉数；schema-mode.md 修正：data.url 契约 + 调试注意点（浏览器缓存坑 #4、换肤坑 #2、尺寸坑 #3 说明一并补入）
- **输出**：`pnpm build:renderer` 产物同步两 vendors
- **等待用户**：否

### 步骤 3：端到端验证

- **动作**：playground 或 show-case 用一个 section 走 data.url 实测（可用被 task-011 保留决策的 mock JSON 作为数据源）
- **等待用户**：是（硬门槛②）

---

## 技术设计

> 复核结论（2026-11-16 步骤 1）：`packages/screen-renderer/src/renderer/use-section-data.ts` **已实现** url 拉数（G12 登记后已落地），SectionFrame 已有 loading/error 兜底。本卡剩余工作 = 文档对齐 + 端到端实测，无渲染器代码改动。

- **装配点**：`SectionItem`（renderer/section-item.tsx）→ `useSectionData(section)` hook
- **fetch 时序**：section 挂载 / `data.url` / `pick` 变更时发起一次性 fetch（`AbortController`，卸载或声明变更即中断）；不轮询、不支持 WS
- **取数**：`res.json()` 后按 `data.pick`（`'a.b.c'` 点路径）取子路径；非 2xx 抛 `HTTP <status>`
- **合并优先级**（低 → 高）：静态 `props` → `data`（inline / url 拉取结果；纯对象展开合并，数组/原始值作为 prop `data` 下发）→ `subscribe` 订阅字段 → events 回调 → 保留 prop `__scale`
- **失败态**：loading 渲染 `[id] 加载中…` 占位；error 渲染 `[id] 数据异常：<message>` 红字占位（不白屏）；物料渲染错误由 SectionFrame 内 ErrorBoundary 兜底
- **宿主约定**（写入 schema-mode.md）：无鉴权（需鉴权接口由宿主代理层处理）；跨域需宿主侧解决；URL 指向宿主 `public/` 下静态 JSON 或同源接口
- **文档修正**：schema-mode.md 补 data.url 契约细节 + 调试注意点（浏览器缓存强刷 / 换肤双类选择器 / 壳内容区尺寸计算）

## 验收 checklist

- [x] A1 渲染器 IIFE bundle 内含 url 拉取逻辑，schema 声明 `data.url` 的 section 数据正确注入 props（源码 `use-section-data.ts` 已实现，本次 build:renderer 重出产物并同步两 vendors）
- [x] A2 拉取失败表现已定义且不白屏（SectionFrame：loading `[id] 加载中…` / error `[id] 数据异常：<msg>` 红字占位 + ErrorBoundary 隔离，已写入文档）
- [x] A3 schema-mode.md 与实现一致（新增「section 数据声明详细契约」（url/pick/合并优先级/失败态/宿主约定）+「调试注意点」三条（缓存 / 换肤双类 / 内容区尺寸，数值已对齐渲染器实际 CSS 变量默认值 title-height 44、content-padding 12px 16px），换肤示例改双类选择器）
- [x] A4 `pnpm build:renderer` + `pnpm check:renderer-isolation` 通过（playground build 亦通过）
- [x] A5 端到端实测一条 url 数据链路成功（playground home.schema gauge section 改 `data.url: /mock/gauge.json, pick: gaugeValue`，新增 mock 文件；浏览器实测 GET 200、`<Gauge data={0.86}>` 注入、仪表弧绘制 ~86%、console 无 error）
- [x] `env/AGENTS.md` 声明的质量门槛命令已通过（build:renderer / check:renderer-isolation / playground build）

---

## 变更记录

| 日期 | 变更 | 原因 | 是否重新过硬门槛① |
| --- | --- | --- | --- |
| 2026-11-16 | 初稿 | task-010 步骤 2 批量建卡 | — |
| 2026-11-16 | 复核发现 url 拉数已在渲染器源码实现（G12 登记后落地），任务范围收敛为文档对齐 + 实测；playground home.schema gauge section 作为 url 链路演示保留（新增 /mock/gauge.json） | 避免重复实现；A5 实测即改动 | 否（范围缩小不扩大） |

---

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-16 | 用户（「继续下一个task」指示） |
| ② 实现验收 | 已验收 | 2026-11-16 | 用户（current-sprint 归档记录「用户验收通过」回填） |

---

## 关联

> - 来源：`./task-2026-11-13-010-show-case-retro-spec-gaps.md`（T3 · G12，坑 #4/#5）
