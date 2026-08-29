"use client";

import { useState } from "react";
import { UserRound, Plus, ShieldCheck, Mail, Phone, Trash2, CheckCircle2, UserCheck } from "lucide-react";
import { useAppContext } from "../../context/AppContext";

interface TeamMember {
  id: string;
  name: string;
  role: "Chief Pharmacist" | "Dispensing Pharmacist" | "Billing Staff" | "Delivery Partner";
  email: string;
  phone: string;
  status: "Active" | "On Shift" | "Offline";
  isPrimary?: boolean;
}

export default function ShopkeeperTeamPage() {
  const { user } = useAppContext();

  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: "1",
      name: user?.name || "Pharmacist in-charge",
      role: "Chief Pharmacist",
      email: user?.email || "pharmacist@medimall.in",
      phone: user?.phone || "+919795406782",
      status: "On Shift",
      isPrimary: true,
    },
    {
      id: "2",
      name: "Suresh Reddy",
      role: "Dispensing Pharmacist",
      email: "suresh.reddy@pharmamail.in",
      phone: "+91 98450 11223",
      status: "Active",
    },
    {
      id: "3",
      name: "Pooja Verma",
      role: "Billing Staff",
      email: "pooja.v@pharmamail.in",
      phone: "+91 97312 44556",
      status: "Offline",
    },
  ]);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<TeamMember["role"]>("Dispensing Pharmacist");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: newName,
      role: newRole,
      email: newEmail,
      phone: newPhone || "+91 99000 00000",
      status: "Active",
    };

    setMembers([...members, newMember]);
    setNewName("");
    setNewEmail("");
    setNewPhone("");
    setShowInviteModal(false);
  };

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  return (
    <section className="shop-content">
      <div className="shop-welcome" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p>STAFF & ACCESS PERMISSIONS</p>
          <h1>Team Members</h1>
          <h2>Manage licensed pharmacists, counter dispensing staff, and delivery riders for your store.</h2>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          style={{
            background: "#227f5e",
            color: "#fff",
            border: 0,
            padding: "10px 18px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 4px 12px rgba(34, 127, 94, 0.15)",
          }}
        >
          <Plus size={16} /> Add Team Member
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px", marginTop: "24px" }}>
        {members.map((m) => (
          <div
            key={m.id}
            className="card"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              position: "relative",
              border: m.isPrimary ? "2px solid #227f5e" : "1px solid #edf1ee",
            }}
          >
            {m.isPrimary && (
              <span
                style={{
                  position: "absolute",
                  top: "14px",
                  right: "14px",
                  background: "#e2f4eb",
                  color: "#227f5e",
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "4px 8px",
                  borderRadius: "4px",
                }}
              >
                Licensee / Admin
              </span>
            )}

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  background: m.isPrimary ? "#227f5e" : "#edf5f1",
                  color: m.isPrimary ? "#ffffff" : "#227f5e",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "16px",
                  fontWeight: 700,
                }}
              >
                {m.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <b style={{ fontSize: "15px", display: "block" }}>{m.name}</b>
                <span style={{ fontSize: "12px", color: "#6b8077" }}>{m.role}</span>
              </div>
            </div>

            <div style={{ display: "grid", gap: "6px", fontSize: "12px", color: "#4f635c", marginTop: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Mail size={14} color="#8aa298" /> {m.email}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Phone size={14} color="#8aa298" /> {m.phone}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px solid #f0f4f1", marginTop: "auto" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: m.status === "On Shift" ? "#227f5e" : m.status === "Active" ? "#2f6fb3" : "#888",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    backgroundColor: m.status === "On Shift" ? "#227f5e" : m.status === "Active" ? "#2f6fb3" : "#bbb",
                  }}
                />
                {m.status}
              </span>

              {!m.isPrimary && (
                <button
                  onClick={() => handleRemoveMember(m.id)}
                  style={{
                    background: "transparent",
                    border: 0,
                    color: "#cf1322",
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Trash2 size={13} /> Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(3px)",
            display: "grid",
            placeItems: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "460px",
              background: "#fff",
              borderRadius: "14px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              padding: "24px",
            }}
          >
            <h3 style={{ margin: "0 0 6px 0", fontSize: "18px" }}>Add Staff Member</h3>
            <p style={{ margin: "0 0 18px 0", fontSize: "12px", color: "#666" }}>
              Grant portal access to dispensing pharmacists and store assistants.
            </p>

            <form onSubmit={handleAddMember} style={{ display: "grid", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Full Name</label>
                <input
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1ded7", fontSize: "13px" }}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Designation / Role</label>
                <select
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1ded7", fontSize: "13px", background: "#fff" }}
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                >
                  <option value="Dispensing Pharmacist">Dispensing Pharmacist (Can approve Rx)</option>
                  <option value="Billing Staff">Billing Staff (Pack orders & invoices)</option>
                  <option value="Delivery Partner">Delivery Partner (Dispatched orders)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Email Address</label>
                <input
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1ded7", fontSize: "13px" }}
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="staff@medimall.in"
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Phone Number</label>
                <input
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1ded7", fontSize: "13px" }}
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#f2f2f2",
                    border: 0,
                    borderRadius: "8px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#227f5e",
                    color: "#fff",
                    border: 0,
                    borderRadius: "8px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
