// Pages that need an account: add definePageMeta({ middleware: 'auth' })
export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()
  if (!loggedIn.value) {
    return navigateTo({ path: '/sign-in', query: { next: to.fullPath } })
  }
})
