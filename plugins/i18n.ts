import { createI18n } from 'vue-i18n'
import en from '~/i18n/locales/en.json'
import es from '~/i18n/locales/es.json'

/** Must match `LOCALE_KEY` in `composables/useTerminalPrefs.ts` */
const LOCALE_COOKIE = 'hypar-locale'
const LOCALE_STORAGE = 'hypar-locale'

const LEGACY_KEYS = ['rag-ui-locale', 'rag-wizard-locale']

type Locale = 'en' | 'es'

function readLocaleFromStorage(): Locale | null {
  if (!import.meta.client) return null
  const v = localStorage.getItem(LOCALE_STORAGE)
  if (v === 'es' || v === 'en') return v
  for (const k of LEGACY_KEYS) {
    const legacy = localStorage.getItem(k)
    if (legacy === 'es' || legacy === 'en') return legacy
  }
  return null
}

export default defineNuxtPlugin((nuxtApp) => {
  const localeCookie = useCookie<Locale | null>(LOCALE_COOKIE, {
    default: () => null,
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })

  let initial: Locale = 'en'
  if (localeCookie.value === 'es' || localeCookie.value === 'en') {
    initial = localeCookie.value
  } else if (import.meta.client) {
    const stored = readLocaleFromStorage()
    if (stored) {
      initial = stored
      localeCookie.value = stored
    } else {
      initial = 'en'
    }
  }

  const i18n = createI18n({
    legacy: false,
    locale: initial,
    fallbackLocale: 'en',
    messages: { en, es },
  })

  nuxtApp.vueApp.use(i18n)

  if (import.meta.client) {
    document.documentElement.lang = initial
    try {
      localStorage.setItem(LOCALE_STORAGE, initial)
      for (const k of LEGACY_KEYS) localStorage.removeItem(k)
    } catch {
      /* private mode / blocked */
    }
  }
})
