# Task · 2026-10-09-004-02-scguarantee-panel-style

## 任务元信息

| 项       | 值                                                                                                                                                                                                                                                    |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 编号     | `task-2026-10-09-004-02-scguarantee-panel-style`                                                                                                                                                                                                      |
| Status   | 已完成                                                                                                                                                                                                                                                |
| 类型     | 编码                                                                                                                                                                                                                                                  |
| 影响范围 | `web/pages/shenzhen-communication-guarantee/sub-pages/components/container/`（panel-bg-svg.tsx / panel.less）、`sub-pages/index.tsx`（底部 logo 摆放）、`public/static/images/shenzhen-communication-guarantee/bottom-logo.png`（已就位）             |
| Roadmap  | 2026 年深圳重要通信保障屏建设（PM 素材 2026-10）                                                                                                                                                                                                      |
| 验收标准 | 见下方验收 checklist（A1–A3）                                                                                                                                                                                                                         |
| 前置依赖 | task-003 骨架屏已完成                                                                                                                                                                                                                                 |

---

## 目标（Goal）

按深圳屏设计稿调整模块框（Panel）样式：边框、背景、标题字号/配色/间距等。骨架阶段复制的信管局样式与本屏设计稿存在差异，需在本地 `container/` 一份上调整。**须在 004-03/004-04 组件迁移之前完成**，避免迁移组件按旧框调内边距后返工。

同时补摆页面底部 logo（设计稿「组合 1058」）：图片 `bottom-logo.png`（已在 `public/static/images/shenzhen-communication-guarantee/`），422×134，left 1699 / top 2019。

## 功能列表

- F1：Panel/PanelLeft/PanelRight/NoStylePanel 视觉与设计稿一致
- F2：页面底部 logo 按设计稿坐标摆放

## 不做清单

- 不改 registerWidget 布局坐标/尺寸（骨架已定）
- 不做各 widget 内部内容样式（属 004-03/004-04）

## 验收 checklist

- [x] A1：两屏所有模块框边框、标题样式与设计稿一致，无错位/截断 —— 用户目检通过
- [x] A2：底部 logo（422×134，l1699/t2019）两屏均按设计稿显示
- [x] A3：design 文档回填（lint 用户明确不需要跑）

## 最终落地清单（实现结果）

- `panel-bg-svg.tsx`：两处 `rx="10"` → `rx="20"`（SVG 渐变边框/背景保留不动，对应设计稿 border 渐变色）
- `panel.less`（AI 落地后用户手调微调）：
    - `.scg-animate-panel`：`border-radius: 10px` → `20px`；`backdrop-filter: blur(5px)` → `blur(20px)`
    - `.panel-title`：`font-size: 36px` → `48px`；`line-height` 用户调为 `1.2`（设计稿 36.81px 与 48px 字号矛盾，取 1.2 视觉合理）
    - `.panel-content`：`calc(100% - 46px)` → `calc(100% - 50px)`（用户手调）
- `index.tsx` / `index.less`：`.bottom-logo`（422×134，l1699/t2019，z-index 1000）挂附件层，两屏切换均可见

## 技术设计（阶段二回填，2026-10-09 方案细化）

### 设计稿样式（用户提供）

边框容器：

```css
box-sizing: border-box;
border: 4px solid rgba(255, 255, 255, 1);
border-radius: 20px;
backdrop-filter: blur(20px);
background: radial-gradient(179.89% 137.19% at 98% 2%,
    rgba(120, 209, 255, 0.15) 0%,
    rgba(16, 79, 122, 0.11) 32%);
```

> 设计工具对渐变的"旋转方式不支持"警告仅针对其导出 SVG 等价物，CSS 侧照写即可。

左上角标题：

```css
color: rgba(255, 255, 255, 1);
font-family: "YouSheBiaoTiHei";
font-style: Regular;
font-size: 48px;
font-weight: 400;
line-height: 36.81px;
letter-spacing: 0px;
text-align: left;
```

### 实现方案（最小改动，保留 SVG）

现状 `panel-bg-svg.tsx` 的双 rect 渐变（radial 填充 + linear 渐变描边）对应设计稿的"border 渐变色"，CSS border 做不了渐变描边，**SVG 保留不动**。改动点：

- `panel-bg-svg.tsx`：两处 `rx="10"` → `rx="20"`
- `panel.less`：
    - `.scg-animate-panel`：`border-radius: 10px` → `20px`；`backdrop-filter: blur(5px)` → `blur(20px)`
    - `.panel-title`：`font-size: 36px` → `48px`；`line-height` 按视觉手调
    - `.panel-content`：标题字号变大后重算顶部偏移

## 变更记录

| 日期       | 变更                                                       | 原因                             | 是否重新过硬门槛① |
| ---------- | ---------------------------------------------------------- | -------------------------------- | ----------------- |
| 2026-10-09 | 新建（原 004 未含此项，用户讨论后补入并拆卡）              | 模块框样式差异需先于组件迁移解决 | 是                |
| 2026-10-09 | 追加底部 logo（bottom-logo.png，422×134，l1699/t2019）摆放 | 用户补充设计稿要素               | 否（同范围扩充）  |
| 2026-10-09 | 方案修正：SVG 渐变边框保留（此前一度误判为可纯 CSS 替代）  | SVG linear 渐变描边即设计稿"border 渐变色"，CSS border 做不到 | 否（范围内修正） |
| 2026-10-09 | 标题 line-height 设计稿 36.81px 与 48px 字号矛盾，用户手调为 1.2；panel-content 偏移 46→50px（用户手调） | 目检微调 | 否（范围内修正） |

## 审批记录

| 门槛       | 状态   | 日期       | 批准人 |
| ---------- | ------ | ---------- | ------ |
| ① 需求审批 | 已批准 | 2026-10-09 | 用户   |
| ② 实现验收 | 已通过 | 2026-10-09 | 用户   |

---

## 关联

> - 原卡：task-2026-10-09-004-shenzhen-communication-guarantee-migrate（已拆分删除）
> - 前置：004-01（接口层，已完成归档）；后续：004-03（首屏组件）、004-04（区域屏组件）
> - 设计文档：`design/modules/shenzhen-communication-guarantee/`
