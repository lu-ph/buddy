import {
  ServerToClientMessage,
  WSChatMessageRequest,
} from "../types/agent-ws-vo";

export interface Logger {
  agent: (content: string) => void;
  tool: (name: string, input: any) => void;
  final: (success: boolean, cost: string, duration: string) => void;
  error: (text: string) => void;
  system: (text: string) => void;
}

type WaitInputCallback = () => void;

export class WSChatClientBrowser {
  private ws: WebSocket;

  constructor(
    serverUrl: string,
    logger: Logger,
    waitForPrompt: WaitInputCallback,
    onStatusChange?: (status: string) => void,
  ) {
    const normalizedServerUrl = serverUrl.endsWith("/ws")
      ? serverUrl
      : `${serverUrl}/ws`;

    logger.system(`Connecting to ${normalizedServerUrl}`);

    this.ws = new WebSocket(normalizedServerUrl);

    this.ws.onopen = () => {
      logger.system("Connected to Agent Backend.");
      onStatusChange?.("connected");
      waitForPrompt();
    };

    this.ws.onclose = () => {
      logger.system("Disconnected");
      onStatusChange?.("disconnected");
    };

    this.ws.onerror = () => {
      logger.error(`WebSocket Error Occurred`);
      onStatusChange?.("error");
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const msg: ServerToClientMessage = JSON.parse(event.data);

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
    };
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
