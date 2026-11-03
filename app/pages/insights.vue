<script setup lang="ts">
import type { Insights } from '#shared/utils/insights'
import { MOODS } from '#shared/utils/moods'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'Insights' })

const { data, status, error } = await useFetch<Insights>('/api/insights')

const pct = (n: number, of: number) => `${Math.min(100, Math.round((n / Math.max(of, 1)) * 100))}%`
const maxLed = computed(() => Math.max(1, ...(data.value?.moods ?? []).map((m) => m.ledDays)))
const signed = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}`
const lean = (v: number) => (v > 0.25 ? 'lighter' : v < -0.25 ? 'heavier' : 'even')
const galleryWeeks = computed(() => (data.value?.weeks ?? []).filter((w) => w.entries >= 2).slice(0, 4).reverse())
</script>

<template>
  <div class="insights bd-container">
    <header class="insights__head">
      <h1 class="bd-display">Your <span class="bd-serif-italic">patterns</span></h1>
      <p class="bd-muted">What your mornings have in common, once there's enough sky to read.</p>
    </header>

    <p v-if="status === 'pending'" class="bd-muted">Reading your mornings…</p>
    <p v-else-if="error" role="alert">Couldn't load your insights. Try refreshing.</p>

    <!-- Locked: not enough history yet -->
    <section v-else-if="data && !data.unlocked" class="locked bd-card" aria-labelledby="locked-title">
      <h2 id="locked-title" class="locked__title">Insights unlock after <span class="bd-serif-italic">two weeks.</span></h2>
      <p class="bd-muted">Patterns need a little history. Keep writing and this page will fill in.</p>
      <div class="locked__meters">
        <div class="meter">
          <div class="meter__label"><span>Days of history</span><span>{{ data.progress.daysSpanned }} of {{ data.progress.neededDays }}</span></div>
          <div class="meter__track" role="progressbar" :aria-valuenow="data.progress.daysSpanned" aria-valuemin="0" :aria-valuemax="data.progress.neededDays" aria-label="Days of history">
            <span :style="{ width: pct(data.progress.daysSpanned, data.progress.neededDays) }" />
          </div>
        </div>
        <div class="meter">
          <div class="meter__label"><span>Brain dumps</span><span>{{ data.progress.entries }} of {{ data.progress.neededEntries }}</span></div>
          <div class="meter__track" role="progressbar" :aria-valuenow="data.progress.entries" aria-valuemin="0" :aria-valuemax="data.progress.neededEntries" aria-label="Brain dumps">
            <span :style="{ width: pct(data.progress.entries, data.progress.neededEntries) }" />
          </div>
        </div>
      </div>
      <NuxtLink to="/" class="bd-btn bd-btn--primary">Write this morning's dump</NuxtLink>
    </section>

    <!-- Unlocked -->
    <template v-else-if="data?.unlocked">
      <section class="stats" aria-label="At a glance">
        <div class="stat">
          <span class="stat__value">{{ data.totals!.entries }}</span>
          <span class="stat__label">mornings written</span>
        </div>
        <div class="stat">
          <span class="stat__value">{{ data.totals!.avgWords }}</span>
          <span class="stat__label">words on an average morning</span>
        </div>
        <div class="stat">
          <span class="stat__value">{{ data.totals!.longestStreak }}</span>
          <span class="stat__label">longest streak, in days</span>
        </div>
        <div class="stat">
          <span class="stat__value">{{ data.totals!.currentStreak }}</span>
          <span class="stat__label">current streak</span>
        </div>
      </section>

      <section class="block" aria-labelledby="noticed-title">
        <h2 id="noticed-title" class="block__title">What we <span class="bd-serif-italic">noticed</span></h2>
        <ul class="observations">
          <li v-for="(o, i) in data.observations" :key="i" class="bd-card observation">
            <BdSunrise :width="22" />
            <p>{{ o }}</p>
          </li>
        </ul>
      </section>

      <section class="block" aria-labelledby="trend-title">
        <h2 id="trend-title" class="block__title">Light and <span class="bd-serif-italic">heavy</span></h2>
        <p class="bd-muted block__lede">How each morning felt overall. Each dot is colored by its leading feeling.</p>
        <div class="bd-card"><InsightsTrend :points="data.timeline!" /></div>
      </section>

      <div class="pair">
        <section class="block" aria-labelledby="feelings-title">
          <h2 id="feelings-title" class="block__title">Leading <span class="bd-serif-italic">feelings</span></h2>
          <p class="bd-muted block__lede">How many mornings each feeling was the star of the show.</p>
          <ul class="bars">
            <li v-for="m in data.moods" :key="m.mood" class="bar">
              <BdMoodIcon :mood="m.mood" :size="28" />
              <span class="bar__name">{{ MOODS[m.mood].label }}</span>
              <span class="bar__track" aria-hidden="true"><span :style="{ width: pct(m.ledDays, maxLed), background: 'var(--bd-ink-2)' }" /></span>
              <span class="bar__value">{{ m.ledDays }}</span>
            </li>
          </ul>
        </section>

        <section class="block" aria-labelledby="sky-title">
          <h2 id="sky-title" class="block__title">In your <span class="bd-serif-italic">sky</span></h2>
          <p class="bd-muted block__lede">How often each kind of thinking showed up, out of {{ data.totals!.entries }} mornings.</p>
          <ul class="bars">
            <li v-for="f in data.features" :key="f.key" class="bar">
              <CosmosGlyph :feature="f.key" :size="28" />
              <span class="bar__name">{{ f.body }}<small>{{ f.meaning }}</small></span>
              <span class="bar__track" aria-hidden="true"><span :style="{ width: pct(f.days, data.totals!.entries), background: 'var(--bd-ink-2)' }" /></span>
              <span class="bar__value">{{ f.days }}</span>
            </li>
          </ul>
        </section>
      </div>

      <div class="pair">
        <section class="block" aria-labelledby="weekday-title">
          <h2 id="weekday-title" class="block__title">By day of the <span class="bd-serif-italic">week</span></h2>
          <p class="bd-muted block__lede">Average mood by weekday. Early days: a pattern needs a few more weeks to be trusted.</p>
          <ul class="weekdays">
            <li v-for="w in data.weekdays" :key="w.day" class="weekday">
              <span class="weekday__day">{{ w.day }}</span>
              <span class="weekday__track" aria-hidden="true">
                <span class="weekday__mid" />
                <span
                  v-if="w.avgValence !== null"
                  class="weekday__bar"
                  :class="w.avgValence >= 0 ? 'is-light' : 'is-heavy'"
                  :style="w.avgValence >= 0
                    ? { left: '50%', width: `${Math.abs(w.avgValence) * 50}%` }
                    : { right: '50%', width: `${Math.abs(w.avgValence) * 50}%` }"
                />
              </span>
              <span class="weekday__value">
                <template v-if="w.avgValence === null">no entries</template>
                <template v-else>{{ lean(w.avgValence) }} <span class="bd-muted">({{ w.entries }})</span></template>
              </span>
            </li>
          </ul>
        </section>

        <section v-if="data.topics?.length" class="block" aria-labelledby="topics-title">
          <h2 id="topics-title" class="block__title">Things that keep <span class="bd-serif-italic">coming up</span></h2>
          <p class="bd-muted block__lede">Words that appeared on several mornings, and whether those mornings ran lighter or heavier than usual.</p>
          <ul class="topics">
            <li v-for="t in data.topics" :key="t.word" class="topic" :class="t.valenceDiff >= 0.25 ? 'is-light' : t.valenceDiff <= -0.25 ? 'is-heavy' : ''">
              <span class="topic__word">{{ t.word }}</span>
              <span class="topic__meta">{{ t.days }} mornings<template v-if="Math.abs(t.valenceDiff) >= 0.25"> · {{ t.valenceDiff > 0 ? 'lighter' : 'heavier' }}</template></span>
            </li>
          </ul>
        </section>
      </div>

      <section v-if="galleryWeeks.length" class="block" aria-labelledby="weeks-title">
        <h2 id="weeks-title" class="block__title">Your weeks, <span class="bd-serif-italic">side by side</span></h2>
        <ul class="galaxies">
          <li v-for="w in galleryWeeks" :key="w.start" class="galaxy">
            <CosmosWeek :days="w.days" :seed="`week-${w.start}`" :title="`Week of ${formatIsoDate(w.start, { month: 'long', day: 'numeric' })} as a galaxy`" />
            <p class="galaxy__label">Week of {{ formatIsoDate(w.start, { month: 'short', day: 'numeric' }) }}</p>
            <p class="bd-muted galaxy__meta">
              {{ w.entries }} mornings · mostly {{ MOODS[w.mood].label }} · {{ lean(w.avgValence) }} ({{ signed(w.avgValence) }})
            </p>
          </li>
        </ul>
      </section>

      <p class="insights__note bd-muted">
        These patterns come from a simple word-based reading of your entries, so treat them as prompts for reflection, not conclusions.
      </p>
    </template>
  </div>
</template>

<style scoped>
.insights { display: flex; flex-direction: column; gap: var(--bd-space-7); padding-block: var(--bd-space-6); }
.insights__head { display: flex; flex-direction: column; gap: var(--bd-space-4); max-width: 640px; }
.insights__note { font-size: var(--bd-text-sm); max-width: 640px; }

.locked { display: flex; flex-direction: column; gap: var(--bd-space-4); align-items: flex-start; max-width: 560px; }
.locked__title { font-size: var(--bd-text-2xl); font-weight: 300; }
.locked__meters { display: flex; flex-direction: column; gap: var(--bd-space-4); width: 100%; }
.meter { display: flex; flex-direction: column; gap: 6px; }
.meter__label { display: flex; justify-content: space-between; font-size: var(--bd-text-sm); color: var(--bd-ink-2); }
.meter__track { height: 8px; border-radius: 4px; background: var(--bd-line); overflow: hidden; }
.meter__track span { display: block; height: 100%; border-radius: 4px; background: var(--bd-ink); }

.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: var(--bd-space-4); }
.stat { display: flex; flex-direction: column; gap: 4px; padding: var(--bd-space-5); background: var(--bd-surface); border-radius: var(--bd-radius-lg); box-shadow: var(--bd-shadow-soft); }
.stat__value { font-size: var(--bd-text-3xl); font-weight: 300; letter-spacing: -0.03em; line-height: 1; }
.stat__label { font-size: var(--bd-text-sm); color: var(--bd-ink-2); }

.block { display: flex; flex-direction: column; gap: var(--bd-space-3); min-width: 0; }
.block__title { font-size: var(--bd-text-2xl); font-weight: 300; }
.block__lede { font-size: var(--bd-text-sm); max-width: 620px; margin-bottom: var(--bd-space-2); }
.pair { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr)); gap: var(--bd-space-7); }

.observations { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); gap: var(--bd-space-4); }
.observation { display: flex; gap: var(--bd-space-3); align-items: flex-start; padding: var(--bd-space-5); }
.observation p { font-family: var(--bd-font-serif); font-variation-settings: var(--bd-serif-soft); font-size: var(--bd-text-lg); line-height: 1.45; }
.observation svg { margin-top: 8px; }

.bars { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--bd-space-3); }
.bar { display: grid; grid-template-columns: 28px minmax(0, 9rem) minmax(0, 1fr) 2rem; align-items: center; gap: var(--bd-space-3); font-size: var(--bd-text-sm); }
.bar__name { font-weight: 500; text-transform: capitalize; display: flex; flex-direction: column; }
.bar__name small { font-weight: 400; color: var(--bd-ink-3); text-transform: none; font-size: 12px; }
.bar__track { height: 10px; border-radius: 5px; background: var(--bd-line); overflow: hidden; }
.bar__track span { display: block; height: 100%; border-radius: 5px; }
.bar__value { text-align: right; font-variant-numeric: tabular-nums; color: var(--bd-ink-2); }

.weekdays { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--bd-space-2); }
.weekday { display: grid; grid-template-columns: 2.5rem minmax(0, 1fr) 7.5rem; align-items: center; gap: var(--bd-space-3); font-size: var(--bd-text-sm); }
.weekday__day { font-weight: 500; }
.weekday__track { position: relative; height: 12px; background: var(--bd-line); border-radius: 6px; }
.weekday__mid { position: absolute; left: 50%; top: -3px; bottom: -3px; width: 2px; margin-left: -1px; background: var(--bd-ink-3); border-radius: 1px; }
.weekday__bar { position: absolute; top: 0; bottom: 0; border-radius: 6px; }
.weekday__bar.is-light { background: var(--bd-cobalt); }
.weekday__bar.is-heavy { background: var(--bd-terracotta-dark); }
.weekday__value { color: var(--bd-ink-2); }

.topics { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: var(--bd-space-2); }
.topic { display: flex; flex-direction: column; padding: 10px 16px; border-radius: var(--bd-radius-md); background: var(--bd-surface); box-shadow: var(--bd-shadow-soft); border-left: 0; }
.topic__word { font-family: var(--bd-font-serif); font-variation-settings: var(--bd-serif-soft); font-size: var(--bd-text-lg); }
.topic__meta { font-size: 12px; color: var(--bd-ink-3); }
.topic.is-light .topic__meta { color: var(--bd-cobalt-dark); }
.topic.is-heavy .topic__meta { color: var(--bd-terracotta-dark); }

.galaxies { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: var(--bd-space-5); }
.galaxy { display: flex; flex-direction: column; gap: var(--bd-space-2); }
.galaxy .cosmos { border-radius: var(--bd-radius-lg); box-shadow: var(--bd-shadow-soft); }
.galaxy__label { font-weight: 500; margin-top: var(--bd-space-2); }
.galaxy__meta { font-size: var(--bd-text-sm); }

@media (max-width: 480px) {
  .bar { grid-template-columns: 28px minmax(0, 7rem) minmax(0, 1fr) 1.5rem; }
  .weekday { grid-template-columns: 2.5rem minmax(0, 1fr) 6rem; }
}
</style>
