"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { api } from "../../lib/api";

function ResetPasswordContent() {
  const { dark, toggleTheme } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    !token ? "No password reset token was provided in the link." : null
  );
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage("No password reset token was provided in the link. Please request a new link.");
      return;
    }

    if (newPassword.length < 4) {
      setErrorMessage("Password must be at least 4 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please ensure both fields are identical.");
      return;
    }

    setLoading(true);
    try {
      await api.auth.resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err: any) {
      const msg = err?.message || "Failed to reset password. The link may have expired or already been used.";
      setErrorMessage(msg);
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
        {success ? (
          <div>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "#e2f4eb",
                color: "#227f5e",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 20px",
              }}
            >
              <CheckCircle2 size={36} color="#227f5e" />
            </div>

            <p style={{ letterSpacing: "1px", textTransform: "uppercase", fontSize: "11px", fontWeight: 700, color: "#227f5e", margin: "0 0 8px" }}>
              PASSWORD UPDATED
            </p>
            <h1 style={{ fontSize: "22px", margin: "0 0 10px", color: dark ? "#fff" : "#16342e" }}>
              Password Reset Successful!
            </h1>
            <p style={{ fontSize: "14px", color: dark ? "#a6c7bb" : "#637a70", lineHeight: 1.5, marginBottom: "28px" }}>
              Your account password has been updated. You can now sign in with your new password.
            </p>

            <button
              className="auth-submit"
              onClick={() => router.push("/login")}
              style={{ width: "100%" }}
            >
              Proceed to Sign In <ArrowRight size={17} />
            </button>
          </div>
        ) : (
          <div>
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
              <Lock size={28} />
            </div>

            <p style={{ letterSpacing: "1px", textTransform: "uppercase", fontSize: "11px", fontWeight: 700, color: "#227f5e", margin: "0 0 6px" }}>
              CHOOSE NEW PASSWORD
            </p>
            <h1 style={{ fontSize: "22px", margin: "0 0 10px", color: dark ? "#fff" : "#16342e" }}>
              Create a new password
            </h1>
            <p style={{ fontSize: "14px", color: dark ? "#a6c7bb" : "#637a70", lineHeight: 1.5, marginBottom: "24px" }}>
              Please enter your new password below.
            </p>

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
              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: dark ? "#a6c7bb" : "#2d4d42", display: "block", marginBottom: "6px" }}>
                  New Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Enter new password (min 4 characters)"
                    required
                    style={{
                      width: "100%",
                      padding: "12px 40px 12px 14px",
                      borderRadius: "8px",
                      border: "1px solid #dbe6df",
                      background: dark ? "#153830" : "#fff",
                      color: dark ? "#fff" : "#16342e",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#82918b",
                      padding: 0,
                    }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: dark ? "#a6c7bb" : "#2d4d42", display: "block", marginBottom: "6px" }}>
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Re-enter your new password"
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: "1px solid #dbe6df",
                    background: dark ? "#153830" : "#fff",
                    color: dark ? "#fff" : "#16342e",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <button
                className="auth-submit"
                disabled={loading || !token}
                type="submit"
                style={{ width: "100%" }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="spin" /> Updating password...
                  </>
                ) : (
                  <>
                    <KeyRound size={16} /> Update Password <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <p className="auth-foot" style={{ marginTop: "24px" }}>
              Remember your password? <a href="/login">Sign in</a>
            </p>
          </div>
        )}
      </section>

      <footer>
        <ShieldCheck size={16} /> Your account security and health information are private and protected.
      </footer>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", background: "#f4faf6" }}>
          <Loader2 size={36} color="#227f5e" className="spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
