import { BaseCheckpointSaver, END, START, StateGraph } from '@langchain/langgraph';
import { AgentStateAnnotation } from './state';
import { ChatModelLike, createAgentNode, createLimitNode, createPrepareNode, createToolsNode } from './nodes';
import { AGENT_ROUTE_MAP, NODE_LIMIT, NODE_TOOLS, routeAfterAgent } from './edges';

export const GRAPH_NODE = {
  prepare: 'prepare',
  agent: 'agent',
  tools: NODE_TOOLS,
  limit: NODE_LIMIT,
} as const;

export interface BuildChatGraphOptions {
  /** 已经 bindTools 过的模型（或测试里的假模型） */
  model: ChatModelLike;
  /** 可被模型调用的工具 */
  tools?: any[];
  /** LangGraph checkpointer：负责按 thread_id 持久化消息历史 */
  checkpointer?: BaseCheckpointSaver;
  /** 单轮最大推理步数 */
  maxSteps?: number;
}

/**
 * 构建聊天图：
 *
 *        START
 *          │
 *          ▼
 *       prepare         复位运行时状态（admin 用户 / 计数器 / 步数上限）
 *          │
 *          ▼
 *        agent ◀──────────────┐
 *          │                  │
 *          ├── tool_calls ──▶ tools
 *          │                  │
 *          ├── 达到步数上限 ──▶ limit ──▶ END
 *          │
 *          └── 无工具调用 ──▶ END
 */
export const buildChatGraph = ({
  model,
  tools = [],
  checkpointer,
  maxSteps = 8,
}: BuildChatGraphOptions) => {
  const workflow = new StateGraph(AgentStateAnnotation)
    .addNode(GRAPH_NODE.prepare, createPrepareNode(maxSteps))
    .addNode(GRAPH_NODE.agent, createAgentNode(model))
    .addNode(GRAPH_NODE.tools, createToolsNode(tools))
    .addNode(GRAPH_NODE.limit, createLimitNode())
    .addEdge(START, GRAPH_NODE.prepare)
    .addEdge(GRAPH_NODE.prepare, GRAPH_NODE.agent)
    .addConditionalEdges(GRAPH_NODE.agent, routeAfterAgent, AGENT_ROUTE_MAP)
    .addEdge(GRAPH_NODE.tools, GRAPH_NODE.agent)
    .addEdge(GRAPH_NODE.limit, END);

  return checkpointer ? workflow.compile({ checkpointer }) : workflow.compile();
};

export type ChatGraph = ReturnType<typeof buildChatGraph>;
