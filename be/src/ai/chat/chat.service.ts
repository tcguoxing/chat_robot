import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from './conversation.schema';
import { ChatMessage, ChatMessageDocument } from './message.schema';
import AiOperator from '../operator/AiOperator';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(ChatMessage.name)
    private messageModel: Model<ChatMessageDocument>,
  ) {}

  private async getOperator() {
    const op = new AiOperator();
    await op.init();
    return op;
  }

  async createConversation(userId?: Types.ObjectId, title?: string) {
    const doc = new this.conversationModel({ userId, title });
    return doc.save();
  }

  async getMessages(conversationId: string) {
    const cid = new Types.ObjectId(conversationId);
    return this.messageModel
      .find({ conversationId: cid })
      .sort({ createdAt: 1 })
      .lean()
      .exec();
  }

  async sendMessage(conversationId: string, userId: Types.ObjectId | undefined, content: string) {
    const cid = new Types.ObjectId(conversationId);
    const conv = await this.conversationModel.findById(cid).exec();
    if (!conv) {
      throw new Error('会话不存在');
    }
    const userMsg = new this.messageModel({
      conversationId: cid,
      role: 'user',
      content,
    });
    await userMsg.save();

    const recent = await this.messageModel
      .find({ conversationId: cid })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()
      .exec();
    const messages = recent.reverse().map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const operator = await this.getOperator();
    const result = await operator.chat(messages);
    const replyContent =
      Array.isArray(result?.content)
        ? result.content.map((c: any) => (typeof c === 'string' ? c : c.text || '')).join('\n')
        : result?.content || '';

    const aiMsg = new this.messageModel({
      conversationId: cid,
      role: 'assistant',
      content: replyContent,
    });
    await aiMsg.save();

    await this.conversationModel.findByIdAndUpdate(cid, { updatedAt: new Date() }).exec();
    return { content: replyContent, tokenUsage: result?.tokenUsage };
  }
}
