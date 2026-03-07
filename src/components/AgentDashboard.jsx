// AgentDashboard.jsx
import { useState, useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";

export default function AgentDashboard({ agentName, onJoinSession }) {
  const [queue, setQueue] = useState([]);
  const [selected, setSelected] = useState(null);
  const [connected, setConnected] = useState(false);
  const connRef = useRef(null);

  useEffect(() => {
    const conn = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5000/chathub")
      .withAutomaticReconnect()
      .build();

    conn.on("AgentRegistered", () => setConnected(true));

    // Handles both a single session (new queue entry) and a full array (after join/close)
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
      // Pull current queue on load
      fetch("http://localhost:5000/api/chat/queue")
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
    <div style={styles.page}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logoRow}>
            <div style={styles.logoMark}>TL</div>
            <div>
              <div style={styles.logoText}>Support Console</div>
              <div style={styles.agentBadge}>Agent: {agentName}</div>
            </div>
          </div>
          <div style={styles.connectionStatus}>
            <div style={{ ...styles.dot, background: connected ? "#22c55e" : "#ef4444", boxShadow: connected ? "0 0 6px #22c55e" : "0 0 6px #ef4444" }} />
            <span style={styles.connLabel}>{connected ? "Online" : "Connecting..."}</span>
          </div>
        </div>

        <div style={styles.queueHeader}>
          <span style={styles.queueTitle}>Live Queue</span>
          <span style={styles.queueCount}>{queue.length}</span>
        </div>

        <div style={styles.queueList}>
          {queue.length === 0 ? (
            <div style={styles.emptyQueue}>
              <div style={styles.emptyIcon}>✓</div>
              <p style={styles.emptyText}>Queue is clear</p>
            </div>
          ) : (
            queue.map((session, i) => (
              <div
                key={session.sessionId}
                style={{
                  ...styles.queueItem,
                  ...(selected?.sessionId === session.sessionId ? styles.queueItemActive : {}),
                }}
                onClick={() => setSelected(session)}
              >
                <div style={styles.queueItemTop}>
                  <span style={styles.positionNum}>#{i + 1}</span>
                  <span style={{ ...styles.modulePill, borderColor: moduleColor(session.intake?.moduleAffected), color: moduleColor(session.intake?.moduleAffected) }}>
                    {session.intake?.moduleAffected || "Unknown"}
                  </span>
                </div>
                <div style={styles.queueCustomer}>{session.customerName}</div>
                <div style={styles.queueOrg}>{session.intake?.organizationName}</div>
                <div style={styles.queueMeta}>
                  <span style={styles.waitChip}>⏱ {waitTime(session.startedAt)}</span>
                  <span style={styles.osPill}>{session.intake?.osPlatform}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail Panel */}
      <div style={styles.detail}>
        {selected ? (
          <>
            <div style={styles.detailHeader}>
              <div>
                <h2 style={styles.detailName}>{selected.customerName}</h2>
                <span style={styles.detailOrg}>{selected.intake?.organizationName} — {selected.intake?.osPlatform}</span>
              </div>
              <button style={styles.joinBtn} onClick={() => handlePickUp(selected)}>
                Accept Chat →
              </button>
            </div>

            {/* Intake Summary */}
            <Section title="Customer Issue">
              <p style={styles.issueText}>{selected.intake?.issueDescription || "No description provided."}</p>
            </Section>

            {/* AI Summary */}
            {selected.summary ? (
              <>
                <Section title="AI Classification" accent="#0ea5e9">
                  <div style={styles.classRow}>
                    <ClassBox label="Module" value={selected.summary.moduleClassification} color={moduleColor(selected.summary.moduleClassification)} />
                    <ClassBox label="Issue Type" value={selected.summary.issueTypeClassification} color="#94a3b8" />
                  </div>
                </Section>

                <Section title="Recommended Investigation Steps" accent="#22c55e">
                  <ol style={styles.stepList}>
                    {selected.summary.recommendedSteps.map((step, i) => (
                      <li key={i} style={styles.stepItem}>
                        <span style={styles.stepNum}>{i + 1}</span>
                        <span style={styles.stepText}>{step}</span>
                      </li>
                    ))}
                  </ol>
                </Section>

                <Section title="Suggested KB Articles" accent="#a855f7">
                  <div style={styles.kbList}>
                    {selected.summary.suggestedKBArticles.map((kb, i) => (
                      <div key={i} style={styles.kbItem}>
                        <span style={styles.kbIcon}>📄</span>
                        <span style={styles.kbText}>{kb}</span>
                      </div>
                    ))}
                  </div>
                </Section>

                {selected.summary.escalationRecommended && (
                  <div style={styles.escalationBanner}>
                    <span style={styles.escalationIcon}>⚠</span>
                    <div>
                      <div style={styles.escalationTitle}>Escalation Recommended</div>
                      <div style={styles.escalationReason}>{selected.summary.escalationReason}</div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={styles.noSummary}>Summary not yet available for this session.</div>
            )}
          </>
        ) : (
          <div style={styles.placeholder}>
            <div style={styles.placeholderIcon}>←</div>
            <p style={styles.placeholderText}>Select a session from the queue to review intake details and the AI summary before joining.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, accent = "#1e2533", children }) {
  return (
    <div style={styles.section}>
      <div style={{ ...styles.sectionBar, borderLeftColor: accent }} />
      <div style={styles.sectionInner}>
        <div style={styles.sectionTitle}>{title}</div>
        {children}
      </div>
    </div>
  );
}

function ClassBox({ label, value, color }) {
  return (
    <div style={styles.classBox}>
      <div style={styles.classLabel}>{label}</div>
      <div style={{ ...styles.classValue, color }}>{value}</div>
    </div>
  );
}

const styles = {
  page: {
    display: "flex", height: "100vh", background: "#0b0e14",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif", overflow: "hidden",
  },
  sidebar: {
    width: "300px", minWidth: "300px",
    background: "#0d1117", borderRight: "1px solid #1e2533",
    display: "flex", flexDirection: "column", overflow: "hidden",
  },
  sidebarHeader: {
    padding: "16px", borderBottom: "1px solid #1e2533",
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  logoRow: { display: "flex", alignItems: "center", gap: "10px" },
  logoMark: {
    width: "36px", height: "36px", borderRadius: "8px",
    background: "linear-gradient(135deg, #0ea5e9, #0369a1)",
    color: "#fff", fontWeight: "800", fontSize: "13px",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  logoText: { color: "#e2e8f0", fontWeight: "700", fontSize: "13px" },
  agentBadge: { color: "#6b7280", fontSize: "11px", marginTop: "1px" },
  connectionStatus: { display: "flex", alignItems: "center", gap: "5px" },
  dot: { width: "7px", height: "7px", borderRadius: "50%" },
  connLabel: { color: "#6b7280", fontSize: "11px" },
  queueHeader: {
    padding: "12px 16px", borderBottom: "1px solid #1e2533",
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  queueTitle: { color: "#94a3b8", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.8px" },
  queueCount: {
    background: "#0ea5e9", color: "#fff",
    fontSize: "11px", fontWeight: "700",
    borderRadius: "10px", padding: "1px 8px",
  },
  queueList: { flex: 1, overflowY: "auto", padding: "8px" },
  emptyQueue: { textAlign: "center", padding: "40px 16px" },
  emptyIcon: { fontSize: "24px", color: "#22c55e", marginBottom: "8px" },
  emptyText: { color: "#6b7280", fontSize: "13px", margin: 0 },
  queueItem: {
    background: "#12151e", border: "1px solid #1e2533", borderRadius: "8px",
    padding: "12px", marginBottom: "8px", cursor: "pointer",
    transition: "border-color 0.15s",
  },
  queueItemActive: { borderColor: "#0ea5e9" },
  queueItemTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" },
  positionNum: { color: "#6b7280", fontSize: "11px", fontWeight: "700" },
  modulePill: {
    fontSize: "10px", fontWeight: "700", border: "1px solid",
    borderRadius: "4px", padding: "1px 6px", textTransform: "uppercase", letterSpacing: "0.3px",
  },
  queueCustomer: { color: "#f1f5f9", fontSize: "14px", fontWeight: "600", marginBottom: "2px" },
  queueOrg: { color: "#6b7280", fontSize: "12px", marginBottom: "8px" },
  queueMeta: { display: "flex", gap: "6px", alignItems: "center" },
  waitChip: { color: "#f59e0b", fontSize: "11px" },
  osPill: { color: "#475569", fontSize: "11px" },
  detail: {
    flex: 1, overflowY: "auto", padding: "24px 28px",
  },
  detailHeader: {
    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
    marginBottom: "24px", paddingBottom: "20px", borderBottom: "1px solid #1e2533",
  },
  detailName: { color: "#f1f5f9", fontSize: "22px", fontWeight: "700", margin: "0 0 4px" },
  detailOrg: { color: "#6b7280", fontSize: "13px" },
  joinBtn: {
    background: "linear-gradient(135deg, #0ea5e9, #0369a1)",
    color: "#fff", border: "none", borderRadius: "8px",
    padding: "10px 22px", fontSize: "13px", fontWeight: "700",
    cursor: "pointer", whiteSpace: "nowrap",
  },
  section: {
    display: "flex", gap: "12px", marginBottom: "20px",
  },
  sectionBar: {
    width: "3px", borderRadius: "2px", flexShrink: 0,
    borderLeft: "3px solid",
    alignSelf: "stretch",
  },
  sectionInner: { flex: 1 },
  sectionTitle: {
    color: "#94a3b8", fontSize: "11px", fontWeight: "700",
    textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "10px",
  },
  issueText: { color: "#cbd5e1", fontSize: "14px", lineHeight: "1.6", margin: 0 },
  classRow: { display: "flex", gap: "12px" },
  classBox: {
    flex: 1, background: "#0d1117", border: "1px solid #1e2533",
    borderRadius: "8px", padding: "12px",
  },
  classLabel: { color: "#6b7280", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", marginBottom: "4px" },
  classValue: { fontSize: "14px", fontWeight: "600" },
  stepList: { margin: 0, padding: 0, listStyle: "none" },
  stepItem: {
    display: "flex", gap: "10px", alignItems: "flex-start",
    marginBottom: "10px",
  },
  stepNum: {
    width: "22px", height: "22px", borderRadius: "50%",
    background: "#22c55e22", border: "1px solid #22c55e",
    color: "#22c55e", fontSize: "11px", fontWeight: "700",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  stepText: { color: "#cbd5e1", fontSize: "13px", lineHeight: "1.5", paddingTop: "2px" },
  kbList: { display: "flex", flexDirection: "column", gap: "8px" },
  kbItem: {
    display: "flex", alignItems: "center", gap: "8px",
    background: "#0d1117", border: "1px solid #1e2533",
    borderRadius: "6px", padding: "10px 12px",
  },
  kbIcon: { fontSize: "14px" },
  kbText: { color: "#a78bfa", fontSize: "13px" },
  escalationBanner: {
    display: "flex", gap: "12px", alignItems: "flex-start",
    background: "#451a0322", border: "1px solid #dc2626",
    borderRadius: "8px", padding: "14px 16px", marginTop: "8px",
  },
  escalationIcon: { fontSize: "18px", color: "#dc2626", flexShrink: 0 },
  escalationTitle: { color: "#fca5a5", fontSize: "13px", fontWeight: "700", marginBottom: "2px" },
  escalationReason: { color: "#6b7280", fontSize: "13px" },
  noSummary: { color: "#6b7280", fontSize: "13px", fontStyle: "italic" },
  placeholder: {
    height: "100%", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", textAlign: "center",
  },
  placeholderIcon: { fontSize: "32px", color: "#1e2533", marginBottom: "12px" },
  placeholderText: { color: "#475569", fontSize: "14px", maxWidth: "280px", lineHeight: "1.6" },
};
