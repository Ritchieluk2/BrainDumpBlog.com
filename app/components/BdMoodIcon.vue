<script setup lang="ts">
/** Mood icon: a feeling drawn in the reader's own color and shape for it. */
import { MOODS, shapeSvg, tone, type Mood, type MoodLook } from '#shared/utils/moods'

const props = withDefaults(defineProps<{
  mood: Mood
  size?: number
  showLabel?: boolean
  /** Draw this look instead of the reader's (for pickers and previews). */
  look?: MoodLook
}>(), {
  size: 44,
  showLabel: false,
  look: undefined
})

const { moods } = usePreferences()
const uid = useId()
const gradId = computed(() => `bd-mood-${uid}`)
const current = computed(() => props.look ?? moods.value[props.mood])
const label = computed(() => MOODS[props.mood].label)

const art = computed(() => {
  const c = tone(current.value.color)
  return `<defs><linearGradient id="${gradId.value}" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0.58" stop-color="${c.lit}"/><stop offset="0.58" stop-color="${c.shade}"/></linearGradient></defs>` +
    `<ellipse cx="26" cy="49" rx="14" ry="2.5" fill="var(--bd-ground-shadow)"/>` +
    shapeSvg(current.value.shape, 26, 24, 18, { fill: `url(#${gradId.value})`, ring: c.shade })
})
</script>

<template>
  <span class="bd-mood" :class="{ 'bd-mood--labelled': showLabel }">
    <!-- eslint-disable-next-line vue/no-v-html -- built by our own code from validated colors and shape ids -->
    <svg
      :width="size"
      :height="size"
      viewBox="0 0 52 52"
      :role="showLabel ? undefined : 'img'"
      :aria-label="showLabel ? undefined : label"
      :aria-hidden="showLabel ? 'true' : undefined"
      v-html="art"
    />
    <span v-if="showLabel" class="bd-mood__label">{{ label }}</span>
  </span>
</template>

<style scoped>
.bd-mood { display: inline-flex; flex-direction: column; align-items: center; gap: 8px; flex: none; }
.bd-mood svg { flex: none; overflow: visible; }
.bd-mood__label { font-size: var(--bd-text-xs); color: var(--bd-ink-2); }
</style>
