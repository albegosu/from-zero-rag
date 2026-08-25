const PUBLIC_ROUTES = ['/auth/signin', '/auth/signup']

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  if (PUBLIC_ROUTES.includes(to.path)) return

  // useSession() uses onMounted internally and won't fetch in middleware context.
  // Directly call the session endpoint instead so we always get the real answer.
  try {
    const session = await $fetch<{ user?: unknown }>('/api/auth/get-session')
    if (session?.user) return
  } catch {
    // network error — fall through to redirect
  }

  return navigateTo('/auth/signin')
})
