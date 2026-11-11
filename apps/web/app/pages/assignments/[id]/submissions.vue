<template>
  <div class="submissions-page">
    <div class="mb-3">
      <NuxtLink :to="`/assignments/${assignmentId}`" class="breadcrumb">
        &larr; Kembali ke Detail Tugas
      </NuxtLink>
    </div>

    <div v-if="loading" class="card text-center py-4 text-muted">
      Memuat daftar pengumpulan murid...
    </div>

    <div v-else-if="error" class="card alert alert-danger text-center">
      <h3>Akses Ditolak</h3>
      <p>{{ error }}</p>
    </div>

    <template v-else>
      <div class="page-header card mb-4">
        <div>
          <h2>Pengumpulan Tugas Murid</h2>
          <p class="subtitle">{{ assignment?.title }} ({{ assignment?.className }})</p>
        </div>
        <div class="stats-badge">
          Total Pengumpulan: <strong>{{ submissions.length }}</strong>
        </div>
      </div>

      <div v-if="submissions.length === 0" class="card empty-card text-center">
        <span class="empty-icon">📭</span>
        <h3>Belum ada murid yang mengumpulkan jawaban</h3>
        <p class="text-muted">
          Daftar pengumpulan akan muncul di sini begitu murid mengirimkan jawaban mereka.
        </p>
      </div>

      <div v-else class="table-container card">
        <table class="table">
          <thead>
            <tr>
              <th>Nama Murid</th>
              <th>Waktu Kirim</th>
              <th>Jawaban Teks</th>
              <th>Lampiran Berkas</th>
              <th>Nilai</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sub in submissions" :key="sub.id">
              <td>
                <strong>{{ sub.studentName }}</strong>
                <div class="text-xs text-muted">{{ sub.studentEmail }}</div>
              </td>
              <td class="text-sm">
                {{ formatDateTime(sub.submittedAt) }}
              </td>
              <td>
                <button
                  v-if="sub.answerText"
                  class="btn btn-secondary btn-xs"
                  @click="viewText(sub.studentName, sub.answerText)"
                >
                  Lihat Jawaban
                </button>
                <span v-else class="text-muted text-xs">-</span>
              </td>
              <td>
                <button
                  v-if="sub.originalFileName"
                  class="btn btn-secondary btn-xs"
                  @click="downloadFile(sub.id)"
                >
                  📎 {{ sub.originalFileName }}
                </button>
                <span v-else class="text-muted text-xs">-</span>
              </td>
              <td>
                <span v-if="sub.grade !== null" class="badge badge-success">
                  {{ sub.grade }} / 100
                </span>
                <span v-else class="badge badge-warning">
                  Belum Dinilai
                </span>
              </td>
              <td>
                <button
                  class="btn btn-primary btn-xs"
                  @click="openGradeModal(sub)"
                >
                  {{ sub.grade !== null ? "Edit Nilai" : "Beri Nilai" }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- ── MODAL: VIEW TEXT ANSWER ─────────────────────────────────── -->
    <div v-if="showTextModal" class="modal-backdrop">
      <div class="modal card">
        <h3>Jawaban: {{ activeStudentName }}</h3>
        <div class="text-answer-content mt-3">
          {{ activeTextContent }}
        </div>
        <div class="modal-footer mt-4">
          <button class="btn btn-secondary btn-sm" @click="showTextModal = false">
            Tutup
          </button>
        </div>
      </div>
    </div>

    <!-- ── MODAL: GRADE SUBMISSION ─────────────────────────────────── -->
    <div v-if="showGradeModal" class="modal-backdrop">
      <div class="modal card">
        <h3>Penilaian Tugas</h3>
        <p class="text-muted text-sm mb-3">
          Murid: <strong>{{ activeSubmission?.studentName }}</strong>
        </p>

        <form @submit.prevent="handleGradeSubmit">
          <div class="form-group">
            <label class="form-label" for="grade-input">Nilai (0 - 100) *</label>
            <input
              id="grade-input"
              v-model.number="gradeForm.grade"
              type="number"
              min="0"
              max="100"
              step="0.01"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="comment-input">Komentar / Catatan Guru</label>
            <textarea
              id="comment-input"
              v-model="gradeForm.comment"
              class="form-textarea"
              rows="4"
              placeholder="Berikan umpan balik atau apresiasi atas jawaban murid..."
            ></textarea>
          </div>

          <div v-if="gradeError" class="alert alert-danger text-sm mb-3">
            {{ gradeError }}
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              @click="showGradeModal = false"
              :disabled="grading"
            >
              Batal
            </button>
            <button
              type="submit"
              class="btn btn-primary btn-sm"
              :disabled="grading"
            >
              <span v-if="grading">Menyimpan...</span>
              <span v-else>Simpan Nilai</span>
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
  middleware: ["auth"],
});

