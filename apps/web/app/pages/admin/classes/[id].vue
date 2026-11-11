<template>
  <div class="admin-class-roster-page">
    <div class="mb-3">
      <NuxtLink to="/admin/classes" class="breadcrumb">
        &larr; Kembali ke Kelola Kelas
      </NuxtLink>
    </div>

    <div v-if="loading" class="card text-center py-4 text-muted">
      Memuat data kelas dan anggota...
    </div>

    <div v-else-if="error" class="card alert alert-danger text-center">
      <h3>Terjadi Kesalahan</h3>
      <p>{{ error }}</p>
    </div>

    <template v-else-if="cls">
      <!-- Class Info Card -->
      <div class="card mb-4 class-info-card">
        <div class="class-info-main">
          <h2>{{ cls.name }}</h2>
          <p class="text-muted">{{ cls.description || "Tidak ada deskripsi." }}</p>
        </div>
        <div class="class-status-box">
          <label class="form-label" for="cls-status">Status Kelas:</label>
          <select
            id="cls-status"
            v-model="cls.status"
            class="form-select form-select-sm"
            @change="handleStatusChange"
          >
            <option value="ACTIVE">ACTIVE (Aktif)</option>
            <option value="ARCHIVED">ARCHIVED (Diarsipkan)</option>
          </select>
        </div>
      </div>

      <!-- Feedback message -->
      <div v-if="feedbackMsg" class="alert alert-success mb-4">
        {{ feedbackMsg }}
      </div>

      <div class="grid-2">
        <!-- ── MANAGE TEACHERS ───────────────────────────────────────── -->
        <div class="card roster-card">
          <div class="roster-header">
            <div>
              <h3>Guru Kelas</h3>
              <p class="text-muted text-xs">Pilih guru yang berhak mengajar kelas ini.</p>
            </div>
            <button
              class="btn btn-primary btn-sm"
              :disabled="savingTeachers"
              @click="saveTeachers"
            >
              <span v-if="savingTeachers">Menyimpan...</span>
              <span v-else>Simpan Guru</span>
            </button>
          </div>

          <div v-if="availableTeachers.length === 0" class="text-muted text-sm py-3">
            Belum ada akun pengguna dengan role TEACHER di sistem.
          </div>

          <div v-else class="roster-list mt-3">
            <label
              v-for="t in availableTeachers"
              :key="t.id"
              class="roster-item"
            >
              <input
                type="checkbox"
                :value="t.id"
                v-model="selectedTeacherIds"
              />
              <div class="roster-info">
                <strong>{{ t.name }}</strong>
                <span class="text-xs text-muted">{{ t.email }}</span>
              </div>
            </label>
          </div>
        </div>

        <!-- ── MANAGE STUDENTS ───────────────────────────────────────── -->
        <div class="card roster-card">
          <div class="roster-header">
            <div>
              <h3>Murid Terdaftar</h3>
              <p class="text-muted text-xs">Pilih murid yang mengikuti kelas ini.</p>
            </div>
            <button
              class="btn btn-primary btn-sm"
              :disabled="savingStudents"
              @click="saveStudents"
            >
              <span v-if="savingStudents">Menyimpan...</span>
              <span v-else>Simpan Murid</span>
            </button>
          </div>

          <div v-if="availableStudents.length === 0" class="text-muted text-sm py-3">
            Belum ada akun pengguna dengan role STUDENT di sistem.
          </div>

          <div v-else class="roster-list mt-3">
            <label
              v-for="s in availableStudents"
              :key="s.id"
              class="roster-item"
            >
              <input
                type="checkbox"
                :value="s.id"
                v-model="selectedStudentIds"
              />
              <div class="roster-info">
                <strong>{{ s.name }}</strong>
                <span class="text-xs text-muted">{{ s.email }}</span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "../../../types/auth";

definePageMeta({
  middleware: ["admin"],
});

const route = useRoute();
const classId = route.params.id as string;

const { fetchWithAuth } = useApi();

