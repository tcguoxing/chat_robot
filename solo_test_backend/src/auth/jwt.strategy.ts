import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/user.schema';

/**
 * JWT认证策略
 * 负责验证JWT令牌并提取用户信息
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * 构造函数
   * @param userModel 用户数据模型
   */
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // 从请求头的Authorization Bearer中提取JWT
      ignoreExpiration: false, // 不忽略过期时间，过期令牌将被拒绝
      secretOrKey: process.env.JWT_SECRET as string, // JWT签名密钥
    });
  }

  /**
   * 验证JWT令牌
   * @description 解码JWT令牌后，验证用户是否存在且活跃
   * @param payload JWT载荷，包含用户标识等信息
   * @returns 验证通过的用户文档
   * @throws UnauthorizedException 无效的令牌或用户已被禁用
   */
  async validate(payload: any): Promise<UserDocument> {
    // 1. 根据JWT中的用户ID查找用户
    const user = await this.userModel.findById(payload.sub).exec();

    // 2. 检查用户是否存在且活跃
    if (!user || !user.isActive) {
      throw new UnauthorizedException('无效的令牌或用户已被禁用');
    }

    // 3. 返回用户文档，将被注入到请求对象中
    return user;
  }
}
