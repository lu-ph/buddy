import readline from "readline";
import WebSocket from "ws";
import dotenv from "dotenv";
import { ChildProcess, spawn } from "child_process";
import {
  ServerToClientMessage,
  WSChatMessageRequest,
} from "./types/agent-ws-vo";
import { WSChatClient } from "./ws/ws-chat-client";
import express from "express";
import path from "path";

dotenv.config();

const app = express();

app.use(express.static(path.join(__dirname, "note-panel")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "note-panel", "index.html"));
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
