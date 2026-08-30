"use client";

import React, { useState } from "react";
import { X, MapPin, Navigation, Search, Check, AlertCircle, Loader2 } from "lucide-react";
import { useLocation } from "../../app/context/LocationContext";

const POPULAR_CITIES = [
  { city: "Bengaluru", area: "Indiranagar", state: "Karnataka" },
  { city: "Mumbai", area: "Bandra West", state: "Maharashtra" },
  { city: "Delhi NCR", area: "Connaught Place", state: "Delhi" },
  { city: "Hyderabad", area: "HITEC City", state: "Telangana" },
  { city: "Chennai", area: "T. Nagar", state: "Tamil Nadu" },
  { city: "Pune", area: "Koregaon Park", state: "Maharashtra" },
  { city: "Kolkata", area: "Salt Lake", state: "West Bengal" },
  { city: "Ahmedabad", area: "Navrangpura", state: "Gujarat" },
  { city: "Jaipur", area: "Malviya Nagar", state: "Rajasthan" },
  { city: "Chandigarh", area: "Sector 17", state: "Punjab" },
  { city: "Lucknow", area: "Gomti Nagar", state: "Uttar Pradesh" },
  { city: "Kochi", area: "Kakkanad", state: "Kerala" },
];

export function LocationModal() {
  const {
    location,
    isModalOpen,
    closeLocationModal,
    detectLocation,
    selectLocation,
    isLoading,
    error,
  } = useLocation();

  const [searchQuery, setSearchQuery] = useState("");

  if (!isModalOpen) return null;

  const filteredCities = searchQuery.trim()
    ? POPULAR_CITIES.filter(
        (c) =>
          c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.state.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : POPULAR_CITIES;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    selectLocation({
      city: searchQuery.trim(),
      area: searchQuery.trim(),
      formatted: searchQuery.trim(),
    });
    setSearchQuery("");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={closeLocationModal}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          backgroundColor: "var(--card-bg, #ffffff)",
          color: "var(--ink, #16342e)",
          borderRadius: "20px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid var(--line, #e2e8f0)",
          overflow: "hidden",
          animation: "modalFadeIn 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--line, #e2e8f0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "rgba(34, 127, 94, 0.12)",
                color: "#227f5e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MapPin size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700 }}>Choose Your Location</h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted, #64748b)" }}>
                For accurate pharmacy matching and 10-minute delivery
              </p>
            </div>
          </div>
          <button
            onClick={closeLocationModal}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "8px",
              color: "var(--muted, #64748b)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", maxHeight: "70vh", overflowY: "auto" }}>
          {/* Detect GPS Button */}
          <button
            onClick={() => detectLocation()}
            disabled={isLoading}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              padding: "14px 18px",
              borderRadius: "12px",
              backgroundColor: "rgba(34, 127, 94, 0.08)",
              border: "1.5px solid #227f5e",
              color: "#166534",
              fontWeight: 600,
              fontSize: "14px",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
              marginBottom: "16px",
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                Detecting your location via GPS...
              </>
            ) : (
              <>
                <Navigation size={18} style={{ color: "#227f5e" }} />
                Detect My Current Location (GPS)
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                padding: "10px 14px",
                borderRadius: "10px",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                color: "#b91c1c",
                fontSize: "12.5px",
                marginBottom: "16px",
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>{error}</span>
            </div>
          )}

          {/* Search Input */}
          <form onSubmit={handleCustomSubmit} style={{ marginBottom: "20px" }}>
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: "14px",
                  color: "var(--muted, #64748b)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                placeholder="Search city, area or pincode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px 12px 38px",
                  borderRadius: "10px",
                  border: "1px solid var(--line, #cbd5e1)",
                  backgroundColor: "var(--field-bg, #f8fafc)",
                  color: "inherit",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
              {searchQuery.trim() && (
                <button
                  type="submit"
                  style={{
                    position: "absolute",
                    right: "8px",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    backgroundColor: "#227f5e",
                    color: "#ffffff",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Select
                </button>
              )}
            </div>
          </form>

          {/* Popular Cities Grid */}
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                color: "var(--muted, #64748b)",
                marginBottom: "10px",
              }}
            >
              {searchQuery.trim() ? "Matching Locations" : "Popular Cities"}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "8px",
              }}
            >
              {filteredCities.map((item) => {
                const isSelected =
                  location.city.toLowerCase() === item.city.toLowerCase();

                return (
                  <button
                    key={`${item.city}-${item.area}`}
                    onClick={() =>
                      selectLocation({
                        city: item.city,
                        area: item.area,
                        state: item.state,
                        formatted: `${item.area}, ${item.city}`,
                        isDetected: false,
                      })
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: isSelected
                        ? "1.5px solid #227f5e"
                        : "1px solid var(--line, #e2e8f0)",
                      backgroundColor: isSelected
                        ? "rgba(34, 127, 94, 0.08)"
                        : "var(--field-bg, #f8fafc)",
                      cursor: "pointer",
                      textAlign: "left",
                      color: isSelected ? "#166534" : "inherit",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "13.5px", fontWeight: isSelected ? 700 : 500 }}>
                        {item.city}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--muted, #64748b)" }}>
                        {item.area}
                      </div>
                    </div>
                    {isSelected && <Check size={16} style={{ color: "#227f5e" }} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            backgroundColor: "var(--field-bg, #f8fafc)",
            borderTop: "1px solid var(--line, #e2e8f0)",
            fontSize: "12px",
            color: "var(--muted, #64748b)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>
            Current: <strong>{location.formatted}</strong>
          </span>
          {location.isDetected && (
            <span
              style={{
                fontSize: "11px",
                backgroundColor: "rgba(34, 127, 94, 0.15)",
                color: "#166534",
                padding: "2px 8px",
                borderRadius: "12px",
                fontWeight: 600,
              }}
            >
              GPS Active
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
