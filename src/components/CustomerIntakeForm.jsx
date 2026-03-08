// CustomerIntakeForm.jsx
import { useState } from "react";
import * as signalR from "@microsoft/signalr";

const BACKEND = "http://localhost:5000";

export default function CustomerIntakeForm({ onConnected }) {
  const [form, setForm] = useState({
    name: "", org: "", os: "", module: "", issue: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name || !form.org || !form.os || !form.module || !form.issue) {
      setError("Please fill out all fields before continuing.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const conn = new signalR.HubConnectionBuilder()
        .withUrl(`${BACKEND}/chathub`)
        .withAutomaticReconnect()
        .build();

      await conn.start();
      const sessionId = crypto.randomUUID();

      await conn.invoke("SubmitIntake", sessionId, form.name, {
        organizationName: form.org,
        osPlatform: form.os,
        moduleAffected: form.module,
        issueDescription: form.issue,
      });

      onConnected({ connection: conn, sessionId, customerName: form.name });
    } catch {
      setError("Something went wrong connecting to support. Please refresh and try again.");
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      {/* Left Panel — Branding */}
      <div style={s.left}>
        <div style={s.leftInner}>
          <div style={s.logoWrap}>
            <div style={s.logoMark}>TL</div>
            <div>
              <div style={s.logoName}>ThreatLocker</div>
              <div style={s.logoSub}>Customer Support</div>
            </div>
          </div>
          <h1 style={s.headline}>Expert help,<br />when you need it.</h1>
          <p style={s.tagline}>
            Our support agents are backed by E.D.I.T.H — our AI triage system
            that reads your issue before the chat even begins.
          </p>
          <div style={s.featureList}>
            {[
              ["⚡", "AI-Powered Triage", "E.D.I.T.H pre-analyzes your issue"],
              ["🔒", "End-to-End Encrypted", "AES-256-GCM secured messaging"],
              ["🛡", "Zero Trust Architecture", "Every connection verified"],
            ].map(([icon, title, desc]) => (
              <div key={title} style={s.feature}>
                <span style={s.featureIcon}>{icon}</span>
                <div>
                  <div style={s.featureTitle}>{title}</div>
                  <div style={s.featureDesc}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={s.edithBadge}>
            <span style={s.edithDot} />
            E.D.I.T.H — Endpoint Defense Intelligence & Triage Hub
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div style={s.right}>
        <div style={s.formCard}>
          <div style={s.formHeader}>
            <h2 style={s.formTitle}>Before we connect you</h2>
            <p style={s.formSub}>A few quick details help our agents investigate your issue before the chat begins.</p>
          </div>

          <div style={s.row}>
            <Field label="Your Name" required>
              <input style={s.input} placeholder="e.g. John Smith" value={form.name} onChange={e => set("name", e.target.value)} />
            </Field>
            <Field label="Organization Name" required>
              <input style={s.input} placeholder="e.g. Acme Corp" value={form.org} onChange={e => set("org", e.target.value)} />
            </Field>
          </div>

          <div style={s.row}>
            <Field label="Operating System / Platform" required>
              <select style={s.input} value={form.os} onChange={e => set("os", e.target.value)}>
                <option value="">Select a platform...</option>
                {["Windows 10","Windows 11","Windows Server 2016","Windows Server 2019","Windows Server 2022","macOS","Linux","Other"].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="ThreatLocker Module Affected" required>
              <select style={s.input} value={form.module} onChange={e => set("module", e.target.value)}>
                <option value="">Select a module...</option>
                {["Application Control","Ringfencing","Storage Control","Network Control","Elevation Control","Configuration Manager","Ops Center","Other / Not Sure"].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Describe Your Issue" required>
            <textarea
              style={{ ...s.input, ...s.textarea }}
              placeholder="What is happening? What were you doing when the issue occurred? Any error messages?"
              value={form.issue}
              onChange={e => set("issue", e.target.value)}
            />
          </Field>

          {error && <div style={s.error}>{error}</div>}

          <button style={{ ...s.btn, ...(loading ? s.btnLoading : {}) }} onClick={submit} disabled={loading}>
            {loading ? (
              <span style={s.spinRow}><span style={s.spinner} />E.D.I.T.H is analyzing your issue...</span>
            ) : "Start Support Chat →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <label style={s.label}>{label} {required && <span style={s.req}>*</span>}</label>
      {children}
    </div>
  );
}

const s = {
  page: { display: "flex", height: "100vh", width: "100vw", background: "#080b12", overflow: "hidden" },
  left: { width: "420px", minWidth: "420px", background: "linear-gradient(160deg, #0d1117 0%, #0a0f1a 100%)", borderRight: "1px solid #1a2035", display: "flex", alignItems: "center", padding: "40px" },
  leftInner: { width: "100%" },
  logoWrap: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "48px" },
  logoMark: { width: "44px", height: "44px", borderRadius: "12px", background: "linear-gradient(135deg, #0ea5e9, #0369a1)", color: "#fff", fontWeight: "800", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 24px rgba(14,165,233,0.3)" },
  logoName: { color: "#f1f5f9", fontWeight: "700", fontSize: "17px" },
  logoSub: { color: "#0ea5e9", fontSize: "11px", fontWeight: "600", letterSpacing: "0.5px" },
  headline: { color: "#f1f5f9", fontSize: "36px", fontWeight: "800", lineHeight: "1.2", marginBottom: "16px", letterSpacing: "-0.5px" },
  tagline: { color: "#64748b", fontSize: "14px", lineHeight: "1.7", marginBottom: "36px" },
  featureList: { display: "flex", flexDirection: "column", gap: "20px", marginBottom: "40px" },
  feature: { display: "flex", alignItems: "flex-start", gap: "14px" },
  featureIcon: { fontSize: "20px", flexShrink: 0, marginTop: "1px" },
  featureTitle: { color: "#e2e8f0", fontSize: "13px", fontWeight: "700", marginBottom: "2px" },
  featureDesc: { color: "#475569", fontSize: "12px" },
  edithBadge: { display: "flex", alignItems: "center", gap: "8px", color: "#334155", fontSize: "11px", borderTop: "1px solid #1a2035", paddingTop: "24px" },
  edithDot: { width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e", flexShrink: 0 },
  right: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px", overflowY: "auto" },
  formCard: { width: "100%", maxWidth: "580px" },
  formHeader: { marginBottom: "32px" },
  formTitle: { color: "#f1f5f9", fontSize: "26px", fontWeight: "700", marginBottom: "8px" },
  formSub: { color: "#64748b", fontSize: "14px", lineHeight: "1.5" },
  row: { display: "flex", gap: "16px", marginBottom: "20px" },
  label: { display: "block", color: "#94a3b8", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "8px" },
  req: { color: "#0ea5e9" },
  input: { width: "100%", background: "#0d1117", border: "1px solid #1e2533", borderRadius: "8px", padding: "12px 14px", color: "#f1f5f9", fontSize: "14px", outline: "none", marginBottom: "0" },
  textarea: { height: "110px", resize: "vertical", marginBottom: "0" },
  error: { background: "#dc262615", border: "1px solid #dc2626", borderRadius: "8px", padding: "10px 14px", color: "#fca5a5", fontSize: "13px", marginBottom: "16px" },
  btn: { width: "100%", background: "linear-gradient(135deg, #0ea5e9, #0369a1)", color: "#fff", border: "none", borderRadius: "10px", padding: "15px", fontSize: "15px", fontWeight: "700", cursor: "pointer", marginTop: "24px", transition: "opacity 0.2s" },
  btnLoading: { opacity: 0.7, cursor: "not-allowed" },
  spinRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" },
  spinner: { width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" },
};