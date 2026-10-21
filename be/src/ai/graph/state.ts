import { Annotation, messagesStateReducer } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';

/**
 * 系统里只有一个内置用户，角色固定为 admin。
 * 去掉登录之后，所有请求都以这个身份进入图。
 */
export const ADMIN_USER = {
  id: 'admin',
  username: 'admin',
  role: 'admin',
} as const;

export type AdminUser = {
  id: string;
  username: string;
  role: 'admin';
};

/** 单轮对话内允许的最大「模型推理步数」，防止工具调用死循环 */
export const DEFAULT_MAX_STEPS = Number(process.env.AGENT_MAX_STEPS ?? 8) || 8;

/**
 * LangGraph 图的状态定义。
 *
 * - messages：对话消息历史，由 checkpointer 按 thread_id 持久化（短期记忆）
 * - user：当前用户（单用户模式，固定 admin）
 * - stepCount / toolCallCount：本次运行的推理步数与工具调用次数，用于限流/防失控
 * - maxSteps：本次运行允许的最大推理步数（由 prepare 节点每次运行重置）
 */
export const AgentStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  user: Annotation<AdminUser>({
    reducer: (_prev, next) => next,
    default: () => ({ ...ADMIN_USER }),
  }),
  stepCount: Annotation<number>({
    reducer: (_prev, next) => next,
    default: () => 0,
  }),
  toolCallCount: Annotation<number>({
    reducer: (_prev, next) => next,
    default: () => 0,
  }),
  maxSteps: Annotation<number>({
    reducer: (_prev, next) => next,
    default: () => DEFAULT_MAX_STEPS,
  }),
});

export type AgentState = typeof AgentStateAnnotation.State;
export type AgentStateUpdate = typeof AgentStateAnnotation.Update;
