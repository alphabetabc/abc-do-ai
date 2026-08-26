# Task 008 — 前五层地图打点 mock 数据（map-markers.json）

> **前置**：[task-2026-08-25-007-time-label-and-clock.md](./done/task-2026-08-25-007-time-label-and-clock.md)（task007 已完成）
> **关联文档**：
>
> - 路线图：[roadmap.md](./roadmap.md)
> - 数据整理：[design/001-pm-output-data.md](../design/001-pm-output-data.md)（核心数据来源）
> - PM 原文：[design/000-pm-北京移动大屏下钻样例数据-广宁东山链路.md](../design/000-pm-北京移动大屏下钻样例数据-广宁东山链路.md)
> - 地图设计：[design/frontend/003-map.md](../design/frontend/003-map.md)（§9 图例 Checkbox 过滤）
> - 前端规范：[design/003-frontend.md](../design/003-frontend.md)
> - 当前状态：[status/current.md](../status/current.md)
> - 自检清单：[status/checklist.md](../status/checklist.md)
>
> **日期**：2026-08-25（创建）/ 2026-08-26（归档：五层全部完成）
> **状态**：✅ 已完成

---

## 一、目标

为北京移动指挥调度模块的 5 级下钻地图（city / company / district / street / community）生成符合 PM 业务语义的 mock 打点数据，写入 [public/static/mock/bj-cmcc-cmd-dispatcher/map-markers.json](public/static/mock/bj-cmcc-cmd-dispatcher/map-markers.json)。

打点包含：
1. **节点打点**：各层 PM 下属清单表中的兄弟节点（分公司 / 行政区 / 街道 / 社区 / 物理站），`status` 按 PM 状态映射
2. **6 类资源打点**：卫星便携包、移动油机、抢修车辆、应急通信车、无线队伍、传输队伍，带 `subType` + `category` 字段
3. **保留 station / logical 层**：现有 station 和 logical 打点坐标不变

`category` 值必须与 `legendCheckboxes` label 一致（特别是 `'卫星便捷包'`，不是"便携包"），保证图例 checkbox 过滤生效。

---

## 二、背景 / 现状盘点

### 2.1 现有 mock 数据（task008 启动前）

`map-markers.json` 仅有 28 个占位点，全部 `status: 1`，无 `subType` / `category` 字段，分布与 PM 各层下属清单节点数量不匹配，无 6 类资源打点。

### 2.2 图例 Checkbox 过滤已实现（task003）

`MapMarker.category` 字段需与 checkbox `label` 对应才参与过滤。`label` 用了中文业务名称（`'卫星便捷包'` / `'移动油机'` / `'抢修车辆'` / `'应急通信车'` / `'无线队伍'` / `'传输队伍'`），mock 数据的 `category` 必须严格匹配。

### 2.3 坐标体系

- 设计稿像素坐标（base.png 2880×1080）
- `OUTLINE_POSITION` 定义了各层 outline 在 base 上的偏移
- 打点 `left` / `top` 是相对 base 左上角的绝对像素坐标
- **本次打点采用"用户提供多边形 + 业务语义分布"策略**（见 §三.3 方案调整），不是统一 `0` 占位

---

## 三、落地方案

### 3.1 数据来源

按 [design/001-pm-output-data.md](../design/001-pm-output-data.md) §3 各层节点清单 + 资源缩放表。

### 3.2 subType → category 映射

| 资源 | subType | category（checkbox label） | 图标文件 |
|---|---|---|---|
| 卫星便携包 | `sat-bag` | `'卫星便捷包'` | `sub-sat-bag.png` |
| 移动油机 | `generator` | `'移动油机'` | `sub-generator.png` |
| 抢修车辆 | `repair-vehicle` | `'抢修车辆'` | `sub-repair-vehicle.png` |
| 应急通信车 | `emergency-vehicle` | `'应急通信车'` | `sub-emergency-vehicle.png` |
| 无线队伍 | `wireless-team` | `'无线队伍'` | `sub-wireless-team.png` |
| 传输队伍 | `transmission-team` | `'传输队伍'` | `sub-transmission-team.png` |

### 3.3 方案调整（原 §3.3 占位方案 → 多边形分布）

**原方案**（task008 启动时）：所有点 `left` / `top` 统一 `0` 占位，待后续按底图标定。
**新方案**（用户拍板）：每层用户提供一个粗略的多边形轮廓数据，脚本在多边形内**按 PM 业务语义分布**（非均匀、非全 0）。

### 3.4 生成脚本

