import WebSocket from "ws";
import {
  ClientToServerPDFMessage,
  ServerToClientPDFMessage,
} from "../types/ws/pdf-viewer-ws-vo";
import { readFile } from "node:fs/promises";
import { BaseSession } from "../types/interface/session";

export class PDFViewerSession implements BaseSession {
  private ws: WebSocket;

  constructor(ws: WebSocket) {
    this.ws = ws;
  }

  public async handleMessage(data: ClientToServerPDFMessage): Promise<boolean> {
    try {
      switch (data.type) {
        case "pdf_get": {
          if (!data.pdfPath) {
            this.sendError("pdfPath can not be empty");
            return true;
          }

          const buffer: Buffer = await this.getPDFBuffer(data.pdfPath);
          this.sendPdfBuffer(buffer);
          return true;
        }

        default:
          return false;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.sendError(errorMessage);
      return true;
    }
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
      type: "pdf_jump_to_page",
      pageNum: pageNum,
    });
  }

  private sendError(message: string): void {
    this.sendToClient({
      type: "pdf_session_error",
      message,
    });
  }

  public destroy() {}
}
