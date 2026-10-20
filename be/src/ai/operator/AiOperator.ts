import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { HumanMessage } from '@langchain/core/messages';
import { randomUUID } from 'crypto';
import { ChatGraph, buildChatGraph } from '../graph/graph';
import { getMongoCheckpointer } from '../graph/checkpointer';
import { createChatModel } from '../model';
import { createTools } from '../tools';
import { buildAttachmentContent, extractTextContent } from './attachments';

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return String(error);
};

/**
 * AI 编排层：
 * 只负责把输入变成图的状态、调用图、把结果整理成 HTTP 友好的结构。
 * 真正的 agent 循环（模型 → 工具 → 模型）全部由 LangGraph 图完成。
 */
@Injectable()
export default class AiOperator {
  private graphPromise: Promise<ChatGraph> | null = null;

  private async getGraph(): Promise<ChatGraph> {
    if (!this.graphPromise) {
      this.graphPromise = (async () => {
        const tools = createTools();
        const model = createChatModel();
        // 工具绑定属于「模型能力」，循环与分支交给图
        const boundModel = tools.length > 0 ? (model.bindTools(tools) as any) : model;
        const checkpointer = await getMongoCheckpointer();

        return buildChatGraph({
          model: boundModel,
          tools,
          checkpointer,
          maxSteps: Number(process.env.AGENT_MAX_STEPS ?? 8) || 8,
        });
      })().catch((error) => {
        // 初始化失败（比如没配 API Key）时清空缓存，修好配置后无需重启即可重试
        this.graphPromise = null;
        throw error;
      });
    }

    return this.graphPromise;
  }

  /**
   * 单轮问答（不落会话记忆）：/search 使用随机 thread_id。
   */
  async searchInfo(askResult = '') {
    if (!askResult) {
      throw new BadRequestException('请输入您的问题内容');
    }

    const graph = await this.getGraph();
    const result = await this.runGraph(graph, askResult, `search-${randomUUID()}`);

    return {
      content: result.content,
      tokenUsage: result.tokenUsage,
      steps: result.steps,
      toolCalls: result.toolCalls,
    };
  }

  /**
   * 多轮对话：同一个 sessionId 复用同一个 thread_id，
   * 消息历史由 MongoDB checkpointer 负责保存。
   */
  async chat(
    askResult = '',
    sessionId = 'default',
    files: Array<Express.Multer.File> = [],
  ) {
    const question = (askResult ?? '').trim();

    if (!question && (!files || files.length === 0)) {
      throw new BadRequestException('请输入您的问题内容或上传文件');
    }

    // 附件在进入图之前转换成模型可消费的内容；
    // 不支持的格式直接 400，避免带着无意义文件去调用模型。
    const { textContent, imageParts } = buildAttachmentContent(files ?? []);
    const combinedText = [question, textContent].filter(Boolean).join('\n\n');

    const content: any =
      imageParts.length === 0
        ? combinedText
        : [
            { type: 'text', text: combinedText || '请描述这些图片的内容' },
            ...imageParts,
          ];

    const graph = await this.getGraph();
    const threadId = sessionId || 'default';
    const result = await this.runGraph(graph, content, threadId);

    return {
      content: result.content,
      tokenUsage: result.tokenUsage,
      steps: result.steps,
      toolCalls: result.toolCalls,
      threadId,
      user: result.user,
    };
  }

  private async runGraph(graph: ChatGraph, content: any, threadId: string) {
    let result: any;

    try {
      result = await graph.invoke(
        { messages: [new HumanMessage({ content })] },
        { configurable: { thread_id: threadId } },
      );
    } catch (error) {
      // 图内部抛出的 HttpException（比如没配 Key）保持原语义
      if (error instanceof HttpException) throw error;
      throw new BadGatewayException(`AI 服务调用失败：${toErrorMessage(error)}`);
    }

    const messages: any[] = result?.messages ?? [];
    const lastMessage = messages[messages.length - 1];

    return {
      content: extractTextContent(lastMessage?.content),
      tokenUsage: lastMessage?.usage_metadata ?? null,
      steps: result?.stepCount ?? 0,
      toolCalls: result?.toolCallCount ?? 0,
      user: result?.user ?? null,
      threadId,
    };
  }
}
