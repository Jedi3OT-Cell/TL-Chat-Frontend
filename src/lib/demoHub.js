// demoHub.js — in-memory, SignalR-shaped connection plus a fetch stub, used only when
// VITE_DEMO_MODE=true. Lets the customer and agent chat flows run end-to-end (join,
// messaging, close, rating) with a scripted counterpart and no backend. Compiled out
// of normal production builds (guarded by IS_DEMO at the call sites).

const now = () => new Date().toISOString();

const DEMO_QUEUE = [
  {
    sessionId: "demo-1001",
    createdAt: now(),
    customerName: "Ada Lovelace",
    organizationName: "Analytical Engine Co",
    osPlatform: "Windows 11",
    issueDescription: "Ringfencing is blocking Excel from reaching a network share after the latest policy push.",
    summary: {
      moduleClassification: "Ringfencing",
      issueTypeClassification: "Policy Misconfiguration",
      recommendedSteps: [
        "Review the Ringfencing policy scope for Excel",
        "Add the share path to the allowed storage locations",
        "Re-deploy policy and confirm with the customer",
      ],
      suggestedKBArticles: ["Ringfencing network share access"],
      escalationRecommended: false,
      threatLevel: "MEDIUM",
    },
  },
];

export function createDemoConnection() {
  const handlers = new Map();
  let state = "Disconnected";

  const emit = (event, ...args) => {
    const list = handlers.get(event) || [];
    for (const cb of list) {
      try { cb(...args); } catch { /* ignore listener errors in demo */ }
    }
  };
  const later = (ms, fn) => setTimeout(fn, ms);

  return {
    get state() { return state; },
    on(event, cb) { handlers.set(event, [...(handlers.get(event) || []), cb]); },
    off(event) { handlers.delete(event); },
    onreconnected() { /* demo never drops */ },
    onclose() {},
    start() { state = "Connected"; return Promise.resolve(); },
    stop() { state = "Disconnected"; handlers.clear(); return Promise.resolve(); },
    invoke(method, ...args) {
      switch (method) {
        case "RegisterAsAgent":
          later(200, () => { emit("AgentRegistered"); emit("QueueUpdated", DEMO_QUEUE); });
          break;
        case "JoinSessionAsCustomer": {
          const [, name] = args;
          later(700, () => emit("AgentJoined", "E.D.I.T.H Agent"));
          later(1100, () => emit("ReceiveMessage", {
            senderName: "E.D.I.T.H Agent", senderRole: "agent",
            message: `Hi ${name || "there"} — I've reviewed the E.D.I.T.H triage. Let's get this resolved.`,
            timestamp: now(),
          }));
          break;
        }
        case "JoinSession": {
          const [, agentName] = args;
          later(300, () => emit("AgentJoined", agentName));
          later(700, () => emit("ReceiveMessage", {
            senderName: "Ada Lovelace", senderRole: "customer",
            message: "Thanks for picking this up — the share still won't open from Excel.",
            timestamp: now(),
          }));
          break;
        }
        case "SendMessage": {
          const [, senderName, message, senderRole] = args;
          // Echo the sender's own message (mirrors backend echo behavior)...
          emit("ReceiveMessage", { senderName, senderRole, message, timestamp: now() });
          // ...then a scripted reply from the other side.
          const replyRole = senderRole === "agent" ? "customer" : "agent";
          const replyName = senderRole === "agent" ? "Ada Lovelace" : "E.D.I.T.H Agent";
          const reply = senderRole === "agent"
            ? "Okay, trying that now… one moment."
            : "Understood. Checking the Ringfencing policy scope for that path now.";
          later(900, () => emit("ReceiveMessage", { senderName: replyName, senderRole: replyRole, message: reply, timestamp: now() }));
          break;
        }
        case "CloseSession":
          later(150, () => emit("SessionClosed"));
          break;
        case "TypingIndicator":
        default:
          break;
      }
      return Promise.resolve();
    },
  };
}

/** Install a fetch stub for the REST endpoints so demo mode needs no backend. */
export function installDemoBackend() {
  if (typeof window === "undefined" || window.__tlDemoFetch) return;
  const real = window.fetch ? window.fetch.bind(window) : null;
  window.__tlDemoFetch = true;

  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input?.url || "";
    if (url.includes("/api/auth/login")) return json({ displayName: "Demo Agent", token: "demo.jwt.token" });
    if (/\/api\/chat\/session\/[^/]+\/rating$/.test(url)) return new Response(null, { status: 204 });
    if (url.endsWith("/api/chat/session")) return json({ sessionId: "demo-" + Date.now() });
    if (url.endsWith("/api/chat/queue")) return json(DEMO_QUEUE);
    return real ? real(input, init) : json({ error: "demo: unhandled" }, 404);
  };
}
