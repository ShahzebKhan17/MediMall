"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../../lib/api";

export interface Medicine {
  id: number;
  name: string;
  brand: string;
  price: number;
  type: string;
  rx: boolean;
  color: string;
  stock?: number;
}

export interface CartItem {
  id: number;
  quantity: number;
  medicine?: Medicine;
}

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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<"patient" | "pharmacy" | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [prescriptions, setPrescriptions] = useState<string[]>([]);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);

  const refreshOrders = async () => {
    try {
      const backendOrders = await api.orders.getAll();
      setIsConnected(true);
      setServerError(null);
      if (backendOrders) {
        const mappedOrders: Order[] = backendOrders.map((bo) => {
          const itemsList: OrderItem[] = (bo.items || []).map((bi) => ({
            name: bi.name || "Medicine",
            brand: bi.brand || "Generic",
            price: bi.price || 0,
            quantity: bi.quantity || 1,
            color: "blue",
          }));
          const summary = itemsList.map((it) => `${it.name}${it.quantity > 1 ? ` x${it.quantity}` : ""}`).join(" · ");
          const hasRx = !!bo.prescription_url;
          return {
            id: bo.id,
            initials: user ? user.name.split(" ").map((n) => n[0]).join("") : "US",
            name: user?.name || "Customer",
            itemsSummary: summary || `Prescription Order (${bo.prescription_url || "Attached"})`,
            time: new Date(bo.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
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
        setOrders(mappedOrders);
        localStorage.setItem("medimall_orders", JSON.stringify(mappedOrders));
      }
    } catch (e: any) {
      console.warn("Could not sync orders from backend:", e);
      // If we cannot connect to the server, keep existing state or note disconnection
      if (e.message && e.message.includes("Failed to fetch")) {
        setIsConnected(false);
        setServerError("Unable to connect to MediMall server. Please check your connection.");
      }
    }
  };

  const refreshPrescriptions = async () => {
    try {
      const records = await api.prescriptions.getAll();
      if (records) {
        setPrescriptions(records.map((r) => r.file_path));
      }
    } catch (e) {
      console.warn("Could not fetch remote prescriptions:", e);
    }
  };

  const hydrateSession = async () => {
    setIsHydrating(true);
    try {
      // 1. Load active cart from localStorage
      const storedCart = localStorage.getItem("medimall_cart");
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }

      // 2. Fetch authenticated user profile from backend
      const me = await api.auth.getMe();
      if (me) {
        const profile: UserProfile = {
          name: me.name,
          age: me.age || 28,
          gender: me.gender || "Not specified",
          email: me.email,
          phone: me.phone || "",
          address: me.address || "",
          allergies: me.allergies || "No known allergies",
          bloodGroup: me.blood_group || "O+",
        };
        setUser(profile);
        const userRole = (me.role as "patient" | "pharmacy") || "patient";
        setRole(userRole);
        localStorage.setItem("medimall_user", JSON.stringify(profile));
        localStorage.setItem("medimall_role", JSON.stringify(userRole));
        setIsConnected(true);
        setServerError(null);

        // Fetch user's real orders and prescriptions
        await refreshOrders();
        await refreshPrescriptions();
      }
    } catch (e: any) {
      // Session expired or unauthenticated
      setUser(null);
      setRole(null);
      setOrders([]);
      setPrescriptions([]);
      if (e.message && e.message.includes("Failed to fetch")) {
        setIsConnected(false);
        setServerError("MediMall server is currently unreachable. Make sure backend is running on port 8000.");
      }
    } finally {
      setIsHydrating(false);
    }
  };

  useEffect(() => {
    hydrateSession();
  }, []);

  const retryConnection = async () => {
    await hydrateSession();
  };

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem("medimall_cart", JSON.stringify(newCart));
  };

  const login = async (email: string, targetRole: "patient" | "pharmacy", password = "securepassword") => {
    const res = await api.auth.login({ email, password });
    if (!res) {
      throw new Error("Invalid login credentials.");
    }
    await hydrateSession();
  };

  const registerUser = async (profile: Partial<UserProfile>, targetRole: "patient" | "pharmacy", password = "securepassword") => {
    await api.auth.register({
      email: profile.email || "user@example.com",
      password,
      name: profile.name || "New User",
      role: targetRole,
      phone: profile.phone,
      address: profile.address,
      allergies: profile.allergies,
      blood_group: profile.bloodGroup,
    });
    await hydrateSession();
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      console.warn("Backend logout error:", e);
    }
    setUser(null);
    setRole(null);
    setCart([]);
    setOrders([]);
    setPrescriptions([]);
    localStorage.removeItem("medimall_user");
    localStorage.removeItem("medimall_role");
    localStorage.removeItem("medimall_cart");
    localStorage.removeItem("medimall_orders");
  };

  const addToCart = (id: number, medicine?: Medicine) => {
    const existing = cart.find((item) => item.id === id);
    if (existing) {
      saveCart(cart.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1, medicine: medicine || item.medicine } : item)));
    } else {
      saveCart([...cart, { id, quantity: 1, medicine }]);
    }
  };

  const removeFromCart = (id: number) => {
    saveCart(cart.filter((item) => item.id !== id));
  };

  const updateCartQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
    } else {
      saveCart(cart.map((item) => (item.id === id ? { ...item, quantity } : item)));
    }
  };

  const clearCart = () => {
    saveCart([]);
  };

  const placeOrder = async (paymentMethod: string, customAddress?: string, prescriptionName?: string): Promise<string> => {
    if (cart.length === 0 && !prescriptionName) {
      throw new Error("Cannot place an empty order.");
    }

    const orderRes = await api.orders.place({
      payment_method: paymentMethod,
      address: customAddress || user?.address || "",
      prescription_name: prescriptionName,
      items: cart.map((c) => ({ medicine_id: c.id, quantity: c.quantity })),
    });

    if (!orderRes || !orderRes.id) {
      throw new Error("Failed to place order. Please try again.");
    }

    clearCart();
    await refreshOrders();
    return orderRes.id;
  };

  const updateOrderStatus = async (orderId: string, status: Order["status"]) => {
    await api.orders.updateStatus(orderId, status);
    await refreshOrders();
  };

  const addPrescription = (name: string) => {
    setPrescriptions((prev) => [name, ...prev]);
  };

  const updateProfile = async (profile: Partial<UserProfile>) => {
    if (!user) return;
    await api.auth.updateMe({
      name: profile.name,
      phone: profile.phone,
      address: profile.address,
      allergies: profile.allergies,
      blood_group: profile.bloodGroup,
      age: profile.age,
      gender: profile.gender,
    });
    const updated = { ...user, ...profile };
    setUser(updated);
    localStorage.setItem("medimall_user", JSON.stringify(updated));
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


