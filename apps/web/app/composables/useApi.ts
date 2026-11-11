export const useApi = () => {
  const config = useRuntimeConfig();

  const fetchWithAuth = async <T>(
    endpoint: string,
    options: Parameters<typeof $fetch>[1] = {}
  ): Promise<T> => {
    try {
      const url = `${config.public.apiBase}${endpoint}`;
      return await $fetch<T>(url, {
        ...options,
        credentials: "include", // Ensure session cookies are sent and received
      });
    } catch (err: any) {
      // Standardize API error message
      const errorMessage =
        err?.data?.error?.message ||
        err?.message ||
        "Terjadi kesalahan saat memproses permintaan.";
      const errorObj = new Error(errorMessage) as any;
      errorObj.statusCode = err?.status || err?.statusCode || 500;
      errorObj.code = err?.data?.error?.code || "UNKNOWN_ERROR";
      errorObj.data = err?.data;
      throw errorObj;
    }
  };

  return {
    fetchWithAuth,
  };
};

