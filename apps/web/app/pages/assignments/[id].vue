<template>
  <div class="assignment-detail-page">
    <div v-if="loading" class="card text-center py-4 text-muted">
      Memuat detail tugas...
    </div>

    <div v-else-if="error" class="card alert alert-danger text-center">
      <h3>Akses Ditolak / Tugas Tidak Ditemukan</h3>
      <p>{{ error }}</p>
      <NuxtLink to="/classes" class="btn btn-secondary btn-sm mt-3">
        &larr; Kembali ke Kelas
      </NuxtLink>
    </div>

    <template v-else-if="assignment">
      <!-- Breadcrumb -->
      <div class="mb-3">
        <NuxtLink :to="`/classes/${assignment.classId}`" class="breadcrumb">
          &larr; Kembali ke Kelas {{ assignment.className }}
        </NuxtLink>
      </div>

      <!-- Assignment Header Card -->
      <div class="card mb-4">
        <div class="header-status">
          <span class="class-tag">🏫 {{ assignment.className }}</span>
          <span v-if="assignment.isArchived" class="badge badge-warning">
            Diarsipkan
          </span>
        </div>

        <h2>{{ assignment.title }}</h2>

        <div class="meta-row">
          <span class="meta-item">
            📅 Batas Waktu:
            <strong>{{ formatDateTime(assignment.dueAt) }}</strong>
          </span>
          <span
            v-if="isPastDue(assignment.dueAt)"
            class="badge badge-danger"
          >
            Batas Waktu Telah Lewat
          </span>
        </div>

        <div class="assignment-body">
          <h4>Petunjuk Pengerjaan:</h4>
          <p class="desc-content">
            {{ assignment.description || "Tidak ada petunjuk khusus." }}
          </p>
        </div>

        <!-- Teacher Actions -->
        <div v-if="isTeacher" class="teacher-actions mt-4 pt-3 border-top">
          <NuxtLink
            :to="`/assignments/${assignmentId}/submissions`"
            class="btn btn-primary"
          >
            📋 Lihat & Nilai Submission Murid
          </NuxtLink>
        </div>
      </div>

      <!-- ── STUDENT SUBMISSION STATUS CARD ────────────────────────── -->
      <div v-if="isStudent" class="card submission-status-card">
        <h3>Status Pengumpulan Saya</h3>

        <div v-if="!mySubmission" class="no-submission-box">
          <p class="text-muted">
            Anda belum mengumpulkan jawaban untuk tugas ini.
          </p>
          <div class="mt-3">
            <NuxtLink
              v-if="!isPastDue(assignment.dueAt)"
              :to="`/assignments/${assignmentId}/submit`"
              class="btn btn-primary"
            >
              📤 Kirim Jawaban Sekarang
            </NuxtLink>
            <span v-else class="text-danger font-medium">
              Batas waktu pengumpulan telah berakhir. Pengiriman tidak dapat dilakukan.
            </span>
          </div>
        </div>

        <div v-else class="submission-detail-box">
          <div class="status-badge-row">
            <span class="badge badge-success">✓ Sudah Mengumpulkan</span>
            <span v-if="mySubmission.grade !== null" class="badge badge-admin">
              Dinilai: {{ mySubmission.grade }} / 100
            </span>
            <span v-else class="badge badge-warning">
              Menunggu Penilaian Guru
            </span>
          </div>

          <div class="submission-info-grid mt-3">
            <div>
              <span class="info-label">Waktu Pengumpulan:</span>
              <span>{{ formatDateTime(mySubmission.submittedAt) }}</span>
            </div>
            <div v-if="mySubmission.originalFileName">
              <span class="info-label">Berkas Lampiran:</span>
              <span>📎 {{ mySubmission.originalFileName }}</span>
            </div>
          </div>

          <!-- Student Answer Preview -->
          <div v-if="mySubmission.answerText" class="mt-3">
            <span class="info-label">Jawaban Teks:</span>
            <div class="answer-preview-box">
              {{ mySubmission.answerText }}
            </div>
          </div>

          <!-- Teacher Grade & Comment Section -->
          <div v-if="mySubmission.grade !== null" class="grade-feedback-box mt-3">
            <h4>Nilai & Komentar Guru:</h4>
            <div class="grade-score">{{ mySubmission.grade }} / 100</div>
            <p v-if="mySubmission.teacherComment" class="grade-comment">
              "{{ mySubmission.teacherComment }}"
            </p>
            <p v-else class="text-muted text-sm">Tidak ada catatan komentar dari guru.</p>
          </div>

          <!-- Update submission button if before due date -->
          <div v-if="!isPastDue(assignment.dueAt)" class="mt-4 pt-3 border-top">
            <NuxtLink
              :to="`/assignments/${assignmentId}/submit`"
              class="btn btn-secondary btn-sm"
            >
              ✏ Perbarui Jawaban (Revisi)
            </NuxtLink>
            <p class="text-xs text-muted mt-1">
              Catatan: Memperbarui jawaban sebelum tenggat akan mereset nilai sebelumnya.
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "../../types/auth";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const assignmentId = route.params.id as string;

const { isTeacher, isStudent } = useAuth();
const { fetchWithAuth } = useApi();

const assignment = ref<any>(null);
const mySubmission = ref<any>(null);
const loading = ref(true);
const error = ref("");

const loadAssignmentData = async () => {
  loading.value = true;
  error.value = "";
  try {
    const res = await fetchWithAuth<ApiResponse<any>>(
      `/api/v1/assignments/${assignmentId}`
    );
    assignment.value = res.data;

    // If student, load full my-submission detail
    if (isStudent.value) {
      try {
        const subRes = await fetchWithAuth<ApiResponse<any>>(
          `/api/v1/assignments/${assignmentId}/my-submission`
        );
        mySubmission.value = subRes.data;
      } catch {
        // No submission yet
      }
    }
  } catch (err: any) {
    error.value =
      err?.message || "Gagal memuat tugas atau Anda tidak memiliki hak akses.";
  } finally {
    loading.value = false;
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
  loadAssignmentData();
});
</script>

<style scoped>
.breadcrumb {
  font-size: 0.875rem;
  color: var(--primary);
}

.header-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.class-tag {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 500;
}

h2 {
  font-size: 1.6rem;
  margin-bottom: 0.5rem;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  font-size: 0.9rem;
}

.assignment-body {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.assignment-body h4 {
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
  color: #334155;
}

.desc-content {
  font-size: 0.95rem;
  white-space: pre-line;
  line-height: 1.6;
}

.submission-status-card {
  border-top: 4px solid var(--primary);
}

.status-badge-row {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.info-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 0.2rem;
}

.answer-preview-box {
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  white-space: pre-line;
}

.grade-feedback-box {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: var(--radius-sm);
  padding: 1rem;
}

.grade-feedback-box h4 {
  font-size: 0.9rem;
  color: #166534;
  margin-bottom: 0.25rem;
}

.grade-score {
  font-size: 1.5rem;
  font-weight: 700;
  color: #15803d;
  margin-bottom: 0.35rem;
}

.grade-comment {
  font-style: italic;
  font-size: 0.9rem;
  color: #166534;
}

.border-top {
  border-top: 1px solid var(--border);
}

.text-danger {
  color: var(--danger);
}

.text-xs {
  font-size: 0.75rem;
}
</style>

