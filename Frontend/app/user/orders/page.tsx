"use client";

import { Clock3, MapPin, PackageCheck, Pill, ShieldCheck } from "lucide-react";
import { useAppContext } from "../../context/AppContext";

export default function PatientOrdersPage() {
  const { orders } = useAppContext();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Placed": return "#df683e";
      case "Review": return "#7566bf";
      case "Confirmed": return "#507bc2";
      case "Packing": return "#2b916b";
      case "Shipped":
      case "Arriving": return "#227f5e";
      case "Delivered": return "#27815f";
      default: return "#ef4444";
    }
  };

  return (
    <section className="dash-content">
      <div className="welcome">
        <div>
          <p>WORKSPACE</p>
          <h1>My Orders</h1>
          <h2>Track your current deliveries and view your order history.</h2>
        </div>
      </div>

      <div style={{ marginTop: "24px", display: "grid", gap: "20px" }}>
        {orders.length > 0 ? (
          orders.map((order) => (
            <div key={order.id} className="card" style={{ display: "grid", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "between", alignItems: "start", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <span style={{ fontSize: "11px", fontFamily: "DM Mono", color: "#82918b" }}>ORDER ID: {order.id}</span>
                  <h3 style={{ margin: "4px 0", fontSize: "16px" }}>{order.itemsSummary}</h3>
                  <p style={{ margin: 0, fontSize: "11px", color: "#75847e" }}>Placed on: {order.time}</p>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: "bold",
                      backgroundColor: getStatusColor(order.status) + "20",
                      color: getStatusColor(order.status),
                    }}
                  >
                    {order.status}
                  </span>
                  <b style={{ display: "block", marginTop: "8px", fontSize: "15px" }}>₹{order.total}</b>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #edf1ee", paddingTop: "14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <h4 style={{ margin: "0 0 6px 0", fontSize: "12px", color: "#82918b" }}>Delivery details</h4>
                  <div style={{ display: "flex", gap: "6px", alignItems: "start", fontSize: "12px" }}>
                    <MapPin size={14} style={{ marginTop: "2px", color: "#227f5e" }} />
                    <p style={{ margin: 0 }}>{order.address}</p>
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "12px", marginTop: "6px", color: "#82918b" }}>
                    <Clock3 size={14} />
                    <span>Payment: {order.paymentMethod}</span>
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: "0 0 6px 0", fontSize: "12px", color: "#82918b" }}>Items ordered</h4>
                  <div style={{ display: "grid", gap: "4px" }}>
                    {order.itemsList.map((item, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                        <span>
                          {item.name} <small style={{ color: "#82918b" }}>({item.brand}) × {item.quantity}</small>
                        </span>
                        <b>₹{item.price * item.quantity}</b>
                      </div>
                    ))}
                    {order.prescription && (
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "11px", color: "#df683e", marginTop: "4px" }}>
                        <ShieldCheck size={13} />
                        <span>Prescription verification required ({order.prescription})</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card" style={{ textAlign: "center", padding: "60px 20px" }}>
            <Pill size={40} style={{ color: "#82918b", marginBottom: "12px" }} />
            <h3>No orders found</h3>
            <p style={{ color: "#75847e", fontSize: "13px" }}>You haven&apos;t placed any medicine orders yet.</p>
            <button className="primary" onClick={() => location.href = "/medicines"} style={{ margin: "12px auto 0" }}>Shop Medicines</button>
          </div>
        )}
      </div>
    </section>
  );
}
