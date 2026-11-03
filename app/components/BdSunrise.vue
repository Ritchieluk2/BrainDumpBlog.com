<script setup lang="ts">
/** Small sunrise glyph: the subtle accent used beside dates. */
withDefaults(defineProps<{ width?: number }>(), { width: 28 })
</script>

<template>
  <svg :width="width" :height="width / 2" viewBox="0 0 28 14" aria-hidden="true" class="bd-sunrise">
    <path d="M3 13 a11 11 0 0 1 22 0" fill="none" stroke="var(--bd-sunrise)" stroke-width="2.5" stroke-linecap="round" />
    <line x1="1" y1="13" x2="27" y2="13" stroke="var(--bd-ink)" stroke-width="2" stroke-linecap="round" />
  </svg>
</template>

<style scoped>
.bd-sunrise { display: inline-block; flex: none; }
</style>
