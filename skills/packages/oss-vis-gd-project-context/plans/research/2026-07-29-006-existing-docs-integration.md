# Finding-006：现有散落文档整合方案（D-23）

> **日期**：2026-07-29
> **性质**：第二轮 research Stage E 结论
> **作用范围**：沉淀 `docs-api-backend/` / `public/static/doc/` / `public/static/mock/` / `README.md` / `README.Dev.md` 的整合策略
> **前置 finding**：[`2026-07-29-001-docs-template-structure-findings.md`](./2026-07-29-001-docs-template-structure-findings.md) §2.5（现有文档情况）
> **关联 finding**：[`2026-07-29-003-docs-mvp-structure.md`](./2026-07-29-003-docs-mvp-structure.md)（最小结构）+ [`2026-07-29-004-modules-spec-strategy.md`](./2026-07-29-004-modules-spec-strategy.md)（模块归属）
> **规则约束**：`.trae/rules/docs-authoring-rules.md` Rule 1 / Rule 2（事实优先 / docs 内容隔离）
> **路线图**：`.trae/skills/oss-vis-gd-project-context/plans/roadmap.md` §2 决策表 D-23

---

## 0. TL;DR

| 现有路径                                  | 处理方式                                          | 落地位置                                                                  | 实施阶段       |
| ----------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------- | -------------- |
| `docs-api-backend/右屏网络情况接口.md`     | **整合**（去重）                                  | `docs/design/api-contracts.md §A「应急保障大屏网络情况接口」附录`         | plan-003 阶段 2 |
| `docs-api-backend/frontend/增补接口-2026年4月8日.md` | **整合**（合并 3 个 frontend MD 去重）              | `docs/design/api-contracts.md §B「五大中心综合展示接口」附录`            | plan-003 阶段 2 |
| `docs-api-backend/frontend/综合展示中心-地图数据接口.md` | **整合**（合并入 §B）                              | 同上                                                                       | plan-003 阶段 2 |
| `docs-api-backend/frontend/综合展示中心-网络规模接口.md` | **整合**（合并入 §B）                              | 同上                                                                       | plan-003 阶段 2 |
| `docs-api-backend/摄像头/camera-list.ts` + `camera-video.ts` | **整合**（TS 转 Markdown）                         | `docs/design/api-contracts.md §C「摄像头接口」附录`                       | plan-003 阶段 2 |
| `docs-api-backend/摄像头/机房安全管理平台v1.8-20251230.docx` | **不整合**（二进制 + 外部供应商文档）                | 保留在 `docs-api-backend/摄像头/`（外部资料）                             | —              |
| `docs-api-backend/metahuman/02-screen-api.md` | **不整合**（外部大屏 SDK 规范，非本项目契约）        | 保留在 `docs-api-backend/metahuman/`                                       | —              |
| `docs-api-backend/metahuman/README-control-sdk.md` | **不整合**（外部 SDK 使用说明）                      | 同上                                                                       | —              |
| `docs-api-backend/metahuman/control-test.html` | **不整合**（测试页）                                | 同上                                                                       | —              |
| `public/static/doc/指挥调度中心跳转.md`   | **迁移**到 docs/specs（作为 spec 资产）             | `docs/specs/five-major-center/cmd-dispatcher-center/pm-inputs/assets/iframe-ticket-mechanism.md` | plan-003 阶段 2 |
| `public/static/mock/**/*.json`            | **保留在原位** + 索引到 docs/design/api-contracts.md §Z「mock 数据索引」 | 89+ JSON 不迁移；docs/ 仅建立清单 + 标注「mock 阶段 → 待 YAPI 导出」 | plan-002 步骤 5 + plan-003 阶段 2 |
| `public/static/doc/`（迁移后空目录）       | **删除**                                          | —                                                                         | plan-003 阶段 2 |
| `README.md`（1 行版）                     | **保持现状**（仅项目名）                            | —                                                                         | —              |
| `README.Dev.md`（3 行版）                 | **重写**为开发者文档（含项目介绍 + 关联 docs/）      | `README.Dev.md`                                                           | plan-002 步骤 12 前 |

