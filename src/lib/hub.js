// hub.js — the single place connections are created. In demo mode this returns an
// in-memory scripted hub so the full chat flow runs with no backend; otherwise it
// builds a real SignalR connection. Components attach handlers and call start() as usual.
import * as signalR from "@microsoft/signalr";
import { CHAT_HUB_URL, IS_DEMO } from "./config";
import { createDemoConnection } from "./demoHub";

/**
 * Create the chat hub connection used by every screen.
 *
 * In demo mode (`VITE_DEMO_MODE=true`) this returns the in-memory scripted hub so the
 * full chat flow runs with no backend; otherwise it builds a real SignalR connection
 * with automatic reconnect, attaching the agent JWT via `accessTokenFactory` when given.
 *
 * @param {{ token?: string }} [options] Optional agent bearer token for authenticated hubs.
 * @returns {import("@microsoft/signalr").HubConnection | ReturnType<typeof createDemoConnection>}
 *   A connection exposing the SignalR-shaped API (`on`/`off`/`invoke`/`start`/`stop`).
 */
export function createHubConnection({ token } = {}) {
  if (IS_DEMO) return createDemoConnection();
  return new signalR.HubConnectionBuilder()
    .withUrl(CHAT_HUB_URL, token ? { accessTokenFactory: () => token } : {})
    .withAutomaticReconnect()
    .build();
}
