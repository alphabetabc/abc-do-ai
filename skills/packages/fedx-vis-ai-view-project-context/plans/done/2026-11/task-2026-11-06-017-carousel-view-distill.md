# Task · 2026-11-06-017-carousel-view-distill

> CarouselView 轮播视图 蒸馏为物料站四件套。tier=C（定档记录：research/materials.db module_survey #1（cmd-dispatcher 版）+ #10（comprehensive 版），distill_status=queued）。台账母任务：./task-2026-11-03-002-component-inventory.md

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-06-017-carousel-view-distill` |
| Status | 已完成 |
| 类型 | docs |
| 影响范围 | `docs/materials/components/business/carousel-view/`（新增四件套）、台账「二」备注列回填 |
| Roadmap | 阶段 3（业务模块蒸馏） |
| 验收标准 | 四件套齐全、category=business、`pnpm build` 通过、examples 在 dev:preview 可渲染且无 console error |
| 前置依赖 | research 定档结论；多版本源码均已勘察 |

---

## 目标（Goal）

把源模块 CarouselView 轮播视图 蒸馏为物料站模块 `docs/materials/components/business/carousel-view/`（零外部新依赖、不跨模块 import、业务数据 mock 化）。

## 源码位置
  - `web/pages/five-major-center/cmd-dispatcher-center/modules/center/carousel-view`
  - `web/pages/five-major-center/comprehensive-display-center/modules/center/carousel-view`
- ⚠️ 备注：跨中心多版本合并蒸馏：cmd-dispatcher-center 与 comprehensive-display-center 两版相似度 0.96，版本差异走 Props/examples
## 功能列表

- F1：manifest.json（category=business）
- F2：spec.md（Props 表 + 交互说明）
- F3：data-model.md（类型 + 数据契约 + mock 数据结构）
- F4：code/（源码蒸馏；@fedx-web-common 工具内联或改用 lodash-es；请求层 mock 化）
- F5：examples/（≥2 个：基础 + 数据动态变化）

## 不做清单

- 不新增 npm 依赖（echarts/antd 等物料站已有除外，逐项核对）
- 不跨模块 import（含已有 ui/rc-echarts 物料）
- 不搬真实接口地址与密钥类内容
- 不分发字体/图片二进制（CSS 声明可保留）

---

## 步骤（执行计划）

### 步骤 1：源码精读 + 四件套产出
- **输出**：`docs/materials/components/business/carousel-view/`
- **等待用户**：否

### 步骤 2：验证
- **动作**：`pnpm build` + `pnpm dev:preview` 渲染验证（无 console error）
- **等待用户**：否

### 步骤 3：回填与归档
- **动作**：台账「二」备注回填；更新 current-sprint；归档本卡
- **等待用户**：是（硬门槛②）

---

## 验收 checklist

- [x] A1：四件套齐全，manifest category=business
- [x] A2：code/ 可直接 import，无未声明依赖（1 处受控跨模块引用 ui-swiper-react-core，见变更记录）
- [x] A3：`pnpm build` 通过（tsc -b + vite build，2026-11-06）
- [x] A4：examples 渲染正常，无 console error（dev:preview 浏览器验证 PASS，basic/dynamic 两示例 + 动态切换均正常）
- [x] A5：台账「二」对应条目备注已更新（cmd-dispatcher / comprehensive-display 两行）

---

## 审批记录（硬门槛）

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-06 | user |
| ② 实现验收 | 已通过 | 2026-11-06 | user |

---

## 进度日志（按需追加）

### 2026-11-06

- 建卡（脚本批量生成，依据 research 定档 C 档）。
- 实现完成：四件套产出，`pnpm build` 通过，dev:preview 渲染验证 PASS。

### 变更记录

- **2026-11-06 · 范围调整（用户批准）**：不做清单原约定「不跨模块 import（含已有 ui/rc-echarts 物料）」。实现中发现 swiper-carousel 若内联 ui-swiper-react-core 需拷贝 ~15 个文件、复制体量超过宿主物料本身，且 column-3d 内联 digital-flop 已暴露同类问题。经用户批准改为**受控引用**：允许 ui / rc-echarts 底层物料 → business 物料单向引用；business 之间与任何物料 → src/ 仍禁止；引用方须在 spec.md / data-model.md 声明依赖物料清单。本卡 swiper-carousel.tsx 改为引用 `docs/materials/components/ui/ui-swiper-react-core/code`。**规则固化（AGENTS.md + distill-workflow 修订）另行立项。**
- **2026-11-06 · 验收后缺陷修复（用户反馈 examples 渲染不对）**：① examples 把完整外链 URL 塞进 `thumbImage` 且 `imagePath` 为默认 `''`，源码忠实的 `` `${imagePath}/${thumbImage}` `` 拼接产出 `/https://…` 失效地址 → 图片全灰。code/ 增加直通规则（`http(s)/data/blob` 开头的完整地址直接作 src，相对路径仍拼前缀，Props 面不变），spec.md / data-model.md 契约同步回填。② examples 的 `scale(0.46) translate(-54.3%…)` 魔法数把内容推出容器（dots 只剩 2 个、卡片裁切）→ 改为单一 `scale` + `transformOrigin: 0 0`。③ mock 图改自包含 SVG data-uri（原 trae-api 外链违反「examples 不依赖外部服务」且可离线失效）；basic 标题与 `interval` 不一致已对齐。验证：`pnpm build` 通过，dev:preview 浏览器实测 basic（5 dots + 图可见）与 dynamic（3 项 ⇄ 1 项切换）均 PASS，console 无 error。

---

## 关联

> - 台账母任务：./task-2026-11-03-002-component-inventory.md
> - 定档记录：research/materials.db（module_survey #1（cmd-dispatcher 版）+ #10（comprehensive 版），distill_status=queued，人工审定档与理由见 reason 列）
