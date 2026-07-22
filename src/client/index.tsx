import { useState, useEffect } from "react";

export default function MainPage() {
  const [ws, setWs] = useState<WebSocket | null>;

  useEffect(() => {
    const socket: WebSocket = new WebSocket("ws:localhost:3000");
    setWs(socket);
  });
}
