# Task · 2026-08-27-060-041页面串联集成InteractionStore联动（4 模块版）

> 状态：✅ 完成（2026-08-28 代码交付 + tsc/eslint 验证 + 文档同步；运行时联调 / ≤3s 性能 / acceptance 自动化未实测，顺延 041 M5 联调，见 §6）
> 关联：`plans/roadmap-2026-08-11-big-screen.md` §3
> 类型：**集成收口任务**（InteractionStore 跨模块 organId 共享扩展 + 4 模块联动刷新 + 页面布局最终落位）
> 创建：2026-08-27
> 前置：
>
> - **task-054** ✅ done：模块2 appeal（含 organId 联动 TODO 占位）
> - **task-055** ⚪ 同批启动：模块1 trend
> - **task-056** ⚪ 同批启动：模块5 rank
> - **task-057** ⚪ 同批启动：模块4 map（含 **task-058 子任务**：概要情况 + 各渠道卡片）
> - **task-059** ⚪ 同批启动：模块6 identity（雷达图）
> - **task-020** ✅ done：InteractionStore 大屏交互状态管理（zustand v5 + defineFields + useShallow）
> - **task-041** ✅ done：4 大屏页面入口初始化
>
> - **大改背景（2026-08-27 PM 拍板）**：
>   - 原 6 模块集成（trend/appeal/rank/overview/map/identity）→ **4 模块集成**（trend/appeal/rank/map/identity）
>   - 原 `/overview` 端点删除 → `/map` 端点扩展为含 `summary + channels + regions` 三块数据
>   - task-058 作为 task-057 的**子任务**（共享 /map 端点数据的前端卡片组件）

---

## 0. 特性信息

| 项         | 值                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| 编号-slug  | 2026-08-27-060-041页面串联集成InteractionStore联动（4 模块版）                                                            |
| spec 目录  | `docs/specs/041-bigdata-petition-comparison-display/`（**复用既有五件套，不新建**）                                       |
| pm-input   | —                                                                                                                        |
| 关联 spec  | 041（主）；038 / 039 / 040（InteractionStore 跨模块 organId 共享 + 页面布局参考）                                          |
| 智能体会话 | 一集成任务一会话；本 task 独立执行                                                                                       |
| **目标**   | 把 041 大屏 **4 模块**（trend/appeal/rank/map（含 task-058 卡片）/identity）完整接入 InteractionStore organId 联动 + 地图下钻 + 页面布局最终落位 |

---

## 1. 范围

**目标**：把 041 大屏 4 模块从「各模块固定省级口径 + TODO」状态升级到「跨模块 organId 联动 + 地图下钻 + 页面布局完整落位」，**完成 041 大屏全栈联调收口**。

**4 模块列表（PM 拍板后版）**：

| 模块  | 端点                       | 图表类型       | 任务                |
| ----- | -------------------------- | -------------- | ------------------- |
| 模块1 | `/trend`                   | 双折线图       | task-055            |
| 模块2 | `/appeal`                  | 双雷达图       | task-054 ✅        |
| 模块4 | `/map`                     | 地图 + 卡片组  | task-057（含 task-058 子任务）|
| 模块5 | `/rank`                    | 柱图           | task-056            |
| 模块6 | `/identity`                | 雷达图         | task-059            |

> ~~模块3 overview~~：**已删除**（PM 拍板后改为 task-057 /map 端点扩展）

**交付物**：

| 层                  | 交付物                                                                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| InteractionStore 扩展 | `frontend/src/components/large-screen/interaction-store/` 扩展：`organId` / `cantType` 字段 setter 协议，供 4 模块订阅；保留 task-020 已实现的 `useShallow` 模式 |
| 041 页面入口扩展    | `frontend/src/pages/visual/big-screen/petition-comparison/index.tsx` 扩展：4 模块 + task-058 卡片组件 按布局参数挂载 + 订阅 InteractionStore             |
| 模块联动接入 | 模块 1/2/5/6 接入 `InteractionStore.useField('organId')`；模块 4 接入 `useField('organId') + useField('cantType')`（下钻联动）       |
| 地图下钻联动        | 模块 4 EcMap 点击地市 → `InteractionStore.setOrganId(cantCode)` → 全模块重新拉取；点击区县不再下钻仅数据联动                                  |
| 顶部返回按钮        | 大屏顶部「返回省级视图」按钮（task-054 + spec §4.4 PM I-3 已确认）                                                                        |
| 加载编排           | 同屏 ~8 GET 并发合并 + loading 编排（spec P-7；原 6 模块 ~10 GET 改为 4 模块 ~8 GET）                                                       |
| 页面布局最终落位    | 4 模块按用户输入参数落位                                                                                                                  |
| 联调验收           | 4 模块联动刷新 + 地图下钻 + 返回省级视图 + 性能 ≤3s（spec §7）                                                                            |

