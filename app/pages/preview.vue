<script setup lang="ts">
/** Shows the solar system for a dump written before signing in. Nothing is saved yet. */
import type { Affect } from '#shared/utils/cosmos'

useHead({ title: "Today's shape" })

const pending = ref<PendingDump | null>(null)
const result = ref<{ affect: Affect; summary: string; words: number } | null>(null)
const error = ref('')

onMounted(async () => {
  pending.value = readPending()
  if (!pending.value) return navigateTo('/')
  try {
    result.value = await $fetch('/api/analyze', { method: 'POST', body: { body: pending.value.body } })
  } catch (err: unknown) {
    error.value = (err as { statusMessage?: string }).statusMessage ?? 'Could not read that one. Try again?'
  }
})
</script>

<template>
  <div class="preview bd-container">
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-else-if="!result" class="bd-muted">Reading your morning…</p>

    <div v-else class="preview__grid">
      <div class="preview__sky">
        <CosmosDay :affect="result.affect" :seed="pending!.entryDate + pending!.body.length" title="Your brain dump as a solar system" />
      </div>
      <div class="preview__text">
        <p class="preview__date"><BdSunrise /> {{ formatIsoDate(pending!.entryDate) }} · {{ result.words }} words</p>
        <h1 class="preview__summary">{{ result.summary }}</h1>
        <CosmosLegend :affect="result.affect" />
        <div class="preview__save bd-card">
          <h2 class="preview__save-title">Keep this <span class="bd-serif-italic">morning?</span></h2>
          <p class="bd-muted">This is only in your browser right now. Sign in with your email and we'll save it to your journal, so your galaxy can start growing.</p>
          <NuxtLink to="/sign-in" class="bd-btn bd-btn--primary">Save it to my journal</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview { padding-block: var(--bd-space-6); }
.preview__grid { display: flex; flex-wrap: wrap; gap: var(--bd-space-8); align-items: flex-start; }
.preview__sky { flex: 1 1 300px; max-width: 460px; }
.preview__sky .cosmos { border-radius: var(--bd-radius-lg); box-shadow: var(--bd-shadow-card); }
.preview__text { flex: 999 1 420px; min-width: 0; display: flex; flex-direction: column; gap: var(--bd-space-5); max-width: 620px; }
.preview__date { display: flex; align-items: center; gap: 10px; font-size: var(--bd-text-sm); color: var(--bd-ink-2); }
.preview__summary { font-size: var(--bd-text-3xl); font-weight: 300; letter-spacing: -0.03em; }
.preview__save { display: flex; flex-direction: column; gap: var(--bd-space-3); align-items: flex-start; }
.preview__save-title { font-size: var(--bd-text-2xl); font-weight: 300; }
</style>
