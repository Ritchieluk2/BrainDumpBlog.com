<script setup lang="ts">
useHead({ title: 'Appearance' })
</script>

<template>
  <div class="settings bd-container">
    <header class="settings__head">
      <h1 class="bd-display">Make it <span class="bd-serif-italic">yours</span></h1>
      <p class="bd-muted">Saved in this browser. Changes apply right away.</p>
    </header>
    <ThemePicker />
  </div>
</template>

<style scoped>
.settings { display: flex; flex-direction: column; gap: var(--bd-space-7); padding-block: var(--bd-space-6); }
.settings__head { display: flex; flex-direction: column; gap: var(--bd-space-4); max-width: 640px; }
</style>
