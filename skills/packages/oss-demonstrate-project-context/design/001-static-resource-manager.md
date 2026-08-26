# 静态资源管理模块（static-resource-manager）

> 范围：在 `web/pages/` 下新增一个「静态资源管理」页面，统一浏览 / 预览 / 编辑 / 上传覆盖 `public/static/{mock,map,images}` 下的资源。
>
> 注意：本文档暂存在 `oss-demonstrate-project-context/design/`，仅作为方案占位；该 skill 定位是仓库根上下文文件管理，待方案落地前决定是否迁出为独立 skill。

## 1. 背景与定位

`public/static/` 下三类资源在演示项目中长期无 GUI 管理工具，开发者只能：

-   用 VS Code / 文件浏览器翻目录；
-   用 `grep` / IDE 搜索引用；
-   改完图片要重启或刷新静态资源（`koa-static-cache` 通常无需重启，但浏览器缓存仍可能命中旧版）。

本模块把这套动作收敛到一个 web 页内。

### 1.1 边界（明确不做）

-   **不增**资源：UI 上不允许新建文件，只允许覆盖已存在文件；
-   **不删**资源：UI 上不允许删除（演示场景下避免误删；
-   **不做版本控制**：写入仅落盘到工作区，是否 commit 由开发者决定；
-   **不做权限 / 多用户**：仅本地 dev 自用，部署到 production 需另行加固。

### 1.2 目标用户

本地开发 / 演示搭建者，需要快速确认 / 替换 mock 数据、地图底图、UI 装饰图的工程师与设计者。

## 2. 功能清单

| #   | 功能               | 说明                                                                             | 优先级 |
| --- | ------------------ | -------------------------------------------------------------------------------- | ------ |
| F1  | 资源树（3 类 tab） | 左栏按 `mock` / `map` / `images` 分组，按一级子目录聚合，节点显示大小 / 修改时间 | P0     |
| F2  | 搜索 / 过滤        | 按文件名、路径关键字、扩展名（`.json` / `.png` / `.svg`）过滤                    | P0     |
| F3  | 多形态预览         | `.json` 折叠树；图片支持缩放；`.svg` 直接渲染；其它文本按纯文本显示              | P0     |
| F4  | 快捷操作           | 复制完整 URL、复制相对路径、新窗口打开、下载                                     | P1     |
| F5  | 就地编辑文本资源   | JSON / SVG / 文本文件可在线编辑保存；保存前弹窗问是否下载当前版本作为本地备份；JSON 自动 `JSON.parse` 校验 | P1     |
| F6  | 上传覆盖二进制资源 | 图片等二进制文件可选择本地文件覆盖同名文件；上传前弹窗问是否下载当前版本作为本地备份 | P1     |

## 3. 页面与路由

### 3.1 页面入口

在 `src/controller/index.ts` 现有 `Index` handler 上追加一个 `@Get('/static-resource-manager')`：

```ts
@Get('/static-resource-manager') // 静态资源管理
```

### 3.2 前端页面骨架

```
web/pages/static-resource-manager/
├── render.tsx                  # 两栏 admin 布局（非 LargeScreenEnv）
├── fetch.ts                    # SSR fetch 占位（可空）
├── index.less
├── modules/
│   ├── tree-panel/             # F1 + F2
│   ├── viewer-panel/           # F3
│   │   ├── JsonViewer.tsx
│   │   ├── ImageViewer.tsx
│   │   ├── SvgViewer.tsx
│   │   └── TextEditor.tsx      # F5
│   ├── toolbar/                # F4
│   └── upload-dialog/          # F6
├── store/index.ts              # zustand：selectedPath / mode(view|edit) / dirty
└── types.ts
```

### 3.3 布局

经典两栏 admin 布局（左树右主区）：

```
┌──────────────┬─────────────────────────────┐
│   树 + 搜索  │     预览 / 编辑器 / 上传     │
│   (280px)    │         (flex 1)            │
└──────────────┴─────────────────────────────┘
```

## 4. 后端 API

新增 `src/controller/static-resource.ts`：

| 方法 | 路径                                    | 入参                            | 出参                             | 用途                    |
| ---- | --------------------------------------- | ------------------------------- | -------------------------------- | ----------------------- |
| GET  | `/api/static-resource/list?type=&path=` | `type: 'mock'\|'map'\|'images'` | `TreeNode[]`                     | F1 资源树               |
| GET  | `/api/static-resource/read?path=`       | `path: string`                  | `{ content, size, mtime, mime }` | F3 预览 / F5 编辑器加载 |
| POST | `/api/static-resource/write`            | `{ path, content }`             | `{ mtime }`                      | F5 保存文本             |
| POST | `/api/static-resource/upload`           | `multipart: file, path`         | `{ size, mtime }`                | F6 上传覆盖             |
| GET  | `/api/static-resource/raw?path=`        | 重定向                          | 302 → `/static/<path>`           | F4 浏览器直接打开       |

新增 `src/service/static-resource.ts`：

-   `list(type)`：`fs.readdirSync(public/static/<type>, { recursive: true, withFileTypes: true })` 递归，按一级子目录聚合；
-   `read(path)`：读取文本内容，返回 `mime`（按扩展名）；
-   `write(path, content)`：原子写（见 §5）；
-   `upload(path, stream)`：原子写（见 §5）。

新增 `IStaticResourceService` 到 `src/interface/index.ts`。

