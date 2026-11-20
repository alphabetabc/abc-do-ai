# source-truth-map.md · 真源索引

> 主题 → 权威文件映射。查「本仓有什么 / 在哪」先查此表；表中文件即权威答案，无需再翻代码。
> 本域为 **develop-fujian**：查 fujian 真相直接用本目录与 ../design/。

## 主题映射

| 主题 | 权威文件 |
| --- | --- |
| 仓库定位 / 硬约束 | AGENTS.md（仓库根） |
| 目录结构 / 构建链 / 路由 / 依赖版本 / 状态管理分布 | design/architecture.md |
| 模块级结构（页面、组件、状态、接口、坑） | design/modules/001~008/overview.md |
| 接口端点 / sqlId / baseUrlType | references/api-catalog.md |
| 枚举 / 字典 / 常量取值 | references/enum-and-dictionary.md |
| 可复用能力（导出、定时器、表格、审批、网元搜索等） | references/reusable-capabilities.md |
| 需求归属判定（前端/后端/联调） | references/scope-classification-rules.md |
| 后端表结构 | sql/（只读，后端维护；仅做表名级参考） |

## 核查用 grep 关键词表

结论存疑时按此快速回到源码验证（均为真实可命中模式）：

| 想核什么 | grep 关键词 | 命中位置 |
| --- | --- | --- |
| 某接口端点是否存在 | `request\('端点片段` | src/pages/**/service/api.js |
| sqlId 定义与使用 | `sqlId 名` | src/common/services/configs.js + 调用页 |
| baseUrlType 种类 | `baseUrlType` | src/common/api/*、各 service/api.js |
| 路由 | `path:` | src/routes/index.js |
| webpack 别名 | `alias` | config/webpack.config.js L310（@Src/@Pages/@Common） |
| hox 模型 | `useLoginInfoModel\|useEnvironmentModel\|withModel` | src/hox/、src/App.js |
| 微前端桥 | `onGlobalStateChange\|setGlobalState` | src/share/actions.js |
| 前端导出函数 | `exportExcel` | src/pages/common/export.js |
| 定时器 | `initTimer` | src/common/timer/index.js |
| 4A 认证 | `treasury4A` | src/components/treasury-auth-flow-anhui/index.jsx |
| 重复定义坑 | `deleteTmpArProStatusImp` | home-page 与 new-project 的 service/api.js |
| 枚举 | `operatorMapNumber\|windowTypeList` | src/common/enum/ |
| 环境开关 | `useEnvironmentModel\|environment\.` | src/hox/index.js + 消费页 |

## 维护规则

- 新增接口/sqlId/枚举/开关时，随任务更新对应真源文件（任务卡归档前核对）。
- 每条真源结论须可回溯到真实文件路径；不确定时写「未验证」。
- 更新触发：任务驱动手动更新（当前约定，不加脚本校验）。
