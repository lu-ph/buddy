import React, { useState, useEffect, useRef } from "react";
import { Logger, WSChatClientBrowser } from "../ws/ws-chat-client-browser";

interface ChatMessage {
  id: string;
  role: "user" | "agent" | "tool" | "system" | "error";
  content: string;
  metadata?: any;
}

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export const AgentPanel: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [isWaitingPrompt, setIsWaitingPrompt] = useState(false);

  const clientRef = useRef<WSChatClientBrowser | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const wsUrl = `ws://localhost:3000/ws`;

    const logger: Logger = {
      agent: (content) => {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: "agent", content },
        ]);
      },
      tool: (name, input) => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "tool",
            content: `执行工具: ${name}`,
            metadata: input,
          },
        ]);
      },
      final: (success, cost, duration) => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "system",
            content: `[完成] 状态: ${success ? "成功" : "失败"} | 耗时: ${duration} | 消耗: ${cost}`,
          },
        ]);
      },
      error: (text) => {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: "error", content: text },
        ]);
      },
      system: (text) => {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: "system", content: text },
        ]);
      },
    };

    const waitForPrompt = () => {
      setIsWaitingPrompt(true);
    };

    clientRef.current = new WSChatClientBrowser(
      wsUrl,
      logger,
      waitForPrompt,
      (newStatus) => {
        setStatus(newStatus as ConnectionStatus);
      },
    );

    return () => {
      clientRef.current?.close();
    };
  }, []);

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || !clientRef.current) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: trimmed },
    ]);
    setInputValue("");
    setIsWaitingPrompt(false);

    const sent = clientRef.current.sendChatMessage(trimmed);
    if (!sent) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "error",
          content: "消息发送失败：WebSocket 未连接",
        },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#1e1e1e] text-[#cccccc] font-sans border-r border-[#3c3c3c]">
      <header className="flex h-[40px] items-center justify-between bg-[#252526] px-[16px] border-b border-[#3c3c3c] shadow-sm shrink-0">
        <div className="text-[14px] font-medium text-[#e1e1e1]">AI Agent</div>
        <div className="flex items-center gap-[6px]">
          <span
            className={`w-[8px] h-[8px] rounded-full ${
              status === "connected"
                ? "bg-[#4ec9b0]"
                : status === "connecting"
                  ? "bg-[#cca700] animate-pulse"
                  : "bg-[#f14c4c]"
            }`}
          />
          <span className="text-[11px] text-[#858585]">
            {status === "connected" && "已连接"}
            {status === "connecting" && "连接中..."}
            {status === "disconnected" && "已断开"}
            {status === "error" && "连接错误"}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-[16px] space-y-[16px] [::-webkit-scrollbar]:w-[8px] [::-webkit-scrollbar-track]:bg-[#1e1e1e] [::-webkit-scrollbar-thumb]:bg-[#424242] [::-webkit-scrollbar-thumb]:rounded-[4px]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            {msg.role === "system" && (
              <div className="text-[12px] text-[#858585] bg-[#2d2d2d] px-[8px] py-[4px] rounded-[4px] self-center my-[8px]">
                {msg.content}
              </div>
            )}

            {msg.role === "error" && (
              <div className="text-[13px] text-[#f14c4c] bg-[#3a1d1d] px-[12px] py-[8px] rounded-[6px] border border-[#f14c4c]/30 max-w-[85%]">
                {msg.content}
              </div>
            )}

            {msg.role === "tool" && (
              <div className="text-[12px] text-[#c586c0] bg-[#252526] px-[12px] py-[8px] rounded-[6px] border border-[#3c3c3c] max-w-[85%] font-mono">
                <div className="font-semibold mb-[4px]">{msg.content}</div>
                <pre className="whitespace-pre-wrap break-all text-[#9cdcfe]">
                  {typeof msg.metadata === "object"
                    ? JSON.stringify(msg.metadata, null, 2)
                    : msg.metadata}
                </pre>
              </div>
            )}

            {(msg.role === "user" || msg.role === "agent") && (
              <div
                className={`px-[14px] py-[10px] rounded-[8px] max-w-[85%] text-[14px] leading-relaxed whitespace-pre-wrap break-words ${
                  msg.role === "user"
                    ? "bg-[#0e639c] text-white rounded-br-none"
                    : "bg-[#2d2d2d] text-[#d4d4d4] rounded-bl-none border border-[#3c3c3c]"
                }`}
              >
                {msg.content}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-[16px] bg-[#252526] border-t border-[#3c3c3c] shrink-0">
        <div className="relative flex items-end bg-[#1e1e1e] border border-[#3c3c3c] rounded-[6px] focus-within:border-[#0e639c] transition-colors">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isWaitingPrompt
                ? "输入指令给 Agent (Enter 发送)..."
                : "Agent 正在处理中..."
            }
            className="w-full max-h-[150px] min-h-[44px] bg-transparent text-[#cccccc] text-[14px] p-[10px] resize-none outline-none overflow-y-auto [::-webkit-scrollbar]:w-[6px] [::-webkit-scrollbar-thumb]:bg-[#424242] [::-webkit-scrollbar-thumb]:rounded-[3px]"
            rows={1}
            disabled={status !== "connected" || !isWaitingPrompt}
          />
          <button
            onClick={handleSend}
            disabled={
              status !== "connected" || !inputValue.trim() || !isWaitingPrompt
            }
            className="p-[10px] text-[#0e639c] hover:text-[#1177bb] disabled:text-[#4d4d4d] transition-colors shrink-0"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-[20px] h-[20px]"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentPanel;