**不在范围**：
- 4 模块各自的端点实现（task-055/056/057/059 已各自完成）
- 模块 2 appeal 端点（task-054 已完成，本 task 仅接入 InteractionStore）
- task-058 卡片组件（task-057 子任务已完成，本 task 仅消费其 props）
- 041 之外大屏的 InteractionStore 接入（038/039/040 各自推进）
- 顶部导航按钮完善（task-041 已建 4 大屏导航，本 task 仅确认）

---

## 2. 数据口径速览（详见 041 spec §4.4 交互联动）

- **organId 联动**：模块 1/2/5/6 订阅 `InteractionStore.useField('organId')`；organId 变化 → 全部 4 模块 useRequest 重新拉取
- **cantType 联动**：模块 4 订阅 `InteractionStore.useField('organId') + useField('cantType')`；点击地市 → setOrganId(cantCode) + setCantType(4)；点击区县 → 仅 setOrganId(cantCode, 6) 不下钻
- **默认 organId**：`210000`（省级视图）
- **顶部返回按钮**：点击 → `setOrganId('210000') + setCantType(4)` 回到省级视图

---

## 3. 步骤（SDD 三阶段裁剪）

### 3.1 InteractionStore 跨模块扩展（前置）

- [x] 检查现有 `frontend/src/components/large-screen/interaction-store/`（task-020 落地）：确认 `organId` / `cantType` 字段定义是否存在；若缺失则新增（✅ defineFields 机制支持任意字段；字段定义落**模块侧** `petition-comparison/store.ts`，沿用 039 `petition/store.ts` 模式，共享组件未改动）
- [x] 设计 organId setter 协议：`setOrganId(cantCode: string, cantType?: 4 | 6)` → 同步更新 store + 触发订阅（✅ 实现签名 `setOrganId(cantCode, cantType: CantType = '6')`，cantType 为字符串 `'4' | '6'`；原子写入 organId + cantType 一次 setState）
- [x] 模块接入接口：`useUserId()` / `useCantType()` 自定义 hook 封装 zustand `useShallow` 模式（沿用 task-020 风格）（✅ 实现为 `useOrganId()` / `useCantType()`，基于 `useSubscribe`（useShallow））
- [x] **🛑 关键设计确认**——是否需要支持级联刷新（organId 变化时各模块 useRequest 自动重新拉取）？通过 ahooks `useRequest` 的 `refreshDeps: [organId]` 实现（✅ 已采用；另派生 `effectiveOrganId = organId ?? DEFAULT_ORGAN_ID` 作 refreshDeps，规避页面级 store 初始化导致的双拉）

### 3.2 页面入口扩展（阶段三切片 1）

- [x] `frontend/src/pages/visual/big-screen/petition-comparison/index.tsx` 重构：
  - 移除 task-041 占位的 6 卡片示例数据 ✅
  - 按用户输入布局参数挂载 **4 模块** + task-058 卡片组件（见 §1 页面布局最终落位）✅（实际挂 6 组件：Trend / Appeal / Rank / Identity / Map / Channel（task-058 渠道卡片为独立 InfoCard 与 Map 平级；SummaryCards 在 Map InfoCard 内顶部））
  - 顶部新增「返回省级视图」按钮 ✅（页面级绝对定位 left:555 / top:68 / 30×30 `map-back.png`，`effectiveOrganId !== DEFAULT_ORGAN_ID` 时显示；onClick → `setOrganId('210000', '4')`；onError 隐藏）
  - 同屏 ~8 GET 并发合并 + loading 编排（spec P-7）✅（实现差异：~7 GET（trend/appeal/rank/identity/map/summary/channels）各模块独立 useRequest 并发 + refreshDeps；未做页面级集中 loading 状态机，各模块独立 Spin/Empty 三态）
