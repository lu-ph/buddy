import {
  ServerToClientMessage,
  WSChatMessageRequest,
} from "../types/agent-ws-vo";
import WebSocket from "ws";

interface Logger {
  agent: (content: string) => void;
  tool: (name: string, input: string) => void;
  final: (success: boolean, cost: string, duration: string) => void;
  error: (text: string) => void;
  system: (text: string) => void;
}

type WaitInputCallback = () => void;

export class WSChatClientCli {
  private ws: WebSocket;

  constructor(logger: Logger, waitForPrompt: WaitInputCallback) {
    const rawServerUrl = process.env.SERVER_URL;
    const serverUrl = rawServerUrl
      ? rawServerUrl.startsWith("ws://") || rawServerUrl.startsWith("wss://")
        ? rawServerUrl
        : `ws://${rawServerUrl}`
      : "ws://localhost:3000/ws";

    const normalizedServerUrl = serverUrl.endsWith("/ws")
      ? serverUrl
      : `${serverUrl}/ws`;

    logger.system(`Connecting to ${normalizedServerUrl}`);

    this.ws = new WebSocket(normalizedServerUrl);

    this.ws.on("open", () => {
      logger.system("Connected to Agent Backend.");

      waitForPrompt();
    });

    this.ws.on("close", () => {
      logger.system("Disconnected");
      process.exit(0);
    });

    this.ws.on("error", (err) => {
      logger.error(`WebSocket Error: ${err.message}`);
    });

    this.ws.on("message", (rawMessage: string) => {
      try {
        const msg: ServerToClientMessage = JSON.parse(rawMessage.toString());

        switch (msg.type) {
          case "agent_text_response":
            logger.agent(msg.content);
            break;

          case "agent_tool_response":
            logger.tool(msg.toolName, msg.toolInput);
            break;

          case "agent_final_result":
            logger.final(msg.success, msg.cost, msg.duration);
            waitForPrompt();
            break;

          default:
            console.log("unknown message recieved:", msg);
        }
      } catch (error) {
        logger.error(`failed to handle message ${error}`);
      }
    });
  }

  public sendChatMessage(content: string): boolean {
    if (this.ws.readyState === WebSocket.OPEN) {
      const chatRequest: WSChatMessageRequest = {
        type: "agent_chat",
        content,
      };
      this.ws.send(JSON.stringify(chatRequest));
      return true;
    }
    return false;
  }

  public getWSReadyState() {
    return this.ws.readyState;
  }

  public close(): void {
    this.ws.close();
  }
}
