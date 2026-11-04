<script setup lang="ts">
const { loggedIn } = useUserSession()
const route = useRoute()
// The welcome flow has its own Back/Next bar, so the phone tab bar steps aside there.
const tabs = computed(() => loggedIn.value && route.path !== '/welcome')
</script>

<template>
  <div class="layout" :class="{ 'has-tabbar': tabs }">
    <a href="#main" class="skip-link">Skip to content</a>
    <p class="wip-banner" role="note">
      <span class="wip-banner__tag">Work in progress</span>
      <span>A demo in development, made with AI assistance.</span>
    </p>
    <SiteHeader />
    <main id="main" class="layout__main">
      <slot />
    </main>
    <SiteFooter />
    <MobileTabBar v-if="tabs" />
  </div>
</template>

<style scoped>
.layout { min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column; }
.layout__main { flex: 1; }
/* leave room for the phone tab bar (and the iPhone home indicator) */
@media (max-width: 719px) {
  .layout.has-tabbar { padding-bottom: calc(72px + env(safe-area-inset-bottom)); }
}
/* thin notice above the header; the top padding clears an iPhone notch (viewport-fit=cover) */
.wip-banner {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 4px 10px;
  padding: calc(6px + env(safe-area-inset-top)) var(--bd-gutter) 6px;
  background: var(--bd-ink);
  color: var(--bd-ground);
  font-size: 12.5px;
  line-height: 1.35;
  text-align: center;
}
.wip-banner__tag {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: var(--bd-tracking-label);
  text-transform: uppercase;
  color: var(--bd-sunrise);
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
