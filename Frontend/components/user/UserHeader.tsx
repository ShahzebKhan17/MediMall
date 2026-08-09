"use client";

import { Bell, ChevronDown, Menu, Search } from "lucide-react";
import ThemeToggle from "../ui/ThemeToggle";
import { useAppContext } from "../../app/context/AppContext";

interface UserHeaderProps {
  onMenuClick: () => void;
}

export default function UserHeader({ onMenuClick }: UserHeaderProps) {
  const { user } = useAppContext();
  const initials = user ? user.name.split(" ").map(n => n[0]).join("") : "US";

  return (
    <header className="dash-header">
      <button className="dash-menu" onClick={onMenuClick}>
        <Menu />
      </button>
      <div className="dash-search">
        <Search size={18} />
        <input placeholder="Search medicines, brands, health products" />
      </div>
      <div className="dash-actions">
        <ThemeToggle />
        <button className="bell">
          <Bell size={20} />
          <i></i>
        </button>
        <button className="profile-mini" onClick={() => location.href = "/user/profile"}>
          <span>{initials}</span>
          <div>
            <b>{user?.name || "Ananya Sharma"}</b>
            <small>Member</small>
          </div>
          <ChevronDown size={15} />
        </button>
      </div>
    </header>
  );
}

