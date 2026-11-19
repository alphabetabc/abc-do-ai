# 部署与更新操作手册（10.10.6.53）

## 日常更新（最常用）

```bash
# 1. Jenkins 用 yarn build:standalone 构建，下载 zip 产物
# 2. 上传并替换（在本地终端执行，需输服务器密码）
scp <产物.zip> root@10.10.6.53:/opt/temp/
ssh root@10.10.6.53
# 3. 服务器上执行
cd /opt/temp && unzip -o <产物.zip>
rm -rf /opt/iptv/web/pmmp/build
mv build /opt/iptv/web/pmmp/build
# 4. 如需改后端地址：编辑 /opt/iptv/web/pmmp/build/environment.json（无需重构建）
# 5. 不需要动 nginx、不需要 reload
# 6. 验证
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:9016/pmmp/
```

注意：产物 zip 内是单个 `build` 目录；`/opt/temp` 需已存在（首次 mkdir -p /opt/temp）。

## 首次部署（已完成，2026-11-19，留档回访）

1. **构建**：仓库加 `yarn build:standalone`（scripts/build-standalone.js 设 `REACT_APP_CONFIG_LOCAL=true`），Jenkins 打包。
2. **归位产物**：scp → /opt/temp → `mkdir -p /opt/iptv/web/pmmp` → mv build。
3. **写 nginx 配置** `/opt/nginx/conf/pmmp.conf`（完整内容见 [nginx.md](./nginx.md)）。
4. **挂载主配置**：
   ```bash
   sed -i '22i\    include pmmp.conf;' /opt/nginx/conf/nginx.conf
   # ⚠️ 不能用 /include boco-iptv-res.conf;/ 模式匹配（实际行内多空格匹配不上）
   ```
5. **校验重载**：`/opt/nginx/sbin/nginx -t && /opt/nginx/sbin/nginx -s reload`。
6. **宿主接入**：建 15 条 iframe 菜单 + 授权（脚本见 [host-integration.md](./host-integration.md)）。
7. **验证**：9016 独立访问 200、environment.json 返回 200 json、静态资源 css/js 正确 content-type、宿主 iframe 打开渲染。

## 验证入口

- 独立访问：http://10.10.6.53:9016/pmmp/
- 宿主入口：http://10.10.6.53:20020/ 「性能监控」分组
- 服务器排查命令：见 [nginx.md](./nginx.md)「环境勘察命令」

## nginx 重启 / 重载（10.10.6.53）

nginx 可执行文件在 `/opt/nginx/sbin/nginx`（宿主机 PATH 里没有 nginx 命令），配置目录 `/opt/nginx/conf/`。

```bash
# 1. 校验配置（改动 pmmp.conf 或 nginx.conf 后先执行）
/opt/nginx/sbin/nginx -t

# 2a. 热重载（进程存活时，改配置后用这个，不断连接）
/opt/nginx/sbin/nginx -s reload

# 2b. 完整重启（进程存活时）
/opt/nginx/sbin/nginx -s stop && /opt/nginx/sbin/nginx

# 2c. 冷启动（进程不存在时，如机器重启后）
/opt/nginx/sbin/nginx
```

```bash
# 确认状态 / 排查
ps -ef | grep nginx | grep -v grep        # master + worker 进程在即正常
ss -tlnp | grep 9016                      # pmmp server 监听确认
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:9016/pmmp/   # 200 即恢复
```

注意：`nginx -s` 类命令依赖 pid 文件（/opt/nginx/logs/nginx.pid）；若 pid 文件丢失导致 -s 失败，直接 kill master 进程后执行冷启动。

## 回滚

旧产物被 `rm -rf` 前先备份：`cp -r /opt/iptv/web/pmmp/build /opt/temp/build.bak.<日期>`；回滚即反向 mv。首次部署无备份（初版）。
