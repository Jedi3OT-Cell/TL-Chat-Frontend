// App.jsx — ThreatLocker Support Console (E.D.I.T.H)
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import CustomerIntakeForm from "./components/CustomerIntakeForm";
import ChatWindow from "./components/ChatWindow";
import AgentDashboard from "./components/AgentDashboard";
import Analytics from "./components/Analytics";

import { BACKEND } from "./lib/config";

// ── Landing Page ────────────────────────────────────────────────────────────
function LandingPage() {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="tl-screen">
      <div className="tl-center">
        <div className="tl-card" style={{ textAlign: "center" }}>
          <div className="tl-brand" style={{ justifyContent: "center", marginBottom: 20 }}>
            <span className="tl-brand-mark">TL</span>
            <div style={{ textAlign: "left" }}>
              <div className="tl-brand-name">THREATLOCKER</div>
              <div className="tl-brand-sub">Zero Trust Endpoint Defense</div>
            </div>
          </div>

          <h1 className="tl-h1">Support Console</h1>
          <p className="tl-help" style={{ marginTop: 8, marginBottom: 24 }}>
            E.D.I.T.H — Endpoint Defense Intelligence &amp; Triage Hub. Start a support
            session or sign in as an agent.
          </p>

          <div className="tl-row" style={{ justifyContent: "center", gap: 12 }}>
            <button type="button" className="tl-btn tl-btn--primary" onClick={() => navigate("/chat")}>
              Request Support
            </button>
            <button type="button" className="tl-btn tl-btn--ghost" onClick={() => navigate("/agent")}>
              Agent Login
            </button>
          </div>

          <div className="tl-row" style={{ justifyContent: "center", gap: 8, marginTop: 24 }}>
            <span className="tl-dot tl-dot--online" />
            <span className="tl-faint" style={{ fontSize: 12 }}>
              All systems operational · {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
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

  return (
    <div className="tl-screen">
      <div className="tl-center">
        <div className="tl-card">
          <div className="tl-brand" style={{ marginBottom: 20 }}>
            <span className="tl-brand-mark">TL</span>
            <div>
              <div className="tl-brand-name">THREATLOCKER</div>
              <div className="tl-brand-sub">Agent Authentication</div>
            </div>
          </div>

          <hr className="tl-divider" />

          <div className="tl-eyebrow" style={{ marginBottom: 16 }}>Secure Login</div>

          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            <div className="tl-field">
              <label className="tl-label" htmlFor="agent-username">Agent ID</label>
              <input
                id="agent-username"
                name="username"
                autoComplete="username"
                maxLength={120}
                className="tl-input"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>

            <div className="tl-field">
              <label className="tl-label" htmlFor="agent-password">Access Code</label>
              <input
                id="agent-password"
                name="password"
                type="password"
                autoComplete="current-password"
                maxLength={200}
                className="tl-input"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && <div className="tl-alert tl-alert--error">{error}</div>}

            <button type="submit" className="tl-btn tl-btn--primary tl-btn--block" disabled={loading}>
              {loading ? "Authenticating…" : "Authenticate"}
            </button>

            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button type="button" className="tl-btn tl-btn--link" onClick={() => navigate("/")}>← Back</button>
            </div>
          </form>
        </div>
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

  const logout = () => { setChatState(null); setAgent(null); };

  if (!agent) return <AgentLogin onLogin={setAgent} />;
  if (!chatState) return (
    <AgentDashboard
      agentName={agent.displayName}
      token={agent.token}
      onJoinSession={(state) => setChatState(state)}
      onLogout={logout}
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
