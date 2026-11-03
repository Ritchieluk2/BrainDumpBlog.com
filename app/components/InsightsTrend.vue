<script setup lang="ts">
/**
 * Light vs. heavy over time: one line, one point per morning.
 *
 * Drawn at the container's real pixel width, so labels stay readable on a
 * phone. Hover (mouse), tap (touch) or arrow keys pick a morning; the tooltip
 * has a link to open that entry.
 */
import { MOODS, tone, type Mood } from '#shared/utils/moods'

const props = defineProps<{
  points: { id: string; date: string; valence: number; mood: Mood }[]
}>()

const { moods: moodMap } = usePreferences()
const box = ref<HTMLElement | null>(null)
const width = ref(720)
let ro: ResizeObserver | undefined
onMounted(() => {
  if (!box.value) return
  width.value = Math.max(260, Math.round(box.value.clientWidth))
  ro = new ResizeObserver(([e]) => { if (e) width.value = Math.max(260, Math.round(e.contentRect.width)) })
  ro.observe(box.value)
})
onBeforeUnmount(() => ro?.disconnect())

const narrow = computed(() => width.value < 480)
const H = computed(() => (narrow.value ? 200 : 240))
const PAD = computed(() => ({ left: narrow.value ? 58 : 72, right: 12, top: 16, bottom: 30 }))

const dayNum = (iso: string) => Math.round(parseIsoDate(iso).getTime() / 86_400_000)

const geom = computed(() => {
  const pts = props.points
  const W = width.value
  const pad = PAD.value
  const d0 = dayNum(pts[0]!.date)
  const d1 = Math.max(dayNum(pts[pts.length - 1]!.date), d0 + 1)
  const x = (iso: string) => pad.left + ((dayNum(iso) - d0) / (d1 - d0)) * (W - pad.left - pad.right)
  const y = (v: number) => pad.top + ((1 - v) / 2) * (H.value - pad.top - pad.bottom)
  const placed = pts.map((p) => ({ ...p, x: x(p.date), y: y(Math.max(-1, Math.min(1, p.valence))) }))
  const path = placed.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  return { placed, path, y0: y(0), yTop: y(1), yBottom: y(-1), W }
})

const active = ref<number | null>(null)
const pinned = ref(false) // set by tap/click/keys; hover only previews
const activePoint = computed(() => (active.value === null ? null : geom.value.placed[active.value] ?? null))

function hover(i: number | null) {
  if (!pinned.value) active.value = i
}
function pick(i: number) {
  if (pinned.value && active.value === i) {
    pinned.value = false
    active.value = null
  } else {
    pinned.value = true
    active.value = i
  }
}
// Pointer handling: mouse hovers to preview and clicks to pin; a finger
// taps to pick and can drag sideways to scrub between mornings.
const dragging = ref(false)
function nearest(clientX: number): number {
  const rect = box.value?.getBoundingClientRect()
  if (!rect) return 0
  const x = clientX - rect.left
  let best = 0
  let bestD = Infinity
  geom.value.placed.forEach((p, i) => {
    const d = Math.abs(p.x - x)
    if (d < bestD) { bestD = d; best = i }
  })
  return best
}
function onDown(e: PointerEvent) {
  const i = nearest(e.clientX)
  if (e.pointerType === 'mouse') {
    pick(i)
  } else {
    dragging.value = true
    pinned.value = true
    active.value = i
  }
}
function onMove(e: PointerEvent) {
  const i = nearest(e.clientX)
  if (e.pointerType === 'mouse') hover(i)
  else if (dragging.value) active.value = i
}
function onUp() { dragging.value = false }
function onLeave(e: PointerEvent) {
  if (e.pointerType === 'mouse') hover(null)
}

function onKey(e: KeyboardEvent) {
  const n = props.points.length
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    e.preventDefault()
    const cur = active.value ?? (e.key === 'ArrowRight' ? -1 : n)
    active.value = Math.min(n - 1, Math.max(0, cur + (e.key === 'ArrowRight' ? 1 : -1)))
    pinned.value = true
  } else if (e.key === 'Enter' && activePoint.value) {
    navigateTo(`/journal/${activePoint.value.id}`)
  } else if (e.key === 'Escape') {
    active.value = null
    pinned.value = false
  }
}

// keep the tooltip on screen near the edges
const tipStyle = computed(() => {
  const p = activePoint.value
  if (!p) return {}
  const W = geom.value.W
  const shift = p.x < 90 ? '0%' : p.x > W - 90 ? '-100%' : '-50%'
  const below = p.y < 70
  return {
    left: `${p.x}px`,
    top: `${p.y}px`,
    transform: `translate(${shift}, ${below ? '16px' : 'calc(-100% - 14px)'})`
  }
})

const describe = (v: number) => (v > 0.25 ? 'lighter' : v < -0.25 ? 'heavier' : 'about even')
const shortDate = (iso: string) => formatIsoDate(iso, { month: 'short', day: 'numeric' })
</script>

