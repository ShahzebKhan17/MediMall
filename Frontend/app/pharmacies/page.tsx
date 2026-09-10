"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  MapPin,
  Moon,
  Phone,
  Pill,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  Sun,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAppContext } from "../context/AppContext";
import { useLocation } from "../context/LocationContext";
import { usePharmaciesQuery } from "../../lib/hooks/useQueries";

export default function PharmaciesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { dark, toggleTheme } = useTheme();
  const { user, role } = useAppContext();
  const { location, openLocationModal } = useLocation();

  const queryParams = useMemo(() => {
    return {
      q: searchQuery.trim() || undefined,
      lat: location.latitude || 12.9716,
      lng: location.longitude || 77.5946,
      radius_km: 30,
    };
  }, [searchQuery, location, user]);

  const { data: pharmacies = [], isLoading, isError, refetch } = usePharmaciesQuery(queryParams);

  const homeHref = role === "pharmacy" ? "/shopkeeper/dashboard" : "/";
  const userInitials = user ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "U";
  const displayLocation = user?.address ? user.address.split(",")[0] : location.formatted;

  return (
    <main className={`order-page ${dark ? "dark" : ""}`} style={{ minHeight: "100vh" }}>
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

      <div style={{ maxWidth: "1160px", margin: "0 auto", padding: "28px 20px 80px 20px" }}>
        <a className="back" href="/" style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "16px", color: "#6b7d76", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>
          <ArrowLeft size={17} /> Back to home
        </a>

        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(34, 127, 94, 0.1)", color: "#227f5e", padding: "5px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: 700, marginBottom: "12px" }}>
            <Store size={14} /> DIRECT PHARMACY ORDERING
          </div>
          <h1 style={{ fontSize: "32px", fontWeight: 800, margin: "0 0 10px 0", letterSpacing: "-0.8px" }}>
            Choose your local pharmacy
          </h1>
          <p style={{ color: "#6b7d76", fontSize: "15px", margin: 0, maxWidth: "680px", lineHeight: 1.5 }}>
            Browse verified chemist shops in your neighborhood. Explore each pharmacy’s shelves and place an order directly with the pharmacist you know and trust.
          </p>

          <div style={{ marginTop: "24px", position: "relative", maxWidth: "640px" }}>
            <Search size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#82918b" }} />
            <input
              type="text"
              placeholder="Search by pharmacy name, street, or license ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "14px 16px 14px 44px",
                borderRadius: "12px",
                border: "1.5px solid #d8e2dc",
                fontSize: "14px",
                outline: "none",
                background: dark ? "#1a2c26" : "#fff",
                color: dark ? "#e2ebe6" : "#1a2c26",
                boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
              }}
            />
          </div>
        </div>

        {isError && (
          <div style={{ background: "#fff2f0", border: "1px solid #ffccc7", color: "#cf1322", padding: "16px 20px", borderRadius: "10px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>Unable to load partner pharmacies. Please check your internet or retry.</span>
            <button
              onClick={() => refetch()}
              style={{ background: "#cf1322", color: "#fff", border: 0, padding: "6px 14px", borderRadius: "6px", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#6b7d76" }}>
            <p style={{ fontSize: "14px" }}>Discovering verified pharmacies near you...</p>
          </div>
        ) : pharmacies.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: dark ? "#15241f" : "#f7faf8", borderRadius: "16px", border: "1px dashed #d8e2dc" }}>
            <Store size={40} style={{ color: "#227f5e", margin: "0 auto 12px auto", display: "block" }} />
            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>No partner pharmacies found</h3>
            <p style={{ color: "#6b7d76", fontSize: "14px", margin: "0 0 20px 0", maxWidth: "450px", marginLeft: "auto", marginRight: "auto" }}>
              {searchQuery
                ? `No registered pharmacies matched "${searchQuery}". Try a different area or keyword.`
                : "No registered pharmacy partners are currently listed in this area. You can still order via Direct Medicine search!"}
            </p>
            <Link
              href="/medicines"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#227f5e",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "13px",
              }}
            >
              <Pill size={16} /> Search All Medicines Instead
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "24px" }}>
            {pharmacies.map((pharm) => (
              <div
                key={pharm.id}
                style={{
                  background: dark ? "#15241f" : "#fff",
                  border: dark ? "1px solid #233b32" : "1px solid #e5ede8",
                  borderRadius: "16px",
                  padding: "22px",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(34, 127, 94, 0.12)", display: "grid", placeItems: "center", color: "#227f5e" }}>
                        <Store size={22} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, letterSpacing: "-0.3px" }}>
                          {pharm.name}
                        </h3>
                        {pharm.medical_license && (
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#227f5e", fontSize: "11px", fontWeight: 600, marginTop: "2px" }}>
                            <ShieldCheck size={13} />
                            <span>Lic: {pharm.medical_license}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {pharm.distance_km !== null && pharm.distance_km !== undefined && (
                      <span style={{ background: dark ? "#1e372e" : "#eef8f3", color: "#227f5e", fontSize: "11px", fontWeight: 700, padding: "4px 8px", borderRadius: "6px" }}>
                        {pharm.distance_km} km away
                      </span>
                    )}
                  </div>

                  <div style={{ display: "grid", gap: "8px", margin: "16px 0", fontSize: "12px", color: dark ? "#9eb3aa" : "#657770" }}>
                    {pharm.address && (
                      <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                        <MapPin size={15} style={{ flexShrink: 0, marginTop: "2px", color: "#227f5e" }} />
                        <span style={{ lineHeight: 1.4 }}>{pharm.address}</span>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <Clock3 size={15} style={{ flexShrink: 0, color: "#227f5e" }} />
                      <span>Estimated delivery: <b>8–15 minutes</b></span>
                    </div>
                    {pharm.phone && (
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <Phone size={15} style={{ flexShrink: 0, color: "#227f5e" }} />
                        <span>Direct chemist phone: <b>{pharm.phone}</b></span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: dark ? "1px solid #233b32" : "1px solid #f0f4f1", display: "flex", gap: "10px" }}>
                  {pharm.phone && (
                    <a
                      href={`tel:${pharm.phone}`}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #d8e2dc",
                        color: dark ? "#e2ebe6" : "#227f5e",
                        textDecoration: "none",
                        fontSize: "12px",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                      title="Call pharmacist directly"
                    >
                      <Phone size={14} /> Call
                    </a>
                  )}

                  <Link
                    href={`/pharmacies/${pharm.id}`}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      background: "#227f5e",
                      color: "#fff",
                      padding: "10px 16px",
                      borderRadius: "8px",
                      textDecoration: "none",
                      fontSize: "12px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    View Store & Medicines ➔
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
