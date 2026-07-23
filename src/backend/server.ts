import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { Agent } from "./agent.js";
import { Session } from "./service/session.js";
import express from "express";
import cors from "cors";
import path from "path";
import { ClientToServerMessage } from "./types/agent-ws-vo.js";
import { NoteSyncSession } from "./service/note-sync-session.js";

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

  const session = new Session(ws);

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (data: any) => {
    try {
      const message: ClientToServerMessage = JSON.parse(data.toString());

      switch (message.type) {
        case "chat": {
          session.sendToAgent(message.content);
          break;
        }

        default: {
          console.warn("unknown message type: ", (message as any).type);
        }
      }
    } catch (error) {
      console.error("Error handling WebSocket message:", error);
      ws.send(
        JSON.stringify({ type: "error", error: "Invalid message format" }),
      );
    }
  });

  ws.on("close", () => {
    console.log("Websocket client disconnected");
    session.disconnect();
  });

  const noteSession = new NoteSyncSession(ws)
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`WebSocket endpoint available at ws://localhost:${PORT}/ws`);
  console.log(`Visit http://localhost:${PORT} to view the chat interface`);
});
