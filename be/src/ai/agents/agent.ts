import { ChatOpenAI } from '@langchain/openai';
import { createAgent } from 'langchain';
import { Tool } from '@langchain/core/tools';
import { searchTool } from '../tools/index';
import { StateGraph, START, MessagesAnnotation } from '@langchain/langgraph';
import { MongoDBSaver } from '@langchain/langgraph-checkpoint-mongodb';
import { MongoClient } from 'mongodb';
import { AIMessage, HumanMessage, BaseMessage } from '@langchain/core/messages';
import mongoose from 'mongoose';

export const createAIAgent = () => {
  // Check for API Key
  // User mentioned DASHSCOPE_API_KEY is required for Qwen usually.
  const apiKey = process.env.MODEL_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn(
      'MODEL_API_KEY (or OPENAI_API_KEY) is missing. AI agent will be disabled.',
    );
    return {
      invoke: async () => ({
        messages: [
          { content: 'Error: Missing MODEL_API_KEY for AI Agent.' },
        ],
      }),
    };
  }

  // console.log('You are using AI agent.')

  // 初始化 Qwen 模型（通过 DashScope 兼容接口）
  const AIModel = new ChatOpenAI({
    modelName: process.env.MODEL_NAME, // 实际模型名称请参考 DashScope 文档
    temperature: Number(process.env.MODEL_TEMPERATURE), // todo ?
    configuration: {
      baseURL: process.env.MODEL_BASE_URL,
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
    model: AIModel,
    tools,
  });
};

export const createChatAgent = async () => {
  const apiKey = process.env.MODEL_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      invoke: async () => ({
        messages: [{ content: 'Error: Missing MODEL_API_KEY for AI Agent.' }],
      }),
    };
  }
  const AIModel = new ChatOpenAI({
    modelName: process.env.MODEL_NAME,
    temperature: 0.6,
    configuration: {
      baseURL: process.env.MODEL_BASE_URL || 'https://api.moonshot.cn/v1',
    },
    apiKey: apiKey,
    modelKwargs: {
      thinking: {
        type: 'disabled',
      },
    },
  });
  let client: MongoClient;
  const conn: any = mongoose.connection as any;
  if (conn && typeof conn.getClient === 'function' && conn.readyState === 1) {
    client = conn.getClient();
  } else {
    const uri = process.env.MONGODB_URI as string;
    const username = process.env.user;
    const password = process.env.pass;
    const authSource = process.env.authSource || 'admin';
    const tmp = new MongoClient(
      uri,
      username && password
        ? {
            auth: { username, password },
            authSource,
          }
        : {},
    );
    await tmp.connect();
    client = tmp;
  }
  const dbName =
    process.env.DB_NAME ||
    ((mongoose.connection as any)?.db?.databaseName as string) ||
    'chat_robot';
  const checkpointer = new MongoDBSaver({
    client,
    dbName,
    checkpointCollectionName: 'agent_checkpoints',
    checkpointWritesCollectionName: 'agent_checkpoints_writes',
  });
  const toBaseMessages = (msgs: Array<any>): BaseMessage[] => {
    return msgs.map((m) => {
      if (m && typeof m._getType === 'function') return m as BaseMessage;
      if (m.role === 'assistant') return new AIMessage({ content: m.content });
      return new HumanMessage({ content: m.content });
    });
  };
  const workflow = new StateGraph(MessagesAnnotation)
    .addNode('agent', async (state) => {
      const response = await AIModel.invoke(toBaseMessages(state.messages as any[]));
      return { messages: [response] };
    })
    .addEdge(START, 'agent');
  const app = workflow.compile({ checkpointer });
  return app;
};
