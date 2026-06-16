---
title: message-distribute - 物料概述
description: 短信派发组件的完整文档索引和物料概述
version: 1.0.0
last_updated: 2026-06-16
---

# 短信派发组件（message-distribute）

## 物料信息

| 属性 | 值 |
|------|-----|
| **名称** | message-distribute |
| **标题** | 短信派发组件 |
| **路径** | `packages/message-distribute/` |
| **复杂度** | 中 |
| **分类** | 表单 / 筛选 |
| **版本** | 0.0.1 |
| **作者** | 冷涛 |

## 核心功能

1. **号码选择**：使用 Transfer 组件从数据源中选择手机号
2. **号码输入**：支持手动输入手机号（逗号分隔）
3. **短信内容**：输入短信/语音内容
4. **系统配置**：配置系统名称、呼叫次数、呼叫时长
5. **发送功能**：调用配置的 API 接口发送短信

## 技术栈

- **UI 组件**：oss-ui（Row/Col/Card/Transfer/Form/Input/Button/InputNumber）
- **代码编辑器**：MonacoEditor（用于配置接口地址和请求头）
- **日期处理**：dayjs（生成 callIndex）
- **样式**：Less

## 数据字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| name | String | 姓名 |
| phonenum | String | 手机号 |
| description | String | 描述 |
| chosen | String | 是否选中（'1'/'0'） |

## 文档索引

### 🟦 [Schema 配置面板详解](./schema.md)
- 4 个 FormCollapse 面板详解
- 配置项说明和默认值
- 数据源配置

### 🟨 [组件逻辑维护](./component-logic.md)
- 组件结构和状态管理
- 表单提交逻辑
- API 调用流程
- 样式处理

### 🟩 [数据契约](./data-model.md)
- 数据模型定义
- 字段规范
- 示例数据

### 📋 [常见修改任务](./common-tasks.md)
- 添加新的配置项
- 修改表单字段
- 调整 API 请求逻辑
- 样式定制

### ⚠️ [踩坑记录](./gotchas.md)
- 已知问题和注意事项
- 常见错误排查
- 最佳实践

## 文件结构

```
packages/message-distribute/
├── oss-material.json      # 物料元信息
├── schema.ts              # 配置面板定义
├── index.jsx              # 主组件逻辑
├── index.less             # 样式文件
└── dataModel.json         # 数据契约定义
```

## 快速开始

### 1. 查看配置面板
参考 [🟦 Schema 配置面板详解](./schema.md) 了解所有可配置项。

### 2. 理解组件逻辑
参考 [🟨 组件逻辑维护](./component-logic.md) 了解组件内部实现。

### 3. 数据对接
参考 [🟩 数据契约](./data-model.md) 了解数据格式要求。

### 4. 常见修改
参考 [📋 常见修改任务](./common-tasks.md) 获取常见需求的实现方案。

## 依赖关系

- `@Common/schema`：提供 BASE_LAYOUT、DATA_CONFIG、getCompTitle
- `@Common/constants`：提供 FONT_WEIGHT、GLOBAL_FONTS
- `@Common/api`：API 请求封装
- `oss-ui`：UI 组件库
- `dayjs`：日期处理
