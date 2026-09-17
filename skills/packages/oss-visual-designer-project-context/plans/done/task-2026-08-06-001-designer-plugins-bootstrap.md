# task-2026-08-06-001：designer-plugins 包骨架 + 业务类型预设

> 创建日期：2026-08-06
> 状态：`done`（2026-08-06 完成）
> 类型：`feature`
> 前置文档：
> - [research/designer-plugins-研究报告.md](../research/designer-plugins-研究报告.md)
> - [research/tango-cross-review报告.md](../research/tango-cross-review报告.md)
> - [design/designer-core/00-overview.md](../design/designer-core/00-overview.md)

---

## 1. 背景与目标

### 1.1 背景

designer-core 框架内核已完成（197 tests passed），task-002/003/004/005 修复了框架层的问题。现在需要启动 designer-plugins 业务插件包，作为 designer-core 和应用层之间的中间层。

### 1.2 分层决策（review 中确定）

```
designer-core（框架内核，纯机制，TData 泛型，不感知业务字段）
    ↑
designer-plugins（业务插件包，定义 WidgetData + 预设 deepMergeKeys + 业务插件）
    ↑
designer-app（应用层，只管组装 UI + 选插件）
```

关键决策：
- designer-plugins 层预设 `deepMergeKeys: ['config']`，应用层不用传
- designer-plugins 层定义 `WidgetData` / `WidgetConfig` 等业务类型
- designer-plugins 导出封装好的 `createDesigner`，应用层直接用

### 1.3 目标

1. 创建 `packages-next/designer-plugins/` 包骨架（package.json / tsconfig / vite.config）
2. 定义业务类型（`WidgetData` / `WidgetConfig` / `DesignerExtra` 等）
3. 导出预设好的 `createDesigner`（内置 `deepMergeKeys: ['config']`）

### 1.4 不做什么

- 不实现 createViewPlugin（task-007）
- 不实现 P1-P4 插件（layer-ops / group-management / data-fetcher / interaction）
- 不改 src/ 代码（应用层迁移是后续任务）

---

## 2. 详细步骤

### 2.1 包骨架

**目录结构**：

```
packages-next/designer-plugins/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── index.ts                  # barrel 导出
    └── shared/
        ├── types.ts              # 业务类型定义
        └── create-designer.ts    # 预设 createDesigner
```

### 2.2 package.json

```json
{
    "name": "@fedx-vis/designer-plugins",
    "version": "0.1.0",
    "description": "设计器业务插件包（view/layer-ops/group-management/data-fetcher/interaction）",
    "type": "module",
    "main": "./dist/index.cjs",
    "module": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "exports": {
        ".": {
            "types": "./dist/index.d.ts",
            "import": "./dist/index.js",
            "require": "./dist/index.cjs"
        }
    },
    "files": ["dist", "src"],
    "scripts": {
        "build": "vite build",
        "test": "vitest run",
        "test:watch": "vitest",
        "typecheck": "tsc --noEmit"
    },
    "peerDependencies": {
        "react": ">=17.0.0",
        "zustand": ">=4.0.0"
    },
    "dependencies": {
        "@fedx-vis/designer-core": "workspace:*"
    },
    "devDependencies": {
        "@types/react": "17.0.30",
        "react": "17.0.2",
        "typescript": "4.9.5",
        "vite": "^8.2.0",
        "vitest": "^4.1.10",
        "zustand": "^5.0.14"
    },
    "license": "ISC"
}
```

### 2.3 tsconfig.json

```json
{
    "compilerOptions": {
        "outDir": "dist",
        "module": "esnext",
        "target": "esnext",
        "lib": ["esnext", "dom"],
        "sourceMap": true,
        "declaration": true,
        "declarationDir": "dist",
        "baseUrl": ".",
        "jsx": "react-jsx",
        "allowSyntheticDefaultImports": true,
        "moduleResolution": "node",
        "resolveJsonModule": true,
        "forceConsistentCasingInFileNames": true,
        "noImplicitReturns": true,
        "suppressImplicitAnyIndexErrors": true,
        "noUnusedLocals": true,
        "allowJs": false,
        "skipLibCheck": true,
        "strict": true,
        "noImplicitAny": false,
        "esModuleInterop": true,
        "paths": {
            "@fedx-vis/designer-core": ["../designer-core/src/index.ts"],
            "@fedx-vis/designer-core/*": ["../designer-core/src/*"]
        }
    },
    "include": ["src"],
    "exclude": ["node_modules", "dist"]
}
```

