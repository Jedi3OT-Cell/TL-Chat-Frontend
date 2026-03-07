// ChatWindow.jsx — shared by both customer and agent after connecting
import { useState, useEffect, useRef } from "react";

export default function ChatWindow({ connection, sessionId, senderName, senderRole, agentName, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const [sessionClosed, setSessionClosed] = useState(false);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    if (!connection) return;

    connection.on("ReceiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    connection.on("UserTyping", (name, isTyping) => {
      setTypingUser(isTyping ? name : null);
    });

    connection.on("AgentJoined", (name) => {
      setMessages((prev) => [
        ...prev,
        {
          senderName: "System",
          senderRole: "system",
          message: `${name} has joined the chat.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    });

    connection.on("SessionClosed", () => {
      setSessionClosed(true);
      setMessages((prev) => [
        ...prev,
        {
          senderName: "System",
          senderRole: "system",
          message: "This chat session has been closed.",
          timestamp: new Date().toISOString(),
        },
      ]);
    });

    return () => {
      connection.off("ReceiveMessage");
      connection.off("UserTyping");
      connection.off("AgentJoined");
      connection.off("SessionClosed");
    };
  }, [connection]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed || sessionClosed) return;
    connection?.invoke("SendMessage", sessionId, senderName, trimmed, senderRole);
    setInput("");
    connection?.invoke("TypingIndicator", sessionId, senderName, false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    connection?.invoke("TypingIndicator", sessionId, senderName, true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      connection?.invoke("TypingIndicator", sessionId, senderName, false);
    }, 1500);
  };

  const handleClose = () => {
    connection?.invoke("CloseSession", sessionId);
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isOwn = (msg) => msg.senderName === senderName;

  return (
    <div style={styles.window}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.avatar}>
            {senderRole === "agent" ? "👤" : "🛡"}
          </div>
          <div>
            <div style={styles.headerName}>
              {senderRole === "agent" ? `Chatting with ${messages.find(m => m.senderRole === "customer")?.senderName || "Customer"}` : `Connected to ${agentName || "Support Agent"}`}
            </div>
            <div style={styles.headerSub}>
              ThreatLocker Support · {sessionClosed ? "Session Closed" : "Active"}
            </div>
          </div>
        </div>
        {senderRole === "agent" && !sessionClosed && (
          <button style={styles.closeBtn} onClick={handleClose}>
            End Chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={styles.messages}>
        {messages.length === 0 && (
          <div style={styles.startHint}>
            Session started. Say hello!
          </div>
        )}

        {messages.map((msg, i) => {
          if (msg.senderRole === "system") {
            return (
              <div key={i} style={styles.systemMsg}>
                <span style={styles.systemText}>{msg.message}</span>
              </div>
            );
          }

          const own = isOwn(msg);
          return (
            <div key={i} style={{ ...styles.msgRow, justifyContent: own ? "flex-end" : "flex-start" }}>
              {!own && <div style={styles.bubbleAvatar}>{msg.senderName[0].toUpperCase()}</div>}
              <div style={{ maxWidth: "72%" }}>
                {!own && <div style={styles.bubbleName}>{msg.senderName}</div>}
                <div style={own ? styles.bubbleOwn : styles.bubbleOther}>
                  <span style={styles.bubbleText}>{msg.message}</span>
                </div>
                <div style={{ ...styles.bubbleTime, textAlign: own ? "right" : "left" }}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          );
        })}

        {typingUser && (
          <div style={{ ...styles.msgRow, justifyContent: "flex-start" }}>
            <div style={styles.bubbleAvatar}>{typingUser[0].toUpperCase()}</div>
            <div style={styles.typingBubble}>
              <span style={styles.typingDot} />
              <span style={styles.typingDot} />
              <span style={styles.typingDot} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={styles.inputRow}>
        {sessionClosed ? (
          <div style={styles.closedBanner}>This session has ended. Thank you for contacting ThreatLocker Support.</div>
        ) : (
          <>
            <textarea
              style={styles.input}
              value={input}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (Enter to send)"
              rows={2}
            />
            <button style={styles.sendBtn} onClick={sendMessage} disabled={!input.trim()}>
              ↑
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  window: {
    display: "flex", flexDirection: "column",
    height: "100vh", background: "#0b0e14",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    maxWidth: "720px", margin: "0 auto",
  },
  header: {
    background: "#0d1117", borderBottom: "1px solid #1e2533",
    padding: "14px 20px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "12px" },
  avatar: {
    width: "38px", height: "38px", borderRadius: "10px",
    background: "#12151e", border: "1px solid #1e2533",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "18px",
  },
  headerName: { color: "#f1f5f9", fontWeight: "600", fontSize: "14px" },
  headerSub: { color: "#6b7280", fontSize: "12px", marginTop: "1px" },
  closeBtn: {
    background: "transparent", border: "1px solid #dc2626",
    color: "#f87171", borderRadius: "6px",
    padding: "6px 14px", fontSize: "12px", cursor: "pointer",
  },
  messages: {
    flex: 1, overflowY: "auto", padding: "20px",
    display: "flex", flexDirection: "column", gap: "4px",
  },
  startHint: { color: "#475569", fontSize: "13px", textAlign: "center", margin: "auto" },
  systemMsg: { textAlign: "center", margin: "12px 0" },
  systemText: {
    color: "#475569", fontSize: "12px",
    background: "#12151e", border: "1px solid #1e2533",
    borderRadius: "20px", padding: "4px 14px", display: "inline-block",
  },
  msgRow: { display: "flex", alignItems: "flex-end", gap: "8px", marginBottom: "6px" },
  bubbleAvatar: {
    width: "28px", height: "28px", borderRadius: "8px",
    background: "#1e2533", color: "#94a3b8",
    fontSize: "12px", fontWeight: "700",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  bubbleName: { color: "#6b7280", fontSize: "11px", marginBottom: "3px", paddingLeft: "2px" },
  bubbleOwn: {
    background: "linear-gradient(135deg, #0ea5e9, #0369a1)",
    borderRadius: "14px 14px 2px 14px",
    padding: "10px 14px",
  },
  bubbleOther: {
    background: "#12151e", border: "1px solid #1e2533",
    borderRadius: "14px 14px 14px 2px",
    padding: "10px 14px",
  },
  bubbleText: { color: "#f1f5f9", fontSize: "14px", lineHeight: "1.5", whiteSpace: "pre-wrap" },
  bubbleTime: { color: "#475569", fontSize: "11px", marginTop: "3px", paddingLeft: "2px", paddingRight: "2px" },
  typingBubble: {
    background: "#12151e", border: "1px solid #1e2533",
    borderRadius: "14px", padding: "12px 16px",
    display: "flex", gap: "4px", alignItems: "center",
  },
  typingDot: {
    display: "inline-block",
    width: "6px", height: "6px", borderRadius: "50%",
    background: "#475569",
    animation: "bounce 1.2s infinite",
  },
  inputRow: {
    borderTop: "1px solid #1e2533", padding: "14px 16px",
    display: "flex", gap: "10px", alignItems: "flex-end",
    background: "#0d1117",
  },
  input: {
    flex: 1, background: "#12151e", border: "1px solid #1e2533",
    borderRadius: "8px", color: "#e2e8f0", fontSize: "14px",
    padding: "10px 14px", outline: "none", resize: "none",
    fontFamily: "inherit", lineHeight: "1.5",
  },
  sendBtn: {
    width: "40px", height: "40px", borderRadius: "8px",
    background: "linear-gradient(135deg, #0ea5e9, #0369a1)",
    color: "#fff", border: "none", fontSize: "18px",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  closedBanner: {
    flex: 1, color: "#6b7280", fontSize: "13px",
    textAlign: "center", padding: "8px",
  },
};