- **位置**：[.trae/skills/oss-demonstrate-project-bj-cmcc-cmd-dispatcher/scripts/gen-map-markers-mock.cjs](../../../../.trae/skills/oss-demonstrate-project-bj-cmcc-cmd-dispatcher/scripts/gen-map-markers-mock.cjs)
- **运行**：`node .trae/skills/oss-demonstrate-project-bj-cmcc-cmd-dispatcher/scripts/gen-map-markers-mock.cjs`
- **输出**：[public/static/mock/bj-cmcc-cmd-dispatcher/map-markers.json](public/static/mock/bj-cmcc-cmd-dispatcher/map-markers.json)
- **可复现**：固定 LCG 随机种子 `_seed = 20260826`，同种子多次运行结果完全一致（已验证）

### 3.5 图标资源（不在本次范围）

6 类资源 × 5 层 = 30 张 `sub-*.png` 图标需准备到 `public/static/images/bj-cmcc-cmd-dispatcher/map/{level}/` 目录。本次只生成 mock 数据，不准备图标资源。图标缺失时 `getMarkerIcon` 会返回路径但图片 404，不影响 mock 数据结构验证。

---

## 四、最终生成结果（与原计划偏差说明）

### 4.1 数据点数（实际 vs 原计划）

| 层级 | 原计划 | 实际 | 偏差原因 |
|---|---|---|---|
| city | 36 | **70** | 用户后续追加 `CITY_DENSE_POLYGON` 局部加密区，额外生成 28 个资源点（覆盖城区重点区域，提高视觉密度） |
| company | 30 | **34** | 用户提供的 6 个原始节点替代 PM §4.2 的"2 行政区"语义（脚本设计决策） |
| district | 20 | **16** | 用户提供的原始节点仅 4 个（其它层暂未提供） |
| street | 19 | **12** | 物理站（td/nr）统一通过 `STATION_MARKERS`（type: 'station'）承载，street 层不重复（脚本设计决策）；street 层只保留 5 社区 + 7 资源 |
| community | 8 | **8** | ✓ 与原计划一致 |
| station | 3 | **3** | ✓ 保留现有 |
| logical | 1 | **1** | ✓ 保留现有 |
| **合计** | **117** | **144** | +27（含局部加密 28 + company 节点偏差 +4 - district 节点偏差 -4 - street 物理站 -7） |

**结论**：以实际生成结果为准（用户 2026-08-26 决策），任务文档与 mock 数据保持一致。

### 4.2 city 节点 status 说明

原计划"分四个象限生成 4 分公司节点，status 1/0/0/1"。实际改为用户提供 10 个 `CITY_NODE_MARKERS`（含退服点），全部 status: 1 — 这是用户提供的真实点位坐标的快照，**保留原貌**。

### 4.3 street 物理站承载方式

原计划"street 层包含 7 个物理站带 subType: 'td'/'nr'"。实际改为"物理站统一通过 `STATION_MARKERS`（type: 'station'）承载，street 层不重复"——这样 station 图标 `sub-td.png` / `sub-nr.png` 在 street 层级不被引用，避免图标 404 时 street 也连带出错。

### 4.4 district 第 3 个节点 `top: 5.57` 浮点异常

用户在 `DISTRICT_NODE_MARKERS` 提供的数据。属已知数据瑕疵，不影响渲染（站点在 (5, 5.57) 处，不在底图可见区域），**保留原貌**。后续可在用户清理数据时移除。

### 4.5 输出文件结构

```json
{
    "data": [
        // --- L1 city（70 个点）---
        // 10 个用户提供的原始节点（全部 status: 1）
        { "left": 661, "top": 253, "status": 1, "type": "city" },
        // ... ×9
        // 32 个主资源点（按 PM §2.3 业务语义分布）
        { "left": 579, "top": 502, "status": 1, "type": "city", "subType": "emergency-vehicle", "category": "应急通信车" },
        // ... ×4
        // 28 个加密资源点（按 CITY_DENSE_POLYGON 局部加密）
        { "left": 669, "top": 383, "status": 1, "type": "city", "subType": "emergency-vehicle", "category": "应急通信车" },
        // ... ×27

        // --- L2 company（34 个点）---
        // 6 个用户提供原始节点 + 28 个资源点（4+8+4+4+4+4）

        // --- L3 district（16 个点）---
        // 4 个用户提供原始节点 + 12 个资源点（每类 2 个）

        // --- L4 street（12 个点）---
        // 5 个社区节点（无 subType）
        // 7 个资源点（emergency-vehicle × 2 + 其余 5 类各 × 1）
        // 注：物理站统一通过 station 层承载

        // --- L5 community（8 个点）---
        // 2 个物理站节点（subType: td/nr）— community 层保留物理站
        // 6 个资源点（各 1 个）

        // --- station（保留现有 3 个）---
        { "left": 622, "top": 282, "status": 0, "type": "station", "subType": "td" },
        { "left": 820, "top": 431, "status": 0, "type": "station", "subType": "td" },
        { "left": 668, "top": 519, "status": 1, "type": "station", "subType": "nr" },

        // --- logical（保留现有 1 个）---
        { "left": 455, "top": 352, "status": 1, "type": "logical", "icon": "radar", "width": 460, "height": 448 }
    ]
}
```

