import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let code: number;

    if (exception instanceof HttpException) {
      // 处理NestJS内置的HttpException
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        message = (exceptionResponse as any).message || exception.message;
      } else {
        message = exception.message;
      }
      code = status;
    } else {
      // 处理其他类型的异常
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '服务器内部错误';
      code = 500;
      console.error('未捕获的异常:', exception);
    }

    // 针对特定错误类型进行更详细的处理
    if (status === HttpStatus.UNAUTHORIZED) {
      message = '认证失败，请检查您的凭证';
    } else if (status === HttpStatus.FORBIDDEN) {
      message = '您没有权限执行此操作';
    } else if (status === HttpStatus.NOT_FOUND) {
      message = '请求的资源不存在';
    } else if (status === HttpStatus.CONFLICT) {
      // 资源冲突，如重复创建
    } else if (status === HttpStatus.BAD_REQUEST) {
      // 请求参数错误，如验证失败
    }

    // 返回标准化的错误响应
    response.status(status).json({
      code,
      message,
      data: null,
    });
  }
}