### 2.4 vite.config.ts

```ts
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        lib: {
            entry: resolve(import.meta.dirname, 'src/index.ts'),
            name: 'DesignerPlugins',
            fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
            formats: ['es', 'cjs'],
        },
        rollupOptions: {
            external: ['react', 'zustand', 'react/jsx-runtime', '@fedx-vis/designer-core'],
        },
        sourcemap: true,
    },
    test: {
        globals: true,
        environment: 'jsdom',
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
    },
});
```

### 2.5 业务类型定义：`shared/types.ts`

从 src/ 现有类型提取，不引入新设计：

```ts
/**
 * designer-plugins 业务类型定义
 *
 * 这是"业务字段接入层"——所有业务字段在此定义，
 * 应用层只需 import 使用，不需要重复定义。
 */

// === 节点数据类型 ===

/** 物料配置（对应 src/store/modules/designer-canvas.ts WidgetConfig） */
export interface WidgetConfig {
    [key: string]: any;
}

/** 节点数据（对应 src/store/modules/designer-canvas.ts WidgetData） */
export interface WidgetData {
    /** 物料配置（框架层通过 deepMergeKeys: ['config'] 做二次浅合并） */
    config: WidgetConfig;
    [key: string]: any;
}

// === View 状态类型（从 src/store/modules/view-canvas.ts + view-ui.ts 提取）===

/** 画布高频状态（拖拽/缩放/对齐线/标尺/画布尺寸） */
export interface ViewCanvasState {
    scale: number;
    lines: { h: number[]; v: number[] };
    startX: number;
    startY: number;
    rulerWidth: number;
    rulerHeight: number;
    width: number;
    height: number;
}

/** UI 低频状态（tab/面板折叠/模态框/参考线） */
export interface ViewUIState {
    tabsKey: string;
    layerCollapsed: boolean;
    layersTreeCollapsed: boolean;
    materialsListCollapsed: boolean;
    settingCollapsed: boolean;
    canvasToolbarCollapsed: boolean;
    visible: boolean;
    isShowReferLine: boolean;
}

// === Designer Extra 类型 ===

/**
 * designer-core store 的 extra 字段类型
 *
 * viewCanvas + viewUI 由 createViewPlugin 管理（task-007）
 * 后续插件会扩展更多 extra 字段（page / realtimeDataFlow / customFieldsListMapping / meta）
 */
export interface DesignerExtra {
    viewCanvas: ViewCanvasState;
    viewUI: ViewUIState;
    // 后续扩展：
    // page?: PageConfig;
    // realtimeDataFlowData?: Record<string, any>;
    // realtimeDataFlow?: RealtimeDataFlowItem[];
    // customFieldsListMapping?: Record<string, string>;
    // meta?: SchemaMeta;
}

// === 默认初始值 ===

export const defaultViewCanvasState: ViewCanvasState = {
    scale: 1,
    lines: { h: [], v: [] },
    startX: 0,
    startY: 0,
    rulerWidth: 0,
    rulerHeight: 0,
    width: 1920,
    height: 1080,
};

export const defaultViewUIState: ViewUIState = {
    tabsKey: 'config',
    layerCollapsed: false,
    layersTreeCollapsed: false,
    materialsListCollapsed: false,
    settingCollapsed: false,
    canvasToolbarCollapsed: false,
    visible: false,
    isShowReferLine: true,
};
```

### 2.6 预设 createDesigner：`shared/create-designer.ts`

