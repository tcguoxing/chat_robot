import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

import { AiService } from './ai.service';

/** 单个附件大小上限：10MB */
const MAX_FILE_SIZE = 10 * 1024 * 1024;
/** 单次请求附件数量上限 */
const MAX_FILES = 50;

/**
 * 单用户模式，没有登录/鉴权：
 * 所有请求默认以 admin 身份进入 LangGraph。
 */
@Controller()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /** 单轮问答（不进会话记忆） */
  @Get('search')
  searchInfo(@Query() query): Promise<any> {
    const { info } = query;
    return this.aiService.searchInfo(info);
  }

  /** 多轮对话：同一 sessionId 复用同一 thread_id，历史由 checkpoint 保存 */
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
