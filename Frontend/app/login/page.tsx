"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Building2, Check, ChevronLeft, LockKeyhole, Mail, Moon, ShieldCheck, Sun, UserRound } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAppContext } from "../context/AppContext";

export default function LoginPage() {
  const { dark, toggleTheme } = useTheme();
  const { login } = useAppContext();
  const router = useRouter();
  const [role, setRole] = useState<"user" | "shop">("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (newRole: "user" | "shop") => {
    setRole(newRole);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const appRole = role === "user" ? "patient" : "pharmacy";
    try {
      await login(email, appRole, password);
      router.push(role === "user" ? "/user/dashboard" : "/shopkeeper/dashboard");
    } catch (err: any) {
      console.error("Login failed:", err);
      const errMsg = err?.message || "Sign in failed. Please check your credentials.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
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
            onClick={() => handleRoleChange("user")}
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
            onClick={() => handleRoleChange("shop")}
          >
            <Building2 size={18} />
            <span>
              <b>For Pharmacies</b>
              <small>Manage your pharmacy &amp; fulfill orders</small>
            </span>
            <Check size={15} />
          </button>
        </div>

        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              background: "#fff1f0",
              border: "1px solid #ffa39e",
              borderRadius: "10px",
              padding: "12px 14px",
              marginBottom: "18px",
              color: "#cf1322",
              fontSize: "13px",
              lineHeight: 1.4,
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              placeholder="you@example.com"
              required
            />
          </label>
          <label>
            Password
            <input 
              type="password" 
              value={password} 
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter your password" 
              required 
            />
          </label>
          <div className="auth-options">
            <label>
              <input type="checkbox" /> Keep me signed in
            </label>
            <a href="#">Forgot password?</a>
          </div>
          <button className="auth-submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"} <ArrowRight size={17} />
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

