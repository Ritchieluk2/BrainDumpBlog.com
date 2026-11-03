<script setup lang="ts">
/** Appearance (system / light / night) and art style, with live previews. */
import { ART_STYLES } from '#shared/utils/cosmos-styles'
import { demoWeek } from '~/data/sampleDumps'

const { appearance, art, night } = usePreferences()
const sample = demoWeek()
const previewDay = sample[0]!

const appearances = [
  { id: 'system', label: 'System', hint: 'Follow your device' },
  { id: 'light', label: 'Light', hint: 'Chalk white' },
  { id: 'dark', label: 'Night', hint: 'Dark sky' }
] as const
</script>

<template>
  <div class="picker">
    <fieldset class="picker__group">
      <legend class="picker__legend">Appearance</legend>
      <div class="segments">
        <label v-for="a in appearances" :key="a.id" class="segment" :class="{ 'is-on': appearance === a.id }">
          <input v-model="appearance" type="radio" name="appearance" :value="a.id" class="bd-sr-only">
          <span class="segment__label">{{ a.label }}</span>
          <span class="segment__hint">{{ a.hint }}</span>
        </label>
      </div>
    </fieldset>

    <fieldset class="picker__group">
      <legend class="picker__legend">Art style</legend>
      <p class="bd-muted picker__lede">How your mornings and weeks are drawn. The meaning stays the same in every style: the strongest feeling at the center, racing thoughts, to-dos, fog, loops and small joys.</p>
      <div class="styles">
        <label v-for="s in ART_STYLES" :key="s.id" class="style" :class="{ 'is-on': art === s.id }">
          <input v-model="art" type="radio" name="art" :value="s.id" class="bd-sr-only">
          <span class="style__previews" aria-hidden="true">
            <CosmosDay :affect="previewDay.affect" :seed="previewDay.id" :art="s.id" :night="night" />
            <CosmosWeek :days="sample" seed="picker-week" :art="s.id" :night="night" />
          </span>
          <span class="style__label">{{ s.label }}</span>
          <span class="style__desc">{{ s.description }}</span>
        </label>
      </div>
    </fieldset>
  </div>
</template>

<style scoped>
.picker { display: flex; flex-direction: column; gap: var(--bd-space-7); }
.picker__group { border: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--bd-space-3); }
.picker__legend { font-size: var(--bd-text-xl); font-weight: 500; padding: 0; margin-bottom: var(--bd-space-2); }
.picker__lede { font-size: var(--bd-text-sm); max-width: 620px; }

.segments { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--bd-space-2); max-width: 520px; }
.segment {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 14px;
  border-radius: var(--bd-radius-md);
  border: 2px solid var(--bd-line-strong);
  background: var(--bd-surface);
  cursor: pointer;
}
.segment.is-on { border-color: var(--bd-ink); }
.segment:focus-within { outline: 2px solid var(--bd-cobalt); outline-offset: 3px; }
.segment__label { font-weight: 500; }
.segment__hint { font-size: 12px; color: var(--bd-ink-3); }

.styles { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 230px), 1fr)); gap: var(--bd-space-4); }
.style {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: var(--bd-space-3);
  border-radius: var(--bd-radius-lg);
  border: 2px solid transparent;
  background: var(--bd-surface);
  box-shadow: var(--bd-shadow-soft);
  cursor: pointer;
}
.style.is-on { border-color: var(--bd-ink); }
.style:focus-within { outline: 2px solid var(--bd-cobalt); outline-offset: 3px; }
.style__previews { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
.style__previews :deep(.cosmos) { border-radius: 16px; overflow: hidden; }
.style__label { font-weight: 500; margin-top: 4px; }
.style__desc { font-size: 13px; color: var(--bd-ink-2); }
</style>
