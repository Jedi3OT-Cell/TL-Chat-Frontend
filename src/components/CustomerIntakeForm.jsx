// CustomerIntakeForm.jsx — ThreatLocker Support Console
import { useState } from "react";
import { BACKEND } from "../lib/config";
import { createHubConnection } from "../lib/hub";

const OS_LIST = ["Windows 11", "Windows 10", "Windows Server 2022", "Windows Server 2019", "macOS", "Linux"];

/**
 * Customer intake form. Collects name, organization, OS, and issue description, opens a
 * support session over REST, then joins the chat hub as the customer and hands the live
 * connection up via `onSessionStart`.
 * @param {{ onSessionStart: (state: { connection: object, sessionId: string, customerName: string }) => void }} props
 * @returns {JSX.Element}
 */
export default function CustomerIntakeForm({ onSessionStart }) {
  const [form, setForm] = useState({ customerName: "", organizationName: "", osPlatform: "", issueDescription: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Validate all fields, create the session (checking `res.ok` and a returned `sessionId`),
   * then start the hub and join as the customer. Any failure stops the socket and surfaces
   * a retryable error rather than leaving a half-open connection.
   */
  const handleSubmit = async () => {
    if (!form.customerName || !form.organizationName || !form.osPlatform || !form.issueDescription) {
      setError("ALL FIELDS REQUIRED");
      return;
    }
    setLoading(true);
    setError("");
    let conn;
    try {
      const res = await fetch(`${BACKEND}/api/chat/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        setError("SESSION REJECTED — RETRY");
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (!data?.sessionId) throw new Error("missing sessionId");
      conn = createHubConnection();
      await conn.start();
      await conn.invoke("JoinSessionAsCustomer", data.sessionId, form.customerName);
      onSessionStart({ connection: conn, sessionId: data.sessionId, customerName: form.customerName });
    } catch {
      if (conn) await conn.stop().catch(() => {});
      setError("CONNECTION FAILED — RETRY");
      setLoading(false);
    }
  };

  return (
    <div className="tl-screen">
      <div className="tl-center">
        <div className="tl-card tl-card--wide">
          <div className="tl-brand" style={{ marginBottom: 20 }}>
            <span className="tl-brand-mark">TL</span>
            <div>
              <div className="tl-brand-name">THREATLOCKER</div>
              <div className="tl-brand-sub">Support · Secure Channel</div>
            </div>
          </div>

          <hr className="tl-divider" />

          <h1 className="tl-h2">Start a support session</h1>
          <p className="tl-help" style={{ marginTop: 6, marginBottom: 20 }}>
            Tell us about the issue. E.D.I.T.H pre-analyzes your case so the agent is
            ready when they join.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <div className="tl-field">
              <label className="tl-label" htmlFor="intake-name">Full name</label>
              <input
                id="intake-name" name="customerName" maxLength={120} className="tl-input"
                placeholder="Enter your name"
                value={form.customerName}
                onChange={e => setForm({ ...form, customerName: e.target.value })}
              />
            </div>

            <div className="tl-field">
              <label className="tl-label" htmlFor="intake-org">Organization</label>
              <input
                id="intake-org" name="organizationName" maxLength={160} className="tl-input"
                placeholder="Company or organization name"
                value={form.organizationName}
                onChange={e => setForm({ ...form, organizationName: e.target.value })}
              />
            </div>

            <div className="tl-field">
              <span className="tl-label" id="intake-os-label">Operating system</span>
              <div className="tl-chip-grid" role="group" aria-labelledby="intake-os-label">
                {OS_LIST.map(os => (
                  <button
                    key={os}
                    type="button"
                    className="tl-chip"
                    aria-pressed={form.osPlatform === os}
                    onClick={() => setForm({ ...form, osPlatform: os })}
                  >
                    {os}
                  </button>
                ))}
              </div>
            </div>

            <div className="tl-field">
              <label className="tl-label" htmlFor="intake-issue">Describe your issue</label>
              <textarea
                id="intake-issue" name="issueDescription" maxLength={4000} className="tl-textarea"
                placeholder="Provide as much detail as possible — this helps our AI pre-analyze your case before an agent joins"
                value={form.issueDescription}
                rows={4}
                onChange={e => setForm({ ...form, issueDescription: e.target.value })}
              />
            </div>

            {error && <div className="tl-alert tl-alert--error">{error}</div>}

            <button type="submit" className="tl-btn tl-btn--primary tl-btn--block" disabled={loading}>
              {loading ? "Establishing secure connection…" : "Connect to Support"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
