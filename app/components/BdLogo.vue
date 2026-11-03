<script setup lang="ts">
/** The mark (planet rising over the horizon) and optional wordmark. */
withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg'
  markOnly?: boolean
}>(), {
  size: 'md',
  markOnly: false
})

const uid = useId()
</script>

<template>
  <span class="bd-logo" :class="`bd-logo--${size}`">
    <svg class="bd-logo__mark" viewBox="0 0 132 100" aria-hidden="true">
      <defs>
        <linearGradient :id="`lg-t-${uid}`" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0.58" stop-color="#E2614A" />
          <stop offset="0.58" stop-color="#B8432F" />
        </linearGradient>
        <linearGradient :id="`lg-c-${uid}`" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0.58" stop-color="#2F5BEA" />
          <stop offset="0.58" stop-color="#1E3FB5" />
        </linearGradient>
        <clipPath :id="`lg-h-${uid}`"><rect x="0" y="0" width="132" height="86" /></clipPath>
      </defs>
      <path d="M14 86 a52 52 0 0 1 104 0" fill="none" stroke="#F2A93B" stroke-width="4" stroke-linecap="round" opacity="0.7" />
      <circle cx="66" cy="86" r="38" :fill="`url(#lg-t-${uid})`" :clip-path="`url(#lg-h-${uid})`" />
      <line x1="4" y1="86" x2="128" y2="86" stroke="var(--bd-ink)" stroke-width="5" stroke-linecap="round" />
      <circle cx="112" cy="30" r="10" :fill="`url(#lg-c-${uid})`" />
    </svg>
    <span v-if="!markOnly" class="bd-logo__word">brain<span class="bd-serif-italic">dump</span></span>
    <span v-else class="bd-sr-only">Brain Dump</span>
  </span>
</template>

<style scoped>
.bd-logo { display: inline-flex; align-items: center; gap: 0.45em; color: var(--bd-ink); }
.bd-logo__mark { width: 1.75em; height: auto; flex: none; }
.bd-logo__word { font-weight: 400; letter-spacing: -0.045em; line-height: 1; }
.bd-logo--sm { font-size: 20px; }
.bd-logo--md { font-size: 26px; }
.bd-logo--lg { font-size: clamp(56px, 9vw, 108px); }
.bd-logo--lg .bd-logo__mark { width: 1.2em; }
</style>
