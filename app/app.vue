<script setup lang="ts">
const { appearance, night } = usePreferences()
// The favicon follows the time of day, like the logo.
const scene = useSkyScene()

// "system" leaves the attribute off so the CSS media query decides.
useHead({
  htmlAttrs: { 'data-theme': () => (appearance.value === 'system' ? undefined : appearance.value) },
  meta: [{ name: 'theme-color', content: () => (night.value ? '#121018' : '#FAF9F7') }],
  link: [
    { key: 'icon', rel: 'icon', type: 'image/svg+xml', href: () => `/brand/brain-dump-${scene.value}-icon.svg` },
    { key: 'icon-png', rel: 'icon', type: 'image/png', sizes: '32x32', href: () => `/brand/brain-dump-${scene.value}-32.png` },
    { key: 'apple-touch-icon', rel: 'apple-touch-icon', href: () => `/brand/brain-dump-${scene.value}-180.png` }
  ]
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
