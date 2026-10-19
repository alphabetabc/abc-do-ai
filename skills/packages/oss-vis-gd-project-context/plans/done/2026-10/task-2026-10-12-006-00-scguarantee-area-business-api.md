# Task · 2026-10-12-006-00-scguarantee-area-business-api

## 任务元信息

| 项       | 值                                                                                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 编号     | `task-2026-10-12-006-00-scguarantee-area-business-api`                                                                                                             |
| Status   | 已完成（2026-10-12 验收通过）                                                                                                                                     |
| 类型     | 编码                                                                                                                                                               |
| 影响范围 | `web/services/shenzhen-communication-guarantee/home/section-right.ts`、`web/pages/shenzhen-communication-guarantee/sub-pages/home/modules/area-business/index.tsx` |
| Roadmap  | 深圳保障屏 phase 2（004 迁移，重保区域业务接数）                                                                                                                   |
| 验收标准 | 首屏「重保区域业务」面板从接口/mock 拉数渲染，静态 MOCK_DATA 删除，空数据有兜底                                                                                    |
| 前置依赖 | 004-00（二-2 接口已定稿 2026-10-12）；mock 已建                                                                                                                    |

---

## 目标（Goal）

首屏「重保区域业务」面板（原静态占位 MOCK_DATA）接入已定稿的 `key-guarantee-area-business` 接口：接口层落码 `home/section-right.ts`，widget 从接口拉数并渲染，UI 不动。

---

## 步骤（执行计划）

### 步骤 1：接口层落码

- **动作**：`home/section-right.ts` 新增 `getKeyGuaranteeAreaBusinessApi`——`getViewItemDataApi`（baseUrlType `sceneViewService`），viewPageId 暂用 `shenzhen-home-view`（占位，004-00 已记），viewItemId `key-guarantee-area-business`，localMockUrl `/static/mock/shenzhen-communication-guarantee/key-guarantee-area-business.json`，fallback 走 `viewItemDataFallbackApi`（key `shenzhen-home-view-key-guarantee-area-business`）
- **输出**：接口函数 + 类型定义
- **状态**：✅ 完成（2026-10-12）
- **等待用户**：否

### 步骤 2：widget 接数与渲染

- **动作**：`area-business/index.tsx` 删除 `MOCK_DATA`，调用新接口渲染
- **输出**：面板真实渲染接口数据
- **状态**：✅ 完成（2026-10-12）
- **等待用户**：否

### 步骤 3：验证与文档回填

- **动作**：lint；本地跑通 mock 渲染；回填 design `001-home/` 对应 widget data-model 与 004-00 相关条目
- **输出**：验收 checklist 全过
- **状态**：🔄 编码完成，代码部分待用户 review；design/004-00 回填等验收通过后执行
- **等待用户**：是（硬门槛②）

---

## 实现记录（2026-10-12）

### 最终方案（经用户多轮 review 调整后定稿）

**接口层 `home/section-right.ts`**：

- 范式与 `section-left.ts` 一致：`getEnvironment('shenzhen-communication-guarantee.homeConfig.shenzhen-communication-guarantee-view-key-guarantee-area-business')` 解构 `viewPageArgs` + `viewItemDataTemplate`
- **模板为树形结构**（用户指定形态，树结构内建在模板里、可被 env 覆盖）：
    - 分组项：`{ key, group, children: [{ title, children: [{ label, valueField }] }] }`——`group in item` 是分组标记，标题行 `title` 对应接口 type 字典
    - 平铺项：`{ key, title, children: [{ label, valueField }] }`（通感站、重保专线），`title` 同时用于显示与 type 匹配
- **出数回填**：rows 按 `type` 匹配——分组项遍历标题行按 `child.title` 匹配，平铺项按 `item.title` 匹配，命中后按各指标 `valueField` 取值写入 `metric.value`
- **深拷贝隔离**：回填前 `JSON.parse(JSON.stringify(viewItemDataTemplate))`，不污染 env 模板对象；err 或空 rows 直接返回原模板（即全 0 兜底）
- 导出类型：`AreaBusinessItem / AreaBusinessRow / AreaBusinessMetric`
- viewPageId 占位 `shenzhen-home-view`（服务端未给，004-00 登记，答复后替换）

**widget `area-business/index.tsx`**：

