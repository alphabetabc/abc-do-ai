# 10.10.6.53 服务器文件布局（2026-11-19 勘察）

## 全局

- 宿主机 nginx（无系统服务，PATH 里无 nginx 命令）：`/opt/nginx/`
  - `sbin/nginx`（可执行，-t / -s reload 等，见 operations.md）
  - `conf/nginx.conf`（主配置，http 块第 22 行起 include 各前端 conf）
  - `conf/pmmp.conf`（本次新增，9016 server，完整内容见 nginx.md）
  - `logs/`（nginx.pid、error.log / access.log）
- 宿主系统走 docker：
  - `oss-broadnet-cq-frontend`（20020→80，宿主前端）
  - `oss-broadnet-cq-backend`（20021→8000，宿主菜单/角色 API 后端）
- pmmp 前端后端服务（服务端侧）：`http://10.10.6.53:8099`（alarmModelUrl 等指向）

## nginx 已监听端口

| 端口 | 用途 |
| --- | --- |
| 8081 / 18100 / 7001 | 既有 server（boco-iptv-res 等，部署前已在） |
| 9016 | pmmp 独立 server（本次新增） |
| 9001 | 空闲（对齐 2.8 框架入口惯例，初版未启用） |

## /opt/iptv/ 目录

```text
/opt/iptv/
├── web/
│   ├── res/                  # 既有静态前端（boco-iptv-res.conf 托管）
│   └── pmmp/
│       └── build/            # ★ pmmp 产物（zip 解压归位）
│           ├── index.html    # 资源引用带 /pmmp/ 前缀（publicPath）
│           ├── environment.json  # ★ 运行时后端地址配置，可直接改，无需重构建
│           ├── static/       # css/js chunk
│           └── ...
├── kpi-service/
├── iptv-tpl/
└── plugin-store/
```

## 中转目录

- `/opt/temp/`：scp 上传与解压中转（首次部署前不存在，需 `mkdir -p`）；回滚备份 build.bak.<日期> 也放这里。

## 关键文件速查

| 要改什么 | 改哪 |
| --- | --- |
| pmmp 后端地址 | `/opt/iptv/web/pmmp/build/environment.json` |
| pmmp nginx 托管配置 | `/opt/nginx/conf/pmmp.conf` |
| nginx 挂载新 conf | `/opt/nginx/conf/nginx.conf`（http 块内 include） |
| 宿主菜单/角色 | 20020 页面操作或 API（见 host-integration.md） |
