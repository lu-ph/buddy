import WebSocket from "ws";
import {
  ClientToServerPDFMessage,
  ServerToClientPDFMessage,
} from "../types/pdf-viewer-ws-vo";
import { readFile } from "node:fs/promises";

export class PDFViewerSession {
  private ws: WebSocket;

  constructor(ws: WebSocket) {
    this.ws = ws;
  }

  public async handleMessages(): Promise<void> {
    this.ws.on("message", async (rawMessage: any) => {
      const message: ClientToServerPDFMessage = JSON.parse(rawMessage);

      switch (message.type) {
        case "get_pdf": {
          const pdfPath = message.pdfPath;
          const buffer: Buffer = await this.getPDFBuffer(pdfPath);
          this.sendPdfBuffer(buffer);
          break;
        }

        default:
          console.log("unknown message:", message.type);
      }
    });
  }

  private sendToClient(content: ServerToClientPDFMessage): void {
    if (this.ws.readyState == WebSocket.OPEN) {
      this.ws.send(JSON.stringify(content));
    }
  }

  private sendPdfBuffer(buffer: Buffer): void {
    if (this.ws.readyState == WebSocket.OPEN) {
      this.ws.send(buffer);
    }
  }

  private async getPDFBuffer(path: string): Promise<Buffer> {
    try {
      const pdfBuffer: Buffer = await readFile(path);
      return pdfBuffer;
    } catch (error) {
      console.log(`Error getting PDF buffer: ${error}`);
      throw new Error(`Error getting PDF buffer: ${error}`);
    }
  }

  public jumpToPage(pageNum: number): void {
    this.sendToClient({
      type: "jump_to_page",
      pageNum: pageNum,
    });
  }
}
