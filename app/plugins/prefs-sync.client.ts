/**
 * Keeps look-and-feel preferences in step with the account when signed in.
 *
 *  - Once per browser tab, loads the account's saved preferences. If the
 *    account has none yet, saves this browser's instead.
 *  - After that, any change is saved to the account (debounced).
 *
 * Signed out, preferences live only in this browser's cookie.
 */
import type { Profile } from '#shared/types/profile'

export default defineNuxtPlugin((nuxtApp) => {
  const { loggedIn, user } = useUserSession()
  const prefs = usePreferences()
  const synced = usePrefsSynced()
  let timer: ReturnType<typeof setTimeout> | undefined

  const current = () => JSON.stringify(prefs.all.value)
  const pulledKey = () => `bd-prefs-pulled:${user.value?.id ?? ''}`

  async function save() {
    const snapshot = current()
    if (snapshot === synced.value) return
    try {
      await $fetch('/api/account/profile', { method: 'PATCH', body: { prefs: prefs.all.value } })
      synced.value = snapshot
    } catch { /* offline: the cookie still has it, and the next change tries again */ }
  }

  async function pull() {
    try {
      if (sessionStorage.getItem(pulledKey())) {
        synced.value ||= current()
        return
      }
    } catch { /* storage blocked: just pull */ }
    try {
      const profile = await $fetch<Profile>('/api/account/profile')
      if (profile.prefs) {
        synced.value = JSON.stringify(profile.prefs)
        prefs.replace(profile.prefs)
      } else {
        await save()
      }
      try { sessionStorage.setItem(pulledKey(), '1') } catch { /* ignore */ }
    } catch { /* try again on the next page load */ }
  }

  nuxtApp.hook('app:mounted', () => {
    if (loggedIn.value) pull()
    watch(loggedIn, (v) => { if (v) pull() })
    watch(current, () => {
      if (!loggedIn.value) return
      clearTimeout(timer)
      timer = setTimeout(save, 600)
    })
  })
})
