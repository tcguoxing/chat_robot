import { Controller, Get } from '@nestjs/common';
import { CryptoService } from '../crypto/crypto.service';
import { Logger } from '@nestjs/common';

/**
 * 认证控制器
 * 处理认证相关的HTTP请求
 */
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly cryptoService: CryptoService) {}

  /**
   * 获取RSA公钥接口
   * @description 返回当前有效的RSA公钥，用于前端密码加密
   * @returns RSA公钥字符串和时间戳
   */
  @Get('public-key')
  getPublicKey() {
    const publicKey = this.cryptoService.getPublicKey();
    const timestamp = Date.now();

    this.logger.log('Public key requested, timestamp: ' + timestamp);

    return {
      publicKey,
      timestamp,
      nonce: Math.random().toString(36).substring(2, 15),
    };
  }
}
