import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./cinematic.css";
import "./brand.css";
import "./theme.css";
import "./dashboard.css";
import "./order.css";
import "./ai-doctor.css";
import "./shopkeeper.css";
import "./checkout.css";
import "./checkout-refinements.css";
import "./auth.css";
import "./register.css";
import { ThemeProvider } from "./context/ThemeContext";
import { AppProvider } from "./context/AppContext";
import { LocationProvider } from "./context/LocationContext";
import { QueryProvider } from "../components/providers/QueryProvider";
import { LocationModal } from "../components/ui/LocationModal";
import { PwaProvider } from "../components/pwa/PwaProvider";

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "MediMall — Medicine, nearby",
  description: "Your local pharmacy, delivered in minutes.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MediMall",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
      { url: "/icon-192.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", type: "image/png" },
      { url: "/icon-192.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <ThemeProvider>
            <AppProvider>
              <LocationProvider>
                <PwaProvider>
                  {children}
                  <LocationModal />
                </PwaProvider>
              </LocationProvider>
            </AppProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

