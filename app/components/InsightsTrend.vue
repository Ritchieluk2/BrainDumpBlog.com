<script setup lang="ts">
/**
 * Light vs. heavy over time: one line, one point per morning.
 * Hover or focus a point to see its date and leading feeling; each point links to its entry.
 */
import { MOODS, PLANET_COLORS, type Mood } from '#shared/utils/cosmos'

const props = defineProps<{
  points: { id: string; date: string; valence: number; mood: Mood }[]
}>()

const W = 720
const H = 240
const PAD = { left: 72, right: 20, top: 18, bottom: 34 }

const dayNum = (iso: string) => Math.round(parseIsoDate(iso).getTime() / 86_400_000)

const geom = computed(() => {
  const pts = props.points
  const d0 = dayNum(pts[0]!.date)
  const d1 = Math.max(dayNum(pts[pts.length - 1]!.date), d0 + 1)
  const x = (iso: string) => PAD.left + ((dayNum(iso) - d0) / (d1 - d0)) * (W - PAD.left - PAD.right)
  const y = (v: number) => PAD.top + ((1 - v) / 2) * (H - PAD.top - PAD.bottom)
  const placed = pts.map((p) => ({ ...p, x: x(p.date), y: y(Math.max(-1, Math.min(1, p.valence))) }))
  const path = placed.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  return { placed, path, y0: y(0), yTop: y(1), yBottom: y(-1) }
})

const active = ref<number | null>(null)
const activePoint = computed(() => (active.value === null ? null : geom.value.placed[active.value] ?? null))

const describe = (v: number) => (v > 0.25 ? 'lighter' : v < -0.25 ? 'heavier' : 'about even')
const shortDate = (iso: string) => formatIsoDate(iso, { month: 'short', day: 'numeric' })
</script>

<template>
  <figure class="trend">
    <div class="trend__plot">
      <svg :viewBox="`0 0 ${W} ${H}`" role="img" aria-label="Line chart of how light or heavy each morning felt. A table version follows.">
        <!-- recessive axes -->
        <line :x1="PAD.left" :x2="W - PAD.right" :y1="geom.y0" :y2="geom.y0" stroke="var(--bd-line-strong)" stroke-width="1" stroke-dasharray="4 4" />
        <line :x1="PAD.left" :x2="W - PAD.right" :y1="geom.yTop" :y2="geom.yTop" stroke="var(--bd-line)" stroke-width="1" />
        <line :x1="PAD.left" :x2="W - PAD.right" :y1="geom.yBottom" :y2="geom.yBottom" stroke="var(--bd-line)" stroke-width="1" />
        <text :x="PAD.left - 12" :y="geom.yTop + 4" text-anchor="end" class="trend__axis">Lighter</text>
        <text :x="PAD.left - 12" :y="geom.y0 + 4" text-anchor="end" class="trend__axis">Even</text>
        <text :x="PAD.left - 12" :y="geom.yBottom + 4" text-anchor="end" class="trend__axis">Heavier</text>
        <text :x="PAD.left" :y="H - 8" class="trend__axis">{{ shortDate(points[0]!.date) }}</text>
        <text :x="W - PAD.right" :y="H - 8" text-anchor="end" class="trend__axis">{{ shortDate(points[points.length - 1]!.date) }}</text>

        <!-- crosshair -->
        <line
          v-if="activePoint"
          :x1="activePoint.x"
          :x2="activePoint.x"
          :y1="geom.yTop"
          :y2="geom.yBottom"
          stroke="var(--bd-ink-3)"
          stroke-width="1"
        />

        <path :d="geom.path" fill="none" stroke="var(--bd-ink)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />

        <g v-for="(p, i) in geom.placed" :key="p.id">
          <circle
            :cx="p.x"
            :cy="p.y"
            :r="active === i ? 7 : 5"
            :fill="PLANET_COLORS[MOODS[p.mood].color].lit"
            stroke="var(--bd-surface)"
            stroke-width="2"
          />
          <a
            :href="`/journal/${p.id}`"
            :aria-label="`${formatIsoDate(p.date)}: mostly ${MOODS[p.mood].label}, ${describe(p.valence)}`"
            @mouseenter="active = i"
            @mouseleave="active = null"
            @focus="active = i"
            @blur="active = null"
          >
            <circle :cx="p.x" :cy="p.y" r="16" fill="transparent" />
          </a>
        </g>
      </svg>

      <div
        v-if="activePoint"
        class="trend__tip"
        :style="{ left: `${(activePoint.x / W) * 100}%`, top: `${(activePoint.y / H) * 100}%` }"
        role="presentation"
      >
        <strong>{{ formatIsoDate(activePoint.date, { weekday: 'short', month: 'short', day: 'numeric' }) }}</strong>
        <span class="trend__tip-mood"><BdMoodIcon :mood="activePoint.mood" :size="18" /> mostly {{ MOODS[activePoint.mood].label }}</span>
        <span class="bd-muted">Felt {{ describe(activePoint.valence) }}</span>
      </div>
    </div>

    <details class="trend__table">
      <summary>Show as a table</summary>
      <table>
        <thead><tr><th scope="col">Date</th><th scope="col">Leading feeling</th><th scope="col">Light or heavy</th></tr></thead>
        <tbody>
          <tr v-for="p in points" :key="p.id">
            <td>{{ formatIsoDate(p.date, { weekday: 'short', month: 'short', day: 'numeric' }) }}</td>
            <td>{{ MOODS[p.mood].label }}</td>
            <td>{{ describe(p.valence) }} ({{ p.valence > 0 ? '+' : '' }}{{ p.valence.toFixed(2) }})</td>
          </tr>
        </tbody>
      </table>
    </details>
  </figure>
</template>

<style scoped>
.trend { margin: 0; display: flex; flex-direction: column; gap: var(--bd-space-3); }
.trend__plot { position: relative; }
.trend__plot svg { width: 100%; height: auto; display: block; overflow: visible; }
.trend__axis { font-size: 12px; fill: var(--bd-ink-3); font-family: var(--bd-font-sans); }
.trend__plot a { cursor: pointer; outline: none; }
.trend__plot a:focus-visible circle { stroke: var(--bd-cobalt); stroke-width: 2; }
.trend__tip {
  position: absolute;
  transform: translate(-50%, calc(-100% - 14px));
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  background: var(--bd-surface);
  border-radius: var(--bd-radius-sm);
  box-shadow: var(--bd-shadow-soft);
  font-size: 13px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 2;
}
.trend__tip-mood { display: flex; align-items: center; gap: 6px; }
.trend__table summary { font-size: var(--bd-text-sm); color: var(--bd-ink-2); cursor: pointer; padding-block: 10px; }
.trend__table table { width: 100%; border-collapse: collapse; font-size: var(--bd-text-sm); }
.trend__table th, .trend__table td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--bd-line); }
.trend__table th { font-weight: 500; color: var(--bd-ink-2); }
</style>
