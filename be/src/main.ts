import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/filters/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 启用CORS
  app.enableCors();

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 全局响应拦截器
  app.useGlobalInterceptors(new ResponseInterceptor());

  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger文档配置
  const config = new DocumentBuilder()
    .setTitle('用户管理系统API')
    .setDescription('用户管理系统的API文档')
    .setVersion('1.0')
    .addBearerAuth()
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