const route = useRoute();
const assignmentId = route.params.id as string;

const config = useRuntimeConfig();
const { isTeacher } = useAuth();
const { fetchWithAuth } = useApi();

const assignment = ref<any>(null);
const submissions = ref<any[]>([]);
const loading = ref(true);
const error = ref("");

// Modal text preview
const showTextModal = ref(false);
const activeStudentName = ref("");
const activeTextContent = ref("");

// Modal grade
const showGradeModal = ref(false);
const grading = ref(false);
const gradeError = ref("");
const activeSubmission = ref<any>(null);
const gradeForm = ref({
  grade: 80,
  comment: "",
});

const loadData = async () => {
  loading.value = true;
  error.value = "";
  try {
    const [assignRes, subRes] = await Promise.all([
      fetchWithAuth<ApiResponse<any>>(`/api/v1/assignments/${assignmentId}`),
      fetchWithAuth<ApiResponse<any[]>>(
        `/api/v1/assignments/${assignmentId}/submissions`
      ),
    ]);

    assignment.value = assignRes.data;
    submissions.value = subRes.data || [];
  } catch (err: any) {
    error.value =
      err?.message ||
      "Gagal memuat submission atau Anda bukan guru di kelas tugas ini.";
  } finally {
    loading.value = false;
  }
};

const viewText = (studentName: string, text: string) => {
  activeStudentName.value = studentName;
  activeTextContent.value = text;
  showTextModal.value = true;
};

const downloadFile = (subId: string) => {
  // Direct file stream endpoint (authorized with cookie)
  const url = `${config.public.apiBase}/api/v1/submissions/${subId}/file`;
  window.open(url, "_blank");
};

const openGradeModal = (sub: any) => {
  activeSubmission.value = sub;
  gradeForm.value = {
    grade: sub.grade !== null ? Number(sub.grade) : 80,
    comment: sub.teacherComment || "",
  };
  gradeError.value = "";
  showGradeModal.value = true;
};

const handleGradeSubmit = async () => {
  if (!activeSubmission.value) return;

  grading.value = true;
  gradeError.value = "";
  try {
    await fetchWithAuth(
      `/api/v1/submissions/${activeSubmission.value.id}/grade`,
      {
        method: "PATCH",
        body: {
          grade: gradeForm.value.grade,
          comment: gradeForm.value.comment,
        },
      }
    );

    showGradeModal.value = false;
    await loadData();
  } catch (err: any) {
    gradeError.value = err?.message || "Gagal menyimpan nilai.";
  } finally {
    grading.value = false;
  }
};

const formatDateTime = (isoDate: string) => {
  if (!isoDate) return "-";
  return new Date(isoDate).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h2 {
  font-size: 1.4rem;
  margin-bottom: 0.25rem;
}

.stats-badge {
  background: var(--primary-light);
  color: var(--primary);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
}

.empty-card {
  padding: 3rem 1rem;
}

.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.5rem;
}

.text-answer-content {
  background: #f8fafc;
  border: 1px solid var(--border);
  padding: 1rem;
  border-radius: var(--radius-sm);
  white-space: pre-wrap;
  font-size: 0.9rem;
  max-height: 400px;
  overflow-y: auto;
  line-height: 1.6;
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
}

.btn-xs {
  padding: 0.25rem 0.6rem;
  font-size: 0.75rem;
}

.text-xs {
  font-size: 0.75rem;
}

.text-sm {
  font-size: 0.85rem;
}
</style>

