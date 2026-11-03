<template>
  <div class="layout">
    <a href="#main" class="skip-link">Skip to content</a>
    <SiteHeader />
    <main id="main" class="layout__main">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>

<style scoped>
.layout { min-height: 100vh; display: flex; flex-direction: column; }
.layout__main { flex: 1; }
.skip-link {
  position: absolute;
  left: -9999px;
  top: 8px;
  padding: 10px 16px;
  background: var(--bd-ink);
  color: var(--bd-surface);
  border-radius: var(--bd-radius-pill);
  z-index: 10;
}
.skip-link:focus { left: 16px; color: var(--bd-surface); }
</style>
