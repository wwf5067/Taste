import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'Taste',
  description: '一个涵盖衣食住行的个人兴趣知识库',
  lastUpdated: true,
  cleanUrls: true,

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '健康生活', link: '/health/' },
      { text: '香水研究', link: '/perfume/' },
      { text: '摄影学习', link: '/photography/' },
      { text: '情感分析', link: '/emotion/' },
    ],

    sidebar: {
      '/health/': [
        {
          text: '健康生活',
          items: [
            { text: '概览', link: '/health/' },
            { text: '改善睡眠的实践记录', link: '/health/2026-改善睡眠' },
          ],
        },
      ],
      '/perfume/': [
        {
          text: '香水研究',
          items: [
            { text: '概览', link: '/perfume/' },
          ],
        },
      ],
      '/photography/': [
        {
          text: '摄影学习',
          items: [
            { text: '概览', link: '/photography/' },
          ],
        },
      ],
      '/emotion/': [
        {
          text: '情感分析',
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
