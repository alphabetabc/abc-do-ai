# 任务卡 · pmmp 独立部署到 10.10.6.53 并以 iframe 嵌入 20020 宿主系统

## 元信息

| 项         | 值                                                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 编号       | 2026-11-19-001                                                                                                               |
| Status     | 已完成（遗留：页面接口点验与剩余 6 项后端地址结论，外部依赖，后续单独跟进；长期事实以 design/deployments/001-standalone-deployment/ 为准） |
| 关联输入   | .trae/skills/oss-pmmp-project-context/pm/001-standalone-app/inputs.md                                                        |
| 设计回填位 | .trae/skills/oss-pmmp-project-context/design/deployments/001-standalone-deployment/overview.md（独立目录，与 modules/ 同级） |

## 目标

把 oss-pmmp 整应用部署到 10.10.6.53:/opt/iptv（独立运行模式，静态托管），并在宿主系统 http://10.10.6.53:20020/ 的「性能监控」分组下通过「Shell 内 iframe 嵌入」子菜单接入全部 pmmp 路由，授权后用户可从宿主正常使用性能监控功能。

## 背景与已确认结论（详见 inputs.md）

- 接入方式已实测验证：宿主菜单支持「第三方链接 / iframe → Shell 内 iframe 嵌入」，路径必须 /ext/ 开头，子菜单路径不必以父级为前缀；建菜单后必须在角色管理授权。
- 16 条菜单清单与 24 个按钮权限 key 已摸清（inputs.md）。
- 宿主已有「性能监控」根菜单（/pmmp，分组）。
- 预研菜单「预研-嵌入百度」（/ext/baidu-test）已建并验证通过。

## 调研子项（阶段一 → 技术设计前置，需深入本仓库代码）

1. **environment.json 加载机制**：public/environment.json 是集中配置（服务发现 + 各后端 direct 地址）。调研代码中如何加载（src/common/configs、src/hox 环境信息 model 等），确认：
    - 独立部署时该文件从哪读（随产物部署 or 访问远端集中配置）；
    - 10.10.6.53 环境下各后端地址（10.10.1.x / 10.10.2.x / 10.10.5.98）是否可达、要不要改。
2. **按钮权限传递机制**：调研仓库内 buttonAuthorize（environment.json 中当前为 false）与权限 key（pmmpXxxYyy:Other）在代码中的校验逻辑（src/common、oss-web-common 封装等），确认 iframe 嵌入独立部署模式下权限如何生效：
    - 是否走宿主 Token（菜单「允许 URL 传递 Token」）；
    - 还是独立部署直接关闭按钮级权限（buttonAuthorize: false）。
3. **服务器现状勘察**：SSH 10.10.6.53 查看 /opt/iptv 目录结构、20020 服务如何托管（nginx？docker？）、可用端口、pmmp 产物放置位置与托管方式。

## 调研结论（2026-11-19）

### 服务器勘察（10.10.6.53）

- 宿主机 nginx：`/opt/nginx/`（启动命令 `./nginx`，配置 `/opt/nginx/conf/nginx.conf`，已有 `include boco-iptv-res.conf;` 惯例）。当前监听 8081 / 18100 / 7001。
- 20020 宿主系统 = docker 容器 `oss-broadnet-cq-frontend`（20020→80），后端 `oss-broadnet-cq-backend`（20021→8000）。
- `/opt/iptv/` 下已有 web/res（另一静态前端）、kpi-service、iptv-tpl、plugin-store。pmmp 产物计划放 `/opt/iptv/web/pmmp/build`。
- 端口 9001 / 9016 空闲可用。

### 老环境部署参考（10.10.2.8，已勘察）

2.8 采用「9001 框架入口 + 路径前缀反代 + 子应用独立端口」模式：

```text
9001 (oss-framework server)
 ├─ /             → root /opt/nginx/html/oss-framework/build（框架 shell）
 ├─ /pmmp/        → proxy_pass http://127.0.0.1:9016/
 ├─ /configmanage → proxy_pass http://127.0.0.1:7003（集中配置服务）
9016 (oss-pmmp server)
 ├─ root /opt/nginx/html/oss-pmmp/build
 ├─ try_files $uri $uri/ /index.html?/$request_uri（SPA fallback）
 ├─ CORS 头（Access-Control-Allow-*）+ OPTIONS 返回 204
 └─ gzip on；屏蔽 .map / 脚本后缀返回 404
```

