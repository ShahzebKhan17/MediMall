"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "../context/ThemeContext";
import { useAppContext } from "../context/AppContext";
import ShopkeeperSidebar from "../../components/shopkeeper/ShopkeeperSidebar";
import ShopkeeperHeader from "../../components/shopkeeper/ShopkeeperHeader";
import { ShopkeeperProvider, useShopkeeper } from "./ShopkeeperContext";

function ShopkeeperAlertBanner() {
  const {
    isAudioRinging,
    silenceAlert,
    autoplayBlocked,
    unlockAudio,
    desktopNotificationPermission,
    requestNotificationPermission,
  } = useShopkeeper();
  const [dismissNotifPrompt, setDismissNotifPrompt] = useState(false);

  return (
    <>
      {/* 1. Ringing Alarm Banner */}
      {isAudioRinging && (
        <div
          style={{
            background: "#fff1f0",
            borderBottom: "1px solid #ffccc7",
            padding: "10px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            animation: "pulse 1.5s infinite",
            zIndex: 40,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "18px" }}>🚨</span>
            <div>
              <b style={{ color: "#cf1322", fontSize: "13px" }}>Urgent: New incoming order awaiting confirmation!</b>
              <small style={{ display: "block", color: "#666", fontSize: "11px" }}>
                An order is ringing in your queue. Please review and dispatch.
              </small>
            </div>
          </div>
          <button
            onClick={silenceAlert}
            style={{
              background: "#cf1322",
              color: "#fff",
              border: 0,
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Mute Sound
          </button>
        </div>
      )}

      {/* 2. Audio Autoplay Blocked Banner */}
      {autoplayBlocked && !isAudioRinging && (
        <div
          onClick={unlockAudio}
          style={{
            background: "#fffbe6",
            borderBottom: "1px solid #ffe58f",
            padding: "8px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            zIndex: 40,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "16px" }}>⚠️</span>
            <span style={{ color: "#d48806", fontSize: "12px", fontWeight: 600 }}>
              Audio ringtone is paused by browser autoplay policy. <u>Click here</u> to enable loud order chimes.
            </span>
          </div>
          <button
            onClick={unlockAudio}
            style={{
              background: "#d48806",
              color: "#fff",
              border: 0,
              padding: "4px 10px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Enable Sound
          </button>
        </div>
      )}

      {/* 3. Desktop Notification Permission Prompt */}
      {desktopNotificationPermission === "default" && !dismissNotifPrompt && (
        <div
          style={{
            background: "#e8f4fd",
            borderBottom: "1px solid #b7ddf9",
            padding: "8px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 40,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "16px" }}>🖥️</span>
            <span style={{ color: "#0c5460", fontSize: "12px" }}>
              Enable <b>desktop notifications</b> so you get notified even when this window is minimized or behind other billing windows.
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={async () => {
                await requestNotificationPermission();
              }}
              style={{
                background: "#0d6efd",
                color: "#fff",
                border: 0,
                padding: "4px 12px",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Turn On Alerts
            </button>
            <button
              onClick={() => setDismissNotifPrompt(true)}
              style={{
                background: "transparent",
                border: 0,
                color: "#6c757d",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function ShopkeeperLayout({ children }: { children: React.ReactNode }) {
  const { dark } = useTheme();
  const { user, role, isHydrating } = useAppContext();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isHydrating) {
      if (user && role !== "pharmacy") {
        router.replace("/user/dashboard");
      }
    }
  }, [user, role, isHydrating, router]);

  // If logged in as patient, show blank or transition while redirecting
  if (!isHydrating && user && role !== "pharmacy") {
    return null;
  }

  return (
    <ShopkeeperProvider>
      <main className={`shop-shell ${dark ? "dark" : ""}`}>
        <ShopkeeperSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="shop-main">
          <ShopkeeperHeader onMenuClick={() => setMobileOpen(!mobileOpen)} />
          <ShopkeeperAlertBanner />
          {children}
        </div>
      </main>
    </ShopkeeperProvider>
  );
}

