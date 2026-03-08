// AgentDashboard.jsx — E.D.I.T.H JARVIS Interface
import { useState, useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { useNavigate } from "react-router-dom";

const BACKEND = "http://localhost:5000";

function moduleColor(mod) {
  if (!mod) return "#475569";
  const m = mod.toLowerCase();
  if (m.includes("application")) return "#0ea5e9";
  if (m.includes("ringfencing")) return "#a855f7";
  if (m.includes("storage")) return "#f59e0b";
  if (m.includes("network")) return "#22c55e";
  if (m.includes("elevation")) return "#ef4444";
  if (m.includes("configuration")) return "#06b6d4";
  return "#475569";
}

export default function AgentDashboard({ agentName, onJoinSession }) {
  const [queue, setQueue] = useState([]);
  const [selected, setSelected] = useState(null);
  const [connected, setConnected] = useState(false);
  const [time, setTime] = useState(new Date());
  const connRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`${BACKEND}/chathub`)
      .withAutomaticReconnect()
      .build();
    conn.on("AgentRegistered", () => setConnected(true));
    conn.on("QueueUpdated", (data) => {
      if (Array.isArray(data)) {
        setQueue(data);
      } else {
        setQueue((prev) => {
          const exists = prev.find((s) => s.sessionId === data.sessionId);
          return exists ? prev : [...prev, data];
        });
      }
    });
    conn.onreconnected(() => {
      conn.invoke("RegisterAsAgent", agentName);
      fetch(`${BACKEND}/api/chat/queue`).then(r => r.json()).then(setQueue).catch(() => {});
    });
    conn.start().then(() => {
      conn.invoke("RegisterAsAgent", agentName);
      fetch(`${BACKEND}/api/chat/queue`)
        .then((r) => r.json())
        .then(setQueue)
        .catch(() => {});
    });
    connRef.current = conn;
    const poll = setInterval(() => {
      fetch(`${BACKEND}/api/chat/queue`).then(r => r.json()).then(setQueue).catch(() => {});
    }, 5000);
    return () => { clearInterval(poll); if (!connRef.handedOff) conn.stop(); };
  }, [agentName]);

  const handlePickUp = async (session) => {
    const conn = connRef.current;
    connRef.handedOff = true;
    await conn.invoke("JoinSession", session.sessionId, agentName);
    onJoinSession({ connection: conn, session, agentName, summary: selected?.summary });
  };

  const waitLabel = (ms) => {
    const mins = Math.floor((Date.now() - new Date(ms)) / 60000);
    if (mins < 1) return "JUST NOW";
    return `${mins}m AGO`;
  };

  return (
    <div style={s.page}>
      <div style={s.grid} />

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.logoMark}>
            <span style={s.logoText}>TL</span>
            <div style={s.logoRing} />
          </div>
          <div>
            <div style={s.headerTitle}>SUPPORT CONSOLE</div>
            <div style={s.headerSub}>
              <span style={connected ? s.onlineDot : s.offlineDot} />
              AGENT: {agentName?.toUpperCase()} · {connected ? "ONLINE" : "CONNECTING..."}
            </div>
          </div>
        </div>
        <div style={s.headerRight}>
          <div style={s.clock}>{time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
          <button style={s.analyticsBtn} onClick={() => navigate("/analytics")}>
            ◈ ANALYTICS
          </button>
        </div>
      </div>

      <div style={s.body}>
        {/* Queue Panel */}
        <div style={s.queuePanel}>
          <div style={s.queueHeader}>
            <span style={s.queueTitle}>LIVE QUEUE</span>
            <span style={s.queueCount}>{queue.length}</span>
          </div>

          {queue.length === 0 ? (
            <div style={s.queueEmpty}>
              <div style={s.queueEmptyIcon}>✓</div>
              <div style={s.queueEmptyText}>QUEUE CLEAR</div>
            </div>
          ) : (
            queue.map((session, i) => (
              <div
                key={session.sessionId}
                style={{ ...s.queueCard, ...(selected?.sessionId === session.sessionId ? s.queueCardActive : {}) }}
                onClick={() => setSelected(session)}
              >
                <div style={s.queueCardTop}>
                  <span style={s.queuePos}>#{i + 1}</span>
                  <span style={{ ...s.moduleBadge, background: moduleColor(session.summary?.moduleClassification) + "20", color: moduleColor(session.summary?.moduleClassification), borderColor: moduleColor(session.summary?.moduleClassification) + "40" }}>
                    {session.summary?.moduleClassification?.toUpperCase() || "UNCLASSIFIED"}
                  </span>
                </div>
                <div style={s.queueName}>{session.customerName?.toUpperCase()}</div>
                <div style={s.queueOrg}>{session.intake?.organizationName || session.organizationName}</div>
                <div style={s.queueMeta}>
                  <span style={s.queueTime}>⏱ {waitLabel(session.createdAt)}</span>
                  <span style={s.queueOs}>{session.intake?.osPlatform || session.osPlatform}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail Panel */}
        <div style={s.detailPanel}>
          {!selected ? (
            <div style={s.detailEmpty}>
              <div style={s.detailEmptyHex}>⬡</div>
              <div style={s.detailEmptyTitle}>SELECT A SESSION</div>
              <div style={s.detailEmptyText}>Review intake details and E.D.I.T.H analysis before accepting</div>
            </div>
          ) : (
            <>
              <div style={s.detailHeader}>
                <div>
                  <div style={s.detailName}>{selected.customerName?.toUpperCase()}</div>
                  <div style={s.detailMeta}>{selected.organizationName} · {selected.osPlatform}</div>
                </div>
                <button style={s.acceptBtn} onClick={() => handlePickUp(selected)}>
                  ACCEPT SESSION ▶
                </button>
              </div>

              <div style={s.issueBox}>
                <div style={s.issueLabel}>CUSTOMER ISSUE</div>
                <div style={s.issueText}>{selected.issueDescription}</div>
              </div>

              {selected.summary ? (
                <div style={s.edithPanel}>
                  <div style={s.edithHeader}>
                    <span style={s.edithBadge}>E.D.I.T.H</span>
                    <span style={s.edithTitle}>CLASSIFICATION</span>
                  </div>
                  <div style={s.edithGrid}>
                    <div style={s.edithBox}>
                      <div style={s.edithBoxLabel}>MODULE</div>
                      <div style={{ ...s.edithBoxValue, color: moduleColor(selected.summary.moduleClassification) }}>
                        {selected.summary.moduleClassification}
                      </div>
                    </div>
                    <div style={s.edithBox}>
                      <div style={s.edithBoxLabel}>ISSUE TYPE</div>
                      <div style={{ ...s.edithBoxValue, color: "#94a3b8" }}>{selected.summary.issueTypeClassification}</div>
                    </div>
                  </div>

                  {selected.summary.recommendedSteps?.length > 0 && (
                    <div style={s.edithSection}>
                      <div style={s.edithSectionTitle}>RECOMMENDED STEPS</div>
                      {selected.summary.recommendedSteps.map((step, i) => (
                        <div key={i} style={s.edithStep}>
                          <span style={s.stepNum}>{i + 1}</span>
                          <span style={s.stepText}>{step}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {selected.summary.suggestedKBArticles?.length > 0 && (
                    <div style={s.edithSection}>
                      <div style={s.edithSectionTitle}>KB ARTICLES</div>
                      {selected.summary.suggestedKBArticles.map((kb, i) => (
                        <a key={i} href={`https://www.google.com/search?q=ThreatLocker+${encodeURIComponent(kb)}`} target="_blank" rel="noopener noreferrer" style={s.kbLink}>
                          <span style={s.kbArrow}>▶</span> {kb}
                        </a>
                      ))}
                    </div>
                  )}

                  {selected.summary.escalationRecommended && (
                    <div style={s.escalation}>
                      <div style={s.escalationTitle}>⚠ ESCALATION REQUIRED</div>
                      <div style={s.escalationReason}>{selected.summary.escalationReason}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={s.noSummary}>E.D.I.T.H ANALYSIS PENDING...</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { display: "flex", flexDirection: "column", height: "100vh", width: "100vw", background: "#020509", overflow: "hidden", fontFamily: "'Courier New', Consolas, monospace", color: "#94a3b8" },
  grid: { position: "fixed", inset: 0, backgroundImage: "linear-gradient(#00d4ff04 1px, transparent 1px), linear-gradient(90deg, #00d4ff04 1px, transparent 1px)", backgroundSize: "32px 32px", pointerEvents: "none", zIndex: 0 },
  header: { position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", background: "rgba(2,5,9,0.98)", borderBottom: "1px solid #00d4ff20" },
  headerLeft: { display: "flex", alignItems: "center", gap: "14px" },
  logoMark: { position: "relative", width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  logoText: { position: "relative", zIndex: 1, color: "#00d4ff", fontWeight: "900", fontSize: "12px", letterSpacing: "1px" },
  logoRing: { position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid #00d4ff50", boxShadow: "0 0 10px #00d4ff30, inset 0 0 10px #00d4ff15" },
  headerTitle: { color: "#e2e8f0", fontWeight: "700", fontSize: "12px", letterSpacing: "3px" },
  headerSub: { display: "flex", alignItems: "center", gap: "6px", color: "#475569", fontSize: "9px", letterSpacing: "2px", marginTop: "3px" },
  onlineDot: { width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 5px #22c55e", flexShrink: 0 },
  offlineDot: { width: "5px", height: "5px", borderRadius: "50%", background: "#ef4444", flexShrink: 0 },
  headerRight: { display: "flex", alignItems: "center", gap: "14px" },
  clock: { color: "#00d4ff", fontSize: "13px", fontWeight: "700", letterSpacing: "2px", fontVariantNumeric: "tabular-nums" },
  analyticsBtn: { background: "transparent", border: "1px solid #00d4ff30", color: "#00d4ff", borderRadius: "3px", padding: "7px 16px", fontSize: "9px", fontWeight: "700", letterSpacing: "1.5px", cursor: "pointer" },
  body: { position: "relative", zIndex: 1, display: "flex", flex: 1, overflow: "hidden" },
  queuePanel: { width: "260px", minWidth: "260px", background: "rgba(2,5,9,0.95)", borderRight: "1px solid #00d4ff15", overflowY: "auto", padding: "16px 12px", display: "flex", flexDirection: "column", gap: "8px" },
  queueHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px 10px", borderBottom: "1px solid #00d4ff15", marginBottom: "4px" },
  queueTitle: { color: "#475569", fontSize: "9px", fontWeight: "700", letterSpacing: "2px" },
  queueCount: { background: "#00d4ff20", color: "#00d4ff", fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "2px", border: "1px solid #00d4ff30" },
  queueEmpty: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: 0.3, gap: "6px" },
  queueEmptyIcon: { color: "#22c55e", fontSize: "20px" },
  queueEmptyText: { color: "#475569", fontSize: "9px", letterSpacing: "2px" },
  queueCard: { padding: "12px", border: "1px solid #1e2533", borderRadius: "4px", cursor: "pointer", background: "#0a0f1a", transition: "all 0.15s" },
  queueCardActive: { border: "1px solid #00d4ff40", background: "#00d4ff08", boxShadow: "0 0 12px #00d4ff10" },
  queueCardTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" },
  queuePos: { color: "#334155", fontSize: "9px", fontWeight: "700" },
  moduleBadge: { fontSize: "8px", fontWeight: "700", padding: "2px 7px", borderRadius: "2px", border: "1px solid", letterSpacing: "0.5px" },
  queueName: { color: "#e2e8f0", fontSize: "12px", fontWeight: "700", letterSpacing: "1px", marginBottom: "2px" },
  queueOrg: { color: "#475569", fontSize: "10px", marginBottom: "6px" },
  queueMeta: { display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#334155", letterSpacing: "0.5px" },
  queueTime: { color: "#00d4ff80" },
  queueOs: {},
  detailPanel: { flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: "16px" },
  detailEmpty: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: 0.2, gap: "10px" },
  detailEmptyHex: { fontSize: "48px", color: "#00d4ff" },
  detailEmptyTitle: { color: "#e2e8f0", fontSize: "12px", fontWeight: "700", letterSpacing: "4px" },
  detailEmptyText: { color: "#475569", fontSize: "10px", letterSpacing: "1px", textAlign: "center", maxWidth: "260px", lineHeight: "1.8" },
  detailHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between" },
  detailName: { color: "#e2e8f0", fontSize: "20px", fontWeight: "900", letterSpacing: "2px" },
  detailMeta: { color: "#475569", fontSize: "10px", letterSpacing: "1px", marginTop: "4px" },
  acceptBtn: { background: "linear-gradient(135deg, #0ea5e9, #0369a1)", border: "none", color: "#fff", padding: "10px 22px", borderRadius: "3px", fontSize: "10px", fontWeight: "700", letterSpacing: "2px", cursor: "pointer", boxShadow: "0 0 16px #0ea5e940", flexShrink: 0 },
  issueBox: { padding: "14px 16px", background: "#0a0f1a", border: "1px solid #00d4ff15", borderLeft: "3px solid #00d4ff40", borderRadius: "4px" },
  issueLabel: { color: "#334155", fontSize: "9px", fontWeight: "700", letterSpacing: "2px", marginBottom: "8px" },
  issueText: { color: "#94a3b8", fontSize: "13px", lineHeight: "1.6" },
  edithPanel: { display: "flex", flexDirection: "column", gap: "14px" },
  edithHeader: { display: "flex", alignItems: "center", gap: "8px" },
  edithBadge: { background: "linear-gradient(135deg, #00d4ff, #0369a1)", color: "#000", fontSize: "8px", fontWeight: "900", padding: "2px 7px", borderRadius: "2px", letterSpacing: "1px" },
  edithTitle: { color: "#334155", fontSize: "9px", fontWeight: "700", letterSpacing: "2px" },
  edithGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  edithBox: { padding: "12px 14px", background: "#0a0f1a", border: "1px solid #1e2533", borderRadius: "4px" },
  edithBoxLabel: { color: "#334155", fontSize: "9px", fontWeight: "700", letterSpacing: "1.5px", marginBottom: "5px" },
  edithBoxValue: { fontSize: "13px", fontWeight: "700", letterSpacing: "0.5px" },
  edithSection: { display: "flex", flexDirection: "column", gap: "6px" },
  edithSectionTitle: { color: "#334155", fontSize: "9px", fontWeight: "700", letterSpacing: "2px", paddingBottom: "6px", borderBottom: "1px solid #0ea5e910" },
  edithStep: { display: "flex", gap: "10px", alignItems: "flex-start" },
  stepNum: { width: "16px", height: "16px", borderRadius: "2px", background: "#00d4ff10", border: "1px solid #00d4ff30", color: "#00d4ff", fontSize: "9px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  stepText: { color: "#64748b", fontSize: "12px", lineHeight: "1.5" },
  kbLink: { display: "flex", alignItems: "flex-start", gap: "8px", color: "#0ea5e9", fontSize: "12px", padding: "7px 10px", background: "#0a0f1a", border: "1px solid #0ea5e920", borderRadius: "3px", textDecoration: "none", lineHeight: "1.4" },
  kbArrow: { color: "#00d4ff", flexShrink: 0, fontSize: "8px", marginTop: "2px" },
  escalation: { padding: "12px 14px", background: "#ef444410", border: "1px solid #ef444430", borderRadius: "4px" },
  escalationTitle: { color: "#ef4444", fontSize: "10px", fontWeight: "700", letterSpacing: "1px", marginBottom: "5px" },
  escalationReason: { color: "#64748b", fontSize: "12px", lineHeight: "1.5" },
  noSummary: { color: "#334155", fontSize: "10px", letterSpacing: "2px", padding: "16px", textAlign: "center" },
};