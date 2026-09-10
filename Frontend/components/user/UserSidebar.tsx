"use client";

import { useRouter, usePathname } from "next/navigation";
import { Home, ShoppingBag, FileText, HeartPulse, CreditCard, HelpCircle, Settings, LogOut, Store } from "lucide-react";
import { useAppContext } from "../../app/context/AppContext";

interface UserSidebarProps {
  mobileOpen: boolean;
  onClose?: () => void;
}

const navItems = [
  { icon: Home, label: "Overview", href: "/user/dashboard" },
  { icon: Store, label: "Pharmacies", href: "/pharmacies" },
  { icon: ShoppingBag, label: "My orders", href: "/user/orders" },
  { icon: FileText, label: "Prescriptions", href: "/user/prescriptions" },
  { icon: HeartPulse, label: "Health profile", href: "/user/profile" },
  { icon: CreditCard, label: "Payments", href: "/user/payments" },
];

import { usePwa } from "../pwa/PwaProvider";
import { Download } from "lucide-react";

export default function UserSidebar({ mobileOpen, onClose }: UserSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAppContext();
  const { isInstallable, isStandalone, installApp } = usePwa();

  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      router.push("/login");
    }
  };

  return (
    <aside className={`sidebar ${mobileOpen ? "show" : ""}`}>
      <a className="brand" href="/user/dashboard" onClick={(e) => { e.preventDefault(); router.push("/user/dashboard"); if (onClose) onClose(); }}>
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
        {isInstallable && !isStandalone && (
          <button
            onClick={installApp}
            style={{ color: "#10B981", fontWeight: 600 }}
          >
            <Download size={18} />Install App
          </button>
        )}
        <button
          className={pathname === "/user/help" ? "side-active" : ""}
          onClick={() => {
            router.push("/user/help");
            if (onClose) onClose();
          }}
        >
          <HelpCircle size={18} />Help centre
        </button>
        <button
          className={pathname === "/user/profile" ? "side-active" : ""}
          onClick={() => {
            router.push("/user/profile");
            if (onClose) onClose();
          }}
        >
          <Settings size={18} />Settings
        </button>
        <button
          className="signout"
          onClick={handleSignOut}
        >
          <LogOut size={18} />Sign out
        </button>
      </div>
    </aside>
  );
}

