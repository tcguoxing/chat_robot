import { Module } from '@nestjs/common';
import { CryptoService } from './crypto.service';

/**
 * 加密模块
 * 提供RSA密钥管理和加密解密服务
 */
@Module({
  providers: [CryptoService],
  exports: [CryptoService],
})
export class CryptoModule {}
