<template>
  <div class="layout-root">
    <NuxtRouteAnnouncer />
    <Navbar />
    <main class="main-content">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
const { fetchUser, initialized } = useAuth();

// Initialize session state on client mount
onMounted(() => {
  if (!initialized.value) {
    fetchUser();
  }
});
</script>

<style scoped>
.layout-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

@media (max-width: 640px) {
  .main-content {
    padding: 1.25rem 1rem;
  }
}
</style>
