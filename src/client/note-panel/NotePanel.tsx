import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  ServerToClientNoteMsg,
  ClientToServerNoteMsg,
} from "../types/note-session-ws-vo";
import "./note-panel.css";

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export const NotePanel: React.FC = () => {
  const [filePath, setFilePath] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [stats, setStats] = useState({ lines: 1, chars: 0 });

  const wsRef = useRef<WebSocket | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const isLocalEditingRef = useRef<boolean>(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const targetFilePath = urlParams.get("filePath") || "";
    setFilePath(targetFilePath);

    if (!targetFilePath) {
      setStatus("error");
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws?clientType=note&filePath=${encodeURIComponent(
      targetFilePath,
    )}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");

      const initMessage: ClientToServerNoteMsg = {
        type: "note_init",
        filePath: targetFilePath,
      };
      console.log("[NotePanel WS] send:", initMessage);
      ws.send(JSON.stringify(initMessage));
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const message: ServerToClientNoteMsg = JSON.parse(event.data);
        console.log("[NotePanel WS] receive:", message);

        if (message.type === "note_init_resp") {
          setContent(message.fileContent);
          updateStats(message.fileContent);
        } else if (message.type === "note_change") {
          setContent((prev) => {
            if (prev !== message.newContent) {
              const textarea = textareaRef.current;
              const selectionStart = textarea?.selectionStart;
              const selectionEnd = textarea?.selectionEnd;

              requestAnimationFrame(() => {
                if (
                  textarea &&
                  selectionStart !== undefined &&
                  selectionEnd !== undefined
                ) {
                  textarea.setSelectionRange(selectionStart, selectionEnd);
                }
              });

              updateStats(message.newContent);
              return message.newContent;
            }
            return prev;
          });
        }
      } catch (err) {
        console.error("[NoteSync] 消息解析错误:", err);
      }
    };

    ws.onerror = () => {
      setStatus("error");
    };

    ws.onclose = () => {
      setStatus("disconnected");
    };

    return () => {
      ws.close();
    };
  }, []);

  const updateStats = (text: string) => {
    const lines = text ? text.split("\n").length : 1;
    const chars = text.length;
    setStats({ lines, chars });
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    isLocalEditingRef.current = true;
    setContent(newText);
    updateStats(newText);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const msg: ClientToServerNoteMsg = {
        type: "update_user_edited_note",
        newContent: newText,
      };
      console.log("[NotePanel WS] send:", msg);
      wsRef.current.send(JSON.stringify(msg));
    }

    isLocalEditingRef.current = false;
  };

  const fileName = filePath ? filePath.split(/[/\\]/).pop() : "未选择文件";

  return (
    <div className="note-container">
      {/* 顶栏 Header */}
      <header className="note-header">
        <div className="note-file-info" title={filePath}>
          <span className="file-icon">📄</span>
          <span className="file-name">{fileName}</span>
        </div>
        <div className="note-status-badge">
          <span className={`status-dot ${status}`} />
          <span className="status-text">
            {status === "connected" && "已同步"}
            {status === "connecting" && "连接中..."}
            {status === "disconnected" && "已断开"}
            {status === "error" && "连接错误"}
          </span>
        </div>
      </header>

      {/* 主编辑区 Main Editor */}
      <main className="note-body">
        {status === "error" && !filePath ? (
          <div className="note-empty-state">缺失 filePath 参数</div>
        ) : (
          <textarea
            ref={textareaRef}
            className="note-textarea"
            value={content}
            onChange={handleTextChange}
            placeholder="等待 Agent 写入数据或在此处直接修改..."
            spellCheck={false}
          />
        )}
      </main>

      {/* 底栏 Footer Stats */}
      <footer className="note-footer">
        <div className="path-preview" title={filePath}>
          {filePath || "No file active"}
        </div>
        <div className="stats-preview">
          <span>行数: {stats.lines}</span>
          <span>字符: {stats.chars}</span>
        </div>
      </footer>
    </div>
  );
};

export default NotePanel;
