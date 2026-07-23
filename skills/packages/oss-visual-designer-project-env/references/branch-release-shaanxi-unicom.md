# 分支配置参考：release-shaanxi-unicom

> 陕西联通交付分支的环境配置完整快照与操作指南。本文件为 skill `oss-visual-designer-project-env` 的 references 文档，记录该分支下两个配置文件的完整内容与约束。

---

## 1. 目标分支信息

| 项           | 值                                                                |
| ------------ | ----------------------------------------------------------------- |
| 默认期望分支 | `release-shaanxi-unicom`                                          |
| 适用场景     | 陕西联通交付环境的依赖版本锁定与注入                              |
| 风险等级     | 中（涉及 `oss-web-common` 版本动态判断、`@formily/*` 全家桶锁定） |
| 包管理器     | pnpm（强制，禁止 npm/yarn）                                       |

---

## 2. 核心工作流（针对该分支）

1. **执行分支检查**：`node scripts/check-branch.mjs --branch release-shaanxi-unicom`
2. **读取实际配置**：读取项目根目录的 `pnpm-workspace.yaml` 与 `.pnpmfile.cjs`
3. **参考 `yarn.lock`**：修改依赖版本前，查阅 `yarn.lock` 中该包的实际锁定版本
4. **与本文档对比**：核对 `overrides` / `readPackage` 注入项是否与下文快照一致
5. **用户确认**：不一致时向用户报告差异，询问是否更新
6. **修改 + 同步**：用户确认后修改实际配置文件，并同步更新本文档快照

---

## 3. 文件位置表

| 文件           | 路径（相对项目根目录）                        | 用途                                  |
| -------------- | --------------------------------------------- | ------------------------------------- |
| workspace 配置 | `pnpm-workspace.yaml`                         | 工作区/overrides/allowBuilds/settings |
| pnpm hooks     | `.pnpmfile.cjs`                               | readPackage 依赖注入                  |
| 依赖锁定快照   | `yarn.lock`                                   | 历史依赖树真实快照，版本参考基准      |
| package.json   | `package.json`                                | resolutions 字段（与 overrides 对比） |
| 本地依赖目录   | `.yalc/`、`.yalc/@*/*`                        | yalc 本地包链接                       |
| 分支检查脚本   | `scripts/check-branch.mjs`                    | 获取并校验当前分支                    |
| 分支配置文档   | `references/branch-release-shaanxi-unicom.md` | 本文件                                |

---

## 4. 配置快照

### 4.1 pnpm-workspace.yaml 完整快照

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
    react-router-dom: 5.2.0
    #oss-web-common: 0.3.1

settings:
    autoInstallPeers: true
    excludeLinksFromLockfile: false
