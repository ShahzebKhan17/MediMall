"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, FileUp, Globe2, Info, MapPin, MessageCircleHeart, Mic, Moon, Pill, ShieldCheck, Sparkles, Sun, UploadCloud } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAppContext } from "../context/AppContext";

export default function MediAssistPage() {
  const { dark, toggleTheme } = useTheme();
  const { user, addPrescription, placeOrder } = useAppContext();
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"start" | "review">("start");
  const [recording, setRecording] = useState(false);

  const analyse = () => {
    if (text.trim()) setMode("review");
  };

  const handleRequestReview = () => {
    placeOrder("COD", user?.address || undefined, "Symptom Log: " + text.slice(0, 30) + "...");
    alert("Your symptom log has been sent to Care & Cure Pharmacy for pharmacist review! Track the status on your dashboard.");
    location.href = "/user/dashboard";
  };

  const handleUpload = () => {
    const randomId = Math.floor(100 + Math.random() * 900);
    const fileName = `prescription_uploaded_${randomId}.pdf`;
    addPrescription(fileName);
    placeOrder("COD", user?.address || undefined, fileName);
    alert(`Prescription "${fileName}" uploaded and queued for pharmacy verification!`);
    location.href = "/user/dashboard";
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
          <span>MEDIASSIST</span>
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
              placeholder="For example: I have a headache and mild fever since yesterday..."
            />
            <div className="input-actions">
              <button className={recording ? "recording" : ""} onClick={() => setRecording(!recording)}>
                <Mic size={17}/>{recording ? "Listening…" : "Speak instead"}
              </button>
              <span>{text.length}/500</span>
            </div>
            <div className="or"><span>OR</span></div>
            <button className="upload-zone" onClick={handleUpload}>
              <UploadCloud size={24}/>
              <span>
                <b>Upload your prescription</b>
                <small>JPG, PNG or PDF · up to 10 MB</small>
              </span>
              <FileUp size={18}/>
            </button>
            <button disabled={!text.trim()} className="analyse" onClick={analyse}>
              Continue with MediAssist <ArrowRight size={18}/>
            </button>
          </section>
        ) : (
          <section className="review-panel">
            <div className="review-status">
              <CheckCircle2 size={20}/>
              <div>
                <b>Your details are ready for review</b>
                <p>MediAssist has organized what you shared.</p>
              </div>
            </div>
            <div className="review-box">
              <p>YOU SHARED</p>
              <blockquote>“{text}”</blockquote>
              <button onClick={() => setMode("start")}>Edit details</button>
            </div>
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
          <p><b>For your safety:</b> MediAssist does not diagnose, prescribe, or replace a doctor. For urgent symptoms, seek immediate medical care. Medicine orders are subject to pharmacist review.</p>
        </div>
      </div>
    </main>
  );
}

