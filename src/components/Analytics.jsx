// Analytics.jsx — ThreatLocker Support Console
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const AGENTS = ["Tillman", "Agent 2", "Agent 3"];
const SURVEY_QUESTIONS = ["Issue resolved on first contact", "Agent was knowledgeable", "Response time was acceptable", "Would contact support again"];

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
    surveyScores: SURVEY_QUESTIONS.map(() => Math.floor(Math.random() * 25) + 70),
    reviews: [
      { rating: 5, comment: "Very helpful and fast resolution.", date: "2026-03-07" },
      { rating: 4, comment: "Knew exactly where to look in the registry.", date: "2026-03-06" },
      { rating: 5, comment: "Resolved my Ringfencing issue in under 5 minutes.", date: "2026-03-05" },
    ],
  }));
}

function StatCard({ label, value, sub }) {
  return (
    <div className="tl-stat">
      <div className="tl-stat__label">{label}</div>
      <div className="tl-stat__value">{value}</div>
      {sub && <div className="tl-stat__label" style={{ marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function StarRating({ rating }) {
  return (
    <div className="tl-stars">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          style={{ color: s <= Math.round(rating) ? "var(--tl-warn)" : "var(--tl-border-strong)", fontSize: 14 }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function RatingBar({ value, max = 100 }) {
  return (
    <div className="tl-bar">
      <div className="tl-bar__fill" style={{ width: `${(value / max) * 100}%`, background: "var(--tl-brand)" }} />
    </div>
  );
}

export default function Analytics({ onBack }) {
  const navigate = useNavigate();
  const back = onBack || (() => navigate("/"));
  const [data] = useState(generateMockData);
  const [selected, setSelected] = useState(data[0]);
  const [tab, setTab] = useState("overview");

  const totals = {
    totalChats: data.reduce((a, b) => a + b.totalChats, 0),
    missedChats: data.reduce((a, b) => a + b.missedChats, 0),
    avgSatisfaction: (data.reduce((a, b) => a + parseFloat(b.satisfaction), 0) / data.length).toFixed(1),
    avgAvailability: Math.round(data.reduce((a, b) => a + b.availability, 0) / data.length),
  };

  return (
    <div className="tl-app">
      {/* Header */}
      <header className="tl-topbar">
        <div className="tl-brand">
          <span className="tl-brand-mark">TL</span>
          <div>
            <div className="tl-brand-name">THREATLOCKER</div>
            <div className="tl-brand-sub">Support Analytics</div>
          </div>
        </div>
        <div className="tl-topbar__right">
          <span className="tl-clock">
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          </span>
          <button type="button" className="tl-btn tl-btn--ghost tl-btn--sm" onClick={back}>
            ← BACK TO CONSOLE
          </button>
        </div>
      </header>

      {/* Command strip — team KPIs */}
      <div className="tl-strip">
        <span className="tl-badge"><span className="tl-dot tl-dot--online" /> System operational</span>
        <span className="tl-badge">Agents online: {AGENTS.length}</span>
        <span className="tl-badge">Sessions today: {totals.totalChats}</span>
        <span className="tl-badge">Avg satisfaction: {totals.avgSatisfaction} / 5.0</span>
        <span className="tl-badge">Availability: {totals.avgAvailability}%</span>
      </div>

      <div className="tl-body">
        {/* Sidebar — Agent roster */}
        <aside className="tl-panel tl-panel--queue">
          <div className="tl-panel__head">
            <span className="tl-panel__title">AGENT ROSTER</span>
          </div>

          <div className="tl-queue">
            {data.map((agent) => (
              <button
                type="button"
                key={agent.name}
                aria-pressed={selected.name === agent.name}
                className="tl-queue-card"
                onClick={() => setSelected(agent)}
              >
                <div className="tl-row">
                  <span className="tl-avatar">{agent.name.charAt(0)}</span>
                  <div className="tl-col">
                    <span style={{ fontWeight: 600 }}>{agent.name}</span>
                    <span className="tl-faint" style={{ fontSize: 12 }}>
                      {agent.totalChats} sessions · {agent.satisfaction}★
                    </span>
                  </div>
                </div>
              </button>
            ))}

            {/* Team totals */}
            <div className="tl-box" style={{ marginTop: 8 }}>
              <div className="tl-box__label">Team totals</div>
              <div className="tl-spread" style={{ padding: "6px 0" }}>
                <span className="tl-muted">Total chats</span>
                <span style={{ fontWeight: 600 }}>{totals.totalChats}</span>
              </div>
              <div className="tl-spread" style={{ padding: "6px 0" }}>
                <span className="tl-muted">Missed chats</span>
                <span style={{ fontWeight: 600, color: "var(--tl-danger)" }}>{totals.missedChats}</span>
              </div>
              <div className="tl-spread" style={{ padding: "6px 0" }}>
                <span className="tl-muted">Avg satisfaction</span>
                <span style={{ fontWeight: 600, color: "var(--tl-warn-text)" }}>{totals.avgSatisfaction}/5</span>
              </div>
              <div className="tl-spread" style={{ padding: "6px 0" }}>
                <span className="tl-muted">Avg availability</span>
                <span style={{ fontWeight: 600, color: "var(--tl-success)" }}>{totals.avgAvailability}%</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main panel */}
        <main className="tl-detail">
          {/* Agent header */}
          <div className="tl-box tl-spread">
            <div className="tl-row">
              <span className="tl-avatar tl-avatar--lg">{selected.name.charAt(0)}</span>
              <div className="tl-col">
                <span className="tl-h2">{selected.name}</span>
                <span className="tl-faint" style={{ fontSize: 12 }}>Support Agent · ThreatLocker</span>
              </div>
            </div>
            <div className="tl-row" style={{ gap: 6 }}>
              {["overview", "reviews", "surveys"].map((t) => (
                <button
                  type="button"
                  key={t}
                  aria-pressed={tab === t}
                  className={`tl-btn tl-btn--sm ${tab === t ? "tl-btn--primary" : "tl-btn--ghost"}`}
                  onClick={() => setTab(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {tab === "overview" && (
            <>
              {/* Stat cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                <StatCard label="TOTAL CHATS" value={selected.totalChats} sub="This period" />
                <StatCard label="MISSED CHATS" value={selected.missedChats} sub="Needs review" />
                <StatCard label="GREETINGS CONV." value={`${selected.greetingsConversion}%`} sub="Converted to session" />
                <StatCard label="SATISFACTION" value={`${selected.satisfaction}/5`} sub="Avg customer rating" />
                <StatCard label="ENGAGEMENT" value={`${selected.engagement}%`} sub="Active chat rate" />
                <StatCard label="SURVEYS DONE" value={selected.surveysCompleted} sub="Completed surveys" />
                <StatCard label="AVAILABILITY" value={`${selected.availability}%`} sub="Online time" />
                <StatCard label="RESOLVED" value={selected.resolved} sub="Sessions closed" />
              </div>

              {/* Performance metrics */}
              <div className="tl-box">
                <div className="tl-eyebrow" style={{ marginBottom: 16 }}>Performance metrics</div>
                <div className="tl-col" style={{ gap: 12 }}>
                  {[
                    { label: "Greetings Conversion", value: selected.greetingsConversion },
                    { label: "Chat Engagement", value: selected.engagement },
                    { label: "Availability", value: selected.availability },
                    { label: "Resolution Rate", value: Math.min(100, Math.round((selected.resolved / selected.totalChats) * 100)) },
                  ].map((m) => (
                    <div key={m.label} className="tl-row" style={{ gap: 14 }}>
                      <span className="tl-muted" style={{ width: 180, flexShrink: 0 }}>{m.label}</span>
                      <div style={{ flex: 1 }}>
                        <RatingBar value={m.value} />
                      </div>
                      <span style={{ width: 44, textAlign: "right", flexShrink: 0, fontWeight: 600 }}>{m.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === "reviews" && (
            <div className="tl-col" style={{ gap: 12 }}>
              <div className="tl-box tl-row" style={{ gap: 20 }}>
                <div style={{ fontSize: 44, fontWeight: 700, color: "var(--tl-warn-text)" }}>{selected.satisfaction}</div>
                <div>
                  <StarRating rating={selected.satisfaction} />
                  <div className="tl-faint" style={{ fontSize: 12, marginTop: 4 }}>{selected.reviews.length} reviews</div>
                </div>
              </div>
              {selected.reviews.map((r, i) => (
                <div key={i} className="tl-box">
                  <div className="tl-spread" style={{ marginBottom: 8 }}>
                    <StarRating rating={r.rating} />
                    <span className="tl-faint" style={{ fontSize: 12 }}>{r.date}</span>
                  </div>
                  <div className="tl-muted">{r.comment}</div>
                </div>
              ))}
            </div>
          )}

          {tab === "surveys" && (
            <div className="tl-col" style={{ gap: 16 }}>
              <div className="tl-box" style={{ textAlign: "center" }}>
                <div style={{ fontSize: 44, fontWeight: 700, color: "var(--tl-brand)" }}>{selected.surveysCompleted}</div>
                <div className="tl-eyebrow" style={{ marginTop: 4 }}>Surveys completed</div>
              </div>
              <div className="tl-box tl-col" style={{ gap: 14 }}>
                {SURVEY_QUESTIONS.map((q, i) => {
                  const pct = selected.surveyScores[i];
                  return (
                    <div key={i} className="tl-row" style={{ gap: 14 }}>
                      <span className="tl-muted" style={{ width: 260, flexShrink: 0 }}>{q}</span>
                      <div style={{ flex: 1 }}>
                        <RatingBar value={pct} />
                      </div>
                      <span style={{ width: 44, textAlign: "right", flexShrink: 0, fontWeight: 600 }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
