import dotenv from 'dotenv';
import { TavilySearch } from '@langchain/tavily';

dotenv.config();

/**
 * 工具注册表。
 *
 * 工具的 description 会作为 prompt 的一部分进入上下文，
 * 直接决定模型「什么时候调用、调用哪个工具」，不是普通注释。
 *
 * 没有配置 TAVILY_API_KEY 时不注册搜索工具，图仍然可以跑（模型直接回答）。
 */
export const createTools = (): any[] => {
  const tools: any[] = [];

  if (process.env.TAVILY_API_KEY) {
    tools.push(
      new TavilySearch({
        maxResults: 3,
        searchDepth: 'basic',
      }),
    );
  }

  return tools;
};