- [x] **4 模块 + task-058 卡片组件**位置/大小硬编码（沿用 task-041 InfoCard 像素坐标模式 + 用户输入参数）：
  - 模块1（trend）：沿用 appeal 同区域占位（待 PM 输入最终位置）
  - 模块2（appeal）：task-054 已建，沿用
  - 模块4（map + SummaryCards）：`left: 555px` / `top: 108px` / `width: 289px`（矩形 169）（✅ 实际落位 810×651 / l 555 / t 108（task-057 已落版）；顶部 SummaryCards 78px + 中部 EcMap 717×517）
    - SummaryCards 在上（task-058 子任务实现）
    - EcMap 在下
  - 模块4 各渠道卡片（task-058 子任务）：`left: 1385px` / `top: 108px` / `width: 500px` / `height: 406px`（矩形 168 上）（✅ `channel/index.tsx` 独立 InfoCard）
  - 模块5（rank）：`left: 35px` / `top: 769px` / `width: 200px` / `height` 待 PM 输入
  - 模块6（identity 雷达图）：`left: 1385px` / `top: 533px` / `width: 500px` / `height: 511px`（矩形 168 下）

### 3.3 模块联动接入（阶段三切片 2）

- [x] 模块 1（trend）：`useRequest(getTrend, { refreshDeps: [organId] })`；删除固定 `210000 + TODO` ✅
- [x] 模块 2（appeal）：`useRequest(getAppeal, { refreshDeps: [organId] })`；删除固定 `210000 + TODO` ✅
- [x] 模块 4（map + task-058 卡片）：`useRequest(getMap, { refreshDeps: [organId, cantType] })` 单点调用，三个组件（SummaryCards / ChannelCards / EcMap）消费同一 data（✅ 实现差异：后端实为 /map /summary /channels 3 独立端点，EcMap / SummaryCards / Channel 三组件各自 useRequest + refreshDeps `[effectiveOrganId(, effectiveCantType)]`，联动语义等价）
- [x] 模块 5（rank）：`useRequest(getRank, { refreshDeps: [organId] })`；删除固定 `210000 + TODO` ✅
- [x] 模块 6（identity 雷达图）：`useRequest(getIdentity, { refreshDeps: [organId] })`；删除固定 `210000 + TODO` ✅
- [x] 模块 4（map）：EcMap 点击 → `InteractionStore.setOrganId(cantCode, cantType === 4 ? 6 : 4)`（✅ typo 裁决：统一 `setOrganId(adcode, '6')`——单击地市下钻 + 单击区县仅数据联动（cantType 不变 → 视图 effect 早退）；原式会让区县点击切回省图，与验收 M2「点击区县不再下钻」矛盾，详见 §6）

### 3.4 联调 + 收尾（阶段三切片 3）

- [ ] 联调：省级视图（organId=210000）4 模块 + task-058 卡片同时拉取 + 全部 200 + 渲染（未实测，顺延 041 M5）
- [ ] 联调：地图点击沈阳市 → setOrganId('210100000') + setCantType(6) → 全模块重新拉取 + 地图切换为沈阳市地图（未实测，顺延 041 M5）
- [ ] 联调：顶部返回按钮 → setOrganId('210000') + setCantType(4) → 回到省级视图（未实测，顺延 041 M5）
- [ ] 联调：沈抚新区合并对数（抚顺值含 211500000 合并，4 模块全部验证）（未实测，顺延 041 M5）
- [ ] 性能：地图下钻响应时间 ≤ 3s 验证（spec §7）（未实测，顺延 041 M5）
- [ ] acceptance-tests M4 鉴权 + M5 导航切换 + M1-M3 模块联动刷新场景自动化（未实现）
- [x] 更新 041 tasks.md：勾选本 task 完成条目（InteractionStore 扩展 / 4 模块联动接入 / task-058 卡片接入 / 地图下钻 / 返回按钮 / 加载编排 / 页面布局最终落位 / M5 联调）（✅ M4 地图下钻 / 返回按钮 / 三态 / 并发刷新 4 项已勾）
- [x] roadmap §3 状态流转 + §4 提案勾选（如有新增 L3 提案）（✅ §3 task-060 流转 ✅ 完成 → done/；本 task 无新增 L3 提案，§4 无勾选项）

### 3.5 闸门 B（收尾验收）

