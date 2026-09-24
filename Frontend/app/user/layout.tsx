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
      if (!user) {
        router.replace("/login");
      } else if (user && role === "pharmacy") {
        router.replace("/shopkeeper/dashboard");
      }
    }
  }, [user, role, isHydrating, router]);

  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        const storedUser = typeof window !== "undefined" ? localStorage.getItem("medimall_user") : null;
        if (!storedUser) {
          window.location.replace("/login");
        }
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  // If unauthenticated or wrong role, show nothing while redirecting
  if (!isHydrating && (!user || role === "pharmacy")) {
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
