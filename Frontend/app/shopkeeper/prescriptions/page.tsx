"use client";

import { useAppContext } from "../../context/AppContext";
import { FileCheck2, FileText, CheckCircle2, XCircle } from "lucide-react";

export default function ShopkeeperPrescriptionsPage() {
  const { orders, updateOrderStatus } = useAppContext();

  // Orders that are currently awaiting prescription review
  const rxOrders = orders.filter(
    (o) =>
      (o.status === "Placed" || o.status === "Review") &&
      (o.type === "Prescription review" || !!o.prescription)
  );

  return (
    <section className="shop-content">
      <div className="welcome">
        <div>
          <p>COMPLIANCE</p>
          <h1>Prescription Reviews</h1>
          <h2>Verify user-uploaded prescriptions to approve or reject Schedule H/Rx orders.</h2>
        </div>
      </div>

      <div style={{ marginTop: "24px", display: "grid", gap: "20px" }}>
        {rxOrders.length > 0 ? (
          rxOrders.map((order) => (
            <div key={order.id} className="card" style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px" }}>
              <div>
                <span style={{ fontSize: "11px", fontFamily: "DM Mono", color: "#82918b" }}>ORDER AWAITING REVIEW: {order.id}</span>
                <h3 style={{ margin: "4px 0 10px 0", fontSize: "16px" }}>Patient: {order.name}</h3>
                <div style={{ padding: "12px", border: "1px solid #edf1ee", borderRadius: "8px", background: "#fcfcfc" }}>
                  <b style={{ fontSize: "12px", color: "#82918b", display: "block", marginBottom: "6px" }}>Symptom details / Attached Log:</b>
                  <p style={{ margin: 0, fontSize: "13px", fontStyle: "italic", color: "#333" }}>
                    &ldquo;{order.itemsSummary}&rdquo;
                  </p>
                </div>
                <div style={{ marginTop: "14px" }}>
                  <b style={{ fontSize: "12px", color: "#82918b", display: "block", marginBottom: "6px" }}>Items requiring prescription validation:</b>
                  <div style={{ display: "grid", gap: "4px", fontSize: "12px" }}>
                    {order.itemsList.map((item, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>{item.name} × {item.quantity}</span>
                        <b>₹{item.price * item.quantity}</b>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ borderLeft: "1px solid #edf1ee", paddingLeft: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "13px" }}>Prescription Attachment</h4>
                  <div
                    style={{
                      border: "1px dashed #7566bf",
                      backgroundColor: "#f9f8ff",
                      borderRadius: "8px",
                      padding: "20px",
                      textAlign: "center",
                      display: "grid",
                      gap: "8px",
                    }}
                  >
                    <FileText size={28} style={{ color: "#7566bf", margin: "0 auto" }} />
                    <b style={{ fontSize: "12px", color: "#584ba5" }}>
                      {order.prescription || "prescription_attached.pdf"}
                    </b>
                    <span style={{ fontSize: "10px", color: "#82918b" }}>Click to view full image</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                  <button
                    onClick={() => { updateOrderStatus(order.id, "Cancelled"); alert("Prescription rejected. Order has been cancelled."); }}
                    style={{
                      flex: 1,
                      padding: "10px",
                      border: "1px solid #fee2e2",
                      backgroundColor: "#fffafa",
                      color: "#ef4444",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <XCircle size={15} /> Reject Rx
                  </button>
                  <button
                    onClick={() => { updateOrderStatus(order.id, "Confirmed"); alert("Prescription approved! Order moved to packing queue."); }}
                    style={{
                      flex: 1,
                      padding: "10px",
                      border: 0,
                      backgroundColor: "#227f5e",
                      color: "#fff",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <FileCheck2 size={15} /> Approve Rx
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card" style={{ textAlign: "center", padding: "60px 20px" }}>
            <FileCheck2 size={40} style={{ color: "#82918b", marginBottom: "12px" }} />
            <h3>No pending reviews</h3>
            <p style={{ color: "#75847e", fontSize: "13px" }}>All prescription-based orders have been checked and processed.</p>
          </div>
        )}
      </div>
    </section>
  );
}
