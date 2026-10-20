import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, CancelTokenSource, InternalAxiosRequestConfig, AxiosHeaders } from 'axios';
import { ElMessage } from 'element-plus';
import router from '../router';

// 定义API响应类型
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

// 定义请求配置类型，扩展InternalAxiosRequestConfig
export interface RequestConfig extends InternalAxiosRequestConfig {
  showLoading?: boolean;
  showError?: boolean;
}

// 定义请求工具类
class Request {
  private instance: AxiosInstance;
  private cancelTokens: Map<string, CancelTokenSource> = new Map();

  constructor() {
    // 创建axios实例
    console.log('import.meta.env.VITE_API_BASE_URL: ', import.meta.env.VITE_API_BASE_URL);
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || '/dev',
      timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '120000'),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 初始化拦截器
    this.initInterceptors();
  }

  // 初始化拦截器
  private initInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // 添加认证信息
        const token = localStorage.getItem('chatToken');
        if (token) {
          if (!config.headers) {
            config.headers = {} as AxiosHeaders;
          }
          config.headers['Authorization'] = `Bearer ${token}`;
        }

        // 生成请求key，用于取消请求
        const requestKey = this.generateRequestKey(config);
        // 取消之前的同key请求
        this.cancelRequest(requestKey);
        // 创建新的取消令牌
        const source = axios.CancelToken.source();
        config.cancelToken = source.token;
        // 存储取消令牌
        this.cancelTokens.set(requestKey, source);

        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        // 移除已完成请求的取消令牌
        const requestKey = this.generateRequestKey(response.config);
        this.cancelTokens.delete(requestKey);

        const { data } = response;
        
        // 统一处理业务错误
        if (data.code !== 200) {
          ElMessage.error(data.message || '请求失败');
          return Promise.reject(new Error(data.message || '请求失败'));
        }

        // Return the full AxiosResponse to satisfy type requirements
        return response;
      },
      (error: AxiosError<ApiResponse>) => {
        // 移除已完成请求的取消令牌
        if (error.config) {
          const requestKey = this.generateRequestKey(error.config);
          this.cancelTokens.delete(requestKey);
        }

        // 统一处理网络错误
        if (axios.isCancel(error)) {
          console.log('Request canceled:', error.message);
          return Promise.reject(error);
        }

        let errorMessage = '网络请求失败，请稍后重试';
        if (error.response) {
          // 服务器返回错误状态码
          const status = error.response.status;
          switch (status) {
            case 400:
              errorMessage = '请求参数错误';
              break;
            case 401:
              errorMessage = '未授权，请重新登录';
              // 清除 token 并跳转到登录页
              localStorage.removeItem('chatToken');
              router.replace('/');
              break;
            case 403:
              errorMessage = '拒绝访问';
              break;
            case 404:
              errorMessage = '请求地址不存在';
              break;
            case 500:
              errorMessage = '服务器内部错误';
              break;
            case 502:
              errorMessage = '网关错误';
              break;
            case 503:
              errorMessage = '服务不可用';
              break;
            case 504:
              errorMessage = '网关超时';
              break;
            default:
              errorMessage = error.response.data?.message || `请求失败 (${status})`;
          }
        } else if (error.request) {
          // 请求已发出，但没有收到响应
          errorMessage = '服务器无响应，请检查网络连接';
        } else {
          // 请求配置错误
          errorMessage = error.message;
        }

        ElMessage.error(errorMessage);
        return Promise.reject(error);
      }
    );
  }

  // 生成请求key，用于标识请求
  private generateRequestKey(config: AxiosRequestConfig): string {
    const { method, url, params, data } = config;
    return [
      method,
      url,
      JSON.stringify(params),
      JSON.stringify(data),
    ].join('&');
  }

  // 取消指定key的请求
  public cancelRequest(key: string): void {
    if (this.cancelTokens.has(key)) {
      const source = this.cancelTokens.get(key);
      if (source) {
        source.cancel(`Request canceled by key: ${key}`);
        this.cancelTokens.delete(key);
      }
    }
  }

  // 取消所有请求
  public cancelAllRequests(): void {
    this.cancelTokens.forEach((source) => {
      source.cancel('All requests canceled');
    });
    this.cancelTokens.clear();
  }

  // GET请求
  public get<T = any>(url: string, params?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.instance.get(url, { params, ...config })
      .then(response => response.data as ApiResponse<T>);
  }

  // POST请求
  public post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.instance.post(url, data, config)
      .then(response => response.data as ApiResponse<T>);
  }

  // PUT请求
  public put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.instance.put(url, data, config)
      .then(response => response.data as ApiResponse<T>);
  }

  // DELETE请求
  public delete<T = any>(url: string, params?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.instance.delete(url, { params, ...config })
      .then(response => response.data as ApiResponse<T>);
  }

  // PATCH请求
  public patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.instance.patch(url, data, config)
      .then(response => response.data as ApiResponse<T>);
  }

  // 上传文件
  public upload<T = any>(url: string, file: File, config?: RequestConfig): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    // 注意：axios 1.x 的 post 默认会补 x-www-form-urlencoded，
    // 上传文件场景建议直接用 fetch + FormData（见 api/ai.ts）。
    return this.instance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...config,
    }).then(response => response.data as ApiResponse<T>);
  }

  // 获取axios实例，用于特殊需求
  public getInstance(): AxiosInstance {
    return this.instance;
  }

  // 更新基础URL
  public updateBaseURL(baseURL: string): void {
    this.instance.defaults.baseURL = baseURL;
  }

  // 更新超时时间
  public updateTimeout(timeout: number): void {
    this.instance.defaults.timeout = timeout;
  }
}

// 创建请求实例
const request = new Request();

// 导出请求实例和类型
export default request;
