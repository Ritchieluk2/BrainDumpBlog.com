<script setup lang="ts">
import type { DumpSummary } from '#shared/types/dump'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'Your mornings' })

const { data: dumps, status, error } = await useFetch<DumpSummary[]>('/api/dumps', { query: { kind: 'dump' }, default: () => [] })

/** Entries grouped into weeks (Monday to Sunday), newest week first. */
const weeks = computed(() => {
  const groups = new Map<string, DumpSummary[]>()
  for (const d of dumps.value ?? []) {
    const key = weekStart(d.entryDate)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(d)
  }
  return [...groups.entries()].map(([start, entries]) => {
    const oldestFirst = [...entries].sort((a, b) => a.entryDate.localeCompare(b.entryDate) || a.createdAt - b.createdAt)
    return {
      start,
      label: `Week of ${formatIsoDate(start, { month: 'long', day: 'numeric' })}`,
      galaxy: oldestFirst.map((e) => ({ id: e.id, affect: e.affect })),
      entries
    }
  })
})
</script>

<template>
  <div class="journal bd-container">
    <header class="journal__head">
      <h1 class="bd-display">Your <span class="bd-serif-italic">mornings</span></h1>
      <p class="bd-muted">Each morning is a solar system. Each week spirals into a galaxy.</p>
    </header>

    <JournalTabs />

    <p v-if="status === 'pending'" class="bd-muted">Loading your mornings…</p>
    <p v-else-if="error" role="alert">Couldn't load your journal. Try refreshing.</p>

    <div v-else-if="!weeks.length" class="journal__empty bd-card">
      <h2 class="journal__empty-title">Your sky is <span class="bd-serif-italic">empty.</span></h2>
      <p class="bd-muted">Write your first brain dump and its solar system will appear here.</p>
      <NuxtLink to="/" class="bd-btn bd-btn--primary">Start this morning's dump</NuxtLink>
    </div>

    <template v-else>
      <section v-for="week in weeks" :key="week.start" class="week" :aria-label="week.label">
        <div class="week__galaxy">
          <CosmosWeek :days="week.galaxy" :seed="`week-${week.start}`" :title="`${week.label} as a galaxy`" />
          <p class="week__label">{{ week.label }}</p>
          <p class="bd-muted week__count">{{ week.entries.length }} {{ week.entries.length === 1 ? 'morning' : 'mornings' }}</p>
        </div>

        <ol class="week__days">
          <li v-for="e in week.entries" :key="e.id">
            <NuxtLink :to="`/journal/${e.id}`" class="day">
              <CosmosDay :affect="e.affect" :seed="e.id" />
              <span class="day__date">
                <span class="day__weekday">{{ formatIsoDate(e.entryDate, { weekday: 'short' }) }}</span>
                {{ formatIsoDate(e.entryDate, { month: 'short', day: 'numeric' }) }}
              </span>
              <span class="day__summary">{{ e.summary }}</span>
            </NuxtLink>
          </li>
        </ol>
      </section>
    </template>
  </div>
</template>

<style scoped>
.journal { display: flex; flex-direction: column; gap: var(--bd-space-7); padding-block: var(--bd-space-6); }
.journal__head { display: flex; flex-direction: column; gap: var(--bd-space-4); max-width: 640px; }
.journal__empty { display: flex; flex-direction: column; gap: var(--bd-space-3); align-items: flex-start; max-width: 520px; }
.journal__empty-title { font-size: var(--bd-text-2xl); font-weight: 300; }

.week {
  display: flex;
  flex-wrap: wrap;
  gap: var(--bd-space-6);
  padding-top: var(--bd-space-6);
  border-top: 1px solid var(--bd-line);
}
.week__galaxy { flex: 1 1 240px; max-width: 300px; display: flex; flex-direction: column; gap: var(--bd-space-2); }
.week__galaxy .cosmos { border-radius: var(--bd-radius-lg); box-shadow: var(--bd-shadow-card); }
.week__label { font-size: var(--bd-text-lg); font-weight: 500; margin-top: var(--bd-space-2); }
.week__count { font-size: var(--bd-text-sm); }

.week__days {
  flex: 999 1 420px;
  min-width: 0;
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--bd-space-4);
  align-content: start;
}
.day {
  display: flex;
  flex-direction: column;
  gap: var(--bd-space-2);
  text-decoration: none;
  padding: var(--bd-space-2);
  border-radius: var(--bd-radius-lg);
}
.day .cosmos { border-radius: 22px; box-shadow: var(--bd-shadow-soft); transition: transform var(--bd-duration) var(--bd-ease); }
.day:hover { color: var(--bd-ink); }
.day:hover .cosmos { transform: translateY(-3px); }
.day__date { font-size: var(--bd-text-sm); color: var(--bd-ink-2); padding-inline: 4px; }
.day__weekday { font-weight: 500; color: var(--bd-ink); }
.day__summary { font-size: var(--bd-text-sm); line-height: 1.4; color: var(--bd-ink-2); padding-inline: 4px; }
</style>
