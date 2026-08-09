"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Check, ChevronLeft, LockKeyhole, Mail, Moon, ShieldCheck, Sun, UserRound } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAppContext } from "../context/AppContext";

export default function LoginPage() {
  const { dark, toggleTheme } = useTheme();
  const { login } = useAppContext();
  const router = useRouter();
  const [role, setRole] = useState<"user" | "shop">("user");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const appRole = role === "user" ? "patient" : "pharmacy";
    login(email, appRole);
    router.push(role === "user" ? "/user/dashboard" : "/shopkeeper/dashboard");
  };

  return (
    <main className={`auth-page ${dark ? "dark" : ""}`}>
      <header>
        <a className="brand" href="/">
          <span className="brand-mark"><i>M</i><i>M</i></span>Medi<span>Mall</span>
        </a>
        <button className="theme-toggle" onClick={toggleTheme}>
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>
      <section className="auth-card">
        <a href="/" className="auth-back">
          <ChevronLeft size={16} />Back to home
        </a>
        <div className="auth-intro">
          <p>WELCOME TO MEDIMALL</p>
          <h1>Care, close to home.</h1>
          <h2>Sign in to order medicines or manage your pharmacy.</h2>
        </div>
        <div className="role-switch">
          <button
            type="button"
            className={role === "user" ? "chosen" : ""}
            onClick={() => setRole("user")}
          >
            <UserRound size={18} />
            <span>
              <b>For Patients</b>
              <small>Order medicines &amp; manage your health</small>
            </span>
            <Check size={15} />
          </button>
          <button
            type="button"
            className={role === "shop" ? "chosen" : ""}
            onClick={() => setRole("shop")}
          >
            <Building2 size={18} />
            <span>
              <b>For Pharmacies</b>
              <small>Manage your pharmacy &amp; fulfill orders</small>
            </span>
            <Check size={15} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <label>
            Password
            <input type="password" placeholder="Enter your password" required />
          </label>
          <div className="auth-options">
            <label>
              <input type="checkbox" /> Keep me signed in
            </label>
            <a href="#">Forgot password?</a>
          </div>
          <button className="auth-submit">
            Sign in <ArrowRight size={17} />
          </button>
        </form>
        <div className="auth-divider">
          <span>OR</span>
        </div>
        <button className="otp">
          <Mail size={17} />Continue with OTP
        </button>
        <p className="auth-foot">
          New to MediMall? <a href="/register">Create your account</a>
        </p>
      </section>
      <footer>
        <ShieldCheck size={16} />Your health information is private and protected.
      </footer>
    </main>
  );
}

