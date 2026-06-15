# Taste · 兴趣生活知识库

一个涵盖衣食住行的个人兴趣知识库，用来记录健康生活与兴趣爱好的成长。基于 [VitePress](https://vitepress.dev/) 构建。

## 板块

- **健康生活** `docs/health/` — 饮食、运动、作息、身心
- **香水研究** `docs/perfume/` — 香调、香水笔记、评测
- **摄影学习** `docs/photography/` — 作品、技法、器材
- **情感分析** `docs/emotion/` — 观察、关系、复盘

后续可扩展「衣 / 食 / 住 / 行」更多方向。

## 怎么写笔记

直接在对应板块目录下新建 Markdown 文件即可，例如：

```
docs/health/2026-睡眠改善.md
docs/perfume/某款香水-试香笔记.md
```

新建后，如需让文章出现在左侧侧边栏，编辑 `docs/.vitepress/config.mjs` 里对应板块的 `sidebar` 配置，加一行链接即可。站点内置全文搜索，不配也能搜到。

## 本地预览与构建

```bash
npm install        # 首次安装依赖
npm run dev        # 本地开发预览（带热更新）
npm run build      # 构建静态站点到 docs/.vitepress/dist
npm run preview    # 预览构建产物
```

## 部署

`npm run build` 产物在 `docs/.vitepress/dist/`，可直接部署到 GitHub Pages、Vercel、Netlify 等静态托管平台。
