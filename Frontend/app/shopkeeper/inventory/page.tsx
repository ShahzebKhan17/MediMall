"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Camera, Check, Image as ImageIcon, Loader2, Pill, Plus, RefreshCw, Search, ShieldCheck, Trash2, Upload, X } from "lucide-react";
import { api, getMediaUrl } from "../../../lib/api";

interface InventoryItem {
  id: number;
  name: string;
  brand: string;
  price: number;
  stock: number;
  type: string;
  rx: boolean;
  image_url?: string;
  packaging_type?: string;
  status: "In Stock" | "Low Stock" | "Out of Stock";
}

export default function ShopkeeperInventoryPage() {
  const [query, setQuery] = useState("");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New medicine form state
  const [newMed, setNewMed] = useState({
    name: "",
    brand: "",
    price: 50,
    type: "Pain relief",
    stock: 100,
    rx: false,
    image_url: "",
    packaging_type: "",
    salt_composition: "",
  });

  // Photo upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadInventory = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      // Fetch only the authenticated pharmacy's isolated inventory
      const data = await api.medicines.getInventory();
      if (data) {
        const mapped: InventoryItem[] = data.map((m) => {
          const stock = m.stock !== undefined ? m.stock : 0;
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
            image_url: m.image_url,
            packaging_type: m.packaging_type,
            status,
          };
        });
        setInventory(mapped);
      }
    } catch (e: any) {
      console.warn("Backend medicines fetch error:", e);
      setFetchError("Unable to connect to the backend server to load inventory.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      setPhotoError("Image size exceeds 10 MB limit.");
      return;
    }

    setSelectedFile(file);
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);
  };

  const removeSelectedPhoto = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setNewMed({ ...newMed, image_url: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
      showToast(`Stock updated for ${item.name}`);
    } catch (e) {
      console.warn("Backend stock update error:", e);
      alert("Failed to sync stock change to database.");
      loadInventory();
    }
  };

  const handleDeleteMedicine = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from your store inventory?`)) {
      return;
    }

    try {
      await api.medicines.delete(id);
      showToast(`Deleted "${name}" from inventory`);
      await loadInventory();
    } catch (err: any) {
      alert("Failed to delete medicine: " + (err?.message || "Unknown error"));
    }
  };

  const handleCreateMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMed.name.trim()) return;

    try {
      let finalImageUrl = newMed.image_url;

      // If user selected a photo file, upload it first
      if (selectedFile) {
        setIsUploadingPhoto(true);
        try {
          const uploadRes = await api.medicines.uploadImage(selectedFile);
          if (uploadRes?.image_url) {
            finalImageUrl = uploadRes.image_url;
          }
        } catch (uploadErr: any) {
          console.warn("Image upload failed, proceeding without photo:", uploadErr);
          alert("Photo upload failed: " + (uploadErr?.message || "Please check image format."));
          setIsUploadingPhoto(false);
          return;
        } finally {
          setIsUploadingPhoto(false);
        }
      }

      await api.medicines.create({
        ...newMed,
        image_url: finalImageUrl,
      });

      setIsAddModalOpen(false);
      removeSelectedPhoto();
      setNewMed({
        name: "",
        brand: "",
        price: 50,
        type: "Pain relief",
        stock: 100,
        rx: false,
        image_url: "",
        packaging_type: "",
        salt_composition: "",
      });

      showToast("Medicine added to your store inventory!");
      await loadInventory();
    } catch (e: any) {
      alert("Error adding item: " + (e.message || "Failed"));
    }
  };

  const filtered = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.brand.toLowerCase().includes(query.toLowerCase()) ||
      item.type.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <section className="shop-content">
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "#16342e",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
          }}
        >
          <Check size={16} color="#4ade80" /> {toastMessage}
        </div>
      )}

      <div className="welcome">
        <div>
          <p>STORE INVENTORY</p>
          <h1>Medicine Inventory</h1>
          <h2>Manage your pharmacy&apos;s product catalog, pricing, packaging photos, and stock levels.</h2>
        </div>
        <button className="primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={17} /> Add item
        </button>
      </div>

      {fetchError && (
        <div
          style={{
            background: "#fff1f0",
            border: "1px solid #ffa39e",
            padding: "12px 16px",
            borderRadius: "8px",
            marginTop: "16px",
            color: "#cf1322",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "13px",
          }}
        >
          <AlertCircle size={18} /> {fetchError}
        </div>
      )}

      {/* Add Medicine Modal */}
      {isAddModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "grid",
            placeItems: "center",
            zIndex: 999,
            padding: "20px",
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "520px",
              padding: "24px",
              borderRadius: "12px",
              background: "#fff",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "17px" }}>Register New Medicine</h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  removeSelectedPhoto();
                }}
                style={{ border: 0, background: "none", cursor: "pointer", color: "#888" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateMedicine} style={{ display: "grid", gap: "12px", fontSize: "13px" }}>
              {/* Photo Upload Section */}
              <div style={{ background: "#f8faf9", border: "1px dashed #b6d3c6", borderRadius: "8px", padding: "14px", textAlign: "center" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "8px", color: "#227f5e" }}>
                  Product / Packaging Photo (Helps Customers Identify Medicine)
                </label>

                {imagePreview ? (
                  <div style={{ position: "relative", display: "inline-block" }}>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px", border: "1px solid #ccd8d1" }}
                    />
                    <button
                      type="button"
                      onClick={removeSelectedPhoto}
                      style={{
                        position: "absolute",
                        top: "-6px",
                        right: "-6px",
                        background: "#ef4444",
                        color: "#fff",
                        border: 0,
                        borderRadius: "50%",
                        width: "20px",
                        height: "20px",
                        display: "grid",
                        placeItems: "center",
                        cursor: "pointer",
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={handlePhotoSelect}
                      style={{ display: "none" }}
                      id="med-photo-input"
                    />
                    <label
                      htmlFor="med-photo-input"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 16px",
                        background: "#ffffff",
                        border: "1px solid #c2d6cd",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#227f5e",
                      }}
                    >
                      <Camera size={16} /> Choose / Photograph Packaging
                    </label>
                    <small style={{ display: "block", color: "#82918b", fontSize: "10px", marginTop: "6px" }}>
                      PNG, JPG, WEBP up to 10 MB
                    </small>
                  </div>
                )}

                {photoError && <small style={{ color: "#cf1322", display: "block", marginTop: "4px" }}>{photoError}</small>}
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px", color: "#555", fontWeight: 600 }}>Medicine Name *</label>
                <input
                  value={newMed.name}
                  onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                  placeholder="e.g. Paracetamol 650mg, Dolo 650"
                  required
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #ccc", outline: "none" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "4px", color: "#555", fontWeight: 600 }}>Brand / Packaging *</label>
                  <input
                    value={newMed.brand}
                    onChange={(e) => setNewMed({ ...newMed, brand: e.target.value })}
                    placeholder="e.g. Micro Labs · Strip of 15"
                    required
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #ccc", outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "4px", color: "#555", fontWeight: 600 }}>Therapeutic Type</label>
                  <select
                    value={newMed.type}
                    onChange={(e) => setNewMed({ ...newMed, type: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #ccc", background: "#fff", outline: "none" }}
                  >
                    <option value="Pain relief & Fever">Pain relief & Fever</option>
                    <option value="Antibiotic (Prescription)">Antibiotic (Prescription)</option>
                    <option value="Allergy & Respiratory">Allergy & Respiratory</option>
                    <option value="Antacid & Digestion">Antacid & Digestion</option>
                    <option value="Vitamins & Minerals">Vitamins & Minerals</option>
                    <option value="Hydration & Supplements">Hydration & Supplements</option>
                    <option value="General Wellness">General Wellness</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "4px", color: "#555", fontWeight: 600 }}>Selling Price (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    value={newMed.price}
                    onChange={(e) => setNewMed({ ...newMed, price: Number(e.target.value) })}
                    required
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #ccc", outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "4px", color: "#555", fontWeight: 600 }}>Available Stock Units *</label>
                  <input
                    type="number"
                    min="0"
                    value={newMed.stock}
                    onChange={(e) => setNewMed({ ...newMed, stock: Number(e.target.value) })}
                    required
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #ccc", outline: "none" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px", color: "#555", fontWeight: 600 }}>Salt / Active Chemical Composition</label>
                <input
                  value={newMed.salt_composition}
                  onChange={(e) => setNewMed({ ...newMed, salt_composition: e.target.value })}
                  placeholder="e.g. Paracetamol (650mg)"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #ccc", outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <input
                  type="checkbox"
                  id="rx-checkbox"
                  checked={newMed.rx}
                  onChange={(e) => setNewMed({ ...newMed, rx: e.target.checked })}
                  style={{ width: "16px", height: "16px", accentColor: "#227f5e", cursor: "pointer" }}
                />
                <label htmlFor="rx-checkbox" style={{ cursor: "pointer" }}>Requires Doctor Prescription (Schedule H / Rx)</label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    removeSelectedPhoto();
                  }}
                  style={{ padding: "8px 14px", border: "1px solid #ddd", background: "#f5f5f5", borderRadius: "6px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingPhoto}
                  className="primary"
                  style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  {isUploadingPhoto ? <Loader2 size={16} className="animate-spin" /> : null}
                  {isUploadingPhoto ? "Uploading Photo..." : "Save Medicine"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inventory Table & Empty State */}
      <div className="card" style={{ marginTop: "24px" }}>
        <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
          <div className="shop-search" style={{ width: "100%", maxWidth: "400px" }}>
            <Search size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your inventory items..."
              style={{ border: 0, outline: 0, width: "100%" }}
            />
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#82918b" }}>
            <Loader2 size={28} className="animate-spin" style={{ margin: "0 auto 10px", color: "#227f5e" }} />
            <span style={{ fontSize: "12px" }}>Loading your store inventory...</span>
          </div>
        ) : inventory.length === 0 ? (
          /* Clean Zero-State for Stores Starting from Scratch */
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "#e8f5ef",
                color: "#227f5e",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 16px",
              }}
            >
              <Pill size={32} />
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: "18px" }}>Your Store Inventory is Empty</h3>
            <p style={{ color: "#7a9187", fontSize: "13px", maxWidth: "440px", margin: "0 auto 20px", lineHeight: 1.5 }}>
              Manage your stock completely from scratch. Add your medicines with custom prices, quantities, and packaging photos.
            </p>
            <button
              className="primary"
              onClick={() => setIsAddModalOpen(true)}
              style={{ padding: "10px 20px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={16} /> Add Your First Medicine
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #edf1ee", textAlign: "left", color: "#82918b" }}>
                  <th style={{ padding: "12px 8px" }}>Medicine & Packaging</th>
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
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "6px",
                            overflow: "hidden",
                            background: "#f0f8f4",
                            border: "1px solid #dce8e1",
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          {item.image_url ? (
                            <img src={getMediaUrl(item.image_url)} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <Pill size={18} color="#227f5e" />
                          )}
                        </div>
                        <div>
                          <b>{item.name}</b>
                          {item.rx && (
                            <span style={{ marginLeft: "6px", fontSize: "9px", background: "#fee2e2", color: "#dc2626", padding: "1px 5px", borderRadius: "3px", fontWeight: 700 }}>
                              Rx
                            </span>
                          )}
                          <small style={{ display: "block", color: "#82918b", fontSize: "10px" }}>{item.packaging_type || item.brand}</small>
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
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
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
                          Toggle Stock
                        </button>
                        <button
                          onClick={() => handleDeleteMedicine(item.id, item.name)}
                          title="Delete medicine"
                          style={{
                            padding: "5px 8px",
                            fontSize: "11px",
                            border: "1px solid #fecaca",
                            backgroundColor: "#fff",
                            color: "#ef4444",
                            borderRadius: "5px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