### environment.json 加载机制（代码调研）

- src/hox/index.js L282-289：`CONFIG_LOCAL !== 'true'` 时读远端 `${CONFIG_HOST}/configmanage/environment.json?isApply=true&projectName=oss-pmmp`；`CONFIG_LOCAL === 'true'` 时读随产物部署的 `${MICRO_APP_URL}/environment.json`。
- 独立部署（非 single-spa、构建未注入 REACT_APP_CONFIG_HOST/REACT_APP_CONFIG_LOCAL）：CONFIG_HOST 为空 → 请求同源相对路径 `/configmanage/...`。2.8 上由 9001 server 的 /configmanage 反代到 7003 满足。
- **6.53 无 configmanage 服务** → 需二选一：
    - 方案 A：构建时设 `REACT_APP_CONFIG_LOCAL=true` 走本地 environment.json（改仓库或构建时注入 env）；
    - 方案 B：在 6.53 nginx 上把 `/configmanage` 反代到某个配置服务（当前无此服务，不采用）。
    - **已定方案 A**：新增构建命令 `yarn build:standalone`（scripts/build-standalone.js 设 `REACT_APP_CONFIG_LOCAL=true` 后复用 scripts/build.js），不动构建链与环境文件。

### 按钮权限机制（代码调研）

- src/components/auth-button/index.jsx L18-19、L57：`buttonAuthorize` 为 false 时按钮全部显示，不校验权限 key。
- environment.json 当前 `buttonAuthorize: false` → 独立部署下按钮权限默认全开，**不需要**宿主「允许 URL 传递 Token」，24 个权限 key 无需迁移（后续要收紧再开）。

### 后端可达性（6.53 探测，2026-11-19）

| 配置项                              | 现地址           | 探测 | 结论                           |
| ----------------------------------- | ---------------- | ---- | ------------------------------ |
| alarmModelUrl / performanceQueryUrl | 10.10.1.26:8099  | OK   | 改指向 10.10.6.53:8099         |
| viewItemUrl（性能趋势）             | 10.10.2.22:8085  | OK   | 待定：保留 or 改 8099          |
| dataVerifyUrl（缺数检测）           | 10.10.1.170:8089 | FAIL | 改指向 10.10.6.53:8099         |
| kpiMonitorService（指标/报告）      | 10.10.1.170:8099 | FAIL | 改指向 10.10.6.53:8099         |
| logOperUrl（操作日志上报）          | 10.10.2.8:7001   | FAIL | 待定（失败可容忍，仅影响日志） |
| objectManage / dataObjectManage     | 10.10.2.8:7011   | OK   | 待定：保留 or 改               |
| varManagerService                   | 10.10.5.98:8762  | FAIL | 待定：改 8099？                |

- 用户（@谢名伟）确认：**新环境后台服务地址 = http://10.10.6.53:8099**（TCP 可达，根路径 404 属正常）。
- 待用户确认：viewItemUrl / objectManage / logOperUrl / varManagerService 四项是否也统一改 8099。

## 实施步骤（初稿，调研后细化）

1. 调研子项 1~3，结论回填本卡与 design/modules/020-standalone-deployment/overview.md。
2. 构建产物（yarn build），按调研结论处理 environment.json。
3. 部署到 /opt/iptv，起服务，独立访问验证。
4. 宿主菜单管理批量建 15~16 条 iframe 子菜单（URL → http://10.10.6.53:<port>/<路由>，path /ext/pmmp-\*），授权。
   - **已验证可纯 API 批量**（2026-11-19 实测，含建菜单→授权→打开渲染→删除全链路）：浏览器登录宿主后在控制台执行，无需逐个点表单。接口清单见 inputs.md「宿主菜单/角色 API 批量操作」。
5. 端到端验证：宿主进入各菜单页面、接口请求、按钮权限。

## 6.53 nginx 配置方案（照搬 2.8 的 9016 server 块）

