"use client";

import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, FileCheck2, Package, BarChart3, Settings, UserRound, Pill, ChevronDown, LogOut } from "lucide-react";
import { useShopkeeper } from "../../app/shopkeeper/ShopkeeperContext";
import { useAppContext } from "../../app/context/AppContext";

interface ShopkeeperSidebarProps {
  mobileOpen: boolean;
  onClose?: () => void;
}

export default function ShopkeeperSidebar({ mobileOpen, onClose }: ShopkeeperSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { queue } = useShopkeeper();
  const { user, logout } = useAppContext();
  const ordersCount = queue.length;

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.push("/login");
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/shopkeeper/dashboard" },
    { icon: ShoppingBag, label: "Orders", href: "/shopkeeper/orders", badge: ordersCount },
    { icon: FileCheck2, label: "Prescription review", href: "/shopkeeper/prescriptions" },
    { icon: Package, label: "Inventory", href: "/shopkeeper/inventory" },
    { icon: BarChart3, label: "Analytics", href: "/shopkeeper/analytics" },
  ];

  return (
    <aside className={`shop-side ${mobileOpen ? "show" : ""}`}>
      <a className="brand" href="/shopkeeper/dashboard" onClick={(e) => { e.preventDefault(); router.push("/shopkeeper/dashboard"); if (onClose) onClose(); }}>
        <span className="brand-mark"><i>M</i><i>M</i></span>Medi<span>Mall</span>
      </a>
      <div className="store-profile" onClick={() => router.push("/shopkeeper/settings")} style={{ cursor: "pointer" }}>
        <span className="store-badge"><Pill size={19} /></span>
        <div>
          <b>{user?.name || "Pharmacy Portal"}</b>
          <small><i></i> Open for orders</small>
        </div>
        <ChevronDown size={14} />
      </div>

      <nav>
        <span>WORKSPACE</span>
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <button
              key={item.label}
              className={active ? "active" : ""}
              onClick={() => {
                router.push(item.href);
                if (onClose) onClose();
              }}
            >
              <item.icon size={18} />
              {item.label}
              {item.badge !== undefined && item.badge > 0 && <em>{item.badge}</em>}
            </button>
          );
        })}
      </nav>
      <nav className="side-bottom">
        <span>ACCOUNT</span>
        <button
          className={pathname === "/shopkeeper/settings" ? "active" : ""}
          onClick={() => {
            router.push("/shopkeeper/settings");
            if (onClose) onClose();
          }}
        >
          <Settings size={18} />Shop settings
        </button>
        <button
          className={pathname === "/shopkeeper/team" ? "active" : ""}
          onClick={() => {
            router.push("/shopkeeper/team");
            if (onClose) onClose();
          }}
        >
          <UserRound size={18} />Team members
        </button>
        <button
          onClick={handleLogout}
          style={{ color: "#e05646" }}
        >
          <LogOut size={18} />Logout
        </button>
      </nav>
    </aside>
  );
}

