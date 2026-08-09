"use client";

import { useState } from "react";
import { HeartPulse, Save, User } from "lucide-react";
import { useAppContext } from "../../context/AppContext";

export default function PatientProfilePage() {
  const { user, updateProfile } = useAppContext();

  // Inputs
  const [name, setName] = useState(user?.name || "");
  const [age, setAge] = useState(user?.age.toString() || "");
  const [gender, setGender] = useState(user?.gender || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || "");
  const [allergies, setAllergies] = useState(user?.allergies || "");
  const [address, setAddress] = useState(user?.address || "");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      age: parseInt(age) || 0,
      gender,
      phone,
      email,
      bloodGroup,
      allergies,
      address,
    });
    alert("Profile details saved successfully!");
  };

  return (
    <section className="dash-content">
      <div className="welcome">
        <div>
          <p>SETTINGS</p>
          <h1>Health Profile</h1>
          <h2>Keep your profile info updated for tailored medical checkout.</h2>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px", marginTop: "24px" }}>
        <div className="card">
          <h3 style={{ margin: "0 0 16px 0", fontSize: "16px" }}>Personal Details</h3>
          <form onSubmit={handleSave} style={{ display: "grid", gap: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: "bold" }}>
                Full Name
                <input style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ddd" }} value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: "bold" }}>
                Age
                <input style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ddd" }} type="number" value={age} onChange={(e) => setAge(e.target.value)} required />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: "bold" }}>
                Gender
                <select style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ddd" }} value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: "bold" }}>
                Blood Group
                <input style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ddd" }} value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: "bold" }}>
                Mobile Number
                <input style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ddd" }} value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </label>
              <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: "bold" }}>
                Email Address
                <input style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ddd" }} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </label>
            </div>

            <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: "bold" }}>
              Allergies or Medical Disclaimers
              <input style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ddd" }} value={allergies} onChange={(e) => setAllergies(e.target.value)} />
            </label>

            <label style={{ display: "grid", gap: "4px", fontSize: "12px", fontWeight: "bold" }}>
              Delivery Address
              <textarea style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ddd", height: "60px", fontFamily: "inherit" }} value={address} onChange={(e) => setAddress(e.target.value)} required />
            </label>

            <button className="primary" style={{ justifySelf: "start", marginTop: "8px" }} type="submit">
              <Save size={16} /> Save profile
            </button>
          </form>
        </div>

        <div>
          <div className="card" style={{ textAlign: "center", padding: "20px" }}>
            <span
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                backgroundColor: "#fff0e9",
                color: "#e86b41",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 12px",
              }}
            >
              <User size={28} />
            </span>
            <h3>{user?.name}</h3>
            <span style={{ fontSize: "11px", color: "#82918b" }}>Patient Account</span>

            <div style={{ marginTop: "20px", borderTop: "1px solid #edf1ee", paddingTop: "14px", textAlign: "left", display: "grid", gap: "10px", fontSize: "12px" }}>
              <div>
                <span style={{ color: "#82918b" }}>Blood Type:</span> <b>{user?.bloodGroup || "--"}</b>
              </div>
              <div>
                <span style={{ color: "#82918b" }}>Allergies:</span> <b style={{ color: "#df683e" }}>{user?.allergies}</b>
              </div>
              <div style={{ display: "flex", gap: "6px", alignItems: "start", marginTop: "10px", padding: "8px", background: "#f8f8f8", borderRadius: "6px" }}>
                <HeartPulse size={16} style={{ color: "#df683e", flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: "10px", color: "#666" }}>
                  Allergies and conditions are attached to your prescription validation logs for pharmacy routing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