新增 `/opt/nginx/conf/pmmp.conf`，并在 `nginx.conf` 的 http 块内（`include boco-iptv-res.conf;` 之后，即第 22 行）加一行 `include pmmp.conf;`。

**⚠️ 6.53 实际部署时相对 2.8 参考配置有两处调整（2026-11-19 实施发现）**：
1. 该机 nginx 编译时**未带 PCRE 和 rewrite 模块**——正则 location（`\.(asp|...)$`、`\.map$` 404 加固）和 `if ($request_method = 'OPTIONS')` 块均不可用，已删除（CORS 预检由 add_header 覆盖，不影响 iframe 使用）。
2. 构建产物 publicPath 为 `/pmmp/`（index.html 内资源引用带前缀），需用 `location ^~ /pmmp/` + `alias` 剥掉前缀映射到 build 目录，不能只靠 root。

**实际生效的最终配置（/opt/nginx/conf/pmmp.conf）**：

```nginx
# oss-pmmp standalone (refer: 2.8 9016 server; 6.53 nginx 无 PCRE/rewrite 模块，已简化)
server {
    listen 9016;
    client_max_body_size 50M;
    client_body_buffer_size 50M;
    keepalive_timeout 75s;
    server_name 127.0.0.1;
    charset utf-8;
    gzip on;

    root /opt/iptv/web/pmmp/build;
    index index.html;

    # 静态资源（构建产物 publicPath=/pmmp/，用 alias 剥掉前缀）
    location ^~ /pmmp/ {
        alias /opt/iptv/web/pmmp/build/;
        try_files $uri $uri/ /pmmp/index.html;
    }

    location ^~ / {
        add_header Access-Control-Allow-Origin '*';
        add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
        add_header Access-Control-Allow-Headers 'Authorization,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type';

        try_files $uri $uri/ /index.html?/$request_uri;
    }
}
```

操作步骤（实际执行记录）：

```bash
# 1. 上传产物（zip 传 /opt/temp 后解压归位）
scp <本地zip> root@10.10.6.53:/opt/temp/
cd /opt/temp && unzip -o <包名>.zip
mkdir -p /opt/iptv/web/pmmp && mv /opt/temp/build /opt/iptv/web/pmmp/build
# 2. 写入 /opt/nginx/conf/pmmp.conf（上述最终配置）
# 3. 主配置加 include：sed -i '22i\    include pmmp.conf;' /opt/nginx/conf/nginx.conf
#    （注意：不能用 /include boco-iptv-res.conf;/ 做模式匹配——实际行内是多空格，匹配不上）
# 4. 校验并重载
/opt/nginx/sbin/nginx -t && /opt/nginx/sbin/nginx -s reload
# 5. 验证
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:9016/                                  # 200
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:9016/pmmp/environment.json   # 200 json
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:9016/pmmp/performance-rules            # 200（SPA fallback）
```

- pmmp 访问地址：`http://10.10.6.53:9016/pmmp/<路由>`，2026-11-19 已实测页面渲染正常。
- 端口 9016 对齐 2.8 惯例；如需对外用 9001，可再加一层 `listen 9001` + `location /pmmp/ → 127.0.0.1:9016`，初版先直连 9016。
- 宿主菜单 URL 模板即填 `http://10.10.6.53:9016/pmmp/<路由>`。
- 更新部署提醒：替换 build 目录后无需动 nginx；`environment.json` 可直接在服务器上改（无需重新构建）。

## 环境勘察命令备忘（复检/回访可直接执行）

