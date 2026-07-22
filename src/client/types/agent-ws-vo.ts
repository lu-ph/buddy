export type ClientToServerMessage = 
  | WSChatMessageRequest

export interface WSChatMessageRequest {
  type: "chat";
  content: string;
  chatId?: string;
}

export type ServerToClientMessage =
  | AgentTextResponse 
  | AgentToolResponse 
  | AgentFinalResult

interface AgentTextResponse {
  type: "agent_text_response";
  content: string;
}

interface AgentToolResponse {
  type: "agent_tool_response";
  toolName: string;
  toolInput: string;
  // toolOutput: string;
  toolId: string;
}

interface AgentFinalResult {
  type: "agent_final_result";
  success: boolean;
  cost: string;
  duration: string;
}
