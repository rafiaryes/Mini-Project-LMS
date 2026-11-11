<template>
  <div class="admin-users-page">
    <div class="page-header">
      <div>
        <h2>Kelola Pengguna</h2>
        <p class="subtitle">Manajemen seluruh akun guru, murid, dan administrator.</p>
      </div>
      <button class="btn btn-primary btn-sm" @click="showCreateModal = true">
        + Tambah Pengguna Baru
      </button>
    </div>

    <!-- Filters Bar -->
    <div class="filters-bar card mb-4">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari nama atau email..."
          class="form-input"
          @input="debounceSearch"
        />
      </div>
      <div class="role-filter">
        <select v-model="selectedRole" class="form-select" @change="loadUsers">
          <option value="">Semua Role</option>
          <option value="TEACHER">Guru (TEACHER)</option>
          <option value="STUDENT">Murid (STUDENT)</option>
          <option value="ADMIN">Administrator (ADMIN)</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="card text-center py-4 text-muted">
      Memuat daftar pengguna...
    </div>

    <div v-else-if="users.length === 0" class="card text-center empty-card">
      <p class="text-muted">Tidak ada pengguna yang cocok dengan kriteria pencarian.</p>
    </div>

    <!-- Users Table -->
    <div v-else class="table-container card">
      <table class="table">
        <thead>
          <tr>
            <th>Nama</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Dibuat</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td><strong>{{ u.name }}</strong></td>
            <td>{{ u.email }}</td>
            <td>
              <span :class="['badge', `badge-${u.role.toLowerCase()}`]">
                {{ u.role }}
              </span>
            </td>
            <td>
              <span
                :class="[
                  'badge',
                  u.isActive ? 'badge-success' : 'badge-danger',
                ]"
              >
                {{ u.isActive ? "Aktif" : "Nonaktif" }}
              </span>
            </td>
            <td class="text-xs text-muted">
              {{ formatDate(u.createdAt) }}
            </td>
            <td>
              <button
                v-if="u.isActive && u.id !== currentUser?.id"
                class="btn btn-danger btn-xs"
                @click="deactivateUser(u)"
              >
                Nonaktifkan
              </button>
              <span v-else-if="u.id === currentUser?.id" class="text-xs text-muted">
                (Akun Anda)
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── MODAL: CREATE USER ──────────────────────────────────────── -->
    <div v-if="showCreateModal" class="modal-backdrop">
      <div class="modal card">
        <h3>Tambah Pengguna Baru</h3>
        <p class="text-muted text-sm mb-3">
          Kredensial akun akan langsung aktif setelah dibuat.
        </p>

        <form @submit.prevent="handleCreateUser">
          <div class="form-group">
            <label class="form-label" for="user-name">Nama Lengkap *</label>
            <input
              id="user-name"
              v-model="newUser.name"
              type="text"
              class="form-input"
              placeholder="Contoh: Budi Santoso"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="user-email">Alamat Email *</label>
            <input
              id="user-email"
              v-model="newUser.email"
              type="email"
              class="form-input"
              placeholder="nama@lms.local"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="user-password">Kata Sandi Awal *</label>
            <input
              id="user-password"
              v-model="newUser.password"
              type="password"
              class="form-input"
              placeholder="Minimal 6 karakter"
              minlength="6"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="user-role">Role Pengguna *</label>
            <select id="user-role" v-model="newUser.role" class="form-select" required>
              <option value="TEACHER">Guru (TEACHER)</option>
              <option value="STUDENT">Murid (STUDENT)</option>
              <option value="ADMIN">Administrator (ADMIN)</option>
            </select>
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
              <span v-else>Simpan Pengguna</span>
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

const { user: currentUser } = useAuth();
const { fetchWithAuth } = useApi();

const users = ref<any[]>([]);
const loading = ref(true);
const searchQuery = ref("");
const selectedRole = ref("");

// Modal create user
const showCreateModal = ref(false);
const creating = ref(false);
const createError = ref("");
const newUser = ref({
  name: "",
  email: "",
  password: "",
  role: "TEACHER" as "ADMIN" | "TEACHER" | "STUDENT",
});

let debounceTimer: any = null;
const debounceSearch = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    loadUsers();
  }, 350);
};

const loadUsers = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    if (searchQuery.value.trim()) params.append("search", searchQuery.value.trim());
    if (selectedRole.value) params.append("role", selectedRole.value);
    params.append("limit", "50");

    const res = await fetchWithAuth<ApiResponse<any[]>>(
      `/api/v1/admin/users?${params.toString()}`
    );
    users.value = res.data || [];
  } catch (err) {
    console.error("Gagal memuat pengguna:", err);
  } finally {
    loading.value = false;
  }
};

const handleCreateUser = async () => {
  createError.value = "";
  creating.value = true;
  try {
    await fetchWithAuth("/api/v1/admin/users", {
      method: "POST",
      body: newUser.value,
    });

    showCreateModal.value = false;
    newUser.value = {
      name: "",
      email: "",
      password: "",
      role: "TEACHER",
    };
    await loadUsers();
  } catch (err: any) {
    createError.value = err?.message || "Gagal membuat pengguna.";
  } finally {
    creating.value = false;
  }
};

const deactivateUser = async (u: any) => {
  if (
    !confirm(
      `Apakah Anda yakin ingin menonaktifkan akun "${u.name}"? Pengguna akan langsung dikeluarkan dari sesi aktif.`
    )
  ) {
    return;
  }

  try {
    await fetchWithAuth(`/api/v1/admin/users/${u.id}/deactivate`, {
      method: "POST",
    });
    await loadUsers();
  } catch (err: any) {
    alert(err?.message || "Gagal menonaktifkan pengguna.");
  }
};

const formatDate = (isoDate: string) => {
  if (!isoDate) return "-";
  return new Date(isoDate).toLocaleDateString("id-ID", {
    dateStyle: "medium",
  });
};

onMounted(() => {
  loadUsers();
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

.role-filter {
  min-width: 200px;
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

