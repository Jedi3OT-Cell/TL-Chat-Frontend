// AgentDashboard.jsx
import { useState, useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";

const BACKEND = "http://localhost:5000";

export default function AgentDashboard({ agentName, onJoinSession }) {
  const [queue, setQueue] = useState([]);
  const [selected, setSelected] = useState(null);
  const [connected, setConnected] = useState(false);
  const connRef = useRef(null);

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

    conn.start().then(() => {
      conn.invoke("RegisterAsAgent", agentName);
      fetch(`${BACKEND}/api/chat/queue`)
        .then((r) => r.json())
        .then(setQueue)
        .catch(() => {});
    });

    connRef.current = conn;
    return () => {
      if (!connRef.handedOff) conn.stop();
    };
  }, [agentName]);

  const handlePickUp = async (session) => {
    const conn = connRef.current;
    connRef.handedOff = true;
    await conn.invoke("JoinSession", session.sessionId, agentName);
    onJoinSession({ connection: conn, session, agentName });
  };

  const waitTime = (startedAt) => {
    const mins = Math.floor((Date.now() - new Date(startedAt)) / 60000);
    if (mins < 1) return "Just now";
    if (mins === 1) return "1 min";
    return `${mins} mins`;
  };

  const moduleColor = (mod) => {
    const map = {
      "Application Control": "#0ea5e9",
      "Ringfencing": "#a855f7",
      "Storage Control": "#f59e0b",
      "Network Control": "#22c55e",
      "Elevation Control": "#f97316",
      "Configuration Manager": "#64748b",
      "Ops Center": "#ec4899",
    };
    return map[mod] || "#6b7280";
  };

  return (
    <div style={s.page}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.sidebarTop}>
          <div style={s.logoRow}>
            <div style={s.logoMark}>TL</div>
            <div>
              <div style={s.logoText}>Support Console</div>
              <div style={s.agentLabel}>Agent: {agentName}</div>
            </div>
          </div>
          <div style={s.statusRow}>
            <div style={{ ...s.dot, background: connected ? "#22c55e" : "#ef4444", boxShadow: connected ? "0 0 6px #22c55e" : "0 0 6px #ef4444" }} />
            <span style={s.statusText}>{connected ? "Online" : "Connecting..."}</span>
          </div>
        </div>

        <div style={s.queueHeader}>
          <span style={s.queueLabel}>LIVE QUEUE</span>
          <span style={{ ...s.queueBadge, background: queue.length > 0 ? "#0ea5e9" : "#1e2533" }}>{queue.length}</span>
        </div>

        <div style={s.queueList}>
          {queue.length === 0 ? (
            <div style={s.emptyQueue}>
              <div style={s.emptyCheck}>✓</div>
              <p style={s.emptyText}>Queue is clear</p>
            </div>
          ) : (
            queue.map((session, i) => (
              <div
                key={session.sessionId}
                style={{ ...s.queueCard, ...(selected?.sessionId === session.sessionId ? s.queueCardActive : {}) }}
                onClick={() => setSelected(session)}
              >
                <div style={s.queueCardTop}>
                  <span style={s.posNum}>#{i + 1}</span>
                  <span style={{ ...s.modPill, borderColor: moduleColor(session.intake?.moduleAffected), color: moduleColor(session.intake?.moduleAffected) }}>
                    {session.intake?.moduleAffected || "Unknown"}
                  </span>
                </div>
                <div style={s.queueName}>{session.customerName}</div>
                <div style={s.queueOrg}>{session.intake?.organizationName}</div>
                <div style={s.queueMeta}>
                  <span style={s.waitLabel}>⏱ {waitTime(session.startedAt)}</span>
                  <span style={s.osPill}>{session.intake?.osPlatform}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail Panel */}
      <div style={s.detail}>
        {selected ? (
          <>
            <div style={s.detailHeader}>
              <div>
                <h2 style={s.detailName}>{selected.customerName}</h2>
                <div style={s.detailMeta}>{selected.intake?.organizationName} · {selected.intake?.osPlatform}</div>
              </div>
              <button style={s.acceptBtn} onClick={() => handlePickUp(selected)}>
                Accept Chat →
              </button>
            </div>

            <Section title="Customer Issue" accent="#0ea5e9">
              <p style={s.issueText}>{selected.intake?.issueDescription || "No description provided."}</p>
            </Section>

            {selected.summary ? (
              <>
                <Section title="E.D.I.T.H Classification" accent="#a855f7">
                  <div style={s.classGrid}>
                    <ClassBox label="Module" value={selected.summary.moduleClassification} color={moduleColor(selected.summary.moduleClassification)} />
                    <ClassBox label="Issue Type" value={selected.summary.issueTypeClassification} color="#94a3b8" />
                  </div>
                </Section>

                <Section title="Recommended Steps" accent="#22c55e">
                  {selected.summary.recommendedSteps?.map((step, i) => (
                    <div key={i} style={s.stepRow}>
                      <span style={s.stepNum}>{i + 1}</span>
                      <span style={s.stepText}>{step}</span>
                    </div>
                  ))}
                </Section>

                {selected.summary.suggestedKBArticles?.length > 0 && (
                  <Section title="Suggested KB Articles" accent="#f59e0b">
                    {selected.summary.suggestedKBArticles.map((kb, i) => (
                      <div key={i} style={s.kbItem}>📄 {kb}</div>
                    ))}
                  </Section>
                )}

                {selected.summary.escalationRecommended && (
                  <div style={s.escalation}>
                    <span style={{ fontSize: "18px", color: "#dc2626" }}>⚠</span>
                    <div>
                      <div style={s.escalationTitle}>Escalation Recommended</div>
                      <div style={s.escalationReason}>{selected.summary.escalationReason}</div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={s.noSummary}>E.D.I.T.H summary not yet available for this session.</div>
            )}
          </>
        ) : (
          <div style={s.placeholder}>
            <div style={s.placeholderIcon}>←</div>
            <p style={s.placeholderText}>Select a session from the queue to review the intake details and E.D.I.T.H AI summary before joining.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, accent, children }) {
  return (
    <div style={{ display: "flex", gap: "14px", marginBottom: "24px" }}>
      <div style={{ width: "3px", borderRadius: "2px", background: accent, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ color: "#475569", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "12px" }}>{title}</div>
        {children}
      </div>
    </div>
  );
}

function ClassBox({ label, value, color }) {
  return (
    <div style={{ flex: 1, background: "#0a0f1a", border: "1px solid #1e2533", borderRadius: "8px", padding: "14px" }}>
      <div style={{ color: "#475569", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", marginBottom: "5px" }}>{label}</div>
      <div style={{ color, fontSize: "14px", fontWeight: "600" }}>{value}</div>
    </div>
  );
}

const s = {
  page: { display: "flex", height: "100vh", width: "100vw", background: "#080b12", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", overflow: "hidden" },
  sidebar: { width: "300px", minWidth: "300px", background: "#0a0f1a", borderRight: "1px solid #1a2035", display: "flex", flexDirection: "column", overflow: "hidden" },
  sidebarTop: { padding: "16px 18px", borderBottom: "1px solid #1a2035", display: "flex", alignItems: "center", justifyContent: "space-between" },
  logoRow: { display: "flex", alignItems: "center", gap: "10px" },
  logoMark: { width: "36px", height: "36px", borderRadius: "9px", background: "linear-gradient(135deg, #0ea5e9, #0369a1)", color: "#fff", fontWeight: "800", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  logoText: { color: "#e2e8f0", fontWeight: "700", fontSize: "13px" },
  agentLabel: { color: "#475569", fontSize: "11px" },
  statusRow: { display: "flex", alignItems: "center", gap: "6px" },
  dot: { width: "7px", height: "7px", borderRadius: "50%" },
  statusText: { color: "#475569", fontSize: "11px" },
  queueHeader: { padding: "12px 18px", borderBottom: "1px solid #1a2035", display: "flex", alignItems: "center", justifyContent: "space-between" },
  queueLabel: { color: "#334155", fontSize: "10px", fontWeight: "700", letterSpacing: "1px" },
  queueBadge: { color: "#fff", fontSize: "11px", fontWeight: "700", borderRadius: "10px", padding: "1px 9px" },
  queueList: { flex: 1, overflowY: "auto", padding: "10px" },
  emptyQueue: { textAlign: "center", padding: "48px 16px" },
  emptyCheck: { fontSize: "22px", color: "#22c55e", marginBottom: "8px" },
  emptyText: { color: "#334155", fontSize: "13px" },
  queueCard: { background: "#0d1117", border: "1px solid #1e2533", borderRadius: "10px", padding: "14px", marginBottom: "8px", cursor: "pointer" },
  queueCardActive: { borderColor: "#0ea5e9", background: "#0ea5e908" },
  queueCardTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "7px" },
  posNum: { color: "#334155", fontSize: "11px", fontWeight: "700" },
  modPill: { fontSize: "9px", fontWeight: "700", border: "1px solid", borderRadius: "4px", padding: "1px 6px", textTransform: "uppercase", letterSpacing: "0.4px" },
  queueName: { color: "#f1f5f9", fontSize: "14px", fontWeight: "600", marginBottom: "2px" },
  queueOrg: { color: "#475569", fontSize: "12px", marginBottom: "8px" },
  queueMeta: { display: "flex", gap: "8px" },
  waitLabel: { color: "#f59e0b", fontSize: "11px" },
  osPill: { color: "#334155", fontSize: "11px" },
  detail: { flex: 1, overflowY: "auto", padding: "28px 32px" },
  detailHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", paddingBottom: "22px", borderBottom: "1px solid #1a2035" },
  detailName: { color: "#f1f5f9", fontSize: "24px", fontWeight: "700", margin: "0 0 5px" },
  detailMeta: { color: "#475569", fontSize: "13px" },
  acceptBtn: { background: "linear-gradient(135deg, #0ea5e9, #0369a1)", color: "#fff", border: "none", borderRadius: "9px", padding: "11px 24px", fontSize: "13px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 15px rgba(14,165,233,0.3)" },
  issueText: { color: "#94a3b8", fontSize: "14px", lineHeight: "1.7", margin: 0 },
  classGrid: { display: "flex", gap: "12px" },
  stepRow: { display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "10px" },
  stepNum: { width: "20px", height: "20px", borderRadius: "50%", background: "#22c55e15", border: "1px solid #22c55e40", color: "#22c55e", fontSize: "10px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  stepText: { color: "#94a3b8", fontSize: "13px", lineHeight: "1.6" },
  kbItem: { color: "#a78bfa", fontSize: "13px", padding: "9px 12px", background: "#0a0f1a", border: "1px solid #1e2533", borderRadius: "7px", marginBottom: "6px" },
  escalation: { display: "flex", gap: "12px", background: "#dc262608", border: "1px solid #dc262630", borderRadius: "10px", padding: "14px 16px", marginTop: "8px" },
  escalationTitle: { color: "#fca5a5", fontSize: "13px", fontWeight: "700", marginBottom: "3px" },
  escalationReason: { color: "#64748b", fontSize: "12px" },
  noSummary: { color: "#334155", fontSize: "13px", fontStyle: "italic" },
  placeholder: { height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" },
  placeholderIcon: { fontSize: "36px", color: "#1a2035", marginBottom: "16px" },
  placeholderText: { color: "#334155", fontSize: "14px", maxWidth: "280px", lineHeight: "1.7" },
};