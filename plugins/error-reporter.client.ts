export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.errorHandler = (err, _instance, info) => {
    const error = err instanceof Error ? err : new Error(String(err))
    $fetch('/api/client-errors', {
      method: 'POST',
      body: {
        message: `[${info}] ${error.message}`,
        stack: error.stack?.slice(0, 4000),
        url: window.location.href,
      },
    }).catch(() => {})
  }
})
