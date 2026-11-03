<script setup lang="ts">
/**
 * Pick a color and a shape for each feeling. Changes apply right away
 * everywhere (and save to the account when signed in).
 */
import {
  COLOR_SETS,
  DEFAULT_MOOD_MAP,
  MOODS,
  MOOD_KEYS,
  SHAPES,
  SWATCHES,
  isDefaultMoodMap,
  luminance,
  swatchLabel,
  type Mood
} from '#shared/utils/moods'

withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })

const { moods, setMood } = usePreferences()
const open = ref<Mood | null>(null)
const uid = useId()

const activeSet = computed(() =>
  COLOR_SETS.find((s) => MOOD_KEYS.every((m) => s.colors[m].toUpperCase() === moods.value[m].color))?.id ?? null
)

function applySet(id: string) {
  const set = COLOR_SETS.find((s) => s.id === id)
  if (!set) return
  moods.value = Object.fromEntries(MOOD_KEYS.map((m) => [m, { ...moods.value[m], color: set.colors[m].toUpperCase() }])) as typeof moods.value
}

function resetAll() {
  moods.value = DEFAULT_MOOD_MAP
}

const isDefault = computed(() => isDefaultMoodMap(moods.value))
const shapeLabel = (id: string) => SHAPES.find((s) => s.id === id)?.label ?? id
const isSwatch = (hex: string) => SWATCHES.some((s) => s.lit === hex)

/** Gentle warnings: lookalikes and colors that vanish on one of the backgrounds. */
const notes = computed(() => {
  const out = {} as Record<Mood, string[]>
  for (const m of MOOD_KEYS) {
    const me = moods.value[m]
    const list: string[] = []
    const twins = MOOD_KEYS.filter((o) => o !== m && moods.value[o].color === me.color && moods.value[o].shape === me.shape)
    const sameColor = MOOD_KEYS.filter((o) => o !== m && moods.value[o].color === me.color && moods.value[o].shape !== me.shape)
    if (twins.length) list.push(`Looks exactly like ${twins.map((t) => MOODS[t].label).join(' and ')}, so you won't be able to tell them apart.`)
    else if (sameColor.length) list.push(`Shares its color with ${sameColor.map((t) => MOODS[t].label).join(' and ')}. The shape still tells them apart.`)
    const lum = luminance(me.color)
    if (lum > 0.78) list.push('Very light, so it may be hard to see on the light background.')
    if (lum < 0.035) list.push('Very dark, so it may be hard to see in Night mode.')
    out[m] = list
  }
  return out
})
const hasTwins = computed(() => MOOD_KEYS.some((m) => notes.value[m].some((n) => n.startsWith('Looks exactly'))))

function toggle(m: Mood) {
  open.value = open.value === m ? null : m
}
</script>

<template>
  <div class="mme" :class="{ 'mme--compact': compact }">
    <fieldset class="mme__sets">
      <legend class="mme__legend">Start from a color set</legend>
      <div class="sets">
        <label v-for="s in COLOR_SETS" :key="s.id" class="set" :class="{ 'is-on': activeSet === s.id }">
          <input type="radio" class="bd-sr-only" :name="`${uid}-set`" :value="s.id" :checked="activeSet === s.id" @change="applySet(s.id)">
          <span class="set__dots" aria-hidden="true">
            <span v-for="m in MOOD_KEYS" :key="m" :style="{ background: s.colors[m] }" />
          </span>
          <span class="set__label">{{ s.label }}</span>
          <span class="set__desc">{{ s.description }}</span>
        </label>
      </div>
      <p class="mme__hint bd-muted">Sets change colors only. Your shapes stay as they are.</p>
    </fieldset>

    <div class="mme__list-head">
      <p class="mme__legend">Each feeling</p>
      <button v-if="!isDefault" type="button" class="mme__reset" @click="resetAll">Reset all to default</button>
    </div>
    <p v-if="hasTwins" class="mme__warn" role="status">Two feelings look identical. Give one a different color or shape.</p>

    <ul class="mme__list">
      <li v-for="m in MOOD_KEYS" :key="m" class="mood" :class="{ 'is-open': open === m }">
        <button
          type="button"
          class="mood__row"
          :aria-expanded="open === m"
          :aria-controls="`${uid}-${m}`"
          @click="toggle(m)"
        >
          <BdMoodIcon :mood="m" :size="40" />
          <span class="mood__text">
            <span class="mood__name">{{ MOODS[m].label }}</span>
            <span class="mood__look">{{ swatchLabel(moods[m].color) }} · {{ shapeLabel(moods[m].shape) }}</span>
          </span>
          <span v-if="notes[m].length" class="mood__flag" aria-label="Has a note">!</span>
          <span class="mood__edit">{{ open === m ? 'Done' : 'Change' }}</span>
        </button>

        <div v-if="open === m" :id="`${uid}-${m}`" class="mood__panel">
          <fieldset class="pick">
            <legend class="pick__legend">Color for {{ MOODS[m].label }}</legend>
            <div class="swatches">
              <label v-for="s in SWATCHES" :key="s.id" class="swatch" :class="{ 'is-on': moods[m].color === s.lit }" :title="s.label">
                <input type="radio" class="bd-sr-only" :name="`${uid}-${m}-color`" :value="s.lit" :checked="moods[m].color === s.lit" @change="setMood(m, { color: s.lit })">
                <span class="swatch__chip" :style="{ background: `linear-gradient(135deg, ${s.lit} 58%, ${s.shade} 58%)` }" aria-hidden="true" />
                <span class="bd-sr-only">{{ s.label }}</span>
              </label>
              <label class="swatch swatch--custom" :class="{ 'is-on': !isSwatch(moods[m].color) }" title="Pick any color">
                <input
                  type="color"
                  class="swatch__native"
                  :value="moods[m].color.toLowerCase()"
                  :aria-label="`Any color for ${MOODS[m].label}`"
                  @change="setMood(m, { color: ($event.target as HTMLInputElement).value.toUpperCase() })"
                >
                <span class="swatch__chip swatch__chip--custom" :style="!isSwatch(moods[m].color) ? { background: moods[m].color } : undefined" aria-hidden="true">+</span>
              </label>
            </div>
          </fieldset>

          <fieldset class="pick">
            <legend class="pick__legend">Shape for {{ MOODS[m].label }}</legend>
            <div class="shapes">
              <label v-for="s in SHAPES" :key="s.id" class="shape" :class="{ 'is-on': moods[m].shape === s.id }">
                <input type="radio" class="bd-sr-only" :name="`${uid}-${m}-shape`" :value="s.id" :checked="moods[m].shape === s.id" @change="setMood(m, { shape: s.id })">
                <BdMoodIcon :mood="m" :size="34" :look="{ color: moods[m].color, shape: s.id }" />
                <span class="shape__label">{{ s.label }}</span>
              </label>
            </div>
          </fieldset>

          <ul v-if="notes[m].length" class="mood__notes">
            <li v-for="n in notes[m]" :key="n">{{ n }}</li>
          </ul>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.mme { display: flex; flex-direction: column; gap: var(--bd-space-4); }
