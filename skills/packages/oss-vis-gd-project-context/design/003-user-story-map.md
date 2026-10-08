# 003-user-story-map.md

## 角色

- 前端开发：日常迭代大屏模块（页面 / 接口层 / mock）。
- 大屏运维：本地起服务、构建、pm2 部署。
- PM / 协作者：按 phase 推进 spec，查当前计划索引与 backlog。

## 主旅程（前端开发 · 按 phase 推进一个模块）

1. 加载上下文：读 `oss-vis-gd-project-context/SKILL.md` → Pointer Map → `env/AGENTS.md`（命令 / 目录边界）→ `design/002-architecture.md`（定位模块）。
2. 定位模块：`web/pages/<module>/` 页面 + `web/services/<module>/` 接口层 + `public/static/mock/<module>/` mock，三者同 slug 对应。
3. 接口对接：走 `web/services/request/` 封装，配 `baseUrlType`；联调前用 `localMockUrl` 指向本地 mock。
4. 验证：`pnpm lint` 通过；`pnpm start` 本地 9032 端口目检。
5. 阶段收尾：更新 `plans/current-sprint.md` 索引；沉淀结论进 roadmap / backlog。

## 辅助旅程

- 运维：`pnpm build` → `pnpm prod`（pm2 启动）。
- PM：新阶段立 spec → `plans/current-sprint.md` 挂链接 → 完成后归档，待评估项进 `plans/backlog.md`。
