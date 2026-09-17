# task-2026-09-16-002 · designer-app 演进方案文档

## 元信息

- **Status**：已完成
- **类型**：docs（方案设计）
- **创建日期**：2026-09-16
- **目标产物**：`design/packages-next/designer-app演进方案.md`

## 背景

用户澄清真实演进意图：不是让 designer-next 接内核修补现有壳，而是**另起炉灶**——用新架构重构 src 能力为全新 designer-app，约束是老物料（packages/* + 远程物料）零改动可加载、fedx-report 用 formily 自建解释器替代。核心难点：remote-component resolve 注入、fedx-report 三重角色、antd/React 版本并存。

## 目标

沉淀一份完整演进方案文档：背景动机 + 关键事实（已对照源码验证）+ 架构（MaterialCompatHost 分层）+ 5 阶段路线 + 风险清单。

## 不做清单

- 不写任何代码
- 不动 src/ 主线
- 不细化 Phase 3 渲染链重写的实现设计（另立任务）

## 验收标准

1. 方案覆盖：物料继承机制（resolve 注入事实）、fedx-report 三角色拆解、antd/React 版本策略、分阶段路线、风险应对
2. 关键事实全部对照源码验证（remote-component.config.js / use-remote.ts / FedxReport.tsx / formily widgets）
3. 链接为仓库相对路径
4. roadmap.md 已追加索引

## 实施记录

- 2026-09-16：
  - 与用户对齐真实意图（另起炉灶 + 物料兼容 + 弃 fedx-report）
  - 验证物料加载机制：`createRequires(resolve)` 运行时注入，老物料无需重构建即可被新宿主加载
  - 拆解 fedx-report 三角色：A resolve 注入（短期保留）/ B 表单引擎（可替换）/ C 设计时 API（可 shim）
  - 产出 `design/packages-next/designer-app演进方案.md`（5 阶段：协议冻结 → 骨架+物料跑通 → 解释器 → 渲染重建 → 双轨切换）
- 2026-09-16（补充）：
  - 用户澄清物料三分法（field / group / layout-block）与 layout 路由的特殊渲染规则，经代码验证（FIELD_COMP_TYPES / LayoutBlock 渲染组件 mode × visualType 分叉）后补入方案 §1.3
  - Phase 0 增加「物料落树形态契约」冻结项；Phase 3 明确三渲染链 × 三形态矩阵实现要求
