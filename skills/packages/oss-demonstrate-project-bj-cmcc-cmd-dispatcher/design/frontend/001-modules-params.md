# 业务模块参数清单（modules/）

> 从 `003-frontend.md` 第 6.1 节拆出，仅在本页按需引用。通用规范见 `../003-frontend.md`。

以下参数均来自 `web/pages/bj-cmcc-cmd-dispatcher/modules/*/index.tsx` 真实实现。骨架阶段模块统一 `React.FC` 无 props，参数以模块内常量形式固化。后续如需接业务数据，再改为 props 透传。

## 模块参数表

| 模块（文件）            | Group | left | top | width | height | 形态         | 资源 / 占位                                     |
| ----------------------- | ----- | ---- | --- | ----- | ------ | ------------ | ----------------------------------------------- |
| `map`                   | 全局  | 0    | 0   | 2880  | 1080   | 图片型       | `北京市.png`（全屏底图，`pointerEvents: none`） |
| `service-recovery`      | A     | 53   | 822 | 1790  | 238    | 结构型叠加   | `退服恢复情况.png`（背景）+ TimelineHistory（顶部）+ 4G/5G 双线趋势图（中部）+ timeRange label（左上） |
| `service-recovery-cell` | B/C/D | 53   | 822 | 1790  | 238    | 复用组件     | 占位（`variant="cell"`，未传 `src`）            |
| `network-impact`        | A/B   | 1878 | 87  | 906   | 635    | 图片型       | `网络影响.png`                                  |
| `station-outage`        | A/B   | 1878 | 726 | 906   | 323    | 结构型叠加   | `基站退服.png`（背景）+ 4 tab + 单位标签 + 折线图 + 自定义日期区间 |
| `indicators`            | C     | 1878 | 84  | 906   | 333    | 结构型占位   | 后续装数字翻牌器 / 图表                         |
| `logical-station-list`  | B/C   | 1878 | 431 | 906   | 313    | 结构型占位   | 后续装表格                                      |
| `support-tasks`         | C     | 1878 | 758 | 435   | 263    | 结构型占位   | 联保障任务                                      |
| `alarm-detail`          | C     | 2327 | 758 | 457   | 263    | 结构型占位   | 告警明细                                        |
| `station-portrait`      | D     | 1878 | 84  | 916   | 333    | 图片型占位   | `src` 待 UI 出图                                |
| `cell-list`             | D     | 1878 | 438 | 906   | 353    | 结构型占位   | 后续装表格                                      |
| `station-performance`   | D     | 1878 | 805 | 906   | 223    | 结构型占位   | 后续装图表                                      |

## 模块共性约定

-   骨架阶段模块均为 `React.FC` **无 props**：坐标 / 尺寸 / Group / 资源路径全部以模块内 `const` 固化，便于设计稿对齐与就近维护
-   `MY_GROUP`（单组）或 `MY_GROUPS: Group[]`（多组共用）声明可见 Group，通过 `useVisibleGroup()` + `return null` 卸载
-   `map` 模块特殊：**全局可见**，不订阅 `useVisibleGroup()`，始终渲染
-   图片型模块统一 `<img objectFit="fill" pointerEvents: none">`；结构型占位统一 `border + 半透明背景 + 标题`
-   **结构型叠加变种**（`station-outage` / `service-recovery`）：保留 UI 出图作为背景（标题栏 + 装饰），上层叠加交互组件（tab / 表格 / 折线图 / 时间轴 / 时段 label）。背景图 `pointerEvents: none`，交互层正常响应
    - `station-outage`（task004）：背景图 + 4 tab + 单位标签 + 折线图 + 自定义日期区间
    - `service-recovery`（task009）：背景图 + TimelineHistory + 4G/5G 双线趋势图 + 时段 label
-   坐标基准为设计稿 `2880×1080`，模块 `position: absolute` 铺在 `cmd-dispatcher-stage` 容器内

---

## 文档元信息

> 版本：v1.3.0
> 日期：2026-08-26（v1.3.0：task010 — 趋势图 label 数据/视图分离；service-recovery / station-outage 行追加 label 生成方式说明（mount 时锚点动态生成）；"结构型叠加变种"约定补充 task010 改造要点（label 从 mock 抽到组件、日档/月档截断规则））
