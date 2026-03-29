import dotenv from 'dotenv';
import { log } from 'console';
import { createKimiAgent, createChatAgent } from '../agents/kimi';

dotenv.config();

export default class AiOperator {
  private kimiAgent: any;
  private chatAgent: any;

  constructor() {
    this.kimiAgent = null;
    this.chatAgent = null;
  }

  async init() {
    this.kimiAgent = createKimiAgent();
  }

  private async initChat() {
    if (!this.chatAgent) {
      this.chatAgent = await createChatAgent();
    }
  }

  async searchInfo(askResult = '') {
    log('askResult: ', askResult);
    if (askResult === '' || askResult === null || askResult === undefined) {
      throw new Error('请输入您的问题内容');
    }
    if (!this.kimiAgent) await this.init();
    if (!this.kimiAgent)
      return 'Error: Kimi Agent is not available. Please check MOONSHOT_API_KEY.';

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

  async chat(askResult = '', sessionId = 'default') {
    log('askResult: ', askResult);
    if (askResult === '' || askResult === null || askResult === undefined) {
      throw new Error('请输入您的问题内容');
    }
    await this.initChat();
    if (!this.chatAgent)
      return 'Error: Kimi Agent is not available. Please check MOONSHOT_API_KEY.';

    const result = await this.chatAgent.invoke(
      { messages: [{ role: 'user', content: `${askResult}` }] },
      { configurable: { thread_id: sessionId } },
    );

    let tokenUsage = null;
    if ((result as any).messages && (result as any).messages.length > 0) {
      const lastMessage = (result as any).messages[(result as any).messages.length - 1];
      if (lastMessage.usage_metadata) {
        tokenUsage = lastMessage.usage_metadata;
      }
    }

    return {
      content: (result as any).messages[(result as any).messages.length - 1].content,
      tokenUsage: tokenUsage,
    };
  }
}
