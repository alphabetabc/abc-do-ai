# 私人备忘（Private Notes）

> **仅本地、不入库**：这一区用于放「不方便写进项目正式文档」的私人草稿、灵感、踩坑记录。
>
> 写进这里之前，先问自己一句：**别的同事需要看到吗？**
>
> - 是 → 写进 `docs/`、`AGENTS.md`、`README.md`
> - 否 → 写这里

---

## 2026-08-11 · 草稿与灵感

### 大屏图表选型（未定）

- 候选方案：
    - **ECharts**（百度，已成熟，主题丰富）
    - **AntV G2 / G2Plot**（蚂蚁，与 Antd 视觉统一性最好）
    - **Recharts**（React 友好，定制灵活但偏弱）
- 倾向：AntV G2Plot（设计资源对接方便，主题色与 Antd 6 接近）
- ⚠️ **不要写进团队文档**：等跟设计资源对接完、跑通 demo 再决定

### 大屏分辨率 / 适配思路

- 主流展示端：1920×1080 单屏 / 2×2 KVM 拼接 / 8K
- 数据大屏习惯用 `scale` 缩放 + `transform-origin: top left`，配合 `vh/vw` 单位
- ⚠️ **私人方案**：可以参考 `datav-vue3` 的 viewport 适配思路，但需自实现

### 信访大屏 K-V 数据待确认

- `letter_screen_5` 字段名带 `cant_name` / `letter_count`，与 `dw_basic_lc.abi_wjj` 口径是否一致？
- ⚠️ **先别问 PM**，自己翻一份 dump 数据验证一下再说

---

## 踩坑记录（Pitfalls）

### 2026-08-11 · Trae IDE / 文档规则

- `docs/` 下的所有文档**不要**用 markdown 链接或文本方式引用：
    - `.trae/` 下任何内容
    - `AGENTS.md`
    - `.local-*` 文件
- 详见 `.trae/rules/docs-no-private-refs.md`
- 内部/私人引用一律走代码围栏：`AGENTS.md`、`design/architecture.md`

### AGENTS.md 同步

- skill 里 `env/AGENTS.md` 是仓库根的**硬链接**（NTFS），不是拷贝
- 不要 `Copy-Item`，会失去同步能力
- 跨机器 clone 后要重新执行 `New-Item -ItemType HardLink`

### 仓库根 package.json 同步

- 跟 AGENTS.md 同样策略：`skill/env/package.json` ↔ 仓库根 `package.json`，NTFS 硬链接
- 运行根 scripts 时**必须在仓库根目录**，否则 pnpm 会去找 `frontend/package.json` 里的同名 script，自然找不到
- 报错关键词（误诊为「`:` 命名冲突」）：`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "xxx" not found`
    - 实际根因多半是当前目录不对，不是 `:` 的问题
    - 教训：先确认 `pwd` / `Get-Location` 再看错误

### Markdown 链接 → 代码引用

- 用户偏好：在 skill / 个人文档中**不使用** Markdown 链接，全部以 `` `path/to/file` `` 表达
- 团队文档（`docs/`）按原有规范走

---

## 与 AI Agent 的约定

- 收到项目相关任务时，先 `Read` 本文件 + 各子目录的 `README.md` 再动手
- 涉及修改 `docs/`、`frontend/`、`backend/` 的工作前，先看 `.trae/rules/` 有没有相关 rule
- 涉及大屏开发时，**必须**先 `Read` `AGENTS.md`（硬链接在 `env/AGENTS.md`）
- 草稿先放本 skill，验证 / 拍板后再迁移到正式文档

---

## 待办（私人）

- [ ] 抽时间跑一遍 `frontend/src/` 真实结构，看 `pages/visual/` 已有哪些目录
- [ ] 与设计资源同步大屏视觉稿前，列一份问题清单
- [ ] 重读 `035-visual-monthly-statistics/spec.md` 看 M4 分析报告的具体范围
- [ ] 把 `frontend` + `backend` 跑起来过一次，验证本机环境是否完整

---

## 变更记录

| 日期       | 备注               |
| ---------- | ------------------ |
| 2026-08-11 | 初始化私人备忘文件 |
