"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, Check, ChevronDown, Clock3, FileUp, Loader2, MapPin, Minus, Moon, Pill, Plus, RefreshCw, Search, ShieldCheck, ShoppingBag, Sun, X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAppContext, Medicine } from "../context/AppContext";
import { api } from "../../lib/api";

export default function MedicinesPage() {
  const [query, setQuery] = useState("");
  const [catalogue, setCatalogue] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { dark, toggleTheme } = useTheme();
  const { cart, addToCart, updateCartQuantity, removeFromCart, user } = useAppContext();
  const [toast, setToast] = useState("");

  const loadCatalogue = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await api.medicines.getAll();
      if (data) {
        setCatalogue(data);
      }
    } catch (e: any) {
      console.warn("Backend medicines fetch error:", e);
      setFetchError("Unable to load medicines from the server. Please ensure the backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      if (q) setQuery(q);
    }
    loadCatalogue();
  }, []);

  const results = useMemo(
    () => catalogue.filter(m => `${m.name} ${m.brand} ${m.type}`.toLowerCase().includes(query.toLowerCase())),
    [catalogue, query]
  );

  const handleAdd = (medicine: Medicine) => {
    addToCart(medicine.id, medicine);
    setToast(`Added ${medicine.name} to your cart`);
    setTimeout(() => setToast(""), 1800);
  };

  const userInitials = user ? user.name.split(" ").map(n => n[0]).join("") : "US";

  // Calculate unique cart count & total price
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => {
    const med = item.medicine || catalogue.find(m => m.id === item.id);
    return sum + (med ? med.price * item.quantity : 0);
  }, 0);

  return (
    <main className={`order-page ${dark ? "dark" : ""}`}>
      {toast && <div className="toast"><Check size={16}/>{toast}</div>}
      <header className="order-nav">
        <a className="brand" href="/">
          <span className="brand-mark"><i>M</i><i>M</i></span>Medi<span>Mall</span>
        </a>
        <div className="order-location">
          <MapPin size={16}/>
          <span>Delivering to<br/><b>{user?.address ? user.address.split(",")[0] : "Indiranagar, Bengaluru"}</b></span>
          <ChevronDown size={14}/>
        </div>
        <button className="theme-toggle" onClick={toggleTheme}>
          {dark ? <Sun size={18}/> : <Moon size={18}/>}
        </button>
        <a className="account-link" href={user ? "/user/dashboard" : "/login"}>
          {user ? userInitials : "Sign in"}
        </a>
      </header>

      <div className="order-layout">
        <section className="catalogue">
          <a className="back" href="/"><ArrowLeft size={17}/> Back to home</a>
          <div className="catalogue-head">
            <p>MEDICINES, CLOSE TO HOME</p>
            <h1>What are you looking for?</h1>
            <div className="big-search">
              <Search size={22}/>
              <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search medicine or brand name"/>
              <button onClick={() => location.href = "/ai-doctor"}><FileUp size={17}/>Upload prescription</button>
            </div>
            <div className="category-row">
              <button className="selected" onClick={() => setQuery("")}>All medicines</button>
              <button onClick={() => setQuery("Pain relief")}>Pain relief</button>
              <button onClick={() => setQuery("Allergy")}>Cold & allergy</button>
              <button onClick={() => setQuery("Vitamins")}>Vitamins</button>
              <button onClick={() => setQuery("Antibiotic")}>Antibiotics</button>
            </div>
          </div>

          {fetchError && (
            <div style={{
              background: "#fff2f0",
              border: "1px solid #ffccc7",
              color: "#cf1322",
              padding: "16px 20px",
              borderRadius: "10px",
              margin: "16px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <AlertCircle size={20} />
                <span style={{ fontSize: "13px" }}>{fetchError}</span>
              </div>
              <button
                onClick={loadCatalogue}
                style={{
                  background: "#cf1322",
                  color: "#fff",
                  border: 0,
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <RefreshCw size={13} /> Retry
              </button>
            </div>
          )}

          <div className="pharmacy-strip">
            <div className="pharmacy-dot"><Pill size={19}/></div>
            <div>
              <b>Matched with Care & Cure Pharmacy</b>
              <p><span></span> Licensed pharmacy · 0.8 km from you</p>
            </div>
            <div className="delivery-time">
              <Clock3 size={17}/>
              <b>8 min</b>
              <small>delivery estimate</small>
            </div>
          </div>

          <div className="result-title">
            <h2>{query ? `Results for “${query}”` : "Available in Catalog"}</h2>
            <span>{isLoading ? "Loading medicines..." : `${results.length} medicines available`}</span>
          </div>

          {isLoading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px", marginTop: "20px" }}>
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} className="card" style={{ padding: "20px", textAlign: "center", opacity: 0.6 }}>
                  <Loader2 size={24} className="animate-spin" style={{ margin: "10px auto", color: "#227f5e" }} />
                  <span style={{ fontSize: "12px", color: "#888" }}>Fetching live inventory...</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="medicine-grid">
              {results.map(m => (
                <article key={m.id} className="medicine-card">
                  <div className={`medicine-art ${m.color || "blue"}`}>
                    <Pill size={34}/>
                    {m.rx && <span>Rx</span>}
                  </div>
                  <div className="medicine-copy">
                    <p>{m.type}</p>
                    <h3>{m.name}</h3>
                    <small>{m.brand}</small>
                    <div>
                      <b>₹{m.price}</b>
                      {m.rx && <em><ShieldCheck size={12}/> Prescription needed</em>}
                    </div>
                  </div>
                  <button onClick={() => handleAdd(m)} className="add-btn"><Plus size={16}/>Add</button>
                </article>
              ))}
            </div>
          )}

          {!isLoading && !fetchError && results.length === 0 && (
            <div className="empty">
              <Search size={25}/>
              <b>No matching medicines found</b>
              <p>Try another brand or upload a prescription for pharmacist review.</p>
            </div>
          )}
        </section>

        <aside className="cart">
          <div className="cart-head">
            <div>
              <ShoppingBag size={20}/>
              <h2>Your cart</h2>
            </div>
            <span>{cartItemCount} item{cartItemCount !== 1 && "s"}</span>
          </div>

          {cart.length ? (
            <>
              <div className="cart-items">
                {cart.map((cItem, index) => {
                  const m = cItem.medicine || catalogue.find(item => item.id === cItem.id) || {
                    name: "Medicine Item",
                    price: 50,
                    color: "blue",
                  };
                  return (
                    <div key={`${cItem.id}-${index}`}>
                      <span className={`cart-pill ${m.color || "blue"}`}><Pill size={15}/></span>
                      <p>
                        <b>{m.name}</b>
                        <small>₹{m.price} × {cItem.quantity}</small>
                      </p>
                      <div className="qty-controls" style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto", marginRight: "10px" }}>
                        <button style={{ border: 0, background: "#f0f0f0", borderRadius: "4px", width: "20px", height: "20px", display: "grid", placeItems: "center", cursor: "pointer" }} onClick={() => updateCartQuantity(cItem.id, cItem.quantity - 1)}>
                          <Minus size={11}/>
                        </button>
                        <span style={{ fontSize: "12px", fontWeight: "bold" }}>{cItem.quantity}</span>
                        <button style={{ border: 0, background: "#f0f0f0", borderRadius: "4px", width: "20px", height: "20px", display: "grid", placeItems: "center", cursor: "pointer" }} onClick={() => updateCartQuantity(cItem.id, cItem.quantity + 1)}>
                          <Plus size={11}/>
                        </button>
                      </div>
                      <button onClick={() => removeFromCart(cItem.id)}><X size={15}/></button>
                    </div>
                  );
                })}
              </div>
              <div className="cart-total">
                <span>Total</span>
                <b>₹{cartTotal}</b>
              </div>
              <a className="checkout" href="/checkout">Continue to checkout <ChevronDown size={17}/></a>
            </>
          ) : (
            <div className="empty-cart">
              <ShoppingBag size={28}/>
              <b>Your cart is empty</b>
              <p>Add medicine to see your order summary here.</p>
            </div>
          )}

          <div className="verify-note">
            <ShieldCheck size={18}/>
            <p><b>Pharmacist verified</b>Prescription medicines are checked before dispatch.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}