```ts
/**
 * 预设好的 createDesigner
 *
 * 内置：
 * - deepMergeKeys: ['config']（业务字段预设）
 * - 泛型实例化为 WidgetData / DesignerExtra
 *
 * 应用层直接用这个，不用自己传 deepMergeKeys
 */

import { createDesigner as createDesignerCore, type Designer } from '@fedx-vis/designer-core';
import type { TreeNode, FlatNode } from '@fedx-vis/designer-core';
import type { WidgetData, DesignerExtra } from './types';
import { defaultViewCanvasState, defaultViewUIState } from './types';

export type DesignerInstance = Designer<
    WidgetData,
    TreeNode<WidgetData>,
    FlatNode<WidgetData>,
    DesignerExtra
>;

export function createDesigner(options: {
    initialComponents?: TreeNode<WidgetData>[];
    initialExtra?: Partial<DesignerExtra>;
    plugins?: Parameters<typeof createDesignerCore>[0]['plugins'];
}): DesignerInstance {
    const { initialComponents = [], initialExtra, plugins = [] } = options;

    return createDesignerCore<WidgetData, TreeNode<WidgetData>, FlatNode<WidgetData>, DesignerExtra>({
        initialComponents,
        initialExtra: {
            viewCanvas: { ...defaultViewCanvasState, ...initialExtra?.viewCanvas },
            viewUI: { ...defaultViewUIState, ...initialExtra?.viewUI },
        },
        deepMergeKeys: ['config'],
        plugins,
    });
}
```

### 2.7 index.ts 导出

```ts
// === 预设 createDesigner ===
export { createDesigner, type DesignerInstance } from './shared/create-designer';

// === 业务类型 ===
export type {
    WidgetData,
    WidgetConfig,
    ViewCanvasState,
    ViewUIState,
    DesignerExtra,
} from './shared/types';
export { defaultViewCanvasState, defaultViewUIState } from './shared/types';
```

---

## 3. 测试

### 3.1 测试文件

```
packages-next/designer-plugins/src/
└── __tests__/
    └── bootstrap.test.ts
```

### 3.2 测试用例

1. **createDesigner 返回 DesignerInstance**：store / useDesigner / DesignerProvider 都存在
2. **createDesigner 预设 deepMergeKeys**：updateNode 更新 config 字段时二次浅合并生效
3. **createDesigner 预设初始 extra**：store 创建后 `extra.viewCanvas` / `extra.viewUI` 有默认值
4. **createDesigner 支持自定义初始 extra**：传 `initialExtra.viewCanvas.scale = 2` → store 中 scale = 2

---

## 4. 验证

| 验证项 | 方法 |
|---|---|
| 包可构建 | `pnpm --filter @fedx-vis/designer-plugins build` |
| 测试通过 | `pnpm --filter @fedx-vis/designer-plugins test` |
| 类型安全 | `pnpm --filter @fedx-vis/designer-plugins typecheck` |
| workspace 可解析 | 根目录 `pnpm install` 无报错 |

---

## 5. 风险与回退

### 5.1 风险

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|
| designer-core 类型导出不足 | 低 | 低 | 需要时补 designer-core 的导出 |
| tsconfig paths 映射不生效 | 中 | 低 | 改用 workspace 包名解析 |

### 5.2 回退

整个包是新增，删除 `packages-next/designer-plugins/` 目录即回退。

---

## 6. 实施记录

> 2026-08-06 完成。

### 6.1 创建的文件

```
packages-next/designer-plugins/
├── .gitignore                 # 排除 node_modules / dist
├── package.json               # @fedx-vis/designer-plugins 0.1.0
├── tsconfig.json              # 基础配置（含 paths 指向 designer-core src）
├── tsconfig.build.json        # 构建专用（rootDir: src，无 paths，emitDeclarationOnly）
├── vite.config.ts             # 库模式构建（ESM + CJS，emptyOutDir: false）
└── src/
    ├── index.ts               # barrel 导出
    ├── shared/
    │   ├── types.ts           # 业务类型 + 默认值
    │   └── create-designer.ts # 预设 createDesigner
    └── __tests__/
        └── bootstrap.test.ts  # 8 个测试用例
```

### 6.2 关键决策与调整

#### 调整 1：默认值与 src/ 当前值对齐（plan §2.5 偏差修正）

按 AGENTS.md §9.5（代码优先），plan 中默认值与 `src/store/modules/view-canvas.ts` 的 `viewCanvasInitialState` 不一致，**以代码为准**：

| 字段 | plan 写的值 | 实际代码值（src/store/modules/view-canvas.ts） | 实施采用 |
| --- | --- | --- | --- |
| `startX` | `0` | `-50` | `-50` |
| `startY` | `0` | `-50` | `-50` |
| `width` | `1920` | `1366` | `1366` |
| `height` | `1080` | `768` | `768` |

