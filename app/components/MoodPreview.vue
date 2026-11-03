<script setup lang="ts">
/** Live preview of the reader's look: an example morning, an example week, and the key. */
import { MOODS, MOOD_KEYS } from '#shared/utils/moods'
import { demoWeek } from '~/data/sampleDumps'

const week = demoWeek()
// the busiest example morning shows the most feelings at once
const day = [...week].sort((a, b) => Object.values(b.affect.moods).filter((v) => v > 0.05).length - Object.values(a.affect.moods).filter((v) => v > 0.05).length)[0]!
</script>

<template>
  <figure class="mp">
    <div class="mp__pics">
      <div>
        <CosmosDay :affect="day.affect" :seed="day.id" title="Example morning in your colors and shapes" />
        <figcaption class="mp__cap">A morning</figcaption>
      </div>
      <div>
        <CosmosWeek :days="week" seed="preview-week" title="Example week in your colors and shapes" />
        <figcaption class="mp__cap">A week</figcaption>
      </div>
    </div>
    <ul class="mp__key" aria-label="Your feelings">
      <li v-for="m in MOOD_KEYS" :key="m"><BdMoodIcon :mood="m" :size="30" /><span>{{ MOODS[m].label }}</span></li>
    </ul>
  </figure>
</template>

<style scoped>
.mp { margin: 0; display: flex; flex-direction: column; gap: var(--bd-space-4); }
.mp__pics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--bd-space-3); }
.mp__pics :deep(.cosmos) { border-radius: var(--bd-radius-md); overflow: hidden; box-shadow: var(--bd-shadow-soft); }
.mp__cap { font-size: var(--bd-text-xs); color: var(--bd-ink-3); margin-top: 6px; text-align: center; }
.mp__key { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: var(--bd-space-2) var(--bd-space-3); justify-content: center; }
.mp__key li { display: flex; align-items: center; gap: 4px; font-size: var(--bd-text-xs); color: var(--bd-ink-2); text-transform: capitalize; }
</style>