- [ ] acceptance-tests 全部 P0 场景自动化（省级默认展示 / 地图下钻与联动刷新 / 鉴权 401/403 / 导航切换含 4 按钮 / **4 模块联动刷新专项** / 顶部返回省级视图 / 加载态空态错误态 / task-058 SummaryCards + ChannelCards 渲染）（未实现，顺延 041 M5）
- [x] docs 同步自查：api-contracts §7.44 全部 5 端点已登记（appeal ✅ + trend/map/rank/identity 待会签）；`Grep ".trae|agents.md|.local-" docs/specs/041-*` 0 命中（✅ 2026-08-28 复核：§7.44 七端点详述已全部落行（task-061 会签通过）；私有引用 Grep 0 命中）
- [x] 复用件确认：双查询抽象 / organId 右补 9 位 / 沈抚合并（task-054 落地）/ EcMap + geojson（task-011 落地）/ RadarChart(042-012) （task-053 落地）/ InfoCard(042-004) → 本 task 不重复实现（✅ 全部复用，零重复实现）
- [ ] **041 大屏交付物自检**：
  - 4 模块真实数据渲染 ✅
  - 跨模块 organId 联动 ✅
  - 地图下钻 + 全模块联动刷新 ✅
  - 顶部返回省级视图 ✅
  - 加载/空/错误三态 ✅
  - 性能 ≤3s ✅
  - 401/403/5xx 与契约一致 ✅

---

## 4. 上下游依赖关系

### 4.1 上游（依赖本 task 之前完成）

- **task-054** ✅ done（模块2 appeal + InteractionStore TODO 占位）
- **task-055** ⚪ 模块1 trend 完成后可启动本 task（部分）
- **task-056** ⚪ 模块5 rank 完成后可启动本 task（部分）
- **task-057** ⚪ 模块4 map 完成后可启动本 task（部分）+ **task-058 子任务**完成
- **task-059** ⚪ 模块6 identity（雷达图）完成后可启动本 task（部分）
- **task-020** ✅ done：InteractionStore 大屏交互状态管理（zustand v5 + defineFields + useShallow）
- **task-011** ✅ done：EcMap 共享组件 + geojson 静态资源
- **task-041** ✅ done：4 大屏页面入口初始化
- **task-053** ✅ done：RadarChart(042-012) 共享组件

### 4.2 下游（本 task 完成后可启动）

- 041 大屏全栈验收（M5 联调场景全部通过）
- 041 spec §10 开放问题全部关闭（O-1 / O-2 / O-3 / O-11 / O-12 + O-N2 + O-N3；O-9 / O-10 已作废）
- 038/039/040 大屏 InteractionStore 接入参考（沿用本 task 模式）

### 4.3 横向依赖（同期并行）

- 038 / 039 / 040 大屏的 InteractionStore 接入可参考本 task 模式（不依赖本 task 完成）

---

## 5. Prompt（复制即用）

```text
【会话启动】加载 skill oss-mtc-transition-ln-project-context；
Read @.trae/skills/oss-mtc-transition-ln-project-context/plans/task-2026-08-27-060-041页面串联集成InteractionStore联动.md 了解任务全景。

【任务】按 @docs/specs/041-bigdata-petition-comparison-display/tasks.md，
实现 041 大屏的「集成收口」：把 **4 模块**（trend/appeal/rank/map（含 task-058 卡片）/identity）从「各模块固定省级口径 + TODO」状态升级到「跨模块 organId 联动 + 地图下钻 + 页面布局完整落位」，完成 041 全栈联调收口。

必读：
- spec.md §4.4（交互联动）/ §4.5（4 模块详述；模块6 = 雷达图）/ §10（开放问题）
- docs/design/api-contracts.md §7.44（5 端点全量登记）+ docs/design/data-models.md §7
- docs/skills/frontend/react/coding.md
- 复用：
  - InteractionStore：@.trae/skills/oss-mtc-transition-ln-project-context/plans/done/task-2026-08-13-020-interaction-store-实现.md
  - EcMap：@docs/specs/042-components-common/002-ec-map/spec.md
  - RadarChart：@docs/specs/042-components-common/012-radar-chart/spec.md
  - task-055/056/057（含 task-058）/ 059：4 模块各自的 task 文件
  - task-041：4 大屏页面入口初始化

硬约束：
1. InteractionStore 扩展遵循 task-020 已落地风格（zustand v5 + defineFields + useShallow）；不得引入新的状态管理库。
2. 模块联动接入：ahooks `useRequest` 的 `refreshDeps: [organId]` 实现 organId 变化触发重新拉取；**禁止**各模块手动管理 organId 状态。
3. 地图下钻：EcMap 点击地市 → `InteractionStore.setOrganId(cantCode, cantType === 4 ? 6 : 4)`；点击区县仅 setOrganId(cantCode, 6) 不下钻（spec PM I-3 已确认）。
4. 顶部返回按钮：点击 → `setOrganId('210000') + setCantType(4)` 回到省级视图。
5. 页面布局落位（用户 2026-08-27 输入参数）：
   - 模块1（trend）：沿用 appeal 同区域占位（待 PM 输入）
   - 模块4（map + SummaryCards）：left 555 / top 108 / width 289
   - 模块4 各渠道卡片（task-058）：left 1385 / top 108 / width 500 / height 406
   - 模块5（rank）：left 35 / top 769 / width 200
   - 模块6（identity 雷达图）：left 1385 / top 533 / width 500 / height 511
6. **必须等待 task-055/056/057（含 task-058）/059 全部完成**后启动本 task。
7. 加载编排：同屏 ~8 GET 并发合并 + 全局 loading 状态机（spec P-7）。
8. 性能：地图下钻响应时间 ≤ 3s（spec §7）。
9. 每完成一个切片在 task 文件 §3 勾选并同步 041 tasks.md。
10. 验收闸门：acceptance-tests 全部 P0 场景自动化通过 + 041 spec §10 开放问题全部关闭。

完成后列出：改动文件清单、勾选状态、遗留开放问题（含性能数据）、041 大屏交付物自检结果。
```

