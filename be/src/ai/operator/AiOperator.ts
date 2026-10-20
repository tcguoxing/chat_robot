import dotenv from 'dotenv';
import { BadGatewayException, BadRequestException } from '@nestjs/common';
import { createAIAgent, createChatAgent } from '../agents/agent';
import { buildAttachmentContent, extractTextContent } from './attachments';

dotenv.config();

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return String(error);
};

export default class AiOperator {
  private AIAgent: any;
  private chatAgent: any;

  constructor() {
    this.AIAgent = null;
    this.chatAgent = null;
  }

  async init() {
    this.AIAgent = createAIAgent();
  }

  private async initChat() {
    if (!this.chatAgent) {
      this.chatAgent = await createChatAgent();
    }
  }

  async searchInfo(askResult = '') {
    if (askResult === '' || askResult === null || askResult === undefined) {
      throw new BadRequestException('请输入您的问题内容');
    }
    if (!this.AIAgent) await this.init();
    if (!this.AIAgent)
      return 'Error: AI Agent is not available. Please check MODEL_API_KEY.';

    let result: any;
    try {
      result = await this.AIAgent.invoke({
        messages: [{ role: 'user', content: `${askResult}` }],
      });
    } catch (error) {
      throw new BadGatewayException(`AI 服务调用失败：${toErrorMessage(error)}`);
    }

    const messages: any[] = result?.messages ?? [];
    const lastMessage = messages[messages.length - 1];

    return {
      content: extractTextContent(lastMessage?.content),
      tokenUsage: lastMessage?.usage_metadata ?? null,
    };
  }

  async chat(
    askResult = '',
    sessionId = 'default',
    files: Array<Express.Multer.File> = [],
  ) {
    const question = (askResult ?? '').trim();

    if (!question && (!files || files.length === 0)) {
      throw new BadRequestException('请输入您的问题内容或上传文件');
    }

    // 先把附件转换成模型可消费的内容；不支持的格式在这里直接返回 400，
    // 避免把整个请求带到模型侧才报错。
    const { textContent, imageParts } = buildAttachmentContent(files ?? []);

    await this.initChat();
    if (!this.chatAgent)
      return 'Error: AI Agent is not available. Please check MODEL_API_KEY.';

    // 纯文本直接作为字符串 content；带图片时使用 OpenAI 兼容的多模态数组
    const combinedText = [question, textContent].filter(Boolean).join('\n\n');
    const content: any =
      imageParts.length === 0
        ? combinedText
        : [
            { type: 'text', text: combinedText || '请描述这些图片的内容' },
            ...imageParts,
          ];

    let result: any;
    try {
      result = await this.chatAgent.invoke(
        { messages: [{ role: 'user', content }] },
        { configurable: { thread_id: sessionId } },
      );
    } catch (error) {
      throw new BadGatewayException(`AI 服务调用失败：${toErrorMessage(error)}`);
    }

    const messages: any[] = result?.messages ?? [];
    const lastMessage = messages[messages.length - 1];

    return {
      content: extractTextContent(lastMessage?.content),
      tokenUsage: lastMessage?.usage_metadata ?? null,
    };
  }
}
