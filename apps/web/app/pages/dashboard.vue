<template>
  <div class="dashboard-page">
    <div class="welcome-banner card">
      <div>
        <h2>Halo, {{ user?.name }}! 👋</h2>
        <p class="subtitle">
          Selamat datang di dashboard LMS. Anda masuk sebagai
          <strong>{{ user?.role }}</strong>.
        </p>
      </div>
      <div>
        <span :class="['badge', `badge-${user?.role?.toLowerCase()}`]">
          {{ user?.role }}
        </span>
      </div>
    </div>

    <!-- ── ADMIN DASHBOARD ─────────────────────────────────────────── -->
    <div v-if="isAdmin" class="dashboard-section">
      <h3 class="section-title">Panel Administrasi</h3>
      <div class="grid-2">
        <div class="card stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <h4>Manajemen Pengguna</h4>
            <p class="stat-desc">
              Kelola akun guru dan murid, buat akun baru, dan atur status keaktifan.
            </p>
            <NuxtLink to="/admin/users" class="btn btn-primary btn-sm">
              Buka Data Pengguna &rarr;
            </NuxtLink>
          </div>
        </div>

        <div class="card stat-card">
          <div class="stat-icon">🏫</div>
          <div class="stat-content">
            <h4>Manajemen Kelas</h4>
            <p class="stat-desc">
              Buat kelas baru, tetapkan guru pengajar, dan daftarkan anggota murid.
            </p>
            <NuxtLink to="/admin/classes" class="btn btn-primary btn-sm">
              Buka Data Kelas &rarr;
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- ── TEACHER DASHBOARD ───────────────────────────────────────── -->
    <div v-else-if="isTeacher" class="dashboard-section">
      <div class="section-header">
        <h3 class="section-title">Kelas yang Saya Ajar</h3>
        <NuxtLink to="/classes" class="btn btn-secondary btn-sm">
          Lihat Semua Kelas
        </NuxtLink>
      </div>

      <div v-if="loadingClasses" class="loading-state">
        Memuat daftar kelas...
      </div>

      <div v-else-if="classes.length === 0" class="empty-state card">
        <span class="empty-icon">📂</span>
        <h4>Belum ada kelas yang ditugaskan</h4>
        <p>Hubungi Administrator untuk menetapkan Anda ke dalam kelas.</p>
      </div>

      <div v-else class="grid-3">
        <div v-for="cls in classes" :key="cls.id" class="card class-card">
          <div class="class-card-header">
            <h4>{{ cls.name }}</h4>
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
            {{ cls.description || "Tidak ada deskripsi." }}
          </p>
          <div class="class-card-footer">
            <NuxtLink :to="`/classes/${cls.id}`" class="btn btn-primary btn-sm">
              Masuk Kelas &rarr;
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- ── STUDENT DASHBOARD ───────────────────────────────────────── -->
    <div v-else-if="isStudent" class="dashboard-section">
      <div class="section-header">
        <h3 class="section-title">Kelas yang Saya Ikuti</h3>
        <NuxtLink to="/classes" class="btn btn-secondary btn-sm">
          Lihat Semua Kelas
        </NuxtLink>
      </div>

      <div v-if="loadingClasses" class="loading-state">
        Memuat daftar kelas...
      </div>

      <div v-else-if="classes.length === 0" class="empty-state card">
        <span class="empty-icon">🎒</span>
        <h4>Belum terdaftar di kelas manapun</h4>
        <p>Hubungi Administrator untuk mendaftarkan Anda ke kelas pembelajaran.</p>
      </div>

      <div v-else class="grid-3">
        <div v-for="cls in classes" :key="cls.id" class="card class-card">
          <div class="class-card-header">
            <h4>{{ cls.name }}</h4>
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
            {{ cls.description || "Tidak ada deskripsi." }}
          </p>
          <div class="class-card-footer">
            <NuxtLink :to="`/classes/${cls.id}`" class="btn btn-primary btn-sm">
              Buka Kelas &rarr;
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "../types/auth";

definePageMeta({
  middleware: ["auth"],
});

const { user, isAdmin, isTeacher, isStudent } = useAuth();
const { fetchWithAuth } = useApi();

const classes = ref<any[]>([]);
const loadingClasses = ref(false);

onMounted(async () => {
  if (!isAdmin.value) {
    loadingClasses.value = true;
    try {
      const res = await fetchWithAuth<ApiResponse<any[]>>("/api/v1/classes");
      classes.value = res.data || [];
    } catch (e) {
      console.error("Gagal memuat kelas:", e);
    } finally {
      loadingClasses.value = false;
    }
  }
});
</script>

<style scoped>
.welcome-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: linear-gradient(to right, #ffffff, #f8fafc);
  border-left: 4px solid var(--primary);
}

.welcome-banner h2 {
  font-size: 1.4rem;
  margin-bottom: 0.25rem;
}

.subtitle {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.dashboard-section {
  margin-top: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.section-title {
  font-size: 1.15rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
}

.grid-3 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-content h4 {
  font-size: 1.1rem;
  margin-bottom: 0.4rem;
}

.stat-desc {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 1.25rem;
  line-height: 1.4;
}

.class-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.class-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.class-card-header h4 {
  font-size: 1.05rem;
}

.class-desc {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 1.5rem;
  flex-grow: 1;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 0.75rem;
}

.empty-state h4 {
  margin-bottom: 0.35rem;
}

.empty-state p {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.loading-state {
  color: var(--text-muted);
  font-size: 0.9rem;
}
</style>