<template>
  <figure class="trend">
    <div ref="box" class="trend__plot">
      <svg
        :width="geom.W"
        :height="H"
        :viewBox="`0 0 ${geom.W} ${H}`"
        role="application"
        tabindex="0"
        aria-label="Chart of how light or heavy each morning felt. Use the left and right arrow keys to move between mornings, Enter to open one. A table version follows."
        @keydown="onKey"
        @pointerdown="onDown"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="onUp"
        @pointerleave="onLeave"
      >
        <line :x1="PAD.left" :x2="geom.W - PAD.right" :y1="geom.y0" :y2="geom.y0" stroke="var(--bd-line-strong)" stroke-width="1" stroke-dasharray="4 4" />
        <line :x1="PAD.left" :x2="geom.W - PAD.right" :y1="geom.yTop" :y2="geom.yTop" stroke="var(--bd-line)" stroke-width="1" />
        <line :x1="PAD.left" :x2="geom.W - PAD.right" :y1="geom.yBottom" :y2="geom.yBottom" stroke="var(--bd-line)" stroke-width="1" />
        <text :x="PAD.left - 10" :y="geom.yTop + 4" text-anchor="end" class="trend__axis">Lighter</text>
        <text :x="PAD.left - 10" :y="geom.y0 + 4" text-anchor="end" class="trend__axis">Even</text>
        <text :x="PAD.left - 10" :y="geom.yBottom + 4" text-anchor="end" class="trend__axis">Heavier</text>
        <text :x="PAD.left" :y="H - 8" class="trend__axis">{{ shortDate(points[0]!.date) }}</text>
        <text :x="geom.W - PAD.right" :y="H - 8" text-anchor="end" class="trend__axis">{{ shortDate(points[points.length - 1]!.date) }}</text>

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

        <circle
          v-for="(p, i) in geom.placed"
          :key="p.id"
          :cx="p.x"
          :cy="p.y"
          :r="active === i ? 7 : narrow ? 4.5 : 5"
          :fill="tone(moodMap[p.mood].color).lit"
          stroke="var(--bd-surface)"
          stroke-width="2"
        />


      </svg>

      <div v-if="activePoint" class="trend__tip" :style="tipStyle">
        <strong>{{ formatIsoDate(activePoint.date, { weekday: 'short', month: 'short', day: 'numeric' }) }}</strong>
        <span class="trend__tip-mood"><BdMoodIcon :mood="activePoint.mood" :size="18" /> mostly {{ MOODS[activePoint.mood].label }}</span>
        <span class="bd-muted">Felt {{ describe(activePoint.valence) }}</span>
        <NuxtLink :to="`/journal/${activePoint.id}`" class="trend__open">Open entry →</NuxtLink>
      </div>
    </div>
    <p class="trend__hint bd-muted">{{ narrow ? 'Tap a morning to see it.' : 'Hover or select a morning to see it.' }}</p>

    <details class="trend__table">
      <summary>Show as a table</summary>
      <div class="trend__table-scroll">
        <table>
          <thead><tr><th scope="col">Date</th><th scope="col">Leading feeling</th><th scope="col">Light or heavy</th></tr></thead>
          <tbody>
            <tr v-for="p in points" :key="p.id">
              <td><NuxtLink :to="`/journal/${p.id}`">{{ formatIsoDate(p.date, { weekday: 'short', month: 'short', day: 'numeric' }) }}</NuxtLink></td>
              <td>{{ MOODS[p.mood].label }}</td>
              <td>{{ describe(p.valence) }} ({{ p.valence > 0 ? '+' : '' }}{{ p.valence.toFixed(2) }})</td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>
  </figure>
</template>

<style scoped>
.trend { margin: 0; display: flex; flex-direction: column; gap: var(--bd-space-2); }
.trend__plot { position: relative; width: 100%; }
.trend__plot svg { display: block; overflow: visible; touch-action: pan-y; }
.trend__plot svg:focus-visible { outline: 2px solid var(--bd-cobalt); outline-offset: 4px; border-radius: 8px; }
.trend__axis { font-size: 12px; fill: var(--bd-ink-3); font-family: var(--bd-font-sans); }
.trend__plot svg { cursor: pointer; }
.trend__tip {
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  background: var(--bd-surface);
  border-radius: var(--bd-radius-sm);
  box-shadow: var(--bd-shadow-soft);
  font-size: 13px;
  white-space: nowrap;
  z-index: 2;
}
.trend__tip-mood { display: flex; align-items: center; gap: 6px; }
.trend__open { margin-top: 4px; padding-block: 6px; font-weight: 500; }
.trend__hint { font-size: 13px; }
.trend__table summary { font-size: var(--bd-text-sm); color: var(--bd-ink-2); cursor: pointer; padding-block: 12px; }
.trend__table-scroll { overflow-x: auto; }
.trend__table table { width: 100%; border-collapse: collapse; font-size: var(--bd-text-sm); }
.trend__table th, .trend__table td { text-align: left; padding: 10px; border-bottom: 1px solid var(--bd-line); white-space: nowrap; }
.trend__table th { font-weight: 500; color: var(--bd-ink-2); }
.trend__table td a { display: inline-block; padding-block: 10px; }
.trend__table td { padding-block: 0; }
</style>
