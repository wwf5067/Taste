#!/usr/bin/env bash
# backend 容器入口：确保挂载进来的站点源码（REPO_DIR）已安装构建依赖（含 vitepress），
# 再启动发布后端。repo 的 node_modules 不打进镜像、也不入仓库，故首启时按需安装。
set -e

REPO_DIR="${REPO_DIR:-/opt/taste/repo}"

if [ ! -d "$REPO_DIR/node_modules/vitepress" ]; then
  echo "==> 安装站点构建依赖（含 devDependencies/vitepress）于 $REPO_DIR"
  # 注意：vitepress 在 repo 的 devDependencies 里，必须带 dev 依赖安装
  ( cd "$REPO_DIR" && npm install --include=dev )
else
  echo "==> 站点依赖已就位，跳过安装"
fi

echo "==> 启动发布后端"
exec node /app/index.mjs
