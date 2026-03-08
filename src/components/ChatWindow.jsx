// ChatWindow.jsx — shared by customer and agent after connecting
import { useState, useEffect, useRef } from "react";

export default function ChatWindow({ connection, sessionId, senderName, senderRole, agentName, onClose, summary: initialSummary }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const [sessionClosed, setSessionClosed] = useState(false);
  const [summary, setSummary] = useState(initialSummary ?? null);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  const isAgent = senderRole === "agent";

  useEffect(() => {
    if (!connection) return;

    connection.on("ReceiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    connection.on("UserTyping", (name, isTyping) => {
      setTypingUser(isTyping ? name : null);
    });

    connection.on("AgentJoined", (name) => {
      setMessages((prev) => [...prev, { senderName: "System", senderRole: "system", message: `${name} has joined the chat.`, timestamp: new Date().toISOString() }]);
    });

    connection.on("ReceiveSummary", (s) => {
      setSummary(s);
    });

    connection.on("SessionClosed", () => {
      setSessionClosed(true);
      setMessages((prev) => [...prev, { senderName: "System", senderRole: "system", message: "This chat session has been closed.", timestamp: new Date().toISOString() }]);
    });

    return () => {
      connection.off("ReceiveMessage");
      connection.off("UserTyping");
      connection.off("AgentJoined");
      connection.off("ReceiveSummary");
      connection.off("SessionClosed");
    };
  }, [connection]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  const sendMessage = async () => {
    if (!input.trim() || sessionClosed) return;
    try {
      await connection.invoke("SendMessage", sessionId, senderName, input.trim(), senderRole);
      setInput("");
    } catch {}
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTyping = async () => {
    try {
      await connection.invoke("TypingIndicator", sessionId, senderName, true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(async () => {
        try { await connection.invoke("TypingIndicator", sessionId, senderName, false); } catch {}
      }, 2000);
    } catch {}
  };

  const closeSession = async () => {
    try { await connection.invoke("CloseSession", sessionId); } catch {}
    onClose?.();
  };

  const fmt = (ts) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.logoMark}>TL</div>
          <div>
            <div style={s.headerTitle}>
              {isAgent ? `Chat with ${agentName || "Customer"}` : `Support Chat`}
            </div>
            <div style={s.headerSub}>
              <span style={s.encDot} />
              AES-256-GCM Encrypted · Session ID: {sessionId?.slice(0, 8)}...
            </div>
          </div>
        </div>
        <div style={s.headerRight}>
          {isAgent && summary && (
            <button style={s.summaryToggle} onClick={() => setSummaryOpen(o => !o)}>
              {summaryOpen ? "Hide E.D.I.T.H Summary" : "Show E.D.I.T.H Summary"}
            </button>
          )}
          {isAgent && !sessionClosed && (
            <button style={s.closeBtn} onClick={closeSession}>End Session</button>
          )}
          {!isAgent && (
            <div style={s.statusChip}>
              <span style={s.statusDot} />
              {sessionClosed ? "Session Ended" : "Connected"}
            </div>
          )}
        </div>
      </div>

      <div style={s.body}>
        {/* E.D.I.T.H Summary Panel — Agent only */}
        {isAgent && summary && summaryOpen && (
          <div style={s.summaryPanel}>
            <div style={s.summaryTitle}>
              <span style={s.edithBadge}>E.D.I.T.H</span>
              Pre-Chat Analysis
            </div>
            <div style={s.summaryGrid}>
              <SummaryBox label="Module" value={summary.moduleClassification} color="#0ea5e9" />
              <SummaryBox label="Issue Type" value={summary.issueTypeClassification} color="#a855f7" />
            </div>
            {summary.recommendedSteps?.length > 0 && (
              <div style={s.summarySection}>
                <div style={s.summarySectionTitle}>Recommended Steps</div>
                {summary.recommendedSteps.map((step, i) => (
                  <div key={i} style={s.summaryStep}>
                    <span style={s.stepNum}>{i + 1}</span>
                    <span style={s.stepText}>{step}</span>
                  </div>
                ))}
              </div>
            )}
            {summary.suggestedKBArticles?.length > 0 && (
              <div style={s.summarySection}>
                <div style={s.summarySectionTitle}>KB Articles</div>
                {summary.suggestedKBArticles.map((kb, i) => (
                  <div key={i} style={s.kbItem}>📄 {kb}</div>
                ))}
              </div>
            )}
            {summary.escalationRecommended && (
              <div style={s.escalation}>
                <span>⚠</span>
                <div>
                  <div style={s.escalationTitle}>Escalation Recommended</div>
                  <div style={s.escalationReason}>{summary.escalationReason}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chat Area */}
        <div style={s.chatArea}>
          <div style={s.messages}>
            {messages.length === 0 && (
              <div style={s.emptyState}>
                <div style={s.emptyIcon}>💬</div>
                <p style={s.emptyText}>
                  {isAgent ? "The customer will send the first message." : "An agent will join shortly. You can start typing."}
                </p>
              </div>
            )}
            {messages.map((msg, i) => {
              const isOwn = msg.senderName === senderName;
              const isSystem = msg.senderRole === "system";
              return (
                <div key={i} style={{ ...s.msgRow, ...(isSystem ? s.msgRowCenter : isOwn ? s.msgRowRight : s.msgRowLeft) }}>
                  {isSystem ? (
                    <div style={s.systemMsg}>{msg.message}</div>
                  ) : (
                    <div style={{ maxWidth: "65%" }}>
                      {!isOwn && <div style={s.senderName}>{msg.senderName}</div>}
                      <div style={{ ...s.bubble, ...(isOwn ? s.bubbleOwn : s.bubbleOther) }}>
                        {msg.message}
                      </div>
                      <div style={{ ...s.timestamp, textAlign: isOwn ? "right" : "left" }}>
                        {fmt(msg.timestamp)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {typingUser && (
              <div style={{ ...s.msgRow, ...s.msgRowLeft }}>
                <div style={{ ...s.bubble, ...s.bubbleOther, ...s.typingBubble }}>
                  <span style={s.typingDot} /><span style={s.typingDot} /><span style={s.typingDot} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={s.inputArea}>
            <textarea
              style={s.inputBox}
              placeholder={sessionClosed ? "This session has ended." : `Message as ${senderName}...`}
              value={input}
              disabled={sessionClosed}
              onChange={e => { setInput(e.target.value); handleTyping(); }}
              onKeyDown={handleKeyDown}
              rows={2}
            />
            <button style={{ ...s.sendBtn, ...((!input.trim() || sessionClosed) ? s.sendBtnDisabled : {}) }} onClick={sendMessage} disabled={!input.trim() || sessionClosed}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryBox({ label, value, color }) {
  return (
    <div style={{ background: "#0a0f1a", border: "1px solid #1e2533", borderRadius: "8px", padding: "12px 14px" }}>
      <div style={{ color: "#475569", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "4px" }}>{label}</div>
      <div style={{ color, fontSize: "13px", fontWeight: "600" }}>{value}</div>
    </div>
  );
}

const s = {
  page: { display: "flex", flexDirection: "column", height: "100vh", width: "100vw", background: "#080b12", overflow: "hidden" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", background: "#0d1117", borderBottom: "1px solid #1a2035", flexShrink: 0 },
  headerLeft: { display: "flex", alignItems: "center", gap: "12px" },
  logoMark: { width: "36px", height: "36px", borderRadius: "9px", background: "linear-gradient(135deg, #0ea5e9, #0369a1)", color: "#fff", fontWeight: "800", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  headerTitle: { color: "#f1f5f9", fontWeight: "700", fontSize: "14px" },
  headerSub: { display: "flex", alignItems: "center", gap: "6px", color: "#475569", fontSize: "11px", marginTop: "2px" },
  encDot: { width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 4px #22c55e", flexShrink: 0 },
  headerRight: { display: "flex", alignItems: "center", gap: "10px" },
  summaryToggle: { background: "#0ea5e915", border: "1px solid #0ea5e930", color: "#0ea5e9", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
  closeBtn: { background: "#dc262615", border: "1px solid #dc262630", color: "#fca5a5", borderRadius: "6px", padding: "6px 14px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
  statusChip: { display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "12px" },
  statusDot: { width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" },
  body: { display: "flex", flex: 1, overflow: "hidden" },
  summaryPanel: { width: "320px", minWidth: "320px", background: "#0a0f1a", borderRight: "1px solid #1a2035", overflowY: "auto", padding: "20px" },
  summaryTitle: { display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "16px" },
  edithBadge: { background: "linear-gradient(135deg, #0ea5e9, #0369a1)", color: "#fff", fontSize: "9px", fontWeight: "800", padding: "2px 7px", borderRadius: "4px", letterSpacing: "0.5px" },
  summaryGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" },
  summarySection: { marginBottom: "16px" },
  summarySectionTitle: { color: "#475569", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "10px" },
  summaryStep: { display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "8px" },
  stepNum: { width: "18px", height: "18px", borderRadius: "50%", background: "#22c55e15", border: "1px solid #22c55e40", color: "#22c55e", fontSize: "10px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  stepText: { color: "#94a3b8", fontSize: "12px", lineHeight: "1.5" },
  kbItem: { color: "#a78bfa", fontSize: "12px", padding: "8px 10px", background: "#0d1117", border: "1px solid #1e2533", borderRadius: "6px", marginBottom: "6px" },
  escalation: { display: "flex", gap: "10px", background: "#dc262610", border: "1px solid #dc262630", borderRadius: "8px", padding: "12px", fontSize: "18px", color: "#dc2626" },
  escalationTitle: { color: "#fca5a5", fontSize: "12px", fontWeight: "700" },
  escalationReason: { color: "#64748b", fontSize: "11px", marginTop: "2px" },
  chatArea: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  messages: { flex: 1, overflowY: "auto", padding: "24px" },
  emptyState: { height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", opacity: 0.5 },
  emptyIcon: { fontSize: "36px", marginBottom: "12px" },
  emptyText: { color: "#475569", fontSize: "14px", maxWidth: "260px", lineHeight: "1.6" },
  msgRow: { display: "flex", marginBottom: "16px" },
  msgRowLeft: { justifyContent: "flex-start" },
  msgRowRight: { justifyContent: "flex-end" },
  msgRowCenter: { justifyContent: "center" },
  systemMsg: { background: "#1a2035", color: "#475569", fontSize: "12px", padding: "6px 14px", borderRadius: "20px" },
  senderName: { color: "#64748b", fontSize: "11px", fontWeight: "600", marginBottom: "4px", paddingLeft: "2px" },
  bubble: { padding: "11px 15px", borderRadius: "12px", fontSize: "14px", lineHeight: "1.5", wordBreak: "break-word" },
  bubbleOwn: { background: "linear-gradient(135deg, #0ea5e9, #0369a1)", color: "#fff", borderBottomRightRadius: "4px" },
  bubbleOther: { background: "#12151e", border: "1px solid #1e2533", color: "#e2e8f0", borderBottomLeftRadius: "4px" },
  typingBubble: { display: "flex", gap: "4px", alignItems: "center", padding: "14px 18px" },
  typingDot: { width: "6px", height: "6px", borderRadius: "50%", background: "#475569", animation: "pulse 1.2s ease-in-out infinite" },
  timestamp: { color: "#334155", fontSize: "10px", marginTop: "4px", paddingLeft: "2px" },
  inputArea: { display: "flex", gap: "12px", padding: "16px 24px", background: "#0d1117", borderTop: "1px solid #1a2035", alignItems: "flex-end", flexShrink: 0 },
  inputBox: { flex: 1, background: "#080b12", border: "1px solid #1e2533", borderRadius: "10px", padding: "12px 14px", color: "#f1f5f9", fontSize: "14px", outline: "none", resize: "none", lineHeight: "1.5" },
  sendBtn: { background: "linear-gradient(135deg, #0ea5e9, #0369a1)", color: "#fff", border: "none", borderRadius: "10px", padding: "12px 24px", fontSize: "14px", fontWeight: "700", cursor: "pointer", flexShrink: 0 },
  sendBtnDisabled: { opacity: 0.4, cursor: "not-allowed" },
};