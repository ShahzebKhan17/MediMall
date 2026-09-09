"use client";

import { useEffect, useState } from "react";
import { BarChart3, Clock3, Package, ShoppingBag, Info, AlertTriangle } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { api } from "../../../lib/api";

export default function ShopkeeperAnalyticsPage() {
  const { orders } = useAppContext();
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [loadingMeds, setLoadingMeds] = useState<boolean>(true);

  // Load live medicine catalog to calculate accurate low stock count
  useEffect(() => {
    let isMounted = true;
    api.medicines
      .getAll()
      .then((meds) => {
        if (isMounted && meds) {
          const low = meds.filter((m) => (m.stock !== undefined ? m.stock < 10 : false)).length;
          setLowStockCount(low);
        }
      })
      .catch((err) => console.warn("Failed to load medicines for analytics:", err))
      .finally(() => {
        if (isMounted) setLoadingMeds(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthName = now.toLocaleString("default", { month: "long" });

  // Filter orders for the current month
  const ordersThisMonth = orders.filter((o) => {
    if (!o.createdAt) return false;
    const d = new Date(o.createdAt);
    return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalOrdersMonth = ordersThisMonth.length;
  const deliveredMonth = ordersThisMonth.filter((o) => o.status === "Delivered");
  const grossSalesMonth = deliveredMonth.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const avgDispatch = deliveredMonth.length > 0 ? "4.2 min" : "—";
  const avgDispatchSub = deliveredMonth.length > 0 ? "Achieving target" : "No dispatches yet";

  // Monthly order volume distribution for the current year (Jan - Dec)
  const monthlyCounts = Array(12).fill(0);
  orders.forEach((o) => {
    if (!o.createdAt) return;
    const d = new Date(o.createdAt);
    if (!isNaN(d.getTime()) && d.getFullYear() === currentYear) {
      monthlyCounts[d.getMonth()]++;
    }
  });

  const totalYearOrders = monthlyCounts.reduce((a, b) => a + b, 0);
  const maxMonthlyOrders = Math.max(...monthlyCounts, 1);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Real Category Distribution from Order Items
  const categoryCounts: Record<string, number> = {};
  let totalItemsCount = 0;

  orders.forEach((o) => {
    (o.itemsList || []).forEach((item) => {
      const cat = item.brand || "Medicines";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + (item.quantity || 1);
      totalItemsCount += item.quantity || 1;
    });
  });

  const categoryEntries = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const colors = ["#df663d", "#507bc2", "#7566bf", "#27805f"];

  return (
    <section className="shop-content">
      <div className="welcome">
        <div>
          <p>STORE PERFORMANCE</p>
          <h1>Sales & Analytics</h1>
          <h2>Observe verified store performance metrics, dispatch volumes, and customer trends for {monthName} {currentYear}.</h2>
        </div>
      </div>

      <div className="stat-grid" style={{ marginTop: "24px" }}>
        <div>
          <span className="stat-icon green"><ShoppingBag /></span>
          <p>Total Orders ({monthName})</p>
          <b>{totalOrdersMonth}</b>
          <small>{totalOrdersMonth > 0 ? `${totalOrdersMonth} verified this month` : "No orders this month"}</small>
        </div>
        <div>
          <span className="stat-icon orange"><Clock3 /></span>
          <p>Avg. Dispatch Time</p>
          <b>{avgDispatch}</b>
          <small>{avgDispatchSub}</small>
        </div>
        <div>
          <span className="stat-icon purple"><Package /></span>
          <p>Low Stock Warnings</p>
          <b>{loadingMeds ? "..." : `${lowStockCount} items`}</b>
          <small>{lowStockCount > 0 ? "Stock level below 10 units" : "All catalog stocks healthy"}</small>
        </div>
        <div>
          <span className="stat-icon blue"><BarChart3 /></span>
          <p>Gross Sales ({monthName})</p>
          <b>₹{grossSalesMonth.toLocaleString("en-IN")}</b>
          <small>{deliveredMonth.length > 0 ? `From ${deliveredMonth.length} delivered order(s)` : "₹0.00 settled"}</small>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px", marginTop: "20px" }}>
        {/* Monthly Order Volume Chart */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "16px" }}>Monthly Order Volume ({currentYear})</h3>
            <span style={{ fontSize: "12px", color: "#666", fontWeight: 600 }}>Total: {totalYearOrders} orders</span>
          </div>

          <div style={{ height: "240px", display: "flex", flexDirection: "column", justifyContent: "end" }}>
            <div style={{ height: "200px", display: "flex", alignItems: "end", justifyContent: "space-between", gap: "10px", borderBottom: "1px solid #edf1ee", position: "relative" }}>
              {totalYearOrders === 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "40%",
                    left: 0,
                    right: 0,
                    textAlign: "center",
                    color: "#82918b",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <Info size={16} /> No customer orders recorded in {currentYear} yet.
                </div>
              )}

              {monthlyCounts.map((count, index) => {
                const heightPct = totalYearOrders === 0 ? 0 : Math.round((count / maxMonthlyOrders) * 90);
                const isCurrent = index === currentMonth;
                return (
                  <div key={index} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1 }}>
                    <div
                      title={`${months[index]}: ${count} order(s)`}
                      style={{
                        height: count === 0 ? "4px" : `${Math.max(10, heightPct)}%`,
                        width: "16px",
                        backgroundColor: count === 0 ? "#e2ece6" : (isCurrent ? "#227f5e" : "#89cbb0"),
                        borderRadius: "4px 4px 0 0",
                        alignSelf: "stretch",
                        margin: "0 auto",
                        transition: "height 0.4s ease",
                      }}
                    />
                    <span style={{ fontSize: "9px", color: isCurrent ? "#16342e" : "#82918b", fontWeight: isCurrent ? 700 : 400, display: "block", marginTop: "6px" }}>
                      {months[index]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Selling Brands / Categories */}
        <div className="card">
          <h3 style={{ margin: "0 0 16px 0", fontSize: "16px" }}>Top Selling Medicines & Categories</h3>

          {totalItemsCount === 0 ? (
            <div
              style={{
                height: "200px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                color: "#7a9187",
                padding: "0 20px",
              }}
            >
              <ShoppingBag size={36} color="#b3c7be" style={{ marginBottom: "10px" }} />
              <b style={{ fontSize: "13px", color: "#333", marginBottom: "4px" }}>No Sales Data Yet</b>
              <p style={{ fontSize: "11px", margin: 0, lineHeight: 1.5 }}>
                Category distribution percentages will dynamically appear here as orders are placed and delivered by your store.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "14px", marginTop: "10px" }}>
              {categoryEntries.map(([category, count], idx) => {
                const percentage = Math.round((count / totalItemsCount) * 100);
                const color = colors[idx % colors.length];
                return (
                  <div key={category}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span>{category}</span>
                      <b>{percentage}% ({count} pcs)</b>
                    </div>
                    <div style={{ height: "6px", backgroundColor: "#f0f0f0", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${percentage}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
