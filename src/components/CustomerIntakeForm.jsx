// CustomerIntakeForm.jsx
// Install: npm install @microsoft/signalr
import { useState } from "react";
import * as signalR from "@microsoft/signalr";

const MODULES = [
  "Application Control",
  "Ringfencing",
  "Storage Control",
  "Network Control",
  "Elevation Control",
  "Configuration Manager",
  "Ops Center",
  "Other / Not Sure",
];

const OS_OPTIONS = [
  "Windows 10",
  "Windows 11",
  "Windows Server 2016",
  "Windows Server 2019",
  "Windows Server 2022",
  "macOS",
  "Linux",
  "Other",
];

export default function CustomerIntakeForm({ onConnected }) {
  const [form, setForm] = useState({
    organizationName: "",
    osPlatform: "",
    moduleAffected: "",
    issueDescription: "",
    customerName: "",
  });
  const [status, setStatus] = useState("idle"); // idle | submitting | queued | error
  const [connection, setConnection] = useState(null);
  const [sessionId] = useState(() => crypto.randomUUID());

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    const { organizationName, osPlatform, moduleAffected, issueDescription, customerName } = form;
    if (!organizationName || !osPlatform || !moduleAffected || !issueDescription || !customerName) {
      alert("Please fill out all fields before continuing.");
      return;
    }

    setStatus("submitting");

    const conn = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5000/chathub")
      .withAutomaticReconnect()
      .build();

    conn.on("QueueConfirmed", () => {
      setStatus("queued");
    });

    conn.on("AgentJoined", (agentName) => {
      onConnected({ connection: conn, sessionId, customerName, agentName });
    });

    try {
      await conn.start();
      await conn.invoke("SubmitIntake", sessionId, customerName, {
        organizationName,
        osPlatform,
        moduleAffected,
        issueDescription,
      });
      setConnection(conn);
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoRow}>
            <div style={styles.logoMark}>TL</div>
            <span style={styles.logoText}>ThreatLocker Support</span>
          </div>
          <div style={styles.statusBar}>
            <span style={styles.statusDot} />
            <span style={styles.statusLabel}>Live Support Available</span>
          </div>
        </div>

        {status === "queued" ? (
          <div style={styles.queuedState}>
            <div style={styles.spinner} />
            <h2 style={styles.queueTitle}>You're in the queue</h2>
            <p style={styles.queueSub}>
              An agent has been notified and will join shortly. Please stay on this page.
            </p>
            <div style={styles.queueInfo}>
              <span style={styles.queueLabel}>Organization</span>
              <span style={styles.queueValue}>{form.organizationName}</span>
              <span style={styles.queueLabel}>Module</span>
              <span style={styles.queueValue}>{form.moduleAffected}</span>
            </div>
          </div>
        ) : (
          <>
            <div style={styles.body}>
              <h2 style={styles.title}>Before we connect you</h2>
              <p style={styles.subtitle}>
                A few quick details help our agents investigate your issue before the chat begins.
              </p>

              <div style={styles.formGrid}>
                <Field label="Your Name" required>
                  <input
                    style={styles.input}
                    name="customerName"
                    value={form.customerName}
                    onChange={handleChange}
                    placeholder="e.g. John Smith"
                  />
                </Field>

                <Field label="Organization Name" required>
                  <input
                    style={styles.input}
                    name="organizationName"
                    value={form.organizationName}
                    onChange={handleChange}
                    placeholder="e.g. Acme Corp"
                  />
                </Field>

                <Field label="Operating System / Platform" required>
                  <select style={styles.select} name="osPlatform" value={form.osPlatform} onChange={handleChange}>
                    <option value="">Select a platform...</option>
                    {OS_OPTIONS.map((os) => (
                      <option key={os} value={os}>{os}</option>
                    ))}
                  </select>
                </Field>

                <Field label="ThreatLocker Module Affected" required>
                  <select style={styles.select} name="moduleAffected" value={form.moduleAffected} onChange={handleChange}>
                    <option value="">Select a module...</option>
                    {MODULES.map((mod) => (
                      <option key={mod} value={mod}>{mod}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Describe Your Issue" required fullWidth>
                  <textarea
                    style={styles.textarea}
                    name="issueDescription"
                    value={form.issueDescription}
                    onChange={handleChange}
                    placeholder="What is happening? What were you doing when the issue occurred? Any error messages?"
                    rows={4}
                  />
                </Field>
              </div>

              {status === "error" && (
                <p style={styles.errorMsg}>
                  Something went wrong connecting to support. Please refresh and try again.
                </p>
              )}
            </div>

            <div style={styles.footer}>
              <button
                style={status === "submitting" ? { ...styles.btn, ...styles.btnDisabled } : styles.btn}
                onClick={handleSubmit}
                disabled={status === "submitting"}
              >
                {status === "submitting" ? "Connecting..." : "Start Chat →"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, required, children, fullWidth }) {
  return (
    <div style={{ ...(fullWidth ? { gridColumn: "1 / -1" } : {}) }}>
      <label style={styles.label}>
        {label} {required && <span style={styles.req}>*</span>}
      </label>
      {children}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b0e14",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    padding: "24px",
  },
  card: {
    width: "100%",
    maxWidth: "560px",
    background: "#12151e",
    border: "1px solid #1e2533",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
  },
  header: {
    background: "#0d1117",
    borderBottom: "1px solid #1e2533",
    padding: "18px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoRow: { display: "flex", alignItems: "center", gap: "10px" },
  logoMark: {
    width: "32px", height: "32px", borderRadius: "6px",
    background: "linear-gradient(135deg, #0ea5e9, #0369a1)",
    color: "#fff", fontWeight: "800", fontSize: "13px",
    display: "flex", alignItems: "center", justifyContent: "center",
    letterSpacing: "0.5px",
  },
  logoText: { color: "#e2e8f0", fontWeight: "600", fontSize: "15px" },
  statusBar: { display: "flex", alignItems: "center", gap: "6px" },
  statusDot: {
    width: "8px", height: "8px", borderRadius: "50%",
    background: "#22c55e",
    boxShadow: "0 0 6px #22c55e",
    animation: "pulse 2s infinite",
  },
  statusLabel: { color: "#6b7280", fontSize: "12px" },
  body: { padding: "28px 24px 12px" },
  title: { color: "#f1f5f9", fontSize: "20px", fontWeight: "700", margin: "0 0 6px" },
  subtitle: { color: "#6b7280", fontSize: "14px", margin: "0 0 24px", lineHeight: "1.5" },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  label: {
    display: "block",
    color: "#94a3b8",
    fontSize: "12px",
    fontWeight: "600",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    marginBottom: "6px",
  },
  req: { color: "#0ea5e9" },
  input: {
    width: "100%",
    background: "#0d1117",
    border: "1px solid #1e2533",
    borderRadius: "6px",
    color: "#e2e8f0",
    fontSize: "14px",
    padding: "10px 12px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  select: {
    width: "100%",
    background: "#0d1117",
    border: "1px solid #1e2533",
    borderRadius: "6px",
    color: "#e2e8f0",
    fontSize: "14px",
    padding: "10px 12px",
    outline: "none",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    background: "#0d1117",
    border: "1px solid #1e2533",
    borderRadius: "6px",
    color: "#e2e8f0",
    fontSize: "14px",
    padding: "10px 12px",
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "inherit",
    lineHeight: "1.5",
  },
  footer: {
    padding: "16px 24px 24px",
    display: "flex",
    justifyContent: "flex-end",
  },
  btn: {
    background: "linear-gradient(135deg, #0ea5e9, #0369a1)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "12px 28px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    letterSpacing: "0.3px",
    transition: "opacity 0.2s",
  },
  btnDisabled: { opacity: 0.5, cursor: "not-allowed" },
  errorMsg: { color: "#f87171", fontSize: "13px", marginTop: "12px" },
  queuedState: {
    padding: "48px 32px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  spinner: {
    width: "40px", height: "40px",
    border: "3px solid #1e2533",
    borderTop: "3px solid #0ea5e9",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "20px",
  },
  queueTitle: { color: "#f1f5f9", fontSize: "18px", fontWeight: "700", margin: "0 0 8px" },
  queueSub: { color: "#6b7280", fontSize: "14px", lineHeight: "1.6", margin: "0 0 24px" },
  queueInfo: {
    display: "grid", gridTemplateColumns: "auto auto",
    gap: "8px 16px", textAlign: "left",
    background: "#0d1117", border: "1px solid #1e2533",
    borderRadius: "8px", padding: "16px 20px",
  },
  queueLabel: { color: "#6b7280", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" },
  queueValue: { color: "#e2e8f0", fontSize: "13px" },
};
