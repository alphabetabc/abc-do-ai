# branch-develop 配置说明

> 本文档记录 `develop` 分支特定的 pnpm 配置完整内容。SKILL.md 仅作为入口索引，详细配置、字段说明、操作指南、依赖关系、安装指令、版本校验提示等全部在本文件中维护。

## 目标分支

- **默认期望分支**：`develop`
- **适用场景**：日常开发、合并特性分支前的集成测试
- **风险等级**：低（默认分支，所有配置已验证）

## 核心工作流（develop 分支）

每次调用本 skill 时，必须先执行以下步骤：

1. **分支检查**：运行 `node .trae/skills/oss-visual-material-project-pnpm/scripts/check-branch.mjs`，确认当前在 `develop` 分支
2. **读取实际配置**：读取 `pnpm-workspace.yaml` 和 `.pnpmfile.cjs` 的当前内容
3. **快照对比**：与本文「配置快照」章节逐项对比
4. **差异报告**：如果发现不一致，向用户报告差异并询问是否更新快照
5. **修改与同步**：用户确认后再修改实际配置文件 + 本文档

## 文件位置

| 文件                        | 路径                                |
| --------------------------- | ----------------------------------- |
| workspace 配置              | `pnpm-workspace.yaml`（项目根目录） |
| pnpm hooks                  | `.pnpmfile.cjs`（项目根目录）       |
| 本地 tarball 目录（默认）   | `.local-deps/`                      |
| 本地 tarball 目录（自定义） | `deps/`                             |

---

## 配置快照

> 以下为本 skill 记录的最后已知配置。调用时应与实际文件对比，不一致则询问用户是否更新。

### pnpm-workspace.yaml

```yaml
packages:
    - .yalc/
    - .yalc/@*/*
    - dev-packages/* # 这块灵活记录，不用同步
    - material-packages/* # 这块灵活记录，不用同步
allowBuilds:
    '@midwayjs/cli': false
    core-js: false
    core-js-pure: false
    ejs: false
    es5-ext: false
    esbuild: false
    protobufjs: false
    react-intl-universal: false

strictStorePkgContentCheck: false

overrides:
    react-draggable: 4.4.6
    '@types/react': 17.0.30
    oss-toolkits: file:./deps/oss-toolkits-0.1.6.tgz
    tyme4ts: file:./deps/tyme4ts-1.4.2.tgz
```

#### packages

| 条目                  | 说明                    |
| --------------------- | ----------------------- |
| `.yalc/`              | yalc 本地包发布目录     |
| `.yalc/@*/*`          | yalc 下的 scoped 包目录 |
| `dev-packages/*`      | 开发工具包目录          |
| `material-packages/*` | 物料包目录              |

#### allowBuilds

以下包禁止执行 install/postinstall 构建脚本：

| 包名                   | 原因                       |
| ---------------------- | -------------------------- |
| `@midwayjs/cli`        | 避免 midway 构建脚本副作用 |
| `core-js`              | 无需运行构建脚本           |
| `core-js-pure`         | 无需运行构建脚本           |
| `ejs`                  | 无需运行构建脚本           |
| `es5-ext`              | 无需运行构建脚本           |
| `esbuild`              | 避免平台二进制下载问题     |
| `protobufjs`           | 避免运行 postinstall       |
| `react-intl-universal` | 避免运行构建脚本           |

#### overrides

| 包名              | 覆盖值                               | 说明                 |
| ----------------- | ------------------------------------ | -------------------- |
| `react-draggable` | `4.4.6`                              | 固定版本             |
| `@types/react`    | `17.0.30`                            | 固定到 React 17 类型 |
| `oss-toolkits`    | `file:./deps/oss-toolkits-0.1.6.tgz` | 本地 tarball         |
| `tyme4ts`         | `file:./deps/tyme4ts-1.4.2.tgz`      | 本地 tarball         |

---

### .pnpmfile.cjs

