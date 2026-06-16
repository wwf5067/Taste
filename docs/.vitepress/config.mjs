import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: '睿清斋',
  description: '一个涵盖衣食住行的个人兴趣知识库',
  // 内容真相源已迁至服务器（非 git 仓库），lastUpdated 依赖 git 会导致构建失败，关闭。
  lastUpdated: false,
  cleanUrls: true,

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '养息', link: '/health/' },
      { text: '闻香', link: '/perfume/' },
      { text: '取景', link: '/photography/' },
      { text: '观心', link: '/emotion/' },
      { text: '惜物', link: '/keepsake/' },
      { text: '裁衣', link: '/attire/' },
      { text: '豢趣', link: '/pets/' },
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
      '/keepsake/': [
        {
          text: '惜物',
          items: [
            { text: '概览', link: '/keepsake/' },
          ],
        },
      ],
      '/attire/': [
        {
          text: '裁衣',
          items: [
            { text: '概览', link: '/attire/' },
          ],
        },
      ],
      '/pets/': [
        {
          text: '豢趣',
          items: [
            { text: '概览', link: '/pets/' },
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
