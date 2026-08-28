"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "../context/ThemeContext";
import { useAppContext } from "../context/AppContext";
import UserSidebar from "../../components/user/UserSidebar";
import UserHeader from "../../components/user/UserHeader";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { dark } = useTheme();
  const { user, role, isHydrating } = useAppContext();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isHydrating) {
      if (user && role === "pharmacy") {
        router.replace("/shopkeeper/dashboard");
      }
    }
  }, [user, role, isHydrating, router]);

  // If logged in as pharmacy, show blank or transition while redirecting
  if (!isHydrating && user && role === "pharmacy") {
    return null;
  }

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