```

### 4.2 pnpm-workspace.yaml 字段说明

| 字段                                | 说明                                                                                               |
| ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| `packages`                          | 工作区子包目录：`.yalc/`（本地链接）、`.yalc/@*/*`（scoped yalc）、`packages/*`、`packages-next/*` |
| `allowBuilds`                       | 禁止以下包执行 install/build 脚本：core-js、core-js-pure、ejs、es5-ext、esbuild（避免副作用）      |
| `overrides`                         | 全局版本锁定（见下表）                                                                             |
| `settings.autoInstallPeers`         | 自动安装 peer 依赖                                                                                 |
| `settings.excludeLinksFromLockfile` | false（链接包仍写入 lockfile）                                                                     |

#### overrides 关键版本表

| 依赖                            | 版本              | 说明                                              |
| ------------------------------- | ----------------- | ------------------------------------------------- |
| react / react-dom               | 17.0.2            | React 17，禁止升级到 18                           |
| @types/react / @types/react-dom | 17.0.30 / 17.0.11 | 与 React 17 对齐                                  |
| antd                            | 4.16.2            | 锁定 4.16，不升级 5.x                             |
| oss-ui                          | 0.1.94            | 内部 UI 库                                        |
| typescript                      | 4.9.5             | TS 4.9，不升级 5.x                                |
| react-router-dom                | 5.2.0             | RR5，不升级 6.x                                   |
| react-intl-universal            | 2.4.2             | 国际化                                            |
| antd-img-crop                   | 3.16.0            | 图片裁剪                                          |
| react-error-overlay             | 6.0.9             | CRA 错误覆盖层                                    |
| oss-web-common                  | （注释）          | overrides 中被注释，实际由 .pnpmfile.cjs 动态注入 |

### 4.3 .pnpmfile.cjs 完整源码快照

```js
function readPackage(pkg, context) {
    // Override the manifest of foo@1.x after downloading it from the registry
    if (pkg?.name === 'oss-visual-designer') {
        context.log('依赖注入:oss-visual-designer');
        pkg.dependencies = {
            ...pkg.dependencies,
            // '@types/react-router-dom': '5',
            '@formily/react': '2.2.10',
            tslib: '*',
            'language-tags': '1.0.5',
            '@types/lodash': '4.14.201',
            // 'react-error-overlay': '6.0.9',
            // 'react-router-dom': '5.3.4',
            // 'react-router': '5.3.4',
            // antd: '*',

            // 测试
            // '@fedx-vis/designer-types': 'workspace:*',
            // '@fedx-vis/request': 'workspace:*',
            // '@fedx-vis/share': 'workspace:*',
            // '@fedx-vis/ui': 'workspace:*',
            // '@fedx-vis/utils': 'workspace:*',
            // '@fedx-vis/hooks': 'workspace:*',

            // "oss-web-common": "^0.2.36",
            'oss-web-common': pkg.dependencies['oss-web-common'] !== '0.3.1' ? '^0.2.36' : '0.3.1',
        };

        pkg.devDependencies = {
            ...pkg.devDependencies,
            // '@fedx-vis/tools': 'workspace:*',
        };
    }

    if (pkg?.name === 'fedx-report') {
        context.log('依赖注入: fedx-report');
        if (!pkg.dependencies['fedx-report']) {
            pkg.dependencies = {
                ...pkg.dependencies,
                'fedx-report': pkg.version,

                // 固定依赖
                '@formily/core': '2.2.10',
                '@formily/grid': '2.2.10',
                '@formily/json-schema': '2.2.10',
                '@formily/path': '2.2.10',
                '@formily/react': '2.2.10',
                '@formily/reactive': '2.2.10',
                '@formily/reactive-react': '2.2.10',
                '@formily/shared': '2.2.10',
            };
        }
        pkg.dependencies = {
            ...pkg.dependencies,
            '@monaco-editor/react': '4.4.6',
        };
    }

    if (pkg?.name === 'oss-web-toolkits') {
        pkg.dependencies = {
            ...pkg.dependencies,
            '@types/lodash': '4.14.201',
        };
    }

    if (pkg.name === 'antd-img-crop') {
        pkg.dependencies = {
            ...pkg.dependencies,
            antd: '4.16.2',
        };
    }

    return pkg;
}

module.exports = {
    hooks: {
        readPackage,
    },
};
```

### 4.4 readPackage 依赖注入说明表

| 目标包 | 注入依赖 | 版本 | 说明 |
| --- | --- | --- | --- |
| oss-visual-designer | @formily/react | 2.2.10 | Formily React 绑定 |
| oss-visual-designer | tslib | \* | TS 运行时辅助 |
| oss-visual-designer | language-tags | 1.0.5 | 语言标签解析 |
| oss-visual-designer | @types/lodash | 4.14.201 | Lodash 类型 |
| oss-visual-designer | oss-web-common | 动态 | 原值为 `0.3.1` 则保留，否则降级 `^0.2.36` |
| fedx-report | fedx-report | pkg.version | 自引用（仅当未声明时） |
| fedx-report | @formily/core / grid / json-schema / path / react / reactive / reactive-react / shared | 2.2.10 | 全家桶统一锁定 |
| fedx-report | @monaco-editor/react | 4.4.6 | 代码编辑器 |
| oss-web-toolkits | @types/lodash | 4.14.201 | Lodash 类型 |
| antd-img-crop | antd | 4.16.2 | 强制与 overrides 一致 |

### 4.5 fetchers 映射表

> 本项目未使用本地 tarball fetcher 机制，依赖通过 npm registry + yalc 本地链接获取。

| 包 ID  | tarball 文件名 | 本地目录 | 完整路径 |
| ------ | -------------- | -------- | -------- |
| （无） | —              | —        | —        |

> 本地依赖目录 `.yalc/` 用于 yalc 链接的本地开发包，非 tarball fetcher。

---

## 5. package.json resolutions 同步

### 5.1 当前 resolutions 内容

```json
{
    "resolutions": {
        "@types/react": "17.0.30"
    }
}
```

### 5.2 与 overrides 对比

| 依赖         | resolutions (package.json) | overrides (pnpm-workspace.yaml) | 是否一致 |
| ------------ | -------------------------- | ------------------------------- | -------- |
| @types/react | 17.0.30                    | 17.0.30                         | ✅ 一致  |

> `resolutions` 是 yarn 遗留字段，pnpm 读取 `overrides`。当前 `resolutions` 仅保留 `@types/react` 一项，与 `overrides` 对齐。新增覆盖时只需改 `overrides`，`resolutions` 可逐步清理（非阻塞）。

---

## 6. 常见操作指南

### 6.1 新增依赖覆盖

在 `pnpm-workspace.yaml` 的 `overrides` 下添加：

```yaml
overrides:
    'new-package': '1.2.3'
```

执行 `pnpm install` 生效。

### 6.2 新增本地 tarball fetcher

本项目不使用 tarball fetcher。如需引入本地包，使用 yalc：

```bash
yalc add <package>
# 或 yalc link <package> （开发模式）
```

包会出现在 `.yalc/` 目录，已被 `packages` 配置包含。

### 6.3 动态注入依赖

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

### 6.4 控制构建脚本

在 `pnpm-workspace.yaml` 的 `allowBuilds` 下添加：

```yaml
allowBuilds:
    'some-package': false # 禁止执行 install/build 脚本
```

### 6.5 关键函数参数说明

| 函数                        | 参数      | 说明                                                  |
| --------------------------- | --------- | ----------------------------------------------------- |
| `readPackage(pkg, context)` | `pkg`     | 包的 manifest 对象（含 name/version/dependencies 等） |
|                             | `context` | pnpm 上下文，提供 `context.log()`                     |
| `module.exports.hooks`      | —         | pnpm 钩子注册入口                                     |

---

## 7. 依赖关系

| 依赖     | 说明                                                                                       |
| -------- | ------------------------------------------------------------------------------------------ |
| 包管理器 | pnpm（强制，禁止 npm/yarn）                                                                |
| 本地目录 | `.yalc/`（yalc 链接）、`packages/*`、`packages-next/*`（workspace 子包）                   |
| 路径规则 | `.pnpmfile.cjs` 为 CommonJS；`check-branch.mjs` 为 ESM                                     |
| 双重生效 | `overrides`（pnpm-workspace.yaml）+ `readPackage`（.pnpmfile.cjs）均需 `pnpm install` 生效 |

---

## 8. 安装指令

```bash
# 标准安装
pnpm install

# 限制并发（网络受限时）
pnpm install --network-concurrency=6

# 强制重新解析（修改 .pnpmfile.cjs 后）
pnpm install --force
```

---

## 9. 版本校验提示

> 本项目使用 `pnpm-lock.yaml`，不使用 `yarn.lock`。以下为与历史 yarn.lock 对照的已知差异点。

| 差异点                                   | 处理建议                                               |
| ---------------------------------------- | ------------------------------------------------------ |
| `package.json` 残留 `resolutions` 字段   | pnpm 不读取，可保留但建议逐步清理                      |
| `oss-web-common` 版本在 overrides 被注释 | 由 `.pnpmfile.cjs` 动态注入，切换分支时需核对注入逻辑  |
| `@formily/*` 在 fedx-report 注入路径锁定 | 若升级 Formily，需同时改 `.pnpmfile.cjs` 中 9 个包版本 |

---

## 10. 分支扩展策略

当需要支持新分支（feature/release/main 等）：

1. 切换到目标分支
2. 复制本文件为 `references/branch-<新分支名>.md`
3. 更新目标分支信息、配置快照、差异点
4. 在 SKILL.md 的 References 索引表追加一行
5. 使用 `check-branch.mjs --branch <新分支名>` 校验

> 复用 SKILL.md 中的扩展说明，保持各分支文档结构一致。
