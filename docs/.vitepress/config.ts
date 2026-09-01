import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'hypar',
  description: 'AI interaction research lab — exploring how humans and agents collaborate on knowledge.',
  base: '/hypar/',
  ignoreDeadLinks: [
    /^https?:\/\/localhost/,
  ],

  head: [
    ['meta', { name: 'og:title', content: 'hypar' }],
    ['meta', { name: 'og:description', content: 'AI interaction research lab — exploring how humans and agents collaborate on knowledge.' }],
  ],

  themeConfig: {
    logo: null,

    nav: [
      { text: 'Direction', link: '/direction' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Concepts', link: '/concepts/embryo' },
      { text: 'Architecture', link: '/architecture' },
      { text: 'Experiments', link: '/experiments/' },
      { text: 'Decisions', link: '/decisions/' },
      {
        text: 'ai-elements-nuxt',
        link: 'https://github.com/albegosu/ai-elements-nuxt',
        target: '_blank',
      },
      { text: 'GitHub', link: 'https://github.com/albegosu/hypar', target: '_blank' },
    ],

    sidebar: [
      {
        text: 'Lab',
        items: [
          { text: 'Direction', link: '/direction' },
          { text: 'Open Questions', link: '/open-questions' },
          { text: 'Decisions', link: '/decisions/' },
        ],
      },
      {
        text: 'Guide',
        items: [
          { text: 'Getting started', link: '/guide/getting-started' },
          { text: 'Authentication', link: '/guide/auth' },
          { text: 'Roles', link: '/guide/roles-and-permissions' },
          { text: 'Environment', link: '/guide/env' },
          { text: 'Docker', link: '/guide/docker' },
          { text: 'Production', link: '/guide/production' },
        ],
      },
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
        ],
      },
      {
        text: 'Research',
        items: [
          { text: 'Experiments', link: '/experiments/' },
          { text: 'Method as process', link: '/experiments/method-as-process' },
          { text: 'ai-elements surfaces', link: '/experiments/ai-elements-surfaces' },
        ],
      },
      {
        text: 'Decisions',
        items: [
          { text: 'Index', link: '/decisions/' },
          { text: '0001 Single Nuxt app', link: '/decisions/0001-single-nuxt-app' },
          { text: '0002 Agent one question', link: '/decisions/0002-agent-one-question' },
          { text: '0003 No-delete fossils', link: '/decisions/0003-no-delete-fossils' },
          { text: '0004 Glass visual language', link: '/decisions/0004-glass-visual-language' },
          { text: 'Monorepo unification (historical)', link: '/decisions/monorepo-unification' },
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
