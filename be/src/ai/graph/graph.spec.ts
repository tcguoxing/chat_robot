import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import { END, MemorySaver } from '@langchain/langgraph';
import { z } from 'zod';
import { buildChatGraph } from './graph';
import { AgentState } from './state';
import { NODE_LIMIT, NODE_TOOLS, routeAfterAgent } from './edges';

/** 假的天气工具：不联网，验证工具节点确实被执行 */
const createWeatherTool = () =>
  tool(async ({ city }: { city: string }) => `${city}今天晴，25℃`, {
    name: 'weather',
    description: '查询城市天气',
    schema: z.object({
      city: z.string().describe('城市名'),
    }),
  });

type ScriptedStep = (messages: any[], callIndex: number) => AIMessage;

/** 按脚本返回响应的假模型，记录每次收到的消息，便于断言上下文 */
const createScriptedModel = (script: ScriptedStep[]) => {
  const calls: any[][] = [];
  return {
    calls,
    invoke: async (messages: any[]) => {
      calls.push(messages);
      const callIndex = calls.length - 1;
      const step = script[Math.min(callIndex, script.length - 1)];
      return step(messages, callIndex);
    },
  };
};

const toolCallStep = (id = 'call_1'): AIMessage =>
  new AIMessage({
    content: '',
    tool_calls: [
      { name: 'weather', args: { city: '北京' }, id, type: 'tool_call' },
    ],
  });

const finalStep = (text: string): AIMessage => new AIMessage({ content: text });

const lastMessage = (result: any) =>
  result.messages[result.messages.length - 1];

describe('buildChatGraph', () => {
  it('执行 agent → tools → agent 循环，并把工具结果写回 state', async () => {
    const model = createScriptedModel([() => toolCallStep(), () => finalStep('北京今天晴，25℃。')]);
    const graph = buildChatGraph({
      model,
      tools: [createWeatherTool()],
      checkpointer: new MemorySaver(),
      maxSteps: 5,
    });

    const result = await graph.invoke(
      { messages: [new HumanMessage('北京天气怎么样？')] },
      { configurable: { thread_id: 'thread-loop' } },
    );

    // 两轮模型调用 + 一次工具执行
    expect(model.calls).toHaveLength(2);
    expect(result.stepCount).toBe(2);
    expect(result.toolCallCount).toBe(1);
    expect(lastMessage(result).content).toContain('25℃');

    // 第一次调用：system prompt + 用户消息
    expect(model.calls[0]).toHaveLength(2);
    expect(model.calls[0][1].content).toBe('北京天气怎么样？');

    // 第二次调用：system + 用户 + AI(tool_calls) + ToolMessage
    expect(model.calls[1]).toHaveLength(4);
    expect(model.calls[1][3].getType()).toBe('tool');
    expect(model.calls[1][3].content).toContain('25℃');
  });

  it('同一 thread_id 的下一轮能读到上一轮历史（checkpoint 短期记忆）', async () => {
    const model = createScriptedModel([
      () => toolCallStep(),
      () => finalStep('北京今天晴，25℃。'),
      () => finalStep('明天也晴。'),
    ]);
    const graph = buildChatGraph({
      model,
      tools: [createWeatherTool()],
      checkpointer: new MemorySaver(),
      maxSteps: 5,
    });

    await graph.invoke(
      { messages: [new HumanMessage('北京天气怎么样？')] },
      { configurable: { thread_id: 'thread-memory' } },
    );

    const second = await graph.invoke(
      { messages: [new HumanMessage('那明天呢？')] },
      { configurable: { thread_id: 'thread-memory' } },
    );

    // 第二次运行时模型看到：system + 上一轮 4 条消息 + 新的用户消息
    expect(model.calls[2]).toHaveLength(6);
    expect(lastMessage(second).content).toBe('明天也晴。');

    // 换一个 thread_id，上下文不共享
    const other = await graph.invoke(
      { messages: [new HumanMessage('你好')] },
      { configurable: { thread_id: 'thread-other' } },
    );
    expect(model.calls[3]).toHaveLength(2);
    expect(lastMessage(other)).toBeDefined();
  });

  it('达到最大推理步数时走 limit 节点，不会无限循环', async () => {
    const model = createScriptedModel([
      (_messages, callIndex) => toolCallStep(`call_${callIndex}`),
    ]);
    const graph = buildChatGraph({
      model,
      tools: [createWeatherTool()],
      maxSteps: 3,
    });

    const result = await graph.invoke({
      messages: [new HumanMessage('一直查天气')],
    });

    expect(result.stepCount).toBe(3);
    expect(
      result.messages.filter((message: any) => message.getType() === 'tool'),
    ).toHaveLength(2);
    expect(lastMessage(result).content).toContain('最大推理步数');
    // 模型不会再被调用第 4 次
    expect(model.calls).toHaveLength(3);
  });
});

describe('routeAfterAgent', () => {
  const stateOf = (messages: any[], stepCount = 1, maxSteps = 8) =>
    ({ messages, stepCount, maxSteps }) as AgentState;

  it('没有 tool_calls 时直接结束', () => {
    expect(routeAfterAgent(stateOf([new AIMessage({ content: '答案' })]))).toBe(
      END,
    );
  });

  it('有 tool_calls 且未到上限时进入 tools', () => {
    expect(routeAfterAgent(stateOf([toolCallStep()], 1, 8))).toBe(NODE_TOOLS);
  });

  it('有 tool_calls 但达到上限时进入 limit', () => {
    expect(routeAfterAgent(stateOf([toolCallStep()], 8, 8))).toBe(NODE_LIMIT);
  });
});
