"use client";

import { BarChart3, Clock3, Package, ShoppingBag } from "lucide-react";

export default function ShopkeeperAnalyticsPage() {
  return (
    <section className="shop-content">
      <div className="welcome">
        <div>
          <p>ANALYTICS</p>
          <h1>Sales & Analytics</h1>
          <h2>Observe store performance metrics and customer order trends.</h2>
        </div>
      </div>

      <div className="stat-grid" style={{ marginTop: "24px" }}>
        <div>
          <span className="stat-icon green"><ShoppingBag/></span>
          <p>Total Orders (Month)</p>
          <b>512</b>
          <small>↑ 12% from last month</small>
        </div>
        <div>
          <span className="stat-icon orange"><Clock3/></span>
          <p>Avg. Dispatch Time</p>
          <b>3.8 min</b>
          <small>↓ 0.5 min from target</small>
        </div>
        <div>
          <span className="stat-icon purple"><Package/></span>
          <p>Low Stock Warnings</p>
          <b>2 items</b>
          <small>Need attention soon</small>
        </div>
        <div>
          <span className="stat-icon blue"><BarChart3/></span>
          <p>Gross Sales (Month)</p>
          <b>₹1,84,230</b>
          <small>↑ 8% from last month</small>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px", marginTop: "20px" }}>
        <div className="card">
          <h3 style={{ margin: "0 0 16px 0", fontSize: "16px" }}>Monthly Order Volume</h3>
          <div style={{ height: "240px", display: "flex", flexDirection: "column", justifyContent: "end" }}>
            <div style={{ height: "200px", display: "flex", alignItems: "end", justifyContent: "space-between", gap: "10px", borderBottom: "1px solid #edf1ee" }}>
              {[20, 35, 45, 30, 55, 60, 75, 90, 80, 85, 95, 100].map((height, index) => {
                const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                return (
                  <div key={index} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ height: `${height}%`, width: "16px", backgroundColor: "#b6dfcd", borderRadius: "4px 4px 0 0", alignSelf: "stretch", margin: "0 auto" }}></div>
                    <span style={{ fontSize: "9px", color: "#82918b", display: "block", marginTop: "6px" }}>{months[index]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ margin: "0 0 16px 0", fontSize: "16px" }}>Top Selling Categories</h3>
          <div style={{ display: "grid", gap: "12px", marginTop: "10px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                <span>Pain relief</span>
                <b>45%</b>
              </div>
              <div style={{ height: "6px", backgroundColor: "#f0f0f0", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: "45%", backgroundColor: "#df663d" }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                <span>Allergy care</span>
                <b>30%</b>
              </div>
              <div style={{ height: "6px", backgroundColor: "#f0f0f0", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: "30%", backgroundColor: "#507bc2" }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                <span>Vitamins & Health</span>
                <b>15%</b>
              </div>
              <div style={{ height: "6px", backgroundColor: "#f0f0f0", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: "15%", backgroundColor: "#7566bf" }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                <span>Antibiotics</span>
                <b>10%</b>
              </div>
              <div style={{ height: "6px", backgroundColor: "#f0f0f0", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: "10%", backgroundColor: "#27805f" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
