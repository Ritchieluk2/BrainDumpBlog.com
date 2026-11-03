<script setup lang="ts">
useHead({ title: 'Settings' })
const { loggedIn } = useUserSession()
</script>

<template>
  <div class="settings bd-container">
    <header class="settings__head">
      <h1 class="bd-display">Make it <span class="bd-serif-italic">yours</span></h1>
      <p class="bd-muted">
        Changes apply right away.
        {{ loggedIn ? 'Saved to your account, so they follow you to other devices.' : 'Saved in this browser. Sign in to keep them with your account.' }}
      </p>
    </header>

    <section id="feelings" class="settings__section" aria-labelledby="feelings-title">
      <div class="settings__intro">
        <h2 id="feelings-title" class="settings__title">Feelings: colors and shapes</h2>
        <p class="bd-muted">Every feeling has a color and a shape, and every picture is drawn with them. If blue means sad to you rather than calm, change it. Shapes keep feelings readable in tiny thumbnails and if colors are hard to tell apart.</p>
      </div>
      <div class="feelings">
        <MoodMapEditor class="feelings__editor" />
        <aside class="feelings__preview" aria-label="Preview">
          <MoodPreview />
        </aside>
      </div>
    </section>

    <section class="settings__section" aria-labelledby="look-title">
      <h2 id="look-title" class="bd-sr-only">Appearance and art style</h2>
      <ThemePicker />
    </section>

    <section v-if="loggedIn" class="settings__section" aria-labelledby="journal-title">
      <h2 id="journal-title" class="settings__title">Your journal</h2>
      <ProfileNames show-save />
      <p class="bd-muted settings__replay">Want the tour again? <NuxtLink to="/welcome?replay=1">Replay the welcome</NuxtLink></p>
    </section>
  </div>
</template>

<style scoped>
.settings { display: flex; flex-direction: column; gap: var(--bd-space-8); padding-block: var(--bd-space-6); }
.settings__head { display: flex; flex-direction: column; gap: var(--bd-space-4); max-width: 640px; }
.settings__section { display: flex; flex-direction: column; gap: var(--bd-space-5); }
.settings__intro { display: flex; flex-direction: column; gap: var(--bd-space-2); max-width: 640px; }
.settings__title { font-size: var(--bd-text-xl); font-weight: 500; letter-spacing: 0; }
.settings__replay { font-size: var(--bd-text-sm); }
.feelings { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--bd-space-6); align-items: start; }
/* phones and tablets: preview first, so you see the result of each change near the top */
.feelings__preview { order: -1; max-width: 420px; }
@media (min-width: 900px) {
  .feelings { grid-template-columns: minmax(0, 1.3fr) minmax(280px, 1fr); }
  .feelings__preview { order: 0; max-width: none; position: sticky; top: var(--bd-space-5); }
}
</style>
