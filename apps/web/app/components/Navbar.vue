<template>
  <header class="navbar">
    <div class="nav-container">
      <div class="nav-left">
        <NuxtLink to="/dashboard" class="brand">
          <span class="brand-icon">🎓</span>
          <span class="brand-name">LMS Mini</span>
        </NuxtLink>

        <nav v-if="isAuthenticated" class="nav-links">
          <NuxtLink to="/dashboard" class="nav-link" active-class="active">
            Dashboard
          </NuxtLink>

          <!-- Guru & Murid Link -->
          <NuxtLink
            v-if="!isAdmin"
            to="/classes"
            class="nav-link"
            active-class="active"
          >
            Kelas Saya
          </NuxtLink>

          <!-- Admin Links -->
          <template v-if="isAdmin">
            <NuxtLink
              to="/admin/classes"
              class="nav-link"
              active-class="active"
            >
              Kelola Kelas
            </NuxtLink>
            <NuxtLink
              to="/admin/users"
              class="nav-link"
              active-class="active"
            >
              Kelola Pengguna
            </NuxtLink>
          </template>
        </nav>
      </div>

      <div class="nav-right">
        <template v-if="isAuthenticated && user">
          <div class="user-info">
            <span class="user-name">{{ user.name }}</span>
            <span :class="['badge', `badge-${user.role.toLowerCase()}`]">
              {{ user.role }}
            </span>
          </div>
          <button @click="logout" class="btn btn-secondary btn-sm">
            Logout
          </button>
        </template>
        <template v-else>
          <NuxtLink to="/login" class="btn btn-primary btn-sm">
            Login
          </NuxtLink>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const { user, isAuthenticated, isAdmin, logout } = useAuth();
</script>

<style scoped>
.navbar {
  background: #ffffff;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 50;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1.15rem;
  color: var(--text-main);
  text-decoration: none;
}

.brand-icon {
  font-size: 1.35rem;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-link {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius-sm);
  transition: all 0.15s ease;
}

.nav-link:hover {
  color: var(--text-main);
  background: #f1f5f9;
}

.nav-link.active {
  color: var(--primary);
  background: var(--primary-light);
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-name {
  font-size: 0.9rem;
  font-weight: 600;
}

.btn-sm {
  padding: 0.4rem 0.85rem;
  font-size: 0.825rem;
}

@media (max-width: 768px) {
  .nav-container {
    padding: 0 1rem;
  }
  .nav-links {
    display: none;
  }
}
</style>

