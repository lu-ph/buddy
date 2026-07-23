import { Agent } from "../agent.js";
import type { WSClient } from "../server.js";

export class Session {
  private client: WSClient | null = null;
  private agent: Agent;
  private isListening: boolean = false;

  constructor(client: WSClient) {
    this.agent = new Agent();
    this.client = client;
  }

  public disconnect() {
    this.client = null;
  }

  public sendToAgent(userInput: string): void {
    this.agent.sendMessage(userInput);

    if (!this.isListening) {
      this.listenToAgent();
    }
  }

  public async listenToAgent() {
    if (this.isListening) return;
    this.isListening = true;

    try {
      for await (const message of this.agent.getOutputStream()) {
        this.handleSDKMessage(message);
      }
    } catch (error) {
      console.error("error listening to agent: ", error);
    }
  }

  public sendToClient(message: any): void {
    const JsonStr = JSON.stringify(message);
    if (!this.client) {
      console.error("error sending to client: client is not initialized");
      return;
    }

    try {
      this.client.send(JsonStr);
    } catch (error) {
      console.error("error sending message to client: ", error);
    }
  }

  private handleSDKMessage(message: any): void {
    if (message.type === "assistant") {
      const content = message.message.content;

      if (typeof content === "string") {
        this.sendToClient({
          type: "agent_text_response",
          content: content,
        });
      } else if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === "text") {
            this.sendToClient({
              type: "agent_text_response",
              content: block.text,
            });
          } else if (block.type === "tool_use") {
            this.sendToClient({
              type: "agent_tool_response",
              toolName: block.name,
              toolId: block.id,
              toolInput: block.input,
            });
          }
        }
      }
    } else if (message.type === "result") {
      this.sendToClient({
        type: "agent_final_result",
        success: message.subtype === "success",
        cost: message.total_cost_usd,
        duration: message.duration_ms,
      });
    }
  }
}
