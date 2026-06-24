import { defineConfig } from 'vitepress'
import { DEFAULT_DEMO_APP } from './demo-app-url'

const demoAppUrl = process.env.VITEPRESS_DEMO_URL?.trim() || DEFAULT_DEMO_APP
const demoUrlFromEnv = process.env.VITEPRESS_DEMO_URL?.trim() ?? ''

/** GitHub Pages project site: set in CI (e.g. `/hypar/`). Local dev: omit or `/`. */
function vitepressBase(): string {
  const raw = process.env.VITEPRESS_BASE?.trim()
  if (!raw || raw === '/') return '/'
  const withLeading = raw.startsWith('/') ? raw : `/${raw}`
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`
}

const siteBase = vitepressBase()

const enNav = [
  { text: 'Guide', link: '/guide/getting-started' },
  { text: 'Features', link: '/features/rag-pipeline' },
  { text: 'API', link: '/api/reference' },
  { text: 'Architecture', link: '/architecture' },
  { text: 'Roadmap', link: '/roadmap' },
  { text: 'Chat app', link: demoAppUrl, target: '_blank', rel: 'noopener noreferrer' },
  { text: 'GitHub', link: 'https://github.com/albegosu/hypar', target: '_blank' },
]

const esNav = [
  { text: 'Guía', link: '/es/guide/getting-started' },
  { text: 'Features', link: '/features/rag-pipeline' },
  { text: 'API', link: '/api/reference' },
  { text: 'Arquitectura', link: '/architecture' },
  { text: 'Roadmap', link: '/roadmap' },
  { text: 'Chat app', link: demoAppUrl, target: '_blank', rel: 'noopener noreferrer' },
  { text: 'GitHub', link: 'https://github.com/albegosu/hypar', target: '_blank' },
]

const enSidebar = [
  {
    text: 'Guide',
    items: [
      { text: 'Getting Started', link: '/guide/getting-started' },
      { text: 'Docker (development)', link: '/guide/docker' },
      { text: 'Production Deployment', link: '/guide/production' },
      { text: 'Environment Variables', link: '/guide/env' },
      { text: 'Glossary', link: '/guide/glossary' },
    ],
  },
  {
    text: 'Users & access',
    items: [
      { text: 'Authentication', link: '/guide/auth' },
      { text: 'Workspaces', link: '/guide/workspaces' },
      { text: 'Roles & permissions', link: '/guide/roles-and-permissions' },
      { text: 'Settings', link: '/guide/settings' },
      { text: 'Admin panel', link: '/guide/admin-panel' },
    ],
  },
  {
    text: 'Features',
    items: [
      { text: 'RAG Pipeline', link: '/features/rag-pipeline' },
      { text: 'Hybrid Search & HyDE', link: '/features/search' },
      { text: 'Memory & Commands', link: '/features/memory' },
    ],
  },
  {
    text: 'Reference',
    items: [
      { text: 'API Reference', link: '/api/reference' },
      { text: 'Architecture', link: '/architecture' },
      { text: 'Roadmap', link: '/roadmap' },
      { text: 'Product vision', link: '/product/vision' },
      { text: 'Contributing', link: '/contributing' },
    ],
  },
  {
    text: 'Design notes',
    items: [
      { text: 'ADR: Monorepo unification', link: '/decisions/monorepo-unification' },
      { text: 'RFC: Auth phases (2026)', link: '/rfcs/2026-auth-phases' },
      { text: 'Learning Quest (legacy)', link: '/features/learning-quest' },
    ],
  },
]

const esSidebar = [
  {
    text: 'Guía',
    items: [
      { text: 'Primeros pasos', link: '/es/guide/getting-started' },
      { text: 'Docker (desarrollo)', link: '/es/guide/docker' },
      { text: 'Despliegue en producción', link: '/es/guide/production' },
      { text: 'Variables de entorno', link: '/es/guide/env' },
      { text: 'Glosario', link: '/guide/glossary' },
    ],
  },
  {
    text: 'Usuarios y acceso',
    items: [
      { text: 'Autenticación', link: '/es/guide/auth' },
      { text: 'Workspaces', link: '/guide/workspaces' },
      { text: 'Roles y permisos', link: '/guide/roles-and-permissions' },
      { text: 'Settings', link: '/guide/settings' },
      { text: 'Panel de admin', link: '/guide/admin-panel' },
    ],
  },
  {
    text: 'Features',
    items: [
      { text: 'Pipeline RAG', link: '/features/rag-pipeline' },
      { text: 'Búsqueda híbrida y HyDE', link: '/features/search' },
      { text: 'Memoria y comandos', link: '/features/memory' },
    ],
  },
  {
    text: 'Referencia',
    items: [
      { text: 'Referencia API', link: '/api/reference' },
      { text: 'Arquitectura', link: '/architecture' },
      { text: 'Roadmap', link: '/roadmap' },
      { text: 'Visión de producto', link: '/product/vision' },
      { text: 'Contribuir', link: '/contributing' },
    ],
  },
  {
    text: 'Notas de diseño',
    items: [
      { text: 'ADR: Unificación de monorepo', link: '/decisions/monorepo-unification' },
      { text: 'RFC: Fases de auth (2026)', link: '/rfcs/2026-auth-phases' },
      { text: 'Learning Quest (legacy)', link: '/features/learning-quest' },
    ],
  },
]

export default defineConfig({
  title: 'hypar',
  description: 'Production-ready Retrieval-Augmented Generation app built with Nuxt 3, pgvector and the Vercel AI SDK.',
  base: siteBase,

  vite: {
    define: {
      'import.meta.env.VITEPRESS_DEMO_URL': JSON.stringify(demoUrlFromEnv),
    },
  },

  /** Localhost and legacy archive URLs are intentional in prose. */
  ignoreDeadLinks: [/^http:\/\/localhost/, /^http:\/\/127\.0\.0\.1/],

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${siteBase}favicon.svg` }],
    ['link', { rel: 'icon', type: 'image/x-icon', href: `${siteBase}favicon.ico` }],
    ['link', { rel: 'apple-touch-icon', href: `${siteBase}apple-touch-icon.png` }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,600;0,700;1,550&family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:ital,wght@0,400;0,500;1,400&display=swap',
      },
    ],
    ['link', { rel: 'preconnect', href: 'https://api.fontshare.com' }],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://api.fontshare.com/v2/css?f[]=switzer@400,500,600,700&display=swap',
      },
    ],
  ],

  locales: {
    root: {
      label: 'English',
      lang: 'en-US',
      themeConfig: {
        nav: enNav,
        sidebar: enSidebar,
      },
    },
    es: {
      label: 'Español',
      lang: 'es',
      link: '/es/',
      themeConfig: {
        nav: esNav,
        sidebar: esSidebar,
      },
    },
  },

  themeConfig: {
    socialLinks: [
      {
        icon: {
          /* VPSocialLink.css sets `fill: currentColor` on svg — stroke-only icons become a solid square. */
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill:none;stroke:currentColor;stroke-width:1.75;stroke-linecap:round;stroke-linejoin:round" aria-hidden="true"><path d="M4 5h16"/><path d="M4 5v14h16V5"/><path d="M8 9l2 2-2 2"/><path d="M12 13h4"/></svg>',
        },
        link: demoAppUrl,
        ariaLabel: 'Open hosted hypar chat app',
      },
      { icon: 'github', link: 'https://github.com/albegosu/hypar' },
    ],

    search: { provider: 'local' },

    footer: {
      copyright:
        '<a class="vpf-brand" href="https://resiz.es" target="_blank" rel="noopener" aria-label="Resizes">'
        + `<img class="vpf-brand-img vpf-brand-img--light" src="${siteBase}logo-resizes-black.png" alt="Resizes" loading="lazy" />`
        + `<img class="vpf-brand-img vpf-brand-img--dark" src="${siteBase}logo-resizes.png" alt="Resizes" loading="lazy" />`
        + '</a>'
        + '<span class="vpf-key">lab_project</span>',
    },

    editLink: {
      pattern: 'https://github.com/albegosu/hypar/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },
})
