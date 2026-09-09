"use client";

import { useEffect, useState } from "react";
import { Settings, Save, Store, ShieldCheck, MapPin, Phone, Clock, Bell, CreditCard, AlertCircle } from "lucide-react";
import { useAppContext } from "../../context/AppContext";

export default function ShopSettingsPage() {
  const { user, updateProfile } = useAppContext();

  const [storeName, setStoreName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [openingHours, setOpeningHours] = useState("08:00 AM - 11:00 PM (All Days)");
  const [dispatchRadius, setDispatchRadius] = useState("5 km");
  const [autoAccept, setAutoAccept] = useState(true);

  // Bank & Settlement fields
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [upiPayout, setUpiPayout] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Synchronize state when user data loads
  useEffect(() => {
    if (user) {
      setStoreName(user.name || "");
      setLicenseNumber(user.medical_license || "");
      setPhone(user.phone || "");
      setEmail(user.email || "");
      setAddress(user.address || "");
      setBeneficiaryName(user.bankBeneficiaryName || "");
      setBankName(user.bankName || "");
      setAccountNumber(user.bankAccountNumber || "");
      setConfirmAccountNumber(user.bankAccountNumber || "");
      setIfscCode(user.bankIfscCode || "");
      setUpiPayout(user.upiId || "");
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate account number match if provided
    if (accountNumber && confirmAccountNumber && accountNumber !== confirmAccountNumber) {
      setFormError("Bank account numbers do not match. Please re-check.");
      return;
    }

    // Validate IFSC code format if provided
    const cleanIfsc = ifscCode.trim().toUpperCase();
    if (cleanIfsc && cleanIfsc.length !== 11) {
      setFormError("IFSC code must be exactly 11 alphanumeric characters (e.g., HDFC0001234).");
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        name: storeName,
        phone,
        email,
        address,
        medical_license: licenseNumber,
        bankBeneficiaryName: beneficiaryName.trim(),
        bankAccountNumber: accountNumber.trim(),
        bankIfscCode: cleanIfsc,
        bankName: bankName.trim(),
        upiId: upiPayout.trim(),
      });
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 4000);
    } catch (err: any) {
      console.error("Save settings failed:", err);
      setFormError(err?.message || "Failed to update store settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="shop-content">
      <div className="shop-welcome">
        <div>
          <p>PHARMACY PREFERENCES</p>
          <h1>Shop Settings</h1>
          <h2>Configure store information, drug license details, dispatch radius, and payout bank accounts.</h2>
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
          <ShieldCheck size={18} /> Store profile and bank settlement settings updated successfully!
        </div>
      )}

      {formError && (
        <div
          style={{
            background: "#fff1f0",
            border: "1px solid #ffa39e",
            color: "#cf1322",
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
          <AlertCircle size={18} /> {formError}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px", marginTop: "16px" }}>
        {/* Left Column: Store Profile & Payout Banking Details */}
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
                  placeholder="e.g. Apollo Pharmacy, Indian Pharmacy"
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
                    placeholder="DL-XX-YYY-2025-0000"
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
                    placeholder="+919876543210"
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
                  Physical Store Address (For Hyperlocal Delivery Routing)
                </label>
                <textarea
                  rows={3}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1ded7", fontSize: "13px", outline: "none", resize: "vertical" }}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, Landmark, City, State, Pincode"
                  required
                />
              </div>
            </div>
          </div>

          {/* Option A: Bank Details & Automated Settlements */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <CreditCard size={20} color="#227f5e" />
              <div>
                <h3 style={{ margin: 0, fontSize: "16px" }}>Payouts & Bank Settlement Details</h3>
                <small style={{ color: "#7a9187", fontSize: "11px" }}>Real money order settlements will be transferred to this verified account.</small>
              </div>
            </div>

            <div style={{ display: "grid", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px", color: "#333" }}>
                    Account Holder / Beneficiary Name
                  </label>
                  <input
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1ded7", fontSize: "13px", outline: "none" }}
                    value={beneficiaryName}
                    onChange={(e) => setBeneficiaryName(e.target.value)}
                    placeholder="Name matching bank records"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px", color: "#333" }}>
                    Bank Name
                  </label>
                  <input
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1ded7", fontSize: "13px", outline: "none" }}
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank, SBI, ICICI"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px", color: "#333" }}>
                    Bank Account Number
                  </label>
                  <input
                    type="password"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1ded7", fontSize: "13px", outline: "none" }}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Enter account number"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px", color: "#333" }}>
                    Confirm Account Number
                  </label>
                  <input
                    type="text"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1ded7", fontSize: "13px", outline: "none" }}
                    value={confirmAccountNumber}
                    onChange={(e) => setConfirmAccountNumber(e.target.value)}
                    placeholder="Re-enter account number"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px", color: "#333" }}>
                    IFSC Code
                  </label>
                  <input
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1ded7", fontSize: "13px", outline: "none", textTransform: "uppercase" }}
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="e.g. HDFC0001234"
                    maxLength={11}
                  />
                  <small style={{ color: "#7a9187", fontSize: "10px", marginTop: "2px", display: "block" }}>11-character Indian banking code</small>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px", color: "#333" }}>
                    Instant Settlement UPI VPA / ID (Optional)
                  </label>
                  <input
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1ded7", fontSize: "13px", outline: "none" }}
                    value={upiPayout}
                    onChange={(e) => setUpiPayout(e.target.value)}
                    placeholder="storename@okaxis or store@icici"
                  />
                  <small style={{ color: "#7a9187", fontSize: "10px", marginTop: "2px", display: "block" }}>For instant UPI credit settlements</small>
                </div>
              </div>

              <div style={{ background: "#f8faf9", border: "1px solid #e2eae5", borderRadius: "8px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={16} color="#227f5e" />
                <span style={{ fontSize: "11px", color: "#4f6e63" }}>
                  All bank records are securely encrypted and used exclusively for automated marketplace order settlements.
                </span>
              </div>
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
            disabled={isSaving}
            style={{
              background: "#16342e",
              color: "#ffffff",
              border: 0,
              padding: "14px 20px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: isSaving ? "not-allowed" : "pointer",
              opacity: isSaving ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(22, 52, 46, 0.15)",
              transition: "all 0.2s ease",
            }}
          >
            <Save size={18} /> {isSaving ? "Saving..." : "Save Shop Settings"}
          </button>
        </div>
      </form>
    </section>
  );
}
