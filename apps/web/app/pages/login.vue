<template>
  <div class="login-wrapper">
    <div class="card login-card">
      <div class="login-header">
        <span class="login-icon">🔐</span>
        <h2>Masuk ke Akun</h2>
        <p class="text-muted">Gunakan kredensial akun LMS Anda</p>
      </div>

      <div v-if="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label class="form-label" for="email">Alamat Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="form-input"
            placeholder="nama@lms.local"
            required
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="password">Kata Sandi</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="form-input"
            placeholder="••••••••"
            required
            autocomplete="current-password"
          />
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-block"
          :disabled="loading"
        >
          <span v-if="loading">Memproses...</span>
          <span v-else>Masuk</span>
        </button>
      </form>

      <div class="demo-box">
        <p class="demo-title">Akun Uji Coba Cepat (Demo):</p>
        <div class="demo-buttons">
          <button
            type="button"
            class="btn btn-secondary btn-xs"
            @click="fillDemo('admin@lms.local', 'Admin123!')"
          >
            Admin Demo
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ["guest"],
});

const email = ref("");
const password = ref("");
const errorMessage = ref("");

const { login, loading } = useAuth();

const handleLogin = async () => {
  errorMessage.value = "";
  try {
    await login(email.value, password.value);
    await navigateTo("/dashboard");
  } catch (err: any) {
    errorMessage.value =
      err?.message || "Email atau kata sandi tidak valid.";
  }
};

const fillDemo = (demoEmail: string, demoPass: string) => {
  email.value = demoEmail;
  password.value = demoPass;
};
</script>

<style scoped>
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
}

.login-card {
  max-width: 420px;
  width: 100%;
}

.login-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.login-icon {
  font-size: 2.25rem;
}

h2 {
  font-size: 1.5rem;
  margin: 0.5rem 0 0.25rem;
}

.text-muted {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.alert {
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  margin-bottom: 1.25rem;
}

.alert-danger {
  background: var(--danger-bg);
  color: var(--danger);
  border: 1px solid #fecaca;
}

.btn-block {
  width: 100%;
  padding: 0.75rem;
  font-size: 0.95rem;
}

.demo-box {
  margin-top: 1.75rem;
  padding-top: 1.25rem;
  border-top: 1px dashed var(--border);
}

.demo-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.demo-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.btn-xs {
  padding: 0.3rem 0.6rem;
  font-size: 0.75rem;
}
</style>

