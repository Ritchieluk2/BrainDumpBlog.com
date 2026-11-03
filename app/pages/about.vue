<script setup lang="ts">
useHead({ title: 'About' })
</script>

<template>
  <article class="prose-page bd-container">
    <p class="bd-label">About</p>
    <h1 class="bd-display">A morning journal<br><span class="bd-serif-italic">with a sense of shape.</span></h1>
    <div class="prose bd-serif">
      <p>[ABOUT COPY: who's behind Brain Dump and why you built it.]</p>
      <p>[CONTACT: email or form for questions and feedback.]</p>
    </div>
  </article>
</template>

<style scoped>
.prose-page { display: flex; flex-direction: column; gap: var(--bd-space-6); padding-block: var(--bd-space-6); max-width: 760px; margin-inline: auto; }
.prose { display: flex; flex-direction: column; gap: 1em; font-size: var(--bd-text-xl); line-height: 1.6; color: var(--bd-ink-2); }
</style>
