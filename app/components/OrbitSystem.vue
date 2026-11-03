<script setup lang="ts">
/**
 * A week of dumps arranged as a little solar system. The biggest
 * (most words) sits at the center; the rest are spread around two orbits.
 */
// Unused (kept from the first design pass). Safe to delete.
import { MOODS, PLANET_COLORS, type PlanetColor } from '#shared/utils/moods'
import { planetRadius, type Dump } from '~/data/sampleDumps'

const props = defineProps<{ dumps: Dump[] }>()

const uid = useId()

const bodies = computed(() => {
  const sorted = [...props.dumps].sort((a, b) => b.words - a.words).slice(0, 8)
  return sorted.map((d, i) => {
    const color = (Object.keys(PLANET_COLORS) as PlanetColor[]).find((k) => PLANET_COLORS[k].lit === MOODS[d.primary].color) ?? 'cobalt'
    if (i === 0) return { id: d.id, x: 200, y: 200, r: 58, color, ring: d.primary === 'anxious' }
    const orbit = i % 2 === 1 ? 168 : 110
    const angle = (i * 137.5 * Math.PI) / 180 // golden angle spreads them evenly
    const r = Math.round(planetRadius(d.words) * 0.7)
    return {
      id: d.id,
      x: Math.round(200 + Math.cos(angle) * orbit),
      y: Math.round(200 + Math.sin(angle) * orbit),
      r,
      color,
      ring: d.primary === 'anxious'
    }
  })
})

const shades: Record<PlanetColor, [string, string]> = {
  terracotta: ['#E2614A', '#B8432F'],
  marigold: ['#F2A93B', '#CC8418'],
  saffron: ['#F6CF4A', '#D6A91E'],
  teal: ['#1FA39B', '#127B75'],
  cobalt: ['#2F5BEA', '#1E3FB5'],
  plum: ['#8A4FBF', '#673495'],
  magenta: ['#D94F8C', '#AE3369']
}
</script>

<template>
  <svg viewBox="0 0 400 400" role="img" aria-label="Your recent mornings shown as planets orbiting together" class="orbit">
    <defs>
      <linearGradient v-for="(pair, name) in shades" :id="`${uid}-${name}`" :key="name" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0.58" :stop-color="pair[0]" />
        <stop offset="0.58" :stop-color="pair[1]" />
      </linearGradient>
    </defs>
    <circle cx="200" cy="200" r="168" fill="none" stroke="var(--bd-line)" stroke-width="1.5" />
    <circle cx="200" cy="200" r="110" fill="none" stroke="var(--bd-line)" stroke-width="1.5" />
    <g class="orbit__bodies">
      <g v-for="b in bodies" :key="b.id">
        <circle :cx="b.x" :cy="b.y" :r="b.r" :fill="`url(#${uid}-${b.color})`" />
        <ellipse
          v-if="b.ring"
          :cx="b.x"
          :cy="b.y"
          :rx="b.r * 1.7"
          :ry="b.r * 0.42"
          fill="none"
          :stroke="shades[b.color][1]"
          stroke-width="2.5"
          :transform="`rotate(-20 ${b.x} ${b.y})`"
        />
      </g>
    </g>
  </svg>
</template>

<style scoped>
.orbit { width: 100%; max-width: 440px; height: auto; overflow: visible; }
.orbit__bodies { filter: var(--bd-shadow-planet); }
</style>
