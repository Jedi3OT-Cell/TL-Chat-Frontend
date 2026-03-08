import { useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import CustomerIntakeForm from "./components/CustomerIntakeForm";
import AgentDashboard from "./components/AgentDashboard";
import ChatWindow from "./components/ChatWindow";

const BACKEND = "http://localhost:5000";

function LandingPage() {
  const navigate = useNavigate();
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <div style={styles.logoMark}>TL</div>
          <div>
            <div style={styles.logoText}>ThreatLocker</div>
            <div style={styles.logoSub}>Powered by E.D.I.T.H</div>
          </div>
        </div>
        <h1 style={styles.title}>How can we help?</h1>
        <p style={styles.subtitle}>Select how you are accessing support today.</p>
        <div style={styles.btnGroup}>
          <button style={styles.btnPrimary} onClick={() => navigate("/chat")}>
            <span style={styles.btnIcon}>💬</span>
            <div>
              <div style={styles.btnLabel}>Customer Support</div>
              <div style={styles.btnSub}>Get help with a ThreatLocker issue</div>
            </div>
          </button>
          <button style={styles.btnSecondary} onClick={() => navigate("/agent")}>
            <span style={styles.btnIcon}>🛡</span>
            <div>
              <div style={styles.btnLabel}>Agent Console</div>
              <div style={styles.btnSub}>ThreatLocker support staff only</div>
            </div>
          </button>
        </div>
        <div style={styles.edithBadge}>
          <span style={styles.edithDot} />
          E.D.I.T.H — Endpoint Defense Intelligence & Triage Hub — Active
        </div>
      </div>
    </div>
  );
}

function CustomerFlow() {
  const [chatState, setChatState] = useState(null);
  if (chatState) {
    return (
      <ChatWindow
        connection={chatState.connection}
        sessionId={chatState.sessionId}
        senderName={chatState.customerName}
        senderRole="customer"
        agentName={chatState.agentName}
        onClose={() => setChatState(null)}
      />
    );
  }
  return <CustomerIntakeForm onConnected={setChatState} />;
}

function AgentLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(BACKEND + "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Invalid username or password.");
      } else {
        onLogin(data.displayName, data.token);
      }
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <div style={styles.logoMark}>TL</div>
          <div>
            <div style={styles.logoText}>ThreatLocker</div>
            <div style={styles.logoSub}>Agent Console</div>
          </div>
        </div>
        <h1 style={styles.title}>Sign in</h1>
        <p style={styles.subtitle}>ThreatLocker support staff only.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
          <input style={loginStyles.input} type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
          <input style={loginStyles.input} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
        </div>
        {error && <div style={loginStyles.error}>{error}</div>}
        <button style={loginStyles.btn} onClick={handleLogin} disabled={loading}>
          {loading ? "Signing in..." : "Sign In →"}
        </button>
        <div style={styles.edithBadge}>
          <span style={styles.edithDot} />
          E.D.I.T.H — Endpoint Defense Intelligence & Triage Hub — Active
        </div>
      </div>
    </div>
  );
}

function AgentFlow() {
  const [agentName, setAgentName] = useState(null);
  const [token, setToken] = useState(null);
  const [chatState, setChatState] = useState(null);

  if (!agentName) {
    return <AgentLogin onLogin={(name, tok) => { setAgentName(name); setToken(tok); }} />;
  }
  if (chatState) {
    return (
      <ChatWindow
        connection={chatState.connection}
        sessionId={chatState.session.sessionId}
        senderName={agentName}
        senderRole="agent"
        summary={chatState.summary}
        onClose={() => setChatState(null)}
      />
    );
  }
  return <AgentDashboard agentName={agentName} token={token} onJoinSession={setChatState} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/chat" element={<CustomerFlow />} />
        <Route path="/agent" element={<AgentFlow />} />
      </Routes>
    </BrowserRouter>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#0b0e14", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "DM Sans, Segoe UI, sans-serif", padding: "24px" },
  card: { width: "100%", maxWidth: "480px", background: "#12151e", border: "1px solid #1e2533", borderRadius: "16px", padding: "40px 36px", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" },
  logoRow: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" },
  logoMark: { width: "40px", height: "40px", borderRadius: "10px", background: "linear-gradient(135deg, #0ea5e9, #0369a1)", color: "#fff", fontWeight: "800", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" },
  logoText: { color: "#f1f5f9", fontWeight: "700", fontSize: "16px" },
  logoSub: { color: "#0ea5e9", fontSize: "11px", fontWeight: "600", letterSpacing: "0.5px" },
  title: { color: "#f1f5f9", fontSize: "26px", fontWeight: "700", margin: "0 0 8px" },
  subtitle: { color: "#6b7280", fontSize: "14px", margin: "0 0 28px", lineHeight: "1.5" },
  btnGroup: { display: "flex", flexDirection: "column", gap: "12px", marginBottom: "28px" },
  btnPrimary: { display: "flex", alignItems: "center", gap: "14px", background: "linear-gradient(135deg, #0ea5e9, #0369a1)", border: "none", borderRadius: "10px", padding: "16px 20px", cursor: "pointer", textAlign: "left" },
  btnSecondary: { display: "flex", alignItems: "center", gap: "14px", background: "#0d1117", border: "1px solid #1e2533", borderRadius: "10px", padding: "16px 20px", cursor: "pointer", textAlign: "left" },
  btnIcon: { fontSize: "22px", flexShrink: 0 },
  btnLabel: { color: "#f1f5f9", fontWeight: "700", fontSize: "15px", marginBottom: "2px" },
  btnSub: { color: "rgba(241,245,249,0.6)", fontSize: "12px" },
  edithBadge: { display: "flex", alignItems: "center", gap: "8px", color: "#475569", fontSize: "11px", borderTop: "1px solid #1e2533", paddingTop: "20px" },
  edithDot: { width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e", flexShrink: 0 },
};

const loginStyles = {
  input: { background: "#0d1117", border: "1px solid #1e2533", borderRadius: "8px", padding: "12px 14px", color: "#f1f5f9", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box" },
  btn: { width: "100%", padding: "14px", background: "linear-gradient(135deg, #0ea5e9, #0369a1)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: "700", fontSize: "15px", cursor: "pointer", marginBottom: "24px" },
  error: { color: "#f87171", fontSize: "13px", marginBottom: "12px", padding: "10px 14px", background: "rgba(248,113,113,0.1)", borderRadius: "8px", border: "1px solid rgba(248,113,113,0.2)" },
};
