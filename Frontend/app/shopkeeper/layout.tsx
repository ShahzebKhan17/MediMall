"use client";

import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import ShopkeeperSidebar from "../../components/shopkeeper/ShopkeeperSidebar";
import ShopkeeperHeader from "../../components/shopkeeper/ShopkeeperHeader";
import { ShopkeeperProvider } from "./ShopkeeperContext";

export default function ShopkeeperLayout({ children }: { children: React.ReactNode }) {
  const { dark } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ShopkeeperProvider>
      <main className={`shop-shell ${dark ? "dark" : ""}`}>
        <ShopkeeperSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="shop-main">
          <ShopkeeperHeader onMenuClick={() => setMobileOpen(!mobileOpen)} />
          {children}
        </div>
      </main>
    </ShopkeeperProvider>
  );
}

