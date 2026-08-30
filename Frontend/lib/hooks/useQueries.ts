import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

export const queryKeys = {
  user: ["auth", "me"] as const,
  orders: ["orders"] as const,
  prescriptions: ["prescriptions"] as const,
  medicines: (q?: string, type?: string) => ["medicines", { q: q || "", type: type || "" }] as const,
};

export function useUserQuery() {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: async () => {
      try {
        return await api.auth.getMe();
      } catch (err: any) {
        // If unauthenticated, return null rather than hard erroring
        return null;
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useOrdersQuery(options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: queryKeys.orders,
    queryFn: async () => {
      return await api.orders.getAll();
    },
    refetchInterval: options?.refetchInterval,
  });
}

export function usePrescriptionsQuery() {
  return useQuery({
    queryKey: queryKeys.prescriptions,
    queryFn: async () => {
      return await api.prescriptions.getAll();
    },
  });
}

export function useMedicinesQuery(q?: string, type?: string) {
  return useQuery({
    queryKey: queryKeys.medicines(q, type),
    queryFn: async () => {
      return await api.medicines.getAll(q, type);
    },
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { email: string; password?: string; role?: string }) => api.auth.login(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions });
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      email: string;
      password?: string;
      name: string;
      role?: string;
      medical_license?: string;
      phone?: string;
      address?: string;
      allergies?: string;
      blood_group?: string;
    }) => api.auth.register(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions });
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.auth.logout(),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.user, null);
      queryClient.setQueryData(queryKeys.orders, []);
      queryClient.setQueryData(queryKeys.prescriptions, []);
    },
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, any>) => api.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
  });
}

export function usePlaceOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderData: {
      payment_method: string;
      address?: string;
      prescription_name?: string;
      idempotency_key?: string;
      items: Array<{ medicine_id: number; quantity: number }>;
    }) => api.orders.place(orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}

export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      api.orders.updateStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}

export function useUploadPrescriptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => api.prescriptions.upload(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions });
    },
  });
}
