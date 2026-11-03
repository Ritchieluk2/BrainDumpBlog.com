<script setup lang="ts">
/** Mood icon: each detected mood has its own shape and planet color. */
import { MOODS, PLANET_COLORS, type Mood } from '#shared/utils/cosmos'

const props = withDefaults(defineProps<{
  mood: Mood
  size?: number
  showLabel?: boolean
}>(), {
  size: 44,
  showLabel: false
})

const uid = useId()
const gradId = computed(() => `bd-mood-${uid}`)
const info = computed(() => MOODS[props.mood])
const col = computed(() => PLANET_COLORS[info.value.color])
</script>

<template>
  <span class="bd-mood" :class="{ 'bd-mood--labelled': showLabel }">
    <svg
      :width="size"
      :height="size"
      viewBox="0 0 52 52"
      :role="showLabel ? undefined : 'img'"
      :aria-label="showLabel ? undefined : info.label"
      :aria-hidden="showLabel ? 'true' : undefined"
    >
      <defs>
        <linearGradient :id="gradId" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0.58" :stop-color="col.lit" />
          <stop offset="0.58" :stop-color="col.shade" />
        </linearGradient>
      </defs>
      <ellipse cx="26" cy="49" rx="14" ry="2.5" fill="var(--bd-ground-shadow)" />

      <path
        v-if="info.shape === 'star'"
        d="M26 3 l6 13 14 2 -10 10 3 14 -13 -7 -13 7 3 -14 -10 -10 14 -2 z"
        :fill="`url(#${gradId})`"
      />
      <circle v-else-if="info.shape === 'sphere'" cx="26" cy="23" r="19" :fill="`url(#${gradId})`" />
      <g v-else-if="info.shape === 'ringed'">
        <circle cx="26" cy="23" r="12" :fill="`url(#${gradId})`" />
        <ellipse cx="26" cy="23" rx="23" ry="7" fill="none" :stroke="col.shade" stroke-width="3" transform="rotate(-20 26 23)" />
      </g>
      <path v-else-if="info.shape === 'triangle'" d="M26 4 l19 37 h-38 z" :fill="`url(#${gradId})`" />
      <path
        v-else-if="info.shape === 'crescent'"
        d="M33 4 a20 20 0 1 0 12 30 a16 16 0 1 1 -12 -30 z"
        :fill="`url(#${gradId})`"
      />
      <rect
        v-else
        x="11"
        y="8"
        width="30"
        height="30"
        rx="8"
        transform="rotate(20 26 23)"
        :fill="`url(#${gradId})`"
      />
    </svg>
    <span v-if="showLabel" class="bd-mood__label">{{ info.label }}</span>
  </span>
</template>

<style scoped>
.bd-mood { display: inline-flex; flex-direction: column; align-items: center; gap: 8px; }
.bd-mood svg { flex: none; }
.bd-mood__label { font-size: var(--bd-text-xs); color: var(--bd-ink-2); }
</style>
