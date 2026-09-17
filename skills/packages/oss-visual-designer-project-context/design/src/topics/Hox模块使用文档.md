# Hox 模块使用文档

## 目录位置

`e:\oss-fe-git\frame\oss-visual-designer\src\hox`

## 模块列表

| 文件 | 说明 |
|------|------|
| useLoginInfo.ts | 登录信息 |
| useEnvironment.ts | 环境配置 |
| useAppInfo.ts | 应用信息 |
| useComponentsInfo.ts | 组件信息 |
| useDevelopment.ts | 开发环境 |

## 导入方式

### 方式一：从 `@Src/hox` 导入（推荐）

```typescript
import { useEnvironmentModel, useLoginInfoModel, useAppInfoModel, useComponentsInfo, useDevelopment } from '@Src/hox';
```

### 方式二：直接从具体文件导入

```typescript
import useEnvironmentModel from '@Src/hox/useEnvironment';
import useAppInfoModel from '@Src/hox/useAppInfo';
```

## 使用文件清单

### 从 `@Src/hox` 导入的文件（共 39 个）

| 文件路径 | 使用的 Hooks |
|----------|-------------|
| src/formily/FedxReportContext.tsx | useEnvironmentModel, useComponentsInfo, useDevelopment |
| src/common/api/index.js | useEnvironmentModel |
| src/app/container/index.tsx | useEnvironmentModel, useAppInfoModel, useLoginInfoModel |
| src/routes/share.ts | useEnvironmentModel |
| src/plugins/data-fetcher/utils/factory.ts | useEnvironmentModel |
| src/pages/preview/large-screen/Viewer.jsx | useEnvironmentModel, useAppInfoModel |
| src/pages/hooks/useSdk.ts | useAppInfoModel, useEnvironmentModel |
| src/designer/toolbar/comp/share.ts | useLoginInfoModel, useEnvironmentModel |
| src/designer/toolbar/comp/params/index.tsx | useEnvironmentModel |
| src/designer/common/field/atom/useAtomShare.tsx | useEnvironmentModel, useLoginInfoModel, useAppInfoModel |
| src/designer/common/field/atom/FieldApi.ts | useEnvironmentModel |
| src/designer/common/context/context-meta-human/core.tsx | useLoginInfoModel, useEnvironmentModel |
| src/designer/DesignerContent.tsx | useEnvironmentModel |
| src/designer/DataProvider.tsx | useEnvironmentModel |
| src/common/services/visualManage-api.js | useEnvironmentModel, useLoginInfoModel |
| src/common/services/material-api.js | useEnvironmentModel |
| src/common/services/compManage-api.js | useEnvironmentModel, useLoginInfoModel |
| src/common/services/dpu-api.js | useLoginInfoModel |
| src/pages/dev-page/ui/material-selector/index.tsx | useEnvironmentModel |
| src/hooks/use-auth-btn.tsx | useLoginInfoModel, useEnvironmentModel |
| src/hooks/use-operation-permission.tsx | useLoginInfoModel |
| src/designer/materials/index.js | useComponentsInfo, useEnvironmentModel |
| src/designer/common/env/index.tsx | useEnvironmentModel |
| src/designer/renderer/generator.tsx | useAppInfoModel |
| src/designer/renderer/GeneratorWidget.js | useAppInfoModel |
| src/designer/toolbar/index.js | useLoginInfoModel, useComponentsInfo |
| src/designer/toolbar/comp/snapshot-drawer/editable-table/index.jsx | useLoginInfoModel |
| src/designer/toolbar/comp/snapshot-drawer/edit-release-status/index.tsx | useLoginInfoModel |
| src/designer/toolbar/comp/publish-modal/index.jsx | useLoginInfoModel |
| src/designer/toolbar/comp/dataset/index.tsx | useLoginInfoModel |
| src/designer/toolbar/comp/dataset/DataSetList.tsx | useLoginInfoModel |
| src/designer/toolbar/comp/dataset/DataSetGroupTree.tsx | useLoginInfoModel |
| src/designer/toolbar/comp/saveAsTemp-modal/index.tsx | useLoginInfoModel |
| src/designer/toolbar/comp/modal-comp-publish/index.tsx | useLoginInfoModel, useComponentsInfo |
| src/designer/renderer/components/group-field/index.jsx | useLoginInfoModel |
| src/plugins/data-fetcher/utils/params.ts | useLoginInfoModel |
| src/designer/data-query/InitDataQuery/index.tsx | useComponentsInfo, useLoginInfoModel |
| src/designer/context-menu/modal/ModalCompAdd.tsx | useLoginInfoModel |
| src/components/sketch-ruler/index.js | useAppInfoModel |
| src/components/monaco-editor/index.jsx | useAppInfoModel |
| src/components/scrollbar/index.jsx | useAppInfoModel |

### 直接从具体文件导入的文件（共 5 个）

| 文件路径 | 导入内容 |
|----------|---------|
| src/designer/renderer/designer-parser/index.jsx | `import useEnvironmentModel from '@Src/hox/useEnvironment'` |
| src/hooks/use-remote.ts | `import useEnvironment from '@Src/hox/useEnvironment'` |
| src/designer/canvas-graph/index.js | `import useEnvironmentModel from '@Src/hox/useEnvironment'` |
| src/designer/aside-panel/materials/field-enum.tsx | `import useEnvironmentModel from '@Src/hox/useEnvironment'` |
| src/app/initializer/index.ts | `import useAppInfoModel from '@Src/hox/useAppInfo'` |

## 统计信息

- **总使用文件数**：44 个
- **从 `@Src/hox` 导入**：39 个文件
- **直接从文件导入**：5 个文件

### Hook 使用频率

| Hook | 使用文件数 |
|------|-----------|
| useLoginInfoModel | 27 |
| useEnvironmentModel | 28 |
| useAppInfoModel | 9 |
| useComponentsInfo | 5 |
| useDevelopment | 1 |
