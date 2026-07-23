# 分支配置参考：develop

> 版本：1.1.0 | 日期：2026-07-23

> develop 分支（当前对应本地 `feature-240504`）的分支专属配置。公共配置见 [`_common.md`](./_common.md)。

---

## 1. 目标分支信息

| 项           | 值                                                                       |
| ------------ | ------------------------------------------------------------------------ |
| 默认期望分支 | `develop`（本地检出名可能为 `feature-240504`，语义等同）                 |
| 适用场景     | 日常开发环境的依赖版本锁定与 workspace 本地包注入                        |
| 风险等级     | 中（涉及 `@fedx-vis/*` workspace 包启用、`oss-web-common` 版本动态判断） |
| 包管理器     | pnpm（强制，禁止 npm/yarn）                                              |

> 本分支在 `.pnpmfile.cjs` 中**启用**了 6 个 `@fedx-vis/*` workspace 依赖注入。详见 §2.3。

---

## 2. 分支专属配置

### 2.1 .pnpmfile.cjs 完整源码快照

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
            '@fedx-vis/designer-types': 'workspace:*',
            '@fedx-vis/request': 'workspace:*',
            '@fedx-vis/share': 'workspace:*',
            '@fedx-vis/ui': 'workspace:*',
            '@fedx-vis/utils': 'workspace:*',
            '@fedx-vis/hooks': 'workspace:*',

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

### 2.2 readPackage 依赖注入说明表

| 目标包 | 注入依赖 | 版本 | 说明 |
| --- | --- | --- | --- |
| oss-visual-designer | @formily/react | 2.2.10 | Formily React 绑定 |
| oss-visual-designer | tslib | \* | TS 运行时辅助 |
| oss-visual-designer | language-tags | 1.0.5 | 语言标签解析 |
| oss-visual-designer | @types/lodash | 4.14.201 | Lodash 类型 |
| oss-visual-designer | @fedx-vis/designer-types | workspace:\* | **本分支启用**：本地 workspace 子包，类型定义 |
| oss-visual-designer | @fedx-vis/request | workspace:\* | **本分支启用**：本地 workspace 子包，请求层 |
| oss-visual-designer | @fedx-vis/share | workspace:\* | **本分支启用**：本地 workspace 子包，共享枚举/工具 |
| oss-visual-designer | @fedx-vis/ui | workspace:\* | **本分支启用**：本地 workspace 子包，UI 组件 |
| oss-visual-designer | @fedx-vis/utils | workspace:\* | **本分支启用**：本地 workspace 子包，工具函数 |
| oss-visual-designer | @fedx-vis/hooks | workspace:\* | **本分支启用**：本地 workspace 子包，hooks 工具包 |
| oss-visual-designer | oss-web-common | 动态 | 原值为 `0.3.1` 则保留，否则降级 `^0.2.36` |
| fedx-report | fedx-report | pkg.version | 自引用（仅当未声明时） |
| fedx-report | @formily/core / grid / json-schema / path / react / reactive / reactive-react / shared | 2.2.10 | 全家桶统一锁定 |
| fedx-report | @monaco-editor/react | 4.4.6 | 代码编辑器 |
| oss-web-toolkits | @types/lodash | 4.14.201 | Lodash 类型 |
| antd-img-crop | antd | 4.16.2 | 强制与 overrides 一致 |

### 2.3 @fedx-vis/\* 注入状态

本分支的 6 个 `@fedx-vis/*` 注入位于 `.pnpmfile.cjs` 第 18-23 行（`// 测试` 注释下方），当前为**启用状态**：

```js
// 启用状态（当前配置）
'@fedx-vis/designer-types': 'workspace:*',
'@fedx-vis/request': 'workspace:*',
'@fedx-vis/share': 'workspace:*',
'@fedx-vis/ui': 'workspace:*',
'@fedx-vis/utils': 'workspace:*',
'@fedx-vis/hooks': 'workspace:*',
```

如需禁用，将上述行注释掉即可。修改后需执行 `pnpm install --force` 重新解析依赖。

> 各 `@fedx-vis/*` 包的 workspace 路径与 yarn.lock 版本见 [`_common.md`](./_common.md) §4。

---

## 3. 版本校验提示

> 以下为与历史 yarn.lock 对照的已知差异点。

| 差异点                                   | 处理建议                                               |
| ---------------------------------------- | ------------------------------------------------------ |
| `package.json` 残留 `resolutions` 字段   | pnpm 不读取，可保留但建议逐步清理                      |
| `oss-web-common` 版本在 overrides 被注释 | 由 `.pnpmfile.cjs` 动态注入，切换分支时需核对注入逻辑  |
| `@formily/*` 在 fedx-report 注入路径锁定 | 若升级 Formily，需同时改 `.pnpmfile.cjs` 中 9 个包版本 |
| `@fedx-vis/*` workspace 注入             | 当前为启用状态，如需禁用见 §2.3                        |

---

## 4. 公共内容索引

以下内容各分支相同，见 [`_common.md`](./_common.md)：

| 内容                                                                | 公共文档章节    |
| ------------------------------------------------------------------- | --------------- |
| 核心工作流                                                          | `_common.md` §1 |
| 文件位置表                                                          | `_common.md` §2 |
| pnpm-workspace.yaml 配置（快照 + 字段说明 + overrides 版本表）      | `_common.md` §3 |
| @fedx-vis/\* workspace 包说明                                       | `_common.md` §4 |
| fetchers 映射表                                                     | `_common.md` §5 |
| package.json resolutions 同步                                       | `_common.md` §6 |
| 常见操作指南（新增覆盖 / yalc / 动态注入 / allowBuilds / 函数参数） | `_common.md` §7 |
| 依赖关系                                                            | `_common.md` §8 |
| 安装指令                                                            | `_common.md` §9 |
