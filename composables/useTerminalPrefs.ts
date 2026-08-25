import { useI18n } from 'vue-i18n'

type Theme = 'dark' | 'light'
type Locale = 'en' | 'es'

/** Must match `LOCALE_COOKIE` in `plugins/i18n.ts` */
const LOCALE_KEY = 'rag-ui-locale'
const WIZARD_LOCALE_KEY = 'rag-wizard-locale'

/** Legacy key before theme was wired to @nuxtjs/color-mode */
const LEGACY_THEME_KEY = 'rag-ui-theme'

let initialized = false

export function useTerminalPrefs() {
  const colorMode = useColorMode()
  const { locale } = useI18n({ useScope: 'global' })

  const localeCookie = useCookie<Locale | null>(LOCALE_KEY, {
    default: () => null,
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })

  const theme = computed<Theme>(() => (colorMode.value === 'light' ? 'light' : 'dark'))

  if (!initialized && import.meta.client) {
    const legacy = localStorage.getItem(LEGACY_THEME_KEY)
    if (legacy === 'light' || legacy === 'dark') {
      colorMode.preference = legacy
      localStorage.removeItem(LEGACY_THEME_KEY)
    }

    initialized = true
  }

  function toggleTheme() {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
  }

  function setLocale(value: Locale) {
    locale.value = value
    localeCookie.value = value
    if (import.meta.client) {
      document.documentElement.lang = value
      try {
        localStorage.setItem(LOCALE_KEY, value)
        localStorage.setItem(WIZARD_LOCALE_KEY, value)
      } catch {
        /* private mode */
      }
    }
  }

  return {
    theme,
    locale: locale as Ref<Locale>,
    toggleTheme,
    setLocale,
  }
}
