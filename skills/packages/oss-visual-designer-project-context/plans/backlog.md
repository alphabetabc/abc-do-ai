# backlog.md · 待评估项

> 唯一的未立项暂存区：还没落到设计文档（design/）、还没立项（plans/task-*.md）的想法、待办、待确认项，全部记在这里。
> 立项 → 创建 task 文件 + roadmap.md 追加索引 + 从本文件删除；放弃 → 直接删除。

## 方向级（大项）

| 方向 | 说明 |
| --- | --- |
| designer-next 继续开发 | 落地 readme 改进方向：antd 替换 UI、微应用适配器（qiankun / micro-app）、去 hox（`src/hox/` 下 5 个 hook 仍在）、分层设计 |
| designer-next 接入 designer-core + designer-plugins | 把已完成的内核 / 插件真正用在下一代设计器壳上 |
| src/ 主线迁移到新架构 | 改动面最大，须先与用户对齐，独立 task 承接 |
| **plugins 能力下沉分析**（designer-app 演进前置） | 矩阵 ③ 重建项中哪些应下沉到 core/plugins 而非留壳层。骨架来自矩阵裁定（J1/J4/J5/J6 四项已代码验证）：selected 多选扩展、mode extra（designerType 等三字段）、copy uniqueId 默认值反转、组重算接线、useCustomFieldsList hooks。待验证分拣（**未做代码级可拆性分析**）：animation / config-formatter / DPU 插件化、taskManager 去处、五类 data factory 接口边界。真做须逐块 Read src 实现验证可拆性，不靠判断。与 Q1 拍板联动；参考 [designer-app/50-open-questions.md](.trae/skills/oss-visual-designer-project-context/design/packages-next/designer-app/50-open-questions.md) |
| **快照「恢复到快照」**（新增功能，非迁移） | src 现状快照=发布版本管理（覆盖/发布/预览），**从未有回滚功能**。恢复到快照定位为新增纯前端功能（Q7 拍板，2026-09-17），将来立项；core 不做 undo/redo，树级快照方案 core 总纲有备忘可参考 |
| **undo/redo**（新增功能，非迁移） | src 从未实现（grep 零命中）。用户判断核心难点在步数管理（太多太少都不好）。候选思路：操作语义合并（同类操作合并为一步，步数仅作内存上限）、树 diff 而非全量栈、command 模式（写操作自带逆变换）——packages-next core 统一 action 写路径比 src 更接近 command 地基。与快照恢复相关但粒度不同（会话内细粒度 vs 版本级）。2026-09-17 记入 |

## 零散待办（按需顺手做）

**代码小修**

- `DesignerContent.tsx:281` 注释过时：仍写"P6 后 components 引用不随 updateFieldConfig 变化"，单源后该说法已不成立，1 行修正
- `designer-canvas.ts` L146 `parentMap 不一致：放弃本次更新` 路径可加 console.warn（真 bug 信号；L130-131 两处静默 return 是合法失败，不必加）
- `drag2layoutBlock.ts:46` / `element.tsx:158` byId 兜底属冗余（下一行 getFieldNodeById 命中时用不到），可作整洁度清理
- `packages/ui/src/material-selector/*` 10 个预存在 TS 错误可清理

**待确认删除**

- `DataProvider.tsx`：已退化为 `<>{children}</>` 占位，确认无外部 import 后可删（微前端嵌入方需确认）
- 零引用物料：`packages/base/iframe` / `countdown` / `container/rank-panel` / `scroll-panel` / `packages/base/index.ts`（三个导出零引用）
- `packages/constants.js` 单独审计：15+ 常量逐个搜引用（见 [packages组件使用度审计](../research/packages组件使用度审计.md)）

**依赖/基建**

- RTK 2.x 升级评估（需先升 redux 5.x；顺带评估逐 slice 迁 `createSlice`）
- redux-persist whitelist 空但保留 PersistGate，可彻底移除

**文档整理**

- designer-canvas 文档按场景重组：目前按维度拆分，同一场景知识散落多文件（如"组内对齐"涉及 write-path 5 处 + edge-cases 6 处），改一处需同步 11 个位置