## 5. 安全与边界（重要）

1. **路径白名单**：所有路径必须 `path.resolve` 后落在 `public/static/{mock,map,images}/` 内，杜绝 `../` 越权。  
2. **禁止新建**：`write` / `upload` 前用 `fs.existsSync` 校验目标已存在，**不存在直接 400**。  
3. **原子写入**：先写 `*.tmp` → `fs.renameSync` 替换；中途失败不影响原文件。  
4. **客户端备份**：保存 / 上传前由前端弹窗询问是否下载当前文件到本地（见 §6）；服务端**不再**自动落 `.bak`。  
5. **大小限制**：`upload` 通过 `koa-body` / `formidable` 限制单文件 20 MB（可配置。  
6. **MIME 限制**：`read` 接口拒绝二进制（仅返回文件元信息），由前端走 `/raw` 直出。  
7. **CORS / 鉴权**：默认同源；production 部署需另行加固（参见 §1.1 边界）。

## 6. UI 流程

1. **浏览**：进入页面 → 加载三棵 tree → 选中节点 → 中栏加载预览。
2. **编辑**：选中 JSON / SVG / 文本 → 中栏切到 `TextEditor` → 修改触发 dirty → 点「保存」 → **Modal 询问「是否先下载当前版本作为本地备份？」** → 「下载并保存」先触发浏览器下载原文件再调 `/write`；「直接保存」直接调 `/write`；「取消」关闭弹窗、不保存。
3. **上传覆盖**：图片等二进制节点 → 工具栏「替换」 → 文件选择 → **Modal 询问「是否先下载当前版本作为本地备份？」** → 「下载并上传」先 fetch 当前文件流触发下载，再调 `/upload`；「直接上传」直接调 `/upload`；「取消」关闭弹窗、不上传。
4. **下载触发**：浏览器端用 `fetch(/api/static-resource/raw?path=...)` 拿到 Blob，再 `<a download="<原文件名>" href=blob:...>` 触发下载；与上传 / 保存并行执行，不阻塞主流程。

## 7. 实施路径（任务分解）

| 编号 | 任务                    | 内容                                                  | 依赖  |
| ---- | ----------------------- | ----------------------------------------------------- | ----- |
| T1   | task-001：脚手架 + 浏览 | 后端 controller / service 骨架 + 前端两栏 + 树 + 预览 | —     |
| T2   | task-002：文本编辑      | TextEditor + 原子写 + 保存前下载备份弹窗               | T1    |
| T3   | task-003：上传覆盖      | upload 接口 + upload-dialog                           | T1    |
| T4   | task-004：搜索与过滤    | tree-panel 内嵌搜索框，扩展名 / 关键字过滤            | T1    |
| T5   | task-005：自检与文档    | `pnpm run lint` + 更新 `AGENTS.md` 添加工具入口说明   | T1–T4 |

任务文档模板参考 `.trae/skills/oss-demonstrate-project-bj-cmcc-cmd-dispatcher/templates/task.md`。

## 8. 默认决策（可直接开工，反对再调）

-   **编辑器**：JSON 用 `Input.TextArea` + `JSON.parse` 校验（不引 Monaco，控制 bundle）；SVG 同上；
-   **备份策略**：改为**浏览器端下载备份**（保存 / 上传前弹窗询问）；服务端 `.bak` **默认关闭**（不再落盘），如需可作为后续扩展；
-   **上传大小上限**：20 MB；
-   **页面配色**：跟随 antd 默认主题，不做大屏风；
-   **资源目录权限**：仅 `public/static/{mock,map,images}/`，其它目录一律拒绝。

## 9. 验证清单（完工自检）

-   [ ] 三个 tab 都能展开树，节点大小 / mtime 显示正确；
-   [ ] JSON 折叠、搜索、字段跳转可用；
-   [ ] 图片可缩放、SVG 渲染正确；
-   [ ] 编辑 JSON 后保存，文件 mtime 更新，`GET /static/<path>` 返回新内容；
-   [ ] 保存 / 上传前弹出「是否下载备份？」弹窗，「下载并保存」触发浏览器下载原文件 + 完成保存，「直接保存」跳过下载，「取消」不保存；
-   [ ] 下载到的本地备份文件名与原文件一致，内容为保存前的版本；
-   [ ] 上传图片覆盖同名文件，原文件被原子替换；
-   [ ] 尝试覆盖不存在文件 → 400 报错；
-   [ ] 尝试通过 `path=../../../package.json` 越权 → 400 报错；
-   [ ] `pnpm run lint` 通过。

## 10. 开放问题（待定）

-   是否在 `AGENTS.md` 增加「本地管理工具入口」一行（路由 `/static-resource-manager`；
-   是否需要将本 skill 升级为独立 skill（`oss-demonstrate-project-static-resource-manager`），还是继续借用 `oss-demonstrate-project-context` 的位置。

---

## 文档元信息

> 版本：v0.3.0  
> 日期：2026-08-25  
> 状态：草案（待 T1 开工）  
> 变更：
> - v0.1.0 → v0.2.0：移除 F4「引用溯源」（用户确认不需要），布局由三栏改为两栏，编号与任务分解同步重排。
> - v0.2.0 → v0.3.0：保存 / 上传备份从服务端 `.bak` 改为**前端弹窗询问下载**（覆盖 F5、F6、§5 §6 §8 §9）。
