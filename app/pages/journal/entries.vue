<script setup lang="ts">
import type { DumpSummary } from '#shared/types/dump'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'Journal' })

const { data: entries, status, error } = await useFetch<DumpSummary[]>('/api/dumps', { query: { kind: 'journal' }, default: () => [] })
</script>

<template>
  <div class="entries bd-container">
    <header class="entries__head">
      <h1 class="bd-display">Your <span class="bd-serif-italic">journal</span></h1>
      <p class="bd-muted">Longer thoughts, written whenever. Link them to mornings to reflect on how those days went.</p>
    </header>

    <JournalTabs />

    <p v-if="status === 'pending'" class="bd-muted">Loading…</p>
    <p v-else-if="error" role="alert">Couldn't load your journal. Try refreshing.</p>

    <div v-else-if="!entries?.length" class="entries__empty bd-card">
      <h2 class="entries__empty-title">Nothing here <span class="bd-serif-italic">yet.</span></h2>
      <p class="bd-muted">Journal entries are for anything that isn't a morning dump: a long walk's worth of thinking, a reflection on last week, a letter to yourself.</p>
      <NuxtLink to="/journal/new" class="bd-btn bd-btn--primary">Write a journal entry</NuxtLink>
    </div>

    <ol v-else class="entries__list">
      <li v-for="e in entries" :key="e.id">
        <NuxtLink :to="`/journal/${e.id}`" class="entry-card bd-card">
          <CosmosDay :affect="e.affect" :seed="e.id" class="entry-card__sky" />
          <div class="entry-card__text">
            <p class="entry-card__date">{{ formatIsoDate(e.entryDate) }} · {{ e.words }} words</p>
            <h2 class="entry-card__title">{{ e.title || 'Untitled entry' }}</h2>
            <p class="entry-card__excerpt bd-serif">{{ e.excerpt }}{{ e.excerpt.length >= 200 ? '…' : '' }}</p>
          </div>
        </NuxtLink>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.entries { display: flex; flex-direction: column; gap: var(--bd-space-6); padding-block: var(--bd-space-6); }
.entries__head { display: flex; flex-direction: column; gap: var(--bd-space-4); max-width: 640px; }
.entries__empty { display: flex; flex-direction: column; gap: var(--bd-space-3); align-items: flex-start; max-width: 560px; }
.entries__empty-title { font-size: var(--bd-text-2xl); font-weight: 300; }
.entries__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--bd-space-4); max-width: 820px; }
.entry-card { display: flex; gap: var(--bd-space-5); align-items: flex-start; text-decoration: none; padding: var(--bd-space-5); }
.entry-card:hover { color: var(--bd-ink); }
.entry-card__sky { width: 88px; flex: none; border-radius: 18px; overflow: hidden; }
.entry-card__text { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.entry-card__date { font-size: 13px; color: var(--bd-ink-3); }
.entry-card__title { font-size: var(--bd-text-xl); font-weight: 400; }
.entry-card__excerpt { font-size: var(--bd-text-md); color: var(--bd-ink-2); line-height: 1.5; overflow-wrap: anywhere; }
@media (max-width: 480px) { .entry-card__sky { width: 64px; } }
</style>
