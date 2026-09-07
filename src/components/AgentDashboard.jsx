// AgentDashboard.jsx — ThreatLocker Support Console
import { useState, useEffect, useRef } from "react";
import Analytics from "./Analytics";

import { BACKEND, authHeaders } from "../lib/config";
import { createHubConnection } from "../lib/hub";
import { moduleColor, normalizeSession, waitLabel } from "../lib/classification";

export default function AgentDashboard({ agentName, token, onJoinSession, onLogout }) {
  const [queue, setQueue] = useState([]);
  const [selected, setSelected] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connError, setConnError] = useState(false);
  const [pickingUp, setPickingUp] = useState(false);
  const [time, setTime] = useState(new Date());
  const [showAnalytics, setShowAnalytics] = useState(false);
  const connRef = useRef(null);
  const handedOff = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!showAnalytics) return;
    const onKey = (e) => { if (e.key === "Escape") setShowAnalytics(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showAnalytics]);

  useEffect(() => {
    const fetchQueue = () =>
      fetch(`${BACKEND}/api/chat/queue`, { headers: authHeaders(token) })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`queue ${r.status}`))))
        .then((data) => { if (Array.isArray(data)) { setQueue(data); setConnError(false); } })
        .catch(() => setConnError(true));
    const conn = createHubConnection({ token });
    conn.on("AgentRegistered", () => { setConnected(true); setConnError(false); });
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
      setConnected(true);
      conn.invoke("RegisterAsAgent", agentName).catch(() => {});
      fetchQueue();
    });
    conn.start()
      .then(() => {
        conn.invoke("RegisterAsAgent", agentName).catch(() => {});
        fetchQueue();
      })
      .catch(() => setConnected(false));
    connRef.current = conn;
    // Load the queue immediately over REST — do NOT gate it on the SignalR handshake.
    // If the hub is slow or degraded, the agent still sees the queue right away.
    fetchQueue();
    const poll = setInterval(fetchQueue, 5000);
    return () => {
      clearInterval(poll);
      // Always detach THIS component's handlers so events never fire on an unmounted
      // component; only stop the socket if it was not handed off to the chat window.
      conn.off("AgentRegistered");
      conn.off("QueueUpdated");
      if (!handedOff.current) conn.stop();
    };
  }, [agentName, token]);

  const handlePickUp = async (session) => {
    const conn = connRef.current;
    if (!conn || pickingUp) return;
    setPickingUp(true);
    try {
      await conn.invoke("JoinSession", session.sessionId, agentName);
      handedOff.current = true; // only skip stop() once the hand-off actually succeeded
      onJoinSession({ connection: conn, session, agentName, summary: selected?.summary });
    } catch {
      setPickingUp(false);
      setConnError(true);
    }
  };

  const statusLabel = connError ? "Offline" : connected ? "Online" : "Connecting…";
  const statusDot = connError ? "tl-dot--error" : connected ? "tl-dot--online" : "tl-dot--offline";

  return (
    <div className="tl-app" style={{ height: "100vh", overflow: "hidden" }}>
      {/* Header */}
      <div className="tl-topbar">
        <div className="tl-brand">
          <span className="tl-brand-mark">TL</span>
          <div>
            <div className="tl-topbar__title">SUPPORT CONSOLE</div>
            <div className="tl-topbar__meta">
              <span className={`tl-dot ${statusDot}`} />
              Agent {agentName} · {statusLabel}
            </div>
          </div>
        </div>
        <div className="tl-topbar__right">
          <span className="tl-clock">
            {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
          <button type="button" className="tl-btn tl-btn--ghost tl-btn--sm" onClick={() => setShowAnalytics(true)}>
            ANALYTICS
          </button>
          {onLogout && (
            <button type="button" className="tl-btn tl-btn--subtle tl-btn--sm" onClick={onLogout}>
              LOGOUT
            </button>
          )}
        </div>
      </div>

      <div className="tl-body">
        {/* Queue Panel */}
        <section className="tl-panel tl-panel--queue">
          <div className="tl-panel__head">
            <span className="tl-panel__title">LIVE QUEUE</span>
            <span className="tl-count">{queue.length}</span>
          </div>

          {queue.length === 0 ? (
            connError ? (
              <div className="tl-empty">
                <div className="tl-h2">CONNECTION LOST</div>
                <button type="button" className="tl-btn tl-btn--danger tl-btn--sm" onClick={() => window.location.reload()}>
                  Retry
                </button>
              </div>
            ) : (
              <div className="tl-empty">
                <div className="tl-h2">QUEUE CLEAR</div>
                <div className="tl-faint">No customers waiting</div>
              </div>
            )
          ) : (
            <div className="tl-queue">
              {queue.map((raw, i) => {
                const session = normalizeSession(raw);
                const modColor = moduleColor(session.summary?.moduleClassification);
                return (
                  <button
                    type="button"
                    key={session.sessionId}
                    aria-pressed={selected?.sessionId === session.sessionId}
                    className="tl-queue-card"
                    onClick={() => setSelected(session)}
                  >
                    <div className="tl-spread" style={{ marginBottom: 8 }}>
                      <span className="tl-faint" style={{ fontSize: 12, fontWeight: 700 }}>#{i + 1}</span>
                      <span className="tl-badge" style={{ color: modColor, borderColor: modColor, background: modColor + "1f" }}>
                        {session.summary?.moduleClassification?.toUpperCase() || "UNCLASSIFIED"}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tl-text)" }}>
                      {session.customerName?.toUpperCase()}
                    </div>
                    <div className="tl-faint" style={{ fontSize: 12 }}>{session.organizationName}</div>
                    <div className="tl-spread" style={{ marginTop: 8, fontSize: 12 }}>
                      <span className="tl-muted">{waitLabel(session.createdAt, time.getTime())}</span>
                      <span className="tl-faint">{session.osPlatform}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Detail Panel */}
        <section className="tl-detail">
          {!selected ? (
            <div className="tl-empty">
              <div className="tl-h2">Select a session</div>
              <div className="tl-faint" style={{ maxWidth: 280 }}>
                Review intake details and E.D.I.T.H analysis before accepting.
              </div>
            </div>
          ) : (
            <>
              <div className="tl-spread" style={{ alignItems: "flex-start", gap: 12 }}>
                <div>
                  <div className="tl-h1">{selected.customerName?.toUpperCase()}</div>
                  <div className="tl-muted" style={{ marginTop: 4 }}>
                    {selected.organizationName} · {selected.osPlatform}
                  </div>
                </div>
                <button
                  type="button"
                  className="tl-btn tl-btn--primary"
                  onClick={() => handlePickUp(selected)}
                  disabled={pickingUp}
                >
                  {pickingUp ? "ACCEPTING…" : "ACCEPT SESSION"}
                </button>
              </div>

              <div className="tl-box">
                <div className="tl-box__label">CUSTOMER ISSUE</div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--tl-text)" }}>
                  {selected.issueDescription}
                </div>
              </div>

              {selected.summary ? (
                <div className="tl-col" style={{ gap: 14 }}>
                  <div className="tl-row">
                    <span
                      className="tl-badge"
                      style={{ color: "var(--tl-brand)", borderColor: "var(--tl-brand-border)", background: "var(--tl-brand-weak)" }}
                    >
                      E.D.I.T.H
                    </span>
                    <span className="tl-eyebrow">Classification</span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div className="tl-box">
                      <div className="tl-box__label">Module</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: moduleColor(selected.summary.moduleClassification) }}>
                        {selected.summary.moduleClassification}
                      </div>
                    </div>
                    <div className="tl-box">
                      <div className="tl-box__label">Issue type</div>
                      <div className="tl-muted" style={{ fontSize: 14, fontWeight: 600 }}>
                        {selected.summary.issueTypeClassification}
                      </div>
                    </div>
                  </div>

                  {selected.summary.recommendedSteps?.length > 0 && (
                    <div className="tl-col" style={{ gap: 8 }}>
                      <div className="tl-eyebrow">Recommended steps</div>
                      {selected.summary.recommendedSteps.map((step, i) => (
                        <div key={i} className="tl-row" style={{ alignItems: "flex-start" }}>
                          <span className="tl-step-num">{i + 1}</span>
                          <span className="tl-muted" style={{ fontSize: 13, lineHeight: 1.5 }}>{step}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {selected.summary.suggestedKBArticles?.length > 0 && (
                    <div className="tl-col" style={{ gap: 8 }}>
                      <div className="tl-eyebrow">KB articles</div>
                      {selected.summary.suggestedKBArticles.map((kb, i) => (
                        <a
                          key={i}
                          href={`https://threatlocker.kb.help/?s=${encodeURIComponent(kb)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tl-kb-link"
                        >
                          {kb}
                        </a>
                      ))}
                    </div>
                  )}

                  {selected.summary.escalationRecommended && (
                    <div className="tl-alert tl-alert--error" style={{ margin: 0 }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>Escalation required</div>
                      <div>{selected.summary.escalationReason}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="tl-box" style={{ textAlign: "center" }}>
                  <span className="tl-faint">E.D.I.T.H analysis pending</span>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {showAnalytics && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", justifyContent: "flex-end" }}
          role="dialog"
          aria-modal="true"
          aria-label="Analytics"
        >
          <button
            type="button"
            aria-label="Close analytics"
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", border: "none", cursor: "pointer" }}
            onClick={() => setShowAnalytics(false)}
          />
          <div
            style={{
              position: "relative",
              width: "80vw",
              maxWidth: 1100,
              height: "100vh",
              overflowY: "auto",
              background: "var(--tl-bg)",
              borderLeft: "1px solid var(--tl-border)",
              boxShadow: "var(--tl-shadow-lg)",
            }}
          >
            <Analytics onBack={() => setShowAnalytics(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
