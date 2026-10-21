import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

/**
 * e2e 需要本地/远程 MongoDB（LangGraph checkpoint 依赖它）。
 * 没有数据库时只跑单元测试（pnpm test）。
 */
describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    // 注意：e2e 里没有注册 main.ts 的全局 ResponseInterceptor，
    // 所以这里拿到的是控制器原始返回值。
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((res) => {
        expect(res.body.mode).toBe('single-user');
        expect(res.body.user.role).toBe('admin');
        expect(res.body.graph.framework).toBe('langgraph');
      });
  });
});
