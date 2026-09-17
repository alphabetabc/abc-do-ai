# vision.md

## 定位

OSS Visual Designer 是拖拽式数据可视化大屏设计平台：用户通过拖拽组合可视化组件、绑定多源数据（API / DPU / 数据集 / 实时数据流）、配置交互，产出可直接发布的大屏。

## 北极星

- 主线 `src/` 稳定支撑生产：单源状态架构（components 树唯一真相源）+ 字段级订阅，保证 440 组件场景流畅。
- 新一代 `packages-next/` 沉淀可复用内核：designer-core（Zustand + 4 类插件工厂）+ designer-plugins（业务插件包）+ designer-next（下一代设计器壳），最终承接主线迁移。

## 禁止清单

- 不绕过 buildIndex 直接写 byId / parentMap 派生索引。
- 不为画布树引入主 store 之外的 Context / 私有 store。
- 不重新引入已删除 API（见 `designer-state/05-deleted-api.md`）。
- 不修改 `packages/*` 对外 API（无明确计划时）。
- 不用 npm/yarn，统一 pnpm。
- 不主动清理 `.bak` 历史快照（用户决定永久保留）。

## 假设

- 主线 React-Redux 架构在迁移完成前持续服务生产，行为不被新架构试验波及。
- designer-next 演进方向：antd 替换 UI、微应用适配器（qiankun / micro-app）、去 hox、分层设计（框架 / 原子组件 / 物料）。
