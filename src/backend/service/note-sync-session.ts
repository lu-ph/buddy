import fs from "fs";
import { WebSocket } from "ws";
import { ClientToServerNoteMsg, ServerToClientNoteMsg, WSNoteSessionBackendErrorMessage, WSNoteSessionInit, WSUpdateUserEditedNote } from "../types/note-session-ws-vo";

export class NoteSyncSession {
  public readonly sessionId: string;
  private lastKnownContent: string | null = null;
  private filePath: string | null = null;
  private ws: WebSocket;
  private fileWatcher: fs.FSWatcher | null = null;

  constructor(ws: WebSocket) {
    this.sessionId = `note_session_${Date.now()}`;
    this.ws = ws;

    this.ws.on("message", (rawMessage: string | Buffer) => {
      try {
        const data: ClientToServerNoteMsg = JSON.parse(rawMessage.toString());
        
        switch (data.type) {
          case "note_init":
            const initMessage: WSNoteSessionInit = data as WSNoteSessionInit
            if (!initMessage.filePath) {
              this.sendToClient({
                type: "backend_error",
                message: "filePath can not be empty"
              }) 
              break
            }
            this.filePath = initMessage.filePath;
            this.lastKnownContent = fs.readFileSync(this.filePath, "utf-8");

            this.sendToClient({
              type: "note_init_resp",
              fileContent: this.lastKnownContent,
            });

            this.fileWatcher = fs.watch(this.filePath, (eventType) => {
              if (eventType == "change") {
                const currentContent = fs.readFileSync(this.filePath!, "utf-8");
                if (currentContent !== this.lastKnownContent) {
                  this.lastKnownContent = currentContent;
                  this.sendToClient({
                    type: "note_change",
                    newContent: this.lastKnownContent,
                  });
                }
              }
            });

            console.log(`watching file: ${this.filePath}`);

            break;

          case "update_user_edited_note":
            const updateMessage = data as WSUpdateUserEditedNote
            if (updateMessage.newContent || this.lastKnownContent !== updateMessage.newContent || this.filePath) {
              this.lastKnownContent = updateMessage.newContent
              fs.writeFileSync(this.filePath!, updateMessage.newContent, "utf-8")

            } else {
              const errorMsg: WSNoteSessionBackendErrorMessage = {
                type: "backend_error",
                message: "content is null or filePath is not initalized"
              }
              this.sendToClient(errorMsg)
            }
        }
      
      } catch (error) {
        console.error("failed to handle user edit note message: ", error)
      }
    });
  }

  private sendToClient(content: ServerToClientNoteMsg): void {
    if (this.ws.readyState == WebSocket.OPEN) {
      this.ws.send(JSON.stringify(content));
    }
  }

  public close(): void {
    if (this.fileWatcher) { this.fileWatcher.close() }
    console.log(`[NoteSyncSession] Session ${this.sessionId} closed.`);
  }
}
