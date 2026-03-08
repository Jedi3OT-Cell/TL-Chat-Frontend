// App.jsx — E.D.I.T.H JARVIS Interface
import { useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import CustomerIntakeForm from "./components/CustomerIntakeForm";
import ChatWindow from "./components/ChatWindow";
import AgentDashboard from "./components/AgentDashboard";
import Analytics from "./components/Analytics";

const BACKEND = "http://localhost:5000";

// ── Landing Page ────────────────────────────────────────────────────────────
function LandingPage() {
  const navigate = useNavigate();
  const [time] = useState(new Date());

  return (
    <div style={s.page}>
      <div style={s.grid} />
      <div style={s.center}>
        <div style={s.logoWrap}>
          <div style={s.logoRingOuter} />
          <div style={s.logoRingInner} />
          <span style={s.logoLetters}>TL</span>
        </div>
        <div style={s.brandName}>THREATLOCKER</div>
        <div style={s.tagline}>ZERO TRUST · ENDPOINT DEFENSE</div>
        <div style={s.edithLabel}>
          <span style={s.edithBadge}>E.D.I.T.H</span>
          ENDPOINT DEFENSE INTELLIGENCE &amp; TRIAGE HUB
        </div>
        <div style={s.btnRow}>
          <button style={s.primaryBtn} onClick={() => navigate("/chat")}>
            ▶ REQUEST SUPPORT
          </button>
          <button style={s.secondaryBtn} onClick={() => navigate("/agent")}>
            AGENT LOGIN
          </button>
        </div>
        <div style={s.statusBar}>
          <span style={s.greenDot} />
          ALL SYSTEMS OPERATIONAL
          <span style={s.sep}>·</span>
          {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          <span style={s.sep}>·</span>
          AES-256-GCM ENCRYPTED
        </div>
      </div>
    </div>
  );
}

// ── Agent Login ─────────────────────────────────────────────────────────────
function AgentLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username || !password) { setError("ALL FIELDS REQUIRED"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) { setError("ACCESS DENIED — INVALID CREDENTIALS"); setLoading(false); return; }
      const data = await res.json();
      onLogin({ displayName: data.displayName, token: data.token });
    } catch {
      setError("CONNECTION FAILED — RETRY");
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    ...s2.input,
    ...(focused === field ? s2.inputFocused : {}),
  });

  return (
    <div style={s2.page}>
      <div style={s2.grid} />
      <div style={s2.card}>
        <div style={s2.logoRow}>
          <div style={s2.logoMark}>
            <span style={s2.logoText}>TL</span>
            <div style={s2.logoRing} />
          </div>
          <div>
            <div style={s2.brand}>THREATLOCKER</div>
            <div style={s2.brandSub}>AGENT AUTHENTICATION</div>
          </div>
        </div>

        <div style={s2.divider} />

        <div style={s2.title}>SECURE LOGIN</div>

        <div style={s2.fieldGroup}>
          <label style={s2.label}>AGENT ID</label>
          <input
            style={inputStyle("username")}
            placeholder="Username"
            value={username}
            onFocus={() => setFocused("username")}
            onBlur={() => setFocused(null)}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
        </div>

        <div style={s2.fieldGroup}>
          <label style={s2.label}>ACCESS CODE</label>
          <input
            type="password"
            style={inputStyle("password")}
            placeholder="Password"
            value={password}
            onFocus={() => setFocused("password")}
            onBlur={() => setFocused(null)}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
        </div>

        {error && <div style={s2.error}>⚠ {error}</div>}

        <button style={{ ...s2.loginBtn, ...(loading ? s2.loginBtnLoading : {}) }} onClick={handleLogin} disabled={loading}>
          {loading ? "AUTHENTICATING..." : "AUTHENTICATE ▶"}
        </button>

        <button style={s2.backBtn} onClick={() => navigate("/")}>← BACK</button>

        <div style={s2.footer}>JWT · ZERO TRUST · AES-256-GCM</div>
      </div>
    </div>
  );
}

