"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useCartStore, Medicine, CartItem } from "../../lib/store/useCartStore";
import {
  useUserQuery,
  useOrdersQuery,
  usePrescriptionsQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useUpdateProfileMutation,
  usePlaceOrderMutation,
  useUpdateOrderStatusMutation,
  useUploadPrescriptionMutation,
  queryKeys,
} from "../../lib/hooks/useQueries";

export type { Medicine, CartItem };

export interface OrderItem {
  name: string;
  brand: string;
  price: number;
  quantity: number;
  color: string;
}

export interface Order {
  id: string;
  initials: string;
  name: string;
  pharmacyName?: string;
  itemsSummary: string;
  time: string;
  type: string;
  priority: string;
  status: "Placed" | "Confirmed" | "Review" | "Packing" | "Shipped" | "Arriving" | "Delivered" | "Cancelled";
  itemsList: OrderItem[];
  total: number;
  address: string;
  paymentMethod: string;
  prescription?: string;
}


export interface UserProfile {
  name: string;
  age: number;
  gender: string;
  email: string;
  phone: string;
  address: string;
  allergies: string;
  bloodGroup: string;
  role?: "patient" | "pharmacy";
  medical_license?: string;
  is_email_verified?: boolean;
}


interface AppContextProps {
  user: UserProfile | null;
  role: "patient" | "pharmacy" | null;
  cart: CartItem[];
  orders: Order[];
  prescriptions: string[];
  isHydrating: boolean;
  isConnected: boolean;
  serverError: string | null;
  login: (email: string, role: "patient" | "pharmacy", password?: string) => Promise<void>;
  registerUser: (profile: Partial<UserProfile>, role: "patient" | "pharmacy", password?: string) => Promise<void>;
  resendVerificationEmail: (customEmail?: string) => Promise<void>;
  logout: () => Promise<void>;
  addToCart: (id: number, medicine?: Medicine) => void;
  removeFromCart: (id: number) => void;
  updateCartQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  placeOrder: (paymentMethod: string, customAddress?: string, prescriptionName?: string) => Promise<string>;
  updateOrderStatus: (orderId: string, status: Order["status"]) => Promise<void>;
  addPrescription: (name: string) => void;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  refreshOrders: () => Promise<void>;
  retryConnection: () => Promise<void>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();

  // Zustand Cart Store
  const { cart, addToCart, removeFromCart, updateCartQuantity, clearCart } = useCartStore();

  // TanStack Queries
  const userQuery = useUserQuery();
  const ordersQuery = useOrdersQuery();
  const prescriptionsQuery = usePrescriptionsQuery();

  // Mutations
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const logoutMutation = useLogoutMutation();
  const updateProfileMutation = useUpdateProfileMutation();
  const placeOrderMutation = usePlaceOrderMutation();
  const updateOrderStatusMutation = useUpdateOrderStatusMutation();
  const uploadPrescriptionMutation = useUploadPrescriptionMutation();

  // Map user data
  const user: UserProfile | null = useMemo(() => {
    if (!userQuery.data) return null;
    const me = userQuery.data;
    return {
      name: me.name || "Customer",
      age: me.age || 28,
      gender: me.gender || "Not specified",
      email: me.email,
      phone: me.phone || "",
      address: me.address || "",
      allergies: me.allergies || "No known allergies",
      bloodGroup: me.blood_group || "O+",
      role: (me.role as "patient" | "pharmacy") || "patient",
      medical_license: me.medical_license,
      is_email_verified: me.is_email_verified ?? false,
    };
  }, [userQuery.data]);

  const role: "patient" | "pharmacy" | null = useMemo(() => {
    if (!userQuery.data) return null;
    return (userQuery.data.role as "patient" | "pharmacy") || "patient";
  }, [userQuery.data]);

