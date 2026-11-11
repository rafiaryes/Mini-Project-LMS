<template>
  <div class="landing-container">
    <div class="card text-center hero-card">
      <div class="hero-icon">🎓</div>
      <h1>LMS Mini Project</h1>
      <p class="subtitle">
        Sistem Manajemen Pembelajaran untuk Pengelolaan Kelas, Tugas, dan Penilaian Terisolasi.
      </p>

      <div class="cta-actions">
        <template v-if="isAuthenticated">
          <NuxtLink to="/dashboard" class="btn btn-primary btn-lg">
            Buka Dashboard
          </NuxtLink>
        </template>
        <template v-else>
          <NuxtLink to="/login" class="btn btn-primary btn-lg">
            Masuk ke Aplikasi
          </NuxtLink>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { isAuthenticated } = useAuth();
</script>

<style scoped>
.landing-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.hero-card {
  max-width: 600px;
  width: 100%;
  padding: 3rem 2rem;
  text-align: center;
}

.hero-icon {
  font-size: 3.5rem;
  margin-bottom: 1rem;
}

h1 {
  font-size: 2rem;
  margin-bottom: 0.75rem;
  color: var(--text-main);
}

.subtitle {
  color: var(--text-muted);
  font-size: 1.05rem;
  margin-bottom: 2rem;
}

.cta-actions {
  display: flex;
  justify-content: center;
}

.btn-lg {
  padding: 0.8rem 2rem;
  font-size: 1rem;
}
</style>
