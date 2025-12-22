// 导入请求工具和类型
import request from './request';
import type { ApiResponse } from './request';

// 用户响应数据类型（对应swagger UserResponseDto）
export interface UserResponseDto {
  id: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 公钥响应数据类型
export interface PublicKeyResponse {
  publicKey: string;
}

// 登录请求参数类型（对应swagger LoginUserDto）
export interface LoginRequest {
  email?: string;
  username: string;
  password?: string;
  encryptedPassword?: string;
}

// 手机号登录请求参数类型（对应swagger LoginWithPhoneDto）
export interface LoginWithPhoneRequest {
  phone: string;
  password: string;
}

// 登录响应数据类型（对应swagger LoginResponse）
export interface LoginResponse {
  code: number;
  message: string;
  data: {
    accessToken: string;
    user: UserResponseDto;
  };
}

// 注册请求参数类型（对应swagger RegisterUserDto）
export interface RegisterRequest {
  username: string;
  email: string;
  phone: string;
  password: string;
  inviteCode: string;
}

// 更新用户请求参数类型（对应swagger UpdateUserDto）
export interface UpdateUserRequest {
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: 'user' | 'admin';
  isActive?: boolean;
}

// 用户信息类型（用于前端展示）
export interface UserInfo {
  id: string;
  username: string;
  avatar?: string;
  isFollowing?: boolean;
  followerCount?: number;
}

// 内容项类型
export interface ContentItem {
  id: number;
  userId: string;
  username: string;
  avatar: string;
  content: string;
  imageUrl: string;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
  isLiked?: boolean;
}

// 访客信息类型
export interface VisitorInfo {
  id: string;
  username: string;
  avatar: string;
  visitedAt: string;
}

// 上传请求类型
export interface UploadRequest {
  file: File;
  caption: string;
  tags?: string[];
}

/**
 * 登录接口（使用邮箱和密码）
 * @param params 登录请求参数
 * @returns 登录响应数据
 */
export const loginApi = async (params: LoginRequest): Promise<ApiResponse<LoginResponse['data']>> => {
  return request.post<LoginResponse['data']>('/users/login', params);
};

/**
 * 登录接口（使用手机号和密码）
 * @param params 登录请求参数
 * @returns 登录响应数据
 */
export const loginWithPhoneApi = async (params: LoginWithPhoneRequest): Promise<ApiResponse<LoginResponse['data']>> => {
  return request.post<LoginResponse['data']>('/users/login/phone', params);
};

/**
 * 获取公钥接口
 * @returns 公钥响应数据
 */
export const getPublicKeyApi = async (): Promise<ApiResponse<PublicKeyResponse>> => {
  return request.get<PublicKeyResponse>('/auth/public-key');
};

/**
 * 注册接口
 * @param params 注册请求参数
 * @returns 注册响应数据
 */
export const registerApi = async (params: RegisterRequest): Promise<ApiResponse<void>> => {
  return request.post<void>('/users/register', params);
};

/**
 * 获取当前登录用户信息
 * @returns 当前用户信息
 */
export const getCurrentUserApi = async (): Promise<ApiResponse<UserResponseDto>> => {
  return request.get<UserResponseDto>('/users/me');
};

/**
 * 获取所有用户列表
 * @returns 用户列表
 */
export const getOtherUsersApi = async (): Promise<ApiResponse<UserResponseDto[]>> => {
  return request.get<UserResponseDto[]>('/users');
};

/**
 * 根据ID获取用户信息
 * @param id 用户ID
 * @returns 用户信息
 */
export const getUserByIdApi = async (id: string): Promise<ApiResponse<UserResponseDto>> => {
  return request.get<UserResponseDto>(`/users/${id}`);
};

/**
 * 更新用户信息
 * @param id 用户ID
 * @param params 更新用户请求参数
 * @returns 更新结果
 */
export const updateUserApi = async (id: string, params: UpdateUserRequest): Promise<ApiResponse<void>> => {
  return request.put<void>(`/users/${id}`, params);
};

/**
 * 删除用户
 * @param id 用户ID
 * @returns 删除结果
 */
export const deleteUserApi = async (id: string): Promise<ApiResponse<void>> => {
  return request.delete<void>(`/users/${id}`);
};

/**
 * 获取内容列表接口
 * @returns 内容列表
 * @todo 后端接口未提供，待实现
 */
export const getContentApi = async (): Promise<ApiResponse<ContentItem[]>> => {
  // 注意：swagger.json中未定义内容相关接口，此处返回空数组
  // 实际项目中需根据后端提供的接口更新
  return Promise.resolve({
    code: 200,
    message: '获取成功',
    data: []
  });
};

/**
 * 获取最近访客列表接口
 * @returns 最近访客列表
 * @todo 后端接口未提供，待实现
 */
export const getRecentVisitorsApi = async (): Promise<ApiResponse<VisitorInfo[]>> => {
  // 注意：swagger.json中未定义访客相关接口，此处返回空数组
  // 实际项目中需根据后端提供的接口更新
  return Promise.resolve({
    code: 200,
    message: '获取成功',
    data: []
  });
};

/**
 * 上传内容接口
 * @param params 上传请求参数
 * @returns 上传结果
 * @todo 后端接口未提供，待实现
 */
export const uploadContentApi = async (params: UploadRequest): Promise<ApiResponse<{ contentId: number }>> => {
  // 注意：swagger.json中未定义内容上传接口，此处模拟返回
  // 实际项目中需根据后端提供的接口更新
  const formData = new FormData();
  formData.append('file', params.file);
  formData.append('caption', params.caption);
  if (params.tags && params.tags.length > 0) {
    formData.append('tags', JSON.stringify(params.tags));
  }
  
  // 实际项目中应使用真实接口地址
  // return request.post<{ contentId: number }>('/content/upload', formData, {
  //   headers: {
  //     'Content-Type': 'multipart/form-data',
  //   },
  // });
  
  // 模拟返回结果
  return Promise.resolve({
    code: 200,
    message: '上传成功',
    data: { contentId: Math.floor(Math.random() * 1000) + 1 }
  });
};