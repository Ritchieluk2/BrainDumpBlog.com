<script setup lang="ts">
import { demoWeek } from '~/data/sampleDumps'

useHead({ title: 'Good morning', titleTemplate: 'Brain Dump · %s' })

const { loggedIn } = useUserSession()
const demo = demoWeek()
const saving = ref(false)
const error = ref('')

// Set the date on the client so it matches the reader's own morning.
const today = ref('')
onMounted(() => {
  today.value = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
})

async function onSubmit(text: string) {
  error.value = ''
  const entryDate = localIsoDate()

  if (!loggedIn.value) {
    // Keep it in this browser, show the result, and offer to save it.
    savePending({ body: text, entryDate })
    await navigateTo('/preview')
    return
  }

  saving.value = true
  try {
    const dump = await $fetch('/api/dumps', { method: 'POST', body: { body: text, entryDate } })
    clearPending()
    await navigateTo({ path: `/journal/${dump.id}`, query: { fresh: '1' } })
  } catch (err: unknown) {
    error.value = (err as { statusMessage?: string }).statusMessage ?? 'Something went wrong saving that. Your words are still here.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="home bd-container">
    <section class="hero">
      <div class="hero__write">
        <p class="hero__date">
          <BdSunrise />
          <span>{{ today || ' ' }}</span>
        </p>
        <h1 class="bd-display">Good morning.<br><span class="bd-serif-italic">Empty your head.</span></h1>
        <DumpEditor
          :prompt="loggedIn ? 'Write whatever is there.' : 'Write whatever is there. No account needed to start.'"
          :submit-label="saving ? 'Saving…' : 'See today\'s shape'"
          @submit="onSubmit"
        />
        <p v-if="error" class="hero__error" role="alert">{{ error }}</p>
      </div>

      <aside v-if="loggedIn" class="hero__today" aria-label="Today">
        <ClientOnly>
          <TodayPanel />
          <template #fallback><p class="bd-muted">Loading your list…</p></template>
        </ClientOnly>
      </aside>
      <div v-else class="hero__cosmos">
        <CosmosWeek :days="demo" seed="homepage-demo" title="An example week of brain dumps drawn as a galaxy" />
        <p class="bd-muted">Each morning's writing becomes a small solar system, shaped by how you felt. A week of mornings becomes a galaxy.</p>
      </div>
    </section>

    <section v-if="!loggedIn" aria-label="How it works" class="steps">
      <div class="step">
        <BdMoodIcon mood="calm" :size="44" />
        <div>
          <h2 class="step__title">Write it all out</h2>
          <p class="bd-muted">Ten minutes, no editing, no audience.</p>
        </div>
      </div>
      <div class="step">
        <BdMoodIcon mood="joyful" :size="44" />
        <div>
          <h2 class="step__title">See your day's solar system</h2>
          <p class="bd-muted">Feelings become stars and planets. Racing thoughts are comets.</p>
        </div>
      </div>
      <div class="step">
        <BdMoodIcon mood="hopeful" :size="44" />
        <div>
          <h2 class="step__title">Watch your galaxy grow</h2>
          <p class="bd-muted">Each week of mornings spirals into a galaxy of its own.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 56px;
  padding-block: var(--bd-space-6) 56px;
}
.hero__write {
  flex: 999 1 560px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.hero__date {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: var(--bd-text-sm);
  color: var(--bd-ink-2);
}
.hero__error { color: var(--bd-terracotta-dark); font-size: var(--bd-text-sm); }
.hero__cosmos {
  flex: 1 1 320px;
  min-width: 0;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  gap: var(--bd-space-4);
}
.hero__today { flex: 1 1 320px; min-width: 0; max-width: 420px; align-self: flex-start; }
.hero__cosmos .cosmos { border-radius: var(--bd-radius-lg); box-shadow: var(--bd-shadow-soft); }

.steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--bd-space-5);
  padding-block: var(--bd-space-6) 0;
  border-top: 1px solid var(--bd-line);
}
.step { display: flex; gap: var(--bd-space-4); align-items: flex-start; }
.step__title { font-size: var(--bd-text-lg); font-weight: 500; letter-spacing: 0; margin-bottom: 2px; }
.step p { font-size: var(--bd-text-sm); }
</style>