.mme__sets { border: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--bd-space-3); }
.mme__legend { font-size: var(--bd-text-lg); font-weight: 500; padding: 0; }
.mme__hint { font-size: var(--bd-text-xs); }
.mme__list-head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--bd-space-3); margin-top: var(--bd-space-3); }
.mme__reset { font: inherit; font-size: var(--bd-text-sm); color: var(--bd-ink-2); background: none; border: none; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; padding: 10px 0; min-height: 44px; }
.mme__warn { font-size: var(--bd-text-sm); color: var(--bd-terracotta-dark); }

.sets { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 150px), 1fr)); gap: var(--bd-space-2); }
.mme--compact .sets { grid-template-columns: repeat(auto-fill, minmax(min(100%, 130px), 1fr)); }
.set {
  display: flex; flex-direction: column; gap: 4px;
  padding: 12px; border-radius: var(--bd-radius-md);
  border: 2px solid var(--bd-line-strong); background: var(--bd-surface); cursor: pointer;
}
.set.is-on { border-color: var(--bd-ink); }
.set:focus-within { outline: 2px solid var(--bd-cobalt); outline-offset: 3px; }
.set__dots { display: flex; gap: 3px; margin-bottom: 4px; }
.set__dots span { width: 14px; height: 14px; border-radius: 50%; }
.set__label { font-weight: 500; font-size: var(--bd-text-sm); }
.set__desc { font-size: 12px; color: var(--bd-ink-3); line-height: 1.35; }

.mme__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; border-top: 1px solid var(--bd-line); }
.mood { border-bottom: 1px solid var(--bd-line); }
.mood__row {
  width: 100%; display: grid; grid-template-columns: 40px minmax(0, 1fr) auto auto; align-items: center; gap: var(--bd-space-3);
  padding: 10px 4px; min-height: 60px; font: inherit; color: inherit; text-align: left; background: none; border: none; cursor: pointer;
}
.mood__row:hover .mood__edit { color: var(--bd-ink); }
.mood__text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.mood__name { font-weight: 500; text-transform: capitalize; }
.mood__look { font-size: var(--bd-text-xs); color: var(--bd-ink-3); }
.mood__flag { width: 20px; height: 20px; border-radius: 50%; background: var(--bd-marigold); color: #221D1A; font-size: 12px; font-weight: 600; display: grid; place-items: center; }
.mood__edit { font-size: var(--bd-text-sm); color: var(--bd-ink-2); text-decoration: underline; text-underline-offset: 3px; }
.mood__panel { display: flex; flex-direction: column; gap: var(--bd-space-4); padding: 4px 4px var(--bd-space-5); }
.mood__notes { margin: 0; padding-left: 1.1em; font-size: var(--bd-text-sm); color: var(--bd-ink-2); display: flex; flex-direction: column; gap: 4px; }

.pick { border: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--bd-space-2); }
.pick__legend { font-size: var(--bd-text-xs); color: var(--bd-ink-3); text-transform: uppercase; letter-spacing: var(--bd-tracking-label); padding: 0; margin-bottom: 4px; }

.swatches { display: grid; grid-template-columns: repeat(auto-fill, 44px); gap: 6px; }
.swatch { position: relative; width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; cursor: pointer; border: 2px solid transparent; }
.swatch.is-on { border-color: var(--bd-ink); }
.swatch:focus-within { outline: 2px solid var(--bd-cobalt); outline-offset: 2px; }
.swatch__chip { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; }
.swatch__chip--custom { border: 1.5px dashed var(--bd-ink-3); color: var(--bd-ink-2); font-size: 18px; line-height: 1; background: conic-gradient(from 0deg, #E2614A, #F6CF4A, #8DB07A, #5AB4E5, #8A4FBF, #D94F8C, #E2614A); color: #fff; text-shadow: 0 0 3px rgba(0,0,0,0.5); }
.swatch__native { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; border: none; padding: 0; }

.shapes { display: grid; grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); gap: 6px; }
.shape {
  display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px 4px;
  border-radius: var(--bd-radius-sm); border: 2px solid var(--bd-line); background: var(--bd-surface); cursor: pointer;
}
.shape.is-on { border-color: var(--bd-ink); }
.shape:focus-within { outline: 2px solid var(--bd-cobalt); outline-offset: 2px; }
.shape__label { font-size: 12px; color: var(--bd-ink-2); }
</style>
