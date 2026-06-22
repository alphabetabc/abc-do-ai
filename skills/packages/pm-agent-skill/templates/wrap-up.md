---
version: 1.0.0
date: 2026-06-22
status: 初版定稿
audience: pm-agent / 智能体开发者
---

# 智能体标准收尾模板

> 用途：任务完成、阶段切换时，智能体用此模板收尾

---

## 模板

```
任务 <任务名> 已完成。

产物：
- <产物 1>：<路径>
- <产物 2>：<路径>
- <产物 3>：<路径>

下一阶段：<scan / plan / build / verify / 锁定>
锁定基线：<git tag>（如适用）
生成文档：<路径>（如适用）

是否进入下一阶段？[Y/n]
```

---

## 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| 任务名 | 是 | 刚才完成的任务名 |
| 产物 | 是 | 列出本次产出的所有文件（带路径）|
| 下一阶段 | 是 | 建议下一个阶段 |
| 锁定基线 | 否 | 跨阶段交付时必填，与 git tag 一一对应 |
| 生成文档 | 否 | 跨阶段交付时必填，基线文档路径 |
| 等待 PM 确认 | 是 | 收尾必须等 PM 确认才能进下一阶段 |

---

## 填写示例

### 示例 1：单阶段完成（不跨阶段）

```
任务 扫描项目结构 已完成。

产物：
- 扫描报告：knowledge/scanning/phase1-scan-report.md
- 风险点清单：knowledge/scanning/phase1-risks.md

下一阶段：plan

是否进入 plan 阶段？[Y/n]
```

### 示例 2：跨阶段交付（锁定基线）

```
任务 客户运营系统原型 Phase 1 已完成。

产物：
- 数据层：3 份数据契约（public/data/*.json）
- 接口层：3 个 API 客户端 + 3 套模拟数据
- 视图层：3 个页面文件（src/views/customer/*.vue）
- 配置层：路由 + 菜单 + 权限

下一阶段：锁定基线
锁定基线：git tag v1.0.0-phase1-baseline
生成文档：baseline/phase1-architecture-baseline.md

是否锁定基线？锁定后只允许 bug 修复级变更。[Y/n]
```

### 示例 3：完整项目交付

```
任务 客户运营系统原型 已完成。

产物：
- 数据层：8 份数据契约
- 接口层：8 个 API 客户端 + 8 套模拟数据
- 视图层：8 个页面文件
- 配置层：路由 + 菜单 + 权限 + 国际化

下一阶段：交付
锁定基线：git tag v1.0.0-baseline
生成文档：baseline/architecture-baseline.md

是否锁定基线？[Y/n]
```

---

## 反模式

- ❌ 收尾不带产物清单（PM 不知道产出什么）
- ❌ 产物清单只写数量不写路径（PM 找不到）
- ❌ 跨阶段交付不提锁定基线（破坏基线管理）
- ❌ 收尾后直接进入下一阶段（违反 08 授权制）
- ❌ 收尾时加一堆补充信息（PM 看不完）

---

## 引用

- [SKILL.md §4 标准收尾](../SKILL.md)
- [pm-agent.md §2.4 标准收尾](./pm-agent-core/pm-agent.md)
- [architecture-baseline-template.md](./pm-agent-core/baseline/architecture-baseline-template.md)
