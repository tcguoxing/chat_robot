import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/filters/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 启用CORS
  app.enableCors();

  // 全局响应拦截器
  app.useGlobalInterceptors(new ResponseInterceptor());

  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger文档配置
  const config = new DocumentBuilder()
    .setTitle('AI 聊天机器人 API')
    .setDescription(
      '单用户（admin）AI 聊天服务，无登录鉴权；agent 循环由 LangGraph 编排',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // 监听端口
  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `应用已启动，访问地址：http://localhost:${process.env.PORT ?? 3000}`,
  );
  console.log(
    `Swagger文档地址：http://localhost:${process.env.PORT ?? 3000}/api`,
  );
}
bootstrap();
