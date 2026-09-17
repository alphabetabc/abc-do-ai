# architecture.md

详细目录树与模块说明见 `topics/项目架构说明书.md`；本文件只写概要与边界。

## 技术栈

- 主线：React 17 + TypeScript + Redux（混合 action 模式：老 slice 字符串 type，新 slice RTK createSlice）+ immer + Webpack 4 + Formily + react-dnd/react-rnd + ECharts/d3/Three.js + antd 4 / oss-ui。
- 测试：vitest（主仓 `src/**/__tests__`），packages-next 子包用 vite test。
- 新一代：Zustand + 插件体系（designer-core），构建 vite。

## 仓库结构概要

```text
src/                  主线源码（生产）
  designer/           设计器主界面（拖拽/配置/预览）
  store/modules/      5 个 slice：app / component / viewCanvas / viewUI / designerCanvas
  plugins/            data-fetcher / interaction
  packages/           本地物料包（webpack alias @Packages）
packages/             pnpm workspace 子包（components/hooks/ui/utils/request/share/types/platform）
packages-next/        新一代架构
  designer-core/      Zustand + 4 类插件工厂内核（完成，含 docs/ 文档站）
  designer-plugins/   7 个业务插件 + plugin-registry（完成）
  designer-next/      下一代设计器壳（早期脚手架，演进中）
config/ scripts/      Webpack 配置与构建脚本
.trae/                治理区：skills/（含本 skill）/ rules/ / scripts/
```

## 包边界

- `src/` 与 `packages-next/` 相互独立：主线未依赖新架构包，新架构以主线为验证载体。
- `packages/*` 是对外共享的 workspace 子包，API 变更需明确计划。
- `packages-next/designer-core` 只做通用内核，不含业务类型；业务预设（WidgetData / DesignerExtra）在 `designer-plugins`。

## 关键决策

- 单源架构（2026-07-28）：designerCanvas.components 是唯一真相源，byId / parentMap 由 buildIndex 纯派生；删除 mergeByIdIntoTree / fieldPreserve / dirtyConfigKeys 等三套同步机制。
- 字段级订阅（task-007）：useFieldConf(uniqueId) 按 byId 索引订阅，取代全量订阅。
- designer-core 选型 Zustand 而非 Redux DevTools：440 节点大对象高频写入下 Immer produce 更优。
- plugin-registry 方案 B：对象式插件组装（key = 插件名，可拔插），不用数组顺序注册。
- 持久化：redux-persist whitelist 为空，仅保留 PersistGate 占位。
