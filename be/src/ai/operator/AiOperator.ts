import dotenv from "dotenv";
import { log } from "console";
import {createKimiAgent} from '../agents/kimi'

dotenv.config();

export default class AiOperator {
  private kimiAgent: any

  constructor() {
    this.kimiAgent = null;
  }

  async init() {
    this.kimiAgent = createKimiAgent()
  }

  async searchInfo(askResult="") {
    log('askResult: ', askResult)
    if (!this.kimiAgent) await this.init();
    if (!this.kimiAgent) return "Error: Kimi Agent is not available. Please check ANTHROPIC_API_KEY.";

    const result = await this.kimiAgent.invoke({
      messages: [{ role: 'user', content: `${askResult}` }],
    });
    
    // 从最后一个消息的元数据中提取 token 使用情况（如果是 AIMessage）
    let tokenUsage = null;
    if (result.messages && result.messages.length > 0) {
      const lastMessage = result.messages[result.messages.length - 1];
      if (lastMessage.usage_metadata) {
        tokenUsage = lastMessage.usage_metadata;
      }
    }
    
    return {
      content: result.messages[result.messages.length - 1].content,
      tokenUsage: tokenUsage,
    };
  }
}
