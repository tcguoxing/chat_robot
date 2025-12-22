import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * RSA密钥对接口
 */
export interface RsaKeyPair {
  publicKey: string;
  privateKey: string;
  createdAt: number;
}

/**
 * 加密服务
 * 处理RSA密钥生成、存储和加密解密操作
 */
@Injectable()
export class CryptoService {
  private keyPair: RsaKeyPair;
  private readonly KEY_ROTATION_INTERVAL = 24 * 60 * 60 * 1000; // 24小时
  private readonly logger = new Logger(CryptoService.name);

  constructor() {
    // 初始化生成RSA密钥对
    this.generateKeyPair();
    // 设置密钥轮换定时器
    this.setupKeyRotation();
  }

  /**
   * 生成RSA密钥对
   */
  private generateKeyPair(): void {
    this.logger.log('Generating new RSA key pair...');

    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'pkcs1',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
        cipher: 'aes-256-cbc',
        passphrase: 'default-passphrase',
      },
    });

    this.keyPair = {
      publicKey,
      privateKey,
      createdAt: Date.now(),
    };

    this.logger.log('RSA key pair generated successfully');
  }

  /**
   * 设置密钥轮换定时器
   */
  private setupKeyRotation(): void {
    setInterval(() => {
      this.logger.log('Scheduled RSA key pair rotation...');
      this.generateKeyPair();
    }, this.KEY_ROTATION_INTERVAL);
  }

  /**
   * 获取当前RSA公钥
   * @returns RSA公钥字符串
   */
  getPublicKey(): string {
    return this.keyPair.publicKey;
  }

  /**
   * 使用RSA私钥解密数据
   * @param encryptedData 加密的数据
   * @returns 解密后的明文数据
   */
  decrypt(encryptedData: string): string {
    try {
      this.logger.debug('Decrypting RSA encrypted data...');

      const buffer = Buffer.from(encryptedData, 'base64');
      const decrypted = crypto.privateDecrypt(
        {
          key: this.keyPair.privateKey,
          passphrase: 'default-passphrase',
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        buffer,
      );

      this.logger.debug('RSA decryption successful');
      return decrypted.toString('utf8');
    } catch (error) {
      this.logger.error('RSA decryption failed:', error.message);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * 验证数据签名
   * @param data 原始数据
   * @param signature 签名数据
   * @returns 是否验证通过
   */
  verifySignature(data: string, signature: string): boolean {
    try {
      const buffer = Buffer.from(signature, 'base64');
      return crypto.verify(
        'sha256',
        Buffer.from(data, 'utf8'),
        this.keyPair.publicKey,
        buffer,
      );
    } catch (error) {
      console.error('Signature verification failed:', error.message);
      return false;
    }
  }
}