```bash
# --- nginx 进程定位（宿主机无 PATH 时） ---
ps -ef | grep nginx | grep -v grep
readlink -f /proc/<master-pid>/exe    # nginx 可执行位置（6.53 → /opt/nginx/sbin/nginx）
readlink -f /proc/<master-pid>/cwd    # 启动目录

# --- 监听端口 / docker 容器 ---
ss -tlnp
docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Image}}"

# --- nginx 配置检索（2.8 与 6.53 结构相同） ---
grep -n "listen\|root\|include\|server_name" /opt/nginx/conf/nginx.conf | head -40
grep -n "9001\|pmmp" /opt/nginx/conf/nginx.conf | head -30

# --- 后端可达性探测（在部署机 6.53 上执行） ---
for p in 10.10.6.53:8099 10.10.1.26:8099 10.10.1.170:8089 10.10.1.170:8099 \
         10.10.2.22:8085 10.10.2.8:7001 10.10.2.8:7011 10.10.5.98:8762; do
  timeout 3 bash -c "echo > /dev/tcp/${p%:*}/${p#*:}" 2>/dev/null && echo "OK  $p" || echo "FAIL $p"
done

# --- 部署后验证 ---
/opt/nginx/sbin/nginx -t && /opt/nginx/sbin/nginx -s reload
curl -s -o /dev/null -w "%{http_code}" http://10.10.6.53:9016/ ; echo
curl -s http://10.10.6.53:9016/environment.json | head -20
```

2.8 现网 environment.json 快照（用户从 configmanage 侧取回，2026-11-19）：与仓库 public/ 版本基本一致，仅缺 `performanceQueryParamConfig` 块；各后端地址同 public/ 原版。

## 宿主菜单/角色 API 批量操作（2026-11-19 实测验证）

宿主登录后（浏览器 F12 控制台），token 取 `localStorage.getItem('token')`，请求头带 `Authorization: Bearer <token>`。

### 1. 建 iframe 子菜单：`POST /api/v1/menus`

请求体（实测成功，字段来自宿主前端源码 `Ctt` 构造函数 + 接口验证）：

```json
{
  "name": "菜单名",
  "path": "/ext/pmmp-<slug>",
  "icon": null,
  "parent_id": "eda2200e-66c7-457c-b88a-1db527e251db",
  "sort_order": 1,
  "level": 2,
  "status": 1,
  "is_visible": true,
  "is_default_route": false,
  "external_link": true,
  "menu_type": "external_iframe",
  "external_url": "http://10.10.6.53:9016/pmmp/<路由>",
  "allow_sensitive_params": false,
  "iframe_sandbox": "allow-scripts allow-same-origin allow-forms allow-popups",
  "action_id": null
}
```

- `parent_id` = 「性能监控」根菜单 id（已核实为 `eda2200e-66c7-457c-b88a-1db527e251db`，用 `GET /api/v1/menus` 可再确认）。
- path 必须 `/ext/` 开头；menu_type `external_iframe` = Shell 内 iframe 嵌入。

### 2. 角色授权：`PUT /api/v1/roles/{roleId}/menus`

body：`{"menu_ids": ["<全量菜单id>"]}`（幂等，传全量）。超级管理员 roleId = `91189641-c612-472f-aa70-9cfb38b710f0`。
注意：`PUT /api/v1/roles/{id}`（角色本体）不会更新 menu_ids，必须用 `/menus` 子接口。

### 3. 按钮权限码（备用，当前方案 buttonAuthorize=false 不需要）

- `POST /api/v1/permissions` 建 24 个 key（待验证字段）
- `PUT /api/v1/roles/{roleId}/permissions`，body `{"permission_ids": [...]}`

### 4. 其他配套接口

`GET /api/v1/menus`（菜单树）、`PUT /api/v1/menus/{id}`（改）、`DELETE /api/v1/menus/{id}`（删）、`PUT /api/v1/menus/reorder`（排序）。

### 批量脚本（部署后控制台执行，建 15 条 + 授权）

