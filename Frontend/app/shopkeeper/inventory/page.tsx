"use client";

import { useEffect, useState } from "react";
import { Pill, Plus, Search, ShieldCheck, X } from "lucide-react";
import { api } from "../../../lib/api";

interface InventoryItem {
  id: number;
  name: string;
  brand: string;
  price: number;
  stock: number;
  type: string;
  rx: boolean;
  status: "In Stock" | "Low Stock" | "Out of Stock";
}

const defaultInventory: InventoryItem[] = [
  { id: 1, name: "Paracetamol 650mg", brand: "Dolo 650 · Strip of 15 tablets", price: 34, stock: 124, type: "Pain relief", rx: false, status: "In Stock" },
  { id: 2, name: "Cetirizine 10mg", brand: "Cetzine · Strip of 10 tablets", price: 28, stock: 82, type: "Allergy care", rx: false, status: "In Stock" },
  { id: 3, name: "Vitamin D3 60K", brand: "Uprise-D3 · Pack of 4 capsules", price: 116, stock: 4, type: "Vitamins", rx: false, status: "Low Stock" },
  { id: 4, name: "Amoxicillin 500mg", brand: "Mox 500 · Strip of 10 capsules", price: 133, stock: 0, type: "Antibiotic", rx: true, status: "Out of Stock" },
];

export default function ShopkeeperInventoryPage() {
  const [query, setQuery] = useState("");
  const [inventory, setInventory] = useState<InventoryItem[]>(defaultInventory);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMed, setNewMed] = useState({
    name: "",
    brand: "",
    price: 50,
    type: "Pain relief",
    stock: 100,
    rx: false,
  });

  const loadInventory = () => {
    api.medicines.getAll().then((data) => {
      if (data && data.length > 0) {
        const mapped: InventoryItem[] = data.map((m) => {
          const stock = m.stock !== undefined ? m.stock : 50;
          let status: "In Stock" | "Low Stock" | "Out of Stock" = "In Stock";
          if (stock <= 0) status = "Out of Stock";
          else if (stock < 10) status = "Low Stock";
          return {
            id: m.id,
            name: m.name,
            brand: m.brand,
            price: m.price,
            stock,
            type: m.type,
            rx: m.rx,
            status,
          };
        });
        setInventory(mapped);
      }
    }).catch((e) => {
      console.warn("Backend medicines fetch skipped:", e);
    });
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const toggleStatus = async (id: number) => {
    const item = inventory.find((it) => it.id === id);
    if (!item) return;

    const newStatus = item.status === "In Stock" ? "Out of Stock" : "In Stock";
    const newStock = newStatus === "Out of Stock" ? 0 : 50;

    // Optimistic UI update
    setInventory(
      inventory.map((it) => (it.id === id ? { ...it, status: newStatus, stock: newStock } : it))
    );

    // Backend update
    try {
      await api.medicines.update(id, { stock: newStock });
    } catch (e) {
      console.warn("Backend stock update error:", e);
    }
  };

  const handleCreateMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMed.name.trim()) return;

    try {
      await api.medicines.create(newMed);
      setIsAddModalOpen(false);
      setNewMed({ name: "", brand: "", price: 50, type: "Pain relief", stock: 100, rx: false });
      loadInventory();
    } catch (e: any) {
      alert("Error adding item: " + (e.message || "Failed"));
    }
  };

  const filtered = inventory.filter(item => 
    item.name.toLowerCase().includes(query.toLowerCase()) || 
    item.brand.toLowerCase().includes(query.toLowerCase()) ||
    item.type.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <section className="shop-content">
      <div className="welcome">
        <div>
          <p>STOCKS</p>
          <h1>Medicine Inventory</h1>
          <h2>Manage medicine availability, pricing, and warning counts.</h2>
        </div>
        <button className="primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={17} /> Add item
        </button>
      </div>

      {isAddModalOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "grid",
          placeItems: "center",
          zIndex: 100,
        }}>
          <div style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            padding: "24px",
            width: "90%",
            maxWidth: "480px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px" }}>Add New Medicine to Database</h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: "none", border: 0, cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateMedicine} style={{ display: "grid", gap: "12px", fontSize: "13px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "4px", color: "#555" }}>Medicine Name</label>
                <input 
                  required 
                  value={newMed.name} 
                  onChange={(e) => setNewMed({ ...newMed, name: e.target.value })} 
                  placeholder="e.g. Azithromycin 500mg" 
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #ccc" }} 
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", color: "#555" }}>Brand / Package Info</label>
                <input 
                  required 
                  value={newMed.brand} 
                  onChange={(e) => setNewMed({ ...newMed, brand: e.target.value })} 
                  placeholder="e.g. Azithral · Strip of 5 tablets" 
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #ccc" }} 
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "4px", color: "#555" }}>Price (₹)</label>
                  <input 
                    type="number" 
                    required 
                    value={newMed.price} 
                    onChange={(e) => setNewMed({ ...newMed, price: Number(e.target.value) })} 
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #ccc" }} 
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "4px", color: "#555" }}>Initial Stock</label>
                  <input 
                    type="number" 
                    required 
                    value={newMed.stock} 
                    onChange={(e) => setNewMed({ ...newMed, stock: Number(e.target.value) })} 
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #ccc" }} 
                  />
                </div>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", color: "#555" }}>Category / Type</label>
                <input 
                  value={newMed.type} 
                  onChange={(e) => setNewMed({ ...newMed, type: e.target.value })} 
                  placeholder="e.g. Antibiotics, Pain relief, Vitamins" 
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #ccc" }} 
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <input 
                  type="checkbox" 
                  id="rx-checkbox" 
                  checked={newMed.rx} 
                  onChange={(e) => setNewMed({ ...newMed, rx: e.target.checked })} 
                />
                <label htmlFor="rx-checkbox">Requires Doctor Prescription (Schedule H / Rx)</label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ padding: "8px 14px", border: "1px solid #ddd", background: "#f5f5f5", borderRadius: "6px", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" className="primary" style={{ padding: "8px 16px" }}>
                  Save Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