```js
const path = require('path');
const fs = require('fs');

function readPackage(pkg, context) {
    // Override the manifest of foo@1.x after downloading it from the registry
    if (pkg?.name === 'oss-visual-material') {
        context.log('依赖注入:oss-visual-material');
        pkg.dependencies = {
            ...pkg.dependencies,
            // lodash: 'latest',
            // '@types/lodash': '4.14.201',
            '@types/styled-components': '5.1.26',
        };
    }

    // if (pkg?.dependencies['ajv-draft-04']) {
    //     context.log(`依赖注入:ajv-draft-04 --- ${pkg.name}`);
    //     pkg.dependencies = {
    //         ...pkg.dependencies,
    //         'ajv-draft-04': 'https://registry.npmmirror.com/ajv-draft-04/-/ajv-draft-04-1.0.0.tgz',
    //     };
    // }

    return pkg;
}

// 自定义获取器：将指定包重定向到 .local-deps 下的本地 tarball
const DEFAULT_LOCAL_DEPS_DIR = '.local-deps';

function createLocalTarballFetcher(pkgId, tarballName, LOCAL_DEPS_DIR = DEFAULT_LOCAL_DEPS_DIR) {
    const tarballPath = path.join(LOCAL_DEPS_DIR, tarballName);
    let resolvedId = pkgId; // 默认回退到配置的 pkgId
    return {
        canFetch: (id, resolution) => {
            if (id.startsWith(pkgId)) {
                resolvedId = id; // 保存真实运行时 id
                return true;
            }
            return false;
        },
        fetch: async (cafs, resolution, opts, fetchers) => {
            const realTarballPath = tarballPath;
            const logContent = `${new Date().toLocaleString()} -- [本地获取${pkgId}](${resolvedId}):${realTarballPath}`;
            fs.writeFileSync(path.join(DEFAULT_LOCAL_DEPS_DIR, 'log.txt'), logContent + '\n', { flag: 'a' });
            return fetchers.localTarball(cafs, { tarball: 'file:' + realTarballPath }, opts);
        },
    };
}

module.exports = {
    hooks: {
        readPackage,
    },
    fetchers: [
        //
        ['@radix-ui/primitive@1.1.6', 'radix-ui-primitive-1.1.6.tgz'],
        ['echarts@5.5.0', 'echarts-5.5.0.tgz'],
        ['react-intl-universal@2.4.8', 'react-intl-universal-2.4.8.tgz'],
        ['electron-to-chromium@1.0.0', 'electron-to-chromium-1.5.349.tgz'],
        ['antd@4.17.4', 'antd-4.17.4.tgz'],
        ['antd@4.16.2', 'antd-4.17.4.tgz'],
        ['@cesium/engine', 'cesium-engine-26.1.0.tgz'],
        ['cesium', 'cesium-1.143.0.tgz'],
        ['monaco-editor', 'monaco-editor-0.33.0.tgz'],
        ['oss-ui', 'oss-ui-0.1.105.tgz'],
        ['tyme4ts', 'tyme4ts-1.4.2.tgz', 'deps'],
        ['oss-toolkits', 'oss-toolkits-0.1.6.tgz', 'deps'],
    ].map((item) => createLocalTarballFetcher(item[0], item[1], item[2])),
};
```

#### readPackage 依赖注入

| 目标包                     | 注入的依赖                 | 版本          | 状态   |
| -------------------------- | -------------------------- | ------------- | ------ |
| `oss-visual-material`      | `@types/styled-components` | `5.1.26`      | 启用   |
| `oss-visual-material`      | `lodash`                   | `latest`      | 已注释 |
| `oss-visual-material`      | `@types/lodash`            | `4.14.201`    | 已注释 |
| (任意含 ajv-draft-04 的包) | `ajv-draft-04`             | npmmirror tgz | 已注释 |

#### fetchers 映射表

