"use client";

import { useRouter, usePathname } from "next/navigation";
import { Home, ShoppingBag, FileText, HeartPulse, CreditCard, HelpCircle, Settings, LogOut } from "lucide-react";

interface UserSidebarProps {
  mobileOpen: boolean;
  onClose?: () => void;
}

const navItems = [
  { icon: Home, label: "Overview", href: "/user/dashboard" },
  { icon: ShoppingBag, label: "My orders", href: "/user/orders" },
  { icon: FileText, label: "Prescriptions", href: "/user/prescriptions" },
  { icon: HeartPulse, label: "Health profile", href: "/user/profile" },
  { icon: CreditCard, label: "Payments", href: "/user/payments" },
];

export default function UserSidebar({ mobileOpen, onClose }: UserSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <aside className={`sidebar ${mobileOpen ? "show" : ""}`}>
      <a className="brand" href="/" onClick={(e) => { e.preventDefault(); router.push("/"); if (onClose) onClose(); }}>
        <span className="brand-mark"><i>M</i><i>M</i></span>Medi<span>Mall</span>
      </a>
      <div className="side-section">
        <span>MENU</span>
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <button
              key={item.label}
              className={active ? "side-active" : ""}
              onClick={() => {
                router.push(item.href);
                if (onClose) onClose();
              }}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="side-section bottom">
        <span>SUPPORT</span>
        <button><HelpCircle size={18} />Help centre</button>
        <button><Settings size={18} />Settings</button>
        <button className="signout" onClick={() => router.push("/")}><LogOut size={18} />Sign out</button>
      </div>
    </aside>
  );
}
