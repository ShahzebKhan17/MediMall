"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, Menu, Search, HeartPulse, ShoppingBag, FileText, HelpCircle, LogOut } from "lucide-react";
import ThemeToggle from "../ui/ThemeToggle";
import { useAppContext } from "../../app/context/AppContext";

interface UserHeaderProps {
  onMenuClick: () => void;
}

export default function UserHeader({ onMenuClick }: UserHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAppContext();
  const [showDropdown, setShowDropdown] = useState(false);

  const initials = user
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "US";

  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      router.push("/login");
    }
  };

  return (
    <header className="dash-header">
      <button className="dash-menu" onClick={onMenuClick}>
        <Menu />
      </button>
      <div className="dash-search">
        <Search size={18} />
        <input placeholder="Search medicines, brands, health products" />
      </div>
      <div className="dash-actions">
        <ThemeToggle />
        <button className="bell">
          <Bell size={20} />
          <i></i>
        </button>

        <div style={{ position: "relative" }}>
          <button
            className="profile-mini"
            onClick={() => setShowDropdown(!showDropdown)}
            style={{ cursor: "pointer", userSelect: "none" }}
            title="User Account Menu"
          >
            <span>{initials}</span>
            <div>
              <b>{user?.name || "Member"}</b>
              <small>{user?.email ? "Signed in" : "Guest"}</small>
            </div>
            <ChevronDown size={15} style={{ transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
          </button>

          {showDropdown && (
            <div
              style={{
                position: "absolute",
                top: "48px",
                right: 0,
                background: "#ffffff",
                border: "1px solid #dfe8e3",
                boxShadow: "0 10px 30px rgba(0,0,0,0.14)",
                borderRadius: "12px",
                padding: "14px",
                width: "220px",
                zIndex: 100,
                color: "#16342e",
              }}
            >
              <div style={{ paddingBottom: "10px", borderBottom: "1px solid #edf1ee", marginBottom: "8px" }}>
                <b style={{ fontSize: "14px", display: "block", color: "#16342e" }}>
                  {user?.name || "Patient"}
                </b>
                <span style={{ fontSize: "11px", color: "#7a9187", display: "block" }}>
                  {user?.email || "Signed in account"}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    router.push("/user/profile");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "8px 10px",
                    border: 0,
                    borderRadius: "6px",
                    background: "transparent",
                    color: "#16342e",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f4f8f6")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <HeartPulse size={15} color="#227f5e" /> Health Profile
                </button>

                <button
                  onClick={() => {
                    setShowDropdown(false);
                    router.push("/user/orders");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "8px 10px",
                    border: 0,
                    borderRadius: "6px",
                    background: "transparent",
                    color: "#16342e",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f4f8f6")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <ShoppingBag size={15} color="#227f5e" /> My Orders
                </button>

                <button
                  onClick={() => {
                    setShowDropdown(false);
                    router.push("/user/help");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "8px 10px",
                    border: 0,
                    borderRadius: "6px",
                    background: "transparent",
                    color: "#16342e",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f4f8f6")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <HelpCircle size={15} color="#227f5e" /> Help Centre
                </button>

                <button
                  onClick={handleSignOut}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "8px 10px",
                    border: 0,
                    borderRadius: "6px",
                    background: "transparent",
                    color: "#cf1322",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    textAlign: "left",
                    marginTop: "4px",
                    borderTop: "1px solid #f2f5f3",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fff1f0")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


