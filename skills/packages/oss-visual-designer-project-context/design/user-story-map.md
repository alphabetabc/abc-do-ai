# user-story-map.md

## 角色

- 大屏搭建者（主要用户）：业务/数据人员，拖拽组件搭大屏，不写代码。
- 物料开发者：为设计器开发可视化组件（物料），遵循物料 Props / 上下文声明。
- 设计器维护者：演进 src/ 主线与 packages-next 新架构的开发者。
- 嵌入方：通过 DesignerParserEntry 把渲染后的大屏嵌入其他系统（微前端）。

## 主旅程

1. 登录进入设计器（DesignerContent），选择/新建大屏。
2. 从物料区拖拽组件到画布（react-dnd / tree 拖拽），支持成组 / layout-block 嵌套。
3. 调整布局：移动、缩放、对齐、标尺、参考线、图层管理（lock / show / move / copy / delete）。
4. 配置组件：右侧配置面板（Formily）改 props，字段级更新即时生效。
5. 绑定数据：API / DPU / 数据集 / 实时数据流，配置组件间联动与交互事件。
6. 预览与发布：preview 模式验证，保存为 SchemaConfig JSON，渲染端（DesignerParserEntry）复现大屏。

## 维护者旅程（新架构）

1. designer-core：TreeStore + 4 类插件工厂（runtime-data / derived-compute / structure-tools / cross-slice-sync）。
2. designer-plugins：plugin-registry 组装业务插件，createDesigner 预设入口。
3. designer-next：以新内核搭建下一代设计器壳，逐步承接主线能力。
