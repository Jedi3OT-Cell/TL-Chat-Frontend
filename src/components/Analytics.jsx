// Analytics.jsx — E.D.I.T.H Command Analytics
import { useState, useEffect } from "react";

const AGENTS = ["Tillman", "Agent 2", "Agent 3"];

function generateMockData() {
  return AGENTS.map((name) => ({
    name,
    totalChats: Math.floor(Math.random() * 80) + 20,
    missedChats: Math.floor(Math.random() * 10),
    greetingsConversion: Math.floor(Math.random() * 30) + 65,
    satisfaction: (Math.random() * 1.5 + 3.5).toFixed(1),
    engagement: Math.floor(Math.random() * 20) + 75,
    surveysCompleted: Math.floor(Math.random() * 40) + 10,
    availability: Math.floor(Math.random() * 20) + 78,
    resolved: Math.floor(Math.random() * 60) + 15,
    escalated: Math.floor(Math.random() * 10) + 2,
    reviews: [
      { rating: 5, comment: "Very helpful and fast resolution.", date: "2026-03-07" },
      { rating: 4, comment: "Knew exactly where to look in the registry.", date: "2026-03-06" },
      { rating: 5, comment: "Resolved my Ringfencing issue in under 5 minutes.", date: "2026-03-05" },
    ],
  }));
}

function StatCard({ label, value, sub, color, pulse }) {
  return (
    <div style={{ ...styles.statCard, borderColor: color + "40" }}>
      <div style={{ ...styles.statCardGlow, background: color + "10" }} />
      <div style={styles.statLabel}>{label}</div>
      <div style={{ ...styles.statValue, color }}>
        {pulse && <span style={styles.pulseDot} />}
        {value}
      </div>
      {sub && <div style={styles.statSub}>{sub}</div>}
    </div>
  );
}

function StarRating({ rating }) {
  return (
    <div style={styles.stars}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ color: s <= Math.round(rating) ? "#f59e0b" : "#1e2533", fontSize: "14px" }}>★</span>
      ))}
    </div>
  );
}

function RatingBar({ value, max = 100, color }) {
  return (
    <div style={styles.barTrack}>
      <div style={{ ...styles.barFill, width: `${(value / max) * 100}%`, background: color }} />
    </div>
  );
}