---

## 1. Q-401 `docs-api-backend/` 整合方案

### 1.1 现有内容清点

> 来源：`docs-api-backend/` `LS` 结果

| 子路径                          | 文件类型     | 行数（约）| 内容主题                                                              | 整合判断                          |
| ------------------------------- | ------------ | --------- | --------------------------------------------------------------------- | --------------------------------- |
| `右屏网络情况接口.md`            | 手写 MD      | 2200+     | `view/getViewItemData` 后端接口契约 + 9 类视图                       | **整合**：与 network-conditions 子模块强关联 |
| `frontend/增补接口-2026年4月8日.md` | 手写 MD      | 400       | 中屏地图 + 网络规模（与下两份有重复）                                 | **整合**：合并入 §B                |
| `frontend/综合展示中心-地图数据接口.md` | 手写 MD      | 400       | 中屏地图数据接口（个人/政企/家庭业务）                                | **整合**：合并入 §B                |
| `frontend/综合展示中心-网络规模接口.md` | 手写 MD      | 490       | 右屏网络规模接口（6 类网络）                                          | **整合**：合并入 §B                |
| `摄像头/camera-list.ts`         | TS 源码      | 30        | 摄像头列表 POST 接口（snowflake-id-js）                              | **整合**：TS → Markdown            |
| `摄像头/camera-video.ts`        | TS 源码      | 20        | 摄像头视频 POST 接口                                                  | **整合**：TS → Markdown            |
| `摄像头/机房安全管理平台v1.8-20251230.docx` | 二进制 docx | —         | 外部供应商文档（机房安全管理平台）                                     | **不整合**（非本项目契约）          |
| `metahuman/02-screen-api.md`    | 手写 MD      | 800+      | 大屏 WebSocket 接口规范 v2.1（外部大屏应用，非本项目）                 | **不整合**（外部依赖）              |
| `metahuman/README-control-sdk.md` | 手写 MD      | 200+     | 亿阳数字人 SDK 使用说明（外部 SDK）                                   | **不整合**（外部依赖）              |
| `metahuman/control-test.html`   | HTML         | —         | 测试页（外部 SDK 调试）                                                | **不整合**（外部依赖）              |

### 1.2 整合方案

**推荐：整合到 `docs/design/api-contracts.md` 作为附录章节**，不另建 `docs/design/api-backend/` 目录。

> 理由：
> - 模板约定 `api-contracts.md` 是「HTTP 契约索引」（finding §1.2），散落契约统一进同一文件，便于检索
> - 业务域清晰的拆分（应急保障大屏 / 五大中心 / 摄像头）以章节区分，无需目录嵌套
> - 避免与未来 `docs/design/api/`（YAPI JSON 快照目录，finding §3.2）混淆

### 1.3 api-contracts.md 章节组织（推荐）

```
docs/design/api-contracts.md
├── §0 契约总览（接口列表）
├── §A 应急保障大屏网络情况接口
│   ├── A.1 接口地址
│   ├── A.2 kpiType 映射表（1-24）
│   ├── A.3 弹窗-折线图
│   ├── A.4 弹窗-柱状图
│   ├── A.5 应急物资
│   ├── A.6 详情-停电和发电
│   ├── A.7 详情-超级基站和一镇四站
│   ├── A.8 详情-物理退服
│   ├── A.9 详情-逻辑退服
│   ├── A.10 详情-245G退服
│   ├── A.11 详情-核心机楼汇聚机房停电
│   ├── A.12 详情-核心机楼汇聚机房环境
│   ├── A.13 详情-一干二干本地
│   ├── A.14 详情-重保专线
│   ├── A.15 详情-集客其他
│   ├── A.16 详情-批量PON
│   ├── A.17 详情-BRAS退服
│   └── A.18 详情-OLT退服
├── §B 五大中心综合展示接口
│   ├── B.1 中屏地图数据接口（个人业务 / 政企业务 / 家庭业务）
│   └── B.2 右屏网络规模接口（6 类网络）
├── §C 摄像头接口
│   ├── C.1 摄像头列表查询
│   └── C.2 摄像头视频查询
└── §Z mock 数据索引（plan-002 步骤 5 落盘）
```

