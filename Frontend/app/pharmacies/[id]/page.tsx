"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Clock3,
  MapPin,
  Moon,
  Phone,
  Pill,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  Sun,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAppContext, Medicine } from "../../context/AppContext";
import { useLocation } from "../../context/LocationContext";
import { usePharmacyStoreQuery } from "../../../lib/hooks/useQueries";
import { getMediaUrl } from "../../../lib/api";

export default function PharmacyStorefrontPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const pharmacyId = resolvedParams.id;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [toast, setToast] = useState("");

  const { dark, toggleTheme } = useTheme();
  const { user, role, cart, addToCart, selectedPharmacy, setSelectedPharmacy } = useAppContext();
  const { location, openLocationModal } = useLocation();

  const { data: pharmacy, isLoading, isError, refetch } = usePharmacyStoreQuery(pharmacyId);

  const medicines = useMemo(() => {
    if (!pharmacy?.medicines) return [];
    let list = pharmacy.medicines;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.brand.toLowerCase().includes(q) ||
        (m.salt_composition && m.salt_composition.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== "All") {
      list = list.filter(m => m.type.toLowerCase().includes(selectedCategory.toLowerCase()));
    }

    return list;
  }, [pharmacy, searchQuery, selectedCategory]);

  const handleAddToCart = (med: any) => {
    // Pin order to this pharmacy
    if (pharmacy) {
      setSelectedPharmacy({
        id: pharmacy.id,
        name: pharmacy.name,
        address: pharmacy.address,
        phone: pharmacy.phone,
      });
    }

    addToCart(med.id, med);
    setToast(`Added ${med.name} from ${pharmacy?.name || "pharmacy"}`);
    setTimeout(() => setToast(""), 2200);
  };

  const homeHref = role === "pharmacy" ? "/shopkeeper/dashboard" : "/";
  const userInitials = user ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "U";
  const displayLocation = user?.address ? user.address.split(",")[0] : location.formatted;

  const cartTotal = cart.reduce((sum, item) => {
    const med = item.medicine || pharmacy?.medicines?.find(m => m.id === item.id);
    return sum + (med ? med.price * item.quantity : 0);
  }, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <main className={`order-page ${dark ? "dark" : ""}`} style={{ minHeight: "100vh", paddingBottom: "100px" }}>
      {toast && <div className="toast"><Check size={16} />{toast}</div>}

      <header className="order-nav">
        <a className="brand" href={homeHref}>
          <span className="brand-mark"><i>M</i><i>M</i></span>Medi<span>Mall</span>
        </a>
        <div
          className="order-location"
          onClick={openLocationModal}
          style={{ cursor: "pointer" }}
          title="Click to change delivery location"
          role="button"
          tabIndex={0}
        >
          <MapPin size={16} />
          <span>Area<br /><b>{displayLocation}</b></span>
        </div>
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <a className="account-link" href={user ? "/user/dashboard" : "/login"}>
          {user ? userInitials : "Sign in"}
        </a>
      </header>

      <div style={{ maxWidth: "1160px", margin: "0 auto", padding: "28px 20px 40px 20px" }}>
        <a className="back" href="/pharmacies" style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "16px", color: "#6b7d76", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>
          <ArrowLeft size={17} /> Back to all pharmacies
        </a>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#6b7d76" }}>
            <p style={{ fontSize: "15px" }}>Loading pharmacy store details...</p>
          </div>
        ) : isError || !pharmacy ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: dark ? "#15241f" : "#fff", borderRadius: "16px", border: "1px solid #ffccc7" }}>
            <AlertCircle size={36} color="#cf1322" style={{ margin: "0 auto 12px auto", display: "block" }} />
            <h2 style={{ fontSize: "20px", margin: "0 0 8px 0" }}>Pharmacy Store Not Found</h2>
            <p style={{ color: "#6b7d76", fontSize: "14px", margin: "0 0 20px 0" }}>
              This pharmacy may be offline or no longer taking direct orders.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                onClick={() => refetch()}
                style={{ background: "#227f5e", color: "#fff", border: 0, padding: "8px 16px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <RefreshCw size={14} /> Retry
              </button>
              <Link href="/pharmacies" style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #d8e2dc", textDecoration: "none", color: "inherit", fontWeight: 600, fontSize: "13px" }}>
                Browse other pharmacies
              </Link>
            </div>
          </div>
        ) : (
          <div>
            {/* Storefront Hero Header */}
            <div
              style={{
                background: dark ? "#15241f" : "#fff",
                border: dark ? "1px solid #233b32" : "1px solid #e5ede8",
                borderRadius: "20px",
                padding: "28px",
                boxShadow: "0 6px 24px rgba(0,0,0,0.03)",
                marginBottom: "32px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "rgba(34, 127, 94, 0.12)", display: "grid", placeItems: "center", color: "#227f5e", flexShrink: 0 }}>
                    <Store size={32} />
                  </div>
                  <div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#eef8f3", color: "#227f5e", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, marginBottom: "6px" }}>
                      <ShieldCheck size={13} /> Verified Local Pharmacy
                    </div>
                    <h1 style={{ margin: "0 0 4px 0", fontSize: "24px", fontWeight: 800, letterSpacing: "-0.5px" }}>
                      {pharmacy.name}
                    </h1>
                    {pharmacy.medical_license && (
                      <span style={{ fontSize: "12px", color: "#82918b", display: "block" }}>
                        License #{pharmacy.medical_license}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  {pharmacy.phone && (
                    <a
                      href={`tel:${pharmacy.phone}`}
                      style={{
                        padding: "10px 18px",
                        borderRadius: "10px",
                        border: "1.5px solid #227f5e",
                        color: "#227f5e",
                        background: "transparent",
                        textDecoration: "none",
                        fontSize: "13px",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Phone size={15} /> Call Store
                    </a>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: "20px", marginTop: "20px", paddingTop: "18px", borderTop: dark ? "1px solid #233b32" : "1px solid #f0f4f1", flexWrap: "wrap", fontSize: "13px", color: "#6b7d76" }}>
                {pharmacy.address && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <MapPin size={16} style={{ color: "#227f5e" }} />
                    <span>{pharmacy.address}</span>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Clock3 size={16} style={{ color: "#227f5e" }} />
                  <span>Delivery in <b>8–15 mins</b> directly from this counter</span>
                </div>
              </div>

              <div style={{ marginTop: "16px", background: "rgba(34, 127, 94, 0.08)", color: "#227f5e", padding: "10px 14px", borderRadius: "10px", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Check size={15} />
                <span><b>Direct Store Fulfillment:</b> Items added here will be assigned exclusively to {pharmacy.name}.</span>
              </div>
            </div>

            {/* In-store Medicines Search & Categories */}
            <div style={{ marginBottom: "24px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
                <Search size={17} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#82918b" }} />
                <input
                  type="text"
                  placeholder={`Search ${pharmacy.name}'s inventory...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px 12px 40px",
                    borderRadius: "10px",
                    border: "1px solid #d8e2dc",
                    fontSize: "13px",
                    outline: "none",
                    background: dark ? "#1a2c26" : "#fff",
                    color: "inherit",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "8px", overflowX: "auto" }}>
                {["All", "Pain relief", "Hydration", "Antibiotic", "Vitamins", "Antacid"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "8px",
                      border: selectedCategory === cat ? "1px solid #227f5e" : "1px solid #d8e2dc",
                      background: selectedCategory === cat ? (dark ? "#1e372e" : "#eef8f3") : (dark ? "#15241f" : "#fff"),
                      color: selectedCategory === cat ? "#227f5e" : "inherit",
                      fontSize: "12px",
                      fontWeight: selectedCategory === cat ? 700 : 500,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Medicines Grid */}
            {medicines.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", background: dark ? "#15241f" : "#f7faf8", borderRadius: "14px" }}>
                <Pill size={36} style={{ color: "#227f5e", margin: "0 auto 10px auto", display: "block" }} />
                <h3 style={{ margin: "0 0 6px 0", fontSize: "16px" }}>No medicines matched</h3>
                <p style={{ color: "#6b7d76", fontSize: "13px", margin: 0 }}>
                  Try changing your search query or view all catalog categories.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
                {medicines.map((med) => (
                  <div
                    key={med.id}
                    style={{
                      background: dark ? "#15241f" : "#fff",
                      border: dark ? "1px solid #233b32" : "1px solid #eef2ef",
                      borderRadius: "14px",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#227f5e", textTransform: "uppercase", background: "rgba(34, 127, 94, 0.08)", padding: "3px 7px", borderRadius: "4px" }}>
                          {med.type}
                        </span>
                        {med.rx && (
                          <span style={{ fontSize: "10px", fontWeight: 800, color: "#d85c2c", background: "#fff5f0", border: "1px solid #f9d8c8", padding: "2px 6px", borderRadius: "4px" }}>
                            Rx Required
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 4px 0", lineHeight: 1.3 }}>
                        {med.name}
                      </h3>
                      <p style={{ fontSize: "12px", color: "#82918b", margin: "0 0 8px 0" }}>
                        {med.brand}
                      </p>

                      {med.salt_composition && (
                        <p style={{ fontSize: "11px", color: "#6b7d76", margin: "0 0 12px 0", lineHeight: 1.3 }}>
                          Salt: {med.salt_composition}
                        </p>
                      )}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", paddingTop: "12px", borderTop: dark ? "1px solid #233b32" : "1px solid #f4f6f4" }}>
                      <div>
                        <span style={{ fontSize: "11px", color: "#82918b", display: "block" }}>Price</span>
                        <b style={{ fontSize: "17px", fontWeight: 800 }}>₹{med.price}</b>
                      </div>

                      <button
                        onClick={() => handleAddToCart(med)}
                        style={{
                          background: "#227f5e",
                          color: "#fff",
                          border: 0,
                          padding: "8px 14px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          transition: "background 0.15s ease",
                        }}
                      >
                        + Add to cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky Bottom Cart Strip */}
      {cartItemCount > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "calc(100% - 40px)",
            maxWidth: "760px",
            background: "#16342e",
            color: "#fff",
            padding: "14px 22px",
            borderRadius: "14px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 100,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#227f5e", display: "grid", placeItems: "center" }}>
              <ShoppingBag size={18} />
            </div>
            <div>
              <b style={{ fontSize: "14px", display: "block" }}>
                {cartItemCount} item{cartItemCount > 1 ? "s" : ""} · ₹{cartTotal}
              </b>
              <span style={{ fontSize: "11px", color: "#a5b9b1" }}>
                Ordering from {pharmacy?.name || "Local Pharmacy"}
              </span>
            </div>
          </div>

          <Link
            href="/checkout"
            style={{
              background: "#227f5e",
              color: "#fff",
              padding: "10px 18px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            Checkout ➔
          </Link>
        </div>
      )}
    </main>
  );
}
