# AGENTS.md

> AI Agent / 贡献者工作约定
> 本文件通过 symlink 同步到仓库根 `AGENTS.md`，请在对应 skill 的 `env/` 源文件下编辑。

## 项目简介

`oss-metahuman-demonstrate-project` 是一个基于 Midway.js + fedx-ssr 的数字人演示项目，前端 React 18 + TypeScript，主要承载山西联通 / 陕西 / 北京移动等大屏演示场景。

## 仓库根关键文件

| 文件                      | 来源                  | 用途                                           |
| ------------------------- | --------------------- | ---------------------------------------------- |
| `.pnpmfile.cjs`           | skill env/（symlink） | pnpm 安装期的依赖 patch（`hooks.readPackage`） |
| `AGENTS.md`               | skill env/（symlink） | 本文，AI Agent / 贡献者约定                    |
| `package.json`            | 仓库维护              | 项目依赖与脚本                                 |
| `config.ts`               | 仓库维护              | fedx-ssr `UserConfig`                          |
| `pm2.config.js`           | 仓库维护              | PM2 部署配置                                   |
| `public/environment.json` | 仓库维护              | 运行时前端配置                                 |

## 对抗幻觉

-   以代码库、工具输出和可验证证据为准，不凭记忆臆造文件路径、配置、接口、报错或执行结果。
-   明确区分已验证事实、合理推断和待确认信息；信息不足或存在歧义时先检查、询问，不得自行补全。
-   回答或实施需求前先阅读相关代码；修改时保持范围最小，不虚构不存在的实现，也不声称未执行的检查已经通过。
-   引用代码时提供真实、可点击的文件链接和行号；未实际运行验证时必须明确说明，不得给出“已验证”结论。
-   发现假设、证据不足或潜在风险时主动指出，避免用流畅但未经证实的结论掩盖不确定性。

## 开发约定

### 依赖变更

-   新增 / 升级依赖：直接编辑 `package.json`，不要改 `.pnpmfile.cjs`。
-   需要 patch 特定包（如覆盖 antd 版本、追加 `@babel/*` 等）→ 编辑 `.pnpmfile.cjs` 的 `hooks.readPackage`。
-   修改 `.pnpmfile.cjs` 时确保只在 `pkg.name` 匹配的分支中操作，避免污染其它包。

### 启动与构建

-   本地开发：`pnpm start`（默认） / `pnpm run start:local-env`（启用 `ENABLE_LOCAL_ENV`）
-   生产构建：`pnpm run build` 或 `pnpm run build:o`
-   生产部署：`pnpm run prod`
-   详见 `package.json` 的 `scripts` 字段。

### 目录约定

```
src/                Midway.js 后端（controller / service / socket / mock）
web/                前端（components / pages / hooks / services / store / utils）
public/             静态资源 + environment.json + meta-human-sdk
.pnpmfile.cjs       依赖 patch（symlink → skill env/）
AGENTS.md           本文件（symlink → skill env/）
```

### Skill 体系

本项目在 `.trae/skills/` 下维护多个 skill：

-   `oss-demonstrate-project-context` —— 仓库根上下文文件管理（本文所属）
-   `oss-demonstrate-project-bj-cmcc-cmd-dispatcher` —— 北京移动指挥调度模块

修改仓库根的 `.pnpmfile.cjs` 或 `AGENTS.md` 前，请先确认对应 skill 的 `SKILL.md`。

### markdown 链接约定（引用代码路径）

在 `.md` / `.mdx` / 任何文档里引用仓库代码时，**必须用仓库根相对路径**，不要写基于当前 md 文件位置的反向相对路径。理由：

-   反向路径（`../../../../web/...`）依赖当前 md 文件的目录深度，移动文件即失效
-   仓库根相对路径（`web/...` / `src/...` / `public/...`）跨文件位置稳定，全项目统一

```markdown
<!-- 推荐：仓库根相对路径 -->
[modules/service-recovery/index.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/service-recovery/index.tsx)
[controller/index.ts](src/controller/index.ts)
[map-markers.json](public/static/mock/bj-cmcc-cmd-dispatcher/map-markers.json)

<!-- 反例：基于当前 md 文件的反向相对路径（移动文件即失效） -->
[modules/service-recovery/index.tsx](../../../../web/pages/bj-cmcc-cmd-dispatcher/modules/service-recovery/index.tsx)
[controller/index.ts](../../../../src/controller/index.ts)
```

**规则摘要**：
-   `web/...` → 前端代码 / 组件 / 页面 / hook / store
-   `src/...` → 后端（Midway controller / service / mock）
-   `public/...` → 静态资源 / mock JSON
-   skill 文档内部互相引用（`./` / `../`）**不适用**本规则——它们之间的相对路径照常写

## 提交流程

1. 修改代码 / 配置
2. 同步更新相关 skill 的 `design/` 与 `status/`
3. 跑 `pnpm run lint` 自检
4. 提交信息遵循项目约定（见 git log）

## 常见陷阱

-   pnpm 版本：本项目锁定 `pnpm@8.6.2`（见 `packageManager` 字段），请勿混用 npm / yarn。
-   端口：默认 `9033`，被占用时需修改 `config.ts` 的 `fePort` 与 `pm2.config.js` 的 `SERVER_PORT`。
-   静态资源：上传到 `public/static/` 后走 `koa-static-cache` 直出，无需重启。
-   数字人 SDK：`public/static/meta-human-sdk/sdk-dist/` 是打包产物，不要直接编辑。
