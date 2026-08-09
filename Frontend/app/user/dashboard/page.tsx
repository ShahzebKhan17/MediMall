"use client";

import { useState } from "react";
import { ClipboardList, Clock3, FileText, HeartPulse, MapPin, PackageCheck, Pill, Plus, Search, ShoppingBag } from "lucide-react";
import { useAppContext } from "../../context/AppContext";

export default function UserDashboard() {
  const { user, orders, addToCart } = useAppContext();
  const [toast, setToast] = useState("");

  const handleAdd = (id: number, name: string) => {
    addToCart(id);
    setToast(`Added ${name} to cart`);
    setTimeout(() => setToast(""), 1800);
  };

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
      <div className="welcome">
        <div>
          <p>TODAY</p>
          <h1>Hello, {user?.name.split(" ")[0]} <span>✦</span></h1>
          <h2>What can we help you feel better about today?</h2>
        </div>
        <button className="primary" onClick={() => location.href = "/medicines"}>
          <Plus size={17} />New order
        </button>
      </div>

      <div className="action-grid">
        <button className="dash-action orange" onClick={() => location.href = "/medicines"}>
          <span><Search /></span>
          <div>
            <b>Search medicines</b>
            <small>Find what you already know</small>
          </div>
        </button>
        <button className="dash-action purple" onClick={() => location.href = "/ai-doctor"}>
          <span><HeartPulse /></span>
          <div>
            <b>Ask MediAssist</b>
            <small>Describe symptoms in any language</small>
          </div>
        </button>
        <button className="dash-action green" onClick={() => location.href = "/user/prescriptions"}>
          <span><FileText /></span>
          <div>
            <b>Upload prescription</b>
            <small>Our pharmacist will check it</small>
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
                <b>Care & Cure Pharmacy</b>
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
            <div>
              <span className="med-icon">V</span>
              <p>
                <b>Vitamin D3</b>
                <small>Uprise D3 · 4 capsules</small>
              </p>
              <button onClick={() => handleAdd(3, "Vitamin D3")}>+ Add</button>
            </div>
            <div>
              <span className="med-icon blue">C</span>
              <p>
                <b>Cetirizine 10mg</b>
                <small>Cetzine · 10 tablets</small>
              </p>
              <button onClick={() => handleAdd(2, "Cetirizine 10mg")}>+ Add</button>
            </div>
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
              <b>{user?.name || "Ananya Sharma"}</b>
              <p>{user?.age || 28} years · {user?.gender || "Female"}</p>
              <div className="profile-tags">
                <span>✦ {user?.allergies || "No known allergies"}</span>
                <span><MapPin size={12} /> {user?.address ? user.address.split(",")[1] || user.address.split(",")[0] : "Bengaluru"}</span>
              </div>
            </div>
          </div>
          <div className="profile-details">
            <div>
              <small>Mobile number</small>
              <b>{user?.phone || "+91 98765 43210"}</b>
            </div>
            <div>
              <small>Email address</small>
              <b>{user?.email || "ananya@example.com"}</b>
            </div>
            <div>
              <small>Blood group</small>
              <b>{user?.bloodGroup || "O+"} Positive</b>
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

// Inline fallback for CheckCircle2 in toast
function CheckCircle2({ size, style }: { size?: number, style?: React.CSSProperties }) {
  return <svg style={style} xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle-2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>;
}

