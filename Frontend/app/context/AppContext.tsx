"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface Medicine {
  id: number;
  name: string;
  brand: string;
  price: number;
  type: string;
  rx: boolean;
  color: string;
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
  login: (email: string, role: "patient" | "pharmacy") => void;
  registerUser: (profile: Partial<UserProfile>, role: "patient" | "pharmacy") => void;
  logout: () => void;
  addToCart: (id: number) => void;
  removeFromCart: (id: number) => void;
  updateCartQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  placeOrder: (paymentMethod: string, customAddress?: string, prescriptionName?: string) => void;
  updateOrderStatus: (orderId: string, status: Order["status"]) => void;
  addPrescription: (name: string) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
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

  // Load from local storage
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
  }, []);

  // Save to local storage helpers
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

  const login = (email: string, targetRole: "patient" | "pharmacy") => {
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

  const registerUser = (profile: Partial<UserProfile>, targetRole: "patient" | "pharmacy") => {
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

  const logout = () => {
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

  const placeOrder = (paymentMethod: string, customAddress?: string, prescriptionName?: string) => {
    if (cart.length === 0 && !prescriptionName) return;

    const initials = user ? user.name.split(" ").map(n => n[0]).join("") : "US";
    const itemsList: OrderItem[] = cart.map((cItem) => {
      const med = catalogue.find((m) => m.id === cItem.id)!;
      return {
        name: med.name,
        brand: med.brand,
        price: med.price,
        quantity: cItem.quantity,
        color: med.color,
      };
    });

    const hasRx = itemsList.some(item => {
      const med = catalogue.find(m => m.name === item.name);
      return med ? med.rx : false;
    }) || !!prescriptionName;

    const total = itemsList.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const summary = itemsList.length > 0 
      ? itemsList.map((item) => `${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ""}`).join(" · ")
      : `Prescription verification (${prescriptionName || "Attached"})`;

    const newOrder: Order = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
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

  const updateOrderStatus = (orderId: string, status: Order["status"]) => {
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

  const updateProfile = (profile: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...profile };
    setUser(updated);
    localStorage.setItem("medimall_user", JSON.stringify(updated));
  };

  // AppProvider wraps children and always delivers context safely during SSR and client runtime.

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
