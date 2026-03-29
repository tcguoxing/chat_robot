import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from '../../auth/auth.guard';
import { Types } from 'mongoose';

@Controller('ai')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(AuthGuard)
  @Post('conversations')
  async createConversation(@Req() req: any, @Body() body: { title?: string }) {
    const userId: Types.ObjectId | undefined = req?.user?._id;
    const conv = await this.chatService.createConversation(userId, body?.title);
    return { id: conv._id.toString() };
  }

  @UseGuards(AuthGuard)
  @Get('conversations/:id/messages')
  async getMessages(@Param('id') id: string) {
    const msgs = await this.chatService.getMessages(id);
    return msgs.map((m: any) => ({
      id: m._id.toString(),
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    }));
  }

  @UseGuards(AuthGuard)
  @Post('conversations/:id/messages')
  async sendMessage(@Req() req: any, @Param('id') id: string, @Body() body: { content: string }) {
    const userId: Types.ObjectId | undefined = req?.user?._id;
    const res = await this.chatService.sendMessage(id, userId, body.content);
    return res;
  }
}
