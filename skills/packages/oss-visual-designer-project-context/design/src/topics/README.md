# topics/ · 主线专题文档

设计器主线的按主题散装文档，各自独立成篇。修改对应领域前读对应文档；与代码冲突时以代码为准。

## 按主题分组

### 架构与性能

| 文档 | 内容 | 何时读 |
| --- | --- | --- |
| `项目架构说明书.md` | 详细目录树与模块说明（技术事实权威） | 初次进入项目 / 查技术栈 / 查目录结构 |
| `DesignerField性能优化文档.md` | selector 订阅粒度优化 + 文件拆分 + 待办清单 | 改画布渲染性能 |
| `Hox模块使用文档.md` | src/hox 5 个全局 model 的使用清单（44 文件） | 修改 Hox 状态 |

### 物料开发

| 文档 | 内容 | 何时读 |
| --- | --- | --- |
| `物料Props详细配置.md` | GeneratorWidget → Field 完整调用链 + Props 类型 | 修改渲染链路 / 物料 props |
| `物料开发上下文声明.md` | MaterialProps 完整类型声明 + 使用示例 | 加新物料 |
| `Schema定义工具文档.md` | defineConfigSchema 等 5 个 Formily schema 工具函数 | 配置物料 props |

### 交互系统

| 文档 | 内容 | 何时读 |
| --- | --- | --- |
| `交互系统现状分析与建议.md` | 交互插件现状 + 改进建议 | 修改组件交互 |
| `下钻与派发逻辑总结.md` | drilldown / dispatch 模式 + 组件清单 | 修改下钻派发逻辑 |

## 相关

- src 能力域总览（第一入口）：`oss-visual-designer-project-context/design/src/能力域总览.md`
- 画布状态契约（权威）：`oss-visual-designer-project-context/design/src/designer-state/`
- 新架构内核契约：`oss-visual-designer-project-context/design/packages-next/designer-core/`
