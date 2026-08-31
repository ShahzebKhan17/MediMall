"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  HelpCircle,
  Home,
  Info,
  Loader2,
  Mail,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAppContext } from "../context/AppContext";
import { api } from "../../lib/api";

function VerifyEmailContent() {
  const { dark, toggleTheme } = useTheme();
  const { user, role } = useAppContext();
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "already_verified" | "expired" | "error">(
    token ? "loading" : user?.is_email_verified ? "already_verified" : "error"
  );
  const [message, setMessage] = useState<string>("");
  const [emailInput, setEmailInput] = useState<string>(user?.email || "");
  const [resending, setResending] = useState<boolean>(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  // Sync user's email if available
  useEffect(() => {
    if (user?.email && !emailInput) {
      setEmailInput(user.email);
    }
    if (!token && user?.is_email_verified) {
      setStatus("already_verified");
    }
  }, [user, token]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Perform token verification on mount
  useEffect(() => {
    if (!token) {
      if (user?.is_email_verified) {
        setStatus("already_verified");
      } else {
        setStatus("error");
        setMessage("No verification token was provided in the link.");
      }
      return;
    }

    let isMounted = true;

    async function performVerification() {
      try {
        const res = await api.auth.verifyEmail(token as string);
        if (isMounted) {
          if (res.message?.toLowerCase().includes("already verified")) {
            setStatus("already_verified");
            setMessage(res.message);
          } else {
            setStatus("success");
            setMessage(res.message || "Your email address has been verified successfully!");
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        const errMsg: string = err?.message || "Verification failed.";
        if (errMsg.toLowerCase().includes("expired")) {
          setStatus("expired");
          setMessage("This verification link has expired (validity is 24 hours).");
        } else if (errMsg.toLowerCase().includes("already verified")) {
          setStatus("already_verified");
          setMessage("Your email address is already verified.");
        } else {
          setStatus("error");
          setMessage(errMsg);
        }
      }
    }

    performVerification();

    return () => {
      isMounted = false;
    };
  }, [token, user]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownSeconds > 0) return;

    setResendError(null);
    setResendSuccess(null);

    const rawTarget = emailInput.trim() || user?.email || "";
    const targetEmail = rawTarget.trim().toLowerCase();
    if (!targetEmail) {
      setResendError("Please enter your registered email address.");
      return;
    }

    setResending(true);
    try {
      const res = await api.auth.resendVerification(targetEmail);
      if (res.already_verified || res.status === "already_verified" || res.message?.toLowerCase().includes("already verified")) {
        setStatus("already_verified");
        setMessage(res.message || `The email address ${targetEmail} is already verified.`);
        setResendSuccess(null);
      } else {
        setResendSuccess(res.message || `A fresh verification link has been sent to ${targetEmail}.`);
        setCooldownSeconds(60);
      }
    } catch (err: any) {
      const errMsg = err?.message || "Failed to resend verification link. Please check your email.";
      if (errMsg.toLowerCase().includes("already verified")) {
        setStatus("already_verified");
        setMessage(`The email address ${targetEmail} is already verified.`);
      } else {
        setResendError(errMsg);
        // If 429 rate limited, extract remaining seconds if present or set 60s
        const match = errMsg.match(/(\d+)\s*seconds/i);
        if (match && match[1]) {
          setCooldownSeconds(parseInt(match[1], 10));
        } else if (errMsg.toLowerCase().includes("wait") || errMsg.toLowerCase().includes("too many requests")) {
          setCooldownSeconds(60);
        }
      }
    } finally {
      setResending(false);
    }
  };

  const getDashboardPath = () => {
    if (role === "pharmacy" || user?.role === "pharmacy") return "/shopkeeper/dashboard";
    return "/user/dashboard";
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

      <section className="auth-card" style={{ maxWidth: "500px", textAlign: "center", padding: "36px 32px" }}>
        
        {/* State: LOADING */}
        {status === "loading" && (
          <div>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: dark ? "#1e4a3f" : "#e2f4eb",
                color: "#227f5e",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 20px",
              }}
            >
              <Loader2 size={32} className="spin" />
            </div>
            <p style={{ letterSpacing: "1px", textTransform: "uppercase", fontSize: "11px", fontWeight: 700, color: "#227f5e", margin: "0 0 8px" }}>
              EMAIL VERIFICATION
            </p>
            <h1 style={{ fontSize: "22px", margin: "0 0 10px", color: dark ? "#fff" : "#16342e" }}>
              Verifying your email...
            </h1>
            <p style={{ fontSize: "14px", color: dark ? "#a6c7bb" : "#637a70", lineHeight: 1.5, margin: 0 }}>
              Please wait a moment while we validate your secure verification token with the MediMall network.
            </p>
          </div>
        )}

        {/* State: SUCCESS */}
        {status === "success" && (
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
              VERIFICATION COMPLETE
            </p>
            <h1 style={{ fontSize: "22px", margin: "0 0 10px", color: dark ? "#fff" : "#16342e" }}>
              Email Verified Successfully!
            </h1>
            <p style={{ fontSize: "14px", color: dark ? "#a6c7bb" : "#637a70", lineHeight: 1.5, marginBottom: "28px" }}>
              {message || "Your email address has been verified successfully."} Your account is now active to place medicine orders, manage prescriptions, and receive fast deliveries.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                className="auth-submit"
                onClick={() => router.push(user ? getDashboardPath() : "/login")}
                style={{ width: "100%" }}
              >
                {user ? "Continue to Dashboard" : "Sign In to Your Account"} <ArrowRight size={17} />
              </button>
              <a
                href="/"
                style={{
                  fontSize: "13px",
                  color: dark ? "#a6c7bb" : "#637a70",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "8px",
                }}
              >
                <Home size={14} /> Back to Homepage
              </a>
            </div>
          </div>
        )}

        {/* State: ALREADY VERIFIED */}
        {status === "already_verified" && (
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
              ACCOUNT ACTIVE
            </p>
            <h1 style={{ fontSize: "22px", margin: "0 0 10px", color: dark ? "#fff" : "#16342e" }}>
              Email Already Verified
            </h1>
            <p style={{ fontSize: "14px", color: dark ? "#a6c7bb" : "#637a70", lineHeight: 1.5, marginBottom: "24px" }}>
              {message || "This email address is already verified. Email verification is a one-time process and your account is in good standing."}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                className="auth-submit"
                onClick={() => router.push(user ? getDashboardPath() : "/login")}
                style={{ width: "100%" }}
              >
                {user ? "Go to My Dashboard" : "Sign In to MediMall"} <ArrowRight size={17} />
              </button>
              <a
                href="/"
                style={{
                  fontSize: "13px",
                  color: dark ? "#a6c7bb" : "#637a70",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "8px",
                }}
              >
                <Home size={14} /> Back to Homepage
              </a>
            </div>
          </div>
        )}

        {/* State: EXPIRED */}
        {status === "expired" && (
          <div>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "#fef3c7",
                color: "#d97706",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 20px",
              }}
            >
              <Clock size={32} />
            </div>
            <p style={{ letterSpacing: "1px", textTransform: "uppercase", fontSize: "11px", fontWeight: 700, color: "#d97706", margin: "0 0 8px" }}>
              LINK EXPIRED
            </p>
            <h1 style={{ fontSize: "22px", margin: "0 0 10px", color: dark ? "#fff" : "#16342e" }}>
              Verification Link Expired
            </h1>
            <p style={{ fontSize: "14px", color: dark ? "#a6c7bb" : "#637a70", lineHeight: 1.5, marginBottom: "20px" }}>
              {message} Security tokens expire 24 hours after generation. You can request a fresh verification link below.
            </p>

            {resendSuccess && (
              <div
                style={{
                  background: "#f6ffed",
                  border: "1px solid #b7eb8f",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  color: "#389e0d",
                  fontSize: "13px",
                  marginBottom: "16px",
                  textAlign: "left",
                }}
              >
                ✓ {resendSuccess}
              </div>
            )}

            {resendError && (
              <div
                style={{
                  background: "#fff1f0",
                  border: "1px solid #ffa39e",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  color: "#cf1322",
                  fontSize: "13px",
                  marginBottom: "16px",
                  textAlign: "left",
                }}
              >
                ⚠ {resendError}
              </div>
            )}

            <form onSubmit={handleResend} style={{ textAlign: "left", marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", color: dark ? "#a6c7bb" : "#4e6a5f", display: "block", marginBottom: "6px" }}>
                Registered Email Address
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@example.com"
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #dbe6df",
                  background: dark ? "#153830" : "#fff",
                  color: dark ? "#fff" : "#16342e",
                  fontSize: "13px",
                  marginBottom: "12px",
                  boxSizing: "border-box",
                }}
              />
              <button
                className="auth-submit"
                disabled={resending || cooldownSeconds > 0}
                type="submit"
                style={{ width: "100%", opacity: cooldownSeconds > 0 ? 0.7 : 1 }}
              >
                <Mail size={16} />{" "}
                {resending
                  ? "Sending New Link..."
                  : cooldownSeconds > 0
                  ? `Wait ${cooldownSeconds}s before resending`
                  : "Resend Verification Email"}
              </button>
            </form>

            {/* Helpful Inbox Tip */}
            <div
              style={{
                background: dark ? "#112e27" : "#f0f8f4",
                border: "1px solid #cce8db",
                borderRadius: "8px",
                padding: "10px 12px",
                fontSize: "12px",
                color: dark ? "#a3c8bc" : "#436859",
                textAlign: "left",
                marginBottom: "16px",
              }}
            >
              💡 <strong>Can&apos;t find the email?</strong> Please check your <strong>Spam</strong>, <strong>Junk</strong>, or <strong>Promotions</strong> folder.
            </div>

            <a
              href="/login"
              style={{
                fontSize: "13px",
                color: "#227f5e",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              ← Back to Sign in
            </a>
          </div>
        )}

        {/* State: ERROR */}
        {status === "error" && (
          <div>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "#fff1f0",
                color: "#cf1322",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 20px",
              }}
            >
              <AlertCircle size={36} color="#cf1322" />
            </div>
            <p style={{ letterSpacing: "1px", textTransform: "uppercase", fontSize: "11px", fontWeight: 700, color: "#cf1322", margin: "0 0 8px" }}>
              VERIFICATION NOTICE
            </p>
            <h1 style={{ fontSize: "22px", margin: "0 0 10px", color: dark ? "#fff" : "#16342e" }}>
              {message?.includes("No verification token") ? "Verify Your Email Address" : "Invalid Verification Link"}
            </h1>
            <p style={{ fontSize: "14px", color: dark ? "#a6c7bb" : "#637a70", lineHeight: 1.5, marginBottom: "20px" }}>
              {message || "The verification token is invalid or has already been used."}
            </p>

            {resendSuccess && (
              <div
                style={{
                  background: "#f6ffed",
                  border: "1px solid #b7eb8f",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  color: "#389e0d",
                  fontSize: "13px",
                  marginBottom: "16px",
                  textAlign: "left",
                }}
              >
                ✓ {resendSuccess}
              </div>
            )}

            {resendError && (
              <div
                style={{
                  background: "#fff1f0",
                  border: "1px solid #ffa39e",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  color: "#cf1322",
                  fontSize: "13px",
                  marginBottom: "16px",
                  textAlign: "left",
                }}
              >
                ⚠ {resendError}
              </div>
            )}

            <form onSubmit={handleResend} style={{ textAlign: "left", marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", color: dark ? "#a6c7bb" : "#4e6a5f", display: "block", marginBottom: "6px" }}>
                Request link for your email
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter your registered email"
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #dbe6df",
                  background: dark ? "#153830" : "#fff",
                  color: dark ? "#fff" : "#16342e",
                  fontSize: "13px",
                  marginBottom: "12px",
                  boxSizing: "border-box",
                }}
              />
              <button
                className="auth-submit"
                disabled={resending || cooldownSeconds > 0}
                type="submit"
                style={{ width: "100%", opacity: cooldownSeconds > 0 ? 0.7 : 1 }}
              >
                <RefreshCw size={16} className={resending ? "spin" : ""} />{" "}
                {resending
                  ? "Sending..."
                  : cooldownSeconds > 0
                  ? `Please wait (${cooldownSeconds}s)`
                  : "Request Verification Email"}
              </button>
            </form>

            {/* Helpful Inbox Tip */}
            <div
              style={{
                background: dark ? "#112e27" : "#f0f8f4",
                border: "1px solid #cce8db",
                borderRadius: "8px",
                padding: "10px 12px",
                fontSize: "12px",
                color: dark ? "#a3c8bc" : "#436859",
                textAlign: "left",
                marginBottom: "16px",
              }}
            >
              💡 <strong>Email not showing in Inbox?</strong> Automated emails often arrive in your <strong>Spam</strong>, <strong>Junk</strong>, or <strong>Promotions</strong> folder.
            </div>

            <a
              href="/login"
              style={{
                fontSize: "13px",
                color: "#227f5e",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              ← Back to Sign in
            </a>
          </div>
        )}

      </section>

      <footer>
        <ShieldCheck size={16} /> Your account security and health information are private and protected.
      </footer>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", background: "#f4faf6" }}>
          <Loader2 size={36} color="#227f5e" className="spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
