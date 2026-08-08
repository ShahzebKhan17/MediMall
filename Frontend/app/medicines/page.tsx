"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronDown, Clock3, FileUp, MapPin, Minus, Moon, Pill, Plus, Search, ShieldCheck, ShoppingBag, Sun, X } from "lucide-react";

const catalogue = [
  { id: 1, name: "Paracetamol 650mg", brand: "Dolo 650 · Strip of 15 tablets", price: 34, type: "Pain relief", rx: false, color: "orange" },
  { id: 2, name: "Cetirizine 10mg", brand: "Cetzine · Strip of 10 tablets", price: 28, type: "Allergy care", rx: false, color: "blue" },
  { id: 3, name: "Vitamin D3 60K", brand: "Uprise-D3 · Pack of 4 capsules", price: 116, type: "Vitamins", rx: false, color: "yellow" },
  { id: 4, name: "Amoxicillin 500mg", brand: "Mox 500 · Strip of 10 capsules", price: 133, type: "Antibiotic", rx: true, color: "green" },
];

export default function MedicinesPage() {
  const [query, setQuery] = useState(""); const [dark, setDark] = useState(false); const [cart, setCart] = useState<number[]>([]); const [toast, setToast] = useState("");
  const results = useMemo(() => catalogue.filter(m => `${m.name} ${m.brand} ${m.type}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const add = (id: number) => { setCart([...cart, id]); setToast("Added to your cart"); setTimeout(() => setToast(""), 1800); };
  return (
    <main className={`order-page ${dark ? "dark" : ""}`}>
    {toast && <div className="toast"><Check size={16}/>{toast}</div>}
    <header className="order-nav"><a className="brand" href="/"><span className="brand-mark"><i>M</i><i>M</i></span>Medi<span>Mall</span></a><div className="order-location"><MapPin size={16}/><span>Delivering to<br/><b>Indiranagar, Bengaluru</b></span><ChevronDown size={14}/></div><button className="theme-toggle" onClick={() => setDark(!dark)}>{dark ? <Sun size={18}/> : <Moon size={18}/>}</button><a className="account-link" href="/user/dashboard">AS</a></header>
    <div className="order-layout"><section className="catalogue"><a className="back" href="/"><ArrowLeft size={17}/> Back to home</a><div className="catalogue-head"><p>MEDICINES, CLOSE TO HOME</p><h1>What are you looking for?</h1><div className="big-search"><Search size={22}/><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search medicine or brand name"/><button><FileUp size={17}/>Upload prescription</button></div><div className="category-row"><button className="selected">All medicines</button><button>Pain relief</button><button>Cold & allergy</button><button>Vitamins</button><button>Diabetes care</button></div></div>
      <div className="pharmacy-strip"><div className="pharmacy-dot"><Pill size={19}/></div><div><b>Matched with Care & Cure Pharmacy</b><p><span></span> Licensed pharmacy · 0.8 km from you</p></div><div className="delivery-time"><Clock3 size={17}/><b>8 min</b><small>delivery estimate</small></div></div>
      <div className="result-title"><h2>{query ? `Results for “${query}”` : "Popular near you"}</h2><span>{results.length} medicines available</span></div><div className="medicine-grid">{results.map(m => <article key={m.id} className="medicine-card"><div className={`medicine-art ${m.color}`}><Pill size={34}/>{m.rx && <span>Rx</span>}</div><div className="medicine-copy"><p>{m.type}</p><h3>{m.name}</h3><small>{m.brand}</small><div><b>₹{m.price}</b>{m.rx && <em><ShieldCheck size={12}/> Prescription needed</em>}</div></div><button onClick={() => add(m.id)} className="add-btn"><Plus size={16}/>Add</button></article>)}</div>{results.length === 0 && <div className="empty"><Search size={25}/><b>No matching medicines found</b><p>Try another brand or upload a prescription for help.</p></div>}</section>
      <aside className="cart"><div className="cart-head"><div><ShoppingBag size={20}/><h2>Your cart</h2></div><span>{cart.length} item{cart.length !== 1 && "s"}</span></div>{cart.length ? <><div className="cart-items">{cart.map((id, index) => { const m = catalogue.find(item => item.id === id)!; return <div key={`${id}-${index}`}><span className={`cart-pill ${m.color}`}><Pill size={15}/></span><p><b>{m.name}</b><small>₹{m.price}</small></p><button onClick={() => setCart(cart.filter((_, i) => i !== index))}><X size={15}/></button></div>; })}</div><div className="cart-total"><span>Total</span><b>₹{cart.reduce((sum, id) => sum + (catalogue.find(m => m.id === id)?.price || 0), 0)}</b></div><button className="checkout">Continue to checkout <ChevronDown size={17}/></button></> : <div className="empty-cart"><ShoppingBag size={28}/><b>Your cart is empty</b><p>Add medicine to see your order summary here.</p></div>}<div className="verify-note"><ShieldCheck size={18}/><p><b>Pharmacist verified</b>Prescription medicines are checked before dispatch.</p></div></aside>
    </div>
    </main>
  );
}
