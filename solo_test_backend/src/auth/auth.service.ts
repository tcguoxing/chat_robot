import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/user.schema';
import * as bcrypt from 'bcryptjs';
import { CryptoService } from '../crypto/crypto.service';

/**
 * 认证服务
 * 处理用户认证相关的业务逻辑
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  /**
   * 构造函数
   * @param userModel 用户数据模型
   * @param jwtService JWT服务
   * @param cryptoService 加密服务
   */
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private cryptoService: CryptoService,
  ) {}

  /**
   * 验证用户凭证（用户名+密码）
   * @description 检查用户名和密码是否匹配，验证用户身份
   * @param username 用户名
   * @param encryptedPassword 加密的密码
   * @returns 验证通过的用户文档
   * @throws UnauthorizedException 用户名或密码错误
   */
  async validateUserByUsername(
    username: string,
    encryptedPassword: string,
  ): Promise<UserDocument> {
    this.logger.log(`Validating user by username: ${username}`);

    // 1. 根据用户名查找用户
    const user = await this.userModel.findOne({ username }).exec();
    if (!user) {
      this.logger.warn(`User not found: ${username}`);
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 2. 解密RSA加密的密码
    const password = this.cryptoService.decrypt(encryptedPassword);
    console.log(`52 Decrypted password: ${password}`);

    // 3. 比较密码（bcrypt验证）
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Invalid password for user: ${username}`);
      throw new UnauthorizedException('用户名或密码错误');
    }

    this.logger.log(`User validated successfully: ${username}`);
    return user;
  }

  /**
   * 验证用户凭证（邮箱/用户名+密码）
   * @description 检查邮箱或用户名和密码是否匹配，验证用户身份
   * @param emailOrUsername 邮箱地址或用户名
   * @param encryptedPassword 加密的密码
   * @returns 验证通过的用户文档
   * @throws UnauthorizedException 邮箱/用户名或密码错误
   */
  async validateUser(
    emailOrUsername: string,
    encryptedPassword: string,
  ): Promise<UserDocument> {
    // 1. 根据邮箱或用户名查找用户
    const user = await this.userModel
      .findOne({
        $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
      })
      .exec();
    if (!user) {
      throw new UnauthorizedException('邮箱/用户名或密码错误');
    }

    // 2. 解密RSA加密的密码
    const password = this.cryptoService.decrypt(encryptedPassword);
    // console.log(`89 Decrypted password: ${password}`);
    // console.log(`89 Decrypted password: ${user.password}`);

    // 3. 比较密码（bcrypt验证）
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱/用户名或密码错误');
    }

    return user;
  }

  /**
   * 验证用户凭证（手机号+密码）
   * @description 检查手机号和密码是否匹配，验证用户身份
   * @param phone 手机号
   * @param encryptedPassword 加密的密码
   * @returns 验证通过的用户文档
   * @throws UnauthorizedException 手机号或密码错误
   */
  async validateUserByPhone(
    phone: string,
    encryptedPassword: string,
  ): Promise<UserDocument> {
    // 1. 根据手机号查找用户
    const user = await this.userModel.findOne({ phone }).exec();
    if (!user) {
      throw new UnauthorizedException('手机号或密码错误');
    }

    // 2. 解密RSA加密的密码
    const password = this.cryptoService.decrypt(encryptedPassword);
    console.log(`120 Decrypted password: ${password}`);

    // 3. 比较密码（bcrypt验证）
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('手机号或密码错误');
    }

    return user;
  }

  /**
   * 生成JWT令牌
   * @description 为验证通过的用户生成JWT访问令牌
   * @param user 用户文档
   * @returns JWT令牌
   */
  async generateToken(user: UserDocument): Promise<string> {
    this.logger.log(`Generating JWT token for user: ${user.username}`);

    // JWT载荷，包含用户标识和角色信息
    const payload = {
      username: user.username,
      sub: user._id.toString(), // 用作用户唯一标识
      role: user.role, // 用户角色
    };

    // 生成JWT令牌
    const token = await this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '3600s', // 令牌过期时间
    } as any);

    this.logger.log(
      `JWT token generated successfully for user: ${user.username}`,
    );
    return token;
  }

  /**
   * 加密密码
   * @description 使用bcrypt算法对密码进行加密
   * @param password 原始密码
   * @returns 加密后的密码
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10; // bcrypt盐值轮数，越高越安全但越慢
    return bcrypt.hash(password, saltRounds);
  }
}
