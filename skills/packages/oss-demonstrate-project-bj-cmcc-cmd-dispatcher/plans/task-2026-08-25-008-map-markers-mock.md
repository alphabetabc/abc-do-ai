# Task 008 — 前五层地图打点 mock 数据（map-markers.json）

> **前置**：[task-2026-08-25-007-time-label-and-clock.md](./done/task-2026-08-25-007-time-label-and-clock.md)（task007 已完成）
> **关联文档**：
> - 路线图：[../plans/roadmap.md](../plans/roadmap.md)
> - 数据整理：[../design/001-pm-output-data.md](../design/001-pm-output-data.md)（核心数据来源）
> - PM 原文：[../design/000-pm-北京移动大屏下钻样例数据-广宁东山链路.md](../design/000-pm-北京移动大屏下钻样例数据-广宁东山链路.md)
> - 地图设计：[../design/frontend/003-map.md](../design/frontend/003-map.md)（§9 图例 Checkbox 过滤）
> - 前端规范：[../design/003-frontend.md](../design/003-frontend.md)
> - 当前状态：[../status/current.md](../status/current.md)
> - 自检清单：[../status/checklist.md](../status/checklist.md)
>
> **日期**：2026-08-25（创建） / 2026-08-26（更新：L1 city 完成）
> **状态**：进行中（L1 city 已完成，L2~L5 待逐层补充）

---

## 一、目标

将 [001-pm-output-data.md](../design/001-pm-output-data.md) 整理的前五层（city / company / district / street / community）地图打点数据写入 `public/static/mock/bj-cmcc-cmd-dispatcher/map-markers.json`，替换现有占位 mock。打点包含：

1. **节点打点**：各层 PM 下属清单表中的兄弟节点（分公司/行政区/街道/社区/物理站），`status` 按 PM 状态映射
2. **6 类资源打点**：卫星便携包、移动油机、抢修车辆、应急通信车、无线队伍、传输队伍，带 `subType` + `category` 字段
3. **保留 station / logical 层**：现有 station 和 logical 打点不变

数量按底图 outline 尺寸做了缩放（详见 §三），`left`/`top` 为 `0` 占位待标定。

## 二、背景 / 现状盘点

### 现有 mock 数据（[map-markers.json](../../../public/static/mock/bj-cmcc-cmd-dispatcher/map-markers.json)）

当前 `map-markers.json` 只有 28 个占位点，全部 `status: 1`，无 `subType`/`category` 字段，且分布不合理：
- city 10 个、company 6 个、district 4 个、street 2 个、community 2 个、station 3 个、logical 1 个
- 无 6 类资源打点（卫星便携包/移动油机/抢修车辆/应急通信车/无线队伍/传输队伍）
- 不匹配 PM §2.3 各层下属清单的节点数量

### 图例 Checkbox 过滤已实现（task003 / 003-map.md §9）

- legend-1 层级（city~community）有 8 个 Checkbox，`label` 为中文名
- `MapMarker.category` 字段需与 checkbox `label` 对应才参与过滤
- **关键**：checkbox label 是 `'卫星便捷包'`（非"便携包"），mock 数据的 `category` 必须用这个值

### 坐标体系

