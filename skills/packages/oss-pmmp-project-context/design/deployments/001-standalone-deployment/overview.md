# 001 · oss-pmmp 独立部署（10.10.6.53，iframe 接入 20020 宿主）

## 部署形态

- 构建：Jenkins `yarn build:standalone`（scripts/build-standalone.js 设 `REACT_APP_CONFIG_LOCAL=true` 后复用 scripts/build.js），读随产物部署的本地 environment.json（6.53 无 configmanage 服务）。publicPath `/pmmp/`。
- 托管：10.10.6.53 宿主机 nginx（/opt/nginx）9016 端口，产物 `/opt/iptv/web/pmmp/build`，`location ^~ /pmmp/` + alias 剥前缀。详见 [nginx.md](./nginx.md)。
- 接入：宿主 20020 「性能监控」分组下 15 条 external_iframe 菜单 → `http://10.10.6.53:9016/pmmp/<路由>`，超管角色已全量授权。详见 [host-integration.md](./host-integration.md)。
- 配置：environment.json 加载机制、后端地址清单与非地址类配置详见 [environment.md](./environment.md)。
- 操作：日常更新、首次部署步骤、nginx 重启、服务器文件布局、回滚详见 [operations.md](./operations.md) 与 [server-layout.md](./server-layout.md)。
- 背景参考：需求摸底与宿主接入机制调研见 [pm/001-standalone-app/inputs.md](../../pm/001-standalone-app/inputs.md)；如与本文冲突，以本文（design）为准。

## 关键结论

- 6.53 nginx 编译无 PCRE、无 rewrite 模块：正则 location、`if` 指令均不可用，CORS 用 add_header 覆盖。
- buttonAuthorize=false → 按钮权限全开，不接宿主 Token；后续要收紧再开（宿主也支持「允许 URL 传递 Token」）。
- 后端地址结论（详见 [environment.md](./environment.md)）：alarmModelUrl / performanceQueryUrl 已确认走 8099；其余待服务端确认。

## 更新部署

```bash
scp <zip> root@10.10.6.53:/opt/temp/
cd /opt/temp && unzip -o <zip> && rm -rf /opt/iptv/web/pmmp/build && mv build /opt/iptv/web/pmmp/build
# 改后端指向：直接编辑 /opt/iptv/web/pmmp/build/environment.json，无需重新构建，不动 nginx
```
