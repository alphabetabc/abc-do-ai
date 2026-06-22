---
version: 1.0.0
date: 2026-06-22
status: 初版定稿
audience: pm-agent / 智能体开发者
---

# 为项目创建 AGENTS.md 模板

> 用途：当用户说"为这个项目创建 AGENTS.md"时，pm-agent 用此模板

---

## 1. 触发条件

- 用户说"为这个项目创建 AGENTS.md" / "给我项目生成 agent 配置" / "基于 pm-agent 创建 agents.md"
- 用户在 Trae / Cursor / Claude 等 IDE 中使用，期望 IDE 加载项目级 agent 配置
- 用户说"按 pm-agent 的规范给我项目初始化"

## 2. AGENTS.md 输出模板

生成位置：项目根目录的 `AGENTS.md`

```markdown
# <项目名> · 项目智能体配置

> 由 pm-agent 在 <YYYY-MM-DD> 自动生成
> 基于 pm-agent 通用方法论 + 本项目具体规则

---

## 1. 项目元信息

| 字段 | 值 |
|------|---|
| 项目名 | <从 package.json 读取> |
| 技术栈 | <自动检测> |
| 框架 | <Vue 3 / React 18 / ...> |
| 构建工具 | <Vite / Webpack / ...> |
| 状态管理 | <Pinia / Redux / ...> |
| 路由 | <Vue Router / React Router / ...> |
| API 客户端 | <axios / fetch / ...> |
| Mock 方案 | <vite-plugin-mock / MSW / ...> |
| 测试框架 | <Vitest / Jest / ...> |
| 项目类型 | <Web App / SPA / SSR / ...> |

## 2. 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| URL 路径 | kebab-case | /customer-list |
| API 函数 | camelCase + 业务前缀 | getCustomerList |
| 数据文件 | camelCase + 业务名 | customerList.json |
| 视图文件 | PascalCase + 业务名 | CustomerList.vue |
| 组件 | PascalCase | TimeRangePicker.vue |
| 常量 | UPPER_SNAKE_CASE | MAX_PAGE_SIZE |

## 3. 目录结构

<根据项目实际自动生成>
例：
src/
├── api/                # API 客户端
├── assets/             # 静态资源
├── components/         # 公共组件
├── mock/               # 模拟数据
├── router/             # 路由
├── store/              # 状态管理
├── utils/              # 工具函数
├── views/              # 业务页面
└── App.vue

## 4. 数据 vs UI 状态分离

| 类型 | 入 API | 留 Vue |
|------|--------|--------|
| 业务数据 | ✅ | |
| 表格、统计 | ✅ | |
| 字典 | ✅ | |
| 表单输入 | | ✅ |
| UI 开关、选中项 | | ✅ |
| 图表实例 | | ✅ |
| 静态常量 | | ✅ |

## 5. 反模式（绝对禁止）

- ❌ 命名不四联动（URL/API/JSON/Vue 错位）
- ❌ 数据 vs UI 混在一起
- ❌ 硬编码数组未入 API
- ❌ 不可序列化字段塞进 API（icon、组件引用、循环引用）
- ❌ 跳过防御自检
- ❌ 擅自改 PM 没授权的文件
- ❌ 替 PM 决策技术选型

## 6. 决策白名单

### 自主决策
- 命名（沿用既有规范）
- 单路由字段调整
- 端点拆分（按页面体量）
- 数据迁移分类
- 文档更新

### 必须升级
- 新增/删除/合并模块
- 命名规范变更
- 决策推翻既有结论
- 端点数 > 5 或 < 1

## 7. 防御清单

每个文件改造前必查：
- [ ] 命名四联动
- [ ] 数据 vs UI 分类
- [ ] 不可序列化字段
- [ ] 反模式未触发
- [ ] 历史 bug 未复发

## 8. 不可改边界

- ❌ AGENTS.md 自身（修订需 PM 确认）

---

## 9. 引用

- 基于 pm-agent 通用方法论
- 项目级具体规则（命名/目录/技术栈）由 PM 维护
- 反模式与决策白名单参考 [pm-agent 完整设计](../pm-agent-core/methodology/)
```

---

## 3. 执行步骤

### 步骤 1：读取项目元信息

智能体自动扫描：

- `package.json`（项目名、技术栈、依赖）
- 目录结构（src/、api/、views/ 等）
- 已有配置（router 配置、store 配置、构建配置）
- 已有代码（识别命名习惯）

### 步骤 2：PM 确认/补充

```
[question] 我检测到的项目元信息：
- 项目名：<xxx>
- 技术栈：<Vue 3 + Vite + ...>
- 框架：<xxx>
- ...
补充：<哪些是 PM 需要手动确认的？>

是否基于此生成 AGENTS.md？[Y/n/<补充>]
```

### 步骤 3：生成 AGENTS.md

- 在项目根目录创建 `AGENTS.md`
- 内容基于模板 + 项目实际信息
- 不覆盖已有 AGENTS.md（先警告）

### 步骤 4：报告

```
✅ 已生成 AGENTS.md
位置：<项目根>/AGENTS.md
关键内容：
- 元信息（自动检测）
- 命名规范（基于项目实际）
- 反模式清单（来自 pm-agent 通用方法论）
- 决策白名单（来自 pm-agent 通用方法论）

是否要调整？[Y/n]
```

---

## 4. 字段自动检测规则

| 字段 | 检测方式 |
|------|---------|
| 项目名 | `package.json.name` |
| 框架 | `package.json.dependencies` 包含 `vue` / `react` / ... |
| 构建工具 | `package.json.devDependencies` 包含 `vite` / `webpack` / ... |
| 状态管理 | `package.json.dependencies` 包含 `pinia` / `redux` / `vuex` / ... |
| 路由 | `package.json.dependencies` 包含 `vue-router` / `react-router` / ... |
| API 客户端 | `package.json.dependencies` 包含 `axios` / `swr` / `react-query` / ... |
| Mock 方案 | `package.json.devDependencies` 包含 `vite-plugin-mock` / `msw` / ... |
| 测试框架 | `package.json.devDependencies` 包含 `vitest` / `jest` / ... |
| 目录结构 | `Get-ChildItem` / `find` 扫描 src/ |
| 命名规范 | 抽样检查现有文件命名 |

---

## 5. 反模式

- ❌ 不读项目就直接生成（生成的配置可能与项目不符）
- ❌ 不给 PM 确认（违反决策独立）
- ❌ 覆盖已有的 AGENTS.md（不警告）
- ❌ 把 pm-agent 通用规则硬塞进项目（不结合项目实际）
- ❌ 改项目代码（只生成 AGENTS.md，不改其他文件）

---

## 6. 引用

- [pm-agent.md §7 新能力](../pm-agent-core/pm-agent.md)
- [AGENT.md §7 为项目创建 AGENTS.md](../pm-agent-core/AGENT.md)
- [../SKILL.md §15 为项目创建 AGENTS.md](../SKILL.md)
