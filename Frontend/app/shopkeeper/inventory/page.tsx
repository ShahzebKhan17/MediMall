"use client";

import { useState } from "react";
import { Pill, Plus, Search, ShieldCheck } from "lucide-react";

export default function ShopkeeperInventoryPage() {
  const [query, setQuery] = useState("");
  const [inventory, setInventory] = useState([
    { id: 1, name: "Paracetamol 650mg", brand: "Dolo 650 · Strip of 15 tablets", price: 34, stock: 124, type: "Pain relief", rx: false, status: "In Stock" },
    { id: 2, name: "Cetirizine 10mg", brand: "Cetzine · Strip of 10 tablets", price: 28, stock: 82, type: "Allergy care", rx: false, status: "In Stock" },
    { id: 3, name: "Vitamin D3 60K", brand: "Uprise-D3 · Pack of 4 capsules", price: 116, stock: 4, type: "Vitamins", rx: false, status: "Low Stock" },
    { id: 4, name: "Amoxicillin 500mg", brand: "Mox 500 · Strip of 10 capsules", price: 133, stock: 0, type: "Antibiotic", rx: true, status: "Out of Stock" },
  ]);

  const toggleStatus = (id: number) => {
    setInventory(
      inventory.map((item) => {
        if (item.id === id) {
          const newStatus = item.status === "In Stock" ? "Out of Stock" : "In Stock";
          const newStock = newStatus === "Out of Stock" ? 0 : 50;
          return { ...item, status: newStatus, stock: newStock };
        }
        return item;
      })
    );
  };

  const filtered = inventory.filter(item => item.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <section className="shop-content">
      <div className="welcome">
        <div>
          <p>STOCKS</p>
          <h1>Medicine Inventory</h1>
          <h2>Manage medicine availability, pricing, and warning counts.</h2>
        </div>
        <button className="primary" onClick={() => alert("Add medicine flow...")}><Plus size={17} /> Add item</button>
      </div>

      <div className="card" style={{ marginTop: "24px" }}>
        <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
          <div className="shop-search" style={{ width: "100%", maxWidth: "400px" }}>
            <Search size={18} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search inventory items..." style={{ border: 0, outline: 0, width: "100%" }} />
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #edf1ee", textAlign: "left", color: "#82918b" }}>
                <th style={{ padding: "12px 8px" }}>Medicine Name</th>
                <th style={{ padding: "12px 8px" }}>Category</th>
                <th style={{ padding: "12px 8px" }}>Price</th>
                <th style={{ padding: "12px 8px" }}>Stock Level</th>
                <th style={{ padding: "12px 8px" }}>Status</th>
                <th style={{ padding: "12px 8px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #edf1ee" }}>
                  <td style={{ padding: "12px 8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ backgroundColor: "#f0f8f4", color: "#227f5e", width: "28px", height: "28px", borderRadius: "6px", display: "grid", placeItems: "center" }}>
                        <Pill size={15} />
                      </span>
                      <div>
                        <b>{item.name}</b>
                        <small style={{ display: "block", color: "#82918b", fontSize: "10px" }}>{item.brand}</small>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 8px" }}>{item.type}</td>
                  <td style={{ padding: "12px 8px" }}>₹{item.price}</td>
                  <td style={{ padding: "12px 8px" }}><b>{item.stock}</b> items</td>
                  <td style={{ padding: "12px 8px" }}>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: "bold",
                        padding: "3px 6px",
                        borderRadius: "4px",
                        backgroundColor: item.status === "In Stock" ? "#e3f9ed" : item.status === "Low Stock" ? "#fffbeb" : "#fee2e2",
                        color: item.status === "In Stock" ? "#27815f" : item.status === "Low Stock" ? "#b87829" : "#ef4444",
                      }}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "right" }}>
                    <button
                      onClick={() => toggleStatus(item.id)}
                      style={{
                        padding: "5px 10px",
                        fontSize: "11px",
                        border: "1px solid #ddd",
                        backgroundColor: "#fff",
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                    >
                      Toggle Availability
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
