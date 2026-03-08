// CustomerIntakeForm.jsx — E.D.I.T.H JARVIS Interface
import { useState } from "react";
import * as signalR from "@microsoft/signalr";

const BACKEND = "http://localhost:5000";

export default function CustomerIntakeForm({ onSessionStart }) {
  const [form, setForm] = useState({ customerName: "", organizationName: "", osPlatform: "", issueDescription: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(null);

  const osList = ["Windows 11", "Windows 10", "Windows Server 2022", "Windows Server 2019", "macOS", "Linux"];

  const handleSubmit = async () => {
    if (!form.customerName || !form.organizationName || !form.osPlatform || !form.issueDescription) {
      setError("ALL FIELDS REQUIRED");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND}/api/chat/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      const conn = new signalR.HubConnectionBuilder()
        .withUrl(`${BACKEND}/chathub`)
        .withAutomaticReconnect()
        .build();
      await conn.start();
      await conn.invoke("JoinSessionAsCustomer", data.sessionId, form.customerName);
      onSessionStart({ connection: conn, sessionId: data.sessionId, customerName: form.customerName });
    } catch {
      setError("CONNECTION FAILED — RETRY");
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    ...s.input,
    ...(focused === field ? s.inputFocused : {}),
  });

  return (
    <div style={s.page}>
      <div style={s.grid} />
      <div style={s.scanLine} />

      <div style={s.card}>
        {/* Logo */}
        <div style={s.logoArea}>
          <div style={s.logoMark}>
            <span style={s.logoText}>TL</span>
            <div style={s.logoRing} />
            <div style={s.logoPulse} />
          </div>
          <div>
            <div style={s.brandName}>THREATLOCKER</div>
            <div style={s.brandSub}>SUPPORT · SECURE CHANNEL</div>
          </div>
        </div>

        <div style={s.divider} />

        <div style={s.formTitle}>INITIATE SUPPORT SESSION</div>
        <div style={s.formSub}>All transmissions are encrypted end-to-end with AES-256-GCM</div>

        <div style={s.fields}>
          <div style={s.fieldGroup}>
            <label style={s.label}>FULL NAME</label>
            <input
              style={inputStyle("customerName")}
              placeholder="Enter your name"
              value={form.customerName}
              onFocus={() => setFocused("customerName")}
              onBlur={() => setFocused(null)}
              onChange={e => setForm({ ...form, customerName: e.target.value })}
            />
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>ORGANIZATION</label>
            <input
              style={inputStyle("organizationName")}
              placeholder="Company or organization name"
              value={form.organizationName}
              onFocus={() => setFocused("organizationName")}
              onBlur={() => setFocused(null)}
              onChange={e => setForm({ ...form, organizationName: e.target.value })}
            />
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>OPERATING SYSTEM</label>
            <div style={s.osGrid}>
              {osList.map(os => (
                <button
                  key={os}
                  style={{ ...s.osChip, ...(form.osPlatform === os ? s.osChipActive : {}) }}
                  onClick={() => setForm({ ...form, osPlatform: os })}
                >
                  {os}
                </button>
              ))}
            </div>
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>DESCRIBE YOUR ISSUE</label>
            <textarea
              style={{ ...inputStyle("issueDescription"), ...s.textarea, ...(focused === "issueDescription" ? s.inputFocused : {}) }}
              placeholder="Provide as much detail as possible — this helps our AI pre-analyze your case before an agent joins"
              value={form.issueDescription}
              rows={4}
              onFocus={() => setFocused("issueDescription")}
              onBlur={() => setFocused(null)}
              onChange={e => setForm({ ...form, issueDescription: e.target.value })}
            />
          </div>
        </div>

        {error && <div style={s.error}>⚠ {error}</div>}

        <button
          style={{ ...s.submitBtn, ...(loading ? s.submitBtnLoading : {}) }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <span style={s.loadingRow}>
              <span style={s.spinner} />
              ESTABLISHING SECURE CONNECTION...
            </span>
          ) : (
            "CONNECT TO SUPPORT ▶"
          )}
        </button>

        <div style={s.footer}>
          <span style={s.encIcon}>🔒</span>
          SESSION ENCRYPTED · ZERO TRUST ARCHITECTURE
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", width: "100vw", background: "#020509", overflow: "hidden", fontFamily: "'Courier New', Consolas, monospace" },
  grid: { position: "fixed", inset: 0, backgroundImage: "linear-gradient(#00d4ff04 1px, transparent 1px), linear-gradient(90deg, #00d4ff04 1px, transparent 1px)", backgroundSize: "32px 32px", pointerEvents: "none" },
  scanLine: { position: "fixed", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, #00d4ff30, transparent)", animation: "none", pointerEvents: "none", zIndex: 1 },
  card: { position: "relative", zIndex: 2, width: "100%", maxWidth: "480px", background: "rgba(10,15,26,0.95)", border: "1px solid #00d4ff20", borderRadius: "6px", padding: "36px 40px", boxShadow: "0 0 40px #00d4ff08, 0 0 80px #00000080", display: "flex", flexDirection: "column", gap: "18px" },
  logoArea: { display: "flex", alignItems: "center", gap: "14px" },
  logoMark: { position: "relative", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  logoText: { position: "relative", zIndex: 2, color: "#00d4ff", fontWeight: "900", fontSize: "13px", letterSpacing: "1px" },
  logoRing: { position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid #00d4ff50", boxShadow: "0 0 12px #00d4ff30, inset 0 0 12px #00d4ff15" },
  logoPulse: { position: "absolute", inset: "-4px", borderRadius: "50%", border: "1px solid #00d4ff15" },
  brandName: { color: "#e2e8f0", fontWeight: "900", fontSize: "14px", letterSpacing: "4px" },
  brandSub: { color: "#334155", fontSize: "9px", letterSpacing: "2.5px", marginTop: "3px" },
  divider: { height: "1px", background: "linear-gradient(90deg, transparent, #00d4ff20, transparent)" },
  formTitle: { color: "#e2e8f0", fontWeight: "700", fontSize: "13px", letterSpacing: "3px" },
  formSub: { color: "#334155", fontSize: "10px", letterSpacing: "0.5px", lineHeight: "1.6", marginTop: "-10px" },
  fields: { display: "flex", flexDirection: "column", gap: "16px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { color: "#475569", fontSize: "9px", fontWeight: "700", letterSpacing: "2px" },
  input: { background: "#020509", border: "1px solid #1e2533", borderRadius: "4px", padding: "11px 14px", color: "#e2e8f0", fontSize: "13px", outline: "none", fontFamily: "'Courier New', Consolas, monospace", letterSpacing: "0.3px", transition: "border-color 0.15s, box-shadow 0.15s" },
  inputFocused: { borderColor: "#00d4ff40", boxShadow: "0 0 12px #00d4ff10" },
  textarea: { resize: "vertical", lineHeight: "1.6" },
  osGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" },
  osChip: { background: "#020509", border: "1px solid #1e2533", color: "#475569", borderRadius: "3px", padding: "8px 6px", fontSize: "10px", cursor: "pointer", fontFamily: "'Courier New', Consolas, monospace", letterSpacing: "0.3px", transition: "all 0.15s", textAlign: "center" },
  osChipActive: { background: "#00d4ff10", border: "1px solid #00d4ff50", color: "#00d4ff", boxShadow: "0 0 8px #00d4ff15" },
  error: { color: "#ef4444", fontSize: "10px", fontWeight: "700", letterSpacing: "1.5px", padding: "10px 14px", background: "#ef444410", border: "1px solid #ef444430", borderRadius: "3px" },
  submitBtn: { background: "linear-gradient(135deg, #0ea5e9, #0369a1)", border: "none", color: "#fff", padding: "14px", borderRadius: "4px", fontSize: "11px", fontWeight: "700", letterSpacing: "2.5px", cursor: "pointer", boxShadow: "0 0 20px #0ea5e930", marginTop: "4px" },
  submitBtnLoading: { opacity: 0.7, cursor: "wait" },
  loadingRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" },
  spinner: { width: "10px", height: "10px", borderRadius: "50%", border: "2px solid #ffffff40", borderTopColor: "#fff", display: "inline-block" },
  footer: { display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", color: "#1e2533", fontSize: "9px", letterSpacing: "2px" },
  encIcon: { fontSize: "10px" },
};