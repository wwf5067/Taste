#!/usr/bin/env bash
# Taste Lighthouse 服务器一次性初始化脚本（与 brandshow 同一台机器）
#
# 用法（在 Lighthouse 服务器上）:
#   scp deploy/bootstrap.sh ubuntu@<IP>:/tmp/
#   ssh ubuntu@<IP> 'bash /tmp/bootstrap.sh'
#
# 说明：
#   - Taste 是纯静态站点，无数据库、无后端
#   - 对外端口 8091（80=newsfeed, 8090=brandshow）
#   - 实际的容器启动由 GitHub Actions 部署时完成，本脚本只准备目录和防火墙

set -euo pipefail

APP_DIR=/opt/taste
PORT=8091

echo "==> Preparing $APP_DIR"
sudo mkdir -p "$APP_DIR/web-dist"
sudo chown -R "$USER":"$USER" "$APP_DIR"

echo "==> Opening firewall port $PORT..."
sudo ufw allow ${PORT}/tcp || true

echo ""
echo "==> Done! 接下来："
echo "   1) 在 GitHub 仓库 (wwf5067/Taste) 配置 Secrets（与 brandshow 相同值）:"
echo "      SSH_HOST=$( curl -s ifconfig.me 2>/dev/null || echo '<服务器IP>' )"
echo "      SSH_USER=$USER"
echo "      SSH_PORT=22"
echo "      SSH_KEY=<你的 ed25519 私钥>"
echo "   2) push main 分支触发自动部署"
echo "   3) 部署后访问: http://<服务器IP>:${PORT}"
