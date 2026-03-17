import {
  Controller,
  Post,
  Get,
  Query
} from '@nestjs/common';

import { AiService } from './ai.service';
import { log } from 'console';

@Controller()
export class AiController {
  constructor(private readonly aiService:AiService){}

  @Get('search')
  searchInfo(@Query() query): string {
    const {info} = query
    return this.aiService.searchInfo(info)
  }
}
