import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { AgentSession } from "./service/agent-session.js";
import express from "express";
import cors from "cors";
import path from "path";
import { NoteSyncSession } from "./service/note-sync-session.js";
import { PDFViewerSession } from "./service/pdf-viewer-session.js";
import { BaseSession } from "./types/interface/session.js";

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

app.use("/client", express.static(path.join(__dirname, "../client")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/note-panel/index.html"));
});

export interface WSClient extends WebSocket {
  sessionId?: string;
  isAlive?: boolean;
}

const server = createServer(app);

const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws: WSClient) => {
  console.log(`websocket connected id:${ws.sessionId}`);
  ws.isAlive = true;

  const sessions: BaseSession[] = [
    new AgentSession(ws),
    new NoteSyncSession(ws),
    new PDFViewerSession(ws),
  ];

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", async (data: any) => {
    try {
      const message = JSON.parse(data.toString());
      const type = message.type as string;

      let handled = false;
      for (const session of sessions) {
        if (await session.handleMessage(message)) {
          handled = true;
          break;
        }
      }

      if (!handled) {
        console.warn(`[Router] Unhandled message type: ${type}`);
      }
    } catch (error) {
      console.error("[Router] Error parsing WS message:", error);
    }
  });

  ws.on("close", () => {
    console.log(`WebSocket disconnected: ${ws.sessionId}`);
    Object.values(sessions).forEach((session) => {
      if (typeof session.destroy === "function") session.destroy();
      if (typeof (session as any).disconnect === "function")
        (session as any).disconnect();
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`WebSocket endpoint available at ws://localhost:${PORT}/ws`);
  console.log(`Visit http://localhost:${PORT} to view the chat interface`);
});
