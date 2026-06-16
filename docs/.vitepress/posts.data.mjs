// 构建时扫描各板块目录下的文章（排除 index.md），提取 title/date/url，按日期倒序。
// 板块概览页通过 <PostList section="xxx" /> 消费这份数据，实现"发文自动出现在列表"。
import { createContentLoader } from 'vitepress'

export default createContentLoader('**/*.md', {
  excerpt: false,
  transform(raw) {
    return raw
      .filter((p) => {
        // 只要各板块目录下的文章页：/section/xxx，排除站点首页与各板块 index
        const parts = p.url.split('/').filter(Boolean)
        return parts.length === 2 // [section, slug]
      })
      .map((p) => {
        const parts = p.url.split('/').filter(Boolean)
        const fm = p.frontmatter || {}
        return {
          section: parts[0],
          url: p.url,
          title: fm.title || parts[1],
          date: fm.date || '',
          tags: fm.tags || [],
        }
      })
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
  },
})
