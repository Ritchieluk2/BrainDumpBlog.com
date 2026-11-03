<script setup lang="ts">
/**
 * One matte planet: a lit side and a crisp diagonal shadow,
 * with an optional ring, moon and soft ground shadow.
 * Renders inside a 100×100 viewBox so it scales to any size.
 */
import { PLANET_COLORS, type PlanetColor } from '#shared/utils/moods'

const props = withDefaults(defineProps<{
  color?: PlanetColor
  radius?: number
  ring?: boolean
  ringColor?: PlanetColor
  moon?: PlanetColor | null
  groundShadow?: boolean
  label?: string
}>(), {
  color: 'terracotta',
  radius: 34,
  ring: false,
  ringColor: undefined,
  moon: null,
  groundShadow: true,
  label: undefined
})

const uid = useId()
const planetId = computed(() => `bd-planet-${uid}`)
const moonId = computed(() => `bd-moon-${uid}`)

const c = computed(() => PLANET_COLORS[props.color])
const m = computed(() => (props.moon ? PLANET_COLORS[props.moon] : null))
const ringStroke = computed(() => PLANET_COLORS[props.ringColor ?? props.color].shade)

const cy = computed(() => (props.groundShadow ? 46 : 50))
const moonR = computed(() => Math.max(5, Math.round(props.radius * 0.24)))
const moonX = computed(() => Math.min(92, 50 + props.radius * 0.95))
const moonY = computed(() => Math.max(8, cy.value - props.radius * 0.95))
</script>

<template>
  <svg
    viewBox="0 0 100 100"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
    class="bd-planet"
  >
    <defs>
      <linearGradient :id="planetId" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0.58" :stop-color="c.lit" />
        <stop offset="0.58" :stop-color="c.shade" />
      </linearGradient>
      <linearGradient v-if="m" :id="moonId" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0.58" :stop-color="m.lit" />
        <stop offset="0.58" :stop-color="m.shade" />
      </linearGradient>
    </defs>

    <ellipse
      v-if="groundShadow"
      cx="50"
      cy="95"
      :rx="radius * 0.85"
      ry="3.5"
      fill="var(--bd-ground-shadow)"
    />
    <circle cx="50" :cy="cy" :r="radius" :fill="`url(#${planetId})`" />
    <ellipse
      v-if="ring"
      cx="50"
      :cy="cy"
      :rx="radius * 1.55"
      :ry="radius * 0.36"
      fill="none"
      :stroke="ringStroke"
      stroke-width="3"
      :transform="`rotate(-16 50 ${cy})`"
    />
    <circle v-if="m" :cx="moonX" :cy="moonY" :r="moonR" :fill="`url(#${moonId})`" />
  </svg>
</template>

<style scoped>
.bd-planet { width: 100%; height: auto; overflow: visible; }
</style>
