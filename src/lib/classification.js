// classification.js — E.D.I.T.H module-classification and threat-level presentation.
// Single source of truth shared by AgentDashboard and ChatWindow (previously duplicated).

const MODULE_COLORS = [
  ["application", "#0ea5e9"],
  ["ringfencing", "#a855f7"],
  ["storage", "#f59e0b"],
  ["network", "#22c55e"],
  ["elevation", "#ef4444"],
  ["configuration", "#06b6d4"],
];

/** Accent color for an E.D.I.T.H module classification (case-insensitive substring match). */
export function moduleColor(mod) {
  if (!mod) return "#475569";
  const m = String(mod).toLowerCase();
  for (const [key, color] of MODULE_COLORS) if (m.includes(key)) return color;
  return "#475569";
}

/** Presentation tokens for a threat level. Falls back to a neutral slate. */
export const THREAT_COLORS = {
  LOW: { bg: "#22c55e20", color: "#22c55e", border: "#22c55e40" },
  MEDIUM: { bg: "#f59e0b20", color: "#f59e0b", border: "#f59e0b40" },
  HIGH: { bg: "#ef444420", color: "#ef4444", border: "#ef444440" },
  CRITICAL: { bg: "#ff004020", color: "#ff0040", border: "#ff004040" },
};

export function threatColor(level) {
  return THREAT_COLORS[level] || { bg: "#47556920", color: "#475569", border: "#47556940" };
}

/** Normalize a queue session that may arrive flat or nested under `intake`. */
export function normalizeSession(s) {
  if (!s) return s;
  return {
    ...s,
    organizationName: s.intake?.organizationName ?? s.organizationName,
    osPlatform: s.intake?.osPlatform ?? s.osPlatform,
    issueDescription: s.intake?.issueDescription ?? s.issueDescription,
  };
}

/** Human wait label from a timestamp; guards against missing/invalid dates. */
export function waitLabel(createdAt, nowMs) {
  const t = new Date(createdAt).getTime();
  if (!Number.isFinite(t)) return "JUST NOW";
  const mins = Math.floor((nowMs - t) / 60000);
  return mins < 1 ? "JUST NOW" : `${mins}m AGO`;
}
