"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, FileDown, FileText, FileUp, Loader2, ShieldCheck, SwitchCamera, X } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { api } from "../../../lib/api";

export default function PatientPrescriptionsPage() {
  const { prescriptions, addPrescription } = useAppContext();
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [list, setList] = useState<string[]>(prescriptions);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Live Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async (facing: "environment" | "user" = facingMode) => {
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
      alert("Unable to access camera. Please check camera permissions or upload an image/PDF file instead.");
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
      alert("Camera not ready yet. Please wait a moment.");
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
        const capturedFile = new File([blob], `prescription_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        stopCamera();
        handleFileUpload(capturedFile);
      },
      "image/jpeg",
      0.92
    );
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    api.prescriptions
      .getAll()
      .then((records) => {
        if (records && records.length > 0) {
          const names = records.map((r) => r.file_path);
          setList(names);
        }
      })
      .catch((e) => {
        console.warn("Could not fetch remote prescriptions, using local list", e);
      });
  }, []);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const res = await api.prescriptions.upload(file);
      if (res && res.file_path) {
        addPrescription(res.file_path);
        setList((prev) => [res.file_path, ...prev]);
        alert(`File "${file.name}" uploaded successfully! Sent to licensed pharmacist for verification.`);
      }
    } catch (e: any) {
      console.error("Prescription upload error:", e);
      alert(`Failed to upload "${file.name}" to the server. Please check your network connection and try again.`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <section className="dash-content">
      <div className="welcome">
        <div>
          <p>HEALTH RECORDS</p>
          <h1>Prescriptions</h1>
          <h2>Upload and manage your medical prescriptions for quick verification.</h2>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px", marginTop: "24px" }}>
        <div>
          <div className="card">
            <h3 style={{ margin: "0 0 14px 0", fontSize: "16px" }}>Uploaded Prescriptions</h3>
            <div style={{ display: "grid", gap: "10px" }}>
              {list.map((filename, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px",
                    border: "1px solid #edf1ee",
                    borderRadius: "8px",
                  }}
                >
                  <span
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      backgroundColor: "#e0f3ec",
                      color: "#237f60",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <FileText size={18} />
                  </span>
                  <div>
                    <b style={{ fontSize: "13px", display: "block" }}>{filename}</b>
                    <span style={{ fontSize: "10px", color: "#82918b" }}>Verified by Licensed Pharmacist</span>
                  </div>

                  <button
                    style={{
                      marginLeft: "auto",
                      background: "none",
                      border: 0,
                      color: "#82918b",
                      cursor: "pointer",
                    }}
                    onClick={() => alert("Downloading copy...")}
                  >
                    <FileDown size={17} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.png,.jpg,.jpeg"
            capture="environment"
            style={{ display: "none" }}
          />

          {isCameraActive ? (
            <div
              className="card"
              style={{
                position: "relative",
                padding: "16px",
                textAlign: "center",
                background: "#111",
                borderRadius: "12px",
                overflow: "hidden",
                color: "#fff",
              }}
            >
              <div style={{ position: "relative", borderRadius: "8px", overflow: "hidden" }}>
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
                  style={{ width: "100%", height: "240px", objectFit: "cover", display: "block" }}
                />

                {/* Viewfinder Header */}
                <div
                  style={{
                    position: "absolute",
                    top: "8px",
                    left: "8px",
                    right: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      background: "rgba(0,0,0,0.65)",
                      color: "#fff",
                      padding: "3px 8px",
                      borderRadius: "12px",
                      fontSize: "10px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }}></span>
                    Live Camera
                  </span>
                  <button
                    type="button"
                    onClick={switchFacingMode}
                    title="Flip camera (Front / Back)"
                    style={{
                      background: "rgba(0,0,0,0.65)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "20px",
                      padding: "4px 9px",
                      fontSize: "11px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <SwitchCamera size={13} /> Flip
                  </button>
                </div>
              </div>

              {/* Viewfinder Controls */}
              <div style={{ marginTop: "12px", display: "flex", justifyContent: "center", gap: "12px" }}>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="primary"
                  style={{
                    padding: "8px 18px",
                    fontSize: "12px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                  }}
                >
                  <Camera size={16} /> Snap Prescription
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  style={{
                    padding: "8px 14px",
                    background: "rgba(255,255,255,0.2)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              className="card"
              style={{
                border: dragActive ? "2px dashed #227f5e" : "1px solid #e0e9e3",
                textAlign: "center",
                padding: "36px 20px",
                display: "grid",
                placeContent: "center",
                cursor: "default",
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              {isUploading ? (
                <Loader2 size={36} className="animate-spin" style={{ color: "#227f5e", margin: "0 auto 12px" }} />
              ) : (
                <FileUp size={36} style={{ color: "#227f5e", margin: "0 auto 12px" }} />
              )}
              <h3 style={{ fontSize: "14px", margin: "0 0 6px 0" }}>
                {isUploading ? "Uploading..." : "Upload or Snap Prescription"}
              </h3>
              <p style={{ color: "#82918b", fontSize: "11px", margin: "0 0 16px 0", maxWidth: "260px" }}>
                Take a direct snapshot of your medicine prescription or select a PDF / image file
              </p>
              <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => startCamera(facingMode)}
                  style={{
                    fontSize: "12px",
                    padding: "8px 14px",
                    background: "#227f5e",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 600,
                  }}
                >
                  <Camera size={15} /> Open Camera
                </button>
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    fontSize: "12px",
                    padding: "8px 14px",
                    background: "#ffffff",
                    border: "1px solid #c2d6cd",
                    color: "#227f5e",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 600,
                  }}
                >
                  <FileUp size={15} /> Choose File
                </button>
              </div>
            </div>
          )}

          <div
            className="card"
            style={{
              marginTop: "20px",
              background: "#eef6f2",
              border: "1px solid #d3e8dd",
              display: "flex",
              gap: "10px",
              alignItems: "start",
            }}
          >
            <ShieldCheck size={20} style={{ color: "#227f5e", flexShrink: 0 }} />
            <div>
              <b style={{ fontSize: "12px", color: "#16342e" }}>Why upload prescriptions?</b>
              <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#4d5b54", lineHeight: "1.4" }}>
                Medicines categorized under Schedule H/H1 require pharmacist check-off. Having an uploaded prescription allows hyperlocal shops to fulfill your orders quickly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

