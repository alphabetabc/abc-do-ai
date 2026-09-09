---
name: "gd-es-next-interaction-fields"
description: "辅助型 Skill。维护项目跨模块交互字段注册表（apps/main/app/components/fields.ts）与 useDispatch/useSubscribe 用法、派发/消费映射。当被其他 skill 调用时，自动扫描代码验证派发/消费方是否最新；其他 skill 描述跨模块数据流时引用本 skill 避免重复描述。Invoke when (1) 其他 skill 需要描述字段/数据流；(2) 怀疑某字段的派发方或消费方发生变化；(3) 新增/修改/废弃字段时。DO NOT 用于描述模块内部状态管理（zustand store 等）。"
---

# 跨模块交互字段维护 Skill

> **职责定位**：本 Skill 是**辅助型**，**不**独立响应用户任务。被其他 Skill 调用以共享"字段注册表 + 派发消费映射"，避免每个模块 Skill 重复描述。
>
> **本 Skill 文档结构约定**（团队内部约定，违反者视为 PR 不通过）：
>
> - 字段注册表与映射表只在本文档维护一次
> - 字段的具体使用细节（payload 形状、业务逻辑）由**对应的模块 Skill** 描述
> - 版本号只在 frontmatter 与本文档末尾的"版本信息"表中出现
> - 行号引用为"近似锚点"，以 `grep -n` 验证为准

---

## TL;DR（30 秒）

