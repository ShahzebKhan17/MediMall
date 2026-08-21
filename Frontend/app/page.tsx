"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ChevronDown, Clock3, FileUp, HeartPulse, MapPin, Menu, Mic, Moon, Pill, Search, ShieldCheck, Sparkles, Store, Sun, X } from "lucide-react";
import { useTheme } from "./context/ThemeContext";

const medicines = ["Paracetamol 650", "Dolo 650", "Cetirizine", "Vitamin D3"];

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [menu, setMenu] = useState(false);
  const { dark, toggleTheme } = useTheme();
  
  const submit = (message: string) => { 
    setNotice(message); 
    setTimeout(() => setNotice(""), 3200); 
  };

  const handleSearch = (searchTerm?: string) => {
    const q = searchTerm !== undefined ? searchTerm : query;
    if (q.trim()) {
      router.push(`/medicines?q=${encodeURIComponent(q.trim())}`);
    } else {
      router.push("/medicines");
    }
  };

  return (
    <main className={dark ? "dark" : ""}>
      {notice && <div className="toast"><Check size={16}/> {notice}</div>}
      <header className="nav shell">
        <a className="brand" href="#top" aria-label="MediMall home"><span className="brand-mark"><i>M</i><i>M</i></span>Medi<span>Mall</span></a>
        <nav className={menu ? "open" : ""}><a href="#how">How it works</a><a href="#safety">Safety</a><a href="#partners">For pharmacies</a></nav>
        <div className="nav-actions"><button className="location" onClick={() => router.push("/medicines")}><MapPin size={16}/> Bengaluru <ChevronDown size={14}/></button><a className="login" href="/login">Log in</a><button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle dark mode">{dark ? <Sun size={18}/> : <Moon size={18}/>}</button><button className="menu" onClick={() => setMenu(!menu)}>{menu ? <X/> : <Menu/>}</button></div>
      </header>

      <section id="top" className="hero shell">
        <div className="hero-copy">
          <div className="eyebrow"><span></span> India&apos;s neighbourhood medicine network</div>
          <h1>We deliver before <em>everyone knows.</em></h1>
          <p className="lead">Genuine medicines from a verified pharmacy near you—matched in seconds, checked by a pharmacist, and at your door in minutes.</p>
          <div className="order-box">
            <div className="tabs">
              <button className="active">Search medicine</button>
              <button onClick={() => router.push("/ai-doctor")}>Ask MediAssist <Sparkles size={14}/></button>
            </div>
            <div className="search-row">
              <Search size={21}/>
              <input 
                value={query} 
                onChange={e => setQuery(e.target.value)} 
                onKeyDown={e => e.key === "Enter" && handleSearch()} 
                placeholder="Search by medicine or brand name"
              />
              <button onClick={() => handleSearch()}>Find medicine <ArrowRight size={17}/></button>
            </div>
            {!query && (
              <div className="suggestions">
                Popular: {medicines.map(m => <button key={m} onClick={() => handleSearch(m)}>{m}</button>)}
              </div>
            )}
          </div>
          <div className="hero-proof"><div><span className="avatars">● ● ●</span><b> 12,000+</b> orders delivered</div><div className="proof-line"></div><div><ShieldCheck size={17}/> Licensed pharmacies only</div></div>
        </div>
        <div className="hero-visual" aria-label="Fast medicine delivery illustration" onClick={() => router.push("/medicines")} style={{ cursor: "pointer" }}>
          <div className="hero-grain"></div><div className="hero-beam"></div>
          <div className="sun"></div><div className="cross">+</div><div className="route"><i></i><i></i><i></i></div>
          <div className="pharmacy-card"><div className="store-icon"><Store size={25}/></div><div><b>Care & Cure Pharmacy</b><p><span className="dot"></span> 0.8 km away · Open now</p></div><div className="eta"><Clock3 size={16}/><b>8 min</b></div></div>
          <div className="courier"><div className="helmet"></div><div className="person"></div><div className="bike"><span></span><span></span></div><div className="bag"><Pill size={26}/></div></div>
          <div className="verified"><ShieldCheck size={18}/><span>Pharmacist<br/><b>verified</b></span></div>
        </div>
      </section>

      <section className="quick shell">
        <button onClick={() => router.push("/ai-doctor")}>
          <span className="icon peach"><FileUp/></span>
          <span><b>Upload prescription</b><small>We&apos;ll verify every detail</small></span>
          <ArrowRight/>
        </button>
        <button onClick={() => router.push("/ai-doctor")}>
          <span className="icon lavender"><Mic/></span>
          <span><b>Speak to MediAssist</b><small>Any language, anytime</small></span>
          <ArrowRight/>
        </button>
        <button onClick={() => router.push("/medicines")}>
          <span className="icon mint"><MapPin/></span>
          <span><b>Find nearby pharmacies</b><small>Medicines in your neighbourhood</small></span>
          <ArrowRight/>
        </button>
      </section>

      <section id="how" className="how"><div className="shell"><div className="section-head"><div><span className="kicker">BUILT FOR PEACE OF MIND</span><h2>Fast is good. <em>Checked</em> is better.</h2></div><p>From a simple search to a complex prescription, every order has a real pharmacy behind it.</p></div><div className="steps"><article><span className="step-no">01</span><div className="step-icon"><Search/></div><h3>Tell us what you need</h3><p>Search a medicine, upload a prescription, or simply describe how you&apos;re feeling.</p></article><article><span className="step-no">02</span><div className="step-icon"><MapPin/></div><h3>We find your closest match</h3><p>Smart routing checks stock at licensed pharmacies around you—instantly.</p></article><article><span className="step-no">03</span><div className="step-icon"><ShieldCheck/></div><h3>A pharmacist checks it</h3><p>Before dispatch, a qualified pharmacist reviews prescription and order details.</p></article><article><span className="step-no">04</span><div className="step-icon"><HeartPulse/></div><h3>Feel better, sooner</h3><p>Track your verified order from shelf to doorstep, in as little as 10 minutes.</p></article></div></div></section>

      <section id="safety" className="trust shell"><div className="trust-art"><div className="ring ring1"></div><div className="ring ring2"></div><div className="shield"><ShieldCheck size={61}/></div><div className="mini-card a"><Check size={14}/> Rx validated</div><div className="mini-card b"><Clock3 size={14}/> Live tracking</div></div><div className="trust-copy"><span className="kicker">YOUR SAFETY, BY DESIGN</span><h2>Real expertise at<br/>the final <em>mile.</em></h2><p>MediMall doesn&apos;t replace your doctor. It brings together your prescription, your local pharmacy, and a licensed pharmacist for a safer way to order.</p><ul><li><Check/> Prescription medicines released only after review</li><li><Check/> Clear order updates if anything needs confirmation</li><li><Check/> Your health details stay private and protected</li></ul><button className="text-btn" onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}>See how we keep you safe <ArrowRight size={17}/></button></div></section>

      <section id="partners" className="partner"><div className="shell partner-inner"><div><span className="kicker">FOR LOCAL PHARMACIES</span><h2>Your neighbourhood.<br/><em>Your customers.</em></h2><p>Join a delivery network that keeps local pharmacies at the heart of healthcare.</p><button onClick={() => router.push("/shopkeeper/dashboard")}>Partner with MediMall <ArrowRight size={17}/></button></div><div className="dashboard"><div className="dash-top"><span>Care & Cure Pharmacy</span><span className="status">● Online</span></div><div className="metric"><p>New order</p><h3>Prescription review</h3><div className="patient"><span>AS</span><div><b>Ananya Sharma</b><small>2 items · 0.8 km away</small></div><button onClick={() => router.push("/shopkeeper/dashboard")}>Review</button></div></div><div className="dash-bottom"><span>Today&apos;s orders <b>24</b></span><span>Avg. dispatch <b>4 min</b></span></div></div></div></section>

      <footer className="shell"><a className="brand" href="#top" aria-label="MediMall home"><span className="brand-mark"><i>M</i><i>M</i></span>Medi<span>Mall</span></a><p>Care, close to home.</p><span>© 2026 MediMall</span></footer>
    </main>
  );
}
