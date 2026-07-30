import { WebSocket } from "ws";
import { Agent } from "../agent.js";
import type { WSClient } from "../server.js";
import { BaseSession } from "../types/interface/session.js";

export class AgentSession implements BaseSession {
  private client: WSClient | null = null;
  private agent: Agent;
  private isListening: boolean = false;
  private isDestroyed: boolean = false;

  constructor(client: WSClient) {
    this.agent = new Agent();
    this.client = client;
  }

  public async handleMessage(message: any): Promise<boolean> {
    if (this.isDestroyed) return false;

    if (message.type === "agent_chat") {
      const content = message.content || message.text;
      if (typeof content === "string" && content.trim()) {
        this.sendToAgent(content);
        return true;
      }
    }

    return false;
  }

  public sendToAgent(userInput: string): void {
    if (this.isDestroyed) return;

    this.agent.sendMessage(userInput);

    if (!this.isListening) {
      this.listenToAgent();
    }
  }

  private async listenToAgent(): Promise<void> {
    if (this.isListening) return;
    this.isListening = true;

    try {
      for await (const message of this.agent.getOutputStream()) {
        if (this.isDestroyed) break;
        this.handleSDKMessage(message);
      }
    } catch (error) {
      console.error("[Session] Error listening to agent stream:", error);
      this.sendToClient({
        type: "agent_error",
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      this.isListening = false;
    }
  }

  private handleSDKMessage(message: any): void {
    if (!message) return;

    if (message.type === "assistant") {
      const content = message.message?.content;

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

  private sendToClient(message: any): void {
    if (!this.client || this.client.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      this.client.send(JSON.stringify(message));
    } catch (error) {
      console.error("[Session] Error sending message to client:", error);
    }
  }

  public destroy(): void {
    if (this.isDestroyed) return;

    this.isDestroyed = true;
    this.client = null;

    this.agent.pause().catch((err) => {
      console.error("[Session] Error pausing agent on destroy:", err);
    });

    console.log("[Session] Agent chat session destroyed.");
  }
}
