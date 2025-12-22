import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
})
export class User {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
  })
  username: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
  })
  phone: string;

  @Prop({
    required: true,
    minlength: 6,
  })
  password: string;

  @Prop({
    default: 'user',
    enum: ['user', 'admin'],
  })
  role: string;

  @Prop({
    default: true,
  })
  isActive: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
