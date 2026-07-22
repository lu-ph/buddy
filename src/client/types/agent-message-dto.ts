/**
 * Output for every steps
 */
export interface AgentStep {
  /**
   *  turn number
   */
  turn: number;

  /**
   *  thought text for this step
   */
  thought: string;

  /**
   * invoked tools
   */
  toolCalls: Array<{
    id: string;
    name: string;
    arguments: Record<string, any>; // input arguments
  }>;

  /**
   * tool response
   */
  observations: Array<{
    tool_use_id: string;
    output: string;
    isError: boolean;
  }>;
}

/**
 * final result for current turn
 */
export interface AgentExecutionResult {
  finalAnswer: string;
  totalTurns: number;
  steps: AgentStep[];
}
