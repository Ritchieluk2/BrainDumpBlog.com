<script setup lang="ts">
useHead({ title: 'Why brain dumps?' })
</script>

<template>
  <article class="prose-page bd-container">
    <p class="bd-label">Why brain dumps?</p>
    <h1 class="bd-display">Clear the desk<br><span class="bd-serif-italic">before the day starts.</span></h1>

    <div class="prose bd-serif">
      <p>A brain dump is simple: first thing in the morning, you write down whatever is in your head, without stopping to edit. Worries, to-dos, half-dreams, the song stuck on repeat. It all goes on the page.</p>
      <p>Getting it out of your head makes room to think. The worries look smaller written down, the to-dos turn into a list, and you usually notice what actually matters today.</p>
      <p>Brain Dump adds one thing: after you write, it reads the feeling of your words (never sharing them) and turns it into a small planet. Over weeks, you can see your mornings change shape.</p>
    </div>

    <NuxtLink to="/" class="bd-btn bd-btn--primary">Start this morning's dump</NuxtLink>
  </article>
</template>

<style scoped>
.prose-page { display: flex; flex-direction: column; gap: var(--bd-space-6); padding-block: var(--bd-space-6); max-width: 760px; margin-inline: auto; align-items: flex-start; }
.prose { display: flex; flex-direction: column; gap: 1em; font-size: var(--bd-text-xl); line-height: 1.6; }
</style>
