import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** 服务信息：单用户模式、内置 admin、LangGraph 节点列表 */
  @Get()
  getInfo() {
    return this.appService.getInfo();
  }
}