export default function Analytics({ agentName, onBack }) {
  const [data] = useState(generateMockData);
  const [selected, setSelected] = useState(data[0]);
  const [tab, setTab] = useState("overview");
  const [scanLine, setScanLine] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanLine((prev) => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const totals = {
    totalChats: data.reduce((a, b) => a + b.totalChats, 0),
    missedChats: data.reduce((a, b) => a + b.missedChats, 0),
    avgSatisfaction: (data.reduce((a, b) => a + parseFloat(b.satisfaction), 0) / data.length).toFixed(1),
    avgAvailability: Math.round(data.reduce((a, b) => a + b.availability, 0) / data.length),
  };

  return (
    <div style={styles.page}>
      {/* Scan line effect */}
      <div style={{ ...styles.scanLine, top: `${scanLine}%` }} />

      {/* Grid overlay */}
      <div style={styles.gridOverlay} />

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logoMark}>
            <span style={styles.logoText}>TL</span>
            <div style={styles.logoRing} />
          </div>
          <div>
            <div style={styles.headerTitle}>E.D.I.T.H COMMAND</div>
            <div style={styles.headerSub}>
              <span style={styles.activeDot} />
              ANALYTICS & PERFORMANCE MATRIX — LIVE
            </div>
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.dateChip}>{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</div>
          <button style={styles.backBtn} onClick={onBack}>← BACK TO CONSOLE</button>
        </div>
      </div>

      {/* Command Strip */}
      <div style={styles.commandStrip}>
        <div style={styles.commandItem}>
          <span style={styles.commandDot} />
          SYSTEM OPERATIONAL
        </div>
        <div style={styles.commandItem}>AGENTS ONLINE: {AGENTS.length}</div>
        <div style={styles.commandItem}>SESSIONS TODAY: {totals.totalChats}</div>
        <div style={styles.commandItem}>AVG SATISFACTION: {totals.avgSatisfaction}/5.0</div>
        <div style={styles.commandItem}>AVAILABILITY: {totals.avgAvailability}%</div>
      </div>

      <div style={styles.body}>
        {/* Sidebar — Agent List */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarTitle}>AGENT ROSTER</div>
          {data.map((agent) => (
            <div
              key={agent.name}
              style={{ ...styles.agentCard, ...(selected.name === agent.name ? styles.agentCardActive : {}) }}
              onClick={() => setSelected(agent)}
            >
              <div style={styles.agentAvatar}>
                {agent.name.charAt(0)}
                <div style={styles.agentOnlineDot} />
              </div>
              <div>
                <div style={styles.agentName}>{agent.name}</div>
                <div style={styles.agentMeta}>{agent.totalChats} sessions · {agent.satisfaction}★</div>
              </div>
            </div>
          ))}

          {/* Team Totals */}
          <div style={styles.teamTotals}>
            <div style={styles.sidebarTitle}>TEAM TOTALS</div>
            <div style={styles.totalRow}><span>Total Chats</span><span style={styles.totalVal}>{totals.totalChats}</span></div>
            <div style={styles.totalRow}><span>Missed Chats</span><span style={{ ...styles.totalVal, color: "#ef4444" }}>{totals.missedChats}</span></div>
            <div style={styles.totalRow}><span>Avg Satisfaction</span><span style={{ ...styles.totalVal, color: "#f59e0b" }}>{totals.avgSatisfaction}/5</span></div>
            <div style={styles.totalRow}><span>Avg Availability</span><span style={{ ...styles.totalVal, color: "#22c55e" }}>{totals.avgAvailability}%</span></div>
          </div>
        </div>

        {/* Main Panel */}
        <div style={styles.main}>
          {/* Agent Header */}
          <div style={styles.agentHeader}>
            <div style={styles.agentHeaderLeft}>
              <div style={styles.agentBigAvatar}>{selected.name.charAt(0)}</div>
              <div>
                <div style={styles.agentBigName}>{selected.name}</div>
                <div style={styles.agentBigMeta}>Support Agent · ThreatLocker</div>
              </div>
            </div>
            <div style={styles.tabs}>
              {["overview", "reviews", "surveys"].map((t) => (
                <button key={t} style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }} onClick={() => setTab(t)}>
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {tab === "overview" && (
            <>
              {/* Stat Cards */}
              <div style={styles.statGrid}>
                <StatCard label="TOTAL CHATS" value={selected.totalChats} sub="This period" color="#0ea5e9" pulse />
                <StatCard label="MISSED CHATS" value={selected.missedChats} sub="Needs review" color="#ef4444" />
                <StatCard label="GREETINGS CONV." value={`${selected.greetingsConversion}%`} sub="Converted to session" color="#22c55e" />
                <StatCard label="SATISFACTION" value={`${selected.satisfaction}/5`} sub="Avg customer rating" color="#f59e0b" />
                <StatCard label="ENGAGEMENT" value={`${selected.engagement}%`} sub="Active chat rate" color="#a855f7" />
                <StatCard label="SURVEYS DONE" value={selected.surveysCompleted} sub="Completed surveys" color="#0ea5e9" />
                <StatCard label="AVAILABILITY" value={`${selected.availability}%`} sub="Online time" color="#22c55e" pulse />
                <StatCard label="RESOLVED" value={selected.resolved} sub="Sessions closed" color="#0ea5e9" />
              </div>

              {/* Performance Bars */}
              <div style={styles.barsPanel}>
                <div style={styles.barsPanelTitle}>PERFORMANCE METRICS</div>
                <div style={styles.barsGrid}>
                  {[
                    { label: "Greetings Conversion", value: selected.greetingsConversion, color: "#22c55e" },
                    { label: "Chat Engagement", value: selected.engagement, color: "#0ea5e9" },
                    { label: "Availability", value: selected.availability, color: "#a855f7" },
                    { label: "Resolution Rate", value: Math.round((selected.resolved / selected.totalChats) * 100), color: "#f59e0b" },
                  ].map((m) => (
                    <div key={m.label} style={styles.barRow}>
                      <div style={styles.barLabel}>{m.label}</div>
                      <RatingBar value={m.value} color={m.color} />
                      <div style={{ ...styles.barPct, color: m.color }}>{m.value}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === "reviews" && (
            <div style={styles.reviewsPanel}>
              <div style={styles.reviewsHeader}>
                <div style={styles.reviewsBigRating}>{selected.satisfaction}</div>
                <div>
                  <StarRating rating={selected.satisfaction} />
                  <div style={styles.reviewsCount}>{selected.reviews.length} reviews</div>
                </div>
              </div>
              {selected.reviews.map((r, i) => (
                <div key={i} style={styles.reviewCard}>
                  <div style={styles.reviewTop}>
                    <StarRating rating={r.rating} />
                    <div style={styles.reviewDate}>{r.date}</div>
                  </div>
                  <div style={styles.reviewComment}>{r.comment}</div>
                </div>
              ))}
            </div>
          )}

          {tab === "surveys" && (
            <div style={styles.surveysPanel}>
              <div style={styles.surveysStat}>
                <div style={styles.surveysNum}>{selected.surveysCompleted}</div>
                <div style={styles.surveysSub}>Surveys Completed</div>
              </div>
              <div style={styles.surveysList}>
                {["Issue resolved on first contact", "Agent was knowledgeable", "Response time was acceptable", "Would contact support again"].map((q, i) => {
                  const pct = Math.floor(Math.random() * 25) + 70;
                  return (
                    <div key={i} style={styles.surveyRow}>
                      <div style={styles.surveyQ}>{q}</div>
                      <RatingBar value={pct} color="#0ea5e9" />
                      <div style={styles.surveyPct}>{pct}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { position: "relative", display: "flex", flexDirection: "column", height: "100vh", width: "100vw", background: "#020509", overflow: "hidden", fontFamily: "'Courier New', 'Consolas', monospace", color: "#94a3b8" },
  scanLine: { position: "absolute", left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, #0ea5e920, transparent)", pointerEvents: "none", zIndex: 10, transition: "top 0.05s linear" },
  gridOverlay: { position: "absolute", inset: 0, backgroundImage: "linear-gradient(#0ea5e905 1px, transparent 1px), linear-gradient(90deg, #0ea5e905 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0 },
  header: { position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px", background: "rgba(2,5,9,0.95)", borderBottom: "1px solid #0ea5e920", backdropFilter: "blur(10px)" },
  headerLeft: { display: "flex", alignItems: "center", gap: "16px" },
  logoMark: { position: "relative", width: "42px", height: "42px", display: "flex", alignItems: "center", justifyContent: "center" },
  logoText: { position: "relative", zIndex: 1, color: "#0ea5e9", fontWeight: "900", fontSize: "13px", letterSpacing: "1px" },
  logoRing: { position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid #0ea5e960", boxShadow: "0 0 12px #0ea5e940, inset 0 0 12px #0ea5e920" },
  headerTitle: { color: "#e2e8f0", fontWeight: "900", fontSize: "15px", letterSpacing: "3px" },
  headerSub: { display: "flex", alignItems: "center", gap: "6px", color: "#0ea5e9", fontSize: "10px", letterSpacing: "2px", marginTop: "3px" },
  activeDot: { width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e", flexShrink: 0 },
  headerRight: { display: "flex", alignItems: "center", gap: "12px" },
  dateChip: { color: "#475569", fontSize: "10px", letterSpacing: "1px", padding: "4px 10px", border: "1px solid #1e2533", borderRadius: "4px" },
  backBtn: { background: "transparent", border: "1px solid #0ea5e940", color: "#0ea5e9", borderRadius: "4px", padding: "7px 16px", fontSize: "10px", fontWeight: "700", letterSpacing: "1px", cursor: "pointer" },
  commandStrip: { position: "relative", zIndex: 2, display: "flex", gap: "32px", padding: "8px 28px", background: "#0a0f1a", borderBottom: "1px solid #0ea5e915", fontSize: "10px", letterSpacing: "1.5px", color: "#475569", overflowX: "auto" },
  commandItem: { display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" },
  commandDot: { width: "4px", height: "4px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 4px #22c55e" },
  body: { position: "relative", zIndex: 2, display: "flex", flex: 1, overflow: "hidden" },
  sidebar: { width: "260px", minWidth: "260px", background: "rgba(10,15,26,0.9)", borderRight: "1px solid #0ea5e915", overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: "8px" },
  sidebarTitle: { color: "#475569", fontSize: "9px", fontWeight: "700", letterSpacing: "2px", padding: "8px 4px 6px", borderBottom: "1px solid #0ea5e915", marginBottom: "8px" },
  agentCard: { display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "6px", border: "1px solid transparent", cursor: "pointer", transition: "all 0.2s" },
  agentCardActive: { background: "#0ea5e910", border: "1px solid #0ea5e930", boxShadow: "0 0 12px #0ea5e910" },
  agentAvatar: { position: "relative", width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg, #0ea5e9, #0369a1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "700", fontSize: "13px", flexShrink: 0 },
  agentOnlineDot: { position: "absolute", bottom: 0, right: 0, width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", border: "2px solid #0a0f1a", boxShadow: "0 0 4px #22c55e" },
  agentName: { color: "#e2e8f0", fontSize: "13px", fontWeight: "700" },
  agentMeta: { color: "#475569", fontSize: "10px", marginTop: "2px" },
  teamTotals: { marginTop: "16px", padding: "14px", background: "#020509", border: "1px solid #0ea5e915", borderRadius: "6px" },
  totalRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #0ea5e910", fontSize: "11px" },
  totalVal: { color: "#0ea5e9", fontWeight: "700" },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "20px 24px", gap: "16px", overflowY: "auto" },
  agentHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "#0a0f1a", border: "1px solid #0ea5e920", borderRadius: "8px", boxShadow: "0 0 20px #0ea5e908" },
  agentHeaderLeft: { display: "flex", alignItems: "center", gap: "14px" },
  agentBigAvatar: { width: "44px", height: "44px", borderRadius: "10px", background: "linear-gradient(135deg, #0ea5e9, #0369a1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "900", fontSize: "18px", boxShadow: "0 0 16px #0ea5e940" },
  agentBigName: { color: "#e2e8f0", fontWeight: "900", fontSize: "16px", letterSpacing: "1px" },
  agentBigMeta: { color: "#475569", fontSize: "11px", letterSpacing: "1px", marginTop: "3px" },
  tabs: { display: "flex", gap: "6px" },
  tab: { background: "transparent", border: "1px solid #1e2533", color: "#475569", borderRadius: "4px", padding: "7px 14px", fontSize: "10px", fontWeight: "700", letterSpacing: "1.5px", cursor: "pointer" },
  tabActive: { background: "#0ea5e915", border: "1px solid #0ea5e940", color: "#0ea5e9", boxShadow: "0 0 8px #0ea5e920" },
  statGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" },
  statCard: { position: "relative", padding: "16px", background: "#0a0f1a", border: "1px solid #1e2533", borderRadius: "8px", overflow: "hidden" },
  statCardGlow: { position: "absolute", inset: 0, opacity: 0.5 },
  statLabel: { fontSize: "9px", fontWeight: "700", letterSpacing: "2px", color: "#475569", marginBottom: "8px" },
  statValue: { fontSize: "24px", fontWeight: "900", letterSpacing: "1px", display: "flex", alignItems: "center", gap: "8px" },
  statSub: { fontSize: "10px", color: "#334155", marginTop: "4px", letterSpacing: "0.5px" },
  pulseDot: { width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e", flexShrink: 0 },
  barsPanel: { padding: "18px 20px", background: "#0a0f1a", border: "1px solid #0ea5e920", borderRadius: "8px" },
  barsPanelTitle: { color: "#475569", fontSize: "9px", fontWeight: "700", letterSpacing: "2px", marginBottom: "16px" },
  barsGrid: { display: "flex", flexDirection: "column", gap: "12px" },
  barRow: { display: "flex", alignItems: "center", gap: "14px" },
  barLabel: { width: "180px", fontSize: "11px", color: "#64748b", letterSpacing: "0.5px", flexShrink: 0 },
  barTrack: { flex: 1, height: "4px", background: "#1e2533", borderRadius: "2px", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: "2px", transition: "width 1s ease" },
  barPct: { width: "40px", fontSize: "11px", fontWeight: "700", textAlign: "right", flexShrink: 0 },
  reviewsPanel: { display: "flex", flexDirection: "column", gap: "12px" },
  reviewsHeader: { display: "flex", alignItems: "center", gap: "20px", padding: "20px", background: "#0a0f1a", border: "1px solid #0ea5e920", borderRadius: "8px" },
  reviewsBigRating: { fontSize: "48px", fontWeight: "900", color: "#f59e0b", letterSpacing: "-2px" },
  reviewsCount: { color: "#475569", fontSize: "11px", marginTop: "4px", letterSpacing: "1px" },
  reviewCard: { padding: "16px 18px", background: "#0a0f1a", border: "1px solid #1e2533", borderRadius: "8px" },
  reviewTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" },
  reviewDate: { color: "#334155", fontSize: "10px", letterSpacing: "1px" },
  reviewComment: { color: "#64748b", fontSize: "13px", lineHeight: "1.6" },
  stars: { display: "flex", gap: "2px" },
  surveysPanel: { display: "flex", flexDirection: "column", gap: "16px" },
  surveysStat: { display: "flex", flexDirection: "column", alignItems: "center", padding: "24px", background: "#0a0f1a", border: "1px solid #0ea5e920", borderRadius: "8px" },
  surveysNum: { fontSize: "52px", fontWeight: "900", color: "#0ea5e9", letterSpacing: "-2px" },
  surveysSub: { color: "#475569", fontSize: "11px", letterSpacing: "2px", marginTop: "4px" },
  surveysList: { display: "flex", flexDirection: "column", gap: "14px", padding: "18px 20px", background: "#0a0f1a", border: "1px solid #1e2533", borderRadius: "8px" },
  surveyRow: { display: "flex", alignItems: "center", gap: "14px" },
  surveyQ: { width: "260px", fontSize: "11px", color: "#64748b", flexShrink: 0 },
  surveyPct: { width: "40px", fontSize: "11px", fontWeight: "700", color: "#0ea5e9", textAlign: "right", flexShrink: 0 },
};
