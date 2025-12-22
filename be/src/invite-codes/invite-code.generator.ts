import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { InviteCodeService } from './invite-code.service';

async function generateInviteCodes() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const inviteCodeService = app.get(InviteCodeService);

  try {
    console.log('开始生成邀请码...');
    const codes = await inviteCodeService.generateInviteCodes(20);
    console.log(`成功生成 ${codes.length} 个邀请码：`);
    codes.forEach((code, index) => {
      console.log(`${index + 1}. ${code.code}`);
    });

    const stats = await inviteCodeService.getInviteCodeStats();
    console.log('\n邀请码统计信息：');
    console.log(`总数量：${stats.total}`);
    console.log(`已使用：${stats.used}`);
    console.log(`未使用：${stats.unused}`);
  } catch (error) {
    console.error('生成邀请码失败：', error.message);
  } finally {
    await app.close();
  }
}

generateInviteCodes();