| 包 ID                        | tarball 文件名                     | 本地目录      | 完整路径                                       |
| ---------------------------- | ---------------------------------- | ------------- | ---------------------------------------------- |
| `@radix-ui/primitive@1.1.6`  | `radix-ui-primitive-1.1.6.tgz`     | `.local-deps` | `.local-deps/radix-ui-primitive-1.1.6.tgz`     |
| `echarts@5.5.0`              | `echarts-5.5.0.tgz`                | `.local-deps` | `.local-deps/echarts-5.5.0.tgz`                |
| `react-intl-universal@2.4.8` | `react-intl-universal-2.4.8.tgz`   | `.local-deps` | `.local-deps/react-intl-universal-2.4.8.tgz`   |
| `electron-to-chromium@1.0.0` | `electron-to-chromium-1.5.349.tgz` | `.local-deps` | `.local-deps/electron-to-chromium-1.5.349.tgz` |
| `antd@4.17.4`                | `antd-4.17.4.tgz`                  | `.local-deps` | `.local-deps/antd-4.17.4.tgz`                  |
| `antd@4.16.2`                | `antd-4.17.4.tgz`                  | `.local-deps` | `.local-deps/antd-4.17.4.tgz`                  |
| `@cesium/engine`             | `cesium-engine-26.1.0.tgz`         | `.local-deps` | `.local-deps/cesium-engine-26.1.0.tgz`         |
| `cesium`                     | `cesium-1.143.0.tgz`               | `.local-deps` | `.local-deps/cesium-1.143.0.tgz`               |
| `monaco-editor`              | `monaco-editor-0.33.0.tgz`         | `.local-deps` | `.local-deps/monaco-editor-0.33.0.tgz`         |
| `oss-ui`                     | `oss-ui-0.1.105.tgz`               | `.local-deps` | `.local-deps/oss-ui-0.1.105.tgz`               |
| `tyme4ts`                    | `tyme4ts-1.4.2.tgz`                | `deps`        | `deps/tyme4ts-1.4.2.tgz`                       |
| `oss-toolkits`               | `oss-toolkits-0.1.6.tgz`           | `deps`        | `deps/oss-toolkits-0.1.6.tgz`                  |

> 注意：`tyme4ts` 和 `oss-toolkits` 同时出现在 `fetchers` 和 `overrides` 中，两者指向同一本地文件，互为保障。

---

### package.json resolutions 同步

> `package.json` 中也存在 `resolutions` 字段，修改 `overrides` 时需同步检查。

```json
{
    "resolutions": {
        "@types/react": "17.0.30",
        "oss-toolkits": "file:./deps/oss-toolkits-0.1.6.tgz",
        "tyme4ts": "file:./deps/tyme4ts-1.4.2.tgz"
    }
}
```

| 包名              | package.json resolutions             | pnpm-workspace.yaml overrides        | 是否一致        |
| ----------------- | ------------------------------------ | ------------------------------------ | --------------- |
| `@types/react`    | `17.0.30`                            | `17.0.30`                            | 一致            |
| `oss-toolkits`    | `file:./deps/oss-toolkits-0.1.6.tgz` | `file:./deps/oss-toolkits-0.1.6.tgz` | 一致            |
| `tyme4ts`         | `file:./deps/tyme4ts-1.4.2.tgz`      | `file:./deps/tyme4ts-1.4.2.tgz`      | 一致            |
| `react-draggable` | （未声明）                           | `4.4.6`                              | 仅 overrides 有 |

---

## 常见操作指南

### 新增依赖覆盖

编辑 `pnpm-workspace.yaml` 的 `overrides`：

```yaml
overrides:
    some-package: '1.2.3'
    local-package: 'file:./deps/local-package-1.0.0.tgz'
```

### 新增本地 tarball fetcher

在 `.pnpmfile.cjs` 的 `fetchers` 数组中追加条目：

```js
fetchers: [
    // ...
    ['new-package@1.0.0', 'new-package-1.0.0.tgz'],              // 默认 .local-deps
    ['local-pkg', 'local-pkg-0.1.0.tgz', 'deps'],               // 指定 deps 目录
].map((item) => createLocalTarballFetcher(item[0], item[1], item[2])),
```

> 新增后需同步更新上方「fetchers 映射表」。

