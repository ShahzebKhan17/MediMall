"use client";

import { useShopkeeper, ShopOrder } from "../ShopkeeperContext";
import { FileCheck2, Package, Clock3, CheckCircle2, ShieldAlert } from "lucide-react";
import { useAppContext } from "../../context/AppContext";

export default function ShopkeeperOrdersPage() {
  const { queue, advanceOrder } = useShopkeeper();
  const { orders, updateOrderStatus } = useAppContext();

  // Completed or cancelled orders
  const pastOrders = orders.filter(o => o.status === "Delivered" || o.status === "Cancelled");

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Placed": return { bg: "#fff0e8", text: "#df683e" };
      case "Review": return { bg: "#edeaff", text: "#7566bf" };
      case "Confirmed": return { bg: "#e4f0ff", text: "#507bc2" };
      case "Packing": return { bg: "#e1f3ea", text: "#27805f" };
      case "Shipped":
      case "Arriving": return { bg: "#e1f3ea", text: "#227f5e" };
      case "Delivered": return { bg: "#e3f9ed", text: "#27815f" };
      default: return { bg: "#fee2e2", text: "#ef4444" };
    }
  };

  const getActionLabel = (order: ShopOrder) => {
    if (order.priority === "Review") return "Review Rx";
    if (order.status === "Confirmed") return "Pack Items";
    if (order.status === "Packing") return "Ship Order";
    if (order.status === "Shipped" || order.status === "Arriving") return "Complete Delivery";
    return "Action";
  };

  return (
    <section className="shop-content">
      <div className="welcome">
        <div>
          <p>WORKSPACE</p>
          <h1>Orders Management</h1>
          <h2>Track active order fulfillments and browse delivery histories.</h2>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px", marginTop: "24px" }}>
        <div>
          <div className="card">
            <h3 style={{ margin: "0 0 16px 0", fontSize: "16px" }}>Active Queue ({queue.length})</h3>
            <div style={{ display: "grid", gap: "12px" }}>
              {queue.length > 0 ? (
                queue.map((order) => {
                  const style = getStatusStyle(order.status);
                  return (
                    <div
                      key={order.id}
                      style={{
                        padding: "16px",
                        border: "1px solid #edf1ee",
                        borderRadius: "8px",
                        display: "grid",
                        gap: "12px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                        <div>
                          <b style={{ fontSize: "14px" }}>{order.name}</b>
                          <span style={{ fontSize: "10px", color: "#82918b", display: "block", marginTop: "2px" }}>
                            {order.id} · Received {order.time}
                          </span>
                        </div>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "10px",
                            fontWeight: "bold",
                            backgroundColor: style.bg,
                            color: style.text,
                          }}
                        >
                          {order.status}
                        </span>
                      </div>

                      <p style={{ margin: 0, fontSize: "12px", color: "#555" }}>{order.items}</p>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #edf1ee", paddingTop: "10px" }}>
                        <span style={{ fontSize: "11px", color: "#82918b", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Clock3 size={13} /> {order.type}
                        </span>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => updateOrderStatus(order.id, "Cancelled")}
                            style={{
                              border: "1px solid #fee2e2",
                              backgroundColor: "#fffafa",
                              color: "#ef4444",
                              fontSize: "11px",
                              padding: "6px 10px",
                              borderRadius: "6px",
                              cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => advanceOrder(order.id)}
                            style={{
                              border: 0,
                              backgroundColor: order.priority === "Review" ? "#df683e" : "#227f5e",
                              color: "#fff",
                              fontSize: "11px",
                              padding: "6px 12px",
                              borderRadius: "6px",
                              fontWeight: "bold",
                              cursor: "pointer",
                            }}
                          >
                            {getActionLabel(order)}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: "center", padding: "40px", color: "#82918b" }}>
                  <CheckCircle2 size={32} style={{ color: "#27815f", marginBottom: "8px" }} />
                  <b>No active orders</b>
                  <p style={{ fontSize: "11px", margin: "4px 0 0" }}>Your order dispatch queue is fully caught up.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <h3 style={{ margin: "0 0 16px 0", fontSize: "16px" }}>Fulfillment Log</h3>
            <div style={{ display: "grid", gap: "10px" }}>
              {pastOrders.length > 0 ? (
                pastOrders.map((order) => {
                  const style = getStatusStyle(order.status);
                  return (
                    <div
                      key={order.id}
                      style={{
                        padding: "10px 0",
                        borderBottom: "1px solid #edf1ee",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <b style={{ fontSize: "12px", display: "block" }}>{order.name}</b>
                        <span style={{ fontSize: "10px", color: "#82918b" }}>{order.id} · ₹{order.total}</span>
                      </div>
                      <span
                        style={{
                          padding: "3px 6px",
                          borderRadius: "4px",
                          fontSize: "9px",
                          fontWeight: "bold",
                          backgroundColor: style.bg,
                          color: style.text,
                        }}
                      >
                        {order.status}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#82918b", fontSize: "11px" }}>
                  No completed orders in this session yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
