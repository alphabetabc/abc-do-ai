# 公共配置参考

> 版本：1.0.0 | 日期：2026-07-23

> 各分支共享的配置说明与操作指南。各 `branch-*.md` 文档引用本文件，仅保留分支专属内容。

---

## 1. 核心工作流

1. **执行分支检查**：`node scripts/check-branch.mjs --branch <分支名>`
2. **读取实际配置**：读取项目根目录的 `pnpm-workspace.yaml` 与 `.pnpmfile.cjs`
3. **参考 `yarn.lock`**：修改依赖版本前，查阅 `yarn.lock` 中该包的实际锁定版本
4. **与分支文档对比**：核对 `overrides` / `readPackage` 注入项是否与分支文档快照一致
5. **用户确认**：不一致时向用户报告差异，询问是否更新
6. **修改 + 同步**：用户确认后修改实际配置文件，并同步更新对应分支文档快照

---

## 2. 文件位置表

| 文件           | 路径（相对项目根目录）               | 用途                                  |
| -------------- | ------------------------------------ | ------------------------------------- |
| workspace 配置 | `pnpm-workspace.yaml`                | 工作区/overrides/allowBuilds/settings |
| pnpm hooks     | `.pnpmfile.cjs`                      | readPackage 依赖注入                  |
| 依赖锁定快照   | `yarn.lock`                          | 历史依赖树真实快照，版本参考基准      |
| package.json   | `package.json`                       | resolutions 字段（与 overrides 对比） |
| 本地依赖目录   | `.yalc/`、`.yalc/@*/*`、`packages/*` | yalc 本地包链接 / workspace 子包      |
| 分支检查脚本   | `scripts/check-branch.mjs`           | 获取并校验当前分支                    |

---

## 3. pnpm-workspace.yaml 配置

### 3.1 完整快照

```yaml
packages:
    - .yalc/
    - .yalc/@*/*
    - packages/*
    - packages-next/*

allowBuilds:
    core-js: false
    core-js-pure: false
    ejs: false
    es5-ext: false
    esbuild: false
    fsevents: false

overrides:
    '@types/react': 17.0.30
    '@types/react-dom': 17.0.11
    oss-ui: 0.1.94
    antd: 4.16.2
    antd-img-crop: 3.16.0
    '@types/react-router-dom': 5.3.3
    react-error-overlay: 6.0.9
    react: 17.0.2
    react-dom: 17.0.2
    typescript: 4.9.5
    react-intl-universal: 2.4.2
    react-router-dom: 5.3.4
    react-router: 5.3.4
    #oss-web-common: 0.3.1

settings:
    autoInstallPeers: true
    excludeLinksFromLockfile: false
```

### 3.2 字段说明

| 字段                                | 说明                                                                                               |
| ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| `packages`                          | 工作区子包目录：`.yalc/`（本地链接）、`.yalc/@*/*`（scoped yalc）、`packages/*`、`packages-next/*` |
| `allowBuilds`                       | 禁止以下包执行 install/build 脚本：core-js、core-js-pure、ejs、es5-ext、esbuild（避免副作用）      |
| `overrides`                         | 全局版本锁定（见下表）                                                                             |
| `settings.autoInstallPeers`         | 自动安装 peer 依赖                                                                                 |
| `settings.excludeLinksFromLockfile` | false（链接包仍写入 lockfile）                                                                     |

### 3.3 overrides 关键版本表

| 依赖                            | 版本              | 说明                                              |
| ------------------------------- | ----------------- | ------------------------------------------------- |
| react / react-dom               | 17.0.2            | React 17，禁止升级到 18                           |
| @types/react / @types/react-dom | 17.0.30 / 17.0.11 | 与 React 17 对齐                                  |
| antd                            | 4.16.2            | 锁定 4.16，不升级 5.x                             |
| oss-ui                          | 0.1.94            | 内部 UI 库                                        |
| typescript                      | 4.9.5             | TS 4.9，不升级 5.x                                |
| react-router-dom                | 5.3.4             | RR5，不升级 6.x                                   |
| react-router                    | 5.3.4             | RR5 核心，与 react-router-dom 对齐                |
| react-intl-universal            | 2.4.2             | 国际化                                            |
| antd-img-crop                   | 3.16.0            | 图片裁剪                                          |
| react-error-overlay             | 6.0.9             | CRA 错误覆盖层                                    |
| oss-web-common                  | （注释）          | overrides 中被注释，实际由 .pnpmfile.cjs 动态注入 |

---

## 4. @fedx-vis/\* workspace 包说明

`.pnpmfile.cjs` 的 `oss-visual-designer` 注入块中包含 6 个 `@fedx-vis/*` workspace 依赖，各分支的启用/注释状态见对应分支文档。

