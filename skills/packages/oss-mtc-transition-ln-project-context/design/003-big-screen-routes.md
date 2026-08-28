# 003 · 大屏路由权威表

> 性质：长期维护文档
> 日期：2026-08-13（2026-08-17 更新 task-041 实战方案）
> 定位：**大屏前端路由唯一权威记录点**；其他文档（project-meta.md §1、AGENTS.md §2.1 等）引用此处，不复制路由表。

---

## 1. 路由表

| 模块             | 前端路由（PM 原文）              | 前端路由（实现）            | menu 参数（驼峰 key） | 物理目录                                                | Spec                                      |
| ---------------- | -------------------------------- | --------------------------- | --------------------- | ------------------------------------------------------- | ----------------------------------------- |
| 人员信息大屏     | `/bigdata/personnel`             | `/visual/big-screen`        | `personnel`           | `frontend/src/pages/visual/big-screen/personnel/`           | `038-bigdata-personnel-display`           |
| 辽宁信访大屏     | `/dashboard/petition`            | `/visual/big-screen`        | `petition`            | `frontend/src/pages/visual/big-screen/petition/`            | `039-bigdata-petition-display`            |
| 进京信访大屏     | `/dashboard/beijing-petition`    | `/visual/big-screen`        | `beijingPetition`     | `frontend/src/pages/visual/big-screen/beijing-petition/`    | `040-bigdata-beijing-petition-display`    |
| 信访数据比对大屏 | `/dashboard/petition-comparison` | `/visual/big-screen`        | `petitionComparison`  | `frontend/src/pages/visual/big-screen/petition-comparison/` | `041-bigdata-petition-comparison-display` |
| 统计分析月报     | `/visual/stats/*`                | `/visual/stats/*`           | —                     | `frontend/src/pages/visual/stats/`                        | `035-visual-monthly-statistics`           |

**4 大屏路由形式**：单路由 `/visual/big-screen` + `?menu=xxx`（驼峰 key）切换子页。访问示例：

- `/visual/big-screen` → 默认 `personnel`（人员信息大屏）
- `/visual/big-screen?menu=petition` → 辽宁信访大屏
- `/visual/big-screen?menu=beijingPetition` → 进京信访大屏
- `/visual/big-screen?menu=petitionComparison` → 信访数据比对大屏

> 路由方案演进与废弃方案详见 §1.1 + `.trae/skills/oss-mtc-transition-ln-project-context/design/004-big-screen-architecture.md` §1.1。
> 业务子组件目录与命名约定详见 `.trae/skills/oss-mtc-transition-ln-project-context/design/004-big-screen-architecture.md` §1.2。

### 1.1 路由方案演进（task-041 实战修正）

| 日期       | 阶段         | 方案                                                                                | 状态                |
| ---------- | ------------ | ----------------------------------------------------------------------------------- | ------------------- |
| 2026-08-13 | 初版         | 4 路由 `/visual/big-screen/{personnel,petition,...}` + 父路由 `<Visual><Outlet/></Visual>` | ⚠️ 草稿 |
| 2026-08-17 | task-041 实战：4 路由方案实战 | AppShell 把大屏套在 tab 卡片里（padding/白底/圆角），内容无法全屏        | ❌ 已废弃           |
| 2026-08-17 | task-041 实战：顶级路由脱离 | tab 不创建但脱离菜单体系，鉴权需独立处理                                | ❌ 已废弃           |
| 2026-08-17 | task-041 实战：白名单跳过 | 绕过 AGENTS §4「菜单项粒度鉴权」，违反 §8                              | ❌ 已废弃           |
| 2026-08-17 | task-041 实战：单路由 + query 切换 | pathname 不变 → tab 不重复创建；子页切换走 lazy；保留菜单鉴权     | ✅ **最终方案**     |
| 2026-08-17 | task-042 同步 | 设计文档同步到 `AGENTS.md` §2.1 / `docs/design/system-overview.md` §2.2.2 / `docs/specs/{038,039}/spec.md` §4 | 🔄 进行中           |

**PM 原文保留**：上表「前端路由（PM 原文）」列保留 PM 输入原文，供需求追溯；实现以「前端路由（实现）+ menu 参数」双列为准。

**单路由方案优势**：
- pathname 不变 → AppShell 不创建新 tab 页签，避免 tab 堆积
- 子页切换走 `React.lazy` → 首屏加载更快
- 保留菜单鉴权体系 → 不绕过 AGENTS §4

**Visual 壳**（`frontend/src/pages/visual/big-screen/index.tsx`）：
- `ScalerContainer`（1920×1080 设计稿缩放）
- `<Header />`（左导航 + 中间大标题「大数据综合展示」+ 右导航 + 双层 textShadow）
- `<Background />`（`/static/images/background-1.png`）
- `useSearchParams` 读 `?menu=xxx`（驼峰 key）
- `React.lazy` 加载对应子页 + `Suspense` 包裹 + `Spin` loading

### 1.2 物理目录约定

**业务子组件目录**：直接放在大屏目录下，不嵌套 `components/`；每个卡片一个 `kebab-case` 子目录（与组件目录对齐）。

```
frontend/src/pages/visual/big-screen/
├── index.tsx              ← Visual 壳（ScalerContainer + query 切换）
├── index.css
├── shared/
│   └── menu.ts            ← 导航常量（MENU_LABELS / MENU_NAV_ITEMS / DEFAULT_MENU）
├── components/
│   ├── header/            ← Header 组件
│   │   └── index.tsx
│   └── background/        ← Background 组件
│       └── index.tsx
├── personnel/
│   ├── index.tsx          ← 主入口（仅做组合）
│   ├── retired-soldier/   ← 5 卡片各自子组件
│   ├── entitled-object/
│   ├── employment-status/
│   ├── data-overview/
│   └── region-statistics/
├── petition/
│   ├── index.tsx
│   ├── petition-trend/
│   ├── petition-demands/
│   ├── beijing-summary/
│   ├── region-map/
│   ├── channel-stat/
│   └── identity-type/
├── beijing-petition/      ← ⏭️ 用户尚未提供页面参数
└── petition-comparison/   ← ⏭️ 用户尚未提供页面参数
```

**personnel + petition 当前已落地**；beijing-petition + petition-comparison 暂为占位页面，待用户提供布局参数后初始化。