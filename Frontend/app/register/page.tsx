"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Check, ChevronLeft, Moon, ShieldCheck, Sun, UserRound } from "lucide-react";
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

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await registerUser(
      {
        name,
        phone: role === "patient" ? phoneOrOwner : "",
        email,
        address: role === "patient" ? undefined : "Shop Address, Bengaluru",
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
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === "patient" ? "Your full name" : "Name of your pharmacy"}
              />
            </label>
            <label>
              {role === "patient" ? "Mobile number" : "Owner name"}
              <input
                required
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
            <input required type="checkbox" />I agree to MediMall&apos;s terms and privacy policy.
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
    </main>
  );
}

