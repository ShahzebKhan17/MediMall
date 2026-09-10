"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PwaContextType {
  isInstallable: boolean;
  isStandalone: boolean;
  installApp: () => Promise<void>;
}

const PwaContext = createContext<PwaContextType>({
  isInstallable: false,
  isStandalone: false,
  installApp: async () => {},
});

export const usePwa = () => useContext(PwaContext);

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / running in standalone window
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes("android-app://");
      setIsStandalone(Boolean(isStandaloneMode));
    };

    checkStandalone();

    // 2. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            // Check for updates on load
            reg.addEventListener("updatefound", () => {
              const newWorker = reg.installing;
              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                    console.log("[MediMall PWA] New update available; will apply on next launch.");
                  }
                });
              }
            });
          })
          .catch((err) => {
            console.error("[MediMall PWA] Service worker registration failed:", err);
          });
      });
    }

    // 3. Listen for BeforeInstallPrompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const pwaEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(pwaEvent);

      // Check if user dismissed banner recently
      const dismissed = localStorage.getItem("medimall_pwa_dismissed");
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for successful install
    window.addEventListener("appinstalled", () => {
      setDeferredPrompt(null);
      setShowBanner(false);
      setIsStandalone(true);
      localStorage.removeItem("medimall_pwa_dismissed");
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowBanner(false);
    }
  };

  const dismissBanner = () => {
    setShowBanner(false);
    try {
      localStorage.setItem("medimall_pwa_dismissed", Date.now().toString());
    } catch {
      // ignore
    }
  };

  return (
    <PwaContext.Provider
      value={{
        isInstallable: Boolean(deferredPrompt),
        isStandalone,
        installApp,
      }}
    >
      {children}

      {/* Floating Install App Banner (only shows if installable and not in standalone) */}
      {showBanner && !isStandalone && deferredPrompt && (
        <div
          role="banner"
          aria-label="Install MediMall App"
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            zIndex: 9999,
            backgroundColor: "rgba(11, 21, 18, 0.95)",
            backdropFilter: "blur(12px)",
            color: "#ffffff",
            borderRadius: "16px",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            boxShadow: "0 12px 36px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(16, 185, 129, 0.3)",
            maxWidth: "380px",
            animation: "slideUp 0.3s ease-out",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Download size={20} color="#10B981" />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.2px" }}>
              Install MediMall App
            </div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", marginTop: "2px", lineHeight: 1.3 }}>
              Fast access from home screen & offline-ready
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
            <button
              onClick={installApp}
              style={{
                backgroundColor: "#10B981",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 14px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              Install
            </button>
            <button
              onClick={dismissBanner}
              aria-label="Close install prompt"
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.5)",
                padding: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </PwaContext.Provider>
  );
}