// ── Customer Flow ────────────────────────────────────────────────────────────
function CustomerFlow() {
  const [chatState, setChatState] = useState(null);
  if (!chatState) return <CustomerIntakeForm onSessionStart={setChatState} />;
  return (
    <ChatWindow
      connection={chatState.connection}
      sessionId={chatState.sessionId}
      senderName={chatState.customerName}
      senderRole="customer"
      onClose={() => setChatState(null)}
    />
  );
}

// ── Agent Flow ───────────────────────────────────────────────────────────────
function AgentFlow() {
  const [agent, setAgent] = useState(null);
  const [chatState, setChatState] = useState(null);

  if (!agent) return <AgentLogin onLogin={setAgent} />;
  if (!chatState) return (
    <AgentDashboard
      agentName={agent.displayName}
      onJoinSession={(state) => setChatState(state)}
    />
  );
  return (
    <ChatWindow
      connection={chatState.connection}
      sessionId={chatState.session.sessionId}
      senderName={agent.displayName}
      senderRole="agent"
      summary={chatState.summary}
      onClose={() => setChatState(null)}
    />
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/chat" element={<CustomerFlow />} />
        <Route path="/agent" element={<AgentFlow />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </BrowserRouter>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s = {
  page: { display: "flex", alignItems: "center", justifyContent: "center", flex: 1, minHeight: "100vh", width: "100%", background: "#020509", fontFamily: "'Courier New', Consolas, monospace", overflow: "hidden" },
  grid: { position: "fixed", inset: 0, backgroundImage: "linear-gradient(#00d4ff04 1px, transparent 1px), linear-gradient(90deg, #00d4ff04 1px, transparent 1px)", backgroundSize: "32px 32px", pointerEvents: "none" },
  center: { position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" },
  logoWrap: { position: "relative", width: "80px", height: "80px", display: "flex", alignItems: "center", justifyContent: "center" },
  logoRingOuter: { position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid #00d4ff30", boxShadow: "0 0 20px #00d4ff20, inset 0 0 20px #00d4ff10" },
  logoRingInner: { position: "absolute", inset: "10px", borderRadius: "50%", border: "1px solid #00d4ff20" },
  logoLetters: { position: "relative", zIndex: 1, color: "#00d4ff", fontWeight: "900", fontSize: "20px", letterSpacing: "2px", textShadow: "0 0 20px #00d4ff" },
  brandName: { color: "#e2e8f0", fontWeight: "900", fontSize: "28px", letterSpacing: "8px", textAlign: "center" },
  tagline: { color: "#334155", fontSize: "10px", letterSpacing: "4px" },
  edithLabel: { display: "flex", alignItems: "center", gap: "10px", color: "#475569", fontSize: "10px", letterSpacing: "1.5px" },
  edithBadge: { background: "linear-gradient(135deg, #00d4ff, #0369a1)", color: "#000", fontSize: "8px", fontWeight: "900", padding: "2px 8px", borderRadius: "2px", letterSpacing: "1px" },
  btnRow: { display: "flex", gap: "12px", marginTop: "8px" },
  primaryBtn: { background: "linear-gradient(135deg, #0ea5e9, #0369a1)", border: "none", color: "#fff", padding: "14px 32px", borderRadius: "4px", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", cursor: "pointer", boxShadow: "0 0 20px #0ea5e930", fontFamily: "'Courier New', Consolas, monospace" },
  secondaryBtn: { background: "transparent", border: "1px solid #00d4ff30", color: "#00d4ff", padding: "14px 32px", borderRadius: "4px", fontSize: "11px", fontWeight: "700", letterSpacing: "2px", cursor: "pointer", fontFamily: "'Courier New', Consolas, monospace" },
  statusBar: { display: "flex", alignItems: "center", gap: "8px", color: "#334155", fontSize: "9px", letterSpacing: "2px", marginTop: "8px" },
  greenDot: { width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" },
  sep: { color: "#1e2533" },
};

const s2 = {
  page: { display: "flex", alignItems: "center", justifyContent: "center", flex: 1, minHeight: "100vh", width: "100%", background: "#020509", fontFamily: "'Courier New', Consolas, monospace", overflow: "hidden" },
  grid: { position: "fixed", inset: 0, backgroundImage: "linear-gradient(#00d4ff04 1px, transparent 1px), linear-gradient(90deg, #00d4ff04 1px, transparent 1px)", backgroundSize: "32px 32px", pointerEvents: "none" },
  card: {
    margin: "0 auto", position: "relative", zIndex: 2, width: "90%", maxWidth: "340px",
    background: "rgba(6,10,18,0.97)",
    border: "1px solid #00d4ff18",
    borderTop: "1px solid #00d4ff35",
    borderRadius: "8px",
    padding: "36px 40px 28px",
    boxShadow: "0 0 60px #00000090, 0 0 30px #00d4ff06, inset 0 1px 0 #00d4ff15",
    display: "flex", flexDirection: "column", gap: "0px"
  },
  logoRow: { display: "flex", alignItems: "center", gap: "14px", marginBottom: "28px" },
  logoMark: { position: "relative", width: "42px", height: "42px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  logoText: { position: "relative", zIndex: 1, color: "#00d4ff", fontWeight: "900", fontSize: "12px", letterSpacing: "1px" },
  logoRing: { position: "absolute", inset: 0, borderRadius: "50%", border: "1.5px solid #00d4ff45", boxShadow: "0 0 14px #00d4ff25, inset 0 0 10px #00d4ff10" },
  brand: { color: "#cbd5e1", fontWeight: "900", fontSize: "13px", letterSpacing: "4px" },
  brandSub: { color: "#1e3a4a", fontSize: "9px", letterSpacing: "2.5px", marginTop: "4px" },
  divider: { height: "1px", background: "linear-gradient(90deg, transparent, #00d4ff15, transparent)", marginBottom: "28px" },
  title: { color: "#94a3b8", fontWeight: "700", fontSize: "10px", letterSpacing: "4px", marginBottom: "24px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" },
  label: { color: "#1e3a4a", fontSize: "8px", fontWeight: "700", letterSpacing: "2.5px" },
  input: {
    background: "#040810",
    border: "1px solid #0f1f2e",
    borderBottom: "1px solid #00d4ff15",
    borderRadius: "4px",
    padding: "11px 14px",
    color: "#e2e8f0",
    fontSize: "13px",
    outline: "none",
    fontFamily: "'Courier New', Consolas, monospace",
    letterSpacing: "0.5px",
    transition: "border-color 0.2s, box-shadow 0.2s",
    width: "100%",
    boxSizing: "border-box",
  },
  inputFocused: { borderColor: "#00d4ff25", borderBottomColor: "#00d4ff60", boxShadow: "0 4px 16px #00d4ff08" },
  error: { color: "#ef4444", fontSize: "9px", fontWeight: "700", letterSpacing: "1.5px", padding: "9px 12px", background: "#ef444408", border: "1px solid #ef444425", borderRadius: "3px", marginBottom: "12px" },
  loginBtn: {
    background: "linear-gradient(180deg, #0d6fa8 0%, #084d7a 100%)",
    border: "1px solid #00d4ff30",
    borderTop: "1px solid #00d4ff50",
    color: "#e0f7ff",
    padding: "13px",
    borderRadius: "4px",
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "3px",
    cursor: "pointer",
    boxShadow: "0 4px 20px #00000060, 0 0 16px #0ea5e915",
    fontFamily: "'Courier New', Consolas, monospace",
    marginTop: "8px",
    width: "100%",
  },
  loginBtnLoading: { opacity: 0.6, cursor: "wait" },
  backBtn: { background: "transparent", border: "none", color: "#1e3a4a", fontSize: "9px", letterSpacing: "1.5px", cursor: "pointer", fontFamily: "'Courier New', Consolas, monospace", padding: "0", marginTop: "16px", textAlign: "center" },
  footer: { color: "#0d1f2d", fontSize: "8px", letterSpacing: "2px", textAlign: "center", marginTop: "20px" },
};