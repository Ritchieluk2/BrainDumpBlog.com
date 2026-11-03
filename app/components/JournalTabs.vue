<script setup lang="ts">
const route = useRoute()
const tabs = [
  { to: '/journal', label: 'Mornings', match: (p: string) => p === '/journal' },
  { to: '/journal/entries', label: 'Journal', match: (p: string) => p === '/journal/entries' }
]
</script>

<template>
  <nav class="tabs" aria-label="Journal sections">
    <NuxtLink
      v-for="t in tabs"
      :key="t.to"
      :to="t.to"
      class="tabs__tab"
      :aria-current="t.match(route.path) ? 'page' : undefined"
    >
      {{ t.label }}
    </NuxtLink>
    <NuxtLink to="/journal/new" class="bd-btn bd-btn--outline bd-btn--small tabs__new">New journal entry</NuxtLink>
  </nav>
</template>

<style scoped>
.tabs { display: flex; flex-wrap: wrap; align-items: center; gap: var(--bd-space-2); border-bottom: 1px solid var(--bd-line); }
.tabs__tab {
  padding: 12px 4px;
  margin-right: var(--bd-space-4);
  text-decoration: none;
  color: var(--bd-ink-2);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}
.tabs__tab[aria-current='page'] { color: var(--bd-ink); border-bottom-color: var(--bd-sunrise); font-weight: 500; }
.tabs__new { margin-left: auto; margin-bottom: var(--bd-space-2); }
</style>
