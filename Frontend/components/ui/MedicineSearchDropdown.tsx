"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Check, ShieldCheck, ArrowRight, X, Sparkles, Image as ImageIcon, Pill } from "lucide-react";
import { useMedicinesQuery } from "../../lib/hooks/useQueries";
import { useAppContext, Medicine } from "../../app/context/AppContext";

interface MedicineSearchDropdownProps {
  initialQuery?: string;
  placeholder?: string;
  onSearchSubmit?: (query: string) => void;
  className?: string;
  autoFocus?: boolean;
  showUploadShortcut?: boolean;
}

export function MedicineSearchDropdown({
  initialQuery = "",
  placeholder = "Search by medicine or brand name...",
  onSearchSubmit,
  className = "",
  autoFocus = false,
  showUploadShortcut = true,
}: MedicineSearchDropdownProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [addedId, setAddedId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: catalogue = [], isLoading } = useMedicinesQuery();
  const { addToCart } = useAppContext();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const filteredMedicines = React.useMemo(() => {
    if (!query.trim()) {
      return catalogue.slice(0, 4); // show top 4 featured
    }
    const q = query.toLowerCase();
    return catalogue.filter((m) =>
      `${m.name} ${m.brand} ${m.type} ${m.packaging_type || ""}`.toLowerCase().includes(q)
    );
  }, [catalogue, query]);

  const handleSelect = (medicine: Medicine) => {
    setIsOpen(false);
    if (onSearchSubmit) {
      onSearchSubmit(medicine.name);
    } else {
      router.push(`/medicines?q=${encodeURIComponent(medicine.name)}`);
    }
  };

  const handleAddToCart = (e: React.MouseEvent, medicine: Medicine) => {
    e.stopPropagation();
    addToCart(medicine.id, medicine);
    setAddedId(medicine.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsOpen(false);
    if (onSearchSubmit) {
      onSearchSubmit(query);
    } else {
      if (query.trim()) {
        router.push(`/medicines?q=${encodeURIComponent(query.trim())}`);
      } else {
        router.push("/medicines");
      }
    }
  };

  return (
    <div ref={containerRef} className={`medicine-search-wrapper ${className}`} style={{ position: "relative", width: "100%" }}>
      <form onSubmit={handleSubmit} className="search-row" style={{ position: "relative", zIndex: 10 }}>
        <Search size={20} className="search-icon" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          style={{ width: "100%" }}
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            style={{
              background: "transparent",
              border: 0,
              padding: "4px 8px",
              cursor: "pointer",
              color: "#888",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={16} />
          </button>
        )}

        <button type="submit" style={{ whiteSpace: "nowrap" }}>
          Find medicine <ArrowRight size={16} />
        </button>
      </form>

      {/* Visual Live Autocomplete Popover with Packaging Photos */}
      {isOpen && (
        <div
          className="search-results-popover"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 18px 40px rgba(18, 48, 38, 0.18), 0 4px 12px rgba(0,0,0,0.06)",
            border: "1px solid #dbe6df",
            zIndex: 1000,
            overflow: "hidden",
            maxHeight: "480px",
            display: "flex",
            flexDirection: "column",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <div
            style={{
              padding: "10px 16px",
              background: "#f4f8f5",
              borderBottom: "1px solid #e5ede8",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "11px",
              fontWeight: 600,
              color: "#3e6355",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <ImageIcon size={13} color="#27855f" />
              {query ? `Packaging Matches (${filteredMedicines.length})` : "Popular Medicines & Packaging"}
            </span>
            <span style={{ color: "#7a9489", textTransform: "none", fontWeight: 400 }}>
              Verify wrapper before adding
            </span>
          </div>

          <div style={{ overflowY: "auto", padding: "8px" }}>
            {filteredMedicines.length > 0 ? (
              filteredMedicines.map((m) => (
                <div
                  key={m.id}
                  onClick={() => handleSelect(m)}
                  className="search-item-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    borderBottom: "1px solid #f2f5f3",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f7f3")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Medicine Packaging / Wrapper Visual */}
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "10px",
                      background: "#f8fbf9",
                      border: "1px solid #dce8e0",
                      flexShrink: 0,
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                    }}
                  >
                    {m.image_url ? (
                      <img
                        src={m.image_url}
                        alt={`${m.name} packaging wrapper`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        onError={(e) => {
                          // Fallback on load error
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "grid",
                          placeItems: "center",
                          background: m.color === "orange" ? "#ffede4" : m.color === "yellow" ? "#fff4d7" : m.color === "green" ? "#e1f3ea" : "#e8efff",
                          color: "#27855f",
                        }}
                      >
                        <Pill size={26} />
                      </div>
                    )}
                    {m.rx && (
                      <span
                        style={{
                          position: "absolute",
                          bottom: "3px",
                          right: "3px",
                          background: "#cf1322",
                          color: "#fff",
                          fontSize: "8px",
                          fontWeight: 700,
                          padding: "1px 4px",
                          borderRadius: "4px",
                        }}
                      >
                        Rx
                      </span>
                    )}
                  </div>

                  {/* Medicine Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#16342e",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {m.name}
                      </h4>
                      {m.rx && (
                        <span
                          style={{
                            fontSize: "10px",
                            color: "#d9383a",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "2px",
                            fontWeight: 600,
                          }}
                        >
                          <ShieldCheck size={11} /> Rx Required
                        </span>
                      )}
                    </div>

                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: "12px",
                        color: "#546e63",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {m.brand}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginTop: "4px",
                        fontSize: "11px",
                      }}
                    >
                      <span
                        style={{
                          background: "#e8f4ed",
                          color: "#237253",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontWeight: 500,
                        }}
                      >
                        {m.packaging_type || m.type}
                      </span>
                      <strong style={{ color: "#16342e", fontSize: "13px" }}>₹{m.price}</strong>
                    </div>
                  </div>

                  {/* Add to Cart CTA */}
                  <button
                    onClick={(e) => handleAddToCart(e, m)}
                    style={{
                      border: "1px solid #c9ded3",
                      background: addedId === m.id ? "#27855f" : "#ffffff",
                      color: addedId === m.id ? "#ffffff" : "#226a4e",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.04)",
                      transition: "all 0.15s ease",
                      flexShrink: 0,
                    }}
                  >
                    {addedId === m.id ? (
                      <>
                        <Check size={14} /> Added
                      </>
                    ) : (
                      <>
                        <Plus size={14} /> Add
                      </>
                    )}
                  </button>
                </div>
              ))
            ) : (
              <div style={{ padding: "24px 16px", textAlign: "center", color: "#687f75" }}>
                <Pill size={28} style={{ opacity: 0.5, margin: "0 auto 8px" }} />
                <p style={{ margin: 0, fontWeight: 600, fontSize: "13px" }}>No medicine found for &quot;{query}&quot;</p>
                <p style={{ margin: "4px 0 0", fontSize: "11px" }}>
                  Try searching by generic salt (e.g. Paracetamol) or upload a prescription for pharmacist matching.
                </p>
              </div>
            )}
          </div>

          <div
            style={{
              padding: "10px 14px",
              background: "#edf5f0",
              borderTop: "1px solid #dce8e0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "12px",
            }}
          >
            <span style={{ color: "#4f6e61" }}>Press Enter to view all results</span>
            <button
              type="button"
              onClick={() => router.push("/ai-doctor")}
              style={{
                background: "transparent",
                border: 0,
                color: "#d96a40",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "11px",
              }}
            >
              <Sparkles size={13} /> Need help? Upload prescription
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