> **注意**：community 层保留物理站（subType: td/nr），street 层不保留（统一通过 station 层承载）。两个处理方式的差异源于"street 层已用 STATION_MARKERS 集中管理"的设计决策。

---

## 五、验收标准（以实际结果为准）

| # | 验收项 | 结果 | 说明 |
|---|---|---|---|
| 1 | `node .trae/skills/.../scripts/gen-map-markers-mock.cjs` 可成功运行，无报错 | ✅ | 同种子多次运行结果完全一致 |
| 2 | `map-markers.json` 被正确覆写，JSON 合法 | ✅ | |
| 3 | `data` 数组点位分布符合设计 | ✅ | city 70 / company 34 / district 16 / street 12 / community 8 / station 3 / logical 1 = **144 个**（按实际生成结果） |
| 4 | 资源打点带 `subType` + `category` 字段，`category` 与 `legendCheckboxes` label 一致（含 `'卫星便捷包'`） | ✅ | |
| 5 | 节点打点 `status` 字段已设置（资源打点 `status` 固定 1） | ✅ | city 节点 status: 1（用户提供数据原貌）；community 节点 status: 0/1（含退服点） |
| 6 | station 层物理站带 `subType: 'td'/'nr'`，无 `category` 字段 | ✅ | station 3 个点保留原坐标 |
| 7 | station / logical 层保留现有坐标不变 | ✅ | station 3 个 + logical 1 个 |
| 8 | 页面 `/bj-cmcc-cmd-dispatcher` 可正常打开，各层切换无运行时报错 | ✅ | 已知：L1/L2/L3 默认视图走 `history-timeline.json`（task006 产物），坐标待后续同步 |

---

## 六、不在本次范围

- ❌ 像素坐标精确标定（当前为多边形内业务语义分布，可视效果可接受）
- ❌ 图标资源准备（30 张 `sub-*.png`）
- ❌ `history-timeline.json` 坐标同步（task006 产物，坐标与本任务打点不一致，待后续统一）
- ❌ `presets.ts` 代码修改（`legendCheckboxes` label 已正确定义）
- ❌ `map-stage.tsx` 渲染逻辑修改（现有按 `m.type === currentLevel` 过滤逻辑不变）

---

## 七、文档同步要求

| 触发动作 | 已更新 |
|---|---|
| 新增 `scripts/gen-map-markers-mock.cjs` | ✅ `status/current.md`（scripts 清单） |
| 覆写 `map-markers.json` | ✅ `status/current.md`（mock 数据说明） |
| 新增 task 文件 | ✅ `roadmap.md`（看板勾选） |
| — | ✅ `status/checklist.md`（task008 收口自检） |

---

## 八、看板

- [x] 创建 `scripts/gen-map-markers-mock.cjs`
- [x] 运行脚本生成 `map-markers.json`
- [x] 验证 JSON 合法性 + 点数（144）
- [x] 验证 `category` 值与 `legendCheckboxes` label 一致
- [x] 验证页面 `/bj-cmcc-cmd-dispatcher` 正常打开（已知 history-timeline 坐标偏差，非阻塞）
- [x] 同步 `status/current.md`（scripts 清单 + mock 说明）
- [x] 按 `status/checklist.md` 自检
- [x] 归档至 `plans/done/`

---

## 九、PM 待澄清

| # | 事项 | 阻塞 | 说明 |
|---|---|---|---|
| 1 | 移动油机/卫星便携包按分公司拆分数量 | 否 | PM 仅给全网量级，L1/L2 按示意性数量取值 |
| 2 | L3 石景山抢修车/油机/队伍数量 | 否 | PM 仅给应急通信车在位 2，L3 按每类 2 个补齐 |
| 3 | L5 东山社区资源数量 | 否 | PM 仅明确应急通信车 1 辆，L5 按每类 1 个补齐 |
| 4 | 像素坐标精确标定 | 否 | 当前为多边形内业务语义分布 |
| 5 | history-timeline.json 坐标同步 | 否 | 待后续 task 统一从 map-markers.json 同步 |
| 6 | district 第 3 节点 `top: 5.57` 异常 | 否 | 数据瑕疵，不影响渲染，待用户清理 |

