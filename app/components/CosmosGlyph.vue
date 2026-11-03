<script setup lang="ts">
/** Small icon for a sky feature: comet, asteroid belt, nebula, wormhole or sparkles. */
withDefaults(defineProps<{ feature: string; size?: number }>(), { size: 32 })
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 32 32" aria-hidden="true" class="glyph">
    <template v-if="feature === 'racing'">
      <path d="M26 6 L8 22 L10 25 Z" fill="#E2614A" opacity="0.35" />
      <circle cx="24" cy="8" r="3.5" fill="#E2614A" />
    </template>
    <template v-else-if="feature === 'scattered'">
      <polygon points="6,14 9,11 12,13 11,17 7,17" fill="#9C948B" />
      <polygon points="16,9 19,8 20,11 17,12" fill="#B9B1A7" />
      <polygon points="18,20 22,18 25,21 22,24 19,23" fill="#9C948B" />
      <polygon points="9,23 11,22 12,25 10,26" fill="#B9B1A7" />
    </template>
    <template v-else-if="feature === 'fog'">
      <ellipse cx="16" cy="16" rx="13" ry="8" fill="#8A4FBF" opacity="0.25" />
      <ellipse cx="13" cy="15" rx="7" ry="5" fill="#2F5BEA" opacity="0.2" />
    </template>
    <template v-else-if="feature === 'loops'">
      <ellipse cx="16" cy="16" rx="13" ry="6" fill="none" stroke="var(--bd-ink)" stroke-width="1.2" opacity="0.6" />
      <ellipse cx="17" cy="16" rx="8" ry="3.6" fill="none" stroke="var(--bd-ink)" stroke-width="1" opacity="0.6" />
      <ellipse cx="18" cy="16" rx="3" ry="1.5" fill="var(--bd-ink)" />
    </template>
    <template v-else>
      <path d="M16 4 Q16 16 28 16 Q16 16 16 28 Q16 16 4 16 Q16 16 16 4Z" fill="#F6CF4A" />
    </template>
  </svg>
</template>

<style scoped>
.glyph { flex: none; }
</style>
