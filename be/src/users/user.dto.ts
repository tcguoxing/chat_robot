import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

/**
 * 用户注册DTO
 * 定义用户注册请求的数据结构
 */
export class RegisterUserDto {
  /**
   * 用户名
   * @example "testuser"
   */
  @IsString()
  @MinLength(3, { message: '用户名长度不能少于3个字符' })
  @MaxLength(20, { message: '用户名长度不能超过20个字符' })
  username: string;

  /**
   * 密码（RSA加密后的字符串）
   * @example "base64_encrypted_password"
   */
  @IsString()
  password: string;

  /**
   * 邀请码
   * @example "ABCDEFGHIJKLMNOP"
   */
  @IsString()
  @MinLength(16, { message: '邀请码长度必须为16个字符' })
  @MaxLength(16, { message: '邀请码长度必须为16个字符' })
  inviteCode: string;
}

/**
 * 用户登录DTO（用户名+密码）
 */
export class LoginUserDto {
  /**
   * 用户名
   * @example "testuser"
   */
  @IsString()
  username: string;

  /**
   * 密码
   * @example "password123"
   */
  @IsString()
  password: string;
}

/**
 * 用户更新DTO
 * 定义用户信息更新请求的数据结构
 */
export class UpdateUserDto {
  /**
   * 用户名
   * @example "newname"
   */
  @IsOptional()
  @IsString()
  @MinLength(3, { message: '用户名长度不能少于3个字符' })
  @MaxLength(20, { message: '用户名长度不能超过20个字符' })
  username?: string;

  /**
   * 密码
   * @example "newpassword123"
   */
  @IsOptional()
  @IsString()
  @MinLength(6, { message: '密码长度不能少于6个字符' })
  password?: string;

  /**
   * 用户状态
   * @example true
   */
  @IsOptional()
  isActive?: boolean;
}

/**
 * 用户响应DTO
 * 定义用户信息响应的数据结构
 */
export class UserResponseDto {
  /**
   * 用户ID
   * @example "60d0fe4f5311236168a109ca"
   */
  id: string;

  /**
   * 用户名
   * @example "testuser"
   */
  username: string;

  /**
   * 用户状态
   * @example true
   */
  isActive: boolean;

  /**
   * 创建时间
   * @example "2023-06-23T10:15:30.000Z"
   */
  createdAt: Date;

  /**
   * 更新时间
   * @example "2023-06-23T10:15:30.000Z"
   */
  updatedAt: Date;
}

/**
 * 登录响应DTO
 * 定义登录成功响应的数据结构
 */
export class LoginResponseDto {
  /**
   * JWT访问令牌
   * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   */
  accessToken: string;

  /**
   * 用户信息
   */
  user: UserResponseDto;
}
