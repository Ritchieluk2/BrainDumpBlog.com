<script setup lang="ts">
const { loggedIn } = useUserSession()
</script>

<template>
  <div class="layout" :class="{ 'has-tabbar': loggedIn }">
    <a href="#main" class="skip-link">Skip to content</a>
    <SiteHeader />
    <main id="main" class="layout__main">
      <slot />
    </main>
    <SiteFooter />
    <MobileTabBar v-if="loggedIn" />
  </div>
</template>

<style scoped>
.layout { min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column; }
.layout__main { flex: 1; }
/* leave room for the phone tab bar (and the iPhone home indicator) */
@media (max-width: 719px) {
  .layout.has-tabbar { padding-bottom: calc(72px + env(safe-area-inset-bottom)); }
}
.skip-link {
  position: absolute;
  left: -9999px;
  top: 8px;
  padding: 10px 16px;
  background: var(--bd-ink);
  color: var(--bd-surface);
  border-radius: var(--bd-radius-pill);
  z-index: 30;
}
.skip-link:focus { left: 16px; color: var(--bd-surface); }
</style>
