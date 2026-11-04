<script setup lang="ts">
/**
 * The mark (the sleepy brain over the horizon) and optional wordmark.
 * The mark changes with the reader's time of day: morning, noon, evening, night.
 * Artwork lives in app/assets/logos/ (from the logo kit).
 */
import morning from '~/assets/logos/brain-dump-morning.svg?raw'
import noon from '~/assets/logos/brain-dump-noon.svg?raw'
import evening from '~/assets/logos/brain-dump-evening.svg?raw'
import night from '~/assets/logos/brain-dump-night.svg?raw'
import type { SkyScene } from '#shared/utils/sky-scene'

const props = withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg'
  markOnly?: boolean
  /** Show this scene instead of the current one (styleguide). */
  scene?: SkyScene
}>(), {
  size: 'md',
  markOnly: false,
  scene: undefined
})

const ART: Record<SkyScene, string> = { morning, noon, evening, night }

const current = useSkyScene()
const uid = useId()
const scene = computed(() => props.scene ?? current.value)

/** The kit's SVG, with ids made unique to this instance and its own title removed (the wordmark or the screen-reader text below names it). */
const mark = computed(() =>
  ART[scene.value]
    .replace(/<title[^>]*>[\s\S]*?<\/title>/, '')
    .replace(/\s(role|aria-labelledby)="[^"]*"/g, '')
    .replace(/<svg /, '<svg aria-hidden="true" focusable="false" class="bd-logo__svg" ')
    .replace(/\bbd\d+-/g, `bd-${uid}-`)
    // The night scene's "z z" is drawn near-white for a dark page; let it follow the page ink like the horizon.
    .replace(/stroke="#FAF9F7"/g, 'stroke="var(--bd-night-ink, #FAF9F7)"')
)
</script>

<template>
  <span class="bd-logo" :class="[`bd-logo--${size}`, `bd-logo--${scene}`]" :data-scene="scene">
    <!-- eslint-disable-next-line vue/no-v-html -- our own bundled logo artwork -->
    <span class="bd-logo__mark" v-html="mark" />
    <span v-if="!markOnly" class="bd-logo__word">brain<span class="bd-serif-italic">dump</span></span>
    <span v-else class="bd-sr-only">Brain Dump</span>
  </span>
</template>

<style scoped>
.bd-logo {
  display: inline-flex;
  align-items: center;
  gap: 0.35em;
  color: var(--bd-ink);
  /* The night artwork expects a dark page; on a light page its horizon and z's use the normal ink. */
  --bd-night-ink: var(--bd-ink);
}
.bd-logo__mark { width: 2.2em; flex: none; display: block; line-height: 0; }
.bd-logo__mark :deep(svg) { width: 100%; height: auto; display: block; overflow: visible; }
.bd-logo__word { font-weight: 400; letter-spacing: -0.045em; line-height: 1; }
.bd-logo--sm { font-size: 20px; }
.bd-logo--md { font-size: 26px; }
.bd-logo--lg { font-size: clamp(56px, 9vw, 108px); }
.bd-logo--lg .bd-logo__mark { width: 1.5em; }
</style>
