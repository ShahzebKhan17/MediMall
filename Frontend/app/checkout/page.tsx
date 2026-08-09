"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronDown, Clock3, CreditCard, MapPin, Moon, Pill, ShieldCheck, Sun, WalletCards } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAppContext } from "../context/AppContext";

const catalogue = [
  { id: 1, name: "Paracetamol 650mg", brand: "Dolo 650 · Strip of 15 tablets", price: 34, type: "Pain relief", rx: false, color: "orange" },
  { id: 2, name: "Cetirizine 10mg", brand: "Cetzine · Strip of 10 tablets", price: 28, type: "Allergy care", rx: false, color: "blue" },
  { id: 3, name: "Vitamin D3 60K", brand: "Uprise-D3 · Pack of 4 capsules", price: 116, type: "Vitamins", rx: false, color: "yellow" },
  { id: 4, name: "Amoxicillin 500mg", brand: "Mox 500 · Strip of 10 capsules", price: 133, type: "Antibiotic", rx: true, color: "green" },
];

export default function CheckoutPage() {
  const { dark, toggleTheme } = useTheme();
  const { cart, user, placeOrder, updateProfile } = useAppContext();
  const [method, setMethod] = useState("upi");
  const [placed, setPlaced] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState(user?.address || "");

  // Hydrate cart items details
  const cartItems = cart.map(cItem => {
    const med = catalogue.find(m => m.id === cItem.id)!;
    return {
      ...med,
      quantity: cItem.quantity,
    };
  });

  const itemTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const hasRx = cartItems.some(item => item.rx);

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;
    placeOrder(method.toUpperCase(), user?.address);
    setPlaced(true);
  };

  const handleSaveAddress = () => {
    updateProfile({ address: addressInput });
    setEditingAddress(false);
  };

  return (
    <main className={`checkout-page ${dark ? "dark" : ""}`}>
      <header className="checkout-nav">
        <a className="brand" href="/">
          <span className="brand-mark"><i>M</i><i>M</i></span>Medi<span>Mall</span>
        </a>
        <button className="theme-toggle" onClick={toggleTheme}>
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <span className="secure">
          <ShieldCheck size={16} />Secure checkout
        </span>
      </header>

      {placed ? (
        <section className="success">
          <span><CheckCircle2 size={44} /></span>
          <p>ORDER CONFIRMED</p>
          <h1>Your medicine is on its way.</h1>
          <h2>Care & Cure Pharmacy is reviewing your order now. We&apos;ll notify you as soon as it is dispatched.</h2>
          <div>
            <Clock3 size={21} />
            <b>Estimated delivery: 8 minutes</b>
          </div>
          <a href="/user/dashboard">Track your order</a>
        </section>
      ) : (
        <div className="checkout-layout">
          <section>
            <a className="back" href="/medicines">
              <ArrowLeft size={17} /> Back to medicines
            </a>
            <h1>Checkout</h1>

            <div className="checkout-card">
              <div className="checkout-title">
                <span className="number">1</span>
                <div>
                  <h2>Delivery address</h2>
                  <p>Where should we deliver your order?</p>
                </div>
                {!editingAddress ? (
                  <button onClick={() => { setAddressInput(user?.address || ""); setEditingAddress(true); }}>Change</button>
                ) : (
                  <button onClick={handleSaveAddress} style={{ background: "#16342e", color: "#fff" }}>Save</button>
                )}
              </div>
              <div className="address">
                <MapPin size={20} />
                <div style={{ width: "100%" }}>
                  <b>Home</b>
                  {editingAddress ? (
                    <textarea
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #ddd",
                        marginTop: "6px",
                        fontFamily: "inherit",
                        fontSize: "12px",
                      }}
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                    />
                  ) : (
                    <p>{user?.address || "Please set your delivery address."}</p>
                  )}
                  <small>{user?.phone || "+91 98765 43210"}</small>
                </div>
              </div>
            </div>

            <div className="checkout-card">
              <div className="checkout-title">
                <span className="number">2</span>
                <div>
                  <h2>Payment method</h2>
                  <p>All payments are securely processed.</p>
                </div>
              </div>
              <label className={method === "upi" ? "payment selected" : "payment"}>
                <input type="radio" checked={method === "upi"} onChange={() => setMethod("upi")} />
                <WalletCards size={19} />
                <span>
                  <b>UPI</b>
                  <small>Google Pay, PhonePe, Paytm and more</small>
                </span>
              </label>
              <label className={method === "card" ? "payment selected" : "payment"}>
                <input type="radio" checked={method === "card"} onChange={() => setMethod("card")} />
                <CreditCard size={19} />
                <span>
                  <b>Credit or debit card</b>
                  <small>Visa, Mastercard, RuPay</small>
                </span>
              </label>
              <label className={method === "cod" ? "payment selected" : "payment"}>
                <input type="radio" checked={method === "cod"} onChange={() => setMethod("cod")} />
                <Pill size={19} />
                <span>
                  <b>Pay on delivery</b>
                  <small>Cash or UPI at your doorstep</small>
                </span>
              </label>
            </div>
          </section>

          <aside className="summary">
            <h2>Order Summary</h2>
            {cartItems.length > 0 ? (
              <div className="cart-items" style={{ maxHeight: "250px", overflowY: "auto", marginBottom: "15px" }}>
                {cartItems.map((item, idx) => (
                  <div className="summary-item" key={`${item.id}-${idx}`} style={{ display: "flex", gap: "10px", padding: "10px 0", borderBottom: "1px solid #edf1ee" }}>
                    <span className={item.color === "blue" ? "blue" : ""}>
                      <Pill size={17} />
                    </span>
                    <p style={{ margin: 0, flex: 1 }}>
                      <b>{item.name}</b>
                      <small style={{ display: "block", color: "#82918b", fontSize: "10px" }}>{item.brand} × {item.quantity}</small>
                    </p>
                    <b>₹{item.price * item.quantity}</b>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#777", fontSize: "13px" }}>No items in cart. Go back and select medicines.</p>
            )}

            <div className="bill">
              <p>
                <span>Item total</span>
                <b>₹{itemTotal}</b>
              </p>
              <p>
                <span>Delivery fee</span>
                <b className="free">FREE</b>
              </p>
              <p className="total">
                <span>To pay</span>
                <b>₹{itemTotal}</b>
              </p>
            </div>

            <div className="delivery-box">
              <Clock3 size={18} />
              <p>
                <b>Delivery in 8 minutes</b>
                <small>From Care & Cure Pharmacy · 0.8 km away</small>
              </p>
            </div>

            {hasRx && (
              <div className="rx-box" style={{ background: "#fff5f0", border: "1px solid #f9d8c8", color: "#d85c2c" }}>
                <ShieldCheck size={18} />
                <p>
                  <b>Pharmacist review required</b>
                  Contains prescription items (Rx). Pharmacy will check your details before dispatch.
                </p>
              </div>
            )}

            <button disabled={cart.length === 0} onClick={handlePlaceOrder}>
              Place order <ChevronDown size={17} />
            </button>
          </aside>
        </div>
      )}
    </main>
  );
}

