# backend · common 模块（src/modules/common）

> 服务端 BFF 层通用能力。物理位置 `src/modules/common/`，Midway controller。
> 记录事实：接口路由、参数、行为，不记过程。

## static-file（controller/static-file.ts）

静态文件获取（读 `public/static/`，不重启服务即可生效）。`wipRoot = process.cwd()`。

### GET /common/static-file/view-config

- 参数：`config`（string，配置文件名，不含 .json）
- 行为：读 `public/static/<config>.json`，JSON.parse 后包 success 返回
- 示例：`/common/static-file/view-config?config=info-management-bureau-view-config`

### GET /common/static-file/view-image

- 参数：`image`（string，相对 `public/static/images/` 的路径）
- 行为（2026-10-10 定稿）：按文件名 stem 遍历候选扩展名探测，找到什么返回什么
    - 取 `path.extname(image)`；有扩展名则先剥离得到 stem，且该扩展名优先探测
    - 候选顺序：传入扩展名 → `.svg` → `.png` → `.jpg` → `.jpeg` → `.gif`（去重、去空）
    - 依次 `fs.existsSync` 探测 `public/static/images/<stem><ext>`，命中即返回 `createReadStream`
    - Content-Type 按实际命中扩展名的 mime（svg/png/jpg/jpeg/gif，未命中 fallback `application/octet-stream`）
    - 全部候选不存在 → 返回 Error `图片不存在：<image>`
- 示例：`/common/static-file/view-image?image=shenzhen-communication-guarantee/area-thumb/深圳湾`（无扩展名也 OK）

### GET /common/static-file/mock/:dir/:file

- 参数：路径参数 `dir` / `file`
- 行为：读 `public/static/mock/<dir>/<file>.json`，与 `success(null)` 合并后返回（data 直挂响应体）
- 示例：`/common/static-file/mock/five-major-center/command-dispatch-center-middle-page-support-mission-point`

### GET /common/static-file/fallback/:dir/:file

- 参数：路径参数 `dir` / `file`
- 行为：读 `public/static/fallback/<dir>/<file>.json`，JSON.parse 后包 success 返回
- 示例：`/common/static-file/fallback/info-management-bureau/xxxxxx.json`