| 包名                     | workspace 路径      | yarn.lock 锁定版本     | 说明                              |
| ------------------------ | ------------------- | ---------------------- | --------------------------------- |
| @fedx-vis/designer-types | `packages/types/`   | 0.0.8                  | 设计器公共 TypeScript 类型        |
| @fedx-vis/request        | `packages/request/` | 0.0.2                  | 请求层封装                        |
| @fedx-vis/share          | `packages/share/`   | 0.0.9（^0.0.9）/ 0.0.8 | 共享枚举、schema、工具            |
| @fedx-vis/ui             | `packages/ui/`      | 0.0.1（^0.0.1）        | UI 组件（素材选择器、视口管理）   |
| @fedx-vis/utils          | `packages/utils/`   | 0.0.12 / 0.0.7         | 工具函数                          |
| @fedx-vis/hooks          | `packages/hooks/`   | （无 yarn.lock 记录）  | hooks 工具包，纯本地 workspace 包 |

> **注意**：`workspace:*` 表示 pnpm 会链接到 `pnpm-workspace.yaml` 中 `packages/*` 下对应的本地子包，而非从 registry 拉取。`yarn.lock` 中的版本记录为历史 yarn 管理时期的快照，仅作参考。

---

## 5. fetchers 映射表

> 本项目未使用本地 tarball fetcher 机制，依赖通过 npm registry + yalc 本地链接获取。

| 包 ID  | tarball 文件名 | 本地目录 | 完整路径 |
| ------ | -------------- | -------- | -------- |
| （无） | —              | —        | —        |

> 本地依赖目录 `.yalc/` 用于 yalc 链接的本地开发包，非 tarball fetcher。

---

## 6. package.json resolutions 同步

### 6.1 当前 resolutions 内容

```json
{
    "resolutions": {
        "@types/react": "17.0.30"
    }
}
```

### 6.2 与 overrides 对比

| 依赖         | resolutions (package.json) | overrides (pnpm-workspace.yaml) | 是否一致 |
| ------------ | -------------------------- | ------------------------------- | -------- |
| @types/react | 17.0.30                    | 17.0.30                         | ✅ 一致  |

> `resolutions` 是 yarn 遗留字段，pnpm 读取 `overrides`。当前 `resolutions` 仅保留 `@types/react` 一项，与 `overrides` 对齐。新增覆盖时只需改 `overrides`，`resolutions` 可逐步清理（非阻塞）。

---

## 7. 常见操作指南

### 7.1 新增依赖覆盖

在 `pnpm-workspace.yaml` 的 `overrides` 下添加：

```yaml
overrides:
    'new-package': '1.2.3'
```

执行 `pnpm install` 生效。

### 7.2 新增本地 tarball fetcher

本项目不使用 tarball fetcher。如需引入本地包，使用 yalc：

```bash
yalc add <package>
# 或 yalc link <package> （开发模式）
```

包会出现在 `.yalc/` 目录，已被 `packages` 配置包含。

### 7.3 动态注入依赖

在 `.pnpmfile.cjs` 的 `readPackage` 中新增分支：

```js
if (pkg?.name === 'target-package') {
    pkg.dependencies = {
        ...pkg.dependencies, // 必须保留展开
        'injected-dep': '1.0.0',
    };
}
```

**关键**：必须保留 `...pkg.dependencies`，否则会丢失原依赖声明。

### 7.4 控制构建脚本

在 `pnpm-workspace.yaml` 的 `allowBuilds` 下添加：

```yaml
allowBuilds:
    'some-package': false # 禁止执行 install/build 脚本
```

### 7.5 关键函数参数说明

| 函数                        | 参数      | 说明                                                  |
| --------------------------- | --------- | ----------------------------------------------------- |
| `readPackage(pkg, context)` | `pkg`     | 包的 manifest 对象（含 name/version/dependencies 等） |
|                             | `context` | pnpm 上下文，提供 `context.log()`                     |
| `module.exports.hooks`      | —         | pnpm 钩子注册入口                                     |

---

## 8. 依赖关系

| 依赖     | 说明                                                                                       |
| -------- | ------------------------------------------------------------------------------------------ |
| 包管理器 | pnpm（强制，禁止 npm/yarn）                                                                |
| 本地目录 | `.yalc/`（yalc 链接）、`packages/*`、`packages-next/*`（workspace 子包）                   |
| 路径规则 | `.pnpmfile.cjs` 为 CommonJS；`check-branch.mjs` 为 ESM                                     |
| 双重生效 | `overrides`（pnpm-workspace.yaml）+ `readPackage`（.pnpmfile.cjs）均需 `pnpm install` 生效 |

---

## 9. 安装指令

```bash
# 标准安装
pnpm install

# 限制并发（网络受限时）
pnpm install --network-concurrency=6

# 强制重新解析（修改 .pnpmfile.cjs 后）
pnpm install --force
```
