<script setup lang="ts">
/** A compact link to another entry: thumbnail, date and a line of context. */
import type { EntryRef } from '#shared/types/dump'

defineProps<{ entry: EntryRef }>()
</script>

<template>
  <NuxtLink :to="`/journal/${entry.id}`" class="ref">
    <CosmosDay :affect="entry.affect" :seed="entry.id" class="ref__sky" />
    <span class="ref__text">
      <span class="ref__date">{{ formatIsoDate(entry.entryDate, { weekday: 'short', month: 'short', day: 'numeric' }) }}</span>
      <span class="ref__line">{{ entry.kind === 'journal' ? (entry.title || 'Untitled entry') : entry.summary }}</span>
    </span>
  </NuxtLink>
</template>

<style scoped>
.ref {
  display: flex;
  align-items: center;
  gap: var(--bd-space-3);
  padding: var(--bd-space-2);
  border-radius: var(--bd-radius-md);
  background: var(--bd-surface);
  box-shadow: var(--bd-shadow-soft);
  text-decoration: none;
  min-width: 0;
}
.ref:hover { color: var(--bd-ink); }
.ref__sky { width: 56px; flex: none; border-radius: 14px; overflow: hidden; }
.ref__text { display: flex; flex-direction: column; min-width: 0; }
.ref__date { font-size: 13px; color: var(--bd-ink-3); }
.ref__line { font-size: var(--bd-text-sm); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
