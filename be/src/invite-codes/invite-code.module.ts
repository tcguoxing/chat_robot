import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InviteCode, InviteCodeSchema } from './invite-code.schema';
import { InviteCodeService } from './invite-code.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InviteCode.name, schema: InviteCodeSchema },
    ]),
  ],
  providers: [InviteCodeService],
  exports: [InviteCodeService],
})
export class InviteCodeModule {}
