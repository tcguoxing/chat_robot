import { ChatOpenAI } from '@langchain/openai';
import { createAgent } from 'langchain';
import { Tool } from '@langchain/core/tools';
import { searchTool } from '../tools/index';

export const createKimiAgent = () => {
  // Check for API Key
  // User mentioned DASHSCOPE_API_KEY is required for Qwen usually.
  const apiKey = process.env.MOONSHOT_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn(
      'MOONSHOT_API_KEY (or OPENAI_API_KEY) is missing. Kimi agent will be disabled.',
    );
    return {
      invoke: async () => ({
        messages: [
          { content: 'Error: Missing MOONSHOT_API_KEY for Kimi Agent.' },
        ],
      }),
    };
  }

  // console.log('You are using kimi agent.')

  // 初始化 Qwen 模型（通过 DashScope 兼容接口）
  const kimiModel = new ChatOpenAI({
    modelName: 'kimi-k2.5', // 实际模型名称请参考 DashScope 文档
    temperature: 0.6, // todo ?
    configuration: {
      baseURL: process.env.MOONSHOT_BASE_URL || 'https://api.moonshot.cn/v1',
    },
    apiKey: apiKey,
    modelKwargs: {
      thinking: {
        type: 'disabled'
      }
    },
  });

  // 定义工具列表
  const tools: Tool[] = [searchTool as any];

  // 创建 Agent
  return createAgent({
    model: kimiModel,
    tools,
  });
};
