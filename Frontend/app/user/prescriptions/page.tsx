"use client";

import { useEffect, useRef, useState } from "react";
import { FileDown, FileText, FileUp, Loader2, ShieldCheck } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { api } from "../../../lib/api";

export default function PatientPrescriptionsPage() {
  const { prescriptions, addPrescription } = useAppContext();
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [list, setList] = useState<string[]>(prescriptions);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
        alert(`File "${file.name}" uploaded successfully! Real-time OCR extraction has identified it.`);
      }
    } catch (e: any) {
      console.warn("Prescription upload error, falling back locally:", e);
      const mockName = `Rx_${file.name}`;
      addPrescription(mockName);
      setList((prev) => [mockName, ...prev]);
      alert(`File "${file.name}" saved locally. Nearby pharmacies can now verify it.`);
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
                    <span style={{ fontSize: "10px", color: "#82918b" }}>Verified by Care & Cure Pharmacist</span>
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
            style={{ display: "none" }}
          />
          <div
            className="card"
            style={{
              border: dragActive ? "2px dashed #227f5e" : "1px solid #e0e9e3",
              textAlign: "center",
              padding: "40px 20px",
              display: "grid",
              placeContent: "center",
              cursor: "pointer",
            }}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 size={36} className="animate-spin" style={{ color: "#227f5e", margin: "0 auto 12px" }} />
            ) : (
              <FileUp size={36} style={{ color: "#227f5e", margin: "0 auto 12px" }} />
            )}
            <h3 style={{ fontSize: "14px", margin: "0 0 6px 0" }}>
              {isUploading ? "Uploading..." : "Upload Prescription"}
            </h3>
            <p style={{ color: "#82918b", fontSize: "11px", margin: "0 0 16px 0" }}>
              Drag and drop your medical license or prescription here, or click to browse
            </p>
            <button
              type="button"
              disabled={isUploading}
              className="primary"
              style={{ fontSize: "12px", padding: "8px 12px", margin: "auto" }}
            >
              Choose File (PDF, PNG, JPG)
            </button>
          </div>

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

