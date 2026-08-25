import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'hypar',
  description: 'An AI-native wiki that thinks with you, not for you.',
  base: '/hypar/',

  head: [
    ['meta', { name: 'og:title', content: 'hypar' }],
    ['meta', { name: 'og:description', content: 'An AI-native wiki that thinks with you, not for you.' }],
  ],

  themeConfig: {
    logo: null,

    nav: [
      { text: 'Concepts', link: '/concepts/embryo' },
      { text: 'Architecture', link: '/architecture' },
      { text: 'Experiments', link: '/experiments/' },
      {
        text: 'ai-elements-nuxt',
        link: 'https://github.com/albegosu/ai-elements-nuxt',
        target: '_blank',
      },
      { text: 'GitHub', link: 'https://github.com/albegosu/hypar', target: '_blank' },
    ],

    sidebar: [
      {
        text: 'Concepts',
        items: [
          { text: 'The Embryo', link: '/concepts/embryo' },
          { text: 'The Lifecycle', link: '/concepts/lifecycle' },
          { text: 'The Agent', link: '/concepts/agent' },
          { text: 'Fossils & Memory', link: '/concepts/fossils' },
        ],
      },
      {
        text: 'Architecture',
        items: [
          { text: 'Overview', link: '/architecture' },
          { text: 'Open Questions', link: '/open-questions' },
        ],
      },
      {
        text: 'Research',
        items: [
          { text: 'Experiments', link: '/experiments/' },
        ],
      },
      {
        text: 'Project',
        items: [
          { text: 'History', link: '/history' },
          { text: 'Contributing', link: '/contributing' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/albegosu/hypar' },
    ],

    footer: {
      message: 'MIT License',
      copyright: 'A Resizes lab project',
    },

    search: {
      provider: 'local',
    },
  },
})
