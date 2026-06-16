#!/usr/bin/env bash
# Taste Lighthouse 服务器一次性初始化脚本
#
# 用法（在 Lighthouse 服务器上）:
#   scp deploy/bootstrap.sh ubuntu@<IP>:/tmp/
#   ssh ubuntu@<IP> 'bash /tmp/bootstrap.sh'
#
# 架构（路 B：以服务器为内容唯一真相源，不依赖 GitHub）：
#   - /opt/taste/repo      站点源码仓库（含 docs/，后端在此就地构建）
#   - /opt/taste/web-dist  构建产物（nginx 容器只读挂载）
#   - /opt/taste/certs     自签 TLS 证书（保护后台口令/上传）
#   - /opt/taste/backups   docs 目录定期备份（无 git 后的兜底）
#
#   公开站点：HTTP  端口 8091
#   作者后台：HTTPS 端口 8443（自签证书，浏览器首次会提示不安全，点继续即可）

set -euo pipefail

APP_DIR=/opt/taste
SITE_PORT=8091
ADMIN_PORT=8443
REPO_URL="${REPO_URL:-https://github.com/wwf5067/Taste.git}"

echo "==> 准备目录 $APP_DIR"
sudo mkdir -p "$APP_DIR"/{web-dist,certs,backups}
sudo chown -R "$USER":"$USER" "$APP_DIR"

# ── 源码仓库（内容真相源）──
if [ ! -d "$APP_DIR/repo/.git" ]; then
  echo "==> 克隆源码到 $APP_DIR/repo"
  git clone "$REPO_URL" "$APP_DIR/repo"
else
  echo "==> $APP_DIR/repo 已存在，跳过克隆"
fi

echo "==> 安装站点依赖（npm ci）"
cd "$APP_DIR/repo" && npm ci

# ── 自签 TLS 证书（保护后台口令传输）──
if [ ! -f "$APP_DIR/certs/selfsigned.crt" ]; then
  echo "==> 生成自签证书"
  openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
    -keyout "$APP_DIR/certs/selfsigned.key" \
    -out "$APP_DIR/certs/selfsigned.crt" \
    -subj "/CN=taste-admin"
fi

# ── 后端环境变量文件（口令/密钥，手动填）──
if [ ! -f "$APP_DIR/server.env" ]; then
  echo "==> 生成 $APP_DIR/server.env 模板，请编辑填入真实口令/密钥"
  cat > "$APP_DIR/server.env" <<EOF
PUBLISH_PASSWORD=请改成强口令
SESSION_SECRET=$(openssl rand -hex 32)
REPO_DIR=/opt/taste/repo
WEB_DIST=/opt/taste/web-dist
SECTIONS=health,perfume,photography,emotion
PORT=8092
SESSION_HOURS=12
MAX_IMAGE_MB=8
EOF
  chmod 600 "$APP_DIR/server.env"
fi

# ── 防火墙 ──
echo "==> 开放端口 $SITE_PORT(站点) / $ADMIN_PORT(后台)"
sudo ufw allow ${SITE_PORT}/tcp || true
sudo ufw allow ${ADMIN_PORT}/tcp || true

# ── 定期备份 docs（无 git 版本控制后的兜底）──
echo "==> 安装每日备份 cron"
CRON_LINE="0 3 * * * tar -czf $APP_DIR/backups/docs-\$(date +\\%Y\\%m\\%d).tar.gz -C $APP_DIR/repo docs && find $APP_DIR/backups -name 'docs-*.tar.gz' -mtime +30 -delete"
( crontab -l 2>/dev/null | grep -v "$APP_DIR/backups"; echo "$CRON_LINE" ) | crontab -

echo ""
echo "==> 完成！接下来："
echo "   1) 编辑 $APP_DIR/server.env，把 PUBLISH_PASSWORD 改成强口令"
echo "   2) 用 docker compose 启动后端+nginx（见 deploy/server-compose.yml）"
echo "   3) 站点：http://<服务器IP>:${SITE_PORT}"
echo "      后台：https://<服务器IP>:${ADMIN_PORT}/admin/ （自签证书，首次点“继续访问”）"
