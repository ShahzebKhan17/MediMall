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
  login: (email: string, role: "patient" | "pharmacy", password?: string) => Promise<void>;
  registerUser: (profile: Partial<UserProfile>, role: "patient" | "pharmacy", password?: string) => Promise<void>;
  logout: () => Promise<void>;
  addToCart: (id: number) => void;
  removeFromCart: (id: number) => void;
  updateCartQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  placeOrder: (paymentMethod: string, customAddress?: string, prescriptionName?: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order["status"]) => Promise<void>;
  addPrescription: (name: string) => void;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  refreshOrders: () => Promise<void>;
}

const defaultProfile: UserProfile = {
  name: "Ananya Sharma",
  age: 28,
  gender: "Female",
  email: "ananya@example.com",
  phone: "+91 98765 43210",
  address: "12, 3rd Cross, Indiranagar, Bengaluru, Karnataka 560038",
  allergies: "No known allergies",
  bloodGroup: "O+",
};

const catalogue: Medicine[] = [
  { id: 1, name: "Paracetamol 650mg", brand: "Dolo 650 · Strip of 15 tablets", price: 34, type: "Pain relief", rx: false, color: "orange" },
  { id: 2, name: "Cetirizine 10mg", brand: "Cetzine · Strip of 10 tablets", price: 28, type: "Allergy care", rx: false, color: "blue" },
  { id: 3, name: "Vitamin D3 60K", brand: "Uprise-D3 · Pack of 4 capsules", price: 116, type: "Vitamins", rx: false, color: "yellow" },
  { id: 4, name: "Amoxicillin 500mg", brand: "Mox 500 · Strip of 10 capsules", price: 133, type: "Antibiotic", rx: true, color: "green" },
];

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(defaultProfile);
  const [role, setRole] = useState<"patient" | "pharmacy" | null>("patient");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [prescriptions, setPrescriptions] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const refreshOrders = async () => {
    try {
      const backendOrders = await api.orders.getAll();
      if (backendOrders && backendOrders.length > 0) {
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
    } catch (e) {
      console.warn("Could not fetch orders from backend, using local orders", e);
    }
  };

  // Load from local storage and verify HttpOnly cookie session with backend
  useEffect(() => {
    const storedUser = localStorage.getItem("medimall_user");
    const storedRole = localStorage.getItem("medimall_role");
    const storedCart = localStorage.getItem("medimall_cart");
    const storedOrders = localStorage.getItem("medimall_orders");
    const storedPrescriptions = localStorage.getItem("medimall_prescriptions");

    setUser(storedUser ? JSON.parse(storedUser) : defaultProfile);
    setRole(storedRole ? (JSON.parse(storedRole) as "patient" | "pharmacy") : "patient");
    setCart(storedCart ? JSON.parse(storedCart) : []);
    setPrescriptions(
      storedPrescriptions ? JSON.parse(storedPrescriptions) : ["prescription_august_03.pdf"]
    );

    if (storedOrders) {
      setOrders(JSON.parse(storedOrders));
    } else {
      const initialOrders: Order[] = [
        {
          id: "ORD-001",
          initials: "AS",
          name: "Ananya Sharma",
          itemsSummary: "Paracetamol 650mg · Cetirizine 10mg",
          time: "06 Aug, 2026",
          type: "Ready to pack",
          priority: "Pack",
          status: "Delivered",
          itemsList: [
            { name: "Paracetamol 650mg", brand: "Dolo 650", price: 34, quantity: 1, color: "orange" },
            { name: "Cetirizine 10mg", brand: "Cetzine", price: 28, quantity: 1, color: "blue" },
          ],
          total: 62,
          address: defaultProfile.address,
          paymentMethod: "UPI",
        },
      ];
      setOrders(initialOrders);
      localStorage.setItem("medimall_orders", JSON.stringify(initialOrders));
    }

    setHydrated(true);

    // Sync session from backend using HttpOnly cookie
    api.auth.getMe().then((me) => {
      if (me) {
        const profile: UserProfile = {
          name: me.name || defaultProfile.name,
          age: me.age || 28,
          gender: me.gender || "Female",
          email: me.email,
          phone: me.phone || defaultProfile.phone,
          address: me.address || defaultProfile.address,
          allergies: me.allergies || "No known allergies",
          bloodGroup: me.blood_group || "O+",
        };
        setUser(profile);
        setRole((me.role as "patient" | "pharmacy") || "patient");
        localStorage.setItem("medimall_user", JSON.stringify(profile));
        localStorage.setItem("medimall_role", JSON.stringify(me.role));
        refreshOrders();
      }
    }).catch(() => {
      // Cookie is not present or expired
    });
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem("medimall_cart", JSON.stringify(newCart));
  };

  const saveOrders = (newOrders: Order[]) => {
    setOrders(newOrders);
    localStorage.setItem("medimall_orders", JSON.stringify(newOrders));
  };

  const savePrescriptions = (newPrescriptions: string[]) => {
    setPrescriptions(newPrescriptions);
    localStorage.setItem("medimall_prescriptions", JSON.stringify(newPrescriptions));
  };

  const login = async (email: string, targetRole: "patient" | "pharmacy", password = "securepassword") => {
    try {
      const res = await api.auth.login({ email, password });
      if (res) {
        const me = await api.auth.getMe();
        const profile: UserProfile = {
          name: me.name || (targetRole === "patient" ? "Ananya Sharma" : "Care & Cure Pharmacy"),
          age: me.age || 28,
          gender: me.gender || "Female",
          email: me.email,
          phone: me.phone || "+91 98765 43210",
          address: me.address || (targetRole === "patient" ? defaultProfile.address : "56, 100 Feet Rd, Indiranagar, Bengaluru"),
          allergies: me.allergies || "No known allergies",
          bloodGroup: me.blood_group || "O+",
        };
        setUser(profile);
        setRole(targetRole);
        localStorage.setItem("medimall_user", JSON.stringify(profile));
        localStorage.setItem("medimall_role", JSON.stringify(targetRole));
        await refreshOrders();
        return;
      }
    } catch (e) {
      console.warn("Backend login error, falling back to local session:", e);
    }

    // Fallback
    const isMockDefault = email === "ananya@example.com" || email === "you@example.com";
    const profile: UserProfile = isMockDefault
      ? defaultProfile
      : {
          ...defaultProfile,
          name: targetRole === "patient" ? "User Account" : "Dr. Ravi",
          email: email,
        };
    setUser(profile);
    setRole(targetRole);
    localStorage.setItem("medimall_user", JSON.stringify(profile));
    localStorage.setItem("medimall_role", JSON.stringify(targetRole));
  };

  const registerUser = async (profile: Partial<UserProfile>, targetRole: "patient" | "pharmacy", password = "securepassword") => {
    try {
      await api.auth.register({
        email: profile.email || "user@example.com",
        password,
        name: profile.name || (targetRole === "patient" ? "New User" : "New Pharmacy Owner"),
        role: targetRole,
        phone: profile.phone,
        address: profile.address,
        allergies: profile.allergies,
        blood_group: profile.bloodGroup,
      });
      await refreshOrders();
    } catch (e) {
      console.warn("Backend registration error, continuing locally:", e);
    }

    const newProfile: UserProfile = {
      ...defaultProfile,
      name: profile.name || (targetRole === "patient" ? "New User" : "New Pharmacy Owner"),
      phone: profile.phone || "",
      email: profile.email || "",
      address: profile.address || (targetRole === "patient" ? defaultProfile.address : "Shop Address, Bengaluru"),
    };
    setUser(newProfile);
    setRole(targetRole);
    localStorage.setItem("medimall_user", JSON.stringify(newProfile));
    localStorage.setItem("medimall_role", JSON.stringify(targetRole));
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
    localStorage.removeItem("medimall_user");
    localStorage.removeItem("medimall_role");
    localStorage.removeItem("medimall_cart");
  };

  const addToCart = (id: number) => {
    const existing = cart.find((item) => item.id === id);
    if (existing) {
      saveCart(cart.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item)));
    } else {
      saveCart([...cart, { id, quantity: 1 }]);
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

  const placeOrder = async (paymentMethod: string, customAddress?: string, prescriptionName?: string) => {
    if (cart.length === 0 && !prescriptionName) return;

    // Try backend place order with HttpOnly cookie
    let backendOrderId: string | null = null;
    try {
      const orderRes = await api.orders.place({
        payment_method: paymentMethod,
        address: customAddress || user?.address || defaultProfile.address,
        prescription_name: prescriptionName,
        items: cart.map((c) => ({ medicine_id: c.id, quantity: c.quantity })),
      });
      if (orderRes && orderRes.id) {
        backendOrderId = orderRes.id;
      }
    } catch (e) {
      console.warn("Backend order placement skipped/failed:", e);
    }

    const initials = user ? user.name.split(" ").map((n) => n[0]).join("") : "US";
    const itemsList: OrderItem[] = cart.map((cItem) => {
      const med = catalogue.find((m) => m.id === cItem.id) || {
        name: "Medicine Item",
        brand: "Generic",
        price: 50,
        color: "blue",
      };
      return {
        name: med.name,
        brand: med.brand,
        price: med.price,
        quantity: cItem.quantity,
        color: med.color || "blue",
      };
    });

    const hasRx = itemsList.some((item) => {
      const med = catalogue.find((m) => m.name === item.name);
      return med ? med.rx : false;
    }) || !!prescriptionName;

    const total = itemsList.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const summary = itemsList.length > 0 
      ? itemsList.map((item) => `${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ""}`).join(" · ")
      : `Prescription verification (${prescriptionName || "Attached"})`;

    const newOrder: Order = {
      id: backendOrderId || `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      initials,
      name: user?.name || "Ananya Sharma",
      itemsSummary: summary,
      time: "Just now",
      type: hasRx ? "Prescription review" : "Ready to pack",
      priority: hasRx ? "Review" : "Pack",
      status: "Placed",
      itemsList,
      total,
      address: customAddress || user?.address || defaultProfile.address,
      paymentMethod,
      prescription: prescriptionName,
    };

    saveOrders([newOrder, ...orders]);
    clearCart();
  };

  const updateOrderStatus = async (orderId: string, status: Order["status"]) => {
    try {
      await api.orders.updateStatus(orderId, status);
    } catch (e) {
      console.warn("Backend order status update failed:", e);
    }

    const updated = orders.map((order) => {
      if (order.id === orderId) {
        let type = order.type;
        let priority = order.priority;
        if (status === "Confirmed") {
          type = "Ready to pack";
          priority = "Pack";
        } else if (status === "Packing") {
          type = "Packing items";
          priority = "Pack";
        } else if (status === "Shipped" || status === "Arriving") {
          type = "Out for delivery";
          priority = "Track";
        } else if (status === "Delivered") {
          type = "Delivered";
          priority = "Track";
        }
        return { ...order, status, type, priority };
      }
      return order;
    });
    saveOrders(updated);
  };

  const addPrescription = (name: string) => {
    const updated = [name, ...prescriptions];
    savePrescriptions(updated);
  };

  const updateProfile = async (profile: Partial<UserProfile>) => {
    if (!user) return;
    try {
      await api.auth.updateMe({
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
        allergies: profile.allergies,
        blood_group: profile.bloodGroup,
        age: profile.age,
        gender: profile.gender,
      });
    } catch (e) {
      console.warn("Backend updateMe failed:", e);
    }
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