### 动态注入依赖

在 `readPackage` 函数中按包名注入：

```js
if (pkg?.name === 'target-package') {
    pkg.dependencies = {
        ...pkg.dependencies,
        'injected-dep': '1.0.0',
    };
}
```

### 控制构建脚本

在 `pnpm-workspace.yaml` 的 `allowBuilds` 中：

```yaml
allowBuilds:
    some-package: false # 禁止执行构建脚本
    # 或省略该包以允许构建
```

### createLocalTarballFetcher 参数说明

```js
createLocalTarballFetcher(pkgId, tarballName, (LOCAL_DEPS_DIR = '.local-deps'));
```

| 参数             | 类型     | 说明                                             |
| ---------------- | -------- | ------------------------------------------------ |
| `pkgId`          | `string` | 包标识，用于 `canFetch` 的 `startsWith` 匹配     |
| `tarballName`    | `string` | 本地 tarball 文件名                              |
| `LOCAL_DEPS_DIR` | `string` | 本地依赖目录，默认 `.local-deps`，可传 `deps` 等 |

> 注意：`fetch` 内部写日志固定使用 `DEFAULT_LOCAL_DEPS_DIR`（即 `.local-deps/log.txt`），不受第三个参数影响。

---

## 依赖关系

-   包管理器：pnpm（禁止 npm/yarn）
-   本地依赖目录：`.local-deps`（默认）、`deps`
-   `overrides` 中的 `file:` 协议路径相对于项目根目录
-   `.pnpmfile.cjs` 的 `fetchers` 与 `pnpm-workspace.yaml` 的 `overrides` 可能对同一包双重生效（如 `tyme4ts`、`oss-toolkits`）

## 安装指令

```bash
pnpm i --network-concurrency=6
```

> 限制网络并发数为 6，避免安装时网络请求过多导致超时或失败。

---

## 版本校验提示（基于 yarn.lock 对照）

调用 skill 时应主动向用户汇报：

1. **`oss-ui` 版本依据**：当前 skill 记录的 `oss-ui-0.1.105.tgz` 与 yarn.lock 不一致——注册表从未发布 `0.1.105`，yarn.lock 中最高已解析为 `0.1.104`。**以 yarn.lock 为准**，`oss-ui` 应使用 `0.1.104`。

2. **`antd@4.17.4` 校验提示**：yarn.lock 中 `antd` 仅解析了 `4.16.2` 一个版本，`4.17.4` 在 yarn.lock 中无解析项。如确需 `4.17.4`，应作为新增依赖声明，而非通过 override/fetcher 注入。

3. **`tyme4ts` / `@radix-ui/primitive`**：yarn.lock 中无这两个包的解析记录。保持现状（继续作为本地覆盖），无需改动。

4. **`antd@4.17.4` fetcher 重定向**：保持现状，fetcher 将 `antd@4.17.4` 指向 `antd-4.17.4.tgz` 不动；如未来希望与 yarn.lock 完全一致，可移除该 fetcher，只保留 `antd@4.16.2 → antd-4.16.2.tgz`。

5. 其他依赖项（`react-draggable`、`@types/react`、`echarts`、`react-intl-universal`、`electron-to-chromium`、`monaco-editor`、`@cesium/engine`、`cesium`、`oss-toolkits`、`@types/styled-components` 等）以本 skill 文档为准，无需特别提示。

---

## 分支扩展策略

> 当前 skill 默认仅针对 `develop` 分支。随着使用深入，可按以下步骤扩展：

1. 新建 `references/branch-<name>.md`（如 `branch-feature.md`、`branch-release.md`）
2. 在文件中描述该分支特定的覆盖配置
3. 通过 `--branch <name>` 参数调用检查脚本指向对应分支
4. 如需为不同分支配置不同的 pnpm 配置，扩展本文档的「配置快照」章节为多分支表格
5. 在 SKILL.md 的 References 表格中添加新分支文档链接

> 后续扩展时，记得同步更新本文档的「分支扩展策略」章节。