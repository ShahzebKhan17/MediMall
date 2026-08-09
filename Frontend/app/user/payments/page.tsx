"use client";

import { CreditCard, Plus, ShieldCheck, WalletCards } from "lucide-react";

export default function PatientPaymentsPage() {
  return (
    <section className="dash-content">
      <div className="welcome">
        <div>
          <p>WALLET & BILLING</p>
          <h1>Payments</h1>
          <h2>Manage your linked accounts, cards, and view transaction statements.</h2>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "24px" }}>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0, fontSize: "15px" }}>Saved Methods</h3>
            <button className="plain" style={{ border: 0, background: "none", color: "#227f5e", fontSize: "11px", fontWeight: "bold", cursor: "pointer", display: "flex", gap: "4px", alignItems: "center" }}>
              <Plus size={14} /> Add new
            </button>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "12px", border: "1px solid #edf1ee", borderRadius: "8px" }}>
              <WalletCards size={20} style={{ color: "#227f5e" }} />
              <div>
                <b style={{ fontSize: "13px", display: "block" }}>Google Pay UPI</b>
                <span style={{ fontSize: "10px", color: "#82918b" }}>ananya@okaxis · Primary</span>
              </div>
              <span style={{ marginLeft: "auto", fontSize: "10px", color: "#227f5e", background: "#e2f4eb", padding: "4px 8px", borderRadius: "4px", fontWeight: "bold" }}>Linked</span>
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "12px", border: "1px solid #edf1ee", borderRadius: "8px" }}>
              <CreditCard size={20} style={{ color: "#507bc2" }} />
              <div>
                <b style={{ fontSize: "13px", display: "block" }}>HDFC Bank Card</b>
                <span style={{ fontSize: "10px", color: "#82918b" }}>Visa ending in 4928</span>
              </div>
              <span style={{ marginLeft: "auto", fontSize: "10px", color: "#82918b", background: "#f5f5f5", padding: "4px 8px", borderRadius: "4px" }}>Expired</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ margin: "0 0 14px 0", fontSize: "15px" }}>Transaction History</h3>
          <div style={{ display: "grid", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #edf1ee" }}>
              <div>
                <b style={{ fontSize: "12px", display: "block" }}>Care & Cure Pharmacy</b>
                <span style={{ fontSize: "10px", color: "#82918b" }}>06 Aug, 2026 · UPI Statement</span>
              </div>
              <b style={{ marginLeft: "auto", fontSize: "13px" }}>₹62</b>
            </div>

            <div style={{ display: "flex", justifyContent: "between", alignItems: "center", padding: "10px 0", borderBottom: "0 solid #edf1ee" }}>
              <div>
                <b style={{ fontSize: "12px", display: "block" }}>Health Insurance Refund</b>
                <span style={{ fontSize: "10px", color: "#82918b" }}>28 Jul, 2026 · Wallet Statement</span>
              </div>
              <b style={{ marginLeft: "auto", fontSize: "13px", color: "#27815f" }}>+₹350</b>
            </div>
          </div>

          <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "24px", color: "#82918b", fontSize: "11px" }}>
            <ShieldCheck size={14} />
            <span>Encrypted PCI-compliant transaction records.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