| 维度         | 速记                                                                                                     |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| **字段源**   | `apps/main/app/components/fields.ts`（`defineFields` 注册，9 个字段）                                    |
| **派发 API** | `useDispatch()` → `dispatch(fieldDescriptor, payload)`                                                   |
| **订阅 API** | `useSubscribe({ [localKey]: fieldDescriptor })` → `{ [localKey]: payload }`                              |
| **存储**     | `apps/main/store/useInteractionStore.ts`（Zustand + immer，**全局单例**）                                |
| **映射检查** | `Grep "dispatch(.*widgetFields.getField"` + `Grep "useSubscribe\("` 两组命令，详见 [自动检查](#自动检查) |
| **新增字段** | `fields.ts` 注册 → 派发方写 `dispatch(getField("..."), payload)` → 消费方 `useSubscribe`                 |

---

## 1. 字段注册表

> 单一事实源：[apps/main/app/components/fields.ts](apps/main/app/components/fields.ts)
>
> **同步规则**：本表与 `fields.ts` 严格 1:1 对应；任意字段增删/改名时，**必须**同步更新本表 + 派发消费映射表。

| 字段名                                     | 含义                                                             | 派发方                                                                                                             | 消费方                                                                                                                                                                                                                                                |
| ------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supportTask`                              | 保障任务                                                         | `header/TaskSelect.tsx`                                                                                            | `header/TaskNameView` · `header/response-level` · `left/dispatch-tasks` · `left/response-level` · `left/duty-roster` · `left/emergency-resources` · `left/real-time-impact` · `left/assurance-progress` · `right/dispatch-tasks` · `center/index.tsx` |
| `currentZone`                              | 当前选中区域（zoneLevel 省2/地市3/区县4/乡镇5）                  | `center/zone-select/index.tsx`                                                                                     | `left/dispatch-tasks` · `left/emergency-resources` · `left/real-time-impact` · `right/network-compact` · `right/network-compact/damage-to-towns` · `right/dispatch-tasks` · `center/index.tsx`                                                        |
| `wfsFeatureGisPin`                         | 中屏：WFS 图层双击下钻参数                                       | `center/zone-select/index.tsx`（清空为 `null`）· `center/warn-gis/center-gis` · `center/dispatch-gis/center-gis`   | **由 `center/index.tsx` 统一订阅**，再通过 props 下发给 `center/zone-select` / `center/dispatch-gis/center-gis` / `center/warn-gis/center-gis`                                                                                                        |
| `sectionRight:damageToTownsGisPin`         | 右屏：乡镇受损 GIS 定位（主屏）                                  | `right/network-compact/damage-to-towns/index.tsx`                                                                  | `center/index.tsx`（再经 props 传给 `center/dispatch-gis/center-gis`）                                                                                                                                                                                |
| `sectionRight:damageToTownsModalGisPin`    | 右屏：乡镇受损弹窗点击参数                                       | `right/network-compact/damage-to-towns/index.tsx`                                                                  | `center/index.tsx`（再经 props 传给 `center/zone-select`）                                                                                                                                                                                            |
| `sectionRight:damageToTownsSelectedRecord` | 右屏：选中的乡镇记录                                             | `right/network-compact/damage-to-towns/index.tsx`                                                                  | `right/network-compact/damage-to-towns/index.tsx`（**自循环**：跨左右中三表共享选中态）                                                                                                                                                               |
| `sectionRight:selectedDispatchTeamOrOrder` | 右屏：选中应急调度队伍/工单（`{ type: "队伍" \| "工单", ... }`） | `right/dispatch-tasks/dispatch-summary/index.tsx` · `center/dispatch-gis/center-gis`（清空为 `null`，延时 1000ms） | `right/dispatch-tasks/dispatch-summary/index.tsx` · `center/index.tsx`（再经 props 传给 `center/dispatch-gis/center-gis`）                                                                                                                            |
| `sectionRight:networkScale`                | 右屏：网络规模（`items[]` 扁平化）                               | `right/network-compact/network-scale/index.tsx`                                                                    | `center/dispatch-gis/MapEmergencyTransmissionView.tsx`                                                                                                                                                                                                |
| `sectionLeft:riskForward`                  | 左屏：预警感知（`rows[]`）                                       | `left/risk-forward/index.tsx`                                                                                      | `center/warn-gis/risk-prediction-points/high-risk-town/InfoCard.tsx`                                                                                                                                                                                  |

> **关键观察**：
>
> - **中屏是"订阅枢纽"**：`center/index.tsx` 一次性订阅 `supportTask / currentZone / selectedDispatchTeamOrOrder / damageToTownsGisPin / damageToTownsModalGisPin / wfsFeatureGisPin` 共 6 个字段，再通过 props 下发给中屏各子组件。中屏**子组件不直接调用 `useSubscribe`**。
> - **`sectionRight:damageToTownsSelectedRecord` 自循环**：派发与订阅在同一文件，跨左右中三表共享选中态（避免 Context 嵌套过深）。

---

## 2. API 速查

### 2.1 `defineFields` — 字段工厂

[apps/main/app/components/fields.ts](apps/main/app/components/fields.ts) 调用一次，导出 `widgetFields`：

```typescript
import { defineFields } from "@/store";

const widgetFields = defineFields([
    { name: "...", value: "...", desc: "..." },
    // ...
]);

export { widgetFields };
```

- `getField(nameOrValue)` — 通过 `name` 或 `value` 任一查找字段描述符；返回 `{ name, value, desc }`。
- 必须在 **同名字段** 间保持 `name === value`（当前约定），TS 类型自动保证。

### 2.2 `useDispatch` — 派发 Hook

[apps/main/store/useInteractionStore.ts](apps/main/store/useInteractionStore.ts) 实现，签名：

```typescript
const dispatch = useDispatch();
dispatch(widgetFields.getField("fieldName"), payload);
```

- **`payload` 任意**（`any`），由派发/消费双方约定结构；
- 写入全局 Zustand store 的 `runtime[field.value]` 键；
- **建议**：派发前后 payload 形状不变；如需"清空"语义，dispatch `null`（参考 `wfsFeatureGisPin` 的清空用法）。

### 2.3 `useSubscribe` — 订阅 Hook

```typescript
const { localKeyA, localKeyB } = useSubscribe({
    localKeyA: widgetFields.getField("fieldA"),
    localKeyB: widgetFields.getField("fieldB"),
});
// localKeyA === runtime[fieldA.value]
// localKeyB === runtime[fieldB.value]
```

- **多字段批量订阅**，返回对象 key 是订阅时自定义的 `localKey`（**不要求**与 `field.name` 相同，参考 `center/index.tsx` 的解构名 vs `getField` 参数）；
- 内部用 `useMemoizedFn` + `useRef` 缓存上次结果，**深比较 `isEqual`** 才触发重渲染（来自 `useInteractionStore.ts:87`）；
- 订阅未派发过的字段 → 返回 `undefined`。

---

## 3. 命名规范

| 前缀             | 用途                           | 示例                                                             |
| ---------------- | ------------------------------ | ---------------------------------------------------------------- |
| （无前缀）       | 跨屏通用全局状态               | `supportTask` · `currentZone` · `wfsFeatureGisPin`               |
| `sectionLeft:`   | 左屏派发/消费                  | `sectionLeft:riskForward`                                        |
| `sectionRight:`  | 右屏派发/消费                  | `sectionRight:damageToTownsGisPin` · `sectionRight:networkScale` |
| `sectionCenter:` | **预留**，中屏专用（暂无实例） | —                                                                |

> **新增字段时**：根据派发方所在屏选择前缀；跨屏共享字段不加前缀。

---

## 4. 自动检查

> **触发时机**：
>
> - 本 Skill 被其他 Skill 调用时（如某模块 Skill 描述数据流）
> - 人工主动要求"检查字段映射是否最新"
>
> **工具**：`Grep` / `Read`（不依赖测试）

### 4.1 列出所有派发点

```bash
# 通过本工具调用：
Grep pattern: "dispatch\(.*widgetFields\.getField"  -A 1  output_mode: content  path: apps/main/app
```

预期：每个派发点对应 [字段注册表](#1-字段注册表) 的一行。**新增 dispatch 但未注册字段 → 提醒补登记**。

### 4.2 列出所有订阅点

```bash
Grep pattern: "useSubscribe\(\{"  -A 5  output_mode: content  path: apps/main/app
```

预期：每个 `useSubscribe` 内出现的 `widgetFields.getField("...")` 都应在注册表中。**订阅未注册字段 → 报错**（运行时报 `undefined`）。

### 4.3 找出"未派发 / 未消费"的字段

```bash
# 提取所有引用过的字段名
Grep pattern: 'widgetFields\.getField\("([^"]+)"\)'  output_mode: content  path: apps/main/app
# 与 fields.ts 中声明的字段名 diff（人工对比）
```

> 字段长期"只派发不消费"或"只消费不派发" → 提醒清理。

### 4.4 验证 `fields.ts` 与注册表一致

读取 [fields.ts](apps/main/app/components/fields.ts)，与本文档 [§1 字段注册表](#1-字段注册表) 对比；任意不一致 → **以 fields.ts 为准**，更新本文档。

---

## 5. 新增 / 修改 / 废弃字段流程

### 5.1 新增字段

1. **注册**：[fields.ts](apps/main/app/components/fields.ts) 追加 `{ name, value, desc }`；
2. **派发**：派发方 `dispatch(widgetFields.getField("..."), payload)`；
3. **消费**：消费方 `useSubscribe({ localKey: widgetFields.getField("...") })`；
4. **同步本 Skill**：[§1 字段注册表](#1-字段注册表) + 版本号升级。

### 5.2 修改字段名 / payload 形状

⚠️ **破坏性变更**，需要：

- 搜索所有派发/消费点（[§4 自动检查](#4-自动检查)）；
- 同步修改派发方与消费方；
- 若 payload 形状变，在派发方加兼容期注释或消费方加 `?.` 链式判断。

### 5.3 废弃字段

1. 字段从 `fields.ts` 移除；
2. 所有派发/消费点同步移除；
3. **保留一版废弃记录** 在本 Skill [版本历史](#版本历史) 中。

---

## 6. 排错（Q&A）

| #   | 症状                         | 定位                                             | 修复                                                                 |
| --- | ---------------------------- | ------------------------------------------------ | -------------------------------------------------------------------- |
| Q1  | 派发后消费方不更新           | 字段未注册 / 派发/消费方 `getField` 字符串不一致 | 运行 [§4 自动检查](#4-自动检查) 校对                                 |
| Q2  | `dispatch is not a function` | 调用方未在 React 函数组件顶层 `useDispatch()`    | 检查 Hook 调用顺序/位置                                              |
| Q3  | 消费方拿到旧 payload         | 派发方未 `null` 清空就换了新形状                 | 派发方在状态机转换点 dispatch `null`                                 |
| Q4  | 同一字段多处派发，状态错乱   | 违反单派发源约定                                 | 派发方收敛到一处；其他位置改为"申请 → 主派发方执行"                  |
| Q5  | 跨屏字段"长得一样"但前缀不同 | 历史遗留（如 `sectionRight:` 与无前缀并存）      | 人工决定是否合并；合并时按 [§5.2](#52-修改字段名--payload-形状) 流程 |

---

## 7. 被其他 Skill 调用的方式

> **本节说明**：本 Skill 是**辅助型**，被其他模块 Skill 在"需要描述数据流"时引用。

**调用方示例**（`gd-es-next-right-damage-to-towns` SKILL.md 应改写为）：

> 数据流转：
>
> - `onCellClick` 派发 `sectionRight:damageToTownsGisPin` / `sectionRight:damageToTownsModalGisPin`
> - 派发/消费映射详见 → [gd-es-next-interaction-fields §1 字段注册表](SKILL.md#1-字段注册表)

**禁止**：在多个模块 Skill 中**重复维护**字段映射表（一致性问题）。

---

## 依赖

- `apps/main/app/components/fields.ts` — 字段注册表
- `apps/main/store/useInteractionStore.ts` — `useDispatch` / `useSubscribe` / `defineFields` 实现
- `zustand` + `zustand/middleware/immer`
- `lodash-es`（`isEqual`）

---

## 版本信息

| 字段         | 值                                                                               |
| ------------ | -------------------------------------------------------------------------------- |
| **Skill ID** | `gd-es-next-interaction-fields`                                                  |
| **当前版本** | `1.0.0`                                                                          |
| **最后更新** | `2026-06-17`                                                                     |
| **维护者**   | Emergency Support Team                                                           |
| **字段源**   | [apps/main/app/components/fields.ts](apps/main/app/components/fields.ts)         |
| **API 源**   | [apps/main/store/useInteractionStore.ts](apps/main/store/useInteractionStore.ts) |
| **职责**     | 辅助型 — 被其他 Skill 调用，不直接响应用户任务                                   |

## 版本历史

| 版本    | 日期         | 变更摘要                                                                                                                                                                                                                                                                                                                              |
| ------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `1.0.0` | `2026-06-17` | 初版：字段注册表（9 个）+ 派发消费映射 + `useDispatch`/`useSubscribe` API 速查 + 自动检查命令 + 新增/废弃流程。**修正**：补齐 `supportTask` 全部 10 个消费方、`currentZone` 7 个消费方；明确 `center/index.tsx` 是中屏订阅枢纽；标注 `sectionRight:selectedDispatchTeamOrOrder` 在 `center/dispatch-gis/center-gis` 的清空延时 1000ms |

## 适用范围

- ✅ **适用**：跨模块数据流描述、字段一致性校验、新增/废弃字段流程、定位"派发后无消费"或"消费未派发"
- ✅ **适用**：被其他模块 Skill 引用以避免重复描述映射表
- ⚠️ **谨慎**：payload 形状变更（破坏性）；多派发源字段收敛
- ❌ **不适用**：模块内部状态管理（`zustand store`、`usePageStore` 等）、组件 Props 直接传递
