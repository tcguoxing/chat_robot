import { Controller, Post, Get, Query, UseGuards } from '@nestjs/common';

import { AiService } from './ai.service';
import { log } from 'console';
import { AuthGuard } from '../auth/auth.guard';

@Controller()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @UseGuards(AuthGuard)
  @Get('search')
  searchInfo(@Query() query): string {
    const { info } = query;
    return this.aiService.searchInfo(info);
  }
}
