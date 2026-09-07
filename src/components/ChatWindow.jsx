// ChatWindow.jsx — ThreatLocker Support Console
import { useState, useEffect, useRef } from "react";
import { BACKEND } from "../lib/config";
import { moduleColor, threatColor } from "../lib/classification";

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
  }, [connection, sessionId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  const [sendFailed, setSendFailed] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || sessionClosed || !connection) return;
    const text = input.trim();
    try {
      await connection.invoke("SendMessage", sessionId, senderName, text, senderRole);
      setInput("");
      setSendFailed(false);
      connection.invoke("TypingIndicator", sessionId, senderName, false).catch(() => {});
    } catch {
      // Keep the text so the user can retry; surface the failure.
      setSendFailed(true);
    }
  };

  const handleKeyDown = async (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); await sendMessage(); return; }
    if (!connection) return;
    connection.invoke("TypingIndicator", sessionId, senderName, true).catch(() => {});
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(
      () => connection?.invoke("TypingIndicator", sessionId, senderName, false).catch(() => {}),
      2000
    );
  };

  const handleClose = async () => {
    try {
      if (senderRole === "agent" && connection) await connection.invoke("CloseSession", sessionId);
    } catch {
      // ignore — we are leaving regardless
    } finally {
      // Stop the socket we were handed so it is not orphaned after we unmount.
      try { await connection?.stop(); } catch { /* already stopped */ }
      onClose();
    }
  };

  const submitRating = async (star) => {
    setRating(star);
    try {
      const res = await fetch(`${BACKEND}/api/chat/session/${sessionId}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: star }),
      });
      if (res.ok) setRated(true);
    } catch {
      // leave un-rated so the customer can retry
    }
  };

  const tc = threatColor(summary?.threatLevel);

  return (
    <div className="tl-app">
      <div className="tl-topbar">
        <div className="tl-row">
          <span className="tl-brand-mark">TL</span>
          <div>
            <div className="tl-topbar__title">Support session</div>
            <div className="tl-topbar__meta">
              <span className="tl-dot tl-dot--online" />
              {senderRole === "agent"
                ? `Agent · ${senderName?.toUpperCase()}`
                : `Session ${sessionId?.slice(0, 8).toUpperCase()}`}
            </div>
          </div>
        </div>
        <button type="button" className="tl-btn tl-btn--danger tl-btn--sm" onClick={handleClose}>
          {senderRole === "agent" ? "CLOSE SESSION" : "LEAVE"}
        </button>
      </div>

      <div className="tl-body">
        {senderRole === "agent" && summary && (
          <aside className="tl-chat-aside">
            <div className="tl-chat-aside__head">
              <span className="tl-badge">E.D.I.T.H</span>
              <span className="tl-eyebrow">Analysis</span>
            </div>

            <div>
              <div className="tl-eyebrow">Module</div>
              <div style={{ color: moduleColor(summary.moduleClassification), fontWeight: 700, marginTop: 4 }}>
                {summary.moduleClassification || "—"}
              </div>
            </div>

            <div>
              <div className="tl-eyebrow">Issue type</div>
              <div className="tl-kv" style={{ marginTop: 4 }}>{summary.issueTypeClassification || "—"}</div>
            </div>

            {summary.confidenceScore !== undefined && (
              <div>
                <div className="tl-eyebrow">Confidence — {summary.confidenceScore}%</div>
                <div className="tl-bar" style={{ marginTop: 6 }}>
                  <div
                    className="tl-bar__fill"
                    style={{
                      width: `${summary.confidenceScore}%`,
                      background: summary.confidenceScore >= 80 ? "var(--tl-success)" : summary.confidenceScore >= 60 ? "var(--tl-warn)" : "var(--tl-danger)",
                    }}
                  />
                </div>
              </div>
            )}

            {summary.threatLevel && (
              <div>
                <div className="tl-eyebrow">Threat level</div>
                <div className="tl-badge" style={{ marginTop: 6, background: tc.bg, color: tc.color, borderColor: tc.border }}>
                  <span className="tl-dot" style={{ background: tc.color }} />
                  {summary.threatLevel}
                </div>
              </div>
            )}

            {summary.recommendedSteps?.length > 0 && (
              <div>
                <div className="tl-eyebrow">Recommended steps</div>
                <div className="tl-steps">
                  {summary.recommendedSteps.map((step, i) => (
                    <div key={i} className="tl-step">
                      <span className="tl-step__num">{i + 1}</span>
                      <span className="tl-step__text">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {summary.suggestedKBArticles?.length > 0 && (
              <div>
                <div className="tl-eyebrow">KB articles</div>
                {summary.suggestedKBArticles.map((kb, i) => (
                  <a
                    key={i}
                    href={`https://www.google.com/search?q=ThreatLocker+${encodeURIComponent(kb)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tl-kb-link"
                  >
                    {kb}
                  </a>
                ))}
              </div>
            )}

            {summary.escalationRecommended && (
              <div className="tl-alert tl-alert--error" style={{ marginBottom: 0 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Escalate</div>
                <div>{summary.escalationReason}</div>
              </div>
            )}
          </aside>
        )}

        <div className="tl-chat">
          <div className="tl-messages">
            {messages.map((msg, i) => {
              const isMe = msg.senderName === senderName;
              const isSystem = msg.senderRole === "system";
              return (
                <div
                  key={msg.timestamp ? `${msg.timestamp}-${i}` : i}
                  className={`tl-msg-row ${isSystem ? "tl-msg-row--system" : isMe ? "tl-msg-row--me" : "tl-msg-row--them"}`}
                >
                  {isSystem ? (
                    <div className="tl-system-msg">{msg.message}</div>
                  ) : (
                    <div className={`tl-bubble ${isMe ? "tl-bubble--me" : "tl-bubble--them"}`}>
                      <div className="tl-bubble__sender">{msg.senderName?.toUpperCase()}</div>
                      <div className="tl-bubble__text">{msg.message}</div>
                      <div className="tl-bubble__time">{msg.timestamp && Number.isFinite(new Date(msg.timestamp).getTime()) ? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</div>
                    </div>
                  )}
                </div>
              );
            })}
            {typing && <div className="tl-typing">{typing} IS TYPING...</div>}
            <div ref={bottomRef} />
          </div>

          {sessionClosed && senderRole === "customer" && !rated && (
            <div className="tl-rating">
              <div className="tl-eyebrow">How was your experience?</div>
              <div className="tl-stars">{[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  type="button"
                  aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                  aria-pressed={star <= rating}
                  className={`tl-star${star <= rating ? " tl-star--on" : ""}`}
                  onClick={() => submitRating(star)}
                >★</button>
              ))}</div>
            </div>
          )}
          {rated && <div className="tl-rating" style={{ color: "var(--tl-success)", fontWeight: 600 }}>THANK YOU FOR YOUR FEEDBACK</div>}

          {sendFailed && <div className="tl-alert tl-alert--error" style={{ margin: "0 18px" }}>Message failed to send. Retry.</div>}
          {!sessionClosed && (
            <div className="tl-composer">
              <label htmlFor="chat-input" className="tl-sr-only">Message</label>
              <input id="chat-input" name="message" maxLength={2000} className="tl-input" style={{ flex: 1 }} placeholder="TYPE YOUR MESSAGE..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} />
              <button type="button" className="tl-btn tl-btn--primary" onClick={sendMessage}>SEND</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
