"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAppContext, Order as AppOrder } from "../context/AppContext";
import { api } from "../../lib/api";

export interface ShopOrder {
  id: string;
  initials: string;
  name: string;
  items: string;
  time: string;
  type: string;
  priority: string;
  status: AppOrder["status"];
}

interface ShopkeeperContextProps {
  queue: ShopOrder[];
  completeOrder: (name: string) => void;
  advanceOrder: (orderId: string) => void;
  reassignOrder: (orderId: string) => Promise<void>;
  soundEnabled: boolean;
  isAudioRinging: boolean;
  toggleSound: () => void;
  silenceAlert: () => void;
  testSound: () => void;
}

const ShopkeeperContext = createContext<ShopkeeperContextProps>({
  queue: [],
  completeOrder: () => {},
  advanceOrder: () => {},
  reassignOrder: async () => {},
  soundEnabled: true,
  isAudioRinging: false,
  toggleSound: () => {},
  silenceAlert: () => {},
  testSound: () => {},
});

export const ShopkeeperProvider = ({ children }: { children: React.ReactNode }) => {
  const { orders, updateOrderStatus, refreshOrders } = useAppContext();
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isAudioRinging, setIsAudioRinging] = useState<boolean>(false);
  
  // Keep track of orders that have already been acknowledged to avoid re-ringing constantly for old orders
  const acknowledgedOrderIdsRef = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio instance on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPref = localStorage.getItem("medimall_shopkeeper_audio_alert");
      if (savedPref !== null) {
        setSoundEnabled(savedPref === "true");
      }

      const audio = new Audio("/sounds/order_urgent.wav");
      audio.loop = true;
      audio.preload = "auto";
      audioRef.current = audio;

      return () => {
        audio.pause();
        audio.currentTime = 0;
      };
    }
  }, []);

  // Poll orders periodically
  useEffect(() => {
    refreshOrders();
    const interval = setInterval(() => {
      refreshOrders();
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Active queue includes orders that are Placed, Review, Confirmed, Packing, Shipped, Arriving
  const queue: ShopOrder[] = orders
    .filter(
      (order) =>
        order.status !== "Delivered" &&
        order.status !== "Cancelled"
    )
    .map((order) => ({
      id: order.id,
      initials: order.initials,
      name: order.name,
      items: order.itemsSummary,
      time: order.time,
      type: order.type,
      priority: order.priority,
      status: order.status,
    }));

  // Check for incoming orders requiring immediate action (Placed or Review)
  useEffect(() => {
    const unacknowledgedOrders = orders.filter(
      (o) =>
        (o.status === "Placed" || o.status === "Review") &&
        !acknowledgedOrderIdsRef.current.has(o.id)
    );

    if (unacknowledgedOrders.length > 0 && soundEnabled) {
      // Start ringing loop if not already ringing
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().then(() => {
          setIsAudioRinging(true);
        }).catch((err) => {
          console.warn("Audio autoplay blocked by browser until user interaction:", err);
        });
      }
    } else {
      // Stop ringing if no pending unacknowledged orders
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsAudioRinging(false);
    }
  }, [orders, soundEnabled]);

  const silenceAlert = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsAudioRinging(false);

    // Mark all current Placed / Review orders as acknowledged
    orders.forEach((o) => {
      if (o.status === "Placed" || o.status === "Review") {
        acknowledgedOrderIdsRef.current.add(o.id);
      }
    });
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("medimall_shopkeeper_audio_alert", String(next));
      }
      if (!next && audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsAudioRinging(false);
      }
      return next;
    });
  };

  const testSound = () => {
    if (typeof window !== "undefined") {
      const testAudio = new Audio("/sounds/order_urgent.wav");
      testAudio.loop = false;
      testAudio.play().catch((err) => console.warn("Test audio error:", err));
    }
  };

  const advanceOrder = async (orderId: string) => {
    // Immediately stop audio & acknowledge this order
    acknowledgedOrderIdsRef.current.add(orderId);
    if (audioRef.current && !audioRef.current.paused) {
      // If no other unacknowledged orders, stop ringing
      const otherUnack = orders.some(
        (o) =>
          o.id !== orderId &&
          (o.status === "Placed" || o.status === "Review") &&
          !acknowledgedOrderIdsRef.current.has(o.id)
      );
      if (!otherUnack) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsAudioRinging(false);
      }
    }

    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    let nextStatus: AppOrder["status"] = "Confirmed";
    if (order.status === "Placed") {
      nextStatus = order.type === "Prescription review" ? "Review" : "Confirmed";
    } else if (order.status === "Review") {
      nextStatus = "Confirmed";
    } else if (order.status === "Confirmed") {
      nextStatus = "Packing";
    } else if (order.status === "Packing") {
      nextStatus = "Shipped";
    } else if (order.status === "Shipped") {
      nextStatus = "Arriving";
    } else if (order.status === "Arriving") {
      nextStatus = "Delivered";
    }

    await updateOrderStatus(orderId, nextStatus);
    await refreshOrders();
  };

  const completeOrder = async (name: string) => {
    const activeForName = orders.find(o => o.name === name && o.status !== "Delivered" && o.status !== "Cancelled");
    if (activeForName) {
      acknowledgedOrderIdsRef.current.add(activeForName.id);
      await updateOrderStatus(activeForName.id, "Delivered");
      await refreshOrders();
    }
  };

  const reassignOrder = async (orderId: string) => {
    acknowledgedOrderIdsRef.current.add(orderId);
    if (isAudioRinging) silenceAlert();
    try {
      await api.orders.reassign(orderId);
      await refreshOrders();
    } catch (err: any) {
      console.error("Failed to reassign order:", err);
      alert(err?.message || "No alternative pharmacy found in this area.");
    }
  };

  return (
    <ShopkeeperContext.Provider
      value={{
        queue,
        completeOrder,
        advanceOrder,
        reassignOrder,
        soundEnabled,
        isAudioRinging,
        toggleSound,
        silenceAlert,
        testSound,
      }}
    >
      {children}
    </ShopkeeperContext.Provider>
  );
};

export const useShopkeeper = () => useContext(ShopkeeperContext);


