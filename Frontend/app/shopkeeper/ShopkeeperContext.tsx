"use client";

import React, { createContext, useContext } from "react";
import { useAppContext, Order as AppOrder } from "../context/AppContext";

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
}

const ShopkeeperContext = createContext<ShopkeeperContextProps>({
  queue: [],
  completeOrder: () => {},
  advanceOrder: () => {},
});

export const ShopkeeperProvider = ({ children }: { children: React.ReactNode }) => {
  const { orders, updateOrderStatus, refreshOrders } = useAppContext();

  React.useEffect(() => {
    refreshOrders();
    const interval = setInterval(() => {
      refreshOrders();
    }, 8000);
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

  const advanceOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Advance status cycle:
    // Placed -> Confirmed (if no review needed) or Placed -> Review -> Confirmed
    // Confirmed -> Packing -> Shipped -> Arriving -> Delivered
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

  // Keep compatibility with legacy completeOrder by finding the active order for the patient name and advancing/delivering it
  const completeOrder = async (name: string) => {
    const activeForName = orders.find(o => o.name === name && o.status !== "Delivered" && o.status !== "Cancelled");
    if (activeForName) {
      await updateOrderStatus(activeForName.id, "Delivered");
      await refreshOrders();
    }
  };

  return (
    <ShopkeeperContext.Provider value={{ queue, completeOrder, advanceOrder }}>
      {children}
    </ShopkeeperContext.Provider>
  );
};

export const useShopkeeper = () => useContext(ShopkeeperContext);


