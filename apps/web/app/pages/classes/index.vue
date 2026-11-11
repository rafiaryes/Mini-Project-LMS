<template>
  <div class="classes-page">
    <div class="page-header">
      <div>
        <h2>Kelas Saya</h2>
        <p class="subtitle">
          Daftar kelas pembelajaran tempat Anda terdaftar.
        </p>
      </div>
    </div>

    <div v-if="loading" class="card text-center py-4 text-muted">
      Memuat daftar kelas...
    </div>

    <div v-else-if="classes.length === 0" class="card text-center empty-card">
      <span class="empty-icon">📂</span>
      <h3>Tidak ada kelas aktif</h3>
      <p class="text-muted">
        Anda belum terdaftar atau ditugaskan pada kelas manapun.
      </p>
    </div>

    <div v-else class="classes-grid">
      <div v-for="cls in classes" :key="cls.id" class="card class-item">
        <div class="class-header">
          <h3>{{ cls.name }}</h3>
          <span
            :class="[
              'badge',
              cls.status === 'ACTIVE' ? 'badge-success' : 'badge-warning',
            ]"
          >
            {{ cls.status }}
          </span>
        </div>
        <p class="class-desc">
          {{ cls.description || "Tidak ada keterangan tambahan." }}
        </p>
        <div class="class-footer">
          <NuxtLink :to="`/classes/${cls.id}`" class="btn btn-primary btn-sm">
            Masuk ke Kelas &rarr;
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "../../types/auth";

definePageMeta({
  middleware: ["auth"],
});

const { fetchWithAuth } = useApi();
const classes = ref<any[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const res = await fetchWithAuth<ApiResponse<any[]>>("/api/v1/classes");
    classes.value = res.data || [];
  } catch (e) {
    console.error("Gagal memuat kelas:", e);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.page-header {
  margin-bottom: 2rem;
}

.page-header h2 {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.subtitle {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.classes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.class-item {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.class-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.class-header h3 {
  font-size: 1.15rem;
}

.class-desc {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 1.5rem;
  flex-grow: 1;
}

.empty-card {
  padding: 3rem 1rem;
}

.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.5rem;
}
</style>

