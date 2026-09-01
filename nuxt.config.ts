import 'dotenv/config'

export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },

  experimental: {
    appManifest: false,
  },

  modules: [
    'ai-elements-nuxt',
    '@nuxt/ui',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/robots',
    '@nuxtjs/sitemap',
  ],

  aiElements: {
    defaultStyles: true,
  },

  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'light',
  },

  robots: {
    disallow: ['/'],
    allow: ['/auth/signin', '/auth/signup'],
  },

  sitemap: {
    urls: ['/auth/signin', '/auth/signup'],
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'hypar',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'hypar — AI interaction research lab.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'hypar' },
        { property: 'og:image', content: '/hypar-chat-dark.png' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap',
        },
      ],
    },
  },

  runtimeConfig: {
    llmProvider: process.env.LLM_PROVIDER ?? '',
    ollamaUrl: process.env.OLLAMA_URL ?? 'http://localhost:11434',
    ollamaApiKey: process.env.OLLAMA_API_KEY ?? '',
    ollamaLlmModel: process.env.OLLAMA_LLM_MODEL ?? 'llama3.2',
    ollamaChatTimeoutMs: Number(process.env.OLLAMA_CHAT_TIMEOUT_MS ?? 180000),
    public: {
      /** Published docs / marketing (VitePress on GitHub Pages, etc.) — header link in the Nuxt app */
      docsSiteUrl:
        process.env.NUXT_PUBLIC_DOCS_SITE_URL?.trim()
        || 'https://albegosu.github.io/hypar/',
      ollamaLlmModel: process.env.OLLAMA_LLM_MODEL ?? 'llama3.2',
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },
})
