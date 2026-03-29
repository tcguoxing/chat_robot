import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { InviteCodeService } from './invite-code.service';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

async function generateInviteCodes() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const inviteCodeService = app.get(InviteCodeService);

  try {
    const desiredCount = Number(process.argv[2]) || 20;
    console.log('开始生成邀请码...');
    console.log(`MongoDB URI: ${process.env.MONGODB_URI}`);
    const model: any = inviteCodeService['inviteCodeModel'];
    const dbName =
      model?.db?.name || (mongoose.connection as any)?.db?.databaseName;
    const collName = model?.collection?.name;
    console.log(`Connected DB: ${dbName}, Collection: ${collName}`);

    const codes = await inviteCodeService.generateInviteCodes(desiredCount);
    console.log(`成功生成 ${codes.length} 个邀请码：`);
    codes.forEach((code, index) => {
      console.log(`${index + 1}. ${code.code}`);
    });

    const outDir = path.resolve(process.cwd(), 'invite-codes');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const filename = `invite-codes-${new Date()
      .toISOString()
      .replace(/[:.]/g, '-')}.txt`;
    const filePath = path.join(outDir, filename);
    const content = codes.map((c) => c.code).join('\n');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`\n邀请码已写入文件：${filePath}`);

    const stats = await inviteCodeService.getInviteCodeStats();
    console.log('\n邀请码统计信息：');
    console.log(`总数量：${stats.total}`);
    console.log(`已使用：${stats.used}`);
    console.log(`未使用：${stats.unused}`);

    const sample = await inviteCodeService['inviteCodeModel']
      .find({})
      .sort({ createdAt: -1 })
      .limit(Math.min(5, codes.length))
      .lean()
      .exec();
    console.log(
      `\n最近新增的 ${sample.length} 条记录(来自集合 ${inviteCodeService['inviteCodeModel']?.collection?.name}):`,
    );
    sample.forEach((doc) => {
      console.log(`- ${doc._id.toString()} ${doc.code} used=${doc.isUsed}`);
    });
  } catch (error) {
    console.error('生成邀请码失败：', error.message);
  } finally {
    await app.close();
  }
}

generateInviteCodes();
