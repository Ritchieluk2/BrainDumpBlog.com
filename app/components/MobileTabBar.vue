<script setup lang="ts">
/**
 * App-style navigation pinned to the bottom of the screen on phones
 * (hidden on wider screens, where the header shows these links).
 */
const route = useRoute()
const tabs = [
  { to: '/', label: 'Write', match: (p: string) => p === '/' || p === '/preview' },
  { to: '/journal', label: 'Journal', match: (p: string) => p.startsWith('/journal') },
  { to: '/insights', label: 'Insights', match: (p: string) => p.startsWith('/insights') },
  { to: '/account', label: 'Account', match: (p: string) => p.startsWith('/account') || p.startsWith('/settings') }
] as const
</script>

<template>
  <nav class="tabbar" aria-label="Main">
    <NuxtLink
      v-for="t in tabs"
      :key="t.to"
      :to="t.to"
      class="tabbar__tab"
      :aria-current="t.match(route.path) ? 'page' : undefined"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <template v-if="t.label === 'Write'">
          <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
          <path d="M13.5 6.5l4 4" />
        </template>
        <template v-else-if="t.label === 'Journal'">
          <circle cx="12" cy="12" r="3.2" />
          <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-20 12 12)" />
        </template>
        <template v-else-if="t.label === 'Insights'">
          <path d="M3 17l5-6 4 3 6-8 3 3" />
          <path d="M3 21h18" />
        </template>
        <template v-else>
          <circle cx="12" cy="8.5" r="3.5" />
          <path d="M5 20c1.2-3.6 4-5.2 7-5.2s5.8 1.6 7 5.2" />
        </template>
      </svg>
      <span>{{ t.label }}</span>
    </NuxtLink>
  </nav>
</template>

<style scoped>
.tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  display: none;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding: 6px 8px calc(6px + env(safe-area-inset-bottom));
  background: color-mix(in srgb, var(--bd-surface) 92%, transparent);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
  border-top: 1px solid var(--bd-line);
}
.tabbar__tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 52px;
  border-radius: 14px;
  color: var(--bd-ink-3);
  text-decoration: none;
  font-size: 12px;
  font-weight: 500;
}
.tabbar__tab[aria-current='page'] { color: var(--bd-ink); }
.tabbar__tab[aria-current='page'] svg { stroke-width: 2.1; }
.tabbar__tab:active { background: var(--bd-line); }

@media (max-width: 719px) {
  .tabbar { display: grid; }
}
</style>