---

## 十、执行记录

### 10.1 L1 city 完成（2026-08-26 上午）

- 脚本：[.trae/skills/oss-demonstrate-project-bj-cmcc-cmd-dispatcher/scripts/gen-map-markers-mock.cjs](../../../../.trae/skills/oss-demonstrate-project-bj-cmcc-cmd-dispatcher/scripts/gen-map-markers-mock.cjs)
- 输出：[public/static/mock/bj-cmcc-cmd-dispatcher/map-markers.json](../../../../public/static/mock/bj-cmcc-cmd-dispatcher/map-markers.json)
- 用户提供 12 点多边形（绝对像素，base.png 2880×1080 体系）
- 分布策略：
  - 10 个用户提供原始节点（直接复用）
  - 32 个主资源点：emergency-vehicle / sat-bag / wireless-team / transmission-team（各 4 个）按分公司锚点附近 70px 聚集；repair-vehicle / generator（各 8 个）多边形内均匀散布，前 3 个靠近退服区
  - 28 个加密资源点（用户后续追加 `CITY_DENSE_POLYGON`）：在加密多边形内按 `CITY_DENSE_RESOURCE_COUNT` 每类加密（4+6+6+4+4+4）
- 校验：city 70 个点 ✓

### 10.2 L2 company 完成（2026-08-26 下午）

- 用户提供 14 点多边形 + 6 个原始节点
- 设计决策：保留用户提供 6 个原始节点，**不按 PM §4.2 生成 2 行政区节点**
- 资源 28 个（4+8+4+4+4+4）按多边形均匀散布
- 校验：company 34 个点 ✓

### 10.3 L3 district 完成（2026-08-26 下午）

- 用户提供 16 点多边形 + 4 个原始节点
- 数据瑕疵：第 3 个节点 `top: 5.57`（用户原始数据，待澄清）
- 资源 12 个（每类 2 个）按多边形均匀散布
- 校验：district 16 个点 ✓（与原计划 20 个偏差 -4）

### 10.4 L4 street 完成（2026-08-26 下午）

- 用户提供 14 点多边形 + 2 个社区原始节点
- 设计决策：物理站（td/nr）**统一通过 `STATION_MARKERS`（type: 'station'）承载**，street 层不重复
- 社区节点：用户提供 2 个 + 按 PM §4.4 补 3 个 = 5 个
- 资源 7 个（emergency-vehicle × 2 + 其余 5 类各 × 1）按多边形均匀散布
- 校验：street 12 个点 ✓（与原计划 19 个偏差 -7，物理站移到 station 层）

### 10.5 L5 community 完成（2026-08-26 下午）

- 用户提供 10 点多边形 + 2 个原始节点（1 退服 + 1 正常）
- community 层保留物理站（与 street 层处理方式不同），2 个物理站通过 `COMMUNITY_NODE_MARKERS` 承载
- 资源 6 个（每类 1 个）按多边形均匀散布
- 校验：community 8 个点 ✓（与原计划 8 个一致）

### 10.6 脚本可复现性验证（2026-08-26 归档前）

- 备份当前 `map-markers.json` → 运行脚本 → diff 对比 → 备份文件清理
- 结果：脚本可重复运行，输出完全一致（固定 LCG 种子 `_seed = 20260826`）

### 10.7 渲染逻辑兼容性确认

mock 数据结构与 `MapMarker` 类型完全兼容：
- 字段 `left / top / status / type / subType / category / icon / width / height` 全部被识别
- `getMarkerIcon` 优先取 `sub-${subType}.png` ✓
- logical 层 `icon: 'radar'` 走特殊路径 ✓
- legend checkbox 过滤走 `m.category` ✓

**注意点（不影响渲染但需知晓）**：
- L1 / L2 / L3 是 `EFFECTIVE_LEVELS`，**优先用 `history-timeline.json`**（按 `currentTimeIndex` 取），fallback 才走 `markerData`
- 当前 `history-timeline.json` 的 city / company / district markers 用的是旧坐标，**默认视图看不到新坐标**
- 验证方法：手动下钻到 street / community 层（这两层走 `markerData`），或修改 `map-stage.tsx` 临时禁用 `historyData`
- 待办：history-timeline 的坐标需要从 map-markers.json 同步（建议在后续 task 中做一次对齐）

---

## 十一、文档元信息

> **日期**：2026-08-25（创建）/ 2026-08-26（归档：五层全部完成；以实际生成结果为准更新验收标准；roadmap / status / checklist 全部同步）
> **状态**：✅ 已完成（移入 `plans/done/`）