- `useRequest`（`@fedx-web-common/react-hooks`）接数，与既有 widget 一致
- 渲染直接消费模板，无前端转换层：`'group' in item` 判别分组/平铺
- 分组项内首行为父行（基站，`index === 0` 不带 `child`）、次行为子行（小区，`child` 缩进小字号）——修复了最初两行都标 `child` 导致父行样式丢失的问题
- 指标数值 `Number(value ?? 0) || 0`，缺数据显示 0
- UI 结构与样式（`index.less`）零改动

### 方案演进（review 迭代过程，落此备忘）

1. v1：前端硬编码 TYPE_TREE_CONFIG（含 label 字典）转换接口平铺 rows → 被否，改为模仿 section-left 的 viewItemDataTemplate 范式
2. v2：模板平铺 8 类型（type/label/labelField/valueField/retireField）→ 用户改为树形模板（key/group/title/children），widget 删转换层直接渲染
3. v3：`'title' in child` 判别 → 因平铺项也加了 `title` 失效，改为 `'group' in item` 判别（用户纠正，正向判断）
4. v4：用户补 `return result`（深拷贝后返回拷贝）与样式修复（分组首行恢复父行样式）

---

## 不做清单

- 不做国际漫入 TOP5（004-00 二-1，接口未定稿）
- 不做区域屏左右模块接数（004-04 范围）
- 不改 UI 结构/样式
- 不补 viewPageId 实际值（服务端未给，保持占位，待答复后替换）

## 业务规则

- type 字典（8 类）：`2G基站/2G小区/4G基站/4G小区/5G基站/5G小区/通感站/重保专线`
- 模板映射：`xG基站` 为分组内首行（父行）、`xG小区` 为次行（子行）；通感站、重保专线为平铺项
- 指标 label：基站 → 「基站数 / 退服数」；小区 → 「总数 / 退服数」；通感站 → 「基站数 / 退服数」；重保专线 → 「专线数 / 中断数」（中断数取 `retireNum`）
- 空数据兜底：err 或 rows 为空 → 返回模板本身（value 缺失，渲染层显示 0，不留空白）

## 前置 / 必读

- [x] 已读：`docs-api-backend/shenzhen-communication-guarantee/api-doc.md`「一、重保区域业务」
- [x] 已读：`web/services/shenzhen-communication-guarantee/home/section-left.ts`（范式参照）
- [x] 已读：`web/services/shenzhen-communication-guarantee/home/section-right.ts`
- [x] 已读：`web/pages/shenzhen-communication-guarantee/sub-pages/home/modules/area-business/index.tsx`
- [x] 已读：`web/pages/shenzhen-communication-guarantee/sub-pages/home/modules/area-business/index.less`
- [x] mock 已建：`public/static/mock/shenzhen-communication-guarantee/key-guarantee-area-business.json`

## 验收 checklist

- [x] A1：接口函数落码 `home/section-right.ts`，走标准 `getViewItemDataApi` 范式（localMockUrl + fallback）
- [x] A2：widget 删除静态 MOCK_DATA，面板渲染 mock 数据（8 类数值与 mock 一致）
- [x] A3：rows 缺失某类型时该类型显示 0，不报错、不留空白
- [x] A4：用户 review 通过（2026-10-12）；`pnpm lint` 因 `@FlyFeDX/lint-config` 与 ESLint 8.57.1 兼容问题在仓库层面报错，与本次改动无关，留待 lint 环境修复后统一验证
- [x] A5：design `001-home/004-area-business/data-model.md` 已回填接口契约 + viewItemDataTemplate 树形结构 + UI 消费结构，无「静态占位」残留描述（2026-10-12）
- [x] 影响架构 / 硬约束的决策已回写 `design/`（同 A5）
- [x] `env/AGENTS.md` 声明的质量门槛命令（lint）—— 同 A4 说明，用户 review 替代验收

---

## 审批记录

| 门槛       | 状态   | 日期       | 批准人 |
| ---------- | ------ | ---------- | ------ |
| ① 需求审批 | 已批准 | 2026-10-12 | user   |
| ② 实现验收 | 已通过 | 2026-10-12 | user   |

---

## 关联

> - 相关 task：`./task-2026-10-09-004-00-scguarantee-backend-api-confirm.md`（二-2，接口定稿来源）
> - 相关 task：`./task-2026-10-09-004-03-scguarantee-home-widgets-migrate.md`（该 widget 静态 UI 的来源，已归档）