### 1.4 不整合项的去留

| 不整合项                                | 去留判断                                                                                  |
| --------------------------------------- | ----------------------------------------------------------------------------------------- |
| `docs-api-backend/摄像头/机房安全管理平台v1.8-20251230.docx` | **保留**：外部供应商文档，与 docs/ 闭环无关；不属于本项目契约                              |
| `docs-api-backend/metahuman/*`（3 个文件）| **保留**：外部大屏 SDK 文档；非本项目契约；如需在本项目 docs/ 引用，应写 `docs/design/framework-communication.md §iframe-external-deps` 章节 |
| `docs-api-backend/frontend/*` 整合后     | **删除**：整合入 §B 后，原文件不再需要                                                     |
| `docs-api-backend/右屏网络情况接口.md` 整合后 | **删除**：整合入 §A 后，原文件不再需要                                                     |
| `docs-api-backend/摄像头/camera-{list,video}.ts` 整合后 | **删除**：TS 转 Markdown 入 §C 后，原文件不再需要                                          |

### 1.5 迁移步骤（plan-003 阶段 2 执行）

| 步骤 | 操作                                                                                          | 工具                                                |
| ---- | --------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 1    | 创建 `docs/design/api-contracts.md` 占位（plan-002 步骤 5 已建）                               | 手动                                                |
| 2    | 把 `右屏网络情况接口.md` 9 个 kpiType 视图整理为 §A 子章节                                      | Node.js 脚本（`.trae/skills/oss-vis-gd-project-context/scripts/`）         |
| 3    | 把 `frontend/增补接口-2026年4月8日.md` + `frontend/综合展示中心-地图数据接口.md` + `frontend/综合展示中心-网络规模接口.md` 去重合并入 §B | Node.js 脚本（脚本去重 + 段合并）                   |
| 4    | 把 `摄像头/camera-list.ts` + `camera-video.ts` 转为 Markdown 入 §C                              | 手工（每文件 30 行）                                |
| 5    | 把 §Z mock 数据索引生成（扫描 `public/static/mock/` 全 JSON）                                  | Node.js 脚本（auto-generate-mock-index.js）         |
| 6    | 删除已整合的 `docs-api-backend/` 文件（保留 metahuman/ 和 摄像头/机房安全管理平台.docx）         | 手动 + Git                                          |

---

## 2. Q-402 `public/static/doc/指挥调度中心跳转.md` 去留

### 2.1 现有内容

> 来源：`public/static/doc/指挥调度中心跳转.md`（23 行）

```
- 维护一套数据（list 配置：label / viewType / thumbImage / url / width / height）
- url 带 {{real_ticket}} 占位符
- 打开页面时获取票据数据 → 替换占位符
- 第三方页面解析 url 中的字段
```

**主题**：iframe 跳转票据机制（外部系统鉴权）

**业务归属**：five-major-center.cmd-dispatcher-center 子中心（其他子中心也可能用）

### 2.2 推荐处理

**推荐：迁移到 `docs/specs/five-major-center/cmd-dispatcher-center/pm-inputs/assets/iframe-ticket-mechanism.md`**

理由：
- 该机制是 cmd-dispatcher-center 子中心的**业务契约**（不是公共契约）
- `pm-inputs/assets/` 是 spec 的资产目录（finding §1.2 + Stage B §1）
- 迁出后 `public/static/doc/` 变空目录，可直接删除（违反 Rule 2「项目内闭环」）

### 2.3 迁移后业务归属

