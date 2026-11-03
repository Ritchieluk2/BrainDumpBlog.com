<script setup lang="ts">
useHead({ title: 'Sign in' })

const route = useRoute()
const isDev = import.meta.dev
const { loggedIn } = useUserSession()
if (loggedIn.value) await navigateTo('/journal')

const email = ref('')
const status = ref<'idle' | 'sending' | 'sent'>('idle')
const error = ref('')

async function submit() {
  error.value = ''
  status.value = 'sending'
  try {
    // Remember where to go after the link is clicked (it may open in a new tab).
    const next = safeNextPath(route.query.next)
    try { if (next) localStorage.setItem('bd-next', next) } catch { /* ignore */ }

    await $fetch('/api/auth/request-link', { method: 'POST', body: { email: email.value } })
    status.value = 'sent'
  } catch (err: unknown) {
    error.value = (err as { statusMessage?: string }).statusMessage ?? 'Something went wrong. Please try again.'
    status.value = 'idle'
  }
}
</script>

<template>
  <div class="auth bd-container">
    <div class="auth__card bd-card">
      <div class="auth__head">
        <BdLogo size="sm" mark-only />
        <template v-if="status !== 'sent'">
          <h1 class="auth__title">Sign in or <span class="bd-serif-italic">start a journal.</span></h1>
          <p class="bd-muted">Enter your email and we'll send you a link. No password to remember.</p>
        </template>
        <template v-else>
          <h1 class="auth__title">Check your <span class="bd-serif-italic">inbox.</span></h1>
          <p class="bd-muted">We sent a sign-in link to <strong>{{ email }}</strong>. It works once and expires in 20 minutes.</p>
        </template>
      </div>

      <form v-if="status !== 'sent'" class="auth__form" @submit.prevent="submit">
        <label class="auth__field">
          <span>Email</span>
          <input v-model="email" type="email" autocomplete="email" required class="bd-input" :disabled="status === 'sending'">
        </label>
        <button type="submit" class="bd-btn bd-btn--primary" :disabled="status === 'sending'">
          {{ status === 'sending' ? 'Sending…' : 'Email me a link' }}
        </button>
        <p v-if="error" class="auth__error" role="alert">{{ error }}</p>
      </form>

      <button v-else type="button" class="auth__link" @click="status = 'idle'">Use a different email</button>

      <div v-if="isDev" class="auth__dev">
        <p class="bd-label">Local development only</p>
        <a href="/api/dev/demo-login" class="bd-btn bd-btn--outline bd-btn--small">Open the demo account</a>
        <a href="/api/dev/demo-login?reset=1" class="auth__dev-reset">Reset demo entries to end today</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth { display: flex; justify-content: center; padding-block: var(--bd-space-7); }
.auth__dev {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--bd-space-2) var(--bd-space-4);
  padding-top: var(--bd-space-5);
  border-top: 1px dashed var(--bd-line-strong);
}
.auth__dev .bd-label { width: 100%; }
.auth__dev-reset { font-size: var(--bd-text-sm); color: var(--bd-ink-2); padding-block: 10px; }
.auth__card { width: 100%; max-width: 440px; display: flex; flex-direction: column; gap: var(--bd-space-6); }
.auth__head { display: flex; flex-direction: column; gap: var(--bd-space-3); }
.auth__title { font-size: var(--bd-text-2xl); font-weight: 300; letter-spacing: -0.03em; }
.auth__form { display: flex; flex-direction: column; gap: var(--bd-space-4); }
.auth__field { display: flex; flex-direction: column; gap: 6px; font-size: var(--bd-text-sm); color: var(--bd-ink-2); }
.auth__error { font-size: var(--bd-text-sm); color: var(--bd-terracotta-dark); }
.auth__link {
  align-self: flex-start;
  font: inherit;
  font-size: var(--bd-text-sm);
  color: var(--bd-ink);
  background: none;
  border: none;
  padding: 10px 0;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}
</style>
