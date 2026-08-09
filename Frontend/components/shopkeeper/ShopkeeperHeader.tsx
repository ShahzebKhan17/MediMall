"use client";

import { Bell, Menu, Search } from "lucide-react";
import ThemeToggle from "../ui/ThemeToggle";

interface ShopkeeperHeaderProps {
  onMenuClick: () => void;
}

export default function ShopkeeperHeader({ onMenuClick }: ShopkeeperHeaderProps) {
  return (
    <header className="shop-header">
      <button className="shop-menu" onClick={onMenuClick}>
        <Menu />
      </button>
      <div className="shop-search">
        <Search size={18} />
        <input placeholder="Search orders, medicines or customers" />
      </div>
      <div className="shop-actions">
        <ThemeToggle />
        <button className="bell">
          <Bell size={19} />
          <i></i>
        </button>
        <span className="owner">DR</span>
      </div>
    </header>
  );
}
