<template>
  <div class="class-detail-page">
    <div v-if="loading" class="card text-center py-4 text-muted">
      Memuat detail kelas...
    </div>

    <div v-else-if="error" class="card text-center alert alert-danger">
      <h3>Akses Ditolak / Kelas Tidak Ditemukan</h3>
      <p>{{ error }}</p>
      <NuxtLink to="/classes" class="btn btn-secondary btn-sm mt-3">
        &larr; Kembali ke Daftar Kelas
      </NuxtLink>
    </div>

    <template v-else-if="classDetail">
      <!-- Breadcrumb & Header -->
      <div class="class-header card">
        <div class="header-top">
          <NuxtLink to="/classes" class="breadcrumb">
            &larr; Semua Kelas
          </NuxtLink>
          <span
            :class="[
              'badge',
              classDetail.status === 'ACTIVE'
                ? 'badge-success'
                : 'badge-warning',
            ]"
          >
            {{ classDetail.status }}
          </span>
        </div>
        <h2>{{ classDetail.name }}</h2>
        <p class="class-description">
          {{ classDetail.description || "Tidak ada deskripsi untuk kelas ini." }}
        </p>

        <div v-if="classDetail.teachers?.length" class="teachers-list">
          <span class="teacher-label">Guru Pengajar:</span>
          <span
            v-for="t in classDetail.teachers"
            :key="t.id"
            class="teacher-badge"
          >
            👨‍🏫 {{ t.name }}
          </span>
        </div>
      </div>

      <!-- Tab Navigation for Teachers -->
      <div v-if="isTeacher" class="tabs">
        <button
          :class="['tab-btn', activeTab === 'assignments' ? 'active' : '']"
          @click="activeTab = 'assignments'"
        >
          📝 Daftar Tugas ({{ assignments.length }})
        </button>
        <button
          :class="['tab-btn', activeTab === 'members' ? 'active' : '']"
          @click="loadMembers"
        >
          👥 Anggota Kelas
        </button>
      </div>

      <!-- ── TAB: ASSIGNMENTS ──────────────────────────────────────── -->
      <div v-if="activeTab === 'assignments'" class="section-container">
        <div class="section-actions">
          <h3>Daftar Tugas Kelas</h3>
          <button
            v-if="isTeacher"
            @click="showCreateModal = true"
            class="btn btn-primary btn-sm"
          >
            + Buat Tugas Baru
          </button>
        </div>

        <div v-if="assignments.length === 0" class="card empty-card text-center">
          <p class="text-muted">Belum ada tugas yang diberikan pada kelas ini.</p>
        </div>

        <div v-else class="assignments-list">
          <div
            v-for="item in assignments"
            :key="item.id"
            class="card assignment-item"
          >
            <div class="assignment-main">
              <div class="assignment-header">
                <h4>{{ item.title }}</h4>
                <span v-if="item.isArchived" class="badge badge-warning">
                  Diarsipkan
                </span>
              </div>
              <p class="assignment-desc">
                {{ item.description || "Tidak ada petunjuk tambahan." }}
              </p>
              <div class="due-info">
                📅 Tenggat:
                <strong>{{ formatDateTime(item.dueAt) }}</strong>
                <span
                  v-if="isPastDue(item.dueAt)"
                  class="badge badge-danger badge-due"
                >
                  Lewat Tenggat
                </span>
              </div>
            </div>

            <div class="assignment-action">
              <NuxtLink
                :to="`/assignments/${item.id}`"
                class="btn btn-secondary btn-sm"
              >
                Detail Tugas &rarr;
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- ── TAB: MEMBERS (TEACHER ONLY) ───────────────────────────── -->
      <div v-else-if="activeTab === 'members'" class="section-container">
        <div v-if="loadingMembers" class="text-muted text-center py-3">
          Memuat data anggota...
        </div>
        <div v-else class="grid-2">
          <!-- Guru -->
          <div class="card">
            <h4>Guru Kelas ({{ membersData?.teachers?.length || 0 }})</h4>
            <ul class="member-list">
              <li
                v-for="t in membersData?.teachers"
                :key="t.id"
                class="member-item"
              >
                <span>👨‍🏫 {{ t.name }}</span>
                <span class="text-muted">{{ t.email }}</span>
              </li>
            </ul>
          </div>

          <!-- Murid -->
          <div class="card">
            <h4>Murid Terdaftar ({{ membersData?.students?.length || 0 }})</h4>
            <div
              v-if="!membersData?.students?.length"
              class="text-muted text-sm py-2"
            >
              Belum ada murid yang didaftarkan ke kelas ini.
            </div>
            <ul v-else class="member-list">
              <li
                v-for="s in membersData?.students"
                :key="s.id"
                class="member-item"
              >
                <span>🎒 {{ s.name }}</span>
                <span class="text-muted">{{ s.email }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </template>

    <!-- ── MODAL: CREATE ASSIGNMENT (GURU) ────────────────────────── -->
    <div v-if="showCreateModal" class="modal-backdrop">
      <div class="modal card">
        <h3>Buat Tugas Baru</h3>
        <p class="text-muted text-sm mb-3">
          Tugas akan langsung dapat dilihat oleh seluruh murid di kelas ini.
        </p>

        <form @submit.prevent="handleCreateAssignment">
          <div class="form-group">
            <label class="form-label" for="task-title">Judul Tugas *</label>
            <input
              id="task-title"
              v-model="newAssignment.title"
              type="text"
              class="form-input"
              placeholder="Contoh: Tugas 1 - Dasar Pemrograman Web"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="task-desc">Petunjuk / Deskripsi</label>
            <textarea
              id="task-desc"
              v-model="newAssignment.description"
              class="form-textarea"
              rows="4"
              placeholder="Jelaskan instruksi tugas dan format jawaban..."
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label" for="task-due">Batas Waktu Pengumpulan (Due Date) *</label>
            <input
              id="task-due"
              v-model="newAssignment.dueAt"
              type="datetime-local"
              class="form-input"
              required
            />
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
              <span v-else>Simpan Tugas</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "../../types/auth";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const classId = route.params.id as string;

const { isTeacher } = useAuth();
const { fetchWithAuth } = useApi();

const classDetail = ref<any>(null);
const assignments = ref<any[]>([]);
const membersData = ref<any>(null);
const loading = ref(true);
const loadingMembers = ref(false);
const error = ref("");

const activeTab = ref<"assignments" | "members">("assignments");

// Modal states
const showCreateModal = ref(false);
const creating = ref(false);
const createError = ref("");
const newAssignment = ref({
  title: "",
  description: "",
  dueAt: "",
});

const loadClassData = async () => {
  loading.value = true;
  error.value = "";
  try {
    const [classRes, assignRes] = await Promise.all([
      fetchWithAuth<ApiResponse<any>>(`/api/v1/classes/${classId}`),
      fetchWithAuth<ApiResponse<any[]>>(`/api/v1/classes/${classId}/assignments`),
    ]);

    classDetail.value = classRes.data;
    assignments.value = assignRes.data || [];
  } catch (err: any) {
    error.value =
      err?.message || "Gagal memuat informasi kelas atau Anda tidak memiliki akses.";
  } finally {
    loading.value = false;
  }
};

const loadMembers = async () => {
  activeTab.value = "members";
  if (membersData.value) return;

  loadingMembers.value = true;
  try {
    const res = await fetchWithAuth<ApiResponse<any>>(
      `/api/v1/classes/${classId}/members`
    );
    membersData.value = res.data;
  } catch (err) {
    console.error("Gagal memuat anggota:", err);
  } finally {
    loadingMembers.value = false;
  }
};

const handleCreateAssignment = async () => {
  createError.value = "";
  creating.value = true;

  try {
    const dueIso = new Date(newAssignment.value.dueAt).toISOString();
    await fetchWithAuth(`/api/v1/classes/${classId}/assignments`, {
      method: "POST",
      body: {
        title: newAssignment.value.title,
        description: newAssignment.value.description,
        dueAt: dueIso,
      },
    });

    showCreateModal.value = false;
    newAssignment.value = { title: "", description: "", dueAt: "" };
    await loadClassData();
  } catch (err: any) {
    createError.value = err?.message || "Gagal membuat tugas baru.";
  } finally {
    creating.value = false;
  }
};

const formatDateTime = (isoDate: string) => {
  if (!isoDate) return "-";
  return new Date(isoDate).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const isPastDue = (isoDate: string) => {
  return new Date() > new Date(isoDate);
};

onMounted(() => {
  loadClassData();
});
</script>

<style scoped>
.class-header {
  margin-bottom: 1.5rem;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.breadcrumb {
  font-size: 0.85rem;
  color: var(--primary);
}

h2 {
  font-size: 1.5rem;
  margin-bottom: 0.35rem;
}

.class-description {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin-bottom: 1rem;
}

.teachers-list {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
}

.teacher-badge {
  background: #f1f5f9;
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-sm);
  font-weight: 500;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.5rem;
}

.tab-btn {
  padding: 0.5rem 1rem;
  font-weight: 500;
  font-size: 0.9rem;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
}

.tab-btn.active {
  background: var(--primary-light);
  color: var(--primary);
  font-weight: 600;
}

.section-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.assignments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.assignment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.assignment-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
}

.assignment-desc {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.due-info {
  font-size: 0.825rem;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.badge-due {
  font-size: 0.7rem;
}

.member-list {
  list-style: none;
  margin-top: 0.75rem;
}

.member-item {
  display: flex;
  justify-content: space-between;
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--border);
  font-size: 0.875rem;
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
  max-width: 500px;
  width: 100%;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.text-sm {
  font-size: 0.85rem;
}
</style>