const cls = ref<any>(null);
const availableTeachers = ref<any[]>([]);
const availableStudents = ref<any[]>([]);
const selectedTeacherIds = ref<string[]>([]);
const selectedStudentIds = ref<string[]>([]);

const loading = ref(true);
const savingTeachers = ref(false);
const savingStudents = ref(false);
const error = ref("");
const feedbackMsg = ref("");

const loadData = async () => {
  loading.value = true;
  error.value = "";
  try {
    const [clsRes, membersRes, allUsersRes] = await Promise.all([
      fetchWithAuth<ApiResponse<any>>(`/api/v1/admin/classes/${classId}`),
      fetchWithAuth<ApiResponse<any>>(`/api/v1/admin/classes/${classId}/members`),
      fetchWithAuth<ApiResponse<any[]>>(`/api/v1/admin/users?limit=100`),
    ]);

    cls.value = clsRes.data;

    // Filter available teachers & students
    const allUsers = allUsersRes.data || [];
    availableTeachers.value = allUsers.filter((u: any) => u.role === "TEACHER" && u.isActive);
    availableStudents.value = allUsers.filter((u: any) => u.role === "STUDENT" && u.isActive);

    // Selected IDs from current class memberships
    selectedTeacherIds.value = (membersRes.data?.teachers || []).map((t: any) => t.id);
    selectedStudentIds.value = (membersRes.data?.students || []).map((s: any) => s.id);
  } catch (err: any) {
    error.value = err?.message || "Gagal memuat data kelas.";
  } finally {
    loading.value = false;
  }
};

const handleStatusChange = async () => {
  try {
    await fetchWithAuth(`/api/v1/admin/classes/${classId}`, {
      method: "PATCH",
      body: { status: cls.value.status },
    });
    showFeedback("Status kelas berhasil diperbarui.");
  } catch (err: any) {
    alert(err?.message || "Gagal mengubah status kelas.");
  }
};

const saveTeachers = async () => {
  savingTeachers.value = true;
  try {
    await fetchWithAuth(`/api/v1/admin/classes/${classId}/teachers`, {
      method: "PUT",
      body: { teacherIds: selectedTeacherIds.value },
    });
    showFeedback("Daftar guru kelas berhasil disimpan.");
  } catch (err: any) {
    alert(err?.message || "Gagal menyimpan guru kelas.");
  } finally {
    savingTeachers.value = false;
  }
};

const saveStudents = async () => {
  savingStudents.value = true;
  try {
    await fetchWithAuth(`/api/v1/admin/classes/${classId}/students`, {
      method: "PUT",
      body: { studentIds: selectedStudentIds.value },
    });
    showFeedback("Daftar murid kelas berhasil disimpan.");
  } catch (err: any) {
    alert(err?.message || "Gagal menyimpan murid kelas.");
  } finally {
    savingStudents.value = false;
  }
};

const showFeedback = (msg: string) => {
  feedbackMsg.value = msg;
  setTimeout(() => {
    feedbackMsg.value = "";
  }, 4000);
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.breadcrumb {
  font-size: 0.85rem;
  color: var(--primary);
}

.class-info-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.class-info-main h2 {
  font-size: 1.4rem;
  margin-bottom: 0.25rem;
}

.form-select-sm {
  padding: 0.35rem 0.6rem;
  font-size: 0.85rem;
}

.roster-card {
  display: flex;
  flex-direction: column;
}

.roster-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border);
}

.roster-header h3 {
  font-size: 1.1rem;
}

.roster-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 420px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.roster-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  cursor: pointer;
  transition: background 0.15s ease;
}

.roster-item:hover {
  background: #f8fafc;
}

.roster-info {
  display: flex;
  flex-direction: column;
}

.alert-success {
  background: var(--success-bg);
  color: var(--success);
  border: 1px solid #bbf7d0;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
}

.text-xs {
  font-size: 0.75rem;
}

.text-sm {
  font-size: 0.85rem;
}
</style>

