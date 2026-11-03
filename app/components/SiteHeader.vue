<script setup lang="ts">
const { loggedIn } = useUserSession()
const { appearance, night } = usePreferences()
// Quick toggle between light and night; full options live on /settings.
function toggleNight() {
  appearance.value = night.value ? 'light' : 'dark'
}
</script>

<template>
  <header class="site-header bd-container">
    <NuxtLink to="/" class="site-header__brand" aria-label="Brain Dump home">
      <BdLogo />
    </NuxtLink>
    <nav aria-label="Main" class="site-header__nav">
      <NuxtLink to="/why">Why brain dumps?</NuxtLink>
      <template v-if="loggedIn">
        <NuxtLink to="/journal">Journal</NuxtLink>
        <NuxtLink to="/insights">Insights</NuxtLink>
        <NuxtLink to="/account">Account</NuxtLink>
        <NuxtLink to="/" class="bd-btn bd-btn--primary bd-btn--small">Write</NuxtLink>
      </template>
      <NuxtLink v-else to="/sign-in" class="bd-btn bd-btn--outline bd-btn--small">Sign in</NuxtLink>
      <button
        type="button"
        class="site-header__mode"
        :aria-label="night ? 'Switch to light mode' : 'Switch to night mode'"
        :aria-pressed="night"
        @click="toggleNight"
      >
        <svg v-if="night" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
        </svg>
        <svg v-else width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">
          <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
        </svg>
      </button>
    </nav>
  </header>
</template>

<style scoped>
.site-header__mode {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid var(--bd-line-strong);
  background: var(--bd-surface);
  color: var(--bd-ink);
  cursor: pointer;
}
.site-header__mode:hover { border-color: var(--bd-ink-3); }
.site-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--bd-space-4);
  padding-block: 28px;
}
.site-header__brand { text-decoration: none; }
.site-header__nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--bd-space-2) 28px;
}
.site-header__nav a:not(.bd-btn) {
  text-decoration: none;
  padding-block: 10px;
}
.site-header__nav a.router-link-active:not(.bd-btn) {
  text-decoration: underline;
  text-decoration-color: var(--bd-sunrise);
  text-decoration-thickness: 2px;
}
</style>
