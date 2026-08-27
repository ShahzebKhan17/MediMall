"use client";

import { useState } from "react";
import { Bell, BellOff, Menu, Search, Volume2 } from "lucide-react";
import ThemeToggle from "../ui/ThemeToggle";
import { useShopkeeper } from "../../app/shopkeeper/ShopkeeperContext";

interface ShopkeeperHeaderProps {
  onMenuClick: () => void;
}

export default function ShopkeeperHeader({ onMenuClick }: ShopkeeperHeaderProps) {
  const { soundEnabled, isAudioRinging, toggleSound, silenceAlert, testSound } = useShopkeeper();
  const [showSoundMenu, setShowSoundMenu] = useState(false);

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

        {/* Audio Alert Bell & Quick Settings */}
        <div style={{ position: "relative" }}>
          <button
            className={`bell ${isAudioRinging ? "ringing-active" : ""}`}
            onClick={() => {
              if (isAudioRinging) {
                silenceAlert();
              } else {
                setShowSoundMenu(!showSoundMenu);
              }
            }}
            title={
              isAudioRinging
                ? "🚨 Incoming Order Ringing! Click to Silence"
                : soundEnabled
                ? "Audio Alerts: ON (Click for options)"
                : "Audio Alerts: MUTED (Click to enable)"
            }
            style={{
              cursor: "pointer",
              position: "relative",
              border: isAudioRinging ? "1px solid #e15241" : "1px solid #e1e9e4",
              background: isAudioRinging ? "#ffebe8" : soundEnabled ? "#eaf5ef" : "#f5f5f5",
              color: isAudioRinging ? "#d93826" : soundEnabled ? "#278561" : "#888",
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
            {soundEnabled ? (
              <Bell size={17} className={isAudioRinging ? "bell-vibrate" : ""} />
            ) : (
              <BellOff size={17} />
            )}
            <span style={{ fontSize: "11px" }}>
              {isAudioRinging ? "Mute Alert" : soundEnabled ? "Chime ON" : "Muted"}
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
                padding: "12px 14px",
                width: "220px",
                zIndex: 50,
                color: "#16342e",
              }}
            >
              <p style={{ margin: "0 0 8px", fontSize: "12px", fontWeight: 700 }}>
                Order Audio Alerts
              </p>
              <p style={{ margin: "0 0 10px", fontSize: "11px", color: "#6e8078", lineHeight: 1.4 }}>
                Plays <b>order_urgent.wav</b> repeatedly until you accept or review incoming orders.
              </p>

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
                  {soundEnabled ? "Disable Audio Alerts" : "Enable Audio Alerts"}
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
                  Test Chime Sound
                </button>
              </div>
            </div>
          )}
        </div>

        <span className="owner">DR</span>
      </div>
    </header>
  );
}
