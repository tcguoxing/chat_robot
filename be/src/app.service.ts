import { Injectable } from '@nestjs/common';
import { ADMIN_USER } from './ai/graph/state';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'chat_robot',
      mode: 'single-user',
      // 去掉登录后，系统只有一个内置用户，角色固定为 admin
      user: { ...ADMIN_USER },
      graph: {
        framework: 'langgraph',
        nodes: ['prepare', 'agent', 'tools', 'limit'],
        checkpointer: 'mongodb',
      },
    };
  }
}
