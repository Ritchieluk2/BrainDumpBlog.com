<script setup lang="ts">
useHead({ title: 'Games' })

// Each game is a static page in public/games/<slug>/, so these are plain links, not NuxtLinks.
const games = [
  {
    slug: 'syzygy',
    name: 'Syzygy',
    href: '/games/syzygy/index.html',
    thumbnail: '/games/syzygy/thumbnail.png',
    alt: 'Six Syzygy cards with a trio of moons, stars and a planet outlined in gold',
    blurb: 'Find three cards where every feature is all the same or all different. A new puzzle every day, plus races and an adventure.'
  }
]
</script>

<template>
  <div class="games bd-container">
    <header class="games__intro">
      <p class="bd-label">Games</p>
      <h1 class="bd-display">A quiet puzzle<br><span class="bd-serif-italic">for after your morning.</span></h1>
    </header>

    <ul class="games__list" role="list">
      <li v-for="g in games" :key="g.slug">
        <a :href="g.href" class="game">
          <img :src="g.thumbnail" :alt="g.alt" width="480" height="360" class="game__thumb" loading="lazy">
          <span class="game__body">
            <span class="game__name bd-serif-italic">{{ g.name }}</span>
            <span class="game__blurb">{{ g.blurb }}</span>
            <span class="game__play">Play</span>
          </span>
        </a>
      </li>
    </ul>

    <p class="games__note bd-muted">
      We save game results (scores, times, rewards picked) to balance the puzzles. Never your writing, name or email.
    </p>
  </div>
</template>

<style scoped>
.games { display: flex; flex-direction: column; gap: var(--bd-space-6); padding-block: var(--bd-space-6); }
.games__intro { display: flex; flex-direction: column; gap: var(--bd-space-3); }

.games__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
  gap: var(--bd-space-5);
}

.game {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: var(--bd-radius-lg);
  background: var(--bd-surface);
  border: 1px solid var(--bd-line);
  box-shadow: var(--bd-shadow-soft);
  overflow: hidden;
  color: inherit;
  text-decoration: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.game:hover { transform: translateY(-3px); box-shadow: var(--bd-shadow-card); }
.game:focus-visible { outline: 3px solid var(--bd-sunrise); outline-offset: 3px; }

.game__thumb { display: block; width: 100%; height: auto; aspect-ratio: 4 / 3; max-width: 100%; border-bottom: 1px solid var(--bd-line); }
.game__body { display: flex; flex-direction: column; gap: var(--bd-space-2); padding: var(--bd-space-4) var(--bd-space-5) var(--bd-space-5); flex: 1; }
.game__name { font-size: var(--bd-text-2xl); line-height: 1.1; }
.game__blurb { color: var(--bd-ink-2); font-size: var(--bd-text-sm); }
.game__play {
  margin-top: auto;
  align-self: flex-start;
  padding: 8px 18px;
  border-radius: var(--bd-radius-pill);
  background: var(--bd-ink);
  color: var(--bd-surface);
  font-weight: 500;
  font-size: var(--bd-text-sm);
}

.games__note { font-size: var(--bd-text-sm); max-width: 60ch; }

@media (prefers-reduced-motion: reduce) {
  .game { transition: none; }
  .game:hover { transform: none; }
}
</style>
