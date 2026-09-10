const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");

const TOKEN_STORAGE_KEY = "medimall_access_token";

export function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }
}

export function clearStoredAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function getMediaUrl(path?: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:") || path.startsWith("blob:")) {
    return path;
  }
  const backendBase = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${backendBase}${cleanPath}`;
}

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

  // Inject Authorization Bearer token if available in storage
  const storedToken = getStoredAuthToken();
  if (storedToken && !headers["Authorization"] && !headers["authorization"]) {
    headers["Authorization"] = `Bearer ${storedToken}`;
  }

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const response = await fetch(url, {
    ...options,
    credentials: "include", // Send & receive HttpOnly cookies where supported
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Clear stale token on unauthorized
      clearStoredAuthToken();
    }

    let errorMessage = `API error (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorMessage = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore JSON parse error on non-json responses
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  auth: {
    login: async (payload: { email: string; password?: string; role?: string }) => {
      const res = await apiFetch<{ access_token: string; token_type: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: payload.email,
          password: payload.password || "securepassword",
          role: payload.role,
        }),
      });
      if (res?.access_token) {
        setStoredAuthToken(res.access_token);
      }
      return res;
    },
    verifyEmail: async (token: string) => {
      return apiFetch<{
        status: string;
        message: string;
        email?: string;
        is_verified: boolean;
      }>("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
    },
    resendVerification: async (email: string) => {
      return apiFetch<{
        status: string;
        message: string;
        already_verified?: boolean;
        delivery_status?: string;
      }>("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },
    forgotPassword: async (email: string) => {
      return apiFetch<{
        status: string;
        message: string;
      }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },
    resetPassword: async (token: string, newPassword: string) => {
      return apiFetch<{
        status: string;
        message: string;
      }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, new_password: newPassword }),
      });
    },
    logout: async () => {
      clearStoredAuthToken();
      return apiFetch<{ status: string; message: string }>("/auth/logout", {
        method: "POST",
      });
    },
    register: async (userData: {
      email: string;
      password?: string;
      name: string;
      role?: string;
      medical_license?: string;
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
          medical_license: userData.medical_license,
          phone: userData.phone || "",
          address: userData.address || "",
          allergies: userData.allergies || "",
          blood_group: userData.blood_group || "O+",
        }),
      });
      // Automatically login to retrieve & persist access token
      try {
        await api.auth.login({
          email: userData.email,
          password: userData.password || "securepassword",
          role: userData.role,
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
        medical_license?: string;
        bank_beneficiary_name?: string;
        bank_account_number?: string;
        bank_ifsc_code?: string;
        bank_name?: string;
        upi_id?: string;
        is_email_verified?: boolean;
        latitude?: number;
        longitude?: number;
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
          image_url?: string;
          packaging_type?: string;
          salt_composition?: string;
          stock: number;
        }>
      >(`/medicines/${queryString}`);
    },
    getById: async (id: number) => {
      return apiFetch<{
        id: number;
        name: string;
        brand: string;
        price: number;
        type: string;
        rx: boolean;
        color: string;
        image_url?: string;
        packaging_type?: string;
        salt_composition?: string;
        stock: number;
      }>(`/medicines/${id}`);
    },
    getSubstitutes: async (id: number) => {
      return apiFetch<
        Array<{
          id: number;
          name: string;
          brand: string;
          price: number;
          type: string;
          rx: boolean;
          color: string;
          image_url?: string;
          packaging_type?: string;
          salt_composition?: string;
          stock: number;
        }>
      >(`/medicines/${id}/substitutes`);
    },
    create: async (medicine: {
      name: string;
      brand: string;
      price: number;
      type: string;
      rx?: boolean;
      color?: string;
      image_url?: string;
      packaging_type?: string;
      stock?: number;
    }) => {
      return apiFetch("/medicines/", {
        method: "POST",
        body: JSON.stringify(medicine),
      });
    },
    getInventory: async () => {
      return apiFetch<
        Array<{
          id: number;
          name: string;
          brand: string;
          price: number;
          type: string;
          rx: boolean;
          color: string;
          image_url?: string;
          packaging_type?: string;
          salt_composition?: string;
          stock: number;
          pharmacy_id?: string;
          pharmacy_name?: string;
        }>
      >("/medicines/inventory");
    },
    uploadImage: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiFetch<{ image_url: string }>("/medicines/upload-image", {
        method: "POST",
        body: formData,
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
        image_url?: string;
        packaging_type?: string;
        stock?: number;
      }
    ) => {
      return apiFetch(`/medicines/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    delete: async (id: number) => {
      return apiFetch<{ status: string; message: string }>(`/medicines/${id}`, {
        method: "DELETE",
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
          patient_name?: string;
          patient_phone?: string;
          pharmacy_name?: string;
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
      idempotency_key?: string;
      pharmacy_id?: string;
      items: Array<{ medicine_id: number; quantity: number }>;
    }) => {
      const headers: Record<string, string> = {};
      if (orderData.idempotency_key) {
        headers["Idempotency-Key"] = orderData.idempotency_key;
      }
      return apiFetch<{
        id: string;
        user_id: string;
        status: string;
        total: number;
        address: string;
        payment_method: string;
        idempotency_key?: string;
        items: Array<any>;
      }>("/orders/", {
        method: "POST",
        headers,
        body: JSON.stringify(orderData),
      });
    },
    updateStatus: async (orderId: string, status: string) => {
      return apiFetch(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    reassign: async (orderId: string) => {
      return apiFetch(`/orders/${orderId}/reassign`, {
        method: "POST",
      });
    },
    createRazorpayOrder: async (data: {
      items: Array<{ medicine_id: number; quantity: number }>;
      address?: string;
      prescription_name?: string;
    }) => {
      return apiFetch<{
        razorpay_order_id: string;
        amount: number;
        currency: string;
        key_id: string;
      }>("/orders/razorpay/create", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    verifyRazorpayOrder: async (data: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      payment_method?: string;
      address?: string;
      prescription_name?: string;
      idempotency_key?: string;
      items: Array<{ medicine_id: number; quantity: number }>;
    }) => {
      return apiFetch<{
        id: string;
        user_id: string;
        status: string;
        total: number;
        address: string;
        payment_method: string;
        payment_id?: string;
        idempotency_key?: string;
        items: Array<any>;
      }>("/orders/razorpay/verify", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  },

  prescriptions: {
    getAll: async () => {
      return apiFetch<
        Array<{
          id: number;
          user_id: string;
          file_path: string;
          uploaded_at: string;
        }>
      >("/prescriptions/");
    },
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

  aiDoctor: {
    analyze: async (symptoms: string, language = "English") => {
      return apiFetch<{
        summary: string;
        condition_overview: string;
        urgency_level: "Low" | "Moderate" | "High / Urgent";
        recommended_otc: Array<{
          id?: number;
          name: string;
          brand?: string;
          type: string;
          purpose: string;
          requires_rx: boolean;
          price?: number;
          image_url?: string;
          packaging_type?: string;
        }>;
        lifestyle_advice: string[];
        disclaimer: string;
        requires_pharmacist_review: boolean;
      }>("/ai-doctor/analyze", {
        method: "POST",
        body: JSON.stringify({ symptoms, language }),
      });
    },
  },

  pharmacies: {
    getAll: async (params?: { q?: string; lat?: number; lng?: number; radius_km?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.q) searchParams.set("q", params.q);
      if (params?.lat !== undefined) searchParams.set("lat", params.lat.toString());
      if (params?.lng !== undefined) searchParams.set("lng", params.lng.toString());
      if (params?.radius_km !== undefined) searchParams.set("radius_km", params.radius_km.toString());
      const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : "";
      return apiFetch<Array<{
        id: string;
        name: string;
        email: string;
        phone?: string;
        address?: string;
        latitude?: number;
        longitude?: number;
        medical_license?: string;
        distance_km?: number;
        medicines_count: number;
        is_open: boolean;
      }>>(`/pharmacies/${queryStr}`);
    },
    getById: async (id: string) => {
      return apiFetch<{
        id: string;
        name: string;
        email: string;
        phone?: string;
        address?: string;
        latitude?: number;
        longitude?: number;
        medical_license?: string;
        medicines_count: number;
        is_open: boolean;
        medicines: Array<{
          id: number;
          name: string;
          brand: string;
          price: number;
          type: string;
          rx: boolean;
          color: string;
          image_url?: string;
          packaging_type?: string;
          salt_composition?: string;
          stock: number;
          pharmacy_id?: string;
        }>;
      }>(`/pharmacies/${id}`);
    },
  },
};