- `map-markers.json` 使用设计稿像素坐标（base.png 2880×1080）
- `OUTLINE_POSITION` 定义了各层 outline 在 base 上的偏移（见 [presets.ts#L93-L101](../../../web/pages/bj-cmcc-cmd-dispatcher/modules/map/presets.ts#L93-L101)）
- 打点 `left`/`top` 是相对 base 左上角的绝对像素坐标，不是相对 outline
- **本次 `left`/`top` 统一为 `0` 占位**，待后续按底图标定

## 三、落地方案

### 3.1 数据来源

[001-pm-output-data.md](../design/001-pm-output-data.md) §3.3 缩放后数量总表：

| 层级 | 节点数 | 资源数 | 合计 | 说明 |
|---|---|---|---|---|
| city | 4 | 32 | 36 | 4 分公司 + 6 类资源缩放 |
| company | 2 | 28 | 30 | 2 行政区 + 6 类资源缩放 |
| district | 8 | 12 | 20 | 8 街道 + 6 类资源各 2 |
| street | 12 | 7 | 19 | 5 社区 + 7 物理站 + 6 类资源（PM 完整数据） |
| community | 2 | 6 | 8 | 2 物理站 + 6 类资源各 1 |
| station | — | — | 3 | 保留现有 |
| logical | — | — | 1 | 保留现有 |
| **合计** | 28 | 85 | **117** | |

### 3.2 subType → category 映射

> **注意**：`category` 值必须与 [presets.ts](../../../web/pages/bj-cmcc-cmd-dispatcher/modules/map/presets.ts#L40-L49) `legendCheckboxes` 的 `label` 完全一致。

| 资源 | subType | category（checkbox label） | 图标文件 |
|---|---|---|---|
| 卫星便携包 | `sat-bag` | `'卫星便捷包'` | `sub-sat-bag.png` |
| 移动油机 | `generator` | `'移动油机'` | `sub-generator.png` |
| 抢修车辆 | `repair-vehicle` | `'抢修车辆'` | `sub-repair-vehicle.png` |
| 应急通信车 | `emergency-vehicle` | `'应急通信车'` | `sub-emergency-vehicle.png` |
| 无线队伍 | `wireless-team` | `'无线队伍'` | `sub-wireless-team.png` |
| 传输队伍 | `transmission-team` | `'传输队伍'` | `sub-transmission-team.png` |

### 3.3 生成方式

新建脚本 `scripts/gen-map-markers-mock.cjs`（CommonJS），按 [001-pm-output-data.md](../design/001-pm-output-data.md) §五 的 JSON 结构生成完整 `map-markers.json`。

脚本逻辑：
1. 各层节点：按 PM 下属清单的节点名 + status 映射生成，`left`/`top` 为 `0` 占位
2. 各层资源：按 §3.3 缩放后数量生成，带 `subType` + `category`，`status` 固定 `1`
3. street 物理站：带 `subType: 'td'`/`'nr'`（制式），无 `category`（不受 checkbox 过滤）
4. station / logical：保留现有 3+1 个点不变
5. 输出到 `public/static/mock/bj-cmcc-cmd-dispatcher/map-markers.json`

### 3.4 输出文件结构

```json
{
    "data": [
        // --- L1 city（36 个点）---
        // 4 个分公司节点（status 按 PM：正常=1，告警/退服中=0）
        { "left": 0, "top": 0, "status": 1, "type": "city" },
        { "left": 0, "top": 0, "status": 0, "type": "city" },
        { "left": 0, "top": 0, "status": 0, "type": "city" },
        { "left": 0, "top": 0, "status": 1, "type": "city" },
        // 32 个资源点（4 emergency-vehicle + 8 repair-vehicle + 8 generator + 4 sat-bag + 4 wireless-team + 4 transmission-team）
        { "left": 0, "top": 0, "status": 1, "type": "city", "subType": "emergency-vehicle", "category": "应急通信车" },
        // ... ×4
        { "left": 0, "top": 0, "status": 1, "type": "city", "subType": "repair-vehicle", "category": "抢修车辆" },
        // ... ×8
        { "left": 0, "top": 0, "status": 1, "type": "city", "subType": "generator", "category": "移动油机" },
        // ... ×8
        { "left": 0, "top": 0, "status": 1, "type": "city", "subType": "sat-bag", "category": "卫星便捷包" },
        // ... ×4
        { "left": 0, "top": 0, "status": 1, "type": "city", "subType": "wireless-team", "category": "无线队伍" },
        // ... ×4
        { "left": 0, "top": 0, "status": 1, "type": "city", "subType": "transmission-team", "category": "传输队伍" },
        // ... ×4

        // --- L2 company（30 个点）---
        // 2 个行政区节点 + 28 个资源点（4+8+4+4+4+4）

        // --- L3 district（20 个点）---
        // 8 个街道节点 + 12 个资源点（2+2+2+2+2+2）

        // --- L4 street（19 个点）---
        // 5 个社区节点（无 subType）
        // 7 个物理站节点（subType: td/nr，无 category）
        // 7 个资源点（2 emergency-vehicle + 1 repair-vehicle + 1 generator + 1 sat-bag + 1 wireless-team + 1 transmission-team）

        // --- L5 community（8 个点）---
        // 2 个物理站节点（subType: td/nr）
        // 6 个资源点（各 1）

        // --- station（保留现有 3 个）---
        { "left": 622, "top": 282, "status": 0, "type": "station", "subType": "td" },
        { "left": 820, "top": 431, "status": 0, "type": "station", "subType": "td" },
        { "left": 668, "top": 519, "status": 1, "type": "station", "subType": "nr" },

        // --- logical（保留现有 1 个）---
        { "left": 455, "top": 352, "status": 1, "type": "logical", "icon": "radar", "width": 460, "height": 448 }
    ]
}
```

### 3.5 脚本文件

- **位置**：`.trae/skills/oss-demonstrate-project-bj-cmcc-cmd-dispatcher/scripts/gen-map-markers-mock.cjs`
- **运行**：`node .trae/skills/oss-demonstrate-project-bj-cmcc-cmd-dispatcher/scripts/gen-map-markers-mock.cjs`
- **输出**：`public/static/mock/bj-cmcc-cmd-dispatcher/map-markers.json`

### 3.6 图标资源（不在本次范围）

6 类资源 × 5 层 = 30 张 `sub-*.png` 图标需准备到 `public/static/images/bj-cmcc-cmd-dispatcher/map/{level}/` 目录。本次只生成 mock 数据，不准备图标资源。图标缺失时 `getMarkerIcon` 会返回路径但图片 404，不影响 mock 数据结构验证。

## 四、不在本次范围

- ❌ 像素坐标标定（`left`/`top` 全为 `0` 占位，待后续按底图标定）
- ❌ 图标资源准备（30 张 `sub-*.png`）
- ❌ `history-timeline.json` 修改（task006 产物，本次不动）
- ❌ `presets.ts` 代码修改（`legendCheckboxes` label 已正确定义）
- ❌ `map-stage.tsx` 渲染逻辑修改（现有按 `m.type === currentLevel` 过滤逻辑不变）

## 五、验收标准

1. `node .trae/skills/oss-demonstrate-project-bj-cmcc-cmd-dispatcher/scripts/gen-map-markers-mock.cjs` 可成功运行，无报错
2. `public/static/mock/bj-cmcc-cmd-dispatcher/map-markers.json` 被正确覆写，JSON 合法
3. `data` 数组共 117 个点：city 36 + company 30 + district 20 + street 19 + community 8 + station 3 + logical 1
4. 资源打点带 `subType` 和 `category` 字段，`category` 值与 `legendCheckboxes` label 一致（特别是 `'卫星便捷包'` 不是"便携包"）
5. 节点打点 `status` 按 PM 状态映射（正常=1，告警/退服中=0），资源打点 `status` 固定 `1`
6. street 物理站带 `subType: 'td'`/`'nr'`，无 `category` 字段
7. station / logical 层保留现有坐标不变
8. 页面 `/bj-cmcc-cmd-dispatcher` 可正常打开，各层切换无运行时报错（坐标 0 时打点叠在左上角，属预期行为）

## 六、文档同步要求

| 触发动作 | 必须更新 |
|---|---|
| 新增 `scripts/gen-map-markers-mock.cjs` | `status/current.md`（scripts 清单）|
| 覆写 `map-markers.json` | `status/current.md`（mock 数据说明）|
| 新增 task 文件 | `roadmap.md`（看板勾选）|
| — | `status/checklist.md` 自检 |

## 七、看板

- [ ] 创建 `scripts/gen-map-markers-mock.cjs`
- [ ] 运行脚本生成 `map-markers.json`
- [ ] 验证 JSON 合法性 + 点数（117）
- [ ] 验证 `category` 值与 `legendCheckboxes` label 一致
- [ ] 验证页面 `/bj-cmcc-cmd-dispatcher` 正常打开
- [ ] 同步 `status/current.md`（scripts 清单 + mock 说明）
- [ ] 按 `status/checklist.md` 自检

## 八、PM 待澄清

| # | 事项 | 阻塞 | 说明 |
|---|---|---|---|
| 1 | 移动油机/卫星便携包按分公司拆分数量 | 否 | PM 仅给全网量级，L1/L2 按示意性数量取值（见 [001-pm-output-data.md](../design/001-pm-output-data.md) §3.4 缺口 #1/#2） |
| 2 | L3 石景山抢修车/油机/队伍数量 | 否 | PM 仅给应急通信车在位 2，L3 按每类 2 个补齐（缺口 #4） |
| 3 | L5 东山社区资源数量 | 否 | PM 仅明确应急通信车 1 辆，L5 按每类 1 个补齐（缺口 #5） |
| 4 | 像素坐标标定 | 否 | `left`/`top` 为 `0` 占位，待后续按底图标定 |

---

## 九、执行记录（2026-08-26）

### 9.1 方案调整

- **原方案**：所有点 `left`/`top` 统一 `0` 占位，待后续按底图标定
- **新方案（用户拍板）**：每层用户提供一个粗略的多边形轮廓数据，脚本在多边形内**按 PM 业务语义分布**（非均匀、非全 0）
- **范围**：本轮仅完成 L1 city 层（4 分公司 + 32 资源 = 36 个点），L2~L5 逐层补充

### 9.2 L1 city 生成结果（2026-08-26 完成）

- **新增脚本**：[gen-map-markers-mock.cjs](../../../scripts/gen-map-markers-mock.cjs)
- **生成输出**：[map-markers.json](../../../public/static/mock/bj-cmcc-cmd-dispatcher/map-markers.json)
- **L1 city 多边形**（用户提供 12 点，绝对像素坐标 base.png 2880×1080 体系）：

  ```
  [(708, 209), (478, 358), (493, 492), (340, 609),
   (385, 750), (639, 745), (757, 723), (725, 561),
   (874, 524), (929, 479), (867, 313), (711, 208)]
  ```

- **分布策略**：
  - 4 分公司节点分散到多边形 4 个象限（左上/右上/左下/右下子区域 + 80px 最小间距）
  - emergency-vehicle / sat-bag / wireless-team / transmission-team（各 4 个）：每个分公司锚点附近 70px 半径内聚集 1 个，体现"资源隶属分公司"
  - repair-vehicle / generator（各 8 个）：多边形内均匀散布（25px 最小间距），前 3 个靠近退服中的城区三锚点（90px 半径），呼应告警/退服密度
  - 固定随机种子 `20260826`，可复现

- **校验结果**：
  - city 点数 36 ✓（4 节点 + 32 资源）
  - 分公司 status 1/0/0/1 ✓（正常/告警/退服中/正常）
  - 资源点数 emergency 4 / repair 8 / generator 8 / sat-bag 4 / wireless 4 / transmission 4 = 32 ✓
  - `category` 值与 presets.ts legendCheckboxes label 一致（包括 `'卫星便捷包'`） ✓
  - station / logical 3+1 个点保留现有坐标 ✓
  - 当前 mock 合计 40 个点（city 36 + station 3 + logical 1）

### 9.3 渲染逻辑兼容性确认

> 来源：[map-stage.tsx#L108-L122](../../../web/pages/bj-cmcc-cmd-dispatcher/modules/map/map-stage.tsx#L108-L122)

mock 数据结构与 [MapMarker 类型](../../../web/pages/bj-cmcc-cmd-dispatcher/modules/map/types.ts#L36-L49) 完全兼容：
- 字段 `left/top/status/type/subType/category/icon/width/height` 全部被识别
- `getMarkerIcon` 优先取 `sub-${subType}.png` ✓
- logical 层 `icon: 'radar'` 走特殊路径 ✓
- legend checkbox 过滤走 `m.category` ✓

**注意点（不影响 city 渲染但需知晓）**：
- L1 city / L2 company / L3 district 是 `EFFECTIVE_LEVELS`，**优先用 `history-timeline.json`**（按 currentTimeIndex 取），fallback 才走 markerData
- 当前 `history-timeline.json` 的 city markers 用的是旧坐标（661/253 等），**L1 city 默认视图看不到新坐标**
- 验证方法：手动下钻到 street / community 层（这两层走 markerData），或修改 `map-stage.tsx#L110` 的判断临时禁用 historyData
- 待办：history-timeline 的坐标需要从 map-markers.json 同步（建议在 L2~L5 全部完成后做一次对齐）

### 9.4 下一步

- [ ] 用户手动验证 L1 city 渲染（切换层级、查看打点位置）
- [ ] 提供 L2 company 多边形轮廓数据 → 生成 30 个点（2 行政区 + 28 资源）
- [ ] 提供 L3 district 多边形轮廓数据 → 生成 20 个点（8 街道 + 12 资源）
- [ ] 提供 L4 street 多边形轮廓数据 → 生成 19 个点（5 社区 + 7 物理站 + 7 资源）
- [ ] 提供 L5 community 多边形轮廓数据 → 生成 8 个点（2 物理站 + 6 资源）
- [ ] L2~L5 完成后，统一更新 history-timeline.json 的坐标
- [ ] 同步 status/current.md（scripts 清单 + mock 数据说明）
- [ ] 按 status/checklist.md 自检
- [ ] 任务完成后整体移入 plans/done/

---

## 文档元信息

> **日期**：2026-08-25（创建）/ 2026-08-26（更新 L1 city）
> **状态**：进行中
