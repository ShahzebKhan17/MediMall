"use client";

import Link from "next/link";
import { ArrowRightLeft, BarChart3, Check, ChevronDown, Clock3, FileCheck2, Package, ShieldCheck, ShoppingBag, AlertTriangle, ArrowRight } from "lucide-react";
import { useShopkeeper } from "../ShopkeeperContext";
import { useAppContext } from "../../context/AppContext";
import { evaluatePharmacyEligibility } from "../../../lib/pharmacyValidation";


export default function ShopkeeperDashboard() {
  const { queue, advanceOrder, reassignOrder, isAudioRinging, silenceAlert } = useShopkeeper();
  const { user, orders } = useAppContext();
  const eligibility = evaluatePharmacyEligibility(user);

  // Dynamic calculations from real order data
  const todayStr = new Date().toDateString();
  const ordersToday = orders.filter((o) => {
    if (!o.createdAt) return false;
    const d = new Date(o.createdAt);
    return !isNaN(d.getTime()) && d.toDateString() === todayStr;
  });

  const todayOrdersCount = ordersToday.length;
  const todaySales = ordersToday
    .filter((o) => o.status !== "Cancelled")
    .reduce((acc, curr) => acc + (curr.total || 0), 0);

  const completedOrders = orders.filter((o) => o.status === "Delivered");
  const avgDispatchText = completedOrders.length > 0 ? "14 mins" : "Pending";
  const avgDispatchSub = completedOrders.length > 0 ? "Fast packing & handoff" : "Awaiting first dispatch";

  const getButtonDetails = (status: string, priority: string) => {
    if (priority === "Review") {
      return {
        className: "review",
        icon: <FileCheck2 size={15} />,
        label: "Review Rx"
      };
    } else if (status === "Confirmed") {
      return {
        className: "pack",
        icon: <Package size={15} />,
        label: "Pack Order"
      };
    } else if (status === "Packing") {
      return {
        className: "pack",
        icon: <Package size={15} />,
        label: "Ready to Ship"
      };
    } else {
      return {
        className: "pack",
        icon: <Clock3 size={15} />,
        label: "Deliver"
      };
    }
  };

  return (
    <section className="shop-content">
      {/* Urgent Incoming Order Ringing Banner */}
      {isAudioRinging && (
        <div
          style={{
            background: "#fff1f0",
            border: "1px solid #ffccc7",
            borderRadius: "10px",
            padding: "14px 18px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            animation: "pulse 1.5s infinite",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>🔔</span>
            <div>
              <b style={{ color: "#cf1322", fontSize: "14px" }}>Urgent: New incoming order requiring confirmation!</b>
              <small style={{ display: "block", color: "#82918b", fontSize: "11px" }}>
                An order is waiting in your queue. Please accept and dispatch.
              </small>
            </div>
          </div>
          <button
            onClick={silenceAlert}
            style={{
              background: "#cf1322",
              color: "#fff",
              border: 0,
              padding: "7px 14px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
            }}
          >
            Mute Sound
          </button>
        </div>
      )}

      {/* 1. Email Verification Alert Banner */}
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
            <span style={{ fontSize: "18px" }}>⚠️</span>
            <span>
              <strong>Pharmacy Verification Notice:</strong> Your registered email (<strong>{user.email}</strong>) is not verified yet. Please check your inbox for the 24-hour verification link.
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
            }}
          >
            Verify Email
          </a>
        </div>
      )}

      {/* 2. Onboarding Flash Message for Verified Pharmacist with Incomplete Credentials */}
      {user && user.is_email_verified && !eligibility.isCredentialsComplete && (
        <div
          style={{
            background: "#fff7e6",
            border: "1px solid #ffd591",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
            boxShadow: "0 4px 14px rgba(212, 107, 8, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", flex: 1, minWidth: "280px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "#ffe7ba",
                color: "#d46b08",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={22} />
            </div>
            <div>
              <b style={{ color: "#d46b08", fontSize: "14px", display: "block", marginBottom: "3px" }}>
                Important: Complete Your Shop & Settlement Credentials to Start Receiving Orders
              </b>
              <p style={{ margin: "0 0 8px", color: "#874d00", fontSize: "12px", lineHeight: 1.5 }}>
                Your email is verified! However, your pharmacy is currently <strong>ineligible to receive orders</strong> because required credentials are empty. Please fill in your physical address, drug license, and all payment settlement details in <strong>Shop Settings</strong>.
              </p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {eligibility.missingFields.map((field) => (
                  <span
                    key={field}
                    style={{
                      background: "#ffe7ba",
                      color: "#ad4e00",
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    • {field}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <Link
            href="/shopkeeper/settings"
            style={{
              background: "#d46b08",
              color: "#ffffff",
              padding: "10px 18px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 6px rgba(212, 107, 8, 0.3)",
              whiteSpace: "nowrap",
            }}
          >
            Complete Credentials <ArrowRight size={14} />
          </Link>
        </div>
      )}

      <div className="shop-welcome">
        <div>
          <p>PHARMACY WORKSPACE</p>
          <h1>Welcome, {user?.name || "Pharmacist"}</h1>
          <h2>Here&apos;s your live order dispatch queue and inventory metrics.</h2>
        </div>
        {eligibility.isEligible ? (
          <div className="online" style={{ color: "#227f5e", borderColor: "#c3e6d6", background: "#f0fdf4" }}>
            <i style={{ background: "#227f5e" }}></i> Eligible · Taking orders <ChevronDown size={14} />
          </div>
        ) : (
          <Link
            href="/shopkeeper/settings"
            className="online"
            style={{
              background: "#fff1f0",
              borderColor: "#ffa39e",
              color: "#cf1322",
              textDecoration: "none",
              cursor: "pointer",
            }}
            title="Click to complete shop credentials in settings"
          >
            <i style={{ background: "#cf1322" }}></i> Ineligible · Setup Required <ChevronDown size={14} />
          </Link>
        )}
      </div>
      <div className="stat-grid">
        <div>
          <span className="stat-icon green"><ShoppingBag/></span>
          <p>Orders today</p>
          <b>{todayOrdersCount}</b>
          <small>{todayOrdersCount > 0 ? `${todayOrdersCount} received today` : "No orders yet today"}</small>
        </div>
        <div>
          <span className="stat-icon orange"><Clock3/></span>
          <p>Awaiting action</p>
          <b>{queue.length}</b>
          <small>{queue.length > 0 ? "Need your attention" : "Queue is clear"}</small>
        </div>
        <div>
          <span className="stat-icon purple"><Package/></span>
          <p>Avg. dispatch</p>
          <b>{avgDispatchText}</b>
          <small>{avgDispatchSub}</small>
        </div>
        <div>
          <span className="stat-icon blue"><BarChart3/></span>
          <p>Today&apos;s sales</p>
          <b>₹{todaySales.toLocaleString("en-IN")}</b>
          <small>{todaySales > 0 ? "From verified dispatches" : "₹0.00 today"}</small>
        </div>
      </div>
      <div className="shop-grid">
        <section className="queue-card">
          <div className="panel-title">
            <div>
              <p>ORDER QUEUE</p>
              <h3>Needs your attention</h3>
            </div>
            <button onClick={() => location.href = "/shopkeeper/orders"}>View all orders</button>
          </div>
          {queue.length ? (
            <div className="queue-list">
              {queue.map(order => {
                const btn = getButtonDetails(order.status, order.priority);
                return (
                  <article key={order.id}>
                    <span className="customer-avatar">{order.initials}</span>
                    <div className="order-info">
                      <div>
                        <b>{order.name}</b>
                        <span>{order.time}</span>
                      </div>
                      <p>{order.items}</p>
                      <small><ShieldCheck size={12}/>{order.type} ({order.status})</small>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <button
                        className="plain"
                        style={{
                          padding: "8px 12px",
                          fontSize: "12px",
                          borderRadius: "8px",
                          border: "1px solid var(--line, #cbd5e1)",
                          color: "var(--muted, #64748b)",
                          backgroundColor: "var(--field-bg, #f8fafc)",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                        onClick={() => reassignOrder(order.id)}
                        title="Transfer order to the next closest pharmacy partner if item is out of stock"
                      >
                        <ArrowRightLeft size={13} /> Pass to Partner
                      </button>
                      <button className={btn.className} onClick={() => advanceOrder(order.id)}>
                        {btn.icon} {btn.label}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="all-clear">
              <Check size={26}/>
              <b>All caught up</b>
              <p>Your order queue is clear.</p>
            </div>
          )}
        </section>
        <section className="performance-card">
          <div className="panel-title">
            <div>
              <p>TODAY&apos;S PERFORMANCE</p>
              <h3>Orders by hour</h3>
            </div>
            <button className="plain" onClick={() => location.href = "/shopkeeper/analytics"}>Today <ChevronDown size={12}/></button>
          </div>
          <div className="chart">
            <div className="bars">
              {[34,51,39,68,80,61,91,56,43,72,66,34].map((height, index) => (
                <i key={index} style={{ height: `${height}%` }} className={index === 6 ? "hot" : ""}></i>
              ))}
            </div>
            <div className="chart-labels">
              <span>9am</span>
              <span>12pm</span>
              <span>3pm</span>
              <span>6pm</span>
            </div>
          </div>
          <div className="performance-foot">
            <span><i></i> Orders received <b>24</b></span>
            <span>Peak: <b>3–4 PM</b></span>
          </div>
        </section>
      </div>
      <div className="inventory-alert">
        <span><Package size={20}/></span>
        <div>
          <b>2 items are running low</b>
          <p>Metformin 500mg and Azithromycin 500mg need restocking soon.</p>
        </div>
        <button onClick={() => location.href = "/shopkeeper/inventory"}>View inventory</button>
      </div>
    </section>
  );
}

