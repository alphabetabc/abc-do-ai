# 6.53 nginx 托管配置（9016）

## 实际生效配置（/opt/nginx/conf/pmmp.conf）

```nginx
# oss-pmmp standalone（参考 2.8 的 9016 server；6.53 nginx 无 PCRE/rewrite 模块，已简化）
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

主配置挂载：`/opt/nginx/conf/nginx.conf` http 块第 22 行 `include pmmp.conf;`。

## 与 2.8 参考架构的差异

2.8 是「9001 框架入口 + `/pmmp/` 反代到 9016 + /configmanage 反代到 7003」；6.53 无框架、无 configmanage，直接 9016 对外，配置走本地 environment.json。且 6.53 nginx 编译无 PCRE/rewrite 模块，正则 location 与 `if` 均不可用。

## 部署后验证

```bash
/opt/nginx/sbin/nginx -t && /opt/nginx/sbin/nginx -s reload
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:9016/                              # 200
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:9016/pmmp/environment.json   # 200 json
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:9016/pmmp/performance-rules        # 200（SPA fallback）
```

## 环境勘察命令（回访/复检用）

```bash
# nginx 进程定位（宿主机无 PATH 时）
ps -ef | grep nginx | grep -v grep
readlink -f /proc/<master-pid>/exe    # → /opt/nginx/sbin/nginx

# 监听端口 / docker 容器
ss -tlnp
docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Image}}"

# 配置检索
grep -n "listen\|root\|include\|server_name" /opt/nginx/conf/nginx.conf | head -40

# 后端可达性探测
for p in 10.10.6.53:8099 10.10.1.26:8099 10.10.1.170:8089 10.10.1.170:8099 \
         10.10.2.22:8085 10.10.2.8:7001 10.10.2.8:7011 10.10.5.98:8762; do
  timeout 3 bash -c "echo > /dev/tcp/${p%:*}/${p#*:}" 2>/dev/null && echo "OK  $p" || echo "FAIL $p"
done
```

## 踩坑记录

1. nginx.conf 内 `include boco-iptv-res.conf;` 行内多空格，sed 模式匹配不上，用行号插入：`sed -i '22i\    include pmmp.conf;'`。
2. 产物 zip 内是单个 build 目录，目标父目录需先 `mkdir -p /opt/iptv/web/pmmp`；scp 目标 /opt/temp 需先存在。
