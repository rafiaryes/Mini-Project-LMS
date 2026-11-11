<template>
  <div class="admin-classes-page">
    <div class="page-header">
      <div>
        <h2>Kelola Kelas</h2>
        <p class="subtitle">Daftar seluruh kelas, status, dan pengelolaan anggota.</p>
      </div>
      <button class="btn btn-primary btn-sm" @click="showCreateModal = true">
        + Buat Kelas Baru
      </button>
    </div>

    <!-- Filters Bar -->
    <div class="filters-bar card mb-4">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari nama kelas..."
          class="form-input"
          @input="debounceSearch"
        />
      </div>
      <div class="status-filter">
        <select v-model="selectedStatus" class="form-select" @change="loadClasses">
          <option value="">Semua Status</option>
          <option value="ACTIVE">Aktif (ACTIVE)</option>
          <option value="ARCHIVED">Arsip (ARCHIVED)</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="card text-center py-4 text-muted">
      Memuat daftar kelas...
    </div>

    <div v-else-if="classes.length === 0" class="card text-center empty-card">
      <p class="text-muted">Belum ada kelas yang dibuat.</p>
    </div>

    <!-- Classes Table -->
    <div v-else class="table-container card">
      <table class="table">
        <thead>
          <tr>
            <th>Nama Kelas</th>
            <th>Keterangan</th>
            <th>Status</th>
            <th>Dibuat Oleh</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cls in classes" :key="cls.id">
            <td><strong>{{ cls.name }}</strong></td>
            <td class="text-muted text-sm">{{ cls.description || "-" }}</td>
            <td>
              <span
                :class="[
                  'badge',
                  cls.status === 'ACTIVE' ? 'badge-success' : 'badge-warning',
                ]"
              >
                {{ cls.status }}
              </span>
            </td>
            <td class="text-xs text-muted">
              {{ cls.creatorName || "Admin" }}
            </td>
            <td>
              <NuxtLink
                :to="`/admin/classes/${cls.id}`"
                class="btn btn-secondary btn-xs"
              >
                ⚙ Kelola Anggota &rarr;
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── MODAL: CREATE CLASS ──────────────────────────────────────── -->
    <div v-if="showCreateModal" class="modal-backdrop">
      <div class="modal card">
        <h3>Buat Kelas Baru</h3>
        <p class="text-muted text-sm mb-3">
          Setelah kelas dibuat, Anda dapat menetapkan guru dan murid.
        </p>

        <form @submit.prevent="handleCreateClass">
          <div class="form-group">
            <label class="form-label" for="class-name">Nama Kelas *</label>
            <input
              id="class-name"
              v-model="newClass.name"
              type="text"
              class="form-input"
              placeholder="Contoh: Matematika Diskrit A"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="class-desc">Deskripsi Kelas</label>
            <textarea
              id="class-desc"
              v-model="newClass.description"
              class="form-textarea"
              rows="3"
              placeholder="Keterangan singkat materi atau ruang kelas..."
            ></textarea>
          </div>

          <div v-if="createError" class="alert alert-danger text-sm mb-3">
            {{ createError }}
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              @click="showCreateModal = false"
              :disabled="creating"
            >
              Batal
            </button>
            <button
              type="submit"
              class="btn btn-primary btn-sm"
              :disabled="creating"
            >
              <span v-if="creating">Menyimpan...</span>
              <span v-else>Simpan Kelas</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "../../../types/auth";

definePageMeta({
  middleware: ["admin"],
});

const { fetchWithAuth } = useApi();

const classes = ref<any[]>([]);
const loading = ref(true);
const searchQuery = ref("");
const selectedStatus = ref("");

// Modal create
const showCreateModal = ref(false);
const creating = ref(false);
const createError = ref("");
const newClass = ref({
  name: "",
  description: "",
});

let debounceTimer: any = null;
const debounceSearch = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    loadClasses();
  }, 350);
};

const loadClasses = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    if (searchQuery.value.trim()) params.append("search", searchQuery.value.trim());
    if (selectedStatus.value) params.append("status", selectedStatus.value);
    params.append("limit", "50");

    const res = await fetchWithAuth<ApiResponse<any[]>>(
      `/api/v1/admin/classes?${params.toString()}`
    );
    classes.value = res.data || [];
  } catch (err) {
    console.error("Gagal memuat kelas:", err);
  } finally {
    loading.value = false;
  }
};

const handleCreateClass = async () => {
  createError.value = "";
  creating.value = true;
  try {
    await fetchWithAuth("/api/v1/admin/classes", {
      method: "POST",
      body: newClass.value,
    });

    showCreateModal.value = false;
    newClass.value = { name: "", description: "" };
    await loadClasses();
  } catch (err: any) {
    createError.value = err?.message || "Gagal membuat kelas.";
  } finally {
    creating.value = false;
  }
};

onMounted(() => {
  loadClasses();
});
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.filters-bar {
  display: flex;
  gap: 1rem;
  padding: 1rem;
}

.search-box {
  flex: 1;
}

.status-filter {
  min-width: 180px;
}

.empty-card {
  padding: 3rem 1rem;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}

.modal {
  max-width: 480px;
  width: 100%;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.btn-xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.text-xs {
  font-size: 0.75rem;
}

.text-sm {
  font-size: 0.85rem;
}
</style>

