"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../app/context/ThemeContext";

export default function ThemeToggle() {
  const { dark, toggleTheme } = useTheme();
  return (
    <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle dark mode">
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
