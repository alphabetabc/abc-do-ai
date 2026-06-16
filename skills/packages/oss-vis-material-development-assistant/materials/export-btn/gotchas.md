---
title: export-btn 踩坑记录
description: 导出按钮物料（export-btn）实际开发/维护中遇到的坑、最佳实践和性能注意点
version: 1.0.0
last_updated: 2026-06-16
---

# export-btn 踩坑记录

本文档记录 `export-btn` 实际开发/维护中遇到的坑、最佳实践和性能注意点。

## 1. ⚠️ borderColor 的 type 声明为 number 但使用 ColorPicker

**症状**：`borderColor` 的 schema type 声明为 `number`，但使用 `ColorPicker` 组件。

**原因**：

```typescript
// schema.ts:289
borderColor: {
    type: 'number',  // ← ColorPicker 的 type 应为 'string'
    'x-decorator': 'FormItem',
    'x-component': 'ColorPicker',
},
```

> `ColorPicker` 通常使用 `type: 'string'`，这里写成了 `number`。

**影响**：
- 可能导致类型检查警告
- 实际运行不受影响（ColorPicker 返回字符串）

**建议**：
- 将 `type` 改为 `'string'`

## 2. ⚠️ 根 class 名为 table-list-container，与物料名不一致

**症状**：根 class 名为 `table-list-container`，而非 `export-btn`。

**原因**：

```less
// index.less:1
.table-list-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-wrap: wrap;
    cursor: pointer;
}
```

> 根 class 名使用了 `table-list-container`，与物料名 `export-btn` 不一致。

**影响**：
- 样式命名不规范
- 可能导致样式冲突

**建议**：
- 将根 class 名改为 `export-btn`

## 3. ⚠️ show 字段在 schema 中设置为 x-hidden: true

**症状**：前缀开关 `show` 字段在 schema 中隐藏。

**原因**：

```typescript
// schema.ts:388
show: {
    type: 'string',
    title: '开关',
    'x-hidden': true,  // ← 隐藏字段
    'x-decorator': 'FormItem',
    'x-component': 'Switch',
},
```

> `show` 字段使用 `x-hidden: true` 隐藏，但默认值为 `true`。

**影响**：
- 用户无法通过配置面板关闭前缀
- 前缀始终显示（如果配置了 prefixImg）

**建议**：
- 如需允许用户控制前缀显示，移除 `x-hidden: true`

## 4. ⚠️ 导出文件名包含时间戳

**症状**：导出文件名包含时间戳，格式为 `YYYYMMDDHHmmss`。

**原因**：

```typescript
// index.tsx:69
downloadLink.download = `导出数据${dayjs().format('YYYYMMDDHHmmss')}.xls`;
```

> 文件名使用 `dayjs().format('YYYYMMDDHHmmss')` 生成时间戳。

**影响**：
- 每次导出文件名不同
- 便于区分不同时间的导出文件

**建议**：
- 如需自定义文件名格式，修改 `dayjs().format()` 参数

## 5. ⚠️ 使用 exportAPIConfig 作为历史参数

**症状**：组件同时支持 `exportAPIConfig` 和 `customDataSourceApiConfig`。

**原因**：

```typescript
// index.tsx:37
const apiConfig = exportAPIConfig || customDataSourceApiConfig;
```

> `exportAPIConfig` 是历史参数，新组件中已弃用，但为兼容性保留。

**影响**：
- 优先使用 `exportAPIConfig`
- 如果不存在，使用 `customDataSourceApiConfig`

**建议**：
- 新开发使用 `customDataSourceApiConfig`
- 未来版本可移除 `exportAPIConfig` 支持

## 6. ⚠️ 使用 ConfigProvider 包裹

**症状**：组件使用 `ConfigProvider` 包裹。

**原因**：

```typescript
// index.tsx:106
<ConfigProvider prefixCls="oss-ui">
    {/* ... */}
</ConfigProvider>
```

> oss-ui 组件需要 `ConfigProvider` 包裹，设置 `prefixCls="oss-ui"`。

**影响**：
- 确保 oss-ui 组件样式正确

## 7. ✅ 最佳实践

1. **修改按钮样式**时同步更新 `baseStyle` 默认值
2. **修改前缀图标**时注意 `show` 字段的隐藏状态
3. **修改导出文件名**时注意时间戳格式
4. **新增参数来源**时确保在 `buildCustomApiParams` 中合并

## 维护历史

| 日期 | 问题 | 修复 |
| --- | --- | --- |
| 2026-06-16 | 首次文档化 | 物料文档体系建设 |