  // Map orders data
  const orders: Order[] = useMemo(() => {
    if (!ordersQuery.data) return [];
    return ordersQuery.data.map((bo) => {
      const itemsList: OrderItem[] = (bo.items || []).map((bi) => ({
        name: bi.name || "Medicine",
        brand: bi.brand || "Generic",
        price: bi.price || 0,
        quantity: bi.quantity || 1,
        color: "blue",
      }));
      const summary = itemsList.map((it) => `${it.name}${it.quantity > 1 ? ` x${it.quantity}` : ""}`).join(" · ");
      const hasRx = !!bo.prescription_url;
      const orderCustomerName = bo.patient_name || (role === "pharmacy" ? "Customer" : (user?.name || "Customer"));
      const initials = orderCustomerName
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "CU";

      return {
        id: bo.id,
        initials,
        name: orderCustomerName,
        pharmacyName: bo.pharmacy_name || "Verified Local Pharmacy",
        itemsSummary: summary || `Prescription Order (${bo.prescription_url || "Attached"})`,
        time: bo.created_at
          ? new Date(bo.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
          : "",
        type: hasRx ? "Prescription review" : "Ready to pack",
        priority: hasRx ? "Review" : "Pack",
        status: (bo.status as Order["status"]) || "Placed",
        itemsList,
        total: bo.total,
        address: bo.address,
        paymentMethod: bo.payment_method,
        prescription: bo.prescription_url,
      };

    });
  }, [ordersQuery.data, user, role]);



  // Map prescriptions
  const prescriptions: string[] = useMemo(() => {
    if (!prescriptionsQuery.data) return [];
    return prescriptionsQuery.data.map((p) => p.file_path);
  }, [prescriptionsQuery.data]);

  const isHydrating = userQuery.isLoading;

  const isConnected = !ordersQuery.isError && !userQuery.isError;
  const serverError = ordersQuery.isError
    ? "Unable to connect to MediMall server. Please check your connection."
    : null;

  const refreshOrders = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.orders });
  };

  const retryConnection = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.user }),
      queryClient.invalidateQueries({ queryKey: queryKeys.orders }),
      queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions }),
    ]);
  };

  const login = async (email: string, targetRole: "patient" | "pharmacy", password = "securepassword") => {
    await loginMutation.mutateAsync({ email, password, role: targetRole });
  };

  const registerUser = async (profile: Partial<UserProfile>, targetRole: "patient" | "pharmacy", password = "securepassword") => {
    await registerMutation.mutateAsync({
      email: profile.email || "user@example.com",
      password,
      name: profile.name || "New User",
      role: targetRole,
      medical_license: profile.medical_license,
      phone: profile.phone,
      address: profile.address,
      allergies: profile.allergies,
      blood_group: profile.bloodGroup,
    });
  };

  const resendVerificationEmail = async (customEmail?: string) => {
    const targetEmail = customEmail || user?.email;
    if (!targetEmail) {
      throw new Error("No email address provided for verification.");
    }
    await api.auth.resendVerification(targetEmail);
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (e) {
      console.warn("Backend logout error:", e);
    }
    clearCart();
    localStorage.removeItem("medimall_user");
    localStorage.removeItem("medimall_role");
  };

  const placeOrder = async (paymentMethod: string, customAddress?: string, prescriptionName?: string): Promise<string> => {
    if (cart.length === 0 && !prescriptionName) {
      throw new Error("Cannot place an empty order.");
    }

    const orderRes = await placeOrderMutation.mutateAsync({
      payment_method: paymentMethod,
      address: customAddress || user?.address || "",
      prescription_name: prescriptionName,
      items: cart.map((c) => ({ medicine_id: c.id, quantity: c.quantity })),
    });

    if (!orderRes || !orderRes.id) {
      throw new Error("Failed to place order. Please try again.");
    }

    clearCart();
    return orderRes.id;
  };

  const updateOrderStatus = async (orderId: string, status: Order["status"]) => {
    await updateOrderStatusMutation.mutateAsync({ orderId, status });
  };

  const addPrescription = (name: string) => {
    // Tanstack query will automatically refetch user prescriptions
  };

  const updateProfile = async (profile: Partial<UserProfile>) => {
    if (!user) return;
    await updateProfileMutation.mutateAsync({
      name: profile.name,
      phone: profile.phone,
      address: profile.address,
      allergies: profile.allergies,
      blood_group: profile.bloodGroup,
      age: profile.age,
      gender: profile.gender,
    });
  };

  return (
    <AppContext.Provider
      value={{
        user,
        role,
        cart,
        orders,
        prescriptions,
        isHydrating,
        isConnected,
        serverError,
        login,
        registerUser,
        resendVerificationEmail,
        logout,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        placeOrder,
        updateOrderStatus,
        addPrescription,
        updateProfile,
        refreshOrders,
        retryConnection,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
