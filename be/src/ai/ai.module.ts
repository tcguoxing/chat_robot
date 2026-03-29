import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ChatController } from './chat/chat.controller';
import { ChatService } from './chat/chat.service';
import { Conversation, ConversationSchema } from './chat/conversation.schema';
import { ChatMessage, ChatMessageSchema } from './chat/message.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
    ]),
  ],
  controllers: [AiController, ChatController],
  providers: [AiService, ChatService],
})
export class AiModule {}
