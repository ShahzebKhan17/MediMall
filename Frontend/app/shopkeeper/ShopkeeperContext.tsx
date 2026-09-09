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
  autoplayBlocked: boolean;
  desktopNotificationPermission: NotificationPermission | "unsupported";
  toggleSound: () => void;
  silenceAlert: () => void;
  testSound: () => void;
  unlockAudio: () => void;
  requestNotificationPermission: () => Promise<NotificationPermission | "unsupported">;
  sendTestNotification: () => void;
}

const ShopkeeperContext = createContext<ShopkeeperContextProps>({
  queue: [],
  completeOrder: () => {},
  advanceOrder: () => {},
  reassignOrder: async () => {},
  soundEnabled: true,
  isAudioRinging: false,
  autoplayBlocked: false,
  desktopNotificationPermission: "default",
  toggleSound: () => {},
  silenceAlert: () => {},
  testSound: () => {},
  unlockAudio: () => {},
  requestNotificationPermission: async () => "default",
  sendTestNotification: () => {},
});

export const ShopkeeperProvider = ({ children }: { children: React.ReactNode }) => {
  const { orders, updateOrderStatus, refreshOrders } = useAppContext();
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isAudioRinging, setIsAudioRinging] = useState<boolean>(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState<boolean>(false);
  const [desktopNotificationPermission, setDesktopNotificationPermission] = useState<NotificationPermission | "unsupported">("default");
  
  // Keep track of orders that have already been acknowledged or notified
  const acknowledgedOrderIdsRef = useRef<Set<string>>(new Set());
  const notifiedOrderIdsRef = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const originalTitleRef = useRef<string>("");

  // Initialize Audio instance and check notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPref = localStorage.getItem("medimall_shopkeeper_audio_alert");
      if (savedPref !== null) {
        setSoundEnabled(savedPref === "true");
      }

      if ("Notification" in window) {
        setDesktopNotificationPermission(Notification.permission);
      } else {
        setDesktopNotificationPermission("unsupported");
      }

      if (document.title) {
        originalTitleRef.current = document.title;
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

  // Unlock audio proactively on first user click/tap/keypress
  const unlockAudio = () => {
    if (audioRef.current) {
      // Calling load/play within a user event unlocks the browser audio context
      setAutoplayBlocked(false);
      const hasUnack = orders.some(
        (o) =>
          (o.status === "Placed" || o.status === "Review") &&
          !acknowledgedOrderIdsRef.current.has(o.id)
      );
      if (hasUnack && soundEnabled && audioRef.current.paused) {
        audioRef.current.play().then(() => {
          setIsAudioRinging(true);
          setAutoplayBlocked(false);
        }).catch((err) => {
          console.warn("Audio play still restricted:", err);
          setAutoplayBlocked(true);
        });
      }
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleFirstUserGesture = () => {
      unlockAudio();
    };

    window.addEventListener("click", handleFirstUserGesture, { once: true });
    window.addEventListener("keydown", handleFirstUserGesture, { once: true });
    window.addEventListener("touchstart", handleFirstUserGesture, { once: true });

    return () => {
      window.removeEventListener("click", handleFirstUserGesture);
      window.removeEventListener("keydown", handleFirstUserGesture);
      window.removeEventListener("touchstart", handleFirstUserGesture);
    };
  }, [orders, soundEnabled]);

  // Request browser desktop notification permission
  const requestNotificationPermission = async (): Promise<NotificationPermission | "unsupported"> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setDesktopNotificationPermission("unsupported");
      return "unsupported";
    }

    try {
      const permission = await Notification.requestPermission();
      setDesktopNotificationPermission(permission);
      if (permission === "granted") {
        try {
          new Notification("🔔 MediMall Desktop Alerts Active", {
            body: "You will receive persistent alerts here whenever a patient places an order.",
            icon: "/icon.png",
          });
        } catch (e) {
          console.warn("Notification display error:", e);
        }
      }
      return permission;
    } catch (err) {
      console.error("Failed to request notification permission:", err);
      return "denied";
    }
  };

  // Trigger test notification
  const sendTestNotification = () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("Desktop notifications are not supported in this browser.");
      return;
    }

    if (Notification.permission !== "granted") {
      requestNotificationPermission();
      return;
    }

    try {
      const testNotif = new Notification("🚨 MediMall Test Order Alert", {
        body: "Patient: Test Customer\nOrder: Paracetamol 650mg x2\nClick to focus and confirm order!",
        icon: "/icon.png",
        badge: "/icon.png",
        tag: "medimall-test-alert",
        requireInteraction: true,
      });

      testNotif.onclick = () => {
        window.focus();
        testNotif.close();
      };
    } catch (err) {
      console.warn("Test notification error:", err);
    }
  };

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

    if (unacknowledgedOrders.length > 0) {
      // 1. Send Desktop Notification if permitted and not yet notified
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        unacknowledgedOrders.forEach((order) => {
          if (!notifiedOrderIdsRef.current.has(order.id)) {
            notifiedOrderIdsRef.current.add(order.id);
            try {
              const notif = new Notification(`🚨 Urgent MediMall Order #${order.id.slice(-6)}`, {
                body: `Patient: ${order.name}\n${order.itemsSummary || "Prescription awaiting review"}\nClick to view and confirm!`,
                icon: "/icon.png",
                badge: "/icon.png",
                tag: `medimall-order-${order.id}`,
                requireInteraction: true,
              });

              notif.onclick = () => {
                window.focus();
                notif.close();
              };
            } catch (err) {
              console.warn("Desktop notification trigger error:", err);
            }
          }
        });
      }

      // 2. Start ringing loop if sound enabled
      if (soundEnabled) {
        if (audioRef.current && audioRef.current.paused) {
          audioRef.current.play().then(() => {
            setIsAudioRinging(true);
            setAutoplayBlocked(false);
          }).catch((err) => {
            console.warn("Audio autoplay blocked by browser until user interaction:", err);
            setAutoplayBlocked(true);
          });
        }
      }
    } else {
      // Stop ringing if no pending unacknowledged orders
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsAudioRinging(false);
      setAutoplayBlocked(false);
    }
  }, [orders, soundEnabled]);

  // Tab Title Flashing effect when alert is ringing
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!originalTitleRef.current && document.title && !document.title.includes("🚨") && !document.title.includes("🔔")) {
      originalTitleRef.current = document.title;
    }

    if (isAudioRinging || autoplayBlocked) {
      let flash = false;
      const unackCount = orders.filter(
        (o) =>
          (o.status === "Placed" || o.status === "Review") &&
          !acknowledgedOrderIdsRef.current.has(o.id)
      ).length || 1;

      const titleInterval = setInterval(() => {
        flash = !flash;
        document.title = flash
          ? `🚨 (${unackCount}) NEW ORDER! - MediMall`
          : `🔔 ACTION REQUIRED - MediMall`;
      }, 1000);

      return () => {
        clearInterval(titleInterval);
        if (originalTitleRef.current) {
          document.title = originalTitleRef.current;
        }
      };
    } else {
      if (originalTitleRef.current && (document.title.includes("🚨") || document.title.includes("🔔"))) {
        document.title = originalTitleRef.current;
      }
    }
  }, [isAudioRinging, autoplayBlocked, orders]);

  const silenceAlert = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsAudioRinging(false);
    setAutoplayBlocked(false);

    // Mark all current Placed / Review orders as acknowledged
    orders.forEach((o) => {
      if (o.status === "Placed" || o.status === "Review") {
        acknowledgedOrderIdsRef.current.add(o.id);
      }
    });

    if (originalTitleRef.current) {
      document.title = originalTitleRef.current;
    }
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
        setAutoplayBlocked(false);
      }
      return next;
    });
  };

  const testSound = () => {
    if (typeof window !== "undefined") {
      const testAudio = new Audio("/sounds/order_urgent.wav");
      testAudio.loop = false;
      testAudio.play().catch((err) => {
        console.warn("Test audio error:", err);
        setAutoplayBlocked(true);
      });
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
        setAutoplayBlocked(false);
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
        autoplayBlocked,
        desktopNotificationPermission,
        toggleSound,
        silenceAlert,
        testSound,
        unlockAudio,
        requestNotificationPermission,
        sendTestNotification,
      }}
    >
      {children}
    </ShopkeeperContext.Provider>
  );
};

export const useShopkeeper = () => useContext(ShopkeeperContext);


