# Task · 2026-11-05-018-ensure-progress-distill

> 蒸馏 `ensure-progress`（gd-emergency + cmd-dispatcher 两版合并）为物料站四件套。规划源：`../research/2026-11-04-business-module-shape.md` 定稿队列 #1。

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-05-018-ensure-progress-distill` |
| Status | 已完成 |
| 类型 | docs + code |
| 影响范围 | `docs/materials/components/business/ensure-progress/`（新增四件套） |
| Roadmap | 阶段 3（业务模块蒸馏） |
| 验收标准 | 四件套齐全且 `pnpm build` 通过；examples 在 `pnpm dev:preview` 渲染正常（背景卡 + 虚线时间轴 + 箭头 + 自动滚至最右、无 console error） |
| 前置依赖 | 无 |

---

## 目标（Goal）

把源项目两个 `ensure-progress` 合并蒸馏为一个物料 `docs/materials/components/business/ensure-progress/`，保留横向滚动进度时间轴的独立 UI 结构，剥离请求/轮询/Box 容器等业务层。

## 源码勘察结论（2026-11-05）

### 两版对比

| 版本 | 文件 | 结构 | 差异 |
| --- | --- | --- | --- |
| cmd-dispatcher | index.tsx + Progress.tsx + Progress.less（8.6KB） | Progress 容器 + ProgressItem（SVG 虚线 + linearGradient + 绿/红态背景图 + 箭头图标） | 数据全 Props（dataSource）；布局 flex/auto 按 8 项切换；SVG line 用 useSize 算 lineWidth |
| gd-emergency | index.tsx + progress-list/ + progress-item/（9.6KB） | ProgressList（请求 + 轮询 + 滚动）+ ProgressItem（img 背景 + 虚线 + 箭头） | 数据来自 API（轮询 300s）；ProgressItem 为纯展示（responseName/Time/Status/Level/Desc/endFlag Props）；滚动逻辑在容器 |

**合并策略**：以 **cmd 版的 Props 驱动形态为物料主体**（dataSource Props 进、无请求），**吸收 gd 版的 ProgressItem Props 接口与滚动语义**（scrollToRight 由容器在 dataSource 变化后触发）。两版 ProgressItem 视觉不同（cmd：SVG 渐变虚线 + 圆点图标双色态；gd：img 背景卡 + 顶部虚线 + 箭头），物料以 cmd 版 SVG 实现为主——**不依赖图片资源**（物料站不分发业务图片），gd 版 img 背景改为 CSS 等价（渐变卡片），箭头图标 SVG 内联。

### 依赖面

- `classnames` → 模板字符串内联（先例）
- `useSize`（@fedx-web-common/react-hooks）→ ResizeObserver 内联（先例：widget-shell）
- `useRequest` / `getViewItemDataApi` / `constants.IMAGE_PATH` / `useEnvironment` / `TIME_RANGE` → **全部剥离**（数据 Props 化）
- `Box` / `DataStatus` → 剥离（属容器层，examples 里用简单容器演示）
- `get` / `isDefined`（@fedx-web-common/utils）→ lodash-es `get`，isDefined 内联一行
- 字体：沿用 less 声明，不分发字体文件

## 功能列表

- F1：manifest.json（name/description/tags/category=`business`）
- F2：spec.md（Props 表：dataSource 项结构（description/timePoint 或 responseName/responseTime 字段需统一）、滚动行为、颜色态说明）
- F3：data-model.md（统一后的数据契约：以 cmd 版 `{description, timePoint}` 为基准，两版字段映射表；滚动/重渲染行为）
- F4：code/（Progress.tsx + ProgressItem.tsx + less；SVG 虚线 + 渐变线内联；零外部依赖除 react/lodash-es）
- F5：examples/（基础静态示例 + dataSource 动态变化触发滚动示例 + >8 项 auto 布局示例）

## 不做清单

- 不搬 Box / DataStatus 容器（examples 用 div 演示）
- 不搬请求 / 轮询 / useEnvironment（数据 Props 化，动态示例用 setInterval 模拟）
- 不分发图片资源（svg/png 背景全部 CSS/SVG 等价重绘）
- 不新增 Props（保持合并后最小接口：dataSource + 可选 lineColor）
- 不做竖向布局（源码仅横向）

## 开放问题（审批时决策）

- **#1 数据字段统一**：cmd 版 `{description, timePoint}` vs gd 版 `{responseName, responseTime, responseStatus, responseLevel, responseDesc, endFlag}`。建议以 cmd 版为基准（description/timePoint + hasEndTime 派生），gd 版字段映射进 data-model.md 的适配说明。若你想保留 gd 版全字段（状态色/等级），告诉我。

---

## 步骤（执行计划）

### 步骤 1：四件套产出

- **动作**：code/（Progress + ProgressItem 合并实现，SVG 内联）→ spec/data-model/manifest → examples（3 个）
- **输出**：`docs/materials/components/business/ensure-progress/`
- **等待用户**：否

### 步骤 2：验证

- **动作**：`pnpm build` → `pnpm dev:preview` 确认虚线/渐变线/双色态/箭头/滚动/布局切换、无 console error
- **等待用户**：否

### 步骤 3：收尾

- **动作**：research 归类表更新（B 档 #1 标完成）；current-sprint 更新；归档本卡
- **等待用户**：是（硬门槛②）

---

## 验收 checklist

- [x] A1：四件套齐全，manifest category=business
- [x] A2：code/ 无 `~/web`、`@fedx-web-common`、图片资源引用；外部依赖为 react / lodash-es / ahooks（项目站点依赖，Grep 复核通过）
- [x] A3：`pnpm build` 通过（tsc -b + vite build，11.13s）
- [x] A4：examples 渲染正常（浏览器实测：虚线、渐变、双色态、>8 项布局切换、滚动至最右、iconSize 三档对齐、无 console error）
- [x] A5：research 归类表队列 #1 标注完成

---

## 审批记录（硬门槛）

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准（开放问题 #1 按卡内建议：cmd 版 `{description, timePoint}` 为基准） | 2026-11-05 | user |
| ② 实现验收 | 已验收（含三轮修正：ahooks 依赖 / 箭头视觉 / iconSize 可配置） | 2026-11-05 | user | |

---

## 进度日志（按需追加）

### 2026-11-05

- 建卡。两版源码精读完成（cmd 8.6KB / gd 9.6KB），合并策略：cmd 版 Props 驱动形态为主体 + gd 版滚动语义，图片资源 CSS/SVG 等价重绘。
- 步骤 1+2 完成：
  - `code/`：Progress.tsx（容器：scrollToRight on dataSource 变化、>8 项 flex/auto 切换、preHasEndTime 派生）+ ProgressItem.tsx（SVG 渐变虚线、圆环图标双色态、内联箭头 SVG、ResizeObserver 内联 useSize）+ index.less（图片背景 CSS 渐变等价：done 绿 / ongoing 红）。gradient id 加 index 后缀避免多实例冲突（源码固定 id 会串色）。
  - spec.md / data-model.md（含 gd 版 responseName/responseTime/... → {description, timePoint} 字段映射与转换示例）/ manifest.json（category=business）/ examples 3 个（basic / dynamic / auto-layout）。
  - `pnpm build` 通过；`pnpm dev:preview` 浏览器实测三个示例：虚线 + 绿/红双色态 + 渐变线 + 12 项横向滚动（scrollWidth 2300 > clientWidth 1522）+ dynamic 节点 3→6 递增，无 console error。
  - loader 对 `components/business/` 层级 glob 兼容确认（`**` 通配，key 取目录名 ensure-progress）。
- 停在硬门槛②前，待用户验收。A5（research 归类表）+ current-sprint 更新 + 归档留待门槛②后执行。
- 验收反馈修正（user）：useSize 改用项目已有依赖 `ahooks`（先例 ui-swiper-react-core），删除内联 ResizeObserver 实现；`pnpm build` 复验通过。依赖约束由「react/lodash-es」放宽为「react/lodash-es/ahooks（项目站点依赖）」。
- 验收反馈修正 2（user）：箭头视觉异常——原实现为「虚线菱形箭镞」（四段折线 + strokeDasharray 4,3），小尺寸下碎成线团不可辨。改为「虚线轴线 + 实心三角箭镞」（line + path Z 填充），浏览器截图复验清晰可辨、颜色语义正确、无 console error，`pnpm build` 复验通过。
- 验收反馈修正 3（user）：圆点图标尺寸支持配置——新增 `iconSize` Props（默认 52），连接线/箭头垂直位置按 `36 + iconSize/2` 自动对齐（less 中箭头 top 移入组件内联样式）；spec.md 补 Props 行；新增 examples/icon-size.tsx（36/52/72 三档对比）。用户截图目检确认对齐正常，`pnpm build` 复验通过。「不新增 Props」约束经用户本次要求解除（dataSource + lineColor + iconSize）。

---

## 关联

> - 规划源：`../research/2026-11-04-business-module-shape.md`（定稿队列 #1）
> - 母任务：`./task-2026-11-03-001-master-component-distill.md`
> - 源码（只读）：oss-visual-gd-emergency-support `web/pages/five-major-center/cmd-dispatcher-center/modules/section-left/ensure-progress/`、`web/pages/gd-emergency-support/modules/section-left/ensure-progress/`
