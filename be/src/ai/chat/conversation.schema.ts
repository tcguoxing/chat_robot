import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({
  timestamps: true,
})
export class Conversation {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop()
  title?: string;

  @Prop()
  summary?: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
