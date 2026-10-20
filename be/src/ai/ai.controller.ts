import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

import { AiService } from './ai.service';
import { AuthGuard } from '../auth/auth.guard';

/** 单个附件大小上限：10MB */
const MAX_FILE_SIZE = 10 * 1024 * 1024;
/** 单次请求附件数量上限 */
const MAX_FILES = 50;

@Controller()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @UseGuards(AuthGuard)
  @Get('search')
  searchInfo(@Query() query): string {
    const { info } = query;
    return this.aiService.searchInfo(info);
  }

  @UseGuards(AuthGuard)
  @Post('chat')
  @UseInterceptors(
    FilesInterceptor('files', MAX_FILES, {
      limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
    }),
  )
  chat(
    @Body('info') info: string,
    @Body('sessionId') sessionId: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.aiService.chat(info, sessionId, files);
  }
}
