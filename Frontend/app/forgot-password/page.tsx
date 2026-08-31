"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  KeyRound,
  Mail,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { api } from "../../lib/api";

export default function ForgotPasswordPage() {
  const { dark, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownSeconds > 0) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    try {
      const res = await api.auth.forgotPassword(cleanEmail);
      setSuccessMessage(
        res.message ||
          `A password reset link has been dispatched to ${cleanEmail}. Please check your inbox and spam folder.`
      );
      setCooldownSeconds(60);
    } catch (err: any) {
      const msg = err?.message || "Failed to send password reset email. Please try again.";
      setErrorMessage(msg);
      const match = msg.match(/(\d+)\s*seconds/i);
      if (match && match[1]) {
        setCooldownSeconds(parseInt(match[1], 10));
      } else if (msg.toLowerCase().includes("wait") || msg.toLowerCase().includes("too many requests")) {
        setCooldownSeconds(60);
      }
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
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      <section className="auth-card" style={{ maxWidth: "480px", textAlign: "center", padding: "36px 32px" }}>
        <a href="/login" className="auth-back" style={{ textAlign: "left", display: "inline-flex", marginBottom: "16px" }}>
          <ChevronLeft size={16} /> Back to sign in
        </a>

        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: dark ? "#1e4a3f" : "#e2f4eb",
            color: "#227f5e",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 16px",
          }}
        >
          <KeyRound size={28} />
        </div>

        <p style={{ letterSpacing: "1px", textTransform: "uppercase", fontSize: "11px", fontWeight: 700, color: "#227f5e", margin: "0 0 6px" }}>
          ACCOUNT RECOVERY
        </p>
        <h1 style={{ fontSize: "22px", margin: "0 0 10px", color: dark ? "#fff" : "#16342e" }}>
          Forgot your password?
        </h1>
        <p style={{ fontSize: "14px", color: dark ? "#a6c7bb" : "#637a70", lineHeight: 1.5, marginBottom: "24px" }}>
          Enter the email address registered with your MediMall account, and we&apos;ll send you a secure link to reset your password.
        </p>

        {successMessage && (
          <div
            style={{
              background: "#f6ffed",
              border: "1px solid #b7eb8f",
              borderRadius: "8px",
              padding: "12px 14px",
              color: "#389e0d",
              fontSize: "13px",
              marginBottom: "18px",
              textAlign: "left",
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              background: "#fff1f0",
              border: "1px solid #ffa39e",
              borderRadius: "8px",
              padding: "12px 14px",
              color: "#cf1322",
              fontSize: "13px",
              marginBottom: "18px",
              textAlign: "left",
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: dark ? "#a6c7bb" : "#2d4d42", display: "block", marginBottom: "6px" }}>
            Registered email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="you@example.com"
            required
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: "8px",
              border: "1px solid #dbe6df",
              background: dark ? "#153830" : "#fff",
              color: dark ? "#fff" : "#16342e",
              fontSize: "14px",
              marginBottom: "16px",
              boxSizing: "border-box",
            }}
          />

          <button
            className="auth-submit"
            disabled={loading || cooldownSeconds > 0}
            type="submit"
            style={{ width: "100%", opacity: cooldownSeconds > 0 ? 0.7 : 1 }}
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="spin" /> Sending reset link...
              </>
            ) : cooldownSeconds > 0 ? (
              `Please wait (${cooldownSeconds}s)`
            ) : (
              <>
                <Mail size={16} /> Send Password Reset Link <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div
          style={{
            background: dark ? "#112e27" : "#f0f8f4",
            border: "1px solid #cce8db",
            borderRadius: "8px",
            padding: "10px 12px",
            fontSize: "12px",
            color: dark ? "#a3c8bc" : "#436859",
            textAlign: "left",
            marginTop: "20px",
          }}
        >
          💡 <strong>Can&apos;t find the email?</strong> Please check your <strong>Spam</strong>, <strong>Junk</strong>, or <strong>Promotions</strong> folder.
        </div>

        <p className="auth-foot" style={{ marginTop: "24px" }}>
          Remembered your password? <a href="/login">Sign in</a>
        </p>
      </section>

      <footer>
        <ShieldCheck size={16} /> Your account security and health information are private and protected.
      </footer>
    </main>
  );
}
