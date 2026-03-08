// ChatWindow.jsx — E.D.I.T.H JARVIS Interface
import { useState, useEffect, useRef } from "react";

export default function ChatWindow({ connection, sessionId, senderName, senderRole, summary, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(null);
  const [sessionClosed, setSessionClosed] = useState(false);
  const [rating, setRating] = useState(0);
  const [rated, setRated] = useState(false);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    if (!connection) return;
    connection.on("ReceiveMessage", (msg) => setMessages((prev) => [...prev, msg]));
    connection.on("UserTyping", (name, isTyping) => setTyping(isTyping ? name : null));
    connection.on("AgentJoined", (agentName) => {
      setMessages((prev) => [...prev, { sessionId, senderName: "SYSTEM", senderRole: "system", message: `${agentName} has joined the session.`, timestamp: new Date().toISOString() }]);
    });
    connection.on("SessionClosed", () => {
      setSessionClosed(true);
      setMessages((prev) => [...prev, { sessionId, senderName: "SYSTEM", senderRole: "system", message: "Session has been closed.", timestamp: new Date().toISOString() }]);
    });
    return () => {
      connection.off("ReceiveMessage");
      connection.off("UserTyping");
      connection.off("AgentJoined");
      connection.off("SessionClosed");
    };
  }, [connection]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  const sendMessage = async () => {
    if (!input.trim() || sessionClosed) return;
    await connection.invoke("SendMessage", sessionId, senderName, input.trim(), senderRole);
    setInput("");
    await connection.invoke("TypingIndicator", sessionId, senderName, false);
  };

  const handleKeyDown = async (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); await sendMessage(); return; }
    await connection.invoke("TypingIndicator", sessionId, senderName, true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => connection.invoke("TypingIndicator", sessionId, senderName, false), 2000);
  };

  const handleClose = async () => {
    if (senderRole === "agent") await connection.invoke("CloseSession", sessionId);
    onClose();
  };

  const moduleColor = (mod) => {
    if (!mod) return "#475569";
    const m = mod.toLowerCase();
    if (m.includes("application")) return "#0ea5e9";
    if (m.includes("ringfencing")) return "#a855f7";
    if (m.includes("storage")) return "#f59e0b";
    if (m.includes("network")) return "#22c55e";
    if (m.includes("elevation")) return "#ef4444";
    if (m.includes("configuration")) return "#06b6d4";
    return "#475569";
  };

  const threatColors = {
    LOW: { bg: "#22c55e20", color: "#22c55e", border: "#22c55e40" },
    MEDIUM: { bg: "#f59e0b20", color: "#f59e0b", border: "#f59e0b40" },
    HIGH: { bg: "#ef444420", color: "#ef4444", border: "#ef444440" },
    CRITICAL: { bg: "#ff004020", color: "#ff0040", border: "#ff004040" },
  };
  const tc = threatColors[summary?.threatLevel] || { bg: "#47556920", color: "#475569", border: "#47556940" };

  return (
    <div style={s.page}>
      <div style={s.grid} />
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.logoMark}><span style={s.logoText}>TL</span><div style={s.logoRing} /></div>
          <div>
            <div style={s.headerTitle}>SECURE SESSION</div>
            <div style={s.headerSub}><span style={s.onlineDot} />{senderRole === "agent" ? `AGENT: ${senderName?.toUpperCase()}` : `SESSION: ${sessionId?.slice(0,8).toUpperCase()}`}</div>
          </div>
        </div>
        <button style={s.closeBtn} onClick={handleClose}>{senderRole === "agent" ? "CLOSE SESSION ✕" : "LEAVE ✕"}</button>
      </div>

      <div style={s.body}>
        {senderRole === "agent" && summary && (
          <div style={s.sidebar}>
            <div style={s.sidebarHeader}><span style={s.edithBadge}>E.D.I.T.H</span><span style={s.edithLabel}>ANALYSIS</span></div>
            <div style={s.block}><div style={s.blockLabel}>MODULE</div><div style={{ ...s.blockValue, color: moduleColor(summary.moduleClassification) }}>{summary.moduleClassification || "—"}</div></div>
            <div style={s.block}><div style={s.blockLabel}>ISSUE TYPE</div><div style={s.blockValueSm}>{summary.issueTypeClassification || "—"}</div></div>
            {summary.confidenceScore !== undefined && (
              <div style={s.block}>
                <div style={s.blockLabel}>CONFIDENCE — {summary.confidenceScore}%</div>
                <div style={s.confBar}><div style={{ ...s.confFill, width: `${summary.confidenceScore}%`, background: summary.confidenceScore >= 80 ? "#22c55e" : summary.confidenceScore >= 60 ? "#f59e0b" : "#ef4444" }} /></div>
              </div>
            )}
            {summary.threatLevel && (
              <div style={s.block}>
                <div style={s.blockLabel}>THREAT LEVEL</div>
                <div style={{ ...s.threatPill, background: tc.bg, color: tc.color, borderColor: tc.border }}>
                  <span style={{ ...s.threatDot, background: tc.color }} />{summary.threatLevel}
                </div>
              </div>
            )}
            {summary.recommendedSteps?.length > 0 && (
              <div style={s.block}>
                <div style={s.blockLabel}>RECOMMENDED STEPS</div>
                {summary.recommendedSteps.map((step, i) => (
                  <div key={i} style={s.step}><span style={s.stepNum}>{i+1}</span><span style={s.stepText}>{step}</span></div>
                ))}
              </div>
            )}
            {summary.suggestedKBArticles?.length > 0 && (
              <div style={s.block}>
                <div style={s.blockLabel}>KB ARTICLES</div>
                {summary.suggestedKBArticles.map((kb, i) => (
                  <a key={i} href={`https://www.google.com/search?q=ThreatLocker+${encodeURIComponent(kb)}`} target="_blank" rel="noopener noreferrer" style={s.kbLink}>▶ {kb}</a>
                ))}
              </div>
            )}
            {summary.escalationRecommended && (
              <div style={s.escalation}><div style={s.escalationTitle}>⚠ ESCALATE</div><div style={s.escalationReason}>{summary.escalationReason}</div></div>
            )}
          </div>
        )}

        <div style={s.chatArea}>
          <div style={s.messages}>
            {messages.map((msg, i) => {
              const isMe = msg.senderName === senderName;
              const isSystem = msg.senderRole === "system";
              return (
                <div key={i} style={{ ...s.row, justifyContent: isSystem ? "center" : isMe ? "flex-end" : "flex-start" }}>
                  {isSystem ? (
                    <div style={s.systemMsg}>{msg.message}</div>
                  ) : (
                    <div style={{ ...s.bubble, ...(isMe ? s.bubbleMe : s.bubbleThem) }}>
                      <div style={s.sender}>{msg.senderName?.toUpperCase()}</div>
                      <div style={s.msgText}>{msg.message}</div>
                      <div style={s.msgTime}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  )}
                </div>
              );
            })}
            {typing && <div style={s.typing}>{typing} IS TYPING...</div>}
            <div ref={bottomRef} />
          </div>

          {sessionClosed && senderRole === "customer" && !rated && (
            <div style={s.ratingBox}>
              <div style={s.ratingTitle}>HOW WAS YOUR EXPERIENCE?</div>
              <div style={s.stars}>{[1,2,3,4,5].map(star => (
                <button key={star} style={{ ...s.star, color: star <= rating ? "#f59e0b" : "#1e2533" }} onClick={() => { setRating(star); setRated(true); }}>★</button>
              ))}</div>
            </div>
          )}
          {rated && <div style={s.ratedMsg}>✓ THANK YOU FOR YOUR FEEDBACK</div>}

          {!sessionClosed && (
            <div style={s.inputRow}>
              <input style={s.input} placeholder="TYPE YOUR MESSAGE..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} />
              <button style={s.sendBtn} onClick={sendMessage}>SEND ▶</button>
            </div>
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
  logoMark: { position: "relative", width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center" },
  logoText: { position: "relative", zIndex: 1, color: "#00d4ff", fontWeight: "900", fontSize: "12px", letterSpacing: "1px" },
  logoRing: { position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid #00d4ff50", boxShadow: "0 0 10px #00d4ff30" },
  headerTitle: { color: "#e2e8f0", fontWeight: "700", fontSize: "12px", letterSpacing: "3px" },
  headerSub: { display: "flex", alignItems: "center", gap: "6px", color: "#475569", fontSize: "9px", letterSpacing: "2px", marginTop: "3px" },
  onlineDot: { width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 5px #22c55e" },
  closeBtn: { background: "transparent", border: "1px solid #ef444430", color: "#ef4444", borderRadius: "3px", padding: "7px 16px", fontSize: "9px", fontWeight: "700", letterSpacing: "1.5px", cursor: "pointer" },
  body: { position: "relative", zIndex: 1, display: "flex", flex: 1, overflow: "hidden" },
  sidebar: { width: "280px", minWidth: "280px", background: "rgba(2,5,9,0.95)", borderRight: "1px solid #00d4ff15", overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: "14px" },
  sidebarHeader: { display: "flex", alignItems: "center", gap: "8px", paddingBottom: "12px", borderBottom: "1px solid #00d4ff15" },
  edithBadge: { background: "linear-gradient(135deg, #00d4ff, #0369a1)", color: "#000", fontSize: "8px", fontWeight: "900", padding: "2px 7px", borderRadius: "2px", letterSpacing: "1px" },
  edithLabel: { color: "#334155", fontSize: "9px", fontWeight: "700", letterSpacing: "2px" },
  block: { display: "flex", flexDirection: "column", gap: "5px" },
  blockLabel: { color: "#334155", fontSize: "9px", fontWeight: "700", letterSpacing: "2px" },
  blockValue: { fontSize: "13px", fontWeight: "700" },
  blockValueSm: { color: "#64748b", fontSize: "11px", lineHeight: "1.5" },
  confBar: { height: "4px", background: "#1e2533", borderRadius: "2px", overflow: "hidden" },
  confFill: { height: "100%", borderRadius: "2px" },
  threatPill: { display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "9px", fontWeight: "700", padding: "3px 8px", borderRadius: "2px", border: "1px solid", letterSpacing: "1.5px", alignSelf: "flex-start" },
  threatDot: { width: "5px", height: "5px", borderRadius: "50%" },
  step: { display: "flex", gap: "8px", alignItems: "flex-start" },
  stepNum: { width: "14px", height: "14px", borderRadius: "2px", background: "#00d4ff10", border: "1px solid #00d4ff30", color: "#00d4ff", fontSize: "8px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" },
  stepText: { color: "#475569", fontSize: "11px", lineHeight: "1.5" },
  kbLink: { color: "#0ea5e9", fontSize: "11px", padding: "5px 8px", background: "#0a0f1a", border: "1px solid #0ea5e920", borderRadius: "3px", textDecoration: "none", lineHeight: "1.4", display: "block" },
  escalation: { padding: "10px 12px", background: "#ef444410", border: "1px solid #ef444430", borderRadius: "4px" },
  escalationTitle: { color: "#ef4444", fontSize: "9px", fontWeight: "700", letterSpacing: "1px", marginBottom: "4px" },
  escalationReason: { color: "#64748b", fontSize: "11px", lineHeight: "1.4" },
  chatArea: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  messages: { flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "10px" },
  row: { display: "flex" },
  bubble: { maxWidth: "65%", padding: "10px 14px", borderRadius: "6px", display: "flex", flexDirection: "column", gap: "4px" },
  bubbleMe: { background: "linear-gradient(135deg, #0369a1, #0284c7)", border: "1px solid #0ea5e940" },
  bubbleThem: { background: "#0a0f1a", border: "1px solid #1e2533" },
  sender: { fontSize: "8px", fontWeight: "700", letterSpacing: "1.5px", color: "#94a3b880" },
  msgText: { color: "#e2e8f0", fontSize: "13px", lineHeight: "1.5", wordBreak: "break-word" },
  msgTime: { fontSize: "8px", color: "#94a3b840", alignSelf: "flex-end", letterSpacing: "0.5px" },
  systemMsg: { background: "#00d4ff08", border: "1px solid #00d4ff15", borderRadius: "3px", padding: "5px 14px", fontSize: "9px", color: "#334155", letterSpacing: "1.5px" },
  typing: { color: "#334155", fontSize: "9px", letterSpacing: "2px", padding: "4px 8px" },
  ratingBox: { padding: "16px 24px", borderTop: "1px solid #00d4ff15", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" },
  ratingTitle: { color: "#475569", fontSize: "9px", fontWeight: "700", letterSpacing: "2px" },
  stars: { display: "flex", gap: "6px" },
  star: { background: "none", border: "none", fontSize: "28px", cursor: "pointer", transition: "color 0.15s" },
  ratedMsg: { padding: "12px 24px", borderTop: "1px solid #00d4ff15", textAlign: "center", color: "#22c55e", fontSize: "9px", letterSpacing: "2px" },
  inputRow: { display: "flex", gap: "10px", padding: "16px 24px", borderTop: "1px solid #00d4ff15", background: "rgba(2,5,9,0.98)" },
  input: { flex: 1, background: "#020509", border: "1px solid #1e2533", borderRadius: "4px", padding: "11px 14px", color: "#e2e8f0", fontSize: "13px", outline: "none", fontFamily: "'Courier New', Consolas, monospace" },
  sendBtn: { background: "linear-gradient(135deg, #0ea5e9, #0369a1)", border: "none", color: "#fff", padding: "11px 22px", borderRadius: "4px", fontSize: "10px", fontWeight: "700", letterSpacing: "2px", cursor: "pointer" },
};
