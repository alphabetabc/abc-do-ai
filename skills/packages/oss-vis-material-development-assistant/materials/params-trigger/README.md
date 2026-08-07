---
title: params-trigger - 物料概述
description: 参数转换触发器物料的整体介绍、核心能力与文档索引
version: 1.0.0
last_updated: 2026-08-04
---

# params-trigger 参数触发器

## 物料简介

`params-trigger` 是一个**纯逻辑交互物料**（不渲染可见数据内容），订阅外部传入的参数，按配置面板中的"输入值 → 输出值"映射规则转换为目标值后派发给下游物料。典型场景：把上游传来的枚举编码（如 `type=1`）翻译成下游消费的业务标识（如 `station`）。

## 基本信息

| 属性 | 值 |
|------|-----|
| 名称 | params-trigger |
| 标题 | 参数触发器 |
| 分类 | 其他 / 交互工具 |
| 复杂度 | 简单 |
| 数据源 | ❌ 不使用 |
| 主入口 | `packages/params-trigger/index.tsx` |
| 是否有自带 doc | ✅ `packages/params-trigger/doc/readme.md` |

## 核心功能

1. **参数转换映射**：维护一组"输入值 → 输出值"映射规则，订阅参数值命中后派发对应输出
2. **10 个语义化订阅槽位**：覆盖常见全局参数命名（`type`/`category`/`status`/`mode`/`tag`/`value`/`code`/`level`/`id`/`group`）
3. **可视化配置映射**：通过 ArrayCollapse 在配置面板里增删改映射项
4. **设计器/运行时分离渲染**：设计器画布显示虚线占位标签，运行时不渲染 DOM

## 技术特点

- **零数据源**：依赖框架交互订阅 + 配置面板映射表，不请求 API
- **设计器占位 vs 运行时 null**：`useDevelopmentMode` 判断，仅设计器渲染占位
- **运行时点击穿透**：通过 `useEffect` 注入 `pointer-events: none` 到 `<head>`，让框架包装层不响应点击
- **派发字段名前缀（用户可配置）**：默认 `paramsTrigger_${sourceKey}`，用户可在 schema 中自定义 `dispatchPrefix` 字段避免与其他物料同名派发冲突
- **派发去重**：用 `useRef` 缓存派发签名，相同结果不重复派发
- **未命中降级**：未匹配映射规则时 `console.warn` 提示，不派发

## 文档索引

| 文档 | 维度 | 说明 |
|------|------|------|
| [schema.md](./schema.md) | 🟦 | 配置面板定义、订阅槽位清单、映射规则面板 |
| [component-logic.md](./component-logic.md) | 🟨 | 订阅处理、映射匹配、派发逻辑、点击穿透注入 |
| [data-model.md](./data-model.md) | 🟩 | 数据契约说明（本物料无数据源） |
| [common-tasks.md](./common-tasks.md) | - | 常见修改任务（新增订阅槽位、改默认值等） |
| [gotchas.md](./gotchas.md) | - | 踩坑记录（tree-shaking、派发去重、点击穿透等） |

## 源码文件结构

```
packages/params-trigger/
├── oss-material.json    # 物料元信息
├── schema.ts            # 配置面板定义
├── index.tsx            # 主组件逻辑（含 useEffect 派发/样式注入）
├── index.less           # 样式文件（仅设计器占位用）
├── constants.ts         # 共享常量（SUBSCRIBE_KEYS / DISPATCH_PREFIX / COMPONENT_NAME）
├── dataModel.json       # 数据契约占位（实际不使用）
└── doc/
    ├── readme.md        # 用户向文档（设计器侧边栏渲染用）
    └── CHANGELOG.md     # 版本变更日志
```

## 依赖说明

- `React`：核心（`useEffect` / `useRef`）
- `@fedx-vis/designer-types`：`DesignerField` 类型
- `oss-web-toolkits`：工具函数（`_.forEach`）
- `@Src/hooks/useMemorizedObject`：映射表深度记忆化
- `@Src/hooks/useDevelopmentMode`：判断设计器/运行时

## 快速导航

- 修改订阅槽位 / 映射面板 → [🟦 schema.md](./schema.md)
- 修改派发逻辑 / 点击穿透 → [🟨 component-logic.md](./component-logic.md)
- 数据默认值（无实际数据） → [🟩 data-model.md](./data-model.md)