```js
const h = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') };
const PARENT = 'eda2200e-66c7-457c-b88a-1db527e251db';
// (名称, path slug, pmmp路由, sort)
const items = [
  ['告警条件设置','pmmp-rules','performance-rules',1],
  ['性能分类查询','pmmp-query-type','performance-query-type',2],
  ['缺数检测设置','pmmp-data-verifying','data-verifying',3],
  ['性能指标组管理','pmmp-indicator-group','performance-indicator-group',4],
  ['性能趋势','pmmp-trend-modal','performance-trend-modal',5],
  ['性能趋势页面','pmmp-trend','performance-trend',6],
  ['阈值设置','pmmp-threshold','threshold-setting',7],
  ['性能数据查询','pmmp-query','performance-query',8],
  ['性能指标管理','pmmp-indicator-manage','performance-indicator-manage',9],
  ['报告模板管理','pmmp-report-template','performance-report-template',10],
  ['总体监控视图','pmmp-over-monitor','performance-over-monitor',11],
  ['测量指标查询','pmmp-mea-indicator','performance-mea-indicator',12],
  ['报告实例管理','pmmp-report-example','performance-report-example',13],
  ['性能指标查询','pmmp-per-indicator','performance-per-indicator',14],
  ['性能批量查询','pmmp-query-batch','performance-query-batch',15],
];
const created = [];
for (const [name, slug, route, sort] of items) {
  const res = await fetch('/api/v1/menus', { method: 'POST', headers: h, body: JSON.stringify({
    name, path: '/ext/' + slug, icon: null, parent_id: PARENT, sort_order: sort, level: 2,
    status: 1, is_visible: true, is_default_route: false, external_link: true,
    menu_type: 'external_iframe', external_url: 'http://10.10.6.53:9016/pmmp/' + route,
    allow_sensitive_params: false, iframe_sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups',
    action_id: null }) });
  const j = await res.json();
  if (j.code === 200) created.push(j.data.id); else console.error(name, j.message);
}
console.log('created:', created.length);
// 全量授权：现有授权 + 新建菜单
const role = (await (await fetch('/api/v1/roles', { headers: h })).json()).data.items[0];
const auth = await fetch(`/api/v1/roles/${role.id}/menus`, { method: 'PUT', headers: h,
  body: JSON.stringify({ menu_ids: [...role.menu_ids, ...created] }) });
console.log('授权:', (await auth.json()).message);
```

## 剩余执行计划（2026-11-19，代码已推送 Jenkins）

### ① 前置（等待中）

- [ ] 服务端回复 8 个后端地址结论 → 剩余 4 项待定地址改 **服务器上** `/opt/iptv/web/pmmp/build/environment.json`（无需重新构建）；若同时改仓库 public/ 版本则推送 + Jenkins 重打包
  - 2026-11-19 服务端回复（部分）：第 1、2 项 alarmModelUrl / performanceQueryUrl 走 http://10.10.6.53:8099（服务器与仓库均已是指向，无需改动）；第 3~8 项待续
- 说明：构建走 Jenkins（命令 `yarn build:standalone`），已验证可行（本轮部署包即该命令产出，CONFIG_LOCAL 生效）。

### ② 部署（✅ 2026-11-19 完成）

- [x] 下载 Jenkins 构建产物包（oss-pmmp-1.0.0-20261119125504.zip）
- [x] 上传 6.53：scp → /opt/temp → 解压 mv 至 `/opt/iptv/web/pmmp/build`
- [x] 写 `/opt/nginx/conf/pmmp.conf`（最终生效版本见上文，含两处与 2.8 参考的差异调整）
- [x] `nginx.conf` 加 `include pmmp.conf;`（第 22 行插入）→ `nginx -t` 通过 → reload 成功

### ③ 验证（✅ 2026-11-19 完成，部分遗留）

- [x] 独立访问 `http://10.10.6.53:9016/`：200，页面渲染正常（浏览器实测）
- [x] environment.json 走本地文件（curl 返回 6.53:8099 版本；CONFIG_LOCAL 构建生效）
- [x] 静态资源 /pmmp/ 前缀经 nginx alias 正常返回 css/js（200 + 正确 content-type）
- [ ] 页面接口请求正常 —— **部分依赖后端未定**：缺数检测/指标管理（10.10.1.170）、变量管理（10.10.5.98）、操作日志（2.8:7001）暂不可达，等 ① 服务端结论
- [x] 宿主 20020 建 15 条 iframe 子菜单（浏览器自动化批量执行 POST /api/v1/menus × 15，全部成功，菜单 id 已记录在宿主系统）
- [x] 角色授权：超级管理员 PUT /roles/{id}/menus 全量 34 条成功
- [x] 端到端：宿主侧边栏 15 条菜单可见，「告警条件设置」打开 iframe（1081×577）加载 pmmp 页面正常

### ④ 收尾

