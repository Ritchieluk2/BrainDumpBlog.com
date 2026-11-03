<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useHead({ title: 'Account' })

const { user, clear } = useUserSession()
const confirming = ref(false)
const deleting = ref(false)
const error = ref('')

async function signOut() {
  await clear()
  await navigateTo('/')
}

async function deleteAccount() {
  deleting.value = true
  error.value = ''
  try {
    await $fetch('/api/account', { method: 'DELETE' })
    clearPending()
    await clear()
    await navigateTo('/')
  } catch {
    error.value = 'Could not delete your account. Please try again.'
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="account bd-container">
    <h1 class="bd-display">Your <span class="bd-serif-italic">account</span></h1>

    <section class="bd-card account__card">
      <p class="bd-label">Signed in as</p>
      <p class="account__email">{{ user?.email }}</p>
      <button type="button" class="bd-btn bd-btn--outline" @click="signOut">Sign out</button>
    </section>

    <section class="bd-card account__card">
      <h2 class="account__title">Make it yours</h2>
      <p class="bd-muted">Each feeling's color and shape, light or night, how your mornings are drawn, and what to call you and your journal.</p>
      <NuxtLink to="/settings" class="bd-btn bd-btn--outline">Open settings</NuxtLink>
    </section>

    <section class="bd-card account__card">
      <h2 class="account__title">Your data</h2>
      <p class="bd-muted">Download every entry, to-do, note and reminder, with its analysis, as a JSON file.</p>
      <a href="/api/account/export" class="bd-btn bd-btn--outline" download>Download my journal</a>
    </section>

    <section class="bd-card account__card">
      <h2 class="account__title">Delete account</h2>
      <p class="bd-muted">Permanently deletes your account, every entry, and your to-dos, notes and reminders. This can't be undone.</p>
      <button v-if="!confirming" type="button" class="bd-btn bd-btn--outline" @click="confirming = true">Delete my account</button>
      <div v-else class="account__confirm">
        <span>Delete everything for good?</span>
        <button type="button" class="bd-btn bd-btn--small bd-btn--danger" :disabled="deleting" @click="deleteAccount">
          {{ deleting ? 'Deleting…' : 'Yes, delete everything' }}
        </button>
        <button type="button" class="bd-btn bd-btn--small bd-btn--outline" @click="confirming = false">Cancel</button>
      </div>
      <p v-if="error" role="alert" class="account__error">{{ error }}</p>
    </section>
  </div>
</template>

<style scoped>
.account { display: flex; flex-direction: column; gap: var(--bd-space-6); padding-block: var(--bd-space-6); max-width: 680px; }
.account__card { display: flex; flex-direction: column; gap: var(--bd-space-3); align-items: flex-start; }
.account__email { font-size: var(--bd-text-xl); }
.account__title { font-size: var(--bd-text-xl); font-weight: 500; letter-spacing: 0; }
.account__confirm { display: flex; flex-wrap: wrap; gap: var(--bd-space-3); align-items: center; }
.account__error { color: var(--bd-terracotta-dark); font-size: var(--bd-text-sm); }
</style>
