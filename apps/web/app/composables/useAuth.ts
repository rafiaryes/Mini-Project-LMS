import type { ApiResponse, User } from "../types/auth";

export const useAuth = () => {
  const user = useState<User | null>("auth_user", () => null);
  const loading = useState<boolean>("auth_loading", () => false);
  const initialized = useState<boolean>("auth_initialized", () => false);

  const { fetchWithAuth } = useApi();

  const fetchUser = async (): Promise<User | null> => {
    try {
      loading.value = true;
      const res = await fetchWithAuth<ApiResponse<User>>("/api/v1/auth/me");
      user.value = res.data;
      return res.data;
    } catch {
      user.value = null;
      return null;
    } finally {
      loading.value = false;
      initialized.value = true;
    }
  };

  const login = async (emailInput: string, passwordInput: string): Promise<User> => {
    loading.value = true;
    try {
      const res = await fetchWithAuth<ApiResponse<User>>("/api/v1/auth/login", {
        method: "POST",
        body: {
          email: emailInput,
          password: passwordInput,
        },
      });

      user.value = res.data;
      return res.data;
    } finally {
      loading.value = false;
    }
  };

  const logout = async (): Promise<void> => {
    loading.value = true;
    try {
      await fetchWithAuth("/api/v1/auth/logout", {
        method: "POST",
      });
    } catch (e) {
      console.warn("Logout error:", e);
    } finally {
      user.value = null;
      loading.value = false;
      await navigateTo("/login");
    }
  };

  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.role === "ADMIN");
  const isTeacher = computed(() => user.value?.role === "TEACHER");
  const isStudent = computed(() => user.value?.role === "STUDENT");

  return {
    user,
    loading,
    initialized,
    isAuthenticated,
    isAdmin,
    isTeacher,
    isStudent,
    fetchUser,
    login,
    logout,
  };
};

