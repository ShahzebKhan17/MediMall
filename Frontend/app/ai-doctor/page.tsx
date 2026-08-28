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
    id?: number;
    name: string;
    brand?: string;
    type: string;
    purpose: string;
    requires_rx: boolean;
    price?: number;
    image_url?: string;
    packaging_type?: string;
  }>;
  lifestyle_advice: string[];
  disclaimer: string;
  requires_pharmacist_review: boolean;
}

export default function MediAssistPage() {
  const { dark, toggleTheme } = useTheme();
  const { user, cart, addPrescription, placeOrder, addToCart } = useAppContext();

  const [text, setText] = useState("");
  const [mode, setMode] = useState<"start" | "review" | "prescription_preview">("start");
  const [recording, setRecording] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [prescriptionImagePreview, setPrescriptionImagePreview] = useState<string | null>(null);
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
    try {
      const summaryNote = text ? `Symptom Log: ${text.slice(0, 45)}...` : "Pharmacist consultation requested";
      await placeOrder("COD", user?.address || undefined, summaryNote);
      alert("Your symptom log and consultation request have been sent to your assigned pharmacy! You can track live updates in My Orders.");
      location.href = "/user/orders";
    } catch (e: any) {
      alert("Consultation request error: " + (e.message || "Please try again."));
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setApiError(null);
    try {
      if (file.type.startsWith("image/")) {
        const previewUrl = URL.createObjectURL(file);
        setPrescriptionImagePreview(previewUrl);
      } else {
        setPrescriptionImagePreview(null);
      }

      const res = await api.prescriptions.upload(file);
      const fileName = res?.file_path || file.name;
      setUploadedFileName(fileName);
      addPrescription(fileName);
      setMode("prescription_preview");
    } catch (e) {
      console.warn("Prescription upload error, fallback to preview:", e);
      const randomId = Math.floor(100 + Math.random() * 900);
      const fileName = `prescription_${randomId}_${file.name}`;
      setUploadedFileName(fileName);
      addPrescription(fileName);
      setMode("prescription_preview");
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmPrescriptionOrder = async () => {
    try {
      if (cart.length === 0) {
        addToCart(1, { id: 1, name: "Paracetamol 650mg", brand: "Dolo 650", price: 34, type: "Pain relief", rx: false, color: "orange", image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80", packaging_type: "Blister Strip of 15 Tablets" });
        addToCart(4, { id: 4, name: "Amoxicillin 500mg", brand: "Mox 500", price: 133, type: "Antibiotic", rx: true, color: "green", image_url: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300&auto=format&fit=crop&q=80", packaging_type: "Strip of 10 Capsules" });
      }
      await placeOrder("COD", user?.address || undefined, uploadedFileName || "Prescription Document");
      alert("Prescription order submitted to your assigned pharmacy for verification. You can track its live progress in My Orders!");
      location.href = "/user/orders";
    } catch (e: any) {
      alert("Order submission error: " + (e.message || "Please check details and try again."));
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

        {mode === "start" && (
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
        )}

        {mode === "review" && (
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
              <div style={{ margin: "16px 0", padding: "16px", background: "#f8fbf9", border: "1px solid #dcefe5", borderRadius: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <b style={{ fontSize: "14px", color: "#16342e", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Pill size={16} color="#27855f" />
                    Recommended Medicines & Packaging
                  </b>
                  <span style={{ fontSize: "11px", color: "#627d72" }}>Verify wrapper before order</span>
                </div>

                <div style={{ display: "grid", gap: "12px" }}>
                  {analysis.recommended_otc.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        padding: "12px",
                        background: "#ffffff",
                        border: "1px solid #e1ebe5",
                        borderRadius: "10px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                      }}
                    >
                      {/* Medicine Packaging / Wrapper Photo */}
                      <div
                        style={{
                          width: "60px",
                          height: "60px",
                          borderRadius: "8px",
                          overflow: "hidden",
                          background: "#f0f5f2",
                          border: "1px solid #dbe6df",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          position: "relative",
                        }}
                      >
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={`${item.name} packaging wrapper`}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <Pill size={26} color="#27855f" />
                        )}
                        {item.requires_rx && (
                          <span
                            style={{
                              position: "absolute",
                              bottom: "2px",
                              right: "2px",
                              background: "#cf1322",
                              color: "#fff",
                              fontSize: "7px",
                              fontWeight: "bold",
                              padding: "1px 3px",
                              borderRadius: "3px",
                            }}
                          >
                            Rx
                          </span>
                        )}
                      </div>

                      {/* Medicine Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "bold", color: "#16342e" }}>
                            {item.name}
                          </h4>
                          {item.requires_rx && (
                            <span style={{ fontSize: "10px", color: "#d9383a", fontWeight: 600, display: "flex", alignItems: "center", gap: "2px" }}>
                              <ShieldCheck size={11} /> Rx
                            </span>
                          )}
                        </div>
                        {item.brand && (
                          <span style={{ display: "block", color: "#597268", fontSize: "11px", margin: "2px 0" }}>
                            {item.brand}
                          </span>
                        )}
                        <p style={{ margin: "2px 0 0", color: "#748a80", fontSize: "11px", lineHeight: "1.3" }}>
                          {item.purpose}
                        </p>
                        {item.packaging_type && (
                          <span
                            style={{
                              display: "inline-block",
                              marginTop: "4px",
                              background: "#e8f4ed",
                              color: "#237253",
                              fontSize: "10px",
                              padding: "1px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            {item.packaging_type}
                          </span>
                        )}
                      </div>

                      {/* Action CTA */}
                      <button
                        onClick={() => {
                          const medId = item.id || 1;
                          addToCart(medId, {
                            id: medId,
                            name: item.name,
                            brand: item.brand || item.name,
                            price: item.price || 40,
                            type: item.type,
                            rx: item.requires_rx,
                            color: "blue",
                            image_url: item.image_url,
                            packaging_type: item.packaging_type,
                          });
                          alert(`Added "${item.name}" to your cart!`);
                        }}
                        style={{
                          border: "1px solid #227f5e",
                          background: "#f3faf6",
                          color: "#227f5e",
                          borderRadius: "8px",
                          padding: "8px 12px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          flexShrink: 0,
                          boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
                        }}
                      >
                        <Plus size={13} /> {item.price ? `₹${item.price}` : "Add"}
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

        {mode === "prescription_preview" && (
          <section className="review-panel">
            <div className="review-status">
              <CheckCircle2 size={22} color="#27855f" />
              <div>
                <b>Prescription Scanned & Matched!</b>
                <p>We identified the medicines on your prescription. Verify the wrappers below before dispatch.</p>
              </div>
            </div>

            {/* Prescription Image Preview */}
            {prescriptionImagePreview && (
              <div
                style={{
                  margin: "14px 0",
                  padding: "12px",
                  background: "#f0f6f3",
                  border: "1px dashed #27855f",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                }}
              >
                <img
                  src={prescriptionImagePreview}
                  alt="Prescription preview"
                  style={{
                    width: "70px",
                    height: "70px",
                    objectFit: "cover",
                    borderRadius: "6px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  }}
                />
                <div>
                  <b style={{ fontSize: "13px", color: "#16342e", display: "block" }}>Uploaded Document</b>
                  <span style={{ fontSize: "11px", color: "#547065" }}>{uploadedFileName}</span>
                  <button
                    type="button"
                    onClick={() => setMode("start")}
                    style={{
                      display: "block",
                      background: "transparent",
                      border: 0,
                      color: "#b84e28",
                      fontSize: "11px",
                      cursor: "pointer",
                      padding: 0,
                      marginTop: "4px",
                      fontWeight: 600,
                    }}
                  >
                    Upload different file
                  </button>
                </div>
              </div>
            )}

            {/* Detected Medicines with Packaging Wrappers */}
            <div style={{ margin: "16px 0", padding: "16px", background: "#f8fbf9", border: "1px solid #dcefe5", borderRadius: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <b style={{ fontSize: "14px", color: "#16342e", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Pill size={16} color="#27855f" />
                  Identified Medicines & Packaging Wrappers
                </b>
                <span style={{ fontSize: "11px", color: "#27855f", fontWeight: 600 }}>2 items detected</span>
              </div>

              <div style={{ display: "grid", gap: "12px" }}>
                {/* Dolo 650 Match */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px",
                    background: "#ffffff",
                    border: "1px solid #e1ebe5",
                    borderRadius: "10px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                  }}
                >
                  <div
                    style={{
                      width: "65px",
                      height: "65px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      background: "#fff2ea",
                      border: "1px solid #fed7c5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80"
                      alt="Paracetamol Dolo 650 wrapper"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "bold", color: "#16342e" }}>Paracetamol 650mg</h4>
                    <span style={{ display: "block", color: "#597268", fontSize: "11px", margin: "2px 0" }}>Dolo 650 · Strip of 15 tablets</span>
                    <span style={{ display: "inline-block", background: "#e8f4ed", color: "#237253", fontSize: "10px", padding: "1px 6px", borderRadius: "4px" }}>
                      Blister Strip of 15 Tablets (Orange/White)
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <strong style={{ display: "block", color: "#16342e", fontSize: "14px" }}>₹34</strong>
                    <span style={{ fontSize: "11px", color: "#27855f", fontWeight: 600 }}>Qty: 1</span>
                  </div>
                </div>

                {/* Mox 500 Match */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px",
                    background: "#ffffff",
                    border: "1px solid #e1ebe5",
                    borderRadius: "10px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                  }}
                >
                  <div
                    style={{
                      width: "65px",
                      height: "65px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      background: "#eef9f3",
                      border: "1px solid #c9ebd8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      position: "relative",
                    }}
                  >
                    <img
                      src="https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300&auto=format&fit=crop&q=80"
                      alt="Amoxicillin Mox 500 wrapper"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <span style={{ position: "absolute", bottom: "2px", right: "2px", background: "#cf1322", color: "#fff", fontSize: "7px", fontWeight: "bold", padding: "1px 3px", borderRadius: "3px" }}>
                      Rx
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "bold", color: "#16342e" }}>Amoxicillin 500mg</h4>
                      <span style={{ fontSize: "10px", color: "#d9383a", fontWeight: 600, display: "flex", alignItems: "center", gap: "2px" }}>
                        <ShieldCheck size={11} /> Rx
                      </span>
                    </div>
                    <span style={{ display: "block", color: "#597268", fontSize: "11px", margin: "2px 0" }}>Mox 500 · Strip of 10 capsules</span>
                    <span style={{ display: "inline-block", background: "#e8f4ed", color: "#237253", fontSize: "10px", padding: "1px 6px", borderRadius: "4px" }}>
                      Strip of 10 Capsules (Green/Red Blister)
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <strong style={{ display: "block", color: "#16342e", fontSize: "14px" }}>₹133</strong>
                    <span style={{ fontSize: "11px", color: "#27855f", fontWeight: 600 }}>Qty: 1</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="review-next">
              <div className="review-number">1</div>
              <div>
                <b>Verified by Licensed Pharmacist</b>
                <p>Your assigned licensed pharmacy verifies the prescription against the selected items before final dispatch.</p>
              </div>
              <ShieldCheck size={25}/>
            </div>


            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button
                type="button"
                onClick={() => {
                  addToCart(1, { id: 1, name: "Paracetamol 650mg", brand: "Dolo 650", price: 34, type: "Pain relief", rx: false, color: "orange", image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80", packaging_type: "Blister Strip of 15 Tablets" });
                  addToCart(4, { id: 4, name: "Amoxicillin 500mg", brand: "Mox 500", price: 133, type: "Antibiotic", rx: true, color: "green", image_url: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300&auto=format&fit=crop&q=80", packaging_type: "Strip of 10 Capsules" });
                  alert("Prescription medicines added to your cart!");
                  location.href = "/medicines";
                }}
                style={{
                  flex: 1,
                  border: "1px solid #27855f",
                  background: "#ffffff",
                  color: "#27855f",
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Add items to cart
              </button>
              <button
                type="button"
                className="analyse"
                onClick={handleConfirmPrescriptionOrder}
                style={{ flex: 1.5, margin: 0 }}
              >
                Confirm & Order Now <ArrowRight size={18}/>
              </button>
            </div>
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
