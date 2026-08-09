import type { Metadata } from "next";
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

export const metadata: Metadata = { title: "MediMall — Medicine, nearby", description: "Your local pharmacy, delivered in minutes." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AppProvider>{children}</AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

