import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { RegisterUserDto, UpdateUserDto } from './user.dto';
import { AuthService } from '../auth/auth.service';
import { InviteCodeService } from '../invite-codes/invite-code.service';
import { CryptoService } from '../crypto/crypto.service';

/**
 * 用户服务
 * 实现用户相关的业务逻辑
 */
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  /**
   * 构造函数
   * @param userModel 用户数据模型
   * @param authService 认证服务
   * @param inviteCodeService 邀请码服务
   * @param cryptoService 加密服务
   */
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private authService: AuthService,
    private inviteCodeService: InviteCodeService,
    private cryptoService: CryptoService,
  ) {}

  /**
   * 用户注册业务逻辑
   * @description 处理用户注册流程，包括邀请码验证、数据校验、密码加密等
   * @param registerDto 注册请求数据
   * @returns 注册成功的用户文档
   * @throws ConflictException 用户名/邮箱/手机号已存在
   * @throws NotFoundException 邀请码无效
   */
  async register(registerDto: RegisterUserDto): Promise<UserDocument> {
    this.logger.log(`Registering user: ${registerDto.username}`);

    // 1. 验证邀请码有效性
    await this.inviteCodeService.validateInviteCode(registerDto.inviteCode);

    // 2. 检查用户名、邮箱、手机号是否已被注册
    const existingUser = await this.userModel
      .findOne({
        $or: [
          { username: registerDto.username },
          { email: registerDto.email },
          { phone: registerDto.phone },
        ],
      })
      .exec();

    // 3. 处理重复数据情况
    if (existingUser) {
      this.logger.warn(
        `Registration failed: User already exists - ${registerDto.username}`,
      );

      if (existingUser.username === registerDto.username) {
        throw new ConflictException('用户名已存在');
      } else if (existingUser.email === registerDto.email) {
        throw new ConflictException('邮箱已存在');
      } else {
        throw new ConflictException('手机号已存在');
      }
    }

    try {
      // 4. 解密RSA加密的密码
      const decryptedPassword = this.cryptoService.decrypt(
        registerDto.password,
      );

      // 5. 对解密后的明文密码进行哈希处理
      const hashedPassword =
        await this.authService.hashPassword(decryptedPassword);

      // 6. 创建新用户
      const user = new this.userModel({
        username: registerDto.username,
        email: registerDto.email,
        phone: registerDto.phone,
        password: hashedPassword,
      });

      // 7. 保存用户到数据库
      const savedUser = await user.save();

      // 8. 标记邀请码为已使用（确保在用户保存成功后执行）
      try {
        await this.inviteCodeService.useInviteCode(
          registerDto.inviteCode,
          savedUser._id,
        );
      } catch (error) {
        // 如果邀请码更新失败，删除已创建的用户以保持数据一致性
        await this.userModel.findByIdAndDelete(savedUser._id).exec();
        this.logger.error(
          `Invite code usage failed for user ${savedUser.username}: ${error.message}`,
        );
        throw new Error(`邀请码使用失败: ${error.message}`);
      }

      this.logger.log(`User registered successfully: ${savedUser.username}`);
      return savedUser;
    } catch (error) {
      this.logger.error(
        `Registration failed for user ${registerDto.username}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * 获取所有用户
   * @description 查询系统中的所有用户
   * @returns 用户文档列表
   */
  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().exec();
  }

  /**
   * 根据ID获取用户
   * @description 根据用户ID查询单个用户
   * @param id 用户ID
   * @returns 用户文档
   * @throws NotFoundException 用户不存在
   */
  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  /**
   * 根据邮箱获取用户
   * @description 根据邮箱地址查询用户
   * @param email 邮箱地址
   * @returns 用户文档
   * @throws NotFoundException 用户不存在
   */
  async findByEmail(email: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  /**
   * 根据手机号获取用户
   * @description 根据手机号查询用户
   * @param phone 手机号
   * @returns 用户文档
   * @throws NotFoundException 用户不存在
   */
  async findByPhone(phone: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ phone }).exec();
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  /**
   * 更新用户信息
   * @description 根据ID更新用户信息，包括数据校验和密码加密
   * @param id 用户ID
   * @param updateDto 更新请求数据
   * @returns 更新后的用户文档
   * @throws ConflictException 用户名/邮箱/手机号已被其他用户使用
   * @throws NotFoundException 用户不存在
   */
  async update(id: string, updateDto: UpdateUserDto): Promise<UserDocument> {
    // 1. 检查更新的字段是否已被其他用户使用
    if (updateDto.username || updateDto.email || updateDto.phone) {
      const query: any = { _id: { $ne: id } }; // 排除当前用户
      const orConditions: any[] = [];

      if (updateDto.username) {
        orConditions.push({ username: updateDto.username });
      }
      if (updateDto.email) {
        orConditions.push({ email: updateDto.email });
      }
      if (updateDto.phone) {
        orConditions.push({ phone: updateDto.phone });
      }

      query.$or = orConditions;
      const existingUser = await this.userModel.findOne(query).exec();

      if (existingUser) {
        throw new ConflictException('用户名、邮箱或手机号已存在');
      }
    }

    // 2. 如果更新密码，先解密再重新加密
    if (updateDto.password) {
      const decryptedPassword = this.cryptoService.decrypt(updateDto.password);
      updateDto.password =
        await this.authService.hashPassword(decryptedPassword);
    }

    // 3. 执行更新操作
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        id,
        updateDto,
        { new: true }, // 返回更新后的文档
      )
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('用户不存在');
    }

    return updatedUser;
  }

  /**
   * 删除用户
   * @description 根据ID删除用户
   * @param id 用户ID
   * @throws NotFoundException 用户不存在
   */
  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('用户不存在');
    }
  }

  /**
   * 获取当前登录用户信息
   * @description 返回认证后的用户信息
   * @param user 认证后的用户文档
   * @returns 用户文档
   */
  async getCurrentUser(user: UserDocument): Promise<UserDocument> {
    return user;
  }
}
