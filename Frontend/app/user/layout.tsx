"use client";

import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import UserSidebar from "../../components/user/UserSidebar";
import UserHeader from "../../components/user/UserHeader";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { dark } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <main className={`app-shell ${dark ? "dark" : ""}`}>
      <UserSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="dash-page">
        <UserHeader onMenuClick={() => setMobileOpen(!mobileOpen)} />
        {children}
      </div>
    </main>
  );
}
