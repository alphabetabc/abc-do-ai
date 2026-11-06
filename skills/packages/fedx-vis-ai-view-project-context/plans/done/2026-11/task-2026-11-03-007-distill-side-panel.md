# Task · 2026-11-03-007-distill-side-panel

> 基于 `web/components/ui/side-panel` **重构**（非蒸馏）为通用部件壳框架 → `docs/materials/components/ui/ui-widget-shell/` 四件套。本卡记录重构决策（2026-11-03 用户变更：由「忠实蒸馏」改为「配置化框架」，模块更名 widget-shell）。

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-03-007-distill-side-panel` |
| Status | 已完成 |
| 类型 | docs + code |
| 影响范围 | `docs/materials/components/ui/ui-widget-shell/`（新增模块）、`current-sprint.md` |
| Roadmap | 阶段 4（分模块文档化与代码蒸馏） |
| 验收标准 | 四件套齐全、example 可运行（含皮肤演示）、无源项目内部路径依赖 |
| 前置依赖 | 无 |

---

## 目标（Goal）

把 `side-panel`（容器 → title / extra & content 框架）重构为**纯净、可配置的部件壳框架**，物料模块名 `widget-shell`（category：`layout`，deps：无）。命名理由：本质是给任意 widget 套的「壳」（标题栏 + 内容区 + 可换主题），「panel」语义过窄且与台账既有 panel 组件混淆。

## 策略变更记录

- 原（2026-11-03 早）：蒸馏策略，整体搬运 3 文件 + 保留大屏皮肤，deps=classnames
- 变更（2026-11-03，用户决策）：**重构** —— 纯净框架不带皮肤，`PanelItemContainer` 不保留；大屏科技感皮肤移到 example 中演示
- 动机：side-panel 本质是「容器 → title / extra & content」布局框架，皮肤属主题层，不应内置

## 框架设计（用户已确认的配置面）

- **保留插槽**：title / extra（ReactNode）+ children（内容区）
- **标题可隐藏**：`showTitle?: boolean`（默认 true）——为 false 时不渲染标题栏，content 撑满整个容器（高度 100%）；title 未传时同样隐藏
- **默认样式（用户决策 2026-11-03）**：采用五大中心 `share/box`（Box 组件）的灰色效果作为默认主题 —— 纯 CSS 无图片：容器 `rgba(67,70,82,0.7)` + blur(40px) + 圆角 8px；标题栏高 44px、白字 700、底色 `rgba(255,255,255,0.05)`、下边框 `rgba(255,255,255,0.2)`。默认值全部通过 CSS 变量暴露，可覆盖回纯净无样式
- **样式可定制**：className / style / titleClassName / titleStyle / contentClassName 透传 + **CSS 变量**（`--panel-*` 系列覆盖背景 / 圆角 / 模糊 / 标题栏高度 / 内边距等）
- **移除**：`PanelItemContainer`、`side-panel-*.png` 背景图依赖、YouSheBiaoTiHei 字体依赖
- **deps**：无 npm 依赖（classname 拼接用模板字符串，不引 classnames）

## Example 计划

- `basic.tsx`：默认灰色主题（Box 风格）用法（title + extra + children）
- `no-title.tsx`：隐藏标题栏，content 撑满容器
- `tech-skin.tsx`：用 CSS 变量覆盖默认主题，复刻 side-panel 的大屏科技感皮肤（深蓝底 + 渐变描边；背景图用 CSS 渐变模拟），展示主题替换能力

## 不做清单

- 不做条目列表 / renderItem 模式（用户明确不要）
- 不内置任何主题皮肤
- 不迁移源码 less 中的图片 / 字体资产

## 步骤

1. ✅ 产出 `widget-shell` 模块四件套：manifest（category=layout, deps=[]）/ spec（含 Props 表 + `--ws-*` 变量表）/ data-model（Props 类型 + DOM 契约 + hasTitle 派生逻辑）/ code（WidgetShell.tsx + WidgetShell.css + css-modules.d.ts）/ examples（basic / no-title / tech-skin）
2. ✅ 类型验证：`npx tsc --noEmit` 通过
3. ✅ 浏览器验证（agent 实测）：索引列出 widget-shell；basic 灰色毛玻璃 + 44px 标题栏、no-title 无标题栏内容撑满、tech-skin 深蓝青边框主题覆盖，全部 PASS；控制台无相关报错
4. ✅ 增量需求（用户 2026-11-03）：`borderGradient` 渐变描边 —— SVG linearGradient + rect（useId 唯一 id、rx/stroke-width 走 `--ws-radius`/`--ws-border-width`、`pointer-events:none`、开启时关闭 CSS 边框防双描边；rx 不能用 SVG 属性写 var()，须走 CSS rx 属性）。tsc 通过；浏览器实测渐变描边贴合面板边缘、渐变方向正确、basic 无多余 SVG，PASS
5. 用户验收（硬门槛②）

## 验收 checklist

- [x] A1：四件套齐全，category=`layout`，deps 为空
- [x] A2：无 `~/`、`@fedx-*` 内部路径依赖；code/ 无图片 / 字体资产
- [x] A3：basic example 框架结构可观察；tech-skin example 皮肤可观察
- [x] A4：spec.md 写明 CSS 变量表与「框架 / 主题分离」定位
- [x] A5：提示词 2.3 校验通过（tsc + 浏览器实测；一致性表人工项待用户）
- [x] A6：用户验收通过（2026-11-03，「这个task 到此为止」）

## 审批记录（硬门槛）

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-03 | 用户（「执行task007」） |
| ② 实现验收 | 已通过 | 2026-11-03 | 用户（含增量需求：borderGradient 渐变描边 + 方向、圆角同步修复、视觉对比度调整） |

## 关联

> - 台账：`./task-2026-11-03-002-component-inventory.md`
> - 样板：`./task-2026-11-03-003-distill-iframe-loader.md`
> - 模板：`docs/materials/_templates/prompts.md`
> - 源码：`web/components/ui/side-panel`（oss-visual-gd-emergency-support）
