"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, Menu, Search, Volume2, LogOut, Settings, UserRound, ShieldCheck, Monitor, AlertTriangle, CheckCircle2 } from "lucide-react";
import ThemeToggle from "../ui/ThemeToggle";
import { useShopkeeper } from "../../app/shopkeeper/ShopkeeperContext";
import { useAppContext } from "../../app/context/AppContext";

interface ShopkeeperHeaderProps {
  onMenuClick: () => void;
}

export default function ShopkeeperHeader({ onMenuClick }: ShopkeeperHeaderProps) {
  const router = useRouter();
  const {
    soundEnabled,
    isAudioRinging,
    autoplayBlocked,
    desktopNotificationPermission,
    toggleSound,
    silenceAlert,
    testSound,
    unlockAudio,
    requestNotificationPermission,
    sendTestNotification,
  } = useShopkeeper();
  const { user, logout } = useAppContext();
  const [showSoundMenu, setShowSoundMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "PH";

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.push("/login");
    }
  };

  return (
    <header className="shop-header">
      <button className="shop-menu" onClick={onMenuClick}>
        <Menu />
      </button>
      <div className="shop-search">
        <Search size={18} />
        <input placeholder="Search orders, medicines or customers" />
      </div>
      <div className="shop-actions">
        <ThemeToggle />

        {/* Audio & Desktop Alerts Bell & Quick Settings */}
        <div style={{ position: "relative" }}>
          <button
            className={`bell ${isAudioRinging ? "ringing-active" : ""}`}
            onClick={() => {
              if (isAudioRinging) {
                silenceAlert();
              } else if (autoplayBlocked) {
                unlockAudio();
              } else {
                setShowSoundMenu(!showSoundMenu);
                setShowProfileMenu(false);
              }
            }}
            title={
              isAudioRinging
                ? "🚨 Incoming Order Ringing! Click to Silence"
                : autoplayBlocked
                ? "⚠️ Audio blocked by browser! Click to enable sound"
                : soundEnabled
                ? "Audio & Push Alerts: ON (Click for options)"
                : "Audio Alerts: MUTED (Click to enable)"
            }
            style={{
              cursor: "pointer",
              position: "relative",
              border: isAudioRinging
                ? "1px solid #e15241"
                : autoplayBlocked
                ? "1px solid #faad14"
                : "1px solid #e1e9e4",
              background: isAudioRinging
                ? "#ffebe8"
                : autoplayBlocked
                ? "#fffbe6"
                : soundEnabled
                ? "#eaf5ef"
                : "#f5f5f5",
              color: isAudioRinging
                ? "#d93826"
                : autoplayBlocked
                ? "#d48806"
                : soundEnabled
                ? "#278561"
                : "#888",
              borderRadius: "8px",
              padding: "7px 10px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              fontWeight: 600,
              transition: "all 0.2s ease",
            }}
          >
            {autoplayBlocked ? (
              <AlertTriangle size={17} color="#d48806" />
            ) : soundEnabled ? (
              <Bell size={17} className={isAudioRinging ? "bell-vibrate" : ""} />
            ) : (
              <BellOff size={17} />
            )}
            <span style={{ fontSize: "11px" }}>
              {isAudioRinging
                ? "Mute Alert"
                : autoplayBlocked
                ? "Enable Sound"
                : soundEnabled
                ? "Alerts ON"
                : "Muted"}
            </span>
          </button>

          {showSoundMenu && (
            <div
              style={{
                position: "absolute",
                top: "42px",
                right: "0",
                background: "#ffffff",
                border: "1px solid #dfe8e3",
                boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
                borderRadius: "10px",
                padding: "14px 16px",
                width: "260px",
                zIndex: 50,
                color: "#16342e",
              }}
            >
              <p style={{ margin: "0 0 6px", fontSize: "13px", fontWeight: 700 }}>
                Order Notification Settings
              </p>
              <p style={{ margin: "0 0 12px", fontSize: "11px", color: "#6e8078", lineHeight: 1.4 }}>
                Never miss an order while working at the counter or browsing other tabs.
              </p>

              {/* Sound Ringtone Section */}
              <div style={{ marginBottom: "12px", paddingBottom: "10px", borderBottom: "1px solid #edf1ee" }}>
                <b style={{ fontSize: "11px", display: "block", marginBottom: "6px", color: "#374151" }}>
                  🔊 Audio Ringtone
                </b>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <button
                    onClick={() => {
                      toggleSound();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      width: "100%",
                      padding: "7px 10px",
                      border: "1px solid #d2e4db",
                      borderRadius: "6px",
                      background: soundEnabled ? "#e8f6ef" : "#f6f6f6",
                      color: soundEnabled ? "#1d7454" : "#555",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {soundEnabled ? <Bell size={14} /> : <BellOff size={14} />}
                    {soundEnabled ? "Audio Alerts Enabled" : "Audio Alerts Muted"}
                  </button>

                  <button
                    onClick={() => {
                      testSound();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      width: "100%",
                      padding: "7px 10px",
                      border: "1px solid #d2e4db",
                      borderRadius: "6px",
                      background: "#ffffff",
                      color: "#28483e",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Volume2 size={14} color="#df663d" />
                    Test Ringtone Chime
                  </button>
                </div>
              </div>

              {/* Desktop Push Banner Section */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <b style={{ fontSize: "11px", color: "#374151" }}>
                    🖥️ Desktop Banners
                  </b>
                  {desktopNotificationPermission === "granted" ? (
                    <span style={{ fontSize: "10px", color: "#1d7454", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "3px" }}>
                      <CheckCircle2 size={12} /> Active
                    </span>
                  ) : desktopNotificationPermission === "denied" ? (
                    <span style={{ fontSize: "10px", color: "#cf1322", fontWeight: 700 }}>
                      Blocked
                    </span>
                  ) : (
                    <span style={{ fontSize: "10px", color: "#fa8c16", fontWeight: 700 }}>
                      Not Setup
                    </span>
                  )}
                </div>

                <p style={{ margin: "0 0 8px", fontSize: "10px", color: "#7a9187", lineHeight: 1.3 }}>
                  Alerts pop up on your computer screen even if the browser is minimized.
                </p>

                {desktopNotificationPermission === "granted" ? (
                  <button
                    onClick={() => sendTestNotification()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      width: "100%",
                      padding: "7px 10px",
                      border: "1px solid #d2e4db",
                      borderRadius: "6px",
                      background: "#f0fdf4",
                      color: "#166534",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Monitor size={14} />
                    Test Desktop Notification
                  </button>
                ) : desktopNotificationPermission === "denied" ? (
                  <div style={{ padding: "6px 8px", borderRadius: "6px", background: "#fff1f0", color: "#cf1322", fontSize: "10px" }}>
                    ⚠️ Notifications were blocked. Click the lock/tune icon near your browser address bar to allow them.
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      await requestNotificationPermission();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      width: "100%",
                      padding: "8px 10px",
                      border: 0,
                      borderRadius: "6px",
                      background: "#227f5e",
                      color: "#ffffff",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 2px 5px rgba(34,127,94,0.3)",
                    }}
                  >
                    <Bell size={14} />
                    Enable Desktop Alerts
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pharmacist Profile Menu & Logout */}
        <div style={{ position: "relative" }}>
          <button
            className="owner"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowSoundMenu(false);
            }}
            style={{
              cursor: "pointer",
              border: 0,
              display: "grid",
              placeItems: "center",
              userSelect: "none",
            }}
            title="Pharmacist Account Menu"
          >
            {initials}
          </button>

          {showProfileMenu && (
            <div
              style={{
                position: "absolute",
                top: "42px",
                right: "0",
                background: "#ffffff",
                border: "1px solid #dfe8e3",
                boxShadow: "0 10px 30px rgba(0,0,0,0.14)",
                borderRadius: "12px",
                padding: "14px",
                width: "240px",
                zIndex: 60,
                color: "#16342e",
              }}
            >
              <div style={{ paddingBottom: "10px", borderBottom: "1px solid #edf1ee", marginBottom: "8px" }}>
                <b style={{ fontSize: "14px", display: "block", color: "#16342e" }}>
                  {user?.name || "Pharmacist"}
                </b>
                <span style={{ fontSize: "11px", color: "#7a9187", display: "block" }}>
                  {user?.email || "pharmacist@medimall.in"}
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "#e2f4eb",
                    color: "#227f5e",
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: "4px",
                    marginTop: "6px",
                  }}
                >
                  <ShieldCheck size={12} /> Licensed Pharmacist
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    router.push("/shopkeeper/settings");
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
                  <Settings size={15} color="#227f5e" /> Shop Settings
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    router.push("/shopkeeper/team");
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
                  <UserRound size={15} color="#227f5e" /> Team Members
                </button>

                <button
                  onClick={handleLogout}
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

