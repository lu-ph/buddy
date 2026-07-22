import fs from "fs";
import { WebSocket } from "ws";
import { ClientToServerNoteMsg, ServerToClientNoteMsg } from "../types/note-session-ws-vo";

export class NoteSyncSession {
  public readonly sessionId: string;
  private lastKnownContent: string;
  private filePath: string;
  private ws: WebSocket;
  private fileWatcher: fs.FSWatcher;

  constructor(ws: WebSocket, filePath: string) {
    this.sessionId = `note_session_${Date.now()}_${filePath}`;
    this.ws = ws;
    this.filePath = filePath;
    this.lastKnownContent = fs.readFileSync(this.filePath, "utf-8");

    console.log(
      `Note session ${this.sessionId} is created, watching ${this.filePath}`,
    );
    this.sendToClient({
      type: "note_init",
      filePath: this.filePath,
      fileContent: this.lastKnownContent
    });

    this.fileWatcher = fs.watch(this.filePath, (eventType) => {
      if (eventType == "change") {
        const currentContent = fs.readFileSync(this.filePath, "utf-8");
        if (currentContent !== this.lastKnownContent) {
          this.lastKnownContent = currentContent;
          this.sendToClient({
            type: "note_change",
            newContent: this.lastKnownContent,
          });
        }
      }
    });
    this.ws.on("message", (rawMessage: string | Buffer) => {
      try {
        const data: ClientToServerNoteMsg = JSON.parse(rawMessage.toString());
        
        if (data.type === "update_user_edited_note" && data.newContent !== undefined) {
          if (data.newContent !== this.lastKnownContent) {
            this.lastKnownContent = data.newContent;
            fs.writeFileSync(this.filePath, data.newContent, "utf-8");
          }
        }
      } catch (error) {
        console.error("failed to handle user edit note message: ", error)
      }
    });
  }

  private sendToClient(content: ServerToClientNoteMsg): void {
    if (this.ws.readyState == WebSocket.OPEN) {
      this.ws.send(JSON.stringify(JSON.stringify(content)))
    }
  }

  public close(): void {
    this.fileWatcher.close();
    console.log(`[NoteSyncSession] Session ${this.sessionId} closed.`);
  }
}
