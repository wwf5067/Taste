import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: '睿清斋',
  description: '一个涵盖衣食住行的个人兴趣知识库',
  lastUpdated: true,
  cleanUrls: true,

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '养息', link: '/health/' },
      { text: '闻香', link: '/perfume/' },
      { text: '取景', link: '/photography/' },
      { text: '观心', link: '/emotion/' },
    ],

    sidebar: {
      '/health/': [
        {
          text: '养息',
          items: [
            { text: '概览', link: '/health/' },
            { text: '改善睡眠的实践记录', link: '/health/2026-改善睡眠' },
          ],
        },
      ],
      '/perfume/': [
        {
          text: '闻香',
          items: [
            { text: '概览', link: '/perfume/' },
          ],
        },
      ],
      '/photography/': [
        {
          text: '取景',
          items: [
            { text: '概览', link: '/photography/' },
          ],
        },
      ],
      '/emotion/': [
        {
          text: '观心',
          items: [
            { text: '概览', link: '/emotion/' },
          ],
        },
      ],
    },

    outline: { label: '本页目录', level: [2, 3] },
    docFooter: { prev: '上一篇', next: '下一篇' },
    lastUpdatedText: '最近更新',
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '外观',

    search: {
      provider: 'local',
    },
  },
})
