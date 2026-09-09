# AGENTS.md

本仓根级治理入口为 `.trae/rules/项目规则.md`（目录位置、命名、pnpm 约定等以该文件为准，此处不复述）。

本仓项目治理 skill 为 oss-vis-gd-es-project-context（与目录名 / frontmatter name 一致）；接手会话时先读该 skill 的 SKILL.md，再按 Pointer Map 加载上下文。

## 协作补充（根规则未覆盖部分）

- 可观察目录：全仓源码与文档（apps/、packages/、.trae/）。不可观察：node_modules、dist、.next、packages/.local-temp。不读密钥 / .env / credentials。
- 每条信息只落一个文件：结构类信息写 design/architecture.md，计划类写 plans/，勿在多处复述。
- 写入前先探查现状；负断言（「无 X」）须对照本次 LS / 读文件结果，拿不准写「待定」。
- 涉及 GIS 模块改动时，先看 apps/main/app/components/fields.ts 的派发 / 消费映射。

## 质量门槛

- 提交前在仓库根执行 `pnpm lint`。
- 主应用本地验证：`pnpm dev:main`（端口 3012）。
