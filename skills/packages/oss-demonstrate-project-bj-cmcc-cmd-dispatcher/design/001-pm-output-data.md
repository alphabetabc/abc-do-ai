# 001-pm-output-data：前五层地图打点数据（广宁东山链路）

> 文档定位：基于 [000-pm-北京移动大屏下钻样例数据-广宁东山链路.md](./000-pm-北京移动大屏下钻样例数据-广宁东山链路.md) 各层"下属清单"表 + §L3"资源打点清单"，整理出前五层（city / company / district / street / community）地图所需的节点打点 + 6 类资源打点数据。
> 数据用途：写入 `public/static/mock/bj-cmcc-cmd-dispatcher/map-markers.json`，供 `map-stage.tsx` 按 `m.type === currentLevel` 过滤渲染。
> 图标规则：`getMarkerIcon(level, marker)` —— 有 `subType` 时取 `sub-${subType}.png`，否则取 `${status}.png`（见 [presets.ts](web/pages/bj-cmcc-cmd-dispatcher/modules/map/presets.ts#L17-L22)）。

---

## 一、层级口径与数据来源

| 代码层级  | PM 层级                   | 地图底图       | 节点数据来源（下属清单表）                              | 资源数据来源                           |
| --------- | ------------------------- | -------------- | ------------------------------------------------------- | -------------------------------------- |
| city      | L1 分公司（北京移动全市） | city 底图      | §2.3 分公司级兄弟节点（4 个分公司）                     | §2.3 合计行（全网编制）                |
| company   | L2 行政区（城区三分公司） | company 底图   | L1 下属行政区清单（石景山/门头沟 2 区）                 | §2.3 城区三行（编制）+ L2 画像（在位） |
| district  | L3 街道（石景山区）       | district 底图  | L2 下属街道清单（8 个街道）                             | L2 画像"应急通信车在位 2"              |
| street    | L4 社区（广宁街道）       | street 底图    | L3 下属社区清单（5 个社区）+ 物理站清单（7 站重点子集） | §L3 资源打点清单（6 类资源完整数据）   |
| community | L5 物理站（东山社区）     | community 底图 | L4 下属物理站清单（2 站）                               | §L3 资源打点清单（东山社区辖区子集）   |

> **关键口径**：PM §2.4 明确"资源打点在 L1–L4 全层级呈现（作用域随下钻收窄）"。资源打点数量以 PM 编制为基准，但需结合底图实际尺寸做**按比例缩放**（见 §三）。

---

## 二、6 类资源 subType 映射

| 资源类型（PM 口径） | subType 值          | 图标文件                    | 打点色系         |
| ------------------- | ------------------- | --------------------------- | ---------------- |
| 卫星便携包          | `sat-bag`           | `sub-sat-bag.png`           | 物资橙 `#FA8C16` |
| 移动油机            | `generator`         | `sub-generator.png`         | 物资橙 `#FA8C16` |
| 抢修车辆            | `repair-vehicle`    | `sub-repair-vehicle.png`    | 车辆蓝 `#40A9FF` |
| 应急通信车          | `emergency-vehicle` | `sub-emergency-vehicle.png` | 车辆蓝 `#40A9FF` |
| 无线队伍            | `wireless-team`     | `sub-wireless-team.png`     | 人员青 `#13C2C2` |
| 传输队伍            | `transmission-team` | `sub-transmission-team.png` | 人员青 `#13C2C2` |

> subType 命名遵循 `getMarkerIcon` 的 `sub-${subType}.png` 约定，需同步准备对应图标资源到 `public/static/images/bj-cmcc-cmd-dispatcher/map/{level}/` 目录。

---

## 三、各层资源数量总表

### 3.1 PM 原始编制数量

> 以下数量**全部来自 PM 原文**。"—"表示 PM 未给出该层该类资源的数量。

| 层级                   | 应急通信车            | 抢修车 | 移动油机  | 卫星便携包 | 无线队伍 | 传输队伍 | PM 出处                 |
| ---------------------- | --------------------- | ------ | --------- | ---------- | -------- | -------- | ----------------------- |
| **L1 city 全网**       | 40                    | 240    | 1000~2000 | 80~150     | —        | —        | §2.3 合计行 + 脚注      |
| ├ 城区一分公司         | 8                     | 60     | —         | —          | —        | —        | §2.3 城区一行           |
| ├ 城区二分公司         | 9                     | 65     | —         | —          | —        | —        | §2.3 城区二行           |
| ├ 城区三分公司 ◄       | 12                    | 45     | —         | —          | 14       | 10       | §2.3 城区三行 + 脚注    |
| └ 郊区分公司           | 11                    | 70     | —         | —          | —        | —        | §2.3 郊区行             |
| **L2 company 城区三**  | 12（编制）/ 4（在位） | 45     | —         | —          | 14       | 10       | §2.3 城区三行 + L1 画像 |
| **L3 district 石景山** | 2（在位）             | —      | —         | —          | —        | —        | L2 画像                 |
| **L4 street 广宁**     | 2                     | 1      | 1         | 1          | 1        | 1        | §L3 资源打点清单        |
| **L5 community 东山**  | 1                     | —      | —         | —          | —        | —        | §关联性说明 3           |

### 3.2 底图尺寸约束

> 打点图标尺寸 48×48px（`0.png`/`1.png`）。考虑间距和可读性，每类图标建议占位 ≥ 60×60px（含间距），单层总点数上限 ≈ outline 面积 / 3600。

| 层级      | outline.png 尺寸 | outline 面积 | 理论最大点数 | 建议点数上限 | 实际可读上限 |
| --------- | ---------------- | ------------ | ------------ | ------------ | ------------ |
| city      | 740 × 757        | 560,180      | ≈155         | **≤ 60**     | ~40          |
| company   | 997 × 582        | 580,254      | ≈161         | **≤ 60**     | ~40          |
| district  | 662 × 698        | 462,076      | ≈128         | **≤ 50**     | ~35          |
| street    | 678 × 665        | 450,870      | ≈125         | **≤ 50**     | ~35          |
| community | 625 × 539        | 336,875      | ≈93          | **≤ 35**     | ~25          |

### 3.3 按比例缩放后的实际打点数量

> **缩放原则**：保持各资源类型间的编制比例关系，总点数控制在可读上限内。L4/L5 已在可读范围内，不缩放。

| 层级             | 应急通信车 | 抢修车 | 移动油机 | 卫星便携包 | 无线队伍 | 传输队伍 | 合计   | PM 编制合计 | 缩放比 |
| ---------------- | ---------- | ------ | -------- | ---------- | -------- | -------- | ------ | ----------- | ------ |
| **L1 city**      | 4          | 8      | 8        | 4          | 4        | 4        | **32** | 1480        | ~2%    |
| **L2 company**   | 4          | 8      | 4        | 4          | 4        | 4        | **28** | 81          | ~35%   |
| **L3 district**  | 2          | 2      | 2        | 2          | 2        | 2        | **12** | —           | —      |
| **L4 street**    | 2          | 1      | 1        | 1          | 1        | 1        | **7**  | 7           | 100%   |
| **L5 community** | 1          | 1      | 1        | 1          | 1        | 1        | **6**  | —           | —      |

**缩放说明：**

-   **L1 city**（outline 740×757）：PM 编制 1480 个点无法承载，按 ~2% 缩放至 32 个点。保持 6 类资源比例（应急通信车:抢修车:油机:便携包:无线:传输 ≈ 40:240:1000:80:70:50），但因油机编制过大（1000），缩放后也只取 8 个示意点。4 个分公司节点 + 32 个资源点 = 36 个点，在可读范围内。
-   **L2 company**（outline 997×582）：PM 编制 81 个点（缺油机/便携包），按 ~35% 缩放至 28 个点。应急通信车取在位数 4（编制 12 太多），其余按比例缩放。2 个行政区节点 + 28 个资源点 = 30 个点。
-   **L3 district**（outline 662×698）：PM 仅给应急通信车 2，其余 5 类缺口。按"每类 2 个"补齐（演示子集口径），共 12 个资源点。8 个街道节点 + 12 个资源点 = 20 个点。
-   **L4 street**（outline 678×665）：PM 完整数据，7 个资源点不缩放。5 社区 + 7 物理站 + 7 资源 = 19 个点。
-   **L5 community**（outline 625×539）：PM 仅给应急通信车 1。按"每类 1 个"补齐（东山综合基站驻守子集），共 6 个资源点。2 物理站 + 6 资源 = 8 个点。

### 3.4 PM 数据缺口

| #   | 缺口                          | PM 现有数据          | 处理方式                                                |
| --- | ----------------------------- | -------------------- | ------------------------------------------------------- |
| 1   | 移动油机按分公司/行政区拆分   | 仅全网 1000~2000 台  | L1 按 8 个示意点；L2 按 4 个示意点；L3/L5 按每类 2/1 个 |
| 2   | 卫星便携包按分公司/行政区拆分 | 仅全网 80~150 套     | 同上                                                    |
| 3   | 无线/传输队伍全网总量         | 仅城区三 14+10=24 支 | L1 按 4+4 示意点                                        |
| 4   | L3 石景山抢修车/油机/队伍     | 仅应急通信车在位 2   | L3 按每类 2 个示意点                                    |
| 5   | L5 东山社区资源数量           | 仅应急通信车 1       | L5 按每类 1 个示意点（东山综合基站驻守）                |

---

## 四、各层打点数据

> **坐标说明**：PM 给出的是真实经纬度，`map-markers.json` 使用设计稿像素坐标。`left`/`top` 待按各层底图 PNG 标定。**数量按 §3.3 缩放后结果**。

### 4.1 L1 city（北京移动 · 全网）

> 节点来源：§2.3 分公司兄弟节点表（4 个分公司）。
> 资源来源：§2.3 合计行（全网编制），按 §3.3 缩放至 32 个点（outline 740×757 可读范围内）。

**节点打点（4 个分公司）：**

| 序号 | 节点           | status | PM 状态 | PM 出处 |
| ---- | -------------- | ------ | ------- | ------- |
| 1    | 城区一分公司   | 1      | 正常    | §2.3    |
| 2    | 城区二分公司   | 0      | 告警    | §2.3    |
| 3    | 城区三分公司 ◄ | 0      | 退服中  | §2.3    |
| 4    | 郊区分公司     | 1      | 正常    | §2.3    |

**资源打点（全网编制缩放 · 共 32 个点）：**

| 资源       | subType             | 数量  | PM 编制 | 缩放说明             |
| ---------- | ------------------- | ----- | ------- | -------------------- |
| 应急通信车 | `emergency-vehicle` | **4** | 40      | ~10%，4 个分公司各 1 |
| 抢修车辆   | `repair-vehicle`    | **8** | 240     | ~3%，按比例取 8      |
| 移动油机   | `generator`         | **8** | 1000    | ~1%，示意性取 8      |
| 卫星便携包 | `sat-bag`           | **4** | 80      | ~5%，4 个分公司各 1  |
| 无线队伍   | `wireless-team`     | **4** | ≈70     | ~6%，4 个分公司各 1  |
| 传输队伍   | `transmission-team` | **4** | ≈50     | ~8%，4 个分公司各 1  |

### 4.2 L2 company（城区三分公司）

> 节点来源：L1 下属行政区清单（2 个区）。
> 资源来源：§2.3 城区三编制，按 §3.3 缩放至 28 个点（outline 997×582 可读范围内）。应急通信车取在位数 4。

**节点打点（2 个行政区）：**

| 序号 | 节点       | status | PM 状态 | PM 出处           |
| ---- | ---------- | ------ | ------- | ----------------- |
| 1    | 石景山区 ◄ | 0      | 告警    | L1 下属行政区清单 |
| 2    | 门头沟区   | 1      | 正常    | L1 下属行政区清单 |

**资源打点（城区三编制缩放 · 共 28 个点）：**

| 资源       | subType             | 数量  | PM 编制      | 缩放说明         |
| ---------- | ------------------- | ----- | ------------ | ---------------- |
| 应急通信车 | `emergency-vehicle` | **4** | 12（在位 4） | 取在位数 4       |
| 抢修车辆   | `repair-vehicle`    | **8** | 45           | ~18%             |
| 移动油机   | `generator`         | **4** | —            | 缺口，示意性取 4 |
| 卫星便携包 | `sat-bag`           | **4** | —            | 缺口，示意性取 4 |
| 无线队伍   | `wireless-team`     | **4** | 14           | ~29%             |
| 传输队伍   | `transmission-team` | **4** | 10           | ~40%             |

### 4.3 L3 district（石景山区）

> 节点来源：L2 下属街道清单（8 个街道）。
> 资源来源：L2 画像仅给出"应急通信车在位 2"，其余 5 类缺口按"每类 2 个"补齐（共 12 个点）。

**节点打点（8 个街道）：**

| 序号 | 节点       | status | PM 退服合计 | PM 状态 | PM 出处         |
| ---- | ---------- | ------ | ----------- | ------- | --------------- |
| 1    | 广宁街道 ◄ | 0      | 2           | 退服中  | L2 下属街道清单 |
| 2    | 古城街道   | 0      | 1           | 告警    | L2 下属街道清单 |
| 3    | 金顶街街道 | 1      | 0           | 正常    | L2 下属街道清单 |
| 4    | 苹果园街道 | 0      | 1           | 告警    | L2 下属街道清单 |
| 5    | 八角街道   | 1      | 0           | 正常    | L2 下属街道清单 |
| 6    | 五里坨街道 | 1      | 0           | 正常    | L2 下属街道清单 |
| 7    | 鲁谷街道   | 1      | 0           | 正常    | L2 下属街道清单 |
| 8    | 模式口片区 | 1      | 0           | 正常    | L2 下属街道清单 |

**资源打点（石景山区级 · PM 仅给应急通信车 · 共 12 个点）：**

| 资源       | subType             | 数量  | PM 数据 | 说明                       |
| ---------- | ------------------- | ----- | ------- | -------------------------- |
| 应急通信车 | `emergency-vehicle` | **2** | 在位 2  | PM 明确（驻守 1 + 行进 1） |
| 抢修车辆   | `repair-vehicle`    | **2** | —       | 缺口 #4，示意性取 2        |
| 移动油机   | `generator`         | **2** | —       | 缺口 #4，示意性取 2        |
| 卫星便携包 | `sat-bag`           | **2** | —       | 缺口 #4，示意性取 2        |
| 无线队伍   | `wireless-team`     | **2** | —       | 缺口 #4，示意性取 2        |
| 传输队伍   | `transmission-team` | **2** | —       | 缺口 #4，示意性取 2        |

### 4.4 L4 street（广宁街道）★ 基准层

> 节点来源：L3 下属社区清单（5 社区）+ 物理站清单（7 站重点子集）。
> 资源来源：§L3 资源打点清单，6 类资源均有 PM 完整数据（经纬度+状态+编号）。

**节点打点 — 社区（5 个）：**

| 序号 | 节点       | status | PM 退服合计 | PM 状态 | PM 出处         |
| ---- | ---------- | ------ | ----------- | ------- | --------------- |
| 1    | 东山社区 ◄ | 0      | 1           | 退服中  | L3 下属社区清单 |
| 2    | 新立街社区 | 1      | 0           | 正常    | L3 下属社区清单 |
| 3    | 高井路社区 | 0      | 1           | 告警    | L3 下属社区清单 |
| 4    | 麻峪社区   | 1      | 0           | 正常    | L3 下属社区清单 |
| 5    | 麻峪北社区 | 1      | 0           | 正常    | L3 下属社区清单 |

**节点打点 — 物理站（7 站重点子集）：**

| 序号 | 物理站名         | status | PM 经纬度         | PM 状态 | PM 出处        |
| ---- | ---------------- | ------ | ----------------- | ------- | -------------- |
| 1    | 广宁东山综合基站 | 0      | 116.1086, 39.9253 | 退服中  | §L3 物理站清单 |
| 2    | 广宁新立街基站   | 1      | 116.1152, 39.9288 | 正常    | §L3 物理站清单 |
| 3    | 广宁高井路基站   | 0      | 116.0954, 39.9182 | 告警    | §L3 物理站清单 |
| 4    | 广宁麻峪村基站   | 1      | 116.0851, 39.9356 | 正常    | §L3 物理站清单 |
| 5    | 广宁麻峪北基站   | 1      | 116.0903, 39.9421 | 正常    | §L3 物理站清单 |
| 6    | 广宁高井新村室分 | 1      | 116.0998, 39.9215 | 正常    | §L3 物理站清单 |
| 7    | 广宁电厂路微站   | 1      | 116.1118, 39.9301 | 正常    | §L3 物理站清单 |

**资源打点（6 类资源 · PM 完整数据 · 共 2+1+1+1+1+1 = 7 个点）：**

| 序号 | 资源       | subType             | 数量  | PM 经纬度                           | 说明                              | PM 出处           |
| ---- | ---------- | ------------------- | ----- | ----------------------------------- | --------------------------------- | ----------------- |
| 1    | 应急通信车 | `emergency-vehicle` | **2** | ①116.1070,39.9248 ②116.0972,39.9190 | 京A·01驻守东山 + 京A·03行进高井路 | §L3 资源清单-车辆 |
| 2    | 抢修车辆   | `repair-vehicle`    | **1** | 116.1128, 39.9295                   | 京A·12，行进中，前往东山综合基站  | §L3 资源清单-车辆 |
| 3    | 移动油机   | `generator`         | **1** | 116.0956, 39.9184                   | YJ-02，已启动，高井路基站         | §L3 资源清单-物资 |
| 4    | 卫星便携包 | `sat-bag`           | **1** | 116.1088, 39.9255                   | YJB-01，已部署，东山综合基站      | §L3 资源清单-物资 |
| 5    | 无线队伍   | `wireless-team`     | **1** | 116.1084, 39.9252                   | 无线保障一队 4 人，作业中         | §L3 资源清单-人员 |
| 6    | 传输队伍   | `transmission-team` | **1** | 116.0985, 39.9188                   | 传输保障二队 3 人，行进中         | §L3 资源清单-人员 |

### 4.5 L5 community（东山社区）

> 节点来源：L4 下属物理站清单（2 站）。
> 资源来源：§关联性说明 3 明确应急通信车 1 辆，其余按"每类 1 个"补齐（东山综合基站驻守子集，共 6 个点）。

**节点打点 — 物理站（2 个）：**

| 序号 | 物理站名           | status | PM 经纬度         | PM 状态 | PM 出处           |
| ---- | ------------------ | ------ | ----------------- | ------- | ----------------- |
| 1    | 广宁东山综合基站 ◄ | 0      | 116.1086, 39.9253 | 退服中  | L4 下属物理站清单 |
| 2    | 广宁电厂路微站     | 1      | 116.1118, 39.9301 | 正常    | L4 下属物理站清单 |

**资源打点（东山综合基站驻守子集 · 共 6 个点）：**

| 资源       | subType             | 数量  | PM 数据       | 说明                                        |
| ---------- | ------------------- | ----- | ------------- | ------------------------------------------- |
| 应急通信车 | `emergency-vehicle` | **1** | §关联性说明 3 | 京A·01，驻守东山综合基站（PM 明确）         |
| 抢修车辆   | `repair-vehicle`    | **1** | 缺口 #5       | 京A·12，前往东山综合基站（L4 有数据）       |
| 移动油机   | `generator`         | **1** | 缺口 #5       | 示意性（油机在高井路，L5 是否呈现待确认）   |
| 卫星便携包 | `sat-bag`           | **1** | 缺口 #5       | YJB-01，东山综合基站应急回传（L4 有数据）   |
| 无线队伍   | `wireless-team`     | **1** | 缺口 #5       | 无线保障一队，东山综合基站作业（L4 有数据） |
| 传输队伍   | `transmission-team` | **1** | 缺口 #5       | 示意性（队伍前往高井路，L5 是否呈现待确认） |

---

## 五、map-markers.json 数据片段（待合入）

> 以下为**数据结构示意**，`left`/`top` 统一为 `0` 占位，待按各层底图 PNG 标定。`status` 按 PM 状态映射（正常=1，告警/退服中=0），资源 `status` 固定 `1`。数量按 §3.3 缩放后结果。

### 5.1 L1 city（4 节点 + 32 资源 = 36 个点）

```json
{ "left": 0, "top": 0, "status": 1, "type": "city" },
{ "left": 0, "top": 0, "status": 0, "type": "city" },
{ "left": 0, "top": 0, "status": 0, "type": "city" },
{ "left": 0, "top": 0, "status": 1, "type": "city" },
{ "left": 0, "top": 0, "status": 1, "type": "city", "subType": "emergency-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "city", "subType": "emergency-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "city", "subType": "emergency-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "city", "subType": "emergency-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "city", "subType": "repair-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "city", "subType": "repair-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "city", "subType": "repair-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "city", "subType": "repair-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "city", "subType": "repair-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "city", "subType": "repair-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "city", "subType": "repair-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "city", "subType": "repair-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "city", "subType": "generator" },
{ "left": 0, "top": 0, "status": 1, "type": "city", "subType": "generator" },
{ "left": 0, "top": 0, "status": 1, "type": "city", "subType": "generator" },
{ "left": 0, "top": 0, "status": 1, "type": "city", "subType": "generator" },
{ "left": 0, "top": 0, "status": 1, "type": "city", "subType": "generator" },
{ "left": 0, "top": 0, "status": 1, "type": "city", "subType": "generator" },
{ "left": 0, "top": 0, "status": 1, "type": "city", "subType": "generator" },
{ "left": 0, "top": 0, "status": 1, "type": "city", "subType": "generator" },
{ "left": 0, "top": 0, "status": 1, "type": "city", "subType": "sat-bag" },
{ "left": 0, "top": 0, "status": 1, "type": "city", "subType": "sat-bag" },
{ "left": 0, "top": 0, "status": 1, "type": "city", "subType": "sat-bag" },
{ "left": 0, "top": 0, "status": 1, "type": "city", "subType": "sat-bag" },
{ "left": 0, "top": 0, "status": 1, "type": "city", "subType": "wireless-team" },
{ "left": 0, "top": 0, "status": 1, "type": "city", "subType": "wireless-team" },
{ "left": 0, "top": 0, "status": 1, "type": "city", "subType": "wireless-team" },
{ "left": 0, "top": 0, "status": 1, "type": "city", "subType": "wireless-team" },
{ "left": 0, "top": 0, "status": 1, "type": "city", "subType": "transmission-team" },
{ "left": 0, "top": 0, "status": 1, "type": "city", "subType": "transmission-team" },
{ "left": 0, "top": 0, "status": 1, "type": "city", "subType": "transmission-team" },
{ "left": 0, "top": 0, "status": 1, "type": "city", "subType": "transmission-team" }
```

### 5.2 L2 company（2 节点 + 28 资源 = 30 个点）

```json
{ "left": 0, "top": 0, "status": 0, "type": "company" },
{ "left": 0, "top": 0, "status": 1, "type": "company" },
{ "left": 0, "top": 0, "status": 1, "type": "company", "subType": "emergency-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "company", "subType": "emergency-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "company", "subType": "emergency-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "company", "subType": "emergency-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "company", "subType": "repair-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "company", "subType": "repair-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "company", "subType": "repair-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "company", "subType": "repair-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "company", "subType": "repair-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "company", "subType": "repair-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "company", "subType": "repair-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "company", "subType": "repair-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "company", "subType": "generator" },
{ "left": 0, "top": 0, "status": 1, "type": "company", "subType": "generator" },
{ "left": 0, "top": 0, "status": 1, "type": "company", "subType": "generator" },
{ "left": 0, "top": 0, "status": 1, "type": "company", "subType": "generator" },
{ "left": 0, "top": 0, "status": 1, "type": "company", "subType": "sat-bag" },
{ "left": 0, "top": 0, "status": 1, "type": "company", "subType": "sat-bag" },
{ "left": 0, "top": 0, "status": 1, "type": "company", "subType": "sat-bag" },
{ "left": 0, "top": 0, "status": 1, "type": "company", "subType": "sat-bag" },
{ "left": 0, "top": 0, "status": 1, "type": "company", "subType": "wireless-team" },
{ "left": 0, "top": 0, "status": 1, "type": "company", "subType": "wireless-team" },
{ "left": 0, "top": 0, "status": 1, "type": "company", "subType": "wireless-team" },
{ "left": 0, "top": 0, "status": 1, "type": "company", "subType": "wireless-team" },
{ "left": 0, "top": 0, "status": 1, "type": "company", "subType": "transmission-team" },
{ "left": 0, "top": 0, "status": 1, "type": "company", "subType": "transmission-team" },
{ "left": 0, "top": 0, "status": 1, "type": "company", "subType": "transmission-team" },
{ "left": 0, "top": 0, "status": 1, "type": "company", "subType": "transmission-team" }
```

### 5.3 L3 district（8 节点 + 12 资源 = 20 个点）

```json
{ "left": 0, "top": 0, "status": 0, "type": "district" },
{ "left": 0, "top": 0, "status": 0, "type": "district" },
{ "left": 0, "top": 0, "status": 1, "type": "district" },
{ "left": 0, "top": 0, "status": 0, "type": "district" },
{ "left": 0, "top": 0, "status": 1, "type": "district" },
{ "left": 0, "top": 0, "status": 1, "type": "district" },
{ "left": 0, "top": 0, "status": 1, "type": "district" },
{ "left": 0, "top": 0, "status": 1, "type": "district" },
{ "left": 0, "top": 0, "status": 1, "type": "district", "subType": "emergency-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "district", "subType": "emergency-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "district", "subType": "repair-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "district", "subType": "repair-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "district", "subType": "generator" },
{ "left": 0, "top": 0, "status": 1, "type": "district", "subType": "generator" },
{ "left": 0, "top": 0, "status": 1, "type": "district", "subType": "sat-bag" },
{ "left": 0, "top": 0, "status": 1, "type": "district", "subType": "sat-bag" },
{ "left": 0, "top": 0, "status": 1, "type": "district", "subType": "wireless-team" },
{ "left": 0, "top": 0, "status": 1, "type": "district", "subType": "wireless-team" },
{ "left": 0, "top": 0, "status": 1, "type": "district", "subType": "transmission-team" },
{ "left": 0, "top": 0, "status": 1, "type": "district", "subType": "transmission-team" }
```

### 5.4 L4 street（5 社区 + 7 物理站 + 7 资源 = 19 个点）

```json
{ "left": 0, "top": 0, "status": 0, "type": "street" },
{ "left": 0, "top": 0, "status": 1, "type": "street" },
{ "left": 0, "top": 0, "status": 0, "type": "street" },
{ "left": 0, "top": 0, "status": 1, "type": "street" },
{ "left": 0, "top": 0, "status": 1, "type": "street" },
{ "left": 0, "top": 0, "status": 0, "type": "street", "subType": "td" },
{ "left": 0, "top": 0, "status": 1, "type": "street", "subType": "nr" },
{ "left": 0, "top": 0, "status": 0, "type": "street", "subType": "td" },
{ "left": 0, "top": 0, "status": 1, "type": "street", "subType": "nr" },
{ "left": 0, "top": 0, "status": 1, "type": "street", "subType": "td" },
{ "left": 0, "top": 0, "status": 1, "type": "street", "subType": "nr" },
{ "left": 0, "top": 0, "status": 1, "type": "street", "subType": "nr" },
{ "left": 0, "top": 0, "status": 1, "type": "street", "subType": "emergency-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "street", "subType": "emergency-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "street", "subType": "repair-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "street", "subType": "generator" },
{ "left": 0, "top": 0, "status": 1, "type": "street", "subType": "sat-bag" },
{ "left": 0, "top": 0, "status": 1, "type": "street", "subType": "wireless-team" },
{ "left": 0, "top": 0, "status": 1, "type": "street", "subType": "transmission-team" }
```

### 5.5 L5 community（2 物理站 + 6 资源 = 8 个点）

```json
{ "left": 0, "top": 0, "status": 0, "type": "community", "subType": "td" },
{ "left": 0, "top": 0, "status": 1, "type": "community", "subType": "nr" },
{ "left": 0, "top": 0, "status": 1, "type": "community", "subType": "emergency-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "community", "subType": "repair-vehicle" },
{ "left": 0, "top": 0, "status": 1, "type": "community", "subType": "generator" },
{ "left": 0, "top": 0, "status": 1, "type": "community", "subType": "sat-bag" },
{ "left": 0, "top": 0, "status": 1, "type": "community", "subType": "wireless-team" },
{ "left": 0, "top": 0, "status": 1, "type": "community", "subType": "transmission-team" }
```

---

## 六、待确认事项

| #   | 事项                            | 说明                                                                      |
| --- | ------------------------------- | ------------------------------------------------------------------------- |
| 1   | 移动油机/卫星便携包按分公司拆分 | PM 仅给全网量级（1000~2000 / 80~150），L1/L2 按示意性数量取值，需 PM 确认 |
| 2   | L3 石景山抢修车/油机/队伍数量   | PM 仅给应急通信车在位 2，L3 按每类 2 个补齐，需 PM 确认                   |
| 3   | L5 东山社区资源数量             | PM 仅明确应急通信车 1 辆，L5 按每类 1 个补齐，需 PM 确认                  |
| 4   | 像素坐标标定                    | 所有 `left`/`top` 待按各层底图 PNG 标定                                   |
| 5   | 图标资源                        | 6 类 × 5 层 = 30 张 `sub-*.png` 需准备                                    |

---

## 文档元信息

| 项       | 值                                                                                                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 创建日期 | 2026-08-25                                                                                                                                                                     |
| 数据来源 | [000-pm-北京移动大屏下钻样例数据-广宁东山链路.md](./000-pm-北京移动大屏下钻样例数据-广宁东山链路.md) §2.3 分公司兄弟节点 + L1–L4 各层下属清单 + §L3 资源打点清单 + §关联性说明 |
| 代码引用 | [presets.ts](web/pages/bj-cmcc-cmd-dispatcher/modules/map/presets.ts) / [map-markers.json](public/static/mock/bj-cmcc-cmd-dispatcher/map-markers.json)       |
| 状态     | 数量已按 PM 编制对齐，待 PM 补缺口 + 待标定坐标                                                                                                                                |
