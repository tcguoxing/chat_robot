import { Injectable } from '@nestjs/common';
import AiOperator from './operator/AiOperator';

// todo 缺少app引入以及权限证明；

@Injectable()
export class AiService {
  private aiOperator: any;
  constructor() {
    this.aiOperator = new AiOperator();
  }

  searchInfo(info) {
    return this.aiOperator.searchInfo(info);
  }

  chat(info, sessionId?: string) {
    return this.aiOperator.chat(info, sessionId);
  }
}
