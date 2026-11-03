<script setup lang="ts">
const { appearance, night } = usePreferences()

// "system" leaves the attribute off so the CSS media query decides.
useHead({
  htmlAttrs: { 'data-theme': () => (appearance.value === 'system' ? undefined : appearance.value) },
  meta: [{ name: 'theme-color', content: () => (night.value ? '#121018' : '#FAF9F7') }]
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
