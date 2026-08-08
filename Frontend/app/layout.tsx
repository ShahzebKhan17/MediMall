import type { Metadata } from "next";
import "./globals.css";
import "./cinematic.css";
import "./brand.css";
import "./theme.css";
import "./dashboard.css";
import "./order.css";

export const metadata: Metadata = { title: "MediMall — Medicine, nearby", description: "Your local pharmacy, delivered in minutes." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