`defaultViewUIState` 与 `src/store/modules/view-ui.ts` 的 `viewUIInitialState` 完全一致，无偏差。

#### 调整 2：DesignerExtra 加索引签名

designer-core 泛型约束 `TExtra extends Record<string, unknown>` 要求带索引签名。给 `DesignerExtra` 加 `[key: string]: unknown` 满足约束，不影响字段语义。

#### 调整 3：CreateDesignerOptions.initialExtra 改用 Partial<ViewCanvasState> / Partial<ViewUIState>

plan 写的 `initialExtra?: Partial<DesignerExtra>` 会强制调用方传完整的 `ViewCanvasState`，违背"部分覆盖"语义。改成内层也 Partial：

```ts
initialExtra?: {
    viewCanvas?: Partial<ViewCanvasState>;
    viewUI?: Partial<ViewUIState>;
};
```

#### 调整 4：tsconfig.build.json 隔离声明输出

`tsconfig.json` 的 `paths` 把 `@fedx-vis/designer-core` 指向 `../designer-core/src/index.ts`，导致 `tsc --emitDeclarationOnly` 把 designer-core 的声明也输出到 designer-plugins 的 dist。新建 `tsconfig.build.json`：
- 覆盖 `paths: {}`
- 设置 `rootDir: "src"`
- 设置 `emitDeclarationOnly: true`
- 排除 `__tests__`

build 脚本：`"build": "tsc -p tsconfig.build.json && vite build"`，vite 设 `emptyOutDir: false` 避免清空 tsc 的输出。

最终 dist 结构干净：
```
dist/
├── index.d.ts
├── index.js / index.js.map
├── index.cjs / index.cjs.map
└── shared/
    ├── create-designer.d.ts
    └── types.d.ts
```

#### 调整 5：测试 Provider+useDesigner 用例归属 designer-core

plan §3.2 测试用例 1 "createDesigner 返回 DesignerInstance：store / useDesigner / DesignerProvider 都存在" 实际只验证函数引用存在即可（不需要真的渲染 React）。Provider 集成测试已在 designer-core 的 `src/__tests__/designer.test.tsx` 覆盖，designer-plugins 不重复。

### 6.3 验证结果

| 项 | 命令 | 结果 |
| --- | --- | --- |
| 安装依赖 | `pnpm install`（根目录） | 成功（workspace 识别 designer-plugins） |
| 类型检查 | `pnpm --filter @fedx-vis/designer-plugins typecheck` | 0 error |
| 单元测试 | `pnpm --filter @fedx-vis/designer-plugins test` | 8 passed |
| 构建 | `pnpm --filter @fedx-vis/designer-plugins build` | 成功，dist 含 .d.ts / .js / .cjs |

测试覆盖（`bootstrap.test.ts`，共 8 个用例）：
1. 返回 DesignerInstance 含 store + hooks + 命令式 API
2. updateNode 传入 config 子集 → 二次浅合并生效
3. updateNode 传入非 deepMergeKeys 字段 → 顶层浅合并（覆盖）
4. 默认 viewCanvas / viewUI 有初始值
5. 自定义 initialExtra.viewCanvas 覆盖（部分字段生效，其余保留默认）
6. 自定义 initialExtra.viewUI 覆盖
7. 接受 TreeNode<WidgetData>[] 作为初始树（嵌套 group + node）
8. 空树初始化

### 6.4 前置依赖

designer-plugins build 之前需要 designer-core 已 build（dist/index.d.ts 存在）。根目录构建顺序约定：

```bash
pnpm --filter @fedx-vis/designer-core build
pnpm --filter @fedx-vis/designer-plugins build
```

建议在根 package.json 加 script：`"build:packages-next": "pnpm --filter @fedx-vis/designer-core build && pnpm --filter @fedx-vis/designer-plugins build"`（后续 task 处理）。

### 6.5 后续 task 衔接

- `task-2026-08-06-002-designer-plugins-create-view-plugin` 即将创建 `createViewPlugin`，会用到本任务定义的 `DesignerExtra.viewCanvas` / `viewUI` + `defaultViewCanvasState` / `defaultViewUIState`。
