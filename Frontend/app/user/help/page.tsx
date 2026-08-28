"use client";

import { useState } from "react";
import { HelpCircle, Phone, MessageSquare, Mail, ChevronDown, ChevronUp, ShieldCheck, Clock, FileText, Package } from "lucide-react";
import { useAppContext } from "../../context/AppContext";

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    category: "Orders & Delivery",
    question: "How fast is MediMall hyperlocal medicine delivery?",
    answer: "Orders are routed to your nearest licensed partner pharmacy within 0.8 km. Most standard deliveries arrive in 8 to 15 minutes by verified couriers.",
  },
  {
    category: "Prescriptions & Safety",
    question: "How does pharmacist prescription verification work?",
    answer: "When you upload a prescription or order prescription (Rx) medicines, a licensed pharmacist reviews the dosage, validity, and doctor's seal before the medicine is packed and released for dispatch.",
  },
  {
    category: "Payments & Refunds",
    question: "What payment methods are supported?",
    answer: "We support instant UPI (Google Pay, PhonePe, Paytm), credit/debit cards via secure payment gateways, and Pay on Delivery (Cash or UPI at your doorstep).",
  },
  {
    category: "Payments & Refunds",
    question: "What if a medicine is damaged or out of stock?",
    answer: "If an item is unavailable, the pharmacist will contact you to suggest an identical generic equivalent with matching salt composition, or initiate an instant full refund.",
  },
  {
    category: "AI Doctor & MediAssist",
    question: "Is the AI Symptom Checker / MediAssist safe to use?",
    answer: "MediAssist is an AI triage tool built on certified clinical models. It provides medical guidance and OTC suggestions, but is always verified by a human pharmacist before dispensing.",
  },
];

export default function PatientHelpCenterPage() {
  const { user } = useAppContext();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim()) return;
    setSubmitted(true);
    setContactMessage("");
    setContactSubject("");
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <section className="dash-content">
      <div className="welcome">
        <div>
          <p>CUSTOMER CARE & SUPPORT</p>
          <h1>Help Centre</h1>
          <h2>Get 24/7 assistance with your medicine orders, prescriptions, and payments.</h2>
        </div>
      </div>

      {/* Support Channels Banner */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginTop: "24px" }}>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "14px", padding: "18px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#e2f4eb", color: "#227f5e", display: "grid", placeItems: "center" }}>
            <Phone size={20} />
          </div>
          <div>
            <b style={{ fontSize: "14px", display: "block" }}>Pharmacist Helpline</b>
            <span style={{ fontSize: "12px", color: "#227f5e", fontWeight: 600 }}>+91 80 4123 4567</span>
            <small style={{ display: "block", color: "#82918b", fontSize: "10px" }}>Toll-free 24/7 emergency</small>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: "14px", padding: "18px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#e0f2fe", color: "#0284c7", display: "grid", placeItems: "center" }}>
            <MessageSquare size={20} />
          </div>
          <div>
            <b style={{ fontSize: "14px", display: "block" }}>WhatsApp Support</b>
            <span style={{ fontSize: "12px", color: "#0284c7", fontWeight: 600 }}>Chat with Pharmacist</span>
            <small style={{ display: "block", color: "#82918b", fontSize: "10px" }}>Average reply: 2 mins</small>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: "14px", padding: "18px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#fef3c7", color: "#d97706", display: "grid", placeItems: "center" }}>
            <Mail size={20} />
          </div>
          <div>
            <b style={{ fontSize: "14px", display: "block" }}>Email Medical Desk</b>
            <span style={{ fontSize: "12px", color: "#d97706", fontWeight: 600 }}>support@medimall.in</span>
            <small style={{ display: "block", color: "#82918b", fontSize: "10px" }}>Resolution within 4 hrs</small>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px", marginTop: "24px" }}>
        {/* Left: FAQs Accordion */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <HelpCircle size={20} color="#227f5e" />
            <h3 style={{ margin: 0, fontSize: "16px" }}>Frequently Asked Questions</h3>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  style={{
                    border: "1px solid #edf1ee",
                    borderRadius: "8px",
                    overflow: "hidden",
                    transition: "all 0.2s ease",
                  }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      background: isOpen ? "#f7faf8" : "#ffffff",
                      border: 0,
                      textAlign: "left",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#16342e",
                      cursor: "pointer",
                    }}
                  >
                    <span>{faq.question}</span>
                    {isOpen ? <ChevronUp size={16} color="#227f5e" /> : <ChevronDown size={16} color="#82918b" />}
                  </button>
                  {isOpen && (
                    <div style={{ padding: "12px 16px", background: "#ffffff", fontSize: "12px", color: "#546e63", lineHeight: 1.6, borderTop: "1px solid #edf1ee" }}>
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Contact Form */}
        <div className="card">
          <h3 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>Send us a message</h3>
          <p style={{ margin: "0 0 16px 0", fontSize: "12px", color: "#666" }}>
            Our healthcare operations desk will respond to your registered email immediately.
          </p>

          {submitted && (
            <div
              style={{
                background: "#e2f4eb",
                border: "1px solid #95d5b2",
                color: "#1b4d3e",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "14px",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <ShieldCheck size={16} /> Thank you! Your support ticket #MED-{Date.now().toString().slice(-4)} has been logged.
            </div>
          )}

          <form onSubmit={handleSubmitTicket} style={{ display: "grid", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>Issue Category</label>
              <select
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1ded7", fontSize: "13px", background: "#fff" }}
                value={contactSubject}
                onChange={(e) => setContactSubject(e.target.value)}
                required
              >
                <option value="">Select an option</option>
                <option value="Live Order Status">Live Order Delay / Tracking</option>
                <option value="Prescription Verification">Prescription Verification Query</option>
                <option value="Billing & Refund">Refund or Payment Receipt</option>
                <option value="Medicine Availability">Medicine Stock Request</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>How can we help?</label>
              <textarea
                rows={4}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1ded7", fontSize: "13px", resize: "vertical" }}
                placeholder="Describe your issue with order number if applicable..."
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              style={{
                background: "#227f5e",
                color: "#fff",
                border: 0,
                padding: "11px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(34, 127, 94, 0.15)",
                marginTop: "4px",
              }}
            >
              Submit Support Request
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
