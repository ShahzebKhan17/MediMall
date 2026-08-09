"use client";

import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, FileCheck2, Package, BarChart3, Settings, UserRound, Pill, ChevronDown } from "lucide-react";
import { useShopkeeper } from "../../app/shopkeeper/ShopkeeperContext";

interface ShopkeeperSidebarProps {
  mobileOpen: boolean;
  onClose?: () => void;
}

export default function ShopkeeperSidebar({ mobileOpen, onClose }: ShopkeeperSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { queue } = useShopkeeper();
  const ordersCount = queue.length;


  const navItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/shopkeeper/dashboard" },
    { icon: ShoppingBag, label: "Orders", href: "/shopkeeper/orders", badge: ordersCount },
    { icon: FileCheck2, label: "Prescription review", href: "/shopkeeper/prescriptions" },
    { icon: Package, label: "Inventory", href: "/shopkeeper/inventory" },
    { icon: BarChart3, label: "Analytics", href: "/shopkeeper/analytics" },
  ];

  return (
    <aside className={`shop-side ${mobileOpen ? "show" : ""}`}>
      <a className="brand" href="/" onClick={(e) => { e.preventDefault(); router.push("/"); if (onClose) onClose(); }}>
        <span className="brand-mark"><i>M</i><i>M</i></span>Medi<span>Mall</span>
      </a>
      <div className="store-profile">
        <span className="store-badge"><Pill size={19} /></span>
        <div>
          <b>Care & Cure</b>
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
        <button><Settings size={18} />Shop settings</button>
        <button><UserRound size={18} />Team members</button>
      </nav>
    </aside>
  );
}
