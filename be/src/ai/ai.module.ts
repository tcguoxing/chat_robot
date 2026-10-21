import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import AiOperator from './operator/AiOperator';

@Module({
  imports: [],
  controllers: [AiController],
  providers: [AiService, AiOperator],
  exports: [AiService],
})
export class AiModule {}
