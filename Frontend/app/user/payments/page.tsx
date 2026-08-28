"use client";

import { CreditCard, Plus, ShieldCheck, WalletCards, ShoppingBag } from "lucide-react";
import { useAppContext } from "../../context/AppContext";

export default function PatientPaymentsPage() {
  const { user, orders } = useAppContext();

  return (
    <section className="dash-content">
      <div className="welcome">
        <div>
          <p>WALLET & BILLING</p>
          <h1>Payments</h1>
          <h2>Manage your payment preferences and view completed order receipts.</h2>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "24px" }}>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0, fontSize: "15px" }}>Payment Methods</h3>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "12px", border: "1px solid #edf1ee", borderRadius: "8px" }}>
              <WalletCards size={20} style={{ color: "#227f5e" }} />
              <div>
                <b style={{ fontSize: "13px", display: "block" }}>Instant UPI</b>
                <span style={{ fontSize: "10px", color: "#82918b" }}>
                  {user?.phone ? `${user.phone.replace(/[^0-9]/g, "").slice(-10)}@upi` : "Google Pay / PhonePe / Paytm"}
                </span>
              </div>
              <span style={{ marginLeft: "auto", fontSize: "10px", color: "#227f5e", background: "#e2f4eb", padding: "4px 8px", borderRadius: "4px", fontWeight: "bold" }}>Active</span>
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "12px", border: "1px solid #edf1ee", borderRadius: "8px" }}>
              <CreditCard size={20} style={{ color: "#507bc2" }} />
              <div>
                <b style={{ fontSize: "13px", display: "block" }}>Razorpay Gateway</b>
                <span style={{ fontSize: "10px", color: "#82918b" }}>Cards, Net Banking & UPI</span>
              </div>
              <span style={{ marginLeft: "auto", fontSize: "10px", color: "#227f5e", background: "#e2f4eb", padding: "4px 8px", borderRadius: "4px", fontWeight: "bold" }}>Secure</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ margin: "0 0 14px 0", fontSize: "15px" }}>Transaction Receipts</h3>
          {orders && orders.length > 0 ? (
            <div style={{ display: "grid", gap: "10px" }}>
              {orders.slice(0, 5).map((ord) => (
                <div key={ord.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #edf1ee" }}>
                  <div>
                    <b style={{ fontSize: "12px", display: "block" }}>{ord.pharmacyName || "Local Pharmacy"}</b>
                    <span style={{ fontSize: "10px", color: "#82918b" }}>{ord.time || "Recent"} · {ord.paymentMethod}</span>
                  </div>
                  <b style={{ fontSize: "13px" }}>₹{ord.total}</b>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#82918b" }}>
              <ShoppingBag size={28} style={{ margin: "0 auto 8px auto", display: "block", color: "#227f5e" }} />
              <p style={{ margin: 0, fontSize: "12px" }}>No past transactions yet. Placed orders will show here.</p>
            </div>
          )}

          <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "24px", color: "#82918b", fontSize: "11px" }}>
            <ShieldCheck size={14} />
            <span>Encrypted PCI-compliant transaction records.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