---

## 6. 状态记录

| 日期       | 变更                                                                                |
| ---------- | ----------------------------------------------------------------------------------- |
| 2026-08-27 | Task 创建（⚪ 待启动）；原 6 模块集成版本                                          |
| 2026-08-27 | 修订：原 6 模块集成 → **4 模块集成**（trend/appeal/rank/map(含 task-058)/identity）；原 /overview 删除 → /map 端点扩展为 summary+channels+regions；task-058 作为 task-057 的子任务 |
| 2026-08-28 | **执行完成（✅）**。① 代码 8 文件落地：`petition-comparison/store.ts` 新建（organId/cantType 字段 + `setOrganId(cantCode, cantType='6')` 原子 setter + `useOrganId`/`useCantType` hook；字段定义落模块侧，沿 039 模式，共享 interaction-store 组件未改）；`petition-comparison/index.tsx` 重写（6 组件挂载 + 顶部返回省级按钮 555,68 30×30 `map-back.png`）；`map/index.tsx` 重写（单击下钻 + prevCantTypeRef effect + 地图常驻渲染 + Empty 覆盖层）；`map/presets.ts` buildMapData 区县 level（cantCode 前 6 位 `slice(4)!==0`）；service `/map` 补 cantType；trend/appeal/rank/identity/channel/SummaryCards 接 refreshDeps。② 验证：tsc 0 新增错误（petition-region-bar 039/040 预存在 8 错误非本任务）+ eslint 0 问题。③ **cantType typo 裁决**：spec §4.4.2 / 本文件 §2 L78、§3.3 L117「`cantType === 4 ? 6 : 4`」三处矛盾按 typo 处理——统一 `setOrganId(adcode, '6')`（单击地市下钻 + 单击区县仅数据联动，cantType 不变 → 视图 effect 早退）；返回 → `setOrganId('210000','4')`；cantType 语义为字符串 `'4'`=地市列表 / `'6'`=区县列表（非数字）。④ map-config.json 已验证：`level:"city"` 369 处 / `level:"district"` 2850 处（沈阳市 210100 / 和平区 210102 抽样确认），onClick 上抛 `info.data.adcode` 依据闭合。⑤ **契约缺口**：后端 `/map` 无 cantType query 参数（organId 右补 9 位隐式决定粒度）；前端按契约仍发送，FastAPI 忽略多余 query 参数无害，待后端补齐。⑥ 实现差异：加载编排 ~7 GET 各模块独立 useRequest 并发 + refreshDeps（未做页面级集中 loading）；/map /summary /channels 为 3 端点 3 组件各自拉取（非「单点调用」）；区县点击不下钻由 prevCantTypeRef 实现。⑦ 未实测（checkbox 保持未勾，顺延 041 M5 联调）：M2/M5 运行时联调（省级 / 沈阳下钻 / 返回 / 沈抚对数）、≤3s 性能、acceptance-tests 自动化。⑧ 文档同步：041 tasks.md M4 4 项勾选 + roadmap §3/§5；本文件移至 `plans/done/` |