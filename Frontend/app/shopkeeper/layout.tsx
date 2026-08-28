"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "../context/ThemeContext";
import { useAppContext } from "../context/AppContext";
import ShopkeeperSidebar from "../../components/shopkeeper/ShopkeeperSidebar";
import ShopkeeperHeader from "../../components/shopkeeper/ShopkeeperHeader";
import { ShopkeeperProvider } from "./ShopkeeperContext";

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
          {children}
        </div>
      </main>
    </ShopkeeperProvider>
  );
}

