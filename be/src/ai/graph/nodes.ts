import { AIMessage, BaseMessage, SystemMessage, HumanMessage } from '@langchain/core/messages';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { ADMIN_USER, AgentState, AgentStateUpdate } from './state';
import { SYSTEM_PROMPT } from './prompts';

/**
 * 图节点里只依赖最小接口，方便在测试中注入假模型，
 * 不需要真的请求外部 API。
 */
export interface ChatModelLike {
  invoke(messages: BaseMessage[], options?: unknown): Promise<AIMessage>;
}

/**
 * prepare 节点：每次运行开始时复位运行时状态。
 * 有 checkpointer 时 state 会跨请求保留，因此计数器必须显式清零。
 */
export const createPrepareNode =
  (maxSteps: number) =>
  (): AgentStateUpdate => ({
    user: { ...ADMIN_USER },
    stepCount: 0,
    toolCallCount: 0,
    maxSteps,
  });

/**
 * agent 节点：调用模型。
 * system prompt 不写入消息历史，而是每次调用时临时拼在最前面，
 * 避免 checkpoint 里堆积重复的 system message。
 */
export const createAgentNode =
  (model: ChatModelLike) =>
  async (state: AgentState): Promise<AgentStateUpdate> => {
    const history = state.messages.filter(
      (message) => message.getType() !== 'system',
    );
    const response = await model.invoke([new SystemMessage(SYSTEM_PROMPT), ...history]);

    return {
      messages: [response],
      stepCount: state.stepCount + 1,
    };
  };

/**
 * tools 节点：执行上一条 AIMessage 里的 tool_calls，并把 ToolMessage 写回 state。
 * 工具执行失败不会中断图，错误会作为 ToolMessage 回灌给模型自行修正。
 */
export const createToolsNode = (tools: any[]) => {
  const toolNode = new ToolNode(tools);

  return async (state: AgentState): Promise<AgentStateUpdate> => {
    const result: any = await toolNode.invoke({ messages: state.messages });
    const toolMessages: BaseMessage[] = result?.messages ?? [];

    return {
      messages: toolMessages,
      toolCallCount: state.toolCallCount + toolMessages.length,
    };
  };
};

/**
 * limit 节点：达到单轮最大推理步数时的兜底出口，
 * 避免模型反复调用工具把 token 烧光。
 */
export const createLimitNode =
  () =>
  (state: AgentState): AgentStateUpdate => ({
    messages: [
      new AIMessage({
        content:
          `已达到单轮最大推理步数（${state.maxSteps} 步），已停止继续调用工具。` +
          '请把问题拆小一些，或换一种问法后重试。',
      }),
    ],
  });
