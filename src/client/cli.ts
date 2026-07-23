import readline from "readline";
import WebSocket from "ws";
import dotenv from "dotenv";
import { WSChatMessageRequest } from "./types/agent-ws-vo";
import { WSChatClient } from "./ws/ws-chat-client";

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const logger = {
  agent: (content: string) => {
    console.log(`\x1b[34mAgent: ${content}\x1b[0m`);
  },
  tool: (name: string, input: string) => {
    const formattedInput =
      typeof input === "object" ? JSON.stringify(input, null, 2) : input;
    console.log(`\x1b[35m[Tool] ${name}: ${formattedInput}\x1b[0m`);
  },
  final: (success: boolean, cost: string, duration: string) => {
    console.log(`[Done] success=${success}, duration=${duration}, cost=${cost}\n`);
  },
  error: (text: string) => console.log(`[Error] ${text}`),
  system: (text: string) => console.log(`[System] ${text}`),
};

let client: WSChatClient;

function waitForPrompt(): void {
  rl.question("> ", (input) => {
    const trimmedInput = input.trim();

    if (trimmedInput.toLowerCase() === "exit") {
      logger.system("Closing connection...");
      client.close();
      rl.close();
      process.exit(0);
      return;
    }

    if (!trimmedInput) {
      waitForPrompt();
      return;
    }

    const chatRequest: WSChatMessageRequest = {
      type: "chat",
      content: trimmedInput,
    };

    if (client.getWSReadyState() === WebSocket.OPEN) {
      client.sendChatMessage(JSON.stringify(chatRequest));
    } else {
      logger.error("WebSocket is not ready");
      waitForPrompt();
    }
  });
}

client = new WSChatClient(logger, waitForPrompt);