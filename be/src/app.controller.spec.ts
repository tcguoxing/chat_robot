import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('返回单用户模式与 admin 角色信息', () => {
      const info = appController.getInfo();

      expect(info.mode).toBe('single-user');
      expect(info.user.role).toBe('admin');
      expect(info.graph.framework).toBe('langgraph');
      expect(info.graph.nodes).toEqual(
        expect.arrayContaining(['agent', 'tools']),
      );
    });
  });
});
