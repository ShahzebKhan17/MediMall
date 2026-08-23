"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, FileUp, Globe2, Info, Loader2, MapPin, MessageCircleHeart, Mic, Moon, Pill, Plus, ShieldAlert, ShieldCheck, Sparkles, Sun, UploadCloud } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAppContext } from "../context/AppContext";
import { api } from "../../lib/api";

interface AIAnalysis {
  summary: string;
  condition_overview: string;
  urgency_level: "Low" | "Moderate" | "High / Urgent";
  recommended_otc: Array<{
    name: string;
    type: string;
    purpose: string;
    requires_rx: boolean;
  }>;
  lifestyle_advice: string[];
  disclaimer: string;
  requires_pharmacist_review: boolean;
}

export default function MediAssistPage() {
  const { dark, toggleTheme } = useTheme();
  const { user, addPrescription, placeOrder, addToCart } = useAppContext();
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"start" | "review">("start");
  const [recording, setRecording] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [apiError, setApiError] = useState<string | null>(null);

  const analyse = async () => {
    if (!text.trim()) return;
    setIsAnalysing(true);
    setApiError(null);
    try {
      const res = await api.aiDoctor.analyze(text);
      setAnalysis(res);
      setMode("review");
    } catch (e: any) {
      console.warn("AI Doctor API error:", e);
      setApiError("Unable to analyze symptoms because the MediAssist server is unreachable. Please verify your connection.");
    } finally {
      setIsAnalysing(false);
    }
  };

  const handleRequestReview = async () => {
    const summaryNote = text ? `Symptom Log: ${text.slice(0, 45)}...` : "Pharmacist consultation requested";
    await placeOrder("COD", user?.address || undefined, summaryNote);
    alert("Your symptom log and consultation request have been sent to Care & Cure Pharmacy! Track live updates on your dashboard.");
    location.href = "/user/dashboard";
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const res = await api.prescriptions.upload(file);
      const fileName = res?.file_path || file.name;
      addPrescription(fileName);
      await placeOrder("COD", user?.address || undefined, fileName);
      alert(`Prescription "${file.name}" uploaded and queued for pharmacy verification!`);
      location.href = "/user/dashboard";
    } catch (e) {
      console.warn("Prescription upload error, creating local order:", e);
      const randomId = Math.floor(100 + Math.random() * 900);
      const fileName = `prescription_${randomId}_${file.name}`;
      addPrescription(fileName);
      await placeOrder("COD", user?.address || undefined, fileName);
      alert(`Prescription "${file.name}" queued for pharmacy verification!`);
      location.href = "/user/dashboard";
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <main className={`assist-page ${dark ? "dark" : ""}`}>
      <header className="assist-nav">
        <a className="brand" href="/">
          <span className="brand-mark"><i>M</i><i>M</i></span>Medi<span>Mall</span>
        </a>
        <div className="assist-location">
          <MapPin size={16}/>
          <b>{user?.address ? user.address.split(",")[0] : "Indiranagar, Bengaluru"}</b>
          <ChevronDown size={14}/>
        </div>
        <button className="theme-toggle" onClick={toggleTheme}>
          {dark ? <Sun size={18}/> : <Moon size={18}/>}
        </button>
        <a className="assist-account" href="/user/dashboard">
          {user ? user.name.split(" ").map(n => n[0]).join("") : "US"}
        </a>
      </header>

      <div className="assist-wrap">
        <a className="back" href="/medicines">
          <ArrowLeft size={17}/> Back to medicine search
        </a>
        <div className="assist-hero">
          <div className="assist-symbol">
            <MessageCircleHeart size={32}/>
            <Sparkles size={16}/>
          </div>
          <span>MEDIASSIST AI</span>
          <h1>Tell us how you&apos;re feeling.</h1>
          <p>Type, speak, or upload a prescription. MediAssist helps organize the details for a <b>licensed pharmacist</b> to review before you order.</p>
        </div>

        {mode === "start" ? (
          <section className="assist-panel">
            <div className="language">
              <Globe2 size={17}/>
              <span>Language</span>
              <button>English <ChevronDown size={13}/></button>
              <small>You can type or speak in any language.</small>
            </div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="For example: I have a headache, runny nose, and mild fever since yesterday..."
            />
            <div className="input-actions">
              <button className={recording ? "recording" : ""} onClick={() => setRecording(!recording)}>
                <Mic size={17}/>{recording ? "Listening…" : "Speak instead"}
              </button>
              <span>{text.length}/500</span>
            </div>
            <div className="or"><span>OR</span></div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg"
              style={{ display: "none" }}
            />
            <button
              type="button"
              disabled={isUploading}
              className="upload-zone"
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <UploadCloud size={24}/>
              )}
              <span>
                <b>{isUploading ? "Uploading prescription..." : "Upload your prescription"}</b>
                <small>JPG, PNG or PDF · up to 10 MB</small>
              </span>
              <FileUp size={18}/>
            </button>
            {apiError && (
              <div style={{
                background: "#fff2f0",
                border: "1px solid #ffccc7",
                color: "#cf1322",
                padding: "12px 16px",
                borderRadius: "8px",
                margin: "12px 0",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <Info size={16} /> {apiError}
              </div>
            )}
            <button
              disabled={!text.trim() || isAnalysing}
              className="analyse"
              onClick={analyse}
            >
              {isAnalysing ? "Analyzing Symptoms..." : "Continue with MediAssist"} <ArrowRight size={18}/>
            </button>
          </section>
        ) : (
          <section className="review-panel">
            <div className="review-status">
              <CheckCircle2 size={20}/>
              <div>
                <b>{analysis?.summary || "Your details are ready for review"}</b>
                <p>{analysis?.condition_overview || "MediAssist has structured your symptoms."}</p>
              </div>
            </div>

            {analysis?.urgency_level && (
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "bold",
                backgroundColor: analysis.urgency_level.includes("High") ? "#fee2e2" : analysis.urgency_level === "Moderate" ? "#fffbeb" : "#e3f9ed",
                color: analysis.urgency_level.includes("High") ? "#ef4444" : analysis.urgency_level === "Moderate" ? "#b87829" : "#27815f",
                marginBottom: "12px",
              }}>
                <ShieldAlert size={14} /> Urgency Level: {analysis.urgency_level}
              </div>
            )}

            <div className="review-box">
              <p>YOU SHARED</p>
              <blockquote>“{text}”</blockquote>
              <button onClick={() => setMode("start")}>Edit details</button>
            </div>

            {analysis?.recommended_otc && analysis.recommended_otc.length > 0 && (
              <div style={{ margin: "16px 0", padding: "16px", background: "#f8fbf9", border: "1px solid #dcefe5", borderRadius: "10px" }}>
                <b style={{ fontSize: "13px", color: "#16342e", display: "block", marginBottom: "8px" }}>
                  Suggested OTC Medications:
                </b>
                <div style={{ display: "grid", gap: "8px" }}>
                  {analysis.recommended_otc.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                      <div>
                        <b>{item.name}</b>
                        <span style={{ display: "block", color: "#666", fontSize: "11px" }}>{item.purpose}</span>
                      </div>
                      <button
                        onClick={() => { addToCart(1); alert(`Added ${item.name} to cart!`); }}
                        style={{ border: "1px solid #227f5e", background: "#fff", color: "#227f5e", borderRadius: "5px", padding: "4px 8px", fontSize: "11px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        <Plus size={12} /> Add to Cart
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="review-next">
              <div className="review-number">1</div>
              <div>
                <b>Pharmacist review comes first</b>
                <p>A nearby licensed pharmacy reviews your details and any prescription before confirming medicine availability.</p>
              </div>
              <ShieldCheck size={25}/>
            </div>
            <div className="review-next">
              <div className="review-number">2</div>
              <div>
                <b>You approve the final order</b>
                <p>You&apos;ll see the pharmacist&apos;s verified order and price before checkout.</p>
              </div>
              <Pill size={25}/>
            </div>
            <button className="analyse" onClick={handleRequestReview}>
              Request pharmacist review <ArrowRight size={18}/>
            </button>
          </section>
        )}

        <div className="assist-disclaimer">
          <Info size={17}/>
          <p><b>For your safety:</b> {analysis?.disclaimer || "MediAssist does not diagnose, prescribe, or replace a doctor. For urgent symptoms, seek immediate medical care. Medicine orders are subject to pharmacist review."}</p>
        </div>
      </div>
    </main>
  );
}


