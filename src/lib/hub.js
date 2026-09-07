// hub.js — the single place connections are created. In demo mode this returns an
// in-memory scripted hub so the full chat flow runs with no backend; otherwise it
// builds a real SignalR connection. Components attach handlers and call start() as usual.
import * as signalR from "@microsoft/signalr";
import { CHAT_HUB_URL, IS_DEMO } from "./config";
import { createDemoConnection } from "./demoHub";

export function createHubConnection({ token } = {}) {
  if (IS_DEMO) return createDemoConnection();
  return new signalR.HubConnectionBuilder()
    .withUrl(CHAT_HUB_URL, token ? { accessTokenFactory: () => token } : {})
    .withAutomaticReconnect()
    .build();
}
