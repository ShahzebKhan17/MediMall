const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    credentials: "include", // Automatically send & receive HttpOnly cookies
    headers,
  });

  if (!response.ok) {
    let errorMessage = `API error (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorMessage = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  auth: {
    login: async (payload: { email: string; password?: string }) => {
      return apiFetch<{ access_token: string; token_type: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: payload.email,
          password: payload.password || "securepassword",
        }),
      });
    },
    logout: async () => {
      return apiFetch<{ status: string; message: string }>("/auth/logout", {
        method: "POST",
      });
    },
    register: async (userData: {
      email: string;
      password?: string;
      name: string;
      role?: string;
      phone?: string;
      address?: string;
      allergies?: string;
      blood_group?: string;
    }) => {
      const res = await apiFetch<{
        id: string;
        email: string;
        name: string;
        role: string;
        phone?: string;
        address?: string;
      }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: userData.email,
          password: userData.password || "securepassword",
          name: userData.name,
          role: userData.role || "patient",
          phone: userData.phone || "",
          address: userData.address || "",
          allergies: userData.allergies || "",
          blood_group: userData.blood_group || "O+",
        }),
      });
      // Automatically login to retrieve token
      try {
        await api.auth.login({
          email: userData.email,
          password: userData.password || "securepassword",
        });
      } catch (e) {
        console.warn("Auto login after register failed", e);
      }
      return res;
    },
    getMe: async () => {
      return apiFetch<{
        id: string;
        email: string;
        name: string;
        role: string;
        age?: number;
        gender?: string;
        phone?: string;
        address?: string;
        allergies?: string;
        blood_group?: string;
      }>("/auth/me");
    },
    updateMe: async (data: Record<string, any>) => {
      return apiFetch("/auth/me", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
  },

  medicines: {
    getAll: async (q?: string, type?: string) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (type && type !== "All medicines") params.set("type", type);
      const queryString = params.toString() ? `?${params.toString()}` : "";
      return apiFetch<
        Array<{
          id: number;
          name: string;
          brand: string;
          price: number;
          type: string;
          rx: boolean;
          color: string;
          stock: number;
        }>
      >(`/medicines/${queryString}`);
    },
    create: async (medicine: {
      name: string;
      brand: string;
      price: number;
      type: string;
      rx?: boolean;
      color?: string;
      stock?: number;
    }) => {
      return apiFetch("/medicines/", {
        method: "POST",
        body: JSON.stringify(medicine),
      });
    },
    update: async (
      id: number,
      data: {
        name?: string;
        brand?: string;
        price?: number;
        type?: string;
        rx?: boolean;
        color?: string;
        stock?: number;
      }
    ) => {
      return apiFetch(`/medicines/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
  },

  orders: {
    getAll: async () => {
      return apiFetch<
        Array<{
          id: string;
          user_id: string;
          pharmacy_id?: string;
          status: string;
          total: number;
          address: string;
          payment_method: string;
          prescription_url?: string;
          created_at: string;
          items: Array<{
            id: number;
            medicine_id: number;
            name: string;
            brand: string;
            quantity: number;
            price: number;
          }>;
        }>
      >("/orders/");
    },
    getActive: async () => {
      return apiFetch("/orders/active");
    },
    place: async (orderData: {
      payment_method: string;
      address?: string;
      prescription_name?: string;
      items: Array<{ medicine_id: number; quantity: number }>;
    }) => {
      return apiFetch<{
        id: string;
        user_id: string;
        status: string;
        total: number;
        address: string;
        payment_method: string;
        items: Array<any>;
      }>("/orders/", {
        method: "POST",
        body: JSON.stringify(orderData),
      });
    },
    updateStatus: async (orderId: string, status: string) => {
      return apiFetch(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
  },

  prescriptions: {
    upload: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiFetch<{
        id: number;
        user_id: string;
        file_path: string;
        uploaded_at: string;
      }>("/prescriptions/upload", {
        method: "POST",
        body: formData,
      });
    },
  },
};
