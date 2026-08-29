"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  FileText,
  Lock,
  Mail,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAppContext } from "../context/AppContext";

export default function Register() {
  const { dark, toggleTheme } = useTheme();
  const { registerUser, resendVerificationEmail } = useAppContext();
  const router = useRouter();
  const [role, setRole] = useState<"patient" | "pharmacy">("patient");

  // Form fields
  const [name, setName] = useState("");
  const [phoneOrOwner, setPhoneOrOwner] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [medicalLicense, setMedicalLicense] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Cooldown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!agreedToTerms) {
      setError("Please agree to MediMall's Terms of Service and Privacy Policy to continue.");
      return;
    }

    setLoading(true);
    try {
      await registerUser(
        {
          name,
          phone: role === "patient" ? phoneOrOwner : "",
          email,
          address: role === "patient" ? undefined : "Shop Address, Bengaluru",
          medical_license: role === "pharmacy" ? medicalLicense : undefined,
        },
        role,
        password
      );
      setRegisteredSuccess(true);
      setCooldownSeconds(60);
    } catch (err: any) {
      console.error("Registration failed:", err);
      setError(err?.message || "Registration failed. Please check your information.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldownSeconds > 0) return;
    setResending(true);
    setResendStatus(null);
    try {
      await resendVerificationEmail(email);
      setResendStatus("A fresh verification email has been sent! Check your inbox & spam folder.");
      setCooldownSeconds(60);
    } catch (err: any) {
      const msg = err?.message || "Failed to resend email.";
      setResendStatus(msg);
      const match = msg.match(/(\d+)\s*seconds/i);
      if (match && match[1]) {
        setCooldownSeconds(parseInt(match[1], 10));
      } else if (msg.toLowerCase().includes("wait") || msg.toLowerCase().includes("too many requests")) {
        setCooldownSeconds(60);
      }
    } finally {
      setResending(false);
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

      {registeredSuccess ? (
        <section className="auth-card" style={{ maxWidth: "480px", textAlign: "center", padding: "36px 32px" }}>
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
            ACCOUNT CREATED
          </p>
          <h1 style={{ fontSize: "22px", margin: "0 0 12px", color: dark ? "#fff" : "#16342e" }}>
            Please verify your email
          </h1>
          <p style={{ fontSize: "14px", color: dark ? "#a6c7bb" : "#637a70", lineHeight: 1.6, marginBottom: "24px" }}>
            Account created successfully! We have sent a verification link to <strong>{email}</strong>. Please check your inbox and click the link within 24 hours to activate all account capabilities.
          </p>

          {resendStatus && (
            <div
              style={{
                background: "#f6ffed",
                border: "1px solid #b7eb8f",
                borderRadius: "8px",
                padding: "10px 14px",
                color: "#389e0d",
                fontSize: "13px",
                marginBottom: "16px",
              }}
            >
              {resendStatus}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <button
              className="auth-submit"
              onClick={() => router.push(role === "patient" ? "/user/dashboard" : "/shopkeeper/dashboard")}
              style={{ width: "100%" }}
            >
              Continue to Dashboard <ArrowRight size={17} />
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldownSeconds > 0}
              style={{
                background: "none",
                border: "none",
                color: "#227f5e",
                fontWeight: 600,
                fontSize: "13px",
                cursor: cooldownSeconds > 0 ? "not-allowed" : "pointer",
                opacity: cooldownSeconds > 0 ? 0.65 : 1,
                padding: "8px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <RefreshCw size={14} className={resending ? "spin" : ""} />
              {resending
                ? "Resending..."
                : cooldownSeconds > 0
                ? `Resend link in ${cooldownSeconds}s`
                : "Didn't get the email? Resend link"}
            </button>
          </div>
          
          <p style={{ margin: "16px 0 0", fontSize: "12px", color: dark ? "#8fa89e" : "#71897d" }}>
            💡 Tip: Please check your <strong>Spam</strong>, <strong>Junk</strong>, or <strong>Promotions</strong> folder.
          </p>
        </section>
      ) : (
        <section className="auth-card register-card">
          <a href="/login" className="auth-back">
            <ChevronLeft size={16} />Back to sign in
          </a>
          <div className="auth-intro">
            <p>CREATE YOUR ACCOUNT</p>
            <h1>Let&apos;s get you started.</h1>
            <h2>Choose an account type to personalize your experience.</h2>
          </div>
          <div className="role-switch">
            <button
              type="button"
              className={role === "patient" ? "chosen" : ""}
              onClick={() => setRole("patient")}
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
              className={role === "pharmacy" ? "chosen" : ""}
              onClick={() => setRole("pharmacy")}
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

          <form onSubmit={submit}>
            <div className="form-row">
              <label>
                {role === "patient" ? "Full name" : "Pharmacy name"}
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === "patient" ? "Your full name" : "Name of your pharmacy"}
                />
              </label>
              <label>
                {role === "patient" ? "Mobile number" : "Pharmacist in-charge"}
                <input
                  required
                  type="text"
                  value={phoneOrOwner}
                  onChange={(e) => setPhoneOrOwner(e.target.value)}
                  placeholder={role === "patient" ? "10-digit phone" : "Pharmacist full name"}
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                Email address
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </label>
              <label>
                Create password
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                />
              </label>
            </div>

            {role === "pharmacy" && (
              <label>
                Drug License Number (DL No.)
                <input
                  required
                  type="text"
                  value={medicalLicense}
                  onChange={(e) => setMedicalLicense(e.target.value)}
                  placeholder="e.g. DL-KA-BNG-2025-0042"
                />
              </label>
            )}

            <div className="auth-options">
              <label style={{ cursor: "pointer", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  style={{ marginTop: "3px" }}
                />
                <span style={{ fontSize: "12px", lineHeight: "1.4" }}>
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowTermsModal(true);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      color: "#227f5e",
                      textDecoration: "underline",
                      cursor: "pointer",
                      font: "inherit",
                    }}
                  >
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowTermsModal(true);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      color: "#227f5e",
                      textDecoration: "underline",
                      cursor: "pointer",
                      font: "inherit",
                    }}
                  >
                    Privacy Policy
                  </button>
                  .
                </span>
              </label>
            </div>

            <button className="auth-submit" disabled={loading} type="submit">
              {loading ? "Creating account..." : "Create account"} <ArrowRight size={17} />
            </button>
          </form>

          <p className="auth-foot">
            Already have a MediMall account? <a href="/login">Sign in here</a>
          </p>
        </section>
      )}

      {showTermsModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxHeight: "80vh", overflowY: "auto", maxWidth: "600px", padding: "24px", borderRadius: "16px", background: dark ? "#153830" : "#ffffff", color: dark ? "#ffffff" : "#16342e" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #dbe6df", paddingBottom: "12px" }}>
              <h2 style={{ fontSize: "18px", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <FileText size={20} color="#227f5e" /> MediMall Terms &amp; Privacy
              </h2>
              <button onClick={() => setShowTermsModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ fontSize: "13px", lineHeight: "1.6", color: dark ? "#a6c7bb" : "#4e6a5f" }}>
              <p>Welcome to MediMall. By creating an account, you agree to comply with healthcare and medicine delivery guidelines in India.</p>
              <h3 style={{ fontSize: "14px", color: dark ? "#ffffff" : "#16342e", marginTop: "12px" }}>1. Prescriptions</h3>
              <p>Prescription drugs (Rx) will strictly require verification by our registered partner pharmacists prior to dispatch.</p>
              <h3 style={{ fontSize: "14px", color: dark ? "#ffffff" : "#16342e", marginTop: "12px" }}>2. Data Privacy</h3>
              <p>Your health data, address, and uploaded prescriptions are encrypted and never shared with third parties.</p>
            </div>

            <button
              type="button"
              className="auth-submit"
              onClick={() => {
                setAgreedToTerms(true);
                setShowTermsModal(false);
              }}
              style={{ marginTop: "20px", width: "100%" }}
            >
              I Understand &amp; Agree
            </button>
          </div>
        </div>
      )}

      <footer>
        <ShieldCheck size={16} />Your health information is private and protected.
      </footer>
    </main>
  );
}
