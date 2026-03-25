import dotenv from 'dotenv';
import { TavilySearch } from '@langchain/tavily';
dotenv.config();

export const searchTool = new TavilySearch({
  maxResults: 3,
  searchDepth: 'basic', // 使用基础搜索深度
});