- [x] 回填 design/deployments/001-standalone-deployment/（overview / nginx / environment / host-integration / operations 五个文档，为长期真实源，不依赖本任务卡）
- [ ] 验收标准逐项勾选（剩余：页面接口请求正常，依赖服务端地址结论）
- [x] 预研菜单「预研-嵌入百度」（/ext/baidu-test）：**已删除**（2026-11-19 复查菜单管理列表与导航均无此菜单，此前后续清理时已删，角色授权全量覆盖亦已同步）

## 不做清单

- 不改 pmmp 业务代码与构建链（config/webpack.config.js），除非调研证明必须（如 publicPath）。
- 不做 single-spa 微前端接入（已定 iframe 方案）。
- 不迁移老系统 10.10.2.8 的菜单数据，仅按 inputs.md 清单在新环境新建。
- 不处理 pmmp 后端服务本身的部署（假定后端地址已存在/可达，仅改前端指向）。

## 验收标准

- [x] http://10.10.6.53:9016/pmmp/ 独立访问 pmmp 正常（2026-11-19 浏览器实测）。
- [x] 宿主「性能监控」分组下 15 条菜单全部可见、可打开，iframe 内页面渲染正常（端到端实测「告警条件设置」等）。
- [ ] 页面接口请求正常（environment.json 指向的后端可达或已按需调整）——待服务端地址结论。
- [x] 按钮权限策略明确并生效：buttonAuthorize=false 按钮全开，不接宿主 Token（结论记录于 design/deployments/001-standalone-deployment/environment.md）。
- [x] 调研结论已回填 design/deployments/001-standalone-deployment/（overview / nginx / environment / host-integration / operations）。
- [x] 预研菜单「预研-嵌入百度」处理方式有明确结论：已删除。

## 开放问题：待服务端确认的后端地址

```text
pmmp 前端要部署到 10.10.6.53。配置文件（environment.json）里共有 7 个后端服务地址，
请逐个确认：新环境用哪个地址？可以直接用 http://10.10.6.53:8099 的请标注「8099」，
有单独地址的请给新地址。

1. alarmModelUrl（告警条件设置、阈值设置、总体监控视图）
   现网：http://10.10.1.26:8099
2. performanceQueryUrl（性能数据查询）
   现网：http://10.10.1.26:8099
3. dataVerifyUrl（缺数检测设置）
   现网：http://10.10.1.170:8089
4. kpiMonitorService（性能指标管理、报告模板、报告实例）
   现网：http://10.10.1.170:8099
5. viewItemUrl（告警右键视图服务，性能趋势模块用）
   现网：http://10.10.2.22:8085
6. logOperUrl（按钮操作日志上报）
   现网：http://10.10.2.8:7001
7. objectManage / dataObjectManage（对象管理、数据对象管理）
   现网：http://10.10.2.8:7011
8. varManagerService（变量管理服务，阈值/指标功能用）
   现网：http://10.10.5.98:8762
```

内部备注（不外发）：6.53 探测结果——viewItemUrl（2.22:8085）、objectManage（2.8:7011）可达；logOperUrl（2.8:7001）、varManagerService（5.98:8762）不通。

## 变更记录

- 2026-11-19 立项（待审批）。
- 2026-11-19 完成三项调研（服务器勘察 / environment.json 加载 / 按钮权限），回填调研结论与 6.53 nginx 配置方案；后端地址待用户确认四个待定项后统一改 10.10.6.53:8099。
- 2026-11-19 实测宿主菜单 API：`POST /api/v1/menus` 批量建菜单、`PUT /api/v1/roles/{roleId}/menus` 授权（注意：`PUT /api/v1/roles/{id}` 本体不会更新 menu_ids）均可用，已用谷歌 iframe 菜单全链路验证并清理测试数据；结论待回填 inputs.md。
- 2026-11-19 部署与宿主接入完成（②③ 勾选），design 回填至 design/deployments/001-standalone-deployment/（overview/nginx/environment/host-integration/operations），任务卡与 pm/ 降级为过程记录、长期事实以 design 为准。
- 2026-11-19 用户确认任务收口、归档；遗留项（页面接口点验、剩余 6 项后端地址）为外部依赖，结论回来后直接更新 design/deployments/001-standalone-deployment/environment.md 地址表与服务器 environment.json。
