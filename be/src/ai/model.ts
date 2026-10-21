import { ChatOpenAI } from '@langchain/openai';
import { ServiceUnavailableException } from '@nestjs/common';

export interface ModelSettings {
  apiKey: string;
  modelName: string;
  baseUrl?: string;
  temperature: number;
}

/**
 * 模型配置只从后端 .env 读取。
 * 单用户模式下去掉了登录，用户唯一需要提供的就是模型 API Key。
 */
export const readModelSettings = (): ModelSettings => {
  const apiKey = process.env.MODEL_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new ServiceUnavailableException(
      '未配置模型 API Key：请在 be/.env 中设置 MODEL_API_KEY（或 OPENAI_API_KEY）',
    );
  }

  return {
    apiKey,
    modelName: process.env.MODEL_NAME || 'gpt-4o-mini',
    baseUrl: process.env.MODEL_BASE_URL || undefined,
    temperature: Number(process.env.MODEL_TEMPERATURE ?? 0.6),
  };
};

/**
 * 创建 ChatOpenAI 客户端（OpenAI 兼容协议，可指向任意兼容服务）。
 * 注意：这里只负责「模型」这一层，agent 循环交给 LangGraph 编排。
 */
export const createChatModel = (
  settings: ModelSettings = readModelSettings(),
): ChatOpenAI =>
  new ChatOpenAI({
    model: settings.modelName,
    temperature: settings.temperature,
    apiKey: settings.apiKey,
    configuration: settings.baseUrl ? { baseURL: settings.baseUrl } : undefined,
    // thinking 是部分厂商（Kimi/Qwen 等）的私有参数，默认不发送，
    // 保证 DeepSeek / OpenAI / 其他兼容服务都能直接使用。
    // 需要关闭思考时设置 MODEL_DISABLE_THINKING=true。
    ...(process.env.MODEL_DISABLE_THINKING === 'true'
      ? { modelKwargs: { thinking: { type: 'disabled' } } }
      : {}),
  });
