import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatMessageDocument = ChatMessage & Document;

@Schema({
  timestamps: true,
})
export class ChatMessage {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversationId: Types.ObjectId;

  @Prop({ enum: ['system', 'user', 'assistant', 'tool'], required: true })
  role: string;

  @Prop({ required: true })
  content: string;

  @Prop()
  toolName?: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
