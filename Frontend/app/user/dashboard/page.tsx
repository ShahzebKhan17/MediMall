"use client";

import { useState, useMemo } from "react";
import { AlertCircle, CheckCircle2, ClipboardList, Clock3, FileText, HeartPulse, MapPin, PackageCheck, Pill, Plus, RefreshCw, Search, ShoppingBag, Store } from "lucide-react";
import { useAppContext } from "../../context/AppContext";

export default function UserDashboard() {
  const { user, orders, addToCart, serverError, retryConnection } = useAppContext();
  const [toast, setToast] = useState("");

  const handleAdd = (id: number, name: string) => {
    addToCart(id);
    setToast(`Added ${name} to cart`);
    setTimeout(() => setToast(""), 1800);
  };

  // Derive unique past ordered medicines for Quick Reorder
  const regularMedicines = useMemo(() => {
    const seen = new Set<string>();
    const items: Array<{ id: number; name: string; brand: string }> = [];
    for (const order of orders) {
      for (const it of order.itemsList) {
        const key = it.name.toLowerCase().trim();
        if (!seen.has(key)) {
          seen.add(key);
          items.push({
            id: it.medicineId || it.id || 0,
            name: it.name,
            brand: it.brand || "Medicine",
          });
        }
      }
    }
    return items.slice(0, 4);
  }, [orders]);

  // Find first active order (not Delivered or Cancelled)
  const activeOrder = orders.find(o => o.status !== "Delivered" && o.status !== "Cancelled");
  // Find completed/cancelled orders for history
  const historicOrders = orders.filter(o => o.status === "Delivered" || o.status === "Cancelled").slice(0, 3);

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case "Placed": return "15%";
      case "Review": return "35%";
      case "Confirmed": return "55%";
      case "Packing": return "75%";
      case "Shipped":
      case "Arriving": return "90%";
      default: return "100%";
    }
  };

  const getETA = (status: string) => {
    switch (status) {
      case "Placed":
      case "Review": return "10 min";
      case "Confirmed": return "8 min";
      case "Packing": return "6 min";
      case "Shipped":
      case "Arriving": return "3 min";
      default: return "--";
    }
  };

  const userInitials = user ? user.name.split(" ").map(n => n[0]).join("") : "US";

  return (
    <section className="dash-content">
      {toast && <div className="toast"><CheckCircle2 size={16} style={{ marginRight: "6px" }}/> {toast}</div>}
      
      {serverError && (
        <div style={{
          background: "#fff2f0",
          border: "1px solid #ffccc7",
          color: "#cf1322",
          padding: "12px 18px",
          borderRadius: "8px",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
            <AlertCircle size={18} />
            <span>{serverError}</span>
          </div>
          <button
            onClick={retryConnection}
            style={{
              background: "#cf1322",
              color: "#fff",
              border: 0,
              padding: "4px 10px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {user && user.is_email_verified === false && (
        <div
          style={{
            background: "#fffbe6",
            border: "1px solid #ffe58f",
            color: "#ad6800",
            padding: "14px 18px",
            borderRadius: "10px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "14px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
            <AlertCircle size={18} color="#faad14" style={{ flexShrink: 0 }} />
            <span>
              <strong>Action Required:</strong> Please verify your email (<strong>{user.email}</strong>). Click the link in your inbox within 24 hours to enable ordering medicines.
            </span>
          </div>
          <a
            href={`/verify-email`}
            style={{
              background: "#d48806",
              color: "#ffffff",
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            Verify Now
          </a>
        </div>
      )}

      <div className="welcome">
        <div>
          <p>TODAY</p>
          <h1>Hello, {user ? user.name.split(" ")[0] : "Guest"} <span>✦</span></h1>
          <h2>{user ? "What can we help you feel better about today?" : "Sign in to track orders and consult licensed pharmacists."}</h2>
        </div>
        <button className="primary" onClick={() => location.href = "/medicines"}>
          <Plus size={17} />New order
        </button>
      </div>

      <div className="action-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        <button className="dash-action orange" onClick={() => location.href = "/medicines"}>
          <span><Search /></span>
          <div>
            <b>Search medicines</b>
            <small>Find what you already know</small>
          </div>
        </button>
        <button className="dash-action green" onClick={() => location.href = "/pharmacies"}>
          <span><Store /></span>
          <div>
            <b>Order by pharmacy</b>
            <small>Choose your local chemist</small>
          </div>
        </button>
        <button className="dash-action purple" onClick={() => location.href = "/ai-doctor"}>
          <span><HeartPulse /></span>
          <div>
            <b>Ask MediAssist</b>
            <small>Describe symptoms in any language</small>
          </div>
        </button>
      </div>

      <div className="dash-grid">
        {activeOrder ? (
          <section className="order-card card">
            <div className="card-title">
              <div>
                <p>ACTIVE ORDER · {activeOrder.id}</p>
                <h3>{activeOrder.status === "Placed" ? "Waiting for confirmation" : activeOrder.status === "Review" ? "Under pharmacist review" : "On its way to you"}</h3>
              </div>
              <button onClick={() => location.href = "/user/orders"}>Track order</button>
            </div>
            <div className="order-body">
              <div className="delivery-orb"><PackageCheck size={38} /></div>
              <div>
                <b>{activeOrder.pharmacyName || "Assigned Local Pharmacy"}</b>
                <p><MapPin size={14} /> {activeOrder.address.split(",")[0]}</p>

                <div className="progress">
                  <i style={{ width: getProgressPercentage(activeOrder.status) }}></i>
                </div>
                <div className="progress-labels">
                  <span className={activeOrder.status === "Placed" ? "now" : ""}>Placed</span>
                  <span className={["Review", "Confirmed"].includes(activeOrder.status) ? "now" : ""}>Confirmed</span>
                  <span className={activeOrder.status === "Packing" ? "now" : ""}>Packing</span>
                  <span className={["Shipped", "Arriving"].includes(activeOrder.status) ? "now" : ""}>Arriving</span>
                </div>
              </div>
              <div className="eta-box">
                <Clock3 size={18} />
                <b>{getETA(activeOrder.status)}</b>
                <small>estimated</small>
              </div>
            </div>
          </section>
        ) : (
          <section className="order-card card" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "30px 20px" }}>
            <ShoppingBag size={38} style={{ color: "#227f5e", marginBottom: "12px" }} />
            <b>No active orders</b>
            <p style={{ color: "#75847e", fontSize: "12px", margin: "6px 0 15px", textAlign: "center" }}>You don&apos;t have any active orders right now.</p>
            <button className="primary" onClick={() => location.href = "/medicines"} style={{ padding: "8px 16px", fontSize: "12px" }}>
              Shop medicines
            </button>
          </section>
        )}

        <section className="quick-card card">
          <div className="card-title">
            <div>
              <p>QUICK REORDER</p>
              <h3>Your regulars</h3>
            </div>
            <button className="plain" onClick={() => location.href = "/medicines"}>View all</button>
          </div>
          <div className="medicine-list">
            {regularMedicines.length > 0 ? (
              regularMedicines.map((med, idx) => (
                <div key={idx}>
                  <span className={`med-icon ${idx % 2 === 1 ? "blue" : ""}`}>
                    {med.name.charAt(0).toUpperCase()}
                  </span>
                  <p>
                    <b>{med.name}</b>
                    <small>{med.brand}</small>
                  </p>
                  <button onClick={() => handleAdd(med.id, med.name)}>+ Add</button>
                </div>
              ))
            ) : (
              <div style={{ padding: "16px 0", textAlign: "center", color: "#6b8077", fontSize: "13px" }}>
                <p style={{ margin: "0 0 10px 0" }}>No past orders yet. Browse our verified pharmacy inventory to place your first order.</p>
                <button
                  className="plain"
                  style={{ color: "#227f5e", fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}
                  onClick={() => (location.href = "/medicines")}
                >
                  Explore Medicines →
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="lower-grid">
        <section className="profile-card card">
          <div className="card-title">
            <div>
              <p>HEALTH PROFILE</p>
              <h3>Care, tailored to you</h3>
            </div>
            <button className="plain" onClick={() => location.href = "/user/profile"}>Edit profile</button>
          </div>
          <div className="profile-content">
            <div className="avatar-large">{userInitials}</div>
            <div>
              <b>{user?.name || "Guest User"}</b>
              <p>{user?.age ? `${user.age} years` : "Age not set"} · {user?.gender || "Not specified"}</p>
              <div className="profile-tags">
                <span>✦ {user?.allergies || "No allergies listed"}</span>
                <span><MapPin size={12} /> {user?.address ? (user.address.split(",")[1] || user.address.split(",")[0]) : "Location not set"}</span>
              </div>
            </div>
          </div>
          <div className="profile-details">
            <div>
              <small>Mobile number</small>
              <b>{user?.phone || "--"}</b>
            </div>
            <div>
              <small>Email address</small>
              <b>{user?.email || "Not signed in"}</b>
            </div>
            <div>
              <small>Blood group</small>
              <b>{user?.bloodGroup ? `${user.bloodGroup} Positive` : "--"}</b>
            </div>
          </div>
        </section>

        <section className="recent-card card">
          <div className="card-title">
            <div>
              <p>RECENT ACTIVITY</p>
              <h3>Order history</h3>
            </div>
            <button className="plain" onClick={() => location.href = "/user/orders"}>View all</button>
          </div>
          {historicOrders.length > 0 ? (
            historicOrders.map(order => (
              <div className="recent-row" key={order.id}>
                <span className="mini-orb"><Pill size={17} /></span>
                <div style={{ flex: 1 }}>
                  <b style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", display: "block", maxWidth: "160px" }}>{order.itemsSummary}</b>
                  <small>{order.itemsList.length} item{order.itemsList.length !== 1 && "s"} · {order.time}</small>
                </div>
                <span className="complete" style={{ background: order.status === "Cancelled" ? "#fee2e2" : "#e5f4ec", color: order.status === "Cancelled" ? "#ef4444" : "#27815f" }}>
                  {order.status}
                </span>
              </div>
            ))
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0", color: "#82918b" }}>
              <ClipboardList size={22} style={{ marginBottom: "8px" }} />
              <span style={{ fontSize: "11px" }}>No past orders found</span>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}


