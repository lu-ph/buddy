import { useEffect, useRef, useState } from "react";
import {
  ClientToServerPDFMessage,
  ServerToClientPDFMessage,
} from "../types/pdf-viewer-ws-vo";

export function usePdfWebSocket(
  filePath: string | null,
  onJumpToPage: (page: number) => void,
) {
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const sendMessage = (msg: ClientToServerPDFMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("[WS Send]", msg);
      wsRef.current.send(JSON.stringify(msg));
    }
  };

  useEffect(() => {
    if (!filePath) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const rawServerUrl = import.meta.env.VITE_SERVER_URL;
    let wsUrl = rawServerUrl ? rawServerUrl : "/ws";

    if (
      !wsUrl.startsWith("ws://") &&
      !wsUrl.startsWith("wss://") &&
      !wsUrl.startsWith("/")
    ) {
      wsUrl = `${protocol}//${wsUrl}`;
    }

    if (!wsUrl.endsWith("/ws")) {
      wsUrl = `${wsUrl.replace(/\/+$|$/, "")}/ws`;
    }

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      console.log("[WS Connected]");
      sendMessage({
        type: "get_pdf",
        pdfPath: filePath,
      });
    };

    ws.onmessage = (event: MessageEvent) => {
      console.log("[WS Receive]", event.data);

      if (event.data instanceof ArrayBuffer) {
        const incoming = new Uint8Array(event.data);
        const copy = new Uint8Array(incoming.length);
        copy.set(incoming);
        setPdfData(copy);
        return;
      }

      if (typeof event.data === "string") {
        try {
          const message: ServerToClientPDFMessage = JSON.parse(event.data);

          if (message.type === "pdf_jump_to_page") {
            onJumpToPage(message.pageNum);
          }
        } catch (err) {
          console.error("[WS Parse Error]", err);
        }
      }
    };

    ws.onerror = (err) => console.error("[WS Error]", err);
    ws.onclose = () => console.log("[WS Closed]");

    return () => {
      ws.close();
    };
  }, [filePath]);

  return { pdfData, sendMessage };
}
