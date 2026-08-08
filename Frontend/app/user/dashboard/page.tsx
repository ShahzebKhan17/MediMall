"use client";

import { useState } from "react";
import { Bell, ChevronDown, ClipboardList, Clock3, CreditCard, FileText, HeartPulse, HelpCircle, Home, LogOut, MapPin, Menu, Moon, PackageCheck, Pill, Plus, Search, Settings, ShieldCheck, ShoppingBag, Sun, UserRound } from "lucide-react";

const nav = [{ icon: Home, label: "Overview" }, { icon: ShoppingBag, label: "My orders" }, { icon: FileText, label: "Prescriptions" }, { icon: HeartPulse, label: "Health profile" }, { icon: CreditCard, label: "Payments" }];

export default function UserDashboard() {
  const [dark, setDark] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [active, setActive] = useState("Overview");
  return <main className={`app-shell ${dark ? "dark" : ""}`}>
    <aside className={`sidebar ${mobileNav ? "show" : ""}`}>
      <a className="brand" href="/"><span className="brand-mark"><i>M</i><i>M</i></span>Medi<span>Mall</span></a>
      <div className="side-section"><span>MENU</span>{nav.map(item => <button key={item.label} className={active === item.label ? "side-active" : ""} onClick={() => setActive(item.label)}><item.icon size={18}/>{item.label}</button>)}</div>
      <div className="side-section bottom"><span>SUPPORT</span><button><HelpCircle size={18}/>Help centre</button><button><Settings size={18}/>Settings</button><button className="signout"><LogOut size={18}/>Sign out</button></div>
    </aside>
    <div className="dash-page">
      <header className="dash-header"><button className="dash-menu" onClick={() => setMobileNav(!mobileNav)}><Menu/></button><div className="dash-search"><Search size={18}/><input placeholder="Search medicines, brands, health products"/></div><div className="dash-actions"><button className="theme-toggle" onClick={() => setDark(!dark)}>{dark ? <Sun size={18}/> : <Moon size={18}/>}</button><button className="bell"><Bell size={20}/><i></i></button><button className="profile-mini"><span>AS</span><div><b>Ananya Sharma</b><small>Member</small></div><ChevronDown size={15}/></button></div></header>
      <section className="dash-content">
        <div className="welcome"><div><p>THURSDAY, 08 AUGUST</p><h1>Hello, Ananya <span>✦</span></h1><h2>What can we help you feel better about today?</h2></div><button className="primary"><Plus size={17}/>New order</button></div>
        <div className="action-grid"><button className="dash-action orange"><span><Search/></span><div><b>Search medicines</b><small>Find what you already know</small></div></button><button className="dash-action purple"><span><HeartPulse/></span><div><b>Ask MediAssist</b><small>Describe symptoms in any language</small></div></button><button className="dash-action green"><span><FileText/></span><div><b>Upload prescription</b><small>Our pharmacist will check it</small></div></button></div>
        <div className="dash-grid"><section className="order-card card"><div className="card-title"><div><p>ACTIVE ORDER</p><h3>On its way to you</h3></div><button>Track order</button></div><div className="order-body"><div className="delivery-orb"><PackageCheck size={38}/></div><div><b>Care & Cure Pharmacy</b><p><MapPin size={14}/> 0.8 km away · Your rider is nearby</p><div className="progress"><i></i></div><div className="progress-labels"><span>Confirmed</span><span>Picked up</span><span className="now">Arriving</span></div></div><div className="eta-box"><Clock3 size={18}/><b>4 min</b><small>estimated</small></div></div></section>
          <section className="quick-card card"><div className="card-title"><div><p>QUICK REORDER</p><h3>Your regulars</h3></div><button className="plain">View all</button></div><div className="medicine-list"><div><span className="med-icon">P</span><p><b>Vitamin D3</b><small>60 capsules</small></p><button>+ Add</button></div><div><span className="med-icon blue">C</span><p><b>Cetirizine 10mg</b><small>10 tablets</small></p><button>+ Add</button></div></div></section></div>
        <div className="lower-grid"><section className="profile-card card"><div className="card-title"><div><p>HEALTH PROFILE</p><h3>Care, tailored to you</h3></div><button className="plain">Edit profile</button></div><div className="profile-content"><div className="avatar-large">AS</div><div><b>Ananya Sharma</b><p>28 years · Female</p><div className="profile-tags"><span>✦ No known allergies</span><span><MapPin size={12}/> Indiranagar, Bengaluru</span></div></div></div><div className="profile-details"><div><small>Mobile number</small><b>+91 98765 43210</b></div><div><small>Email address</small><b>ananya@example.com</b></div><div><small>Blood group</small><b>O+ Positive</b></div></div></section>
          <section className="recent-card card"><div className="card-title"><div><p>RECENT ACTIVITY</p><h3>Order history</h3></div><button className="plain">View all</button></div><div className="recent-row"><span className="mini-orb"><Pill size={17}/></span><div><b>Paracetamol 650mg</b><small>2 items · 06 Aug, 2026</small></div><span className="complete">Delivered</span></div><div className="recent-row"><span className="mini-orb mint"><ClipboardList size={17}/></span><div><b>Prescription uploaded</b><small>Reviewed by Care & Cure · 03 Aug</small></div><span className="complete">Complete</span></div></section></div>
      </section>
    </div>
  </main>;
}
