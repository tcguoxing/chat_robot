import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthService } from '../auth/auth.service';
import {
  RegisterUserDto,
  LoginUserDto,
  UpdateUserDto,
  UserResponseDto,
  LoginResponseDto,
} from './user.dto';
import { AuthGuard } from '../auth/auth.guard';
import { UserDocument } from './user.schema';

/**
 * 用户控制器
 * 处理用户相关的HTTP请求
 */
@Controller('users')
export class UserController {
  /**
   * 构造函数
   * @param userService 用户服务
   * @param authService 认证服务
   */
  constructor(
    private userService: UserService,
    private authService: AuthService,
  ) {}

  /**
   * 用户注册接口
   * @description 使用邀请码注册新用户
   * @param registerDto 注册请求数据
   * @returns 注册成功的用户信息
   */
  @Post('register')
  async register(
    @Body() registerDto: RegisterUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.userService.register(registerDto);
    return this.transformUserResponse(user);
  }

  /**
   * 用户登录接口（用户名/邮箱+密码）
   * @description 使用用户名或邮箱和密码登录系统
   * @param loginDto 登录请求数据
   * @returns JWT令牌和用户信息
   */
  @Post('login')
  async login(@Body() loginDto: LoginUserDto): Promise<LoginResponseDto> {
    const user = await this.authService.validateUserByUsername(
      loginDto.username,
      loginDto.password,
    );
    // 生成JWT令牌
    const token = await this.authService.generateToken(user);
    return {
      accessToken: token,
      user: this.transformUserResponse(user),
    };
  }

  /**
   * 获取所有用户接口
   * @description 需要JWT授权，返回系统中所有用户信息
   * @returns 用户列表
   */
  @UseGuards(AuthGuard) // JWT认证守卫
  @Get()
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userService.findAll();
    return users.map((user) => this.transformUserResponse(user));
  }

  /**
   * 获取单个用户接口
   * @description 需要JWT授权，根据ID获取用户信息
   * @param id 用户ID
   * @returns 单个用户信息
   */
  @UseGuards(AuthGuard) // JWT认证守卫
  @Get(':id')
  async findById(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.userService.findById(id);
    return this.transformUserResponse(user);
  }

  /**
   * 获取当前登录用户接口
   * @description 需要JWT授权，返回当前登录用户的详细信息
   * @param req 请求对象，包含认证后的用户信息
   * @returns 当前登录用户信息
   */
  @UseGuards(AuthGuard) // JWT认证守卫
  @Get('me')
  getCurrentUser(@Request() req: { user: UserDocument }): UserResponseDto {
    const user = this.userService.getCurrentUser(req.user);
    return this.transformUserResponse(user);
  }

  /**
   * 更新用户信息接口
   * @description 需要JWT授权，根据ID更新用户信息
   * @param id 用户ID
   * @param updateDto 更新请求数据
   * @returns 更新后的用户信息
   */
  @UseGuards(AuthGuard) // JWT认证守卫
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.userService.update(id, updateDto);
    return this.transformUserResponse(user);
  }

  /**
   * 删除用户接口
   * @description 需要JWT授权，根据ID删除用户
   * @param id 用户ID
   * @returns 删除成功消息
   */
  @UseGuards(AuthGuard) // JWT认证守卫
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.userService.remove(id);
    return { message: '用户删除成功' };
  }

  /**
   * 转换用户响应格式
   * @description 将Mongoose文档转换为前端需要的DTO格式
   * @param user Mongoose用户文档
   * @returns 格式化后的用户响应数据
   */
  private transformUserResponse(user: UserDocument): UserResponseDto {
    return {
      id: user._id.toString(), // 转换ObjectId为字符串
      username: user.username,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
