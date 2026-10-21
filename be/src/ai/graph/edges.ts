import { AIMessage } from '@langchain/core/messages';
import { END } from '@langchain/langgraph';
import { AgentState } from './state';

export const NODE_TOOLS = 'tools';
export const NODE_LIMIT = 'limit';

export type AgentRoute = typeof NODE_TOOLS | typeof NODE_LIMIT | typeof END;

/**
 * agent 节点之后的条件边：
 * - 没有 tool_calls → 结束
 * - 还有 tool_calls 但已达步数上限 → limit
 * - 否则 → tools
 */
export const routeAfterAgent = (state: AgentState): AgentRoute => {
  const lastMessage = state.messages[state.messages.length - 1];
  const toolCalls =
    lastMessage && lastMessage.getType() === 'ai'
      ? ((lastMessage as AIMessage).tool_calls ?? [])
      : [];

  if (toolCalls.length === 0) return END;
  if (state.stepCount >= state.maxSteps) return NODE_LIMIT;
  return NODE_TOOLS;
};

/** 条件边的路径映射，显式声明 agent 之后可能去的节点 */
export const AGENT_ROUTE_MAP = {
  [NODE_TOOLS]: NODE_TOOLS,
  [NODE_LIMIT]: NODE_LIMIT,
  [END]: END,
} as const;
