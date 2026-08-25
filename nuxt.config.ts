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
    'workflow/nuxt',
    './modules/copy-workflow-bundles',
    '@nuxtjs/robots',
    '@nuxtjs/sitemap',
  ],

  aiElements: {
    defaultStyles: true,
  },

  build: {
    transpile: ['ai-elements-nuxt'],
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
        { name: 'description', content: 'Learn and use RAG (Retrieval-Augmented Generation) — from zero to production.' },
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
          href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap',
        },
      ],
    },
  },

  workflow: {
    typescriptPlugin: true,
  },

  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL ?? '',
    // Embedding
    embeddingProvider: process.env.EMBEDDING_PROVIDER ?? '',
    embeddingModel: process.env.EMBEDDING_MODEL ?? '',
    embeddingDimensions: Number(process.env.EMBEDDING_DIMENSIONS ?? 768),
    googleApiKey: process.env.GOOGLE_API_KEY ?? '',
    openaiApiKey: process.env.OPENAI_API_KEY ?? '',
    voyageApiKey: process.env.VOYAGE_API_KEY ?? '',
    // LLM
    llmProvider: process.env.LLM_PROVIDER ?? '',
    ollamaUrl: process.env.OLLAMA_URL ?? 'http://localhost:11434',
    ollamaApiKey: process.env.OLLAMA_API_KEY ?? '',
    ollamaModel: process.env.OLLAMA_MODEL ?? 'nomic-embed-text',
    ollamaLlmModel: process.env.OLLAMA_LLM_MODEL ?? 'tinyllama',
    ollamaChatTimeoutMs: Number(process.env.OLLAMA_CHAT_TIMEOUT_MS ?? 180000),
    ollamaPlannerTimeoutMs: Number(process.env.OLLAMA_PLANNER_TIMEOUT_MS ?? 60000),
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
    anthropicModel: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
    mistralApiKey: process.env.MISTRAL_API_KEY ?? '',
    mistralModel: process.env.MISTRAL_MODEL ?? 'mistral-medium-latest',
    openaiLlmModel: process.env.OPENAI_LLM_MODEL ?? 'gpt-4.1-mini',
    googleLlmModel: process.env.GOOGLE_LLM_MODEL ?? 'gemini-2.5-flash',
    // Step 3 - Embeddings
    embeddingBatchSize: Number(process.env.EMBEDDING_BATCH_SIZE ?? 32),
    embeddingCacheEnabled: process.env.EMBEDDING_CACHE_ENABLED !== 'false',
    embeddingCacheTtl: Number(process.env.EMBEDDING_CACHE_TTL ?? 3600),
    embeddingRetryAttempts: Number(process.env.EMBEDDING_RETRY_ATTEMPTS ?? 3),
    // Step 4 - Chunking
    chunkSize: Number(process.env.CHUNK_SIZE ?? 400),
    chunkOverlap: Number(process.env.CHUNK_OVERLAP ?? 60),
    chunkStrategy: process.env.CHUNK_STRATEGY ?? 'sentence-aware',
    maxDocSizeMb: Number(process.env.MAX_DOC_SIZE_MB ?? 10),
    allowedFormats: process.env.ALLOWED_FORMATS ?? 'pdf,md,txt,xls,xlsx',
    // Step 5 - Search
    searchTopK: Number(process.env.SEARCH_TOP_K ?? 5),
    searchThreshold: Number(process.env.SEARCH_THRESHOLD ?? 0.2),
    searchHybrid: process.env.SEARCH_HYBRID === 'true',
    searchRerank: process.env.SEARCH_RERANK === 'true',
    searchHyde: process.env.SEARCH_HYDE !== 'false',
    conversationTitleLlm: process.env.CONVERSATION_TITLE_LLM !== 'false',
    // Step 6 - RAG
    ragTemperature: Number(process.env.RAG_TEMPERATURE ?? 0.3),
    ragCitations: process.env.RAG_CITATIONS !== 'false',
    ragMaxContext: Number(process.env.RAG_MAX_CONTEXT ?? 4096),
    ragResponseLang: process.env.RAG_RESPONSE_LANG ?? 'auto',
    ragSystemPrompt: process.env.RAG_SYSTEM_PROMPT ?? '',
    agentMaxSteps: Number(process.env.AGENT_MAX_STEPS ?? 5),
    // App
    memoryScope: process.env.MEMORY_SCOPE ?? 'local_per_user',
    memoryProactive: process.env.MEMORY_PROACTIVE === 'true',
    adminApiKey: process.env.ADMIN_API_KEY ?? '',
    public: {
      /** Published docs / marketing (VitePress on GitHub Pages, etc.) — header link in the Nuxt app */
      docsSiteUrl:
        process.env.NUXT_PUBLIC_DOCS_SITE_URL?.trim()
        || 'https://albegosu.github.io/hypar/',
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },
})
