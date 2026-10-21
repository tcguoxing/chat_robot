import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // 用 forRootAsync + ConfigService 读取配置：
    // 避免模块文件在 dotenv 加载之前就读取 process.env（否则 .env 里的
    // MONGODB_URI 拿不到，只能靠命令行环境变量）。
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
        ...(config.get<string>('authSource')
          ? { authSource: config.get<string>('authSource') }
          : {}),
        ...(config.get<string>('user')
          ? { user: config.get<string>('user') }
          : {}),
        ...(config.get<string>('pass')
          ? { pass: config.get<string>('pass') }
          : {}),
      }),
    }),
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