- cmd-dispatcher-center spec.md §6「iframe 集成」章节引用 `pm-inputs/assets/iframe-ticket-mechanism.md`
- five-major-center 伞形 spec.md §6 引用 cmd-dispatcher-center §6（避免重复）
- 其他使用 iframe 的子中心（comprehensive-display-center / situation-awareness-center）如复用此机制，复制一份到对应 spec/pm-inputs/assets/

---

## 3. Q-403 `public/static/mock/*.json` 索引规范

### 3.1 现有内容

> 来源：`public/static/mock/` 目录结构

| 子目录                                  | 文件数 | 主题                                                  |
| --------------------------------------- | ------ | ----------------------------------------------------- |
| `cmd-dispatcher-center/`                | 1      | 应急资源点                                            |
| `comprehensive-display-center/`         | 25     | 综合展示中心（showCenter-* 系列）                     |
| `five-major-center/`                    | 6      | 五大中心（值班 / 保障任务点 / 应急储备 / 影响图表）   |
| `info-management-bureau/`               | 22     | 信管局视图（开闭幕式 / 比赛日 / 首页 / 倒计时）       |
| `information-hub-center/`               | 30     | 信息情报中心（**路由未注册，待 Stage C 摸排**）        |
| `screen-list.json`                      | 1      | screen-list 总览                                      |
| **合计**                                 | **85 个 JSON**                                          |

### 3.2 推荐处理

**推荐：保留在原位 + 在 `docs/design/api-contracts.md §Z` 建立索引**

理由：
- mock 数据是**运行时依赖**（fedx-ssr external 加载 + BFF `src/mock/` 引用）
- 移入 `docs/` 会破坏运行时依赖（fedx-ssr 不会从 docs/ 目录加载 mock）
- docs/ 是**项目交付物**，mock 数据是**开发期数据**，本质不同

### 3.3 §Z mock 数据索引规范

```markdown
## §Z mock 数据索引

> ⚠️ **mock 阶段 → 待 YAPI 导出**：当前所有 mock 数据位于 `public/static/mock/`，后端 YAPI 导出后将替换为 `docs/design/api/<module>.json`。

### §Z.1 应急保障大屏（emergency-support-dashboard）

- ⚠️ **本目录无独立 mock**：emergency-support-dashboard 的 7 子模块共用 BFF 端点 `/api/index` 与 `/api/detail/:id`，mock 数据由 `src/mock/{index,detail}.ts` 提供。

### §Z.2 五大中心（five-major-center）

#### cmd-dispatcher-center/

| 文件                                                    | 用途                            |
| ------------------------------------------------------- | ------------------------------- |
| `emergency-resource-point.json`                         | 应急资源点列表（地图标注）      |

#### comprehensive-display-center/

| 文件                                                    | 用途                            |
| ------------------------------------------------------- | ------------------------------- |
| `showCenter-02.json` ~ `showCenter-58.json`（25 个）    | 综合展示中心各视图 mock          |

#### five-major-center/

| 文件                                                    | 用途                            |
| ------------------------------------------------------- | ------------------------------- |
| `command-dispatch-center-left-page-support-mission-info.json` | 左屏保障任务信息              |
| `command-dispatch-center-middle-page-support-mission-point.json` | 中屏保障任务点                |
| `duty-schedule.json`                                   | 值班表                          |
| `emergency-resource-reserves.json`                     | 应急储备                        |
| `network-impact-region-chart.json`                      | 网络影响区域图                  |
| `network-impact-trend-chart.json`                      | 网络影响趋势图                  |

### §Z.3 信管局视图（info-management-bureau）

22 个 JSON，覆盖开闭幕式 / 比赛日 / 首页 / 倒计时 4 类子视图。

### §Z.4 信息情报中心（information-hub-center）

30 个 JSON，⚠️ **路由未注册**（待 Stage C 摸排）。

### §Z.5 screen-list

| 文件                | 用途                                       |
| ------------------- | ------------------------------------------ |
| `screen-list.json`  | 8 个 screen ID（screen1~screen8）的元数据   |
```

