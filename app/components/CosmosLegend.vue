<script setup lang="ts">
/** Explains what's in a solar system: the feelings, then any comets, nebulae, etc. */
import { AFFECT_FEATURES, rankedMoods, type Affect } from '#shared/utils/cosmos'
import { MOODS } from '#shared/utils/moods'

const props = withDefaults(defineProps<{ affect: Affect; showAll?: boolean }>(), { showAll: false })

const moods = computed(() => rankedMoods(props.affect).slice(0, 6))
const features = computed(() =>
  AFFECT_FEATURES.map((f) => ({ ...f, value: props.affect[f.key] as number }))
    .filter((f) => props.showAll || f.value > 0.15)
)

const pct = (v: number) => `${Math.round(v * 100)}%`
</script>

<template>
  <div class="legend">
    <div class="legend__group">
      <p class="bd-label">Feelings</p>
      <ul class="legend__moods">
        <li v-for="([mood, value], i) in moods" :key="mood">
          <BdMoodIcon :mood="mood" :size="32" />
          <span class="legend__name">{{ MOODS[mood].label }}</span>
          <span class="legend__role">{{ i === 0 ? 'the star' : 'a planet' }}</span>
          <span class="legend__bar" aria-hidden="true"><span :style="{ width: pct(value) }" /></span>
        </li>
      </ul>
    </div>

    <div v-if="features.length" class="legend__group">
      <p class="bd-label">Also in this sky</p>
      <ul class="legend__features">
        <li v-for="f in features" :key="f.key">
          <CosmosGlyph :feature="f.key" />
          <span class="legend__name">{{ f.body }}</span>
          <span class="legend__role">{{ f.meaning }}</span>
          <span class="legend__bar" aria-hidden="true"><span :style="{ width: pct(f.value) }" /></span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.legend { display: flex; flex-direction: column; gap: var(--bd-space-5); }
.legend__group { display: flex; flex-direction: column; gap: var(--bd-space-3); }
.legend__moods, .legend__features { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--bd-space-2); }
.legend li {
  display: grid;
  grid-template-columns: 32px minmax(0, 7.5rem) minmax(0, 1fr) 64px;
  align-items: center;
  gap: var(--bd-space-3);
  font-size: var(--bd-text-sm);
}
.legend__name { font-weight: 500; text-transform: capitalize; }
.legend__role { color: var(--bd-ink-3); }
.legend__bar { height: 6px; border-radius: 3px; background: var(--bd-line); overflow: hidden; }
.legend__bar span { display: block; height: 100%; background: var(--bd-ink-2); border-radius: 3px; }
.legend__glyph { flex: none; }
@media (max-width: 480px) {
  .legend li { grid-template-columns: 32px 1fr 56px; }
  .legend__role { display: none; }
}
</style>
