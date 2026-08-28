"use client";

import { useState } from "react";
import { Settings, Save, Store, ShieldCheck, MapPin, Phone, Clock, Bell, CreditCard } from "lucide-react";
import { useAppContext } from "../../context/AppContext";

export default function ShopSettingsPage() {
  const { user, updateProfile } = useAppContext();

  const [storeName, setStoreName] = useState(user?.name || "");
  const [licenseNumber, setLicenseNumber] = useState(user?.medical_license || "DL-KA-BNG-2025-0042");
  const [phone, setPhone] = useState(user?.phone || "+91 80 4123 4567");
  const [email, setEmail] = useState(user?.email || "");
  const [address, setAddress] = useState(user?.address || "100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038");
  const [openingHours, setOpeningHours] = useState("08:00 AM - 11:00 PM (All Days)");
  const [upiPayout, setUpiPayout] = useState("store@icici");
  const [dispatchRadius, setDispatchRadius] = useState("5 km");
  const [autoAccept, setAutoAccept] = useState(true);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: storeName,
      phone,
      email,
      address,
    });
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <section className="shop-content">
      <div className="shop-welcome">
        <div>
          <p>PHARMACY PREFERENCES</p>
          <h1>Shop Settings</h1>
          <h2>Configure store information, drug license details, dispatch radius, and payout accounts.</h2>
        </div>
      </div>

      {savedMessage && (
        <div
          style={{
            background: "#e6f7ef",
            border: "1px solid #a3e0c4",
            color: "#186349",
            padding: "12px 18px",
            borderRadius: "10px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          <ShieldCheck size={18} /> Store settings updated and synchronized with the dispatch network!
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px", marginTop: "16px" }}>
        {/* Left Column: Store Profile & Legal Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <Store size={20} color="#227f5e" />
              <h3 style={{ margin: 0, fontSize: "16px" }}>Store Profile & Verification</h3>
            </div>

            <div style={{ display: "grid", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px", color: "#333" }}>
                  Pharmacy / Store Business Name
                </label>
                <input
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1ded7", fontSize: "13px", outline: "none" }}
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g. Apollo Pharmacy, MedPlus"
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px", color: "#333" }}>
                    Drug License Number (Form 20/21)
                  </label>
                  <input
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1ded7", fontSize: "13px", outline: "none" }}
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px", color: "#333" }}>
                    Store Contact Phone
                  </label>
                  <input
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1ded7", fontSize: "13px", outline: "none" }}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px", color: "#333" }}>
                  Official Email Address
                </label>
                <input
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1ded7", fontSize: "13px", outline: "none" }}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px", color: "#333" }}>
                  Physical Store Address (For Hyperlocal Pickup)
                </label>
                <textarea
                  rows={3}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1ded7", fontSize: "13px", outline: "none", resize: "vertical" }}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <CreditCard size={20} color="#227f5e" />
              <h3 style={{ margin: 0, fontSize: "16px" }}>Payouts & Daily Settlements</h3>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px", color: "#333" }}>
                Instant Settlement UPI VPA / Account
              </label>
              <input
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1ded7", fontSize: "13px", outline: "none" }}
                value={upiPayout}
                onChange={(e) => setUpiPayout(e.target.value)}
                placeholder="storename@bank"
              />
              <small style={{ color: "#7a9187", fontSize: "11px", marginTop: "4px", display: "block" }}>
                Order revenues are settled directly every night at 11:59 PM.
              </small>
            </div>
          </div>
        </div>

        {/* Right Column: Operating & Dispatch Rules */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <Clock size={20} color="#227f5e" />
              <h3 style={{ margin: 0, fontSize: "16px" }}>Dispatch & Timings</h3>
            </div>

            <div style={{ display: "grid", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px", color: "#333" }}>
                  Operating Hours
                </label>
                <input
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1ded7", fontSize: "13px", outline: "none" }}
                  value={openingHours}
                  onChange={(e) => setOpeningHours(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px", color: "#333" }}>
                  Hyperlocal Delivery Radius
                </label>
                <select
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1ded7", fontSize: "13px", outline: "none", background: "#fff" }}
                  value={dispatchRadius}
                  onChange={(e) => setDispatchRadius(e.target.value)}
                >
                  <option value="3 km">3 km (Ultra fast ~8 min)</option>
                  <option value="5 km">5 km (Standard ~12 min)</option>
                  <option value="10 km">10 km (Extended radius)</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderTop: "1px solid #f0f4f1" }}>
                <div>
                  <b style={{ fontSize: "13px", display: "block" }}>Auto-Queue OTC Orders</b>
                  <small style={{ color: "#7a9187", fontSize: "11px" }}>Instantly accept non-prescription items</small>
                </div>
                <input
                  type="checkbox"
                  checked={autoAccept}
                  onChange={(e) => setAutoAccept(e.target.checked)}
                  style={{ width: "18px", height: "18px", accentColor: "#227f5e", cursor: "pointer" }}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            style={{
              background: "#16342e",
              color: "#ffffff",
              border: 0,
              padding: "14px 20px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(22, 52, 46, 0.15)",
              transition: "all 0.2s ease",
            }}
          >
            <Save size={18} /> Save Shop Settings
          </button>
        </div>
      </form>
    </section>
  );
}
