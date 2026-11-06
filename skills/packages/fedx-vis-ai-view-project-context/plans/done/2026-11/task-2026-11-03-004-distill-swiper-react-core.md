# Task · 2026-11-03-004-distill-swiper-react-core

> 蒸馏 `web/components/ui/swiper-react-core` → `docs/materials/components/ui/ui-swiper-react-core/` 四件套。执行方式：按 `docs/materials/_templates/prompts.md` 提示词 2.2（生成）+ 2.3（校验），本卡只记录组件特有决策。

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-03-004-distill-swiper-react-core` |
| Status | 已完成（2026-11-03 归档） |
| 类型 | docs + code |
| 影响范围 | `docs/materials/components/ui/ui-swiper-react-core/`（新增模块）、`current-sprint.md` |
| Roadmap | 阶段 4（分模块文档化与代码蒸馏） |
| 验收标准 | 四件套齐全、example 可运行（autoplay 可观察）、无源项目内部路径依赖 |
| 前置依赖 | 无（样板 task-003 已归档） |

---

## 目标（Goal）

把源项目 `web/components/ui/swiper-react-core` 蒸馏为自包含物料模块（category：`layout`，deps：`swiper`）。

## 组件特有决策（模板之外的增量信息）

- **性质**：swiper 官方 `swiper/react` 绑定的本地实现（源项目锁定 swiper 11.2.10），非业务组件。动机：锁版本 + 内置 less 样式
- **蒸馏策略**：整体搬运 + 剥离外部依赖，**不重构**（与上游 diff 最小化才有维护价值；这一点覆盖模板「去业务耦合/mock 注入化」的默认策略）
- **剥离**：唯一内部依赖 `@fedx-web-common/react-hooks` 的 `useIsomorphicLayoutEffect` → 改用 **ahooks**（用户决策 2026-11-03；站点 package.json 增 ahooks，manifest.deps 声明）
- **npm 依赖**：`swiper` + `ahooks`（manifest.deps 声明）—— 已获用户批准（2026-11-03），模板提示词 2.2 已同步修订
- **文件清单**（14 文件 + less-modules.d.ts）：index / swiper / swiper-slide / context / get-children / virtual / types + shared/{params-list, get-params, get-changed-params, mount-swiper, update-swiper, update-on-virtual-data, utils}
- **使用方参考**：`carousel-view/swiper-carousel`（两个 center）——example 模拟大屏轮播（autoplay + loop + 分页指示）
- spec.md 须写明：与官方包差异、模块注册（v11 需显式 `modules`）、样式按需引入、升级策略

## 不做清单

- 不升级 swiper 版本、不重构 fork 代码
- 不蒸馏使用方 `swiper-carousel`（独立台账条目）
- 首版 1 个 basic example（autoplay）

## 步骤

1. ✅ 按提示词 2.2 执行：14 文件搬运（保留 shared/ 子目录结构）+ 剥离 `@fedx-web-common/react-hooks`（内置 `isomorphic-layout-effect.ts`，swiper.tsx / swiper-slide.tsx 2 处引用改本地）
2. ✅ 四件套：manifest（category=layout, deps=swiper）/ spec / data-model / examples/basic（模拟大屏 carousel，autoplay+loop+pagination+命令式 prev/next）
3. ✅ 站点 install `swiper`（初版误装 6.8.4；**用户纠正后对齐源项目 11.2.10**，见变更记录 1）
4. ✅ 类型验证：`npx tsc --noEmit` 通过。为过检做了 3 处最小改动（fork 策略内的机械修正，非重构）：
   - `swiper.tsx`：`_containerClasses(swiper…)` 未用参数改 `_swiper`
   - `types.ts`：`SlideData` re-export 加 `type` 关键字（isolatedModules 要求）
   - 语义零变更
5. ✅ 全局样式处理（用户报告：页面滚动条异常）：根因是 `code/swiper.tsx` 的样式 import 经 example 懒加载注入全站。**用户决策（2026-11-03）：样式保留在 code/ 内 —— 与源码零 diff**。首次处置（移到 example）已回滚
6. ✅ **变更记录 1 · 版本纠正（2026-11-03，用户发现两侧 slide 溢出）**：初版装了 swiper 6.8.4，系 AI 未核对源项目 package.json 凭印象所选（反幻觉违规，已纠正）。实际源项目锁定 **11.2.10**，已对齐。连带修复：
   - less 路径：`swiper/swiper.less`（v6 深路径）→ `swiper/less`（v11 exports 合法路径；源项目构建链不严格走 exports，Vite 必须）；example 按需补 `swiper/less/pagination`
   - 新增 `code/less-modules.d.ts`（swiper 11 less 入口无类型声明，补 side-effect import 声明 TS2882）
   - example 补 `modules={[Autoplay, Pagination]}`（v11 要求显式注册模块，否则 pagination 不生成圆点）；spec 使用示例同步
   - spec / manifest 版本表述全部纠正为 v11 / 11.2.10
7. ✅ ahooks 替换（用户决策）：swiper.tsx / swiper-slide.tsx 改 `import { useIsomorphicLayoutEffect } from 'ahooks'`，删除本地 `isomorphic-layout-effect.ts`，manifest.deps 增 ahooks
8. ✅ 浏览器验证（agent 实测）：单 slide 可见 + `.swiper` overflow=hidden + pagination 4 圆点 + autoplay 自动切换，全部 PASS；`npx tsc --noEmit` 通过
9. 用户验收（硬门槛②）

## 验收 checklist

- [x] A1：四件套齐全，category=`layout`，manifest.deps 声明 `swiper` + `ahooks`
- [x] A2：无 `~/`、`@fedx-*` 内部路径依赖（grep 验证）
- [x] A3：example 自带 mock，autoplay 轮播可观察
- [x] A4：spec.md 写明 fork 来源与升级策略
- [x] A5：提示词 2.3 校验通过（一致性表无「不一致」项）—— tsc 已过（2026-11-03 归档前复验），浏览器实测 PASS（步骤 8）
- [x] A6：用户验收通过（2026-11-03，用户确认完成并批准归档）

## 审批记录（硬门槛）

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-03 | 用户（npm 依赖放行 + 流程走模板） |
| ② 实现验收 | 已通过 | 2026-11-03 | 用户（确认完成并批准归档） |

## 关联

> - 台账：`./task-2026-11-03-002-component-inventory.md`
> - 样板：`./task-2026-11-03-003-distill-iframe-loader.md`
> - 模板：`docs/materials/_templates/prompts.md`
> - 源码：`web/components/ui/swiper-react-core`（oss-visual-gd-emergency-support）
