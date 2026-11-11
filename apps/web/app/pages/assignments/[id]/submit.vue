<template>
  <div class="submit-page">
    <div v-if="loading" class="card text-center py-4 text-muted">
      Memuat formulir pengumpulan...
    </div>

    <div v-else-if="error" class="card alert alert-danger text-center">
      <h3>Tidak Dapat Mengumpulkan</h3>
      <p>{{ error }}</p>
      <NuxtLink :to="`/assignments/${assignmentId}`" class="btn btn-secondary btn-sm mt-3">
        &larr; Kembali ke Detail Tugas
      </NuxtLink>
    </div>

    <template v-else-if="assignment">
      <div class="mb-3">
        <NuxtLink :to="`/assignments/${assignmentId}`" class="breadcrumb">
          &larr; Kembali ke Detail Tugas
        </NuxtLink>
      </div>

      <div class="card submit-card">
        <div class="card-header">
          <h2>Kirim Jawaban Tugas</h2>
          <p class="subtitle">{{ assignment.title }}</p>
        </div>

        <div class="deadline-banner" :class="{ 'deadline-danger': isPastDue(assignment.dueAt) }">
          <span>📅 Batas Waktu: <strong>{{ formatDateTime(assignment.dueAt) }}</strong></span>
          <span v-if="isPastDue(assignment.dueAt)" class="badge badge-danger">
            Sudah Lewat Tenggat
          </span>
        </div>

        <div v-if="isPastDue(assignment.dueAt)" class="alert alert-danger mt-3">
          Batas waktu pengumpulan telah berakhir. Sistem menolak pengiriman jawaban baru.
        </div>

        <form v-else @submit.prevent="handleSubmit" class="submit-form mt-4">
          <!-- Text Answer -->
          <div class="form-group">
            <label class="form-label" for="answer-text">
              Jawaban Teks
              <span class="text-muted text-sm">(Bisa diisi jika tidak mengunggah file atau sebagai pengantar)</span>
            </label>
            <textarea
              id="answer-text"
              v-model="answerText"
              class="form-textarea"
              rows="6"
              placeholder="Tuliskan jawaban Anda di sini..."
            ></textarea>
          </div>

          <!-- File Upload -->
          <div class="form-group">
            <label class="form-label" for="answer-file">
              Lampiran Berkas
              <span class="text-muted text-sm">(Format: PDF, DOCX, TXT, ZIP, Gambar - Maks 10 MB)</span>
            </label>
            <input
              id="answer-file"
              type="file"
              class="form-input"
              @change="handleFileChange"
              accept=".pdf,.docx,.doc,.txt,.zip,.png,.jpg,.jpeg"
            />
            <p v-if="selectedFile" class="text-xs text-muted mt-1">
              Berkas terpilih: <strong>{{ selectedFile.name }}</strong> ({{ (selectedFile.size / 1024).toFixed(1) }} KB)
            </p>
          </div>

          <div v-if="submitError" class="alert alert-danger mb-3">
            {{ submitError }}
          </div>

          <div class="form-actions">
            <NuxtLink
              :to="`/assignments/${assignmentId}`"
              class="btn btn-secondary"
              :disabled="submitting"
            >
              Batal
            </NuxtLink>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="submitting || (!answerText.trim() && !selectedFile)"
            >
              <span v-if="submitting">Mengirim...</span>
              <span v-else>Kirim Jawaban</span>
            </button>
          </div>
        </form>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "../../../types/auth";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const assignmentId = route.params.id as string;

const { user, isStudent } = useAuth();
const { fetchWithAuth } = useApi();

const assignment = ref<any>(null);
const answerText = ref("");
const selectedFile = ref<File | null>(null);
const loading = ref(true);
const submitting = ref(false);
const error = ref("");
const submitError = ref("");

const loadData = async () => {
  if (!isStudent.value) {
    error.value = "Hanya murid yang dapat mengakses halaman pengumpulan ini.";
    loading.value = false;
    return;
  }

  loading.value = true;
  try {
    const [assignRes, subRes] = await Promise.all([
      fetchWithAuth<ApiResponse<any>>(`/api/v1/assignments/${assignmentId}`),
      fetchWithAuth<ApiResponse<any>>(
        `/api/v1/assignments/${assignmentId}/my-submission`
      ).catch(() => ({ data: null })),
    ]);

    assignment.value = assignRes.data;

    // Prefill existing text if revision
    if (subRes.data?.answerText) {
      answerText.value = subRes.data.answerText;
    }
  } catch (err: any) {
    error.value =
      err?.message || "Gagal memuat tugas atau Anda tidak memiliki akses.";
  } finally {
    loading.value = false;
  }
};

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0];
  } else {
    selectedFile.value = null;
  }
};

const handleSubmit = async () => {
  submitError.value = "";
  submitting.value = true;

  try {
    const formData = new FormData();
    if (answerText.value.trim()) {
      formData.append("answerText", answerText.value.trim());
    }
    if (selectedFile.value) {
      formData.append("file", selectedFile.value);
    }

    await fetchWithAuth(`/api/v1/assignments/${assignmentId}/my-submission`, {
      method: "PUT",
      body: formData,
    });

    await navigateTo(`/assignments/${assignmentId}`);
  } catch (err: any) {
    submitError.value = err?.message || "Gagal mengirimkan jawaban.";
  } finally {
    submitting.value = false;
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
  loadData();
});
</script>

<style scoped>
.submit-card {
  max-width: 680px;
  margin: 0 auto;
}

.card-header h2 {
  font-size: 1.4rem;
  margin-bottom: 0.25rem;
}

.deadline-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  margin-top: 1rem;
  font-size: 0.9rem;
}

.deadline-danger {
  background: var(--danger-bg);
  border-color: #fecaca;
  color: var(--danger);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.text-xs {
  font-size: 0.75rem;
}

.text-sm {
  font-size: 0.825rem;
}
</style>

