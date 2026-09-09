"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Camera, Check, Image as ImageIcon, Loader2, Pill, Plus, RefreshCw, Search, ShieldCheck, SwitchCamera, Trash2, Upload, X } from "lucide-react";
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

  // Live Camera states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async (facing: "environment" | "user" = facingMode) => {
    setPhotoError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => console.warn("Video play error:", err));
      }
    } catch (err: any) {
      console.warn("Camera access error:", err);
      setIsCameraActive(false);
      setPhotoError("Unable to access camera. Please check browser permissions or upload an image file.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const switchFacingMode = async () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    if (isCameraActive) {
      await startCamera(nextMode);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setPhotoError("Camera not ready yet, please wait a moment.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const capturedFile = new File([blob], `medicine_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        setSelectedFile(capturedFile);
        const previewUrl = URL.createObjectURL(blob);
        setImagePreview(previewUrl);
        stopCamera();
      },
      "image/jpeg",
      0.92
    );
  };

  // Ensure camera stream is stopped when unmounting
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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
    stopCamera();
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
            justifyContent: "space-between",
            gap: "10px",
            fontSize: "13px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertCircle size={18} /> {fetchError}
          </div>
          <button
            onClick={loadInventory}
            style={{
              background: "#cf1322",
              color: "#fff",
              border: 0,
              padding: "5px 12px",
              borderRadius: "5px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
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
              {/* Photo Upload / Camera Section */}
              <div style={{ background: "#f8faf9", border: "1px dashed #b6d3c6", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: "8px" }}>
                  <Camera size={16} color="#227f5e" />
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#227f5e" }}>
                    Medicine Packaging Photo (Live Camera or File)
                  </label>
                </div>

                {/* If live camera is active */}
                {isCameraActive ? (
                  <div style={{ position: "relative", maxWidth: "340px", margin: "0 auto", borderRadius: "10px", overflow: "hidden", background: "#111", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                    <video
                      ref={(el) => {
                        videoRef.current = el;
                        if (el && streamRef.current && el.srcObject !== streamRef.current) {
                          el.srcObject = streamRef.current;
                          el.play().catch(() => {});
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      style={{ width: "100%", height: "220px", objectFit: "cover", display: "block" }}
                    />

                    {/* Camera overlay header */}
                    <div style={{ position: "absolute", top: "8px", left: "8px", right: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ background: "rgba(0,0,0,0.6)", color: "#fff", padding: "3px 8px", borderRadius: "12px", fontSize: "10px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }}></span>
                        Live Camera
                      </span>
                      <button
                        type="button"
                        onClick={switchFacingMode}
                        title="Switch Camera (Front / Back)"
                        style={{ background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "20px", padding: "4px 8px", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        <SwitchCamera size={12} /> Flip
                      </button>
                    </div>

                    {/* Camera capture controls footer */}
                    <div style={{ padding: "10px", background: "rgba(0,0,0,0.75)", display: "flex", justifyContent: "center", gap: "12px", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={capturePhoto}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 18px",
                          background: "#227f5e",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "20px",
                          fontWeight: 700,
                          fontSize: "12px",
                          cursor: "pointer",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                        }}
                      >
                        <Camera size={15} /> Snap Photo
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        style={{
                          padding: "8px 14px",
                          background: "rgba(255,255,255,0.2)",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "20px",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : imagePreview ? (
                  /* Captured or Selected Preview */
                  <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{ width: "110px", height: "110px", objectFit: "cover", borderRadius: "10px", border: "2px solid #227f5e", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
                      />
                      <button
                        type="button"
                        onClick={removeSelectedPhoto}
                        title="Remove photo"
                        style={{
                          position: "absolute",
                          top: "-8px",
                          right: "-8px",
                          background: "#ef4444",
                          color: "#fff",
                          border: 0,
                          borderRadius: "50%",
                          width: "22px",
                          height: "22px",
                          display: "grid",
                          placeItems: "center",
                          cursor: "pointer",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                        }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", color: "#227f5e", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Check size={13} /> Ready to upload
                      </span>
                      <button
                        type="button"
                        onClick={() => startCamera(facingMode)}
                        style={{ background: "none", border: "none", color: "#555", fontSize: "11px", textDecoration: "underline", cursor: "pointer" }}
                      >
                        Retake
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Initial state: Live Camera or File Upload */
                  <div>
                    <p style={{ color: "#66706c", fontSize: "12px", margin: "0 0 10px 0" }}>
                      Take a direct snapshot with your camera or select an image file:
                    </p>
                    <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => startCamera(facingMode)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 14px",
                          background: "#227f5e",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: 600,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        }}
                      >
                        <Camera size={16} /> Open Camera
                      </button>

                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        capture="environment"
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
                          padding: "8px 14px",
                          background: "#ffffff",
                          border: "1px solid #c2d6cd",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#227f5e",
                        }}
                      >
                        <Upload size={16} /> Browse File
                      </label>
                    </div>
                    <small style={{ display: "block", color: "#82918b", fontSize: "10px", marginTop: "8px" }}>
                      Supports webcam, mobile rear camera (environment), or PNG/JPG file up to 10 MB
                    </small>
                  </div>
                )}

                {photoError && (
                  <small style={{ color: "#cf1322", display: "block", marginTop: "8px", fontWeight: 500 }}>
                    {photoError}
                  </small>
                )}
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