### 3.4 索引生成脚本（plan-003 阶段 2）

按 Rule D-13（脚本优先），用 Node.js 脚本：

```javascript
// .trae/skills/oss-vis-gd-project-context/scripts/2026-07-29-generate-mock-index.js
// 作用：扫描 public/static/mock/ 全 JSON，输出 §Z 索引 markdown 段
// 用法：node .trae/skills/oss-vis-gd-project-context/scripts/2026-07-29-generate-mock-index.js > docs/design/api-contracts.md.draft
```

---

## 4. Q-404 `README.md` / `README.Dev.md` 重写判断

### 4.1 现有内容

> `README.md`：1 行（"广东移动_应急保障可视化大屏"）
> `README.Dev.md`：3 行（npm 脚本说明）

### 4.2 推荐处理

**推荐：**

- `README.md`：**保持现状**（仅项目名）；理由——
  - 是项目首屏入口，1 行简洁清晰
  - 模板约定 `README.md` 通常是项目说明，**详细开发者文档应放 docs/**
  - 如要扩展，建议加 1 行简介 + 链接到 `/docs/`

- `README.Dev.md`：**重写为开发者文档**（plan-002 步骤 12 同步前执行）；内容——
  - 项目简介（1-2 句）
  - 技术栈摘要（指向 docs/design/tech-stack.md）
  - 常用脚本（start / build / prod / lint）
  - 目录结构摘要
  - 关联文档入口（指向 docs/）
  - 故障排查（指向 docs/operations/troubleshooting.md）

### 4.3 重写后的 README.Dev.md 结构（草稿）

```markdown
# oss-visual-gd-emergency-support — 开发者指南

> **类型**：前端单体（BFF + SSR + 大屏可视化）
> **项目中文名**：广东移动_应急保障可视化大屏

## 快速开始

\`\`\`bash
pnpm install                  # 依赖安装
pnpm start                    # 本地开发（fedx-ssr dev server，端口 9032）
pnpm run start:local-env      # 本地开发 + 启用 ENABLE_LOCAL_ENV
pnpm run build                # 生产构建（fedx build + build-patch）
pnpm run prod                 # 构建 + pm2 启动
pnpm run lint                 # eslint 检查
pnpm run lint:fix             # eslint 自动修复
\`\`\`

## 文档

详细文档见 [`docs/`](./docs/)：

- **入门**：[docs/index.md](./docs/index.md)
- **技术栈**：[docs/design/tech-stack.md](./docs/design/tech-stack.md)
- **架构**：[docs/design/architecture.md](./docs/design/architecture.md)
- **部署**：[docs/operations/deployment.md](./docs/operations/deployment.md)
- **故障排查**：[docs/operations/troubleshooting.md](./docs/operations/troubleshooting.md)

## 目录结构

\`\`\`
.
├── src/                       # BFF + SSR 源码（无视图层）
│   ├── controller/            # 路由 + SSR 入口
│   ├── service/               # 服务层
│   ├── interface/             # TS 类型
│   ├── mock/                  # mock 数据源
│   ├── socket/                # Socket.IO
│   ├── modules/               # 公共模块
│   └── configuration.ts       # midway IoC 装配
├── public/                    # 前端静态资源
│   ├── static/
│   │   ├── mock/              # 前端 mock JSON（运行时依赖）
│   │   ├── doc/               # 文档（迁移至 docs/specs 后删除）
│   │   └── ...                # 静态资源（图标 / 截图）
│   └── environment.json       # 环境配置（含大屏配置）
├── docs/                      # 项目文档（详见 docs/index.md）
└── ...
\`\`\`

## 故障排查

- BFF 启动失败：[docs/operations/troubleshooting.md §1](./docs/operations/troubleshooting.md)
- mock 数据不生效：[docs/operations/troubleshooting.md §2](./docs/operations/troubleshooting.md)
- 视图层加载失败：[docs/operations/troubleshooting.md §3](./docs/operations/troubleshooting.md)
```

### 4.4 关联决策

- `README.Dev.md` 是项目交付物，**不属于 docs/** 目录
- 引用 `docs/` 路径属于**项目内闭环**（符合 Rule 2）
- 写入时机：plan-002 步骤 12（同步 roadmap 前），作为 docs/ 落盘的最后一环

---

## 5. 沉淀决策（追加 roadmap §2）

| 决策编号 | 决策内容                                                                                                                                                | 来源 |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| D-23     | **docs-api-backend/ 整合方案**：`右屏网络情况接口.md` → `docs/design/api-contracts.md §A`；`frontend/*`（3 个）去重合并 → §B；`摄像头/*` TS 转 MD → §C；`metahuman/*` 与 `摄像头/机房安全.docx` 不整合，保留原位。`public/static/doc/指挥调度中心跳转.md` → `docs/specs/five-major-center/cmd-dispatcher-center/pm-inputs/assets/iframe-ticket-mechanism.md`。`public/static/mock/**/*.json` 保留原位 + 在 `api-contracts.md §Z` 建索引。`README.md` 保持 1 行版；`README.Dev.md` 重写为开发者文档 | Stage E §1 + §2 + §3 + §4 |

---

## 6. 完成定义（DoD）

- [x] Q-401 docs-api-backend/ 整合方案（§1）：3 类整合（§A §B §C）+ 4 类不整合
- [x] Q-402 public/static/doc/ 迁移方案（§2）：跳转说明迁移到 cmd-dispatcher-center spec
- [x] Q-403 mock 索引规范（§3）：§Z 索引 + Node.js 脚本生成
- [x] Q-404 README 处理（§4）：README.md 保持 + README.Dev.md 重写草稿
- [x] 沉淀决策 D-23 待 roadmap §2 追加
- [x] 未动业务代码
- [x] 未引用 `.trae/` 与 `.local-docs/`（Rule 2）
- [x] 实施阶段已标注（plan-002 步骤 5 / 步骤 12 / plan-003 阶段 2）

---

## 7. 不在本文件范围内（OUT）

- ❌ 实际整合 docs-api-backend/（属 plan-003 阶段 2）
- ❌ 实际生成 §Z mock 索引（属 plan-003 阶段 2）
- ❌ 实际重写 README.Dev.md（属 plan-002 步骤 12）
- ❌ 实际删除 public/static/doc/（属 plan-003 阶段 2）
- ❌ information-hub-center 定性（待 Stage C 摸排 — 已知结果：待 plan-003 阶段 2 摸排后再决定）

---

## 8. 关联文档

| 文档                                                                                                            | 说明                                                |
| --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `.trae/skills/oss-vis-gd-project-context/plans/roadmap.md`                                                                                | 整体路线图                                          |
| [`./2026-07-29-001-docs-template-structure-findings.md`](./2026-07-29-001-docs-template-structure-findings.md) | 第一轮 finding（现有文档情况 §2.5）                  |
| [`./2026-07-29-003-docs-mvp-structure.md`](./2026-07-29-003-docs-mvp-structure.md)                             | 上游 Stage B（api-contracts.md 占位设计）           |
| [`./2026-07-29-004-modules-spec-strategy.md`](./2026-07-29-004-modules-spec-strategy.md)                       | 上游 Stage C（spec 拆分 → 整合位置归属）            |
| `.trae/skills/oss-vis-gd-project-context/plans/2026-07-29-002-plan-docs-foundation.md`          | 下游：plan-002 步骤 5（api-contracts.md 占位）+ 步骤 12（README.Dev.md 重写） |
| `.trae/skills/oss-vis-gd-project-context/plans/2026-07-29-003-plan-modules-specs.md`                | 下游：plan-003 阶段 2（实际整合 docs-api-backend/） |