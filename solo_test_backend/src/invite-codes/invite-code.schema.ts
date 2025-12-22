import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InviteCodeDocument = InviteCode & Document;

@Schema({
  timestamps: true,
})
export class InviteCode {
  @Prop({
    required: true,
    unique: true,
    length: 16,
  })
  code: string;

  @Prop({
    default: false,
  })
  isUsed: boolean;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
  })
  usedBy: Types.ObjectId;

  @Prop({
    type: Date,
  })
  usedAt: Date;
}

export const InviteCodeSchema = SchemaFactory.createForClass(InviteCode);
