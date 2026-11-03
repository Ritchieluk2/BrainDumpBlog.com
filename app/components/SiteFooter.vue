<template>
  <footer class="site-footer bd-container">
    <BdLogo size="sm" />
    <nav aria-label="Footer" class="site-footer__nav">
      <NuxtLink to="/why">Why brain dumps?</NuxtLink>
      <NuxtLink to="/about">About</NuxtLink>
      <NuxtLink to="/settings">Appearance</NuxtLink>
      <NuxtLink to="/styleguide">Styleguide</NuxtLink>
    </nav>
  </footer>
</template>

<style scoped>
.site-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--bd-space-4);
  padding-block: var(--bd-space-6) var(--bd-space-7);
  border-top: 1px solid var(--bd-line);
  margin-top: var(--bd-space-8);
}
.site-footer__nav { display: flex; flex-wrap: wrap; gap: var(--bd-space-2) var(--bd-space-5); font-size: var(--bd-text-sm); }
.site-footer__nav a { color: var(--bd-ink-2); text-decoration: none; padding-block: 10px; }
.site-footer__nav a:hover { color: var(--bd-ink); }
</style>
