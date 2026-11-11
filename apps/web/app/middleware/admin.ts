export default defineNuxtRouteMiddleware(async () => {
  const { user, initialized, fetchUser } = useAuth();

  if (!initialized.value) {
    await fetchUser();
  }

  if (!user.value) {
    return navigateTo("/login");
  }

  if (user.value.role !== "ADMIN") {
    return navigateTo("/dashboard");
  }
});

