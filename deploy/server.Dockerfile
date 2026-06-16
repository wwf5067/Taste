# 发布后端容器：含 Node + rsync（构建后同步 dist 用）
# 源码仓库通过卷挂载进来（/opt/taste/repo），不打进镜像，便于就地构建与内容持久化。
FROM node:20-alpine

# rsync 用于把构建产物原子同步到 nginx 目录
RUN apk add --no-cache rsync

WORKDIR /app

# 只装后端自身依赖（express/multer 等）
COPY server/package.json server/package-lock.json* ./
RUN npm install --omit=dev

# 后端代码与后台前端
COPY server/ ./

ENV NODE_ENV=production
EXPOSE 8092

CMD ["node", "index.mjs"]
