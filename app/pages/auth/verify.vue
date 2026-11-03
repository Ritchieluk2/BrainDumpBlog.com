<script setup lang="ts">
/**
 * Landing page for the emailed link. Signing in happens when the button is
 * pressed (not on page load), so email scanners that open links can't use them up.
 */
import type { Profile } from '#shared/types/profile'

useHead({ title: 'Finish signing in' })

const route = useRoute()
const { fetch: refreshSession, user } = useUserSession()
const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))
const status = ref<'ready' | 'working' | 'error'>(token.value ? 'ready' : 'error')
const error = ref(token.value ? '' : 'This sign-in link is missing its code. Request a new one.')

async function finish() {
  status.value = 'working'
  try {
    const res = await $fetch<{ ok: true; isNew: boolean; profile: Profile }>('/api/auth/verify', { method: 'POST', body: { token: token.value } })
    await refreshSession()
    if (user.value) applySignedInProfile(user.value.id, res.profile)

    // Where to end up: a dump written before signing in, or the page they came from.
    let next = '/journal'
    const pending = readPending()
    if (pending) {
      const dump = await $fetch('/api/dumps', { method: 'POST', body: pending })
      clearPending()
      next = `/journal/${dump.id}?fresh=1`
    } else {
      try {
        next = safeNextPath(localStorage.getItem('bd-next')) ?? next
        localStorage.removeItem('bd-next')
      } catch { /* ignore */ }
    }

    // New here: the welcome comes first, then on to `next`.
    if (!res.profile.onboarded) {
      return navigateTo({ path: '/welcome', query: { next } }, { replace: true })
    }
    return navigateTo(next, { replace: true })
  } catch (err: unknown) {
    error.value = (err as { statusMessage?: string }).statusMessage ?? 'Something went wrong. Please request a new link.'
    status.value = 'error'
  }
}
</script>

<template>
  <div class="verify bd-container">
    <div class="verify__card bd-card">
      <BdLogo size="sm" mark-only />
      <template v-if="status !== 'error'">
        <h1 class="verify__title">Good morning. <span class="bd-serif-italic">Come on in.</span></h1>
        <button type="button" class="bd-btn bd-btn--primary" :disabled="status === 'working'" @click="finish">
          {{ status === 'working' ? 'Signing in…' : 'Finish signing in' }}
        </button>
      </template>
      <template v-else>
        <h1 class="verify__title">That link <span class="bd-serif-italic">didn't work.</span></h1>
        <p class="bd-muted" role="alert">{{ error }}</p>
        <NuxtLink to="/sign-in" class="bd-btn bd-btn--outline">Get a new link</NuxtLink>
      </template>
    </div>
  </div>
</template>

<style scoped>
.verify { display: flex; justify-content: center; padding-block: var(--bd-space-7); }
.verify__card { width: 100%; max-width: 440px; display: flex; flex-direction: column; gap: var(--bd-space-5); align-items: flex-start; }
.verify__title { font-size: var(--bd-text-2xl); font-weight: 300; letter-spacing: -0.03em; }
</style>
