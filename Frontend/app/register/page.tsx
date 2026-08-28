"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Check, ChevronLeft, Moon, ShieldCheck, Sun, UserRound, X, FileText, Lock } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAppContext } from "../context/AppContext";

export default function Register() {
  const { dark, toggleTheme } = useTheme();
  const { registerUser } = useAppContext();
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

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!agreedToTerms) {
      alert("Please agree to MediMall's Terms of Service and Privacy Policy to continue.");
      return;
    }
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
    router.push(role === "patient" ? "/user/dashboard" : "/shopkeeper/dashboard");
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
              {role === "patient" ? "Mobile number" : "Owner name"}
              <input
                required
                type={role === "patient" ? "tel" : "text"}
                value={phoneOrOwner}
                onChange={(e) => setPhoneOrOwner(e.target.value)}
                placeholder={role === "patient" ? "10-digit mobile number" : "Owner's full name"}
              />
            </label>
          </div>
          {role === "pharmacy" && (
            <label>
              Medical licence number
              <input 
                required 
                type="text"
                value={medicalLicense} 
                onChange={(e) => setMedicalLicense(e.target.value)} 
                placeholder="Enter licence number" 
              />
            </label>
          )}
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
              placeholder="At least 8 characters" 
            />
          </label>
          <label className="terms">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
            />
            <span>
              I agree to MediMall&apos;s{" "}
              <button
                type="button"
                className="terms-link-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowTermsModal(true);
                }}
              >
                terms and privacy policy
              </button>
              .
            </span>
          </label>
          <button className="auth-submit">
            Create account <ArrowRight size={17} />
          </button>
        </form>
        <p className="auth-foot">
          Already have an account? <a href="/login">Sign in</a>
        </p>
      </section>
      <footer>
        <ShieldCheck size={16} />Your health information is private and protected.
      </footer>

      {/* Terms & Privacy Policy Interactive Modal */}
      {showTermsModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowTermsModal(false)}
        >
          <div
            className="terms-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="terms-modal-header">
              <h3>
                <ShieldCheck size={20} color="#248b63" />
                MediMall Terms of Service &amp; Privacy Policy
              </h3>
              <button
                className="terms-modal-close"
                onClick={() => setShowTermsModal(false)}
                aria-label="Close modal"
              >
                <X size={19} />
              </button>
            </div>

            <div className="terms-modal-body">
              <h4>1. Acceptance of Terms</h4>
              <p>
                By creating an account on MediMall, you agree to comply with and be bound by all applicable laws, healthcare regulations, and these Terms of Service. If you are registering as a pharmacy, you warrant that you hold a valid, active retail drug license (Form 20/21).
              </p>

              <h4>2. Prescription Validation &amp; Scheduled Drugs</h4>
              <p>
                All orders containing Schedule H, H1, or X prescription medications require verification by a registered pharmacist before dispatch. Orders without valid authorized prescriptions may be cancelled or modified in accordance with applicable drug regulations.
              </p>

              <h4>3. Privacy &amp; Health Data Protection</h4>
              <p>
                Your personal health records, prescription uploads, and clinical data are encrypted in transit and at rest. MediMall adheres strictly to digital health data protection standards and will never sell or monetize your sensitive medical history.
              </p>

              <h4>4. Order Fulfillment &amp; Pharmacy Proximity Routing</h4>
              <p>
                Orders placed through MediMall are routed to licensed neighborhood partner pharmacies based on geographical proximity and stock availability to ensure rapid dispatch and optimal cold-chain preservation.
              </p>

              <h4>5. Cancellation &amp; Refund Policy</h4>
              <p>
                Orders may be cancelled before pharmacist confirmation for a full instant refund. Once medicines are dispatched or unsealed, returns are subject to safety checks in compliance with drug safety norms.
              </p>
            </div>

            <div className="terms-modal-foot">
              <button
                type="button"
                className="terms-modal-btn"
                style={{ background: "#e8edea", color: "#28483e" }}
                onClick={() => setShowTermsModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="terms-modal-btn primary"
                onClick={() => {
                  setAgreedToTerms(true);
                  setShowTermsModal(false);
                }}
              >
                I Agree &amp; Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

