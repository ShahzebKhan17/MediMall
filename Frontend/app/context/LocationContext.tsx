"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface UserLocation {
  city: string;
  area: string;
  state?: string;
  pincode?: string;
  formatted: string;
  latitude?: number;
  longitude?: number;
  isDetected: boolean;
}

const DEFAULT_LOCATION: UserLocation = {
  city: "Bengaluru",
  area: "Indiranagar",
  state: "Karnataka",
  formatted: "Indiranagar, Bengaluru",
  isDetected: false,
};

const STORAGE_KEY = "medimall_user_location";

interface LocationContextProps {
  location: UserLocation;
  isLoading: boolean;
  error: string | null;
  isModalOpen: boolean;
  openLocationModal: () => void;
  closeLocationModal: () => void;
  detectLocation: () => Promise<boolean>;
  selectLocation: (loc: Partial<UserLocation> & { city: string }) => void;
}

const LocationContext = createContext<LocationContextProps | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = useState<UserLocation>(DEFAULT_LOCATION);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Load saved location from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.city) {
          setLocationState(parsed);
          return;
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  }, []);

  const openLocationModal = useCallback(() => setIsModalOpen(true), []);
  const closeLocationModal = useCallback(() => setIsModalOpen(false), []);

  const selectLocation = useCallback((newLoc: Partial<UserLocation> & { city: string }) => {
    const area = newLoc.area || newLoc.city;
    const formatted = newLoc.formatted || (newLoc.area ? `${newLoc.area}, ${newLoc.city}` : newLoc.city);
    const updated: UserLocation = {
      city: newLoc.city,
      area: area,
      state: newLoc.state || "",
      pincode: newLoc.pincode || "",
      formatted: formatted,
      latitude: newLoc.latitude,
      longitude: newLoc.longitude,
      isDetected: newLoc.isDetected ?? false,
    };
    setLocationState(updated);
    setError(null);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // localStorage error fallback
    }
    setIsModalOpen(false);
  }, []);

  const detectLocation = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return false;
    }

    setIsLoading(true);
    setError(null);

    return new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Reverse geocode via OpenStreetMap Nominatim with a fast timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);

            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
              {
                signal: controller.signal,
                headers: {
                  "Accept-Language": "en",
                },
              }
            );
            clearTimeout(timeoutId);

            if (!res.ok) throw new Error("Reverse geocode failed");

            const data = await res.json();
            const addr = data.address || {};

            const area =
              addr.suburb ||
              addr.neighbourhood ||
              addr.residential ||
              addr.quarter ||
              addr.road ||
              addr.city_district ||
              "";
            const city =
              addr.city ||
              addr.town ||
              addr.municipality ||
              addr.village ||
              addr.county ||
              addr.state_district ||
              "Your Location";
            const state = addr.state || "";
            const pincode = addr.postcode || "";

            const formatted = area ? `${area}, ${city}` : city;

            const detectedLocation: UserLocation = {
              city,
              area: area || city,
              state,
              pincode,
              formatted,
              latitude,
              longitude,
              isDetected: true,
            };

            setLocationState(detectedLocation);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(detectedLocation));
            } catch {
              // Ignore
            }

            setIsLoading(false);
            setIsModalOpen(false);
            resolve(true);
          } catch (err: any) {
            console.warn("Reverse geocode error or timeout, fallback to coordinates:", err);
            // Graceful fallback with GPS coordinates
            const detectedLocation: UserLocation = {
              city: "Current Location",
              area: "Near You",
              formatted: `GPS Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`,
              latitude,
              longitude,
              isDetected: true,
            };
            setLocationState(detectedLocation);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(detectedLocation));
            } catch {
              // Ignore
            }
            setIsLoading(false);
            setIsModalOpen(false);
            resolve(true);
          }
        },
        (geoError) => {
          setIsLoading(false);
          let msg = "Could not get your location.";
          if (geoError.code === geoError.PERMISSION_DENIED) {
            msg = "Location access was denied. Please select your city manually or allow permission in browser settings.";
          } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
            msg = "Location information is currently unavailable.";
          } else if (geoError.code === geoError.TIMEOUT) {
            msg = "Location request timed out. Please try again or select manually.";
          }
          setError(msg);
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, []);

  return (
    <LocationContext.Provider
      value={{
        location,
        isLoading,
        error,
        isModalOpen,
        openLocationModal,
        closeLocationModal,
        detectLocation,
        selectLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
