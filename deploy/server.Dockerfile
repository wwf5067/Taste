# 发布后端容器：含 Node + rsync（构建后同步 dist 用）
# 源码仓库通过卷挂载进来（/opt/taste/repo），不打进镜像，便于就地构建与内容持久化。
FROM node:20-alpine

# rsync 用于把构建产物原子同步到 nginx 目录；bash 给 entrypoint 用
RUN apk add --no-cache rsync bash

WORKDIR /app

# 只装后端自身依赖（express/multer 等）
COPY server/package.json server/package-lock.json* ./
RUN npm install --omit=dev

# 后端代码与后台前端
COPY server/ ./

# 启动脚本：确保挂载进来的 repo 已安装 vitepress 依赖，再起服务
COPY deploy/server-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENV NODE_ENV=production
EXPOSE 8092

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
