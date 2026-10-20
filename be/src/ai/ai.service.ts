import { Injectable } from '@nestjs/common';
import AiOperator from './operator/AiOperator';

/**
 * AI 能力门面：控制器只依赖这一层，
 * 具体的 LangGraph 图编排由 AiOperator 负责。
 */
@Injectable()
export class AiService {
  constructor(private readonly aiOperator: AiOperator) {}

  searchInfo(info: string) {
    return this.aiOperator.searchInfo(info);
  }

  chat(info: string, sessionId?: string, files?: Array<Express.Multer.File>) {
    return this.aiOperator.chat(info, sessionId, files);
  }
